# 送餐服務模組使用說明

## 模組概述

送餐服務模組是台東防災館綜合管理系統的重要功能之一，專為管理送餐任務、志工指派、路徑追蹤和送達驗證而設計。本模組採用 QR Code 驗證機制，確保送餐服務的準確性和可追溯性。

## 功能特色

### 1. 送餐任務管理
- **建立送餐任務**：管理員可以建立新的送餐任務，包含收餐人資訊、送餐地址、預定時間等
- **任務列表查看**：查看所有送餐任務的狀態和詳細資訊
- **任務狀態追蹤**：即時追蹤任務狀態（待指派、已指派、配送中、已完成、已取消）

### 2. 志工指派系統
- **志工選擇**：從可用志工列表中選擇適合的配送人員
- **自動通知**：指派後系統自動通知志工
- **工作量分配**：合理分配送餐任務給不同志工

### 3. QR Code 驗證機制
- **自動生成**：系統為每個送餐任務自動生成唯一的 QR Code
- **掃描驗證**：志工送達時掃描 QR Code 確認送達
- **防偽機制**：每個驗證碼具有唯一性，防止偽造

### 4. 路徑追蹤（規劃中）
- **即時定位**：追蹤志工的配送路徑
- **預計到達時間**：計算並顯示預計送達時間
- **歷史軌跡**：保存配送路徑歷史記錄

## 使用者角色

### 管理員
- 建立送餐任務
- 指派志工
- 查看所有任務
- 管理任務狀態
- 查看 QR Code

### 志工
- 查看指派給自己的任務
- 開始配送
- 掃描 QR Code 確認送達
- 完成送餐任務
- 追蹤配送記錄

### 收餐人
- 接收送餐通知
- 確認送達（透過 QR Code）

## 操作流程

### 管理員操作流程

#### 1. 建立送餐任務

1. 登入系統後，進入「送餐服務管理」頁面（路徑：`/meal-delivery`）
2. 點擊「建立送餐任務」按鈕
3. 填寫送餐任務資訊：
   - **收餐人姓名**：必填
   - **收餐人電話**：必填
   - **送餐地址**：必填，詳細地址
   - **預定送餐時間**：必填，選擇日期和時間
   - **餐點類型**：必填，例如：午餐、晚餐、特殊餐
   - **特殊說明**：選填，例如：無障礙需求、飲食限制等
4. 點擊「建立任務」按鈕
5. 系統自動生成送餐編號和驗證碼

#### 2. 指派志工

1. 在送餐任務列表中找到「待指派」狀態的任務
2. 點擊「指派志工」下拉選單
3. 從可用志工列表中選擇合適的志工
4. 系統自動更新任務狀態為「已指派」
5. 志工會收到任務通知

#### 3. 查看 QR Code

1. 在送餐任務列表中找到已指派的任務
2. 點擊「查看 QR Code」按鈕
3. 系統顯示該任務的 QR Code 和驗證碼
4. 可以列印或分享 QR Code 給收餐人

#### 4. 任務狀態管理

任務狀態會自動更新：
- **待指派**：剛建立的任務
- **已指派**：已指派給志工但尚未開始配送
- **配送中**：志工已開始配送
- **已完成**：志工已掃描 QR Code 確認送達
- **已取消**：任務被取消

### 志工操作流程

#### 1. 查看指派任務

1. 登入系統後，進入「志工專區」
2. 查看「我的送餐任務」列表
3. 查看任務詳細資訊：
   - 收餐人姓名和電話
   - 送餐地址
   - 預定送餐時間
   - 餐點類型
   - 特殊說明

#### 2. 開始配送

1. 在任務列表中點擊「開始配送」按鈕
2. 系統記錄開始配送時間
3. 任務狀態更新為「配送中」
4. 開始追蹤配送路徑（如果啟用 GPS 追蹤）

#### 3. 掃描 QR Code 確認送達

1. 到達送餐地點後
2. 請收餐人出示 QR Code（可能在手機上或列印出來）
3. 使用手機掃描 QR Code
4. 系統驗證 QR Code 是否正確
5. 驗證成功後，任務狀態自動更新為「已完成」
6. 系統記錄完成時間和送達位置

#### 4. 查看配送歷史

1. 在志工專區查看「配送歷史」
2. 查看已完成的送餐任務
3. 查看配送路徑和時間記錄
4. 查看服務時數統計

## API 端點說明

