# 使用官方 Python 3.11 Slim 映像檔作為基底
FROM python:3.11-slim

# 設定維護者資訊
LABEL maintainer="Taitung Fire Department"
LABEL description="Fire Safety Equipment Inspection Automation System"

# 設定環境變數
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    DEBIAN_FRONTEND=noninteractive

# 安裝系統依賴（包含 Tesseract OCR）
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-chi-tra \
    tesseract-ocr-chi-sim \
    libtesseract-dev \
    && rm -rf /var/lib/apt/lists/*

# 設定工作目錄
WORKDIR /app

# 複製依賴檔案並安裝 Python 套件
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 複製專案檔案（排除敏感資料）
COPY *.py ./
COPY pages/ ./pages/
COPY .streamlit/ ./.streamlit/

# 建立必要的目錄
RUN mkdir -p uploads downloads

# 暴露 Streamlit 預設 Port
EXPOSE 8501

# 健康檢查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8501/_stcore/health || exit 1

# 啟動指令
CMD ["streamlit", "run", "首頁.py", "--server.port=8501", "--server.address=0.0.0.0"]
