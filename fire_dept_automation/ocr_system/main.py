# -*- coding: utf-8 -*-
"""
OCR 文件比對系統 - 主程式
整合所有模組：傾斜校正 → PaddleOCR → LLM 校正 → 智慧比對 → 差異報告
"""

import os
import sys
import json
import argparse
from pathlib import Path
from typing import List, Dict, Optional, Union
from datetime import datetime

# 本地模組
from deskew import preprocess_for_ocr
from paddle_ocr import ocr_to_structured, get_ocr_engine
from llm_corrector import correct_ocr_text, extract_structured_data, check_ollama_available, LLMConfig
from compare import compare_documents, load_reference_from_excel, load_reference_from_json
from report import create_comparison_report, create_simple_report

# PDF 處理
try:
    import fitz  # PyMuPDF
    HAS_PYMUPDF = True
except ImportError:
    HAS_PYMUPDF = False

# 圖片處理
import cv2
import numpy as np


class OCRComparisonSystem:
    """OCR 文件比對系統"""
    
    def __init__(self, 
                 use_gpu: bool = True,
                 use_llm: bool = True,
                 llm_config: Optional[LLMConfig] = None,
                 dpi: int = 300):
        """
        初始化系統
        
        Args:
            use_gpu: 是否使用 GPU
            use_llm: 是否使用 LLM 校正
            llm_config: LLM 配置
            dpi: PDF 轉圖片的解析度
        """
        self.use_gpu = use_gpu
        self.use_llm = use_llm and check_ollama_available(llm_config)
        self.llm_config = llm_config
        self.dpi = dpi
        
        print(f"[系統初始化]")
        print(f"  GPU 加速: {use_gpu}")
        print(f"  LLM 校正: {self.use_llm}")
        print(f"  PDF 解析度: {dpi} DPI")
    
    def pdf_to_images(self, pdf_path: str) -> List[np.ndarray]:
        """
        將 PDF 轉換為圖片列表
        
        Args:
            pdf_path: PDF 檔案路徑
        
        Returns:
            圖片列表 (numpy arrays)
        """
        if not HAS_PYMUPDF:
            raise ImportError("請安裝 PyMuPDF: pip install PyMuPDF")
        
        pdf_doc = fitz.open(pdf_path)
        images = []
        
        zoom = self.dpi / 72
        matrix = fitz.Matrix(zoom, zoom)
        
        for page_num in range(len(pdf_doc)):
            page = pdf_doc[page_num]
            pix = page.get_pixmap(matrix=matrix)
            
            # 轉換為 numpy array (BGR 格式給 OpenCV)
            img_array = np.frombuffer(pix.samples, dtype=np.uint8)
            img_array = img_array.reshape(pix.height, pix.width, pix.n)
            
            if pix.n == 4:  # RGBA
                img_array = cv2.cvtColor(img_array, cv2.COLOR_RGBA2BGR)
            elif pix.n == 3:  # RGB
                img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
            
            images.append(img_array)
        
        pdf_doc.close()
        return images
    
    def process_image(self, image: Union[str, np.ndarray],
                     do_deskew: bool = False,  # 預設關閉預處理
                     do_enhance: bool = False,
                     document_context: str = "") -> Dict:
        """
        處理單張圖片
        """
        result = {
            "preprocessing": {},
            "ocr_result": {},
            "corrected_text": "",
            "structured_data": {}
        }
        
        # 1. 處理輸入
        if isinstance(image, str):
            img = cv2.imread(image)
            if img is None:
                raise ValueError(f"無法讀取圖片: {image}")
        else:
            img = image.copy()
        
        # 2. 預處理 (可選)
        if do_deskew or do_enhance:
            processed_img, preprocess_info = preprocess_for_ocr(
                img, 
                do_deskew=do_deskew, 
                do_enhance=do_enhance
            )
            result["preprocessing"] = preprocess_info
        else:
            processed_img = img
            result["preprocessing"] = {"skipped": True}
        
        # 3. OCR 辨識 (直接傳 numpy array)
        ocr_result = ocr_to_structured(processed_img, use_gpu=self.use_gpu)
        result["ocr_result"] = ocr_result
        
        # 4. LLM 校正 (可選)
        if self.use_llm and ocr_result.get("full_text"):
            corrected = correct_ocr_text(
                ocr_result["full_text"],
                context=document_context,
                config=self.llm_config
            )
            result["corrected_text"] = corrected
        else:
            result["corrected_text"] = ocr_result.get("full_text", "")
        
        return result
    
    def process_pdf(self, pdf_path: str,
                   document_context: str = "",
                   progress_callback=None) -> List[Dict]:
        """
        處理 PDF 檔案
        
        Args:
            pdf_path: PDF 檔案路徑
            document_context: 文件類型上下文
            progress_callback: 進度回調函數 (page_num, total_pages)
        
        Returns:
            每頁的處理結果列表
        """
        print(f"正在處理: {pdf_path}")
        
        # 轉換為圖片
        images = self.pdf_to_images(pdf_path)
        total_pages = len(images)
        print(f"共 {total_pages} 頁")
        
        results = []
        for i, img in enumerate(images):
            page_num = i + 1
            print(f"  處理第 {page_num}/{total_pages} 頁...")
            
            if progress_callback:
                progress_callback(page_num, total_pages)
            
            page_result = self.process_image(
                img,
                document_context=document_context
            )
            page_result["page_number"] = page_num
            results.append(page_result)
        
        return results
    
    def extract_and_compare(self,
                           pdf_path: str,
                           reference_data: Dict,
                           fields_to_extract: List[str],
                           fields_to_compare: Optional[List[str]] = None,
                           document_context: str = "") -> Dict:
        """
        完整流程：提取 PDF 資料並與參考資料比對
        
        Args:
            pdf_path: PDF 檔案路徑
            reference_data: 參考資料字典
            fields_to_extract: 需要提取的欄位列表
            fields_to_compare: 需要比對的欄位列表 (預設同 fields_to_extract)
            document_context: 文件類型上下文
        
        Returns:
            比對結果
        """
        # 處理 PDF
        page_results = self.process_pdf(pdf_path, document_context)
        
        # 合併所有頁面的文字
        all_text = "\n\n".join([
            pr.get("corrected_text", "") or pr.get("ocr_result", {}).get("full_text", "")
            for pr in page_results
        ])
        
        # 使用 LLM 提取結構化資料
        if self.use_llm:
            extracted_data = extract_structured_data(
                all_text,
                fields_to_extract,
                config=self.llm_config
            )
        else:
            # 如果沒有 LLM，返回空白結構
            extracted_data = {field: None for field in fields_to_extract}
        
        # 比對
        if fields_to_compare is None:
            fields_to_compare = fields_to_extract
        
        comparison = compare_documents(
            extracted_data,
            reference_data,
            fields_to_compare,
            document_id=Path(pdf_path).stem
        )
        
        return {
            "pdf_path": pdf_path,
            "page_count": len(page_results),
            "extracted_data": extracted_data,
            "comparison": comparison.to_dict()
        }


