# -*- coding: utf-8 -*-
"""
PaddleOCR 繁體中文 OCR 模組
使用 PP-OCRv5 進行高精度文字辨識
"""

import os
import sys
from pathlib import Path
from typing import List, Dict, Tuple, Optional, Union
import numpy as np

# 延遲導入 PaddleOCR (避免初始化緩慢)
_ocr_engine = None


def get_ocr_engine(use_gpu: bool = True, lang: str = "chinese_cht"):
    """
    取得或初始化 PaddleOCR 引擎 (單例模式)
    
    Args:
        use_gpu: 是否使用 GPU 加速
        lang: 語言設定 (chinese_cht = 繁體中文)
    
    Returns:
        PaddleOCR 引擎實例
    """
    global _ocr_engine
    
    if _ocr_engine is None:
        try:
            from paddleocr import PaddleOCR
            
            # PP-OCR 配置 (極簡版)
            _ocr_engine = PaddleOCR(lang=lang)
            print(f"[PaddleOCR] 引擎初始化完成 (Lang: {lang})")
        except ImportError:
            print("[錯誤] 請先安裝 PaddleOCR: pip install paddlepaddle paddleocr")
            raise
    
    return _ocr_engine


def ocr_image(image: Union[str, np.ndarray], 
              use_gpu: bool = True,
              return_confidence: bool = True) -> List[Dict]:
    """
    對單張圖片執行 OCR
    
    Args:
        image: 圖片路徑或 numpy 陣列
        use_gpu: 是否使用 GPU
        return_confidence: 是否回傳信心分數
    
    Returns:
        辨識結果列表，每個元素包含:
        - text: 辨識文字
        - bbox: 邊界框座標 [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
        - confidence: 信心分數 (0-1)
    """
    ocr = get_ocr_engine(use_gpu=use_gpu)
    
    # 執行 OCR (新版 API 使用 predict)
    try:
        result = ocr.predict(image)
    except (TypeError, AttributeError):
        result = ocr.ocr(image, cls=True)
    
    if result is None or len(result) == 0:
        return []
    
    # 解析結果 (處理新舊兩種格式)
    parsed_results = []
    
    # 新版 PaddleOCR v3 返回 list[dict] 格式
    if isinstance(result, list) and len(result) > 0 and isinstance(result[0], dict):
        item = result[0]
        texts = item.get('rec_texts', [])
        scores = item.get('rec_scores', [])
        polygons = item.get('det_polygons', [])
        
        for i, text in enumerate(texts):
            parsed_item = {"text": text, "bbox": []}
            
            if i < len(polygons):
                poly = polygons[i]
                parsed_item["bbox"] = poly.tolist() if hasattr(poly, 'tolist') else list(poly)
            
            if return_confidence and i < len(scores):
                parsed_item["confidence"] = float(scores[i])
            else:
                parsed_item["confidence"] = 1.0
            
            parsed_results.append(parsed_item)
    
    # 舊版格式 list[list]
    elif isinstance(result, list) and len(result) > 0 and isinstance(result[0], list):
        data = result[0] if result[0] else []
        for line in data:
            if len(line) >= 2:
                bbox = line[0]
                text = line[1][0]
                confidence = line[1][1]
                
                parsed_item = {"text": text, "bbox": bbox}
                if return_confidence:
                    parsed_item["confidence"] = confidence
                parsed_results.append(parsed_item)
    
    return parsed_results


