# AWS S3 設定指南

## 📋 前置準備

您需要一個 AWS 帳號來使用 S3 服務。如果還沒有，請前往 [AWS 官網](https://aws.amazon.com/) 註冊。

---

## 🪣 步驟 1：建立 S3 Bucket

1. 登入 [AWS Console](https://console.aws.amazon.com/)
2. 搜尋並進入 **S3** 服務
3. 點擊「建立儲存貯體」（Create bucket）
4. 設定以下選項：

   **基本設定**
   - **儲存貯體名稱**：例如 `taitung-disaster-system-uploads`（必須全球唯一）
   - **AWS 區域**：選擇 `亞太區域 (東京) ap-northeast-1`（或其他鄰近區域）

   **物件擁有權**
   - 選擇：**ACL 已啟用**
   - 勾選：**物件擁有者偏好設定為儲存貯體擁有者**

   **封鎖公開存取設定**
   - **取消勾選**「封鎖所有公開存取」
   - 勾選確認警告訊息

   **其他設定**
   - 保持預設值即可

5. 點擊「建立儲存貯體」

---

## 🔑 步驟 2：建立 IAM 使用者和存取金鑰

### 2.1 建立 IAM 使用者

1. 在 AWS Console 搜尋並進入 **IAM** 服務
2. 點擊左側選單「使用者」（Users）
3. 點擊「建立使用者」（Create user）
4. 輸入使用者名稱：例如 `taitung-s3-uploader`
5. 點擊「下一步」

### 2.2 設定權限

1. 選擇「直接連接政策」（Attach policies directly）
2. 搜尋並勾選 **`AmazonS3FullAccess`**（或建立自訂政策，見下方）
3. 點擊「下一步」
4. 點擊「建立使用者」

### 2.3 建立存取金鑰

1. 點擊剛建立的使用者
2. 點擊「安全憑證」（Security credentials）標籤
3. 向下捲動到「存取金鑰」（Access keys）區塊
4. 點擊「建立存取金鑰」（Create access key）
5. 選擇使用案例：**應用程式在 AWS 外部執行**
6. 點擊「下一步」
7. （選填）輸入描述標籤
8. 點擊「建立存取金鑰」
9. **重要**：複製並儲存以下資訊（只會顯示一次）：
   - **存取金鑰 ID**（Access Key ID）
   - **私密存取金鑰**（Secret Access Key）

---

## 🔒 步驟 3：設定 S3 Bucket 政策（允許公開讀取）

1. 回到 S3 服務，點擊您建立的 bucket
2. 點擊「許可」（Permissions）標籤
3. 向下捲動到「儲存貯體政策」（Bucket policy）
4. 點擊「編輯」（Edit）
5. 貼上以下政策（記得替換 `YOUR-BUCKET-NAME`）：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

6. 點擊「儲存變更」

---

## 🚀 步驟 4：設定 Railway 環境變數

1. 登入 [Railway](https://railway.app/)
2. 進入您的專案
3. 點擊「Variables」標籤
4. 新增以下環境變數：

   ```
   AWS_ACCESS_KEY_ID=你的存取金鑰ID
   AWS_SECRET_ACCESS_KEY=你的私密存取金鑰
   AWS_REGION=ap-northeast-1
   AWS_S3_BUCKET=你的bucket名稱
   ```

5. 點擊「Save」儲存

---

## ✅ 步驟 5：測試上傳功能

1. Railway 會自動重新部署
2. 等待部署完成（約 2-3 分鐘）
3. 訪問 https://taitungaibookingsystem.cc/admin/news-management
4. 點擊「新增消息」
5. 嘗試上傳圖片
6. 如果成功，圖片會顯示在預覽區

---

## 🔐 安全性建議（選用）

### 建立自訂 IAM 政策（最小權限原則）

如果您想要更精細的權限控制，可以使用以下自訂政策替代 `AmazonS3FullAccess`：

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME"
    }
  ]
}
```

---

## 💰 費用估算

AWS S3 的費用非常低廉：

- **儲存空間**：$0.023 / GB / 月（前 50 TB）
- **PUT 請求**：$0.005 / 1000 次請求
- **GET 請求**：$0.0004 / 1000 次請求
- **資料傳輸**：前 1 GB / 月免費，之後 $0.09 / GB

**範例**：如果您每月上傳 100 張圖片（每張 500 KB），總共 50 MB：
- 儲存費用：$0.023 × 0.05 = **$0.00115 / 月**
- 上傳費用：$0.005 × 0.1 = **$0.0005**
- **總計：約 $0.002 / 月**（幾乎可以忽略不計）

---

## 🆘 常見問題

### Q1: 上傳後顯示「Access Denied」

**解決方法**：
1. 確認 Bucket 政策已正確設定
2. 確認「封鎖公開存取」已關閉
3. 確認 IAM 使用者有 `s3:PutObjectAcl` 權限

### Q2: 圖片無法顯示

**解決方法**：
1. 檢查圖片 URL 是否正確
2. 在瀏覽器直接訪問圖片 URL，確認可以存取
3. 檢查 Bucket 政策中的 `Resource` 是否包含 `/*`

### Q3: 環境變數設定後仍然失敗

**解決方法**：
1. 確認 Railway 已重新部署
2. 檢查環境變數名稱是否正確（區分大小寫）
3. 檢查 AWS 憑證是否有效

---

## 📞 需要協助？

如果遇到任何問題，請隨時告訴我！我可以協助您：
- 除錯錯誤訊息
- 調整 IAM 政策
- 優化 S3 設定
