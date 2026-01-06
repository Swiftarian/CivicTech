# OCR 文件比對系統

高精度繁體中文 OCR 系統，專為掃描文件資料比對設計。

## 功能特色

- **傾斜校正**：自動偵測並校正歪斜的掃描文件
- **高精度 OCR**：使用 PaddleOCR PP-OCRv5 繁體中文引擎
- **LLM 校正**：可選的 Qwen2.5-VL 智慧校正
- **智慧比對**：模糊比對支援、容錯處理
- **差異報告**：自動生成 Word/PDF 格式比對報告

## 系統需求

- Windows 10/11
- Python 3.10+
- NVIDIA GPU (建議，可大幅加速)
- 12GB+ VRAM (若使用 LLM 校正)

## 快速安裝

```bash
# 1. 執行安裝腳本
install.bat

# 2. 安裝本地 LLM (可選)
# 下載 Ollama: https://ollama.com
ollama pull qwen2.5-vl:7b
```

## 使用方式

### 基本 OCR
```bash
python main.py --input 掃描檔.pdf --output 結果.json
```

### 與 Excel 資料比對
```bash
python main.py --input 掃描檔.pdf --reference 資料.xlsx --key-column 場所編號 --key-value A001
```

### 生成比對報告
```bash
python main.py --input 掃描檔.pdf --reference 資料.xlsx --key-column 編號 --key-value A001 --report 報告.docx
```

## 架構

```
OpenCV 傾斜校正 → PaddleOCR → Qwen2.5-VL 校正 → 智慧比對 → 差異報告
```

## 檔案結構

```
ocr_system/
├── main.py           # 主程式
├── deskew.py         # 傾斜校正模組
├── paddle_ocr.py     # OCR 引擎模組
├── llm_corrector.py  # LLM 校正模組
├── compare.py        # 資料比對模組
├── report.py         # 報告產生模組
├── requirements.txt  # 依賴套件
├── install.bat       # 安裝腳本
└── README.md         # 說明文件
```

## 授權

MIT License
