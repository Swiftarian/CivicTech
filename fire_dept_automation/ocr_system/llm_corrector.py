# -*- coding: utf-8 -*-
"""
LLM 校正模組 - 使用 Qwen2.5-VL 進行 OCR 結果校正與結構化
支援本地運行 (Ollama) 或 API 呼叫
"""

import os
import json
import re
from typing import Dict, List, Optional, Union
from dataclasses import dataclass
from enum import Enum


class LLMBackend(Enum):
    """LLM 後端選項"""
    OLLAMA = "ollama"       # 本地 Ollama
    OPENAI = "openai"       # OpenAI API (GPT-4o)
    QWEN_API = "qwen_api"   # 阿里雲 Qwen API


@dataclass
class LLMConfig:
    """LLM 配置"""
    backend: LLMBackend = LLMBackend.OLLAMA
    model_name: str = "qwen2.5:7b"  # Ollama 模型名稱 (已安裝)
    api_key: Optional[str] = None
    api_base: str = "http://localhost:11434"  # Ollama 預設
    temperature: float = 0.1  # 低溫度以獲得穩定輸出
    max_tokens: int = 4096


# 預設配置
DEFAULT_CONFIG = LLMConfig()


def get_correction_prompt(ocr_text: str, context: str = "") -> str:
    """
    生成 OCR 校正的提示詞
    
    Args:
        ocr_text: OCR 辨識的原始文字
        context: 額外上下文 (如文件類型)
    
    Returns:
        完整的提示詞
    """
    prompt = f"""你是一個專業的繁體中文 OCR 校正專家。請校正以下 OCR 辨識結果中的錯誤。

## 校正規則：
1. 修正明顯的字元辨識錯誤（如「臺」被誤識為「台」、「國」被誤識為「圀」）
2. 修正標點符號錯誤
3. 保留原始排版結構（換行、空格）
4. 不要添加原文沒有的內容
5. 不要省略任何文字
6. 如果無法確定，保留原始文字

{f"## 文件類型：{context}" if context else ""}

## OCR 原始文字：
```
{ocr_text}
```

## 請輸出校正後的文字（只輸出校正結果，不要加任何解釋）：
"""
    return prompt


def get_structuring_prompt(ocr_text: str, fields: List[str]) -> str:
    """
    生成結構化提取的提示詞
    
    Args:
        ocr_text: OCR 辨識的文字
        fields: 需要提取的欄位列表
    
    Returns:
        完整的提示詞
    """
    fields_str = "\n".join([f"- {f}" for f in fields])
    
    prompt = f"""你是一個專業的文件資料提取專家。請從以下 OCR 文字中提取結構化資訊。

## 需要提取的欄位：
{fields_str}

## OCR 文字：
```
{ocr_text}
```

## 請以 JSON 格式輸出提取結果（只輸出 JSON，不要加任何解釋）：
```json
"""
    return prompt


def call_ollama(prompt: str, config: LLMConfig) -> str:
    """
    呼叫本地 Ollama API
    
    Args:
        prompt: 提示詞
        config: LLM 配置
    
    Returns:
        模型回應
    """
    try:
        import requests
        
        url = f"{config.api_base}/api/generate"
        payload = {
            "model": config.model_name,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": config.temperature,
                "num_predict": config.max_tokens
            }
        }
        
        response = requests.post(url, json=payload, timeout=120)
        response.raise_for_status()
        
        result = response.json()
        return result.get("response", "")
        
    except ImportError:
        raise ImportError("請安裝 requests: pip install requests")
    except Exception as e:
        raise RuntimeError(f"Ollama API 呼叫失敗: {e}")


def call_openai_compatible(prompt: str, config: LLMConfig) -> str:
    """
    呼叫 OpenAI 相容 API (包括 Qwen API)
    
    Args:
        prompt: 提示詞
        config: LLM 配置
    
    Returns:
        模型回應
    """
    try:
        import openai
        
        client = openai.OpenAI(
            api_key=config.api_key,
            base_url=config.api_base
        )
        
        response = client.chat.completions.create(
            model=config.model_name,
            messages=[{"role": "user", "content": prompt}],
            temperature=config.temperature,
            max_tokens=config.max_tokens
        )
        
        return response.choices[0].message.content
        
    except ImportError:
        raise ImportError("請安裝 openai: pip install openai")
    except Exception as e:
        raise RuntimeError(f"OpenAI API 呼叫失敗: {e}")


