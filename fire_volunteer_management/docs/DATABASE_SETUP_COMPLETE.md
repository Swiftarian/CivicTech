# 資料庫配置完成摘要

## ✅ 配置狀態

資料庫已成功安裝、配置並初始化完成！

## 📊 資料庫資訊

### 連線資訊

- **資料庫類型**: MySQL 8.0
- **資料庫名稱**: `taitung_disaster`
- **使用者名稱**: `taitung_user`
- **主機**: `localhost:3306`
- **字元集**: `utf8mb4_unicode_ci`

### 連線字串

```
DATABASE_URL=mysql://taitung_user:taitung_pass_2026@localhost:3306/taitung_disaster
```

## 🗄️ 資料表結構

系統已建立以下 **20 個資料表**：

### 核心模組

1. **users** - 使用者資料（支援 admin、volunteer、user 三種角色）
2. **volunteers** - 志工資料擴展表
3. **notifications** - 系統通知

### 導覽預約模組

4. **bookings** - 預約記錄（統一表）
5. **groupBookings** - 團體預約
6. **individualBookings** - 個人預約
7. **schedules** - 志工排班表
8. **attendances** - 打卡記錄
9. **leaveRequests** - 換班/請假申請

### 案件查詢模組

10. **cases** - 案件申請表
11. **caseProgress** - 案件進度記錄

### 送餐服務模組

12. **mealDeliveries** - 送餐任務表
13. **deliveryTasks** - 送餐任務詳情
14. **deliveryTracking** - 路徑追蹤記錄
15. **deliveryPoints** - 送餐地點
16. **recipients** - 收餐人資料

### 內容管理模組

17. **news** - 最新消息
18. **gallery** - 服務花絮（圖片庫）
19. **homeContent** - 首頁內容管理
20. **emailLogs** - Email 發送記錄

## 🔍 資料表驗證

### users 表結構

| 欄位         | 類型         | 說明                         |
| ------------ | ------------ | ---------------------------- |
| id           | int          | 主鍵（自動遞增）             |
| openId       | varchar(64)  | OAuth 唯一識別碼             |
| name         | text         | 使用者姓名                   |
| email        | varchar(320) | 電子郵件                     |
| phone        | varchar(20)  | 電話號碼                     |
| loginMethod  | varchar(64)  | 登入方式                     |
| role         | enum         | 角色（user/volunteer/admin） |
| createdAt    | timestamp    | 建立時間                     |
| updatedAt    | timestamp    | 更新時間                     |
| lastSignedIn | timestamp    | 最後登入時間                 |

### bookings 表結構

| 欄位                | 類型         | 說明                                          |
| ------------------- | ------------ | --------------------------------------------- |
| id                  | int          | 主鍵（自動遞增）                              |
| bookingNumber       | varchar(50)  | 預約編號（唯一）                              |
| type                | enum         | 預約類型（group/individual）                  |
| userId              | int          | 預約人 ID（外鍵）                             |
| contactName         | varchar(100) | 聯絡人姓名                                    |
| contactPhone        | varchar(20)  | 聯絡電話                                      |
| contactEmail        | varchar(320) | 聯絡信箱                                      |
| organizationName    | varchar(200) | 團體名稱                                      |
| numberOfPeople      | int          | 總人數                                        |
| adultCount          | int          | 成人人數                                      |
| childCount          | int          | 兒童人數                                      |
| visitDate           | timestamp    | 參訪日期                                      |
| visitTime           | varchar(20)  | 參訪時段                                      |
| arrivalTime         | varchar(20)  | 抵達時間                                      |
| notes               | text         | 備註                                          |
| status              | enum         | 狀態（pending/confirmed/cancelled/completed） |
| assignedVolunteerId | int          | 指派志工 ID（外鍵）                           |
| reminderSent        | enum         | 是否已發送提醒（no/yes）                      |
| createdAt           | timestamp    | 建立時間                                      |
| updatedAt           | timestamp    | 更新時間                                      |

## 🚀 系統狀態

### 開發伺服器

- ✅ 運行中
- 📍 本地端口: `http://localhost:3000`
- 🌐 公開網址: `https://3000-i6j89blpknc0abja815p2-3a292d4d.sg1.manus.computer`

### 資料庫連線

- ✅ 已連接
- ✅ 所有資料表已建立
- ✅ 資料表結構驗證通過

## 📝 後續操作建議

### 1. 建立測試資料

您可以透過管理後台或直接執行 SQL 來建立測試資料：

```sql
-- 建立測試管理員帳號
INSERT INTO users (openId, name, email, role)
VALUES ('test-admin-001', '測試管理員', 'admin@test.com', 'admin');

-- 建立測試志工帳號
INSERT INTO users (openId, name, email, role)
VALUES ('test-volunteer-001', '測試志工', 'volunteer@test.com', 'volunteer');
```

### 2. 測試預約功能

- 訪問首頁，點擊「立即預約參訪」
- 填寫預約表單
- 確認資料是否正確儲存到資料庫

### 3. 測試查詢功能

- 使用預約編號查詢預約狀態
- 確認查詢結果正確

### 4. 配置額外服務（選填）

如需完整功能，請在 `.env` 中配置：

- AWS S3（檔案上傳）
- SMTP（Email 通知）
- Twilio（SMS 通知）
- LINE（LINE 通知）

## 🔒 安全提醒

**重要**：當前使用的資料庫密碼是開發環境用的簡單密碼。在生產環境部署時，請務必：

1. 更改為強密碼
2. 限制資料庫使用者權限
3. 啟用 SSL 連線
4. 定期備份資料庫

## 📚 相關文件

- [DEVELOPMENT_SETUP.md](./DEVELOPMENT_SETUP.md) - 開發環境設置指南
- [docs/README.md](./docs/README.md) - 專案總覽
- [docs/TEST_ACCOUNTS.md](./docs/TEST_ACCOUNTS.md) - 測試帳號資訊

## 🎉 完成！

您的台東防災館綜合管理系統現在已經完全就緒，可以開始開發和測試了！

---

**配置完成時間**: 2026-01-21  
**MySQL 版本**: 8.0.44  
**資料表數量**: 20