def main():
    """命令列主程式"""
    parser = argparse.ArgumentParser(
        description="OCR 文件比對系統",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
範例用法:
  # 處理 PDF 並輸出 OCR 結果
  python main.py --input scan.pdf --output result.json
  
  # 與 Excel 參考資料比對
  python main.py --input scan.pdf --reference data.xlsx --key-column 場所編號 --key-value A001
  
  # 生成比對報告
  python main.py --input scan.pdf --reference data.xlsx --report report.docx
        """
    )
    
    parser.add_argument("--input", "-i", required=True, help="輸入 PDF 或圖片檔案")
    parser.add_argument("--output", "-o", help="輸出 JSON 結果檔案")
    parser.add_argument("--reference", "-r", help="參考資料檔案 (Excel 或 JSON)")
    parser.add_argument("--key-column", help="參考資料的 key 欄位名稱")
    parser.add_argument("--key-value", help="要查找的 key 值")
    parser.add_argument("--fields", nargs="+", help="要提取的欄位列表")
    parser.add_argument("--report", help="輸出報告檔案路徑 (.docx 或 .txt)")
    parser.add_argument("--no-gpu", action="store_true", help="停用 GPU")
    parser.add_argument("--no-llm", action="store_true", help="停用 LLM 校正")
    parser.add_argument("--context", default="公文", help="文件類型上下文")
    
    args = parser.parse_args()
    
    # 初始化系統
    system = OCRComparisonSystem(
        use_gpu=not args.no_gpu,
        use_llm=not args.no_llm
    )
    
    input_path = args.input
    
    # 處理檔案
    if input_path.lower().endswith(".pdf"):
        results = system.process_pdf(input_path, document_context=args.context)
    else:
        result = system.process_image(input_path, document_context=args.context)
        results = [result]
    
    # 輸出 OCR 結果
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)
        print(f"OCR 結果已儲存: {args.output}")
    
    # 比對參考資料
    if args.reference and args.key_column and args.key_value:
        if args.reference.endswith(('.xlsx', '.xls')):
            ref_data = load_reference_from_excel(args.reference, args.key_column, args.key_value)
        else:
            ref_data = load_reference_from_json(args.reference, args.key_column, args.key_value)
        
        if ref_data:
            # 合併所有文字
            all_text = "\n".join([
                r.get("corrected_text", "") or r.get("ocr_result", {}).get("full_text", "")
                for r in results
            ])
            
            # 提取並比對
            fields = args.fields or list(ref_data.keys())
            
            if system.use_llm:
                extracted = extract_structured_data(all_text, fields)
                comparison = compare_documents(extracted, ref_data, fields)
                
                print("\n比對結果:")
                print(f"  整體相符: {comparison.overall_match}")
                print(f"  相似度: {comparison.overall_similarity:.1%}")
                print(f"  {comparison.summary}")
                
                # 生成報告
                if args.report:
                    if args.report.endswith('.docx'):
                        create_comparison_report([comparison.to_dict()], args.report)
                    else:
                        create_simple_report([comparison.to_dict()], args.report)
                    print(f"報告已生成: {args.report}")
        else:
            print(f"在參考資料中找不到 {args.key_column}={args.key_value}")
    
    print("\n處理完成！")


if __name__ == "__main__":
    main()
