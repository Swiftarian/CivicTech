# -*- coding: utf-8 -*-
"""
資料比對模組 - 智慧比對 OCR 結果與系統資料
支援模糊比對、差異計算、相似度分析
"""

import os
import json
import re
from typing import Dict, List, Tuple, Optional, Any, Union
from dataclasses import dataclass, field
from enum import Enum
from difflib import SequenceMatcher, unified_diff
import unicodedata


class MatchType(Enum):
    """比對結果類型"""
    EXACT = "exact"         # 完全相符
    SIMILAR = "similar"     # 相似 (模糊比對)
    MISMATCH = "mismatch"   # 不符
    MISSING = "missing"     # 缺失
    EXTRA = "extra"         # 多餘


@dataclass
class FieldComparison:
    """單一欄位的比對結果"""
    field_name: str
    ocr_value: Any
    reference_value: Any
    match_type: MatchType
    similarity: float = 0.0
    details: str = ""


@dataclass
class ComparisonResult:
    """完整的比對結果"""
    document_id: str = ""
    overall_match: bool = False
    overall_similarity: float = 0.0
    field_comparisons: List[FieldComparison] = field(default_factory=list)
    summary: str = ""
    
    def to_dict(self) -> Dict:
        """轉換為字典"""
        return {
            "document_id": self.document_id,
            "overall_match": self.overall_match,
            "overall_similarity": round(self.overall_similarity, 4),
            "field_comparisons": [
                {
                    "field_name": fc.field_name,
                    "ocr_value": fc.ocr_value,
                    "reference_value": fc.reference_value,
                    "match_type": fc.match_type.value,
                    "similarity": round(fc.similarity, 4),
                    "details": fc.details
                }
                for fc in self.field_comparisons
            ],
            "summary": self.summary
        }