def call_llm(prompt: str, config: LLMConfig = None) -> str:
    """
    統一的 LLM 呼叫介面
    
    Args:
        prompt: 提示詞
        config: LLM 配置 (使用預設配置如果為 None)
    
    Returns:
        模型回應
    """
    if config is None:
        config = DEFAULT_CONFIG
    
    if config.backend == LLMBackend.OLLAMA:
        return call_ollama(prompt, config)
    else:
        return call_openai_compatible(prompt, config)


def correct_ocr_text(ocr_text: str, 
                     context: str = "",
                     config: LLMConfig = None) -> str:
    """
    使用 LLM 校正 OCR 文字
    
    Args:
        ocr_text: OCR 辨識的原始文字
        context: 文件類型上下文
        config: LLM 配置
    
    Returns:
        校正後的文字
    """
    if not ocr_text.strip():
        return ""
    
    prompt = get_correction_prompt(ocr_text, context)
    corrected = call_llm(prompt, config)
    
    # 清理輸出（移除可能的 markdown 標記）
    corrected = corrected.strip()
    if corrected.startswith("```"):
        lines = corrected.split("\n")
        corrected = "\n".join(lines[1:-1] if lines[-1] == "```" else lines[1:])
    
    return corrected


def extract_structured_data(ocr_text: str,
                           fields: List[str],
                           config: LLMConfig = None) -> Dict:
    """
    從 OCR 文字中提取結構化資料
    
    Args:
        ocr_text: OCR 辨識的文字
        fields: 需要提取的欄位列表
        config: LLM 配置
    
    Returns:
        結構化資料字典
    """
    if not ocr_text.strip():
        return {field: None for field in fields}
    
    prompt = get_structuring_prompt(ocr_text, fields)
    response = call_llm(prompt, config)
    
    # 解析 JSON
    try:
        # 嘗試提取 JSON 部分
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            return json.loads(json_match.group())
        else:
            return {field: None for field in fields}
    except json.JSONDecodeError:
        return {field: None for field in fields}


def check_ollama_available(config: LLMConfig = None) -> bool:
    """
    檢查 Ollama 服務是否可用
    
    Returns:
        是否可用
    """
    if config is None:
        config = DEFAULT_CONFIG
    
    try:
        import requests
        response = requests.get(f"{config.api_base}/api/tags", timeout=5)
        return response.status_code == 200
    except:
        return False


def list_ollama_models(config: LLMConfig = None) -> List[str]:
    """
    列出可用的 Ollama 模型
    
    Returns:
        模型名稱列表
    """
    if config is None:
        config = DEFAULT_CONFIG
    
    try:
        import requests
        response = requests.get(f"{config.api_base}/api/tags", timeout=5)
        if response.status_code == 200:
            data = response.json()
            return [m["name"] for m in data.get("models", [])]
    except:
        pass
    
    return []


# 測試用主程式
if __name__ == "__main__":
    # 檢查 Ollama
    print("檢查 Ollama 服務...")
    if check_ollama_available():
        print("✅ Ollama 服務正常運行")
        models = list_ollama_models()
        print(f"可用模型: {models}")
    else:
        print("❌ Ollama 服務未運行")
        print("請執行: ollama serve")
        print("並下載模型: ollama pull qwen2.5-vl:7b")
    
    # 測試校正
    test_text = """
    臺東縣政府消防局
    公文字號：府消預字第1130001234號
    主旨：有關辦理建築物公共安全檢査事宜
    """
    
    print("\n原始 OCR 文字:")
    print(test_text)
    
    if check_ollama_available():
        print("\n正在校正...")
        corrected = correct_ocr_text(test_text, context="公文")
        print("校正後:")
        print(corrected)