### 送餐任務管理

#### 建立送餐任務
```typescript
trpc.mealDeliveries.create.useMutation({
  recipientName: string;      // 收餐人姓名
  recipientPhone: string;     // 收餐人電話
  deliveryAddress: string;    // 送餐地址
  deliveryDate: Date;         // 送餐日期
  deliveryTime: string;       // 送餐時間（HH:mm格式）
  mealType?: string;          // 餐點類型
  specialInstructions?: string; // 特殊說明
})
```

#### 查詢所有送餐任務（管理員）
```typescript
trpc.mealDeliveries.getAll.useQuery()
```

#### 查詢我的送餐任務（志工）
```typescript
trpc.mealDeliveries.getMyDeliveries.useQuery()
```

#### 指派志工
```typescript
trpc.mealDeliveries.assignVolunteer.useMutation({
  deliveryId: number;   // 送餐任務 ID
  volunteerId: number;  // 志工 ID
})
```

#### 開始配送
```typescript
trpc.mealDeliveries.start.useMutation({
  deliveryId: number;   // 送餐任務 ID
})
```

#### 完成配送
```typescript
trpc.mealDeliveries.complete.useMutation({
  deliveryId: number;   // 送餐任務 ID
})
```

#### 驗證 QR Code
```typescript
trpc.mealDeliveries.verify.useMutation({
  deliveryId: number;        // 送餐任務 ID
  verificationCode: string;  // 驗證碼
})
```

#### 追蹤配送路徑
```typescript
trpc.mealDeliveries.track.useMutation({
  deliveryId: number;   // 送餐任務 ID
  latitude: number;     // 緯度
  longitude: number;    // 經度
})
```

## 資料庫結構

### mealDeliveries 表（送餐任務）
- `id`: 主鍵
- `deliveryNumber`: 送餐編號（唯一）
- `recipientName`: 收餐人姓名
- `recipientPhone`: 收餐人電話
- `deliveryAddress`: 送餐地址
- `deliveryDate`: 送餐日期
- `deliveryTime`: 送餐時間
- `mealType`: 餐點類型
- `specialInstructions`: 特殊說明
- `volunteerId`: 指派的志工 ID
- `status`: 任務狀態
- `verificationCode`: 驗證碼
- `qrCode`: QR Code 資料
- `startedAt`: 開始配送時間
- `completedAt`: 完成配送時間
- `createdAt`: 建立時間
- `updatedAt`: 更新時間

### deliveryTracking 表（配送追蹤）
- `id`: 主鍵
- `deliveryId`: 送餐任務 ID
- `latitude`: 緯度
- `longitude`: 經度
- `timestamp`: 記錄時間

## 注意事項

### 安全性
1. **驗證碼保密**：QR Code 和驗證碼應妥善保管，避免洩露
2. **權限控制**：只有管理員可以建立任務和指派志工
3. **資料加密**：敏感資訊（如電話號碼）應加密儲存

### 操作建議
1. **提前建立任務**：建議提前一天建立送餐任務
2. **合理分配**：避免同一志工在同一時段有多個任務
3. **確認資訊**：建立任務前仔細確認收餐人資訊和地址
4. **保持聯繫**：志工應保持手機暢通，方便聯繫

### 故障排除
1. **QR Code 掃描失敗**：
   - 檢查網路連線
   - 確認 QR Code 清晰可見
   - 嘗試手動輸入驗證碼

2. **無法指派志工**：
   - 確認志工狀態為「active」
   - 檢查志工是否已有其他任務衝突

3. **GPS 追蹤不準確**：
   - 確認手機 GPS 功能已開啟
   - 在室外空曠處等待 GPS 訊號穩定

## 未來功能規劃

1. **路線優化**：自動規劃最佳配送路線
2. **批次建立**：支援批次匯入送餐任務
3. **推播通知**：即時推播任務狀態變更
4. **統計報表**：生成送餐服務統計報表
5. **評價系統**：收餐人可以對送餐服務評分
6. **照片上傳**：志工可以上傳送達照片作為證明

## 技術支援

如有任何問題或建議，請聯繫：
- 電話：(089) XXX-XXXX
- Email: support@taitung-disaster.gov.tw
- 系統管理員：透過後台「聯絡管理員」功能

---

**版本資訊**
- 文件版本：1.0
- 最後更新：2024-11-22
- 系統版本：台東防災館綜合管理系統 v1.0