def normalize_text(text: str) -> str:
    """
    正規化文字以進行比對
    - 移除多餘空白
    - 統一全形/半形
    - 統一大小寫
    """
    if text is None:
        return ""
    
    text = str(text).strip()
    
    # 統一全形轉半形 (數字、英文)
    text = unicodedata.normalize('NFKC', text)
    
    # 移除多餘空白
    text = re.sub(r'\s+', ' ', text)
    
    # 統一常見變體
    replacements = {
        '臺': '台',  # 統一台/臺
        '－': '-',
        '—': '-',
        '：': ':',
        '；': ';',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    
    return text.lower()


def calculate_similarity(str1: str, str2: str) -> float:
    """
    計算兩個字串的相似度 (0-1)
    
    Args:
        str1: 第一個字串
        str2: 第二個字串
    
    Returns:
        相似度分數
    """
    if str1 is None and str2 is None:
        return 1.0
    if str1 is None or str2 is None:
        return 0.0
    
    norm1 = normalize_text(str1)
    norm2 = normalize_text(str2)
    
    if norm1 == norm2:
        return 1.0
    
    return SequenceMatcher(None, norm1, norm2).ratio()


def compare_field(field_name: str,
                 ocr_value: Any,
                 reference_value: Any,
                 threshold: float = 0.85) -> FieldComparison:
    """
    比對單一欄位
    
    Args:
        field_name: 欄位名稱
        ocr_value: OCR 提取的值
        reference_value: 參考資料的值
        threshold: 相似度閾值 (高於此視為相符)
    
    Returns:
        欄位比對結果
    """
    # 處理空值
    if ocr_value is None and reference_value is None:
        return FieldComparison(
            field_name=field_name,
            ocr_value=ocr_value,
            reference_value=reference_value,
            match_type=MatchType.EXACT,
            similarity=1.0,
            details="兩者皆為空值"
        )
    
    if ocr_value is None:
        return FieldComparison(
            field_name=field_name,
            ocr_value=ocr_value,
            reference_value=reference_value,
            match_type=MatchType.MISSING,
            similarity=0.0,
            details="OCR 未提取到此欄位"
        )
    
    if reference_value is None:
        return FieldComparison(
            field_name=field_name,
            ocr_value=ocr_value,
            reference_value=reference_value,
            match_type=MatchType.EXTRA,
            similarity=0.0,
            details="參考資料無此欄位"
        )
    
    # 計算相似度
    similarity = calculate_similarity(str(ocr_value), str(reference_value))
    
    # 判斷比對類型
    if similarity == 1.0:
        match_type = MatchType.EXACT
        details = "完全相符"
    elif similarity >= threshold:
        match_type = MatchType.SIMILAR
        details = f"相似 (差異可能為 OCR 誤識)"
    else:
        match_type = MatchType.MISMATCH
        details = f"不符，請人工確認"
    
    return FieldComparison(
        field_name=field_name,
        ocr_value=ocr_value,
        reference_value=reference_value,
        match_type=match_type,
        similarity=similarity,
        details=details
    )


def compare_documents(ocr_data: Dict,
                     reference_data: Dict,
                     fields_to_compare: Optional[List[str]] = None,
                     threshold: float = 0.85,
                     document_id: str = "") -> ComparisonResult:
    """
    比對 OCR 結果與參考資料
    
    Args:
        ocr_data: OCR 提取的結構化資料
        reference_data: 系統中的參考資料
        fields_to_compare: 要比對的欄位列表 (None = 全部)
        threshold: 相似度閾值
        document_id: 文件識別碼
    
    Returns:
        比對結果
    """
    result = ComparisonResult(document_id=document_id)
    
    # 決定要比對的欄位
    if fields_to_compare is None:
        all_fields = set(ocr_data.keys()) | set(reference_data.keys())
        fields_to_compare = list(all_fields)
    
    # 逐欄位比對
    total_similarity = 0.0
    match_count = 0
    
    for field_name in fields_to_compare:
        ocr_value = ocr_data.get(field_name)
        ref_value = reference_data.get(field_name)
        
        comparison = compare_field(field_name, ocr_value, ref_value, threshold)
        result.field_comparisons.append(comparison)
        
        total_similarity += comparison.similarity
        if comparison.match_type in [MatchType.EXACT, MatchType.SIMILAR]:
            match_count += 1
    
    # 計算整體結果
    field_count = len(fields_to_compare)
    result.overall_similarity = total_similarity / field_count if field_count > 0 else 0
    result.overall_match = match_count == field_count
    
    # 生成摘要
    mismatch_fields = [
        fc.field_name for fc in result.field_comparisons 
        if fc.match_type == MatchType.MISMATCH
    ]
    missing_fields = [
        fc.field_name for fc in result.field_comparisons 
        if fc.match_type == MatchType.MISSING
    ]
    
    if result.overall_match:
        result.summary = "✅ 所有欄位比對通過"
    else:
        issues = []
        if mismatch_fields:
            issues.append(f"不符欄位: {', '.join(mismatch_fields)}")
        if missing_fields:
            issues.append(f"缺失欄位: {', '.join(missing_fields)}")
        result.summary = "❌ " + "; ".join(issues)
    
    return result


def load_reference_from_excel(excel_path: str, 
                             key_column: str,
                             key_value: str) -> Optional[Dict]:
    """
    從 Excel 載入參考資料
    
    Args:
        excel_path: Excel 檔案路徑
        key_column: 用於查找的欄位名稱
        key_value: 查找的值
    
    Returns:
        找到的資料列 (字典形式)
    """
    try:
        import pandas as pd
        
        df = pd.read_excel(excel_path)
        
        # 查找匹配的列
        matches = df[df[key_column].astype(str) == str(key_value)]
        
        if len(matches) == 0:
            return None
        
        # 返回第一筆匹配
        return matches.iloc[0].to_dict()
        
    except ImportError:
        raise ImportError("請安裝 pandas 和 openpyxl: pip install pandas openpyxl")
    except Exception as e:
        raise RuntimeError(f"讀取 Excel 失敗: {e}")


def load_reference_from_json(json_path: str,
                            key_field: str,
                            key_value: str) -> Optional[Dict]:
    """
    從 JSON 檔案載入參考資料
    
    Args:
        json_path: JSON 檔案路徑
        key_field: 用於查找的欄位名稱
        key_value: 查找的值
    
    Returns:
        找到的資料 (字典形式)
    """
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 如果是列表，搜尋匹配項
    if isinstance(data, list):
        for item in data:
            if str(item.get(key_field, "")) == str(key_value):
                return item
        return None
    
    # 如果是字典，直接返回
    return data


# 測試用主程式
if __name__ == "__main__":
    # 測試比對
    ocr_result = {
        "場所名稱": "臺東縣立體育場",
        "地址": "台東市中華路一段684號",
        "負責人": "王大明",
        "電話": "089-123456"
    }
    
    reference = {
        "場所名稱": "台東縣立體育場",
        "地址": "臺東市中華路一段684號",
        "負責人": "王大明",
        "電話": "089-123456"
    }
    
    print("OCR 結果:", ocr_result)
    print("參考資料:", reference)
    print()
    
    result = compare_documents(ocr_result, reference, document_id="TEST-001")
    
    print(f"整體相符: {result.overall_match}")
    print(f"整體相似度: {result.overall_similarity:.2%}")
    print(f"摘要: {result.summary}")
    print()
    
    print("欄位詳情:")
    for fc in result.field_comparisons:
        print(f"  {fc.field_name}: {fc.match_type.value} ({fc.similarity:.2%}) - {fc.details}")
