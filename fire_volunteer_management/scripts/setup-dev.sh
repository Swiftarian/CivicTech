#!/bin/bash

# 台東防災館綜合管理系統 - 開發環境設置腳本
# 此腳本協助快速設置開發環境

set -e  # 遇到錯誤立即停止

echo "=================================="
echo "台東防災館綜合管理系統"
echo "開發環境設置腳本"
echo "=================================="
echo ""

# 檢查 Node.js 版本
echo "檢查 Node.js 版本..."
if ! command -v node &> /dev/null; then
    echo "❌ 錯誤: 未安裝 Node.js"
    echo "請安裝 Node.js 22.x 或更高版本"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    echo "⚠️  警告: Node.js 版本過舊 (當前: $(node -v))"
    echo "建議使用 Node.js 22.x 或更高版本"
else
    echo "✅ Node.js 版本: $(node -v)"
fi

# 檢查 pnpm
echo ""
echo "檢查 pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo "❌ 錯誤: 未安裝 pnpm"
    echo "請執行: npm install -g pnpm"
    exit 1
fi
echo "✅ pnpm 版本: $(pnpm -v)"

# 檢查 MySQL
echo ""
echo "檢查 MySQL..."
if ! command -v mysql &> /dev/null; then
    echo "⚠️  警告: 未安裝 MySQL 或不在 PATH 中"
    echo "請確認 MySQL 已安裝並正在運行"
else
    echo "✅ MySQL 已安裝"
fi

# 安裝依賴
echo ""
echo "安裝專案依賴..."
pnpm install

# 檢查環境變數檔案
echo ""
echo "檢查環境變數設定..."
if [ ! -f .env ]; then
    echo "⚠️  未找到 .env 檔案"
    if [ -f .env.example ]; then
        echo "正在從 .env.example 建立 .env..."
        cp .env.example .env
        echo "✅ 已建立 .env 檔案"
        echo "⚠️  請編輯 .env 檔案，填入必要的環境變數"
    else
        echo "❌ 錯誤: 未找到 .env.example 檔案"
        exit 1
    fi
else
    echo "✅ .env 檔案已存在"
fi

# TypeScript 型別檢查
echo ""
echo "執行 TypeScript 型別檢查..."
pnpm check
echo "✅ TypeScript 型別檢查通過"

# 完成
echo ""
echo "=================================="
echo "✅ 開發環境設置完成！"
echo "=================================="
echo ""
echo "下一步："
echo "1. 編輯 .env 檔案，填入必要的環境變數"
echo "2. 確認 MySQL 資料庫已建立"
echo "3. 執行 'pnpm db:push' 初始化資料庫"
echo "4. 執行 'pnpm dev' 啟動開發伺服器"
echo ""
echo "詳細說明請參考 DEVELOPMENT_SETUP.md"
echo ""
