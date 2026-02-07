# 送餐任務列表顯示問題診斷報告

## 日期
2026-02-07

## 問題描述
送餐服務管理頁面顯示「目前沒有送餐任務」，但資料庫中實際存在多筆送餐任務記錄。

## 診斷過程

### 1. 初步發現
- **前端症狀**：管理後台的送餐服務管理頁面顯示「目前沒有送餐任務」
- **後端確認**：資料庫 `mealDeliveries` 表中確實有 14 筆記錄（ID 2-14）
- **建立功能**：送餐任務建立功能正常，可以成功建立任務並發送 SMS 通知

### 2. 排查步驟

#### 2.1 前端檢查
- ✅ 前端程式碼邏輯正確（`MealDeliveryAdmin.tsx`）
- ✅ tRPC 查詢配置正確（`trpc.mealDeliveries.getAll.useQuery()`）
- ❌ 查詢返回空陣列或 undefined

#### 2.2 後端檢查
- ✅ `getAllMealDeliveries` 函數邏輯正確
- ✅ 資料庫連線正常
- ✅ SQL 查詢語法正確
- ❓ 函數執行過程中可能有錯誤（待確認）

#### 2.3 資料庫檢查
- ✅ `mealDeliveries` 表存在且有資料
- ✅ 表結構正確
- ✅ 資料完整性正常

### 3. 關鍵發現

從 Railway 部署日誌中發現：
1. `[getAllMealDeliveries] 開始查詢送餐任務` - 函數被成功調用
2. **缺少**「查詢完成，找到 X 筆送餐任務」的日誌 - 表示函數可能在執行過程中發生錯誤
3. 大量 `[Auth] Session verification failed JWSInvalid: Invalid Compact JWS` 錯誤

### 4. 已實施的修復措施

#### 4.1 添加詳細日誌（Commit: 53fac46）
在 `getAllMealDeliveries` 函數中添加：
- 開始查詢日誌
- 資料庫連線狀態日誌
- 查詢結果數量日誌
- 第一筆資料內容日誌

#### 4.2 添加錯誤捕獲（Commit: f399755）
使用 try-catch 包裹整個函數：
- 捕獲所有可能的錯誤
- 輸出詳細的錯誤訊息和堆疊
- 確保函數不會靜默失敗

## 待驗證項目

### 下一步診斷
1. **查看最新部署日誌**：確認 `getAllMealDeliveries` 函數的完整執行過程
2. **檢查錯誤訊息**：如果有錯誤，分析錯誤原因
3. **驗證資料返回**：確認函數是否正確返回資料

### 可能的問題方向
1. **資料庫查詢錯誤**：JOIN 操作或欄位選擇可能有問題
2. **資料格式問題**：返回的資料格式與前端期望不一致
3. **權限問題**：雖然使用 `adminProcedure`，但可能有其他權限限制
4. **tRPC 配置問題**：路由或序列化配置可能有問題

## 資料庫狀態

### mealDeliveries 表
- **總記錄數**：14 筆
- **最新記錄**：ID 14, 王小明, 0972911502, 台東縣十一路一段
- **狀態**：大部分記錄的 `volunteerId` 為 NULL（正常，因為尚未指派志工）

### deliveryTasks 表
- **狀態**：空表（正常）

### deliveryTracking 表
- **狀態**：空表（正常）

## 技術細節

### 後端 API
- **檔案**：`server/db.ts`
- **函數**：`getAllMealDeliveries()`
- **路由**：`routers.ts` - `mealDeliveries.getAll`
- **權限**：`adminProcedure`

### 前端組件
- **檔案**：`client/src/pages/MealDeliveryAdmin.tsx`
- **查詢**：`trpc.mealDeliveries.getAll.useQuery()`

### 資料庫
- **類型**：MySQL
- **ORM**：Drizzle ORM
- **表名**：`mealDeliveries`

## 建議後續行動

1. **立即**：等待最新部署完成，查看詳細日誌
2. **短期**：根據日誌中的錯誤訊息修復問題
3. **中期**：添加自動化測試確保查詢功能穩定
4. **長期**：考慮添加前端錯誤提示，讓用戶知道查詢失敗的原因

## 相關 Commits

- `f399755` - debug: 添加 getAllMealDeliveries 錯誤捕獲
- `53fac46` - debug: 添加 getAllMealDeliveries 詳細日誌
- `558d42c` - fix: 修復 React import 錯誤
- `d8c858d` - debug: 添加前端查詢日誌輸出
- `9f7e35f` - feat: 添加 debug API 用於診斷送餐任務列表問題

## 備註

- 所有修改已推送到 GitHub main 分支
- Railway 自動部署已觸發
- 建議明天繼續驗證並完成修復