def ocr_to_text(image: Union[str, np.ndarray],
                use_gpu: bool = True,
                min_confidence: float = 0.5,
                preserve_layout: bool = True) -> str:
    """
    對圖片執行 OCR 並轉換為純文字
    
    Args:
        image: 圖片路徑或 numpy 陣列
        use_gpu: 是否使用 GPU
        min_confidence: 最低信心閾值
        preserve_layout: 是否保留排版 (基於 Y 座標分行)
    
    Returns:
        辨識出的文字內容
    """
    results = ocr_image(image, use_gpu=use_gpu, return_confidence=True)
    
    if not results:
        return ""
    
    # 過濾低信心結果
    filtered = [r for r in results if r.get("confidence", 1.0) >= min_confidence]
    
    if not preserve_layout:
        # 直接串接
        return " ".join([r["text"] for r in filtered])
    
    # 按 Y 座標分組 (同一行)
    def get_y_center(item):
        bbox = item.get("bbox", [])
        if not bbox:
            return 0
        # 處理不同 bbox 格式
        if isinstance(bbox, (list, tuple)) and len(bbox) >= 4:
            if isinstance(bbox[0], (list, tuple)):
                # 格式: [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
                return (bbox[0][1] + bbox[2][1]) / 2
            else:
                # 格式: [x1, y1, x2, y2, ...] 平面陣列
                return (bbox[1] + bbox[5]) / 2 if len(bbox) >= 6 else bbox[1]
        return 0
    
    def get_x_start(item):
        bbox = item.get("bbox", [])
        if not bbox:
            return 0
        if isinstance(bbox, (list, tuple)) and len(bbox) > 0:
            if isinstance(bbox[0], (list, tuple)):
                return bbox[0][0]
            else:
                return bbox[0]
        return 0
    
    # 過濾有效結果
    valid_results = [r for r in filtered if r.get("bbox")]
    
    if not valid_results:
        # 沒有座標資訊，直接串接
        return " ".join([r["text"] for r in filtered])
    
    # 排序：先按 Y (行)，再按 X (列)
    sorted_results = sorted(valid_results, key=lambda x: (get_y_center(x), get_x_start(x)))
    
    # 分行 (Y 座標差距超過閾值則換行)
    lines = []
    current_line = []
    last_y = None
    line_threshold = 20  # 像素閾值
    
    for item in sorted_results:
        y = get_y_center(item)
        
        if last_y is None or abs(y - last_y) <= line_threshold:
            current_line.append(item["text"])
        else:
            if current_line:
                lines.append(" ".join(current_line))
            current_line = [item["text"]]
        
        last_y = y
    
    if current_line:
        lines.append(" ".join(current_line))
    
    return "\n".join(lines)


def ocr_to_structured(image: Union[str, np.ndarray],
                      use_gpu: bool = True) -> Dict:
    """
    對圖片執行 OCR 並回傳結構化資料
    
    Args:
        image: 圖片路徑或 numpy 陣列
        use_gpu: 是否使用 GPU
    
    Returns:
        結構化資料字典
    """
    results = ocr_image(image, use_gpu=use_gpu, return_confidence=True)
    
    if not results:
        return {
            "full_text": "",
            "lines": [],
            "raw_results": [],
            "statistics": {"total_items": 0, "avg_confidence": 0}
        }
    
    # 直接從結果提取文字
    texts = [r.get("text", "") for r in results]
    full_text = " ".join(texts)
    
    # 計算統計
    confidences = [r.get("confidence", 1.0) for r in results]
    avg_confidence = sum(confidences) / len(confidences) if confidences else 0
    
    return {
        "full_text": full_text,
        "lines": texts,
        "raw_results": results,
        "statistics": {
            "total_items": len(results),
            "avg_confidence": round(avg_confidence, 4),
            "min_confidence": round(min(confidences), 4) if confidences else 0,
            "max_confidence": round(max(confidences), 4) if confidences else 0,
        }
    }


# 測試用主程式
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python paddle_ocr.py <圖片路徑>")
        print("範例: python paddle_ocr.py scan.png")
        sys.exit(1)
    
    input_path = sys.argv[1]
    
    if not os.path.exists(input_path):
        print(f"找不到檔案: {input_path}")
        sys.exit(1)
    
    print(f"正在辨識: {input_path}")
    print("=" * 50)
    
    # 執行 OCR
    result = ocr_to_structured(input_path, use_gpu=True)
    
    print(f"辨識項目數: {result['statistics']['total_items']}")
    print(f"平均信心分數: {result['statistics']['avg_confidence']:.2%}")
    print("=" * 50)
    print("辨識結果:")
    print(result["full_text"])
