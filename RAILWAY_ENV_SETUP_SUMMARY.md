# Railway 環境變數設定總結

## 📋 概述

您的系統目前需要設定兩組環境變數才能完整運作：

1. **AWS S3**：用於圖片上傳（最新消息、相簿等）
2. **Google Maps API**：用於地圖顯示（送餐追蹤、路線規劃等）

---

## 🔑 必要的環境變數

### 1. AWS S3（圖片上傳功能）

```bash
AWS_ACCESS_KEY_ID=你的存取金鑰ID
AWS_SECRET_ACCESS_KEY=你的私密存取金鑰
AWS_REGION=ap-northeast-1
AWS_S3_BUCKET=你的bucket名稱
```

**用途**：
- 最新消息封面圖片上傳
- 相簿圖片上傳
- 其他檔案儲存

**設定指南**：請參考 `AWS_S3_SETUP_GUIDE.md`

---

### 2. Google Maps API（地圖顯示功能）

```bash
VITE_GOOGLE_MAPS_API_KEY=你的Google Maps API金鑰
```

**用途**：
- 送餐管理頁面地圖顯示
- 志工送餐頁面地圖顯示
- 送餐追蹤頁面地圖顯示
- 路線規劃功能

**設定指南**：請參考 `GOOGLE_MAPS_SETUP_GUIDE.md`

---

## 🚀 如何在 Railway 設定環境變數

### 方法一：透過 Railway Dashboard（推薦）

1. 登入 [Railway](https://railway.app/)
2. 進入您的專案
3. 點擊「Variables」標籤
4. 點擊「+ New Variable」
5. 輸入變數名稱和值
6. 點擊「Add」
7. 重複步驟 4-6 直到所有變數都設定完成
8. Railway 會自動重新部署

### 方法二：透過 Railway CLI

```bash
# 安裝 Railway CLI
npm install -g @railway/cli

# 登入
railway login

# 連結專案
railway link

# 設定環境變數
railway variables set AWS_ACCESS_KEY_ID=你的值
railway variables set AWS_SECRET_ACCESS_KEY=你的值
railway variables set AWS_REGION=ap-northeast-1
railway variables set AWS_S3_BUCKET=你的值
railway variables set VITE_GOOGLE_MAPS_API_KEY=你的值
```

---

## ✅ 設定優先順序

### 🔴 高優先級（立即需要）

**Google Maps API Key**
- **影響**：地圖無法顯示（您目前遇到的問題）
- **設定時間**：約 10 分鐘
- **費用**：免費（每月 $200 美元免費額度）

### 🟡 中優先級（建議盡快設定）

**AWS S3**
- **影響**：無法上傳圖片（最新消息、相簿等）
- **設定時間**：約 15 分鐘
- **費用**：幾乎免費（每月約 $0.002）

---

## 📝 設定檢查清單

完成設定後，請確認以下功能是否正常運作：

### Google Maps API
- [ ] 送餐管理頁面地圖正常顯示
- [ ] 志工送餐頁面地圖正常顯示
- [ ] 可以在地圖上看到標記點
- [ ] 可以規劃路線

### AWS S3
- [ ] 可以在最新消息管理上傳封面圖片
- [ ] 上傳的圖片可以正常顯示
- [ ] 可以在相簿管理上傳圖片

---

## 🆘 遇到問題？

### 問題 1：設定環境變數後地圖仍然無法顯示

**解決方法**：
1. 確認環境變數名稱正確（區分大小寫）
2. 確認 Railway 已重新部署（查看 Deployments 標籤）
3. 清除瀏覽器快取並重新整理頁面
4. 檢查瀏覽器 Console 是否有錯誤訊息

### 問題 2：圖片上傳失敗

**解決方法**：
1. 確認 AWS S3 Bucket 已建立
2. 確認 IAM 使用者有正確的權限
3. 確認 Bucket 政策已設定
4. 檢查瀏覽器 Network 標籤的錯誤訊息

### 問題 3：不確定如何開始

**建議順序**：
1. **先設定 Google Maps API**（修復地圖問題）
   - 參考 `GOOGLE_MAPS_SETUP_GUIDE.md`
   - 設定完成後測試地圖是否顯示
2. **再設定 AWS S3**（啟用圖片上傳）
   - 參考 `AWS_S3_SETUP_GUIDE.md`
   - 設定完成後測試圖片上傳

---

## 📞 需要協助？

如果您在設定過程中遇到任何問題，請隨時告訴我：
- 提供錯誤訊息截圖
- 說明您卡在哪個步驟
- 我會協助您逐步解決

---

## 📚 相關文件

- **AWS S3 設定指南**：`AWS_S3_SETUP_GUIDE.md`
- **Google Maps API 設定指南**：`GOOGLE_MAPS_SETUP_GUIDE.md`
- **環境變數範例**：`.env.example`
