# 志工管理與請假系統使用說明

本文件說明台東防災館綜合管理系統中的志工管理、排班、打卡和請假/換班功能的完整運作方式。

---

## 📋 目錄

1. [系統概述](#系統概述)
2. [志工管理](#志工管理)
3. [排班管理](#排班管理)
4. [打卡系統](#打卡系統)
5. [請假換班系統](#請假換班系統)
6. [資料庫結構](#資料庫結構)
7. [API 說明](#api-說明)
8. [使用流程](#使用流程)
9. [常見問題](#常見問題)

---

## 系統概述

### 主要功能

志工管理系統提供完整的志工服務管理功能，包含：

- **志工資料管理**：建立、查詢、更新志工基本資料
- **排班管理**：建立班表、指派志工、查看班表
- **打卡系統**：簽到、簽退、自動計算工時
- **請假換班**：線上申請、管理員審核、狀態追蹤
- **服務時數統計**：自動累計志工服務時數

### 使用者角色

系統涉及三種角色：

1. **管理員（admin）**
   - 建立和管理志工資料
   - 安排排班
   - 審核請假/換班申請
   - 查看所有統計資料

2. **志工（volunteer）**
   - 查看個人班表
   - 打卡簽到/簽退
   - 申請請假/換班
   - 查看個人服務時數

3. **一般使用者（user）**
   - 無法存取志工管理功能

---

## 志工管理

### 建立志工資料

**管理員操作流程：**

1. **進入管理員後台**
   - 訪問 `/admin`
   - 點擊「志工管理」標籤頁

2. **新增志工**
   - 點擊「新增志工」按鈕
   - 填寫志工資訊：
     - **使用者 ID**：關聯到系統使用者帳號
     - **專長**：例如「導覽解說」、「活動支援」
     - **可服務時段**：例如「週一至週五 09:00-17:00」
     - **緊急聯絡人**：姓名
     - **緊急聯絡電話**：電話號碼
     - **狀態**：active（活躍）/ inactive（停用）

3. **儲存志工資料**
   - 系統自動建立志工檔案
   - 志工可以登入系統查看個人資訊

### 查詢志工資料

**管理員可以：**
- 查看所有志工列表
- 篩選活躍/停用志工
- 搜尋特定志工
- 查看志工詳細資料

**志工可以：**
- 查看個人檔案
- 更新聯絡資訊（部分欄位）

### 資料庫結構

**volunteers 表**

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INT | 主鍵，自動遞增 |
| userId | INT | 關聯到 users 表 |
| specialty | TEXT | 專長 |
| availableTime | TEXT | 可服務時段 |
| emergencyContact | VARCHAR(100) | 緊急聯絡人 |
| emergencyPhone | VARCHAR(20) | 緊急聯絡電話 |
| status | ENUM | active / inactive |
| totalHours | INT | 累計服務時數（分鐘） |
| createdAt | TIMESTAMP | 建立時間 |
| updatedAt | TIMESTAMP | 更新時間 |

---

## 排班管理

### 建立排班

**管理員操作流程：**

1. **進入排班管理**
   - 在管理員後台選擇「排班管理」

2. **建立新班表**
   - 點擊「建立排班」
   - 填寫排班資訊：
     - **志工 ID**：選擇要排班的志工
     - **日期**：排班日期
     - **開始時間**：例如「09:00」
     - **結束時間**：例如「17:00」
     - **班別**：morning（早班）/ afternoon（午班）/ evening（晚班）
     - **工作內容**：例如「導覽解說」、「活動支援」
     - **備註**：特殊說明（選填）

3. **儲存排班**
   - 系統自動通知志工（未來功能）
   - 志工可在個人班表中查看

### 查看班表

**管理員可以：**
- 查看所有志工的班表
- 按日期篩選
- 按志工篩選
- 查看班表狀態（已排班、已簽到、已簽退、已取消）

**志工可以：**
- 查看個人班表
- 查看未來排班
- 查看歷史排班記錄

### 更新排班狀態

排班狀態流程：

```
scheduled（已排班）
    ↓ 志工簽到
checked_in（已簽到）
    ↓ 志工簽退
checked_out（已簽退）
    ↓ 或取消
cancelled（已取消）
```

### 資料庫結構

**schedules 表**

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INT | 主鍵，自動遞增 |
| volunteerId | INT | 關聯到 volunteers 表 |
| date | DATE | 排班日期 |
| startTime | TIME | 開始時間 |
| endTime | TIME | 結束時間 |
| shift | ENUM | morning / afternoon / evening |
| task | TEXT | 工作內容 |
| status | ENUM | scheduled / checked_in / checked_out / cancelled |
| notes | TEXT | 備註 |
| createdAt | TIMESTAMP | 建立時間 |
| updatedAt | TIMESTAMP | 更新時間 |

---

## 打卡系統

### 簽到流程

**志工操作：**

1. **進入志工專區**（規劃中）
   - 訪問 `/volunteer`
   - 查看今日班表

2. **點擊「簽到」**
   - 系統記錄簽到時間
   - 更新排班狀態為「已簽到」
   - 建立打卡記錄

3. **確認簽到成功**
   - 顯示簽到時間
   - 顯示預計簽退時間

### 簽退流程

**志工操作：**

1. **完成服務後點擊「簽退」**
   - 系統記錄簽退時間
   - 自動計算服務時數
   - 更新排班狀態為「已簽退」

2. **確認簽退成功**
   - 顯示簽退時間
   - 顯示本次服務時數
   - 更新累計服務時數

### 自動計算工時

系統自動計算：
- **單次服務時數** = 簽退時間 - 簽到時間
- **累計服務時數** = 所有已簽退記錄的時數總和

時數以**分鐘**為單位儲存，顯示時轉換為小時。

### 查詢打卡記錄

**管理員可以：**
- 查看所有志工的打卡記錄
- 按日期範圍篩選
- 按志工篩選
- 匯出打卡記錄（未來功能）

**志工可以：**
- 查看個人打卡記錄
- 查看每次服務時數
- 查看累計服務時數

### 資料庫結構

**attendances 表**

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INT | 主鍵，自動遞增 |
| scheduleId | INT | 關聯到 schedules 表 |
| volunteerId | INT | 關聯到 volunteers 表 |
| checkInTime | DATETIME | 簽到時間 |
| checkOutTime | DATETIME | 簽退時間（可為空） |
| workHours | INT | 服務時數（分鐘） |
| notes | TEXT | 備註 |
| createdAt | TIMESTAMP | 建立時間 |
| updatedAt | TIMESTAMP | 更新時間 |

---

## 請假換班系統

### 請假申請流程

**志工操作：**

1. **進入志工專區**（規劃中）
   - 訪問 `/volunteer`
   - 點擊「請假/換班」

2. **填寫請假申請**
   - **類型**：選擇「請假」
   - **排班 ID**：選擇要請假的班次
   - **原因**：填寫請假原因
   - **備註**：其他說明（選填）

3. **提交申請**
   - 系統記錄申請時間
   - 狀態設為「待審核」
   - 通知管理員（未來功能）

### 換班申請流程

**志工操作：**

1. **填寫換班申請**
   - **類型**：選擇「換班」
   - **排班 ID**：選擇要換班的班次
   - **替代志工 ID**：選擇替代的志工（選填）
   - **原因**：填寫換班原因
   - **備註**：其他說明（選填）

2. **提交申請**
   - 系統記錄申請
   - 通知管理員和替代志工（未來功能）

### 審核流程

**管理員操作：**

1. **查看待審核申請**
   - 進入管理員後台
   - 查看「請假/換班申請」列表
   - 篩選「pending」狀態的申請

2. **審核申請**
   - 點擊申請查看詳情
   - 選擇「核准」或「拒絕」
   - 填寫審核備註（選填）

3. **核准申請**
   - 狀態更新為「approved」
   - 如果是請假：原排班狀態更新為「cancelled」
   - 如果是換班：建立新的排班給替代志工
   - 通知志工（未來功能）

4. **拒絕申請**
   - 狀態更新為「rejected」
   - 原排班維持不變
   - 通知志工並說明原因（未來功能）

### 申請狀態流程

```
pending（待審核）
    ↓ 管理員審核
approved（已核准）或 rejected（已拒絕）
```

### 資料庫結構

**leaveRequests 表**

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INT | 主鍵，自動遞增 |
| scheduleId | INT | 關聯到 schedules 表 |
| volunteerId | INT | 申請人（關聯到 volunteers 表） |
| type | ENUM | leave（請假）/ swap（換班） |
| reason | TEXT | 申請原因 |
| replacementVolunteerId | INT | 替代志工 ID（換班時使用） |
| status | ENUM | pending / approved / rejected |
| reviewedBy | INT | 審核人（關聯到 users 表） |
| reviewedAt | DATETIME | 審核時間 |
| reviewNotes | TEXT | 審核備註 |
| createdAt | TIMESTAMP | 申請時間 |
| updatedAt | TIMESTAMP | 更新時間 |

---

## API 說明

### 志工管理 API

#### 建立志工
```typescript
trpc.volunteers.create.useMutation({
  userId: number,
  specialty?: string,
  availableTime?: string,
  emergencyContact?: string,
  emergencyPhone?: string
})
```

#### 查詢所有志工（管理員）
```typescript
trpc.volunteers.getAll.useQuery()
```

#### 查詢個人檔案（志工）
```typescript
trpc.volunteers.getMyProfile.useQuery()
```

---

### 排班管理 API

#### 建立排班（管理員）
```typescript
trpc.schedules.create.useMutation({
  volunteerId: number,
  date: string,        // 格式：YYYY-MM-DD
  startTime: string,   // 格式：HH:MM
  endTime: string,     // 格式：HH:MM
  shift: 'morning' | 'afternoon' | 'evening',
  task: string,
  notes?: string
})
```

#### 查詢所有排班（管理員）
```typescript
trpc.schedules.getAll.useQuery()
```

#### 查詢個人班表（志工）
```typescript
trpc.schedules.getMySchedules.useQuery()
```

#### 更新排班狀態
```typescript
trpc.schedules.updateStatus.useMutation({
  scheduleId: number,
  status: 'scheduled' | 'checked_in' | 'checked_out' | 'cancelled'
})
```

---

### 打卡系統 API

#### 簽到
```typescript
trpc.attendances.checkIn.useMutation({
  scheduleId: number,
  notes?: string
})
```

**返回：**
```typescript
{
  id: number,
  scheduleId: number,
  volunteerId: number,
  checkInTime: Date,
  checkOutTime: null,
  workHours: 0,
  notes: string | null
}
```

#### 簽退
```typescript
trpc.attendances.checkOut.useMutation({
  attendanceId: number,
  notes?: string
})
```

**返回：**
```typescript
{
  id: number,
  checkOutTime: Date,
  workHours: number  // 自動計算的服務時數（分鐘）
}
```

#### 查詢打卡記錄（志工）
```typescript
trpc.attendances.getMyRecords.useQuery()
```

#### 查詢所有打卡記錄（管理員）
```typescript
trpc.attendances.getAll.useQuery()
```

---

### 請假換班 API

#### 建立請假/換班申請
```typescript
trpc.leaveRequests.create.useMutation({
  scheduleId: number,
  type: 'leave' | 'swap',
  reason: string,
  replacementVolunteerId?: number,  // 換班時必填
  notes?: string
})
```

#### 查詢我的申請（志工）
```typescript
trpc.leaveRequests.getMyRequests.useQuery()
```

#### 查詢所有申請（管理員）
```typescript
trpc.leaveRequests.getAll.useQuery()
```

#### 審核申請（管理員）
```typescript
trpc.leaveRequests.approve.useMutation({
  requestId: number,
  reviewNotes?: string
})

trpc.leaveRequests.reject.useMutation({
  requestId: number,
  reviewNotes?: string
})
```

---

## 使用流程

### 完整工作流程範例

#### 情境一：正常排班與打卡

1. **管理員建立排班**
   ```
   日期：2024-11-25
   志工：王小明
   時間：09:00-17:00
   班別：早班
   工作：導覽解說
   ```

2. **志工查看班表**
   - 登入系統
   - 查看個人班表
   - 確認 11/25 的排班

3. **當天簽到**
   - 11/25 09:00 抵達防災館
   - 點擊「簽到」
   - 系統記錄簽到時間：09:02

4. **當天簽退**
   - 17:00 完成服務
   - 點擊「簽退」
   - 系統記錄簽退時間：17:05
   - 自動計算服務時數：478 分鐘（約 8 小時）
   - 更新累計服務時數

---

#### 情境二：請假申請

1. **志工發現無法出勤**
   - 11/23 發現 11/25 無法出勤
   - 進入志工專區
   - 選擇 11/25 的排班
   - 點擊「申請請假」

2. **填寫請假申請**
   ```
   類型：請假
   原因：家中有事
   備註：抱歉臨時無法出勤
   ```

3. **管理員審核**
   - 收到請假申請通知
   - 查看申請詳情
   - 評估是否核准
   - 點擊「核准」
   - 填寫審核備註：「已核准，請注意安全」

4. **系統自動處理**
   - 請假狀態更新為「approved」
   - 原排班狀態更新為「cancelled」
   - 通知志工核准結果
   - 管理員可重新安排其他志工

---

#### 情境三：換班申請

1. **志工A需要換班**
   - 11/23 發現 11/25 無法出勤
   - 找到志工B願意替代
   - 進入志工專區
   - 選擇 11/25 的排班
   - 點擊「申請換班」

2. **填寫換班申請**
   ```
   類型：換班
   替代志工：李小華（志工B）
   原因：家中有事
   備註：已與李小華確認
   ```

3. **管理員審核**
   - 收到換班申請
   - 確認李小華是否可以出勤
   - 點擊「核准」

4. **系統自動處理**
   - 換班狀態更新為「approved」
   - 原排班（志工A）狀態更新為「cancelled」
   - 建立新排班給志工B
   - 通知兩位志工

---

## 常見問題

### Q1：志工如何註冊？

**A：** 志工需要先註冊為系統使用者，然後由管理員在後台建立志工檔案並關聯到該使用者帳號。

---

### Q2：忘記簽退怎麼辦？

**A：** 目前需要聯繫管理員手動處理。未來版本會提供補簽功能。

---

### Q3：可以取消已核准的請假嗎？

**A：** 目前系統不支援取消已核准的請假。如需恢復排班，請聯繫管理員重新建立排班。

---

### Q4：服務時數如何計算？

**A：** 系統自動計算簽退時間減去簽到時間，以分鐘為單位儲存。顯示時會轉換為小時（例如：478 分鐘 = 7.97 小時）。

---

### Q5：可以查看其他志工的班表嗎？

**A：** 
- **志工**：只能查看個人班表
- **管理員**：可以查看所有志工的班表

---

### Q6：換班需要替代志工同意嗎？

**A：** 目前系統不會自動通知替代志工。建議申請前先與替代志工確認，並在備註中說明已確認。未來版本會加入替代志工確認機制。

---

### Q7：請假會影響服務時數嗎？

**A：** 請假的班次不會計入服務時數。只有實際簽到簽退的記錄才會累計服務時數。

---

### Q8：可以提前多久申請請假？

**A：** 系統沒有限制申請時間。建議盡早申請，讓管理員有充足時間安排替代人力。

---

### Q9：管理員可以代替志工打卡嗎？

**A：** 目前系統設計為志工本人打卡。如有特殊情況，管理員可以直接在資料庫中建立打卡記錄。

---

### Q10：如何查看累計服務時數？

**A：** 
- **志工**：登入後在個人檔案頁面查看
- **管理員**：在志工管理頁面查看所有志工的服務時數

---

## 未來規劃

### 短期規劃（1-3 個月）

1. **志工專區前端介面**
   - 個人班表日曆檢視
   - 打卡簽到/簽退按鈕
   - 請假/換班申請表單
   - 服務時數統計圖表

2. **推播通知**
   - 排班通知
   - 請假/換班審核結果通知
   - 打卡提醒

3. **補簽功能**
   - 忘記簽到/簽退時可申請補簽
   - 管理員審核補簽申請

### 中期規劃（3-6 個月）

1. **換班確認機制**
   - 替代志工需確認才能完成換班
   - 換班狀態追蹤

2. **排班範本**
   - 建立常用排班範本
   - 一鍵套用範本

3. **服務時數匯出**
   - 匯出 Excel 報表
   - 按月份統計
   - 志工服務證明

### 長期規劃（6-12 個月）

1. **手機 App**
   - 原生 App 或 PWA
   - 推播通知
   - 離線打卡

2. **GPS 定位打卡**
   - 確認志工在防災館範圍內
   - 防止代打卡

3. **志工評價系統**
   - 服務品質評分
   - 志工表現追蹤

---

## 技術支援

如有任何問題或建議，請聯繫：

- **GitHub Issues**: https://github.com/Eddycollab/-taitung-disaster-system/issues
- **Email**: huanchenlin@gmail.com

---

© 2024 台東防災館綜合管理系統. All rights reserved.
