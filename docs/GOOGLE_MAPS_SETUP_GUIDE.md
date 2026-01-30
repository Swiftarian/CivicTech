# Google Maps API 設定指南

## 📋 前置準備

您需要一個 Google Cloud Platform (GCP) 帳號來使用 Google Maps API。如果還沒有，請前往 [Google Cloud Console](https://console.cloud.google.com/) 註冊。

---

## 🗺️ 步驟 1：建立 Google Cloud 專案

1. 登入 [Google Cloud Console](https://console.cloud.google.com/)
2. 點擊頂部的專案選擇器
3. 點擊「新增專案」（New Project）
4. 輸入專案名稱：例如 `taitung-disaster-system`
5. 點擊「建立」（Create）

---

## 🔑 步驟 2：啟用 Google Maps JavaScript API

1. 在 Google Cloud Console 中，確認您選擇了正確的專案
2. 點擊左側選單「API 和服務」→「程式庫」（APIs & Services → Library）
3. 搜尋 **「Maps JavaScript API」**
4. 點擊「Maps JavaScript API」
5. 點擊「啟用」（Enable）

---

## 🔐 步驟 3：建立 API 金鑰

1. 點擊左側選單「API 和服務」→「憑證」（APIs & Services → Credentials）
2. 點擊頂部的「+ 建立憑證」（+ Create Credentials）
3. 選擇「API 金鑰」（API Key）
4. 系統會自動產生一個 API 金鑰，**複製並儲存這個金鑰**

---

## 🛡️ 步驟 4：限制 API 金鑰（重要！）

為了安全性，強烈建議限制 API 金鑰的使用範圍：

### 4.1 設定應用程式限制

1. 在憑證頁面，點擊剛建立的 API 金鑰
2. 在「應用程式限制」（Application restrictions）區塊：
   - 選擇「HTTP 參照網址 (網站)」（HTTP referrers (websites)）
   - 點擊「新增項目」（Add an item）
   - 輸入您的網站網址：
     ```
     https://taitungaibookingsystem.cc/*
     ```
   - 如果需要本地測試，也可以加入：
     ```
     http://localhost:*
     ```

### 4.2 設定 API 限制

1. 在「API 限制」（API restrictions）區塊：
   - 選擇「限制金鑰」（Restrict key）
   - 勾選以下 API：
     - **Maps JavaScript API**
     - **Geocoding API**（如果需要地址轉換）
     - **Places API**（如果需要地點搜尋）
     - **Directions API**（如果需要路線規劃）

2. 點擊「儲存」（Save）

---

## 🚀 步驟 5：設定 Railway 環境變數

1. 登入 [Railway](https://railway.app/)
2. 進入您的專案
3. 點擊「Variables」標籤
4. 新增以下環境變數：

   ```
   VITE_GOOGLE_MAPS_API_KEY=你的Google Maps API金鑰
   ```

5. 點擊「Save」儲存

---

## ✅ 步驟 6：測試地圖功能

1. Railway 會自動重新部署
2. 等待部署完成（約 2-3 分鐘）
3. 訪問送餐管理頁面：
   - 管理員：https://taitungaibookingsystem.cc/admin/meal-delivery
   - 志工：https://taitungaibookingsystem.cc/volunteer/delivery
4. 如果成功，右側應該會顯示 Google 地圖

---

## 💰 費用說明

Google Maps Platform 提供每月 $200 美元的免費額度，對於大多數中小型應用來說已經足夠。

### 免費額度

- **Maps JavaScript API**：每月 28,000 次地圖載入（約每天 900 次）
- **Geocoding API**：每月 40,000 次請求
- **Directions API**：每月 40,000 次請求

### 收費標準（超過免費額度後）

- **Maps JavaScript API**：$7 / 1000 次地圖載入
- **Geocoding API**：$5 / 1000 次請求
- **Directions API**：$5 / 1000 次請求

### 範例估算

假設您的系統每天有：
- 50 位志工查看地圖（50 次地圖載入）
- 30 次地址轉換（30 次 Geocoding 請求）

**每月使用量**：
- 地圖載入：50 × 30 = 1,500 次
- Geocoding：30 × 30 = 900 次

**費用**：**完全免費**（遠低於免費額度）

---

## 🔔 設定帳單警示（建議）

為了避免意外超支，建議設定帳單警示：

1. 在 Google Cloud Console 中，點擊「帳單」（Billing）
2. 選擇您的帳單帳戶
3. 點擊「預算和警示」（Budgets & alerts）
4. 點擊「建立預算」（Create budget）
5. 設定每月預算上限：例如 $10
6. 設定警示：當達到 50%、90%、100% 時發送電子郵件

---

## 🆘 常見問題

### Q1: 地圖顯示「此網頁無法正確載入 Google 地圖」

**可能原因**：
1. API 金鑰未設定或錯誤
2. API 金鑰的 HTTP 參照網址限制設定錯誤
3. Maps JavaScript API 未啟用

**解決方法**：
1. 確認 Railway 環境變數 `VITE_GOOGLE_MAPS_API_KEY` 已正確設定
2. 確認 API 金鑰的 HTTP 參照網址包含您的網站網址
3. 確認 Maps JavaScript API 已在 GCP 中啟用

### Q2: 地圖顯示「開發用途」浮水印

**說明**：這是正常的，表示您使用的是免費額度。如果需要移除浮水印，需要啟用帳單功能（但不會立即收費，仍有 $200 免費額度）。

### Q3: 如何監控 API 使用量？

1. 在 Google Cloud Console 中，點擊「API 和服務」→「資訊主頁」（Dashboard）
2. 選擇「Maps JavaScript API」
3. 可以查看每日/每週/每月的使用量統計

---

## 📞 需要協助？

如果遇到任何問題，請隨時告訴我！我可以協助您：
- 除錯錯誤訊息
- 調整 API 限制
- 優化地圖設定
