# 台東防災館綜合管理系統 - 圖片管理指南

本文件說明如何替換網站上的圖片，包括首頁icon、Logo、Banner背景等。

---

## 圖片檔案位置

所有網站圖片都存放在專案的 `client/public/images/` 目錄下：

| 圖片類型 | 檔案路徑 | 建議尺寸 | 檔案格式 |
|---------|---------|---------|---------|
| 網站Logo | `/images/taitung-fire-dept-logo.png` | 高度 40-60px | PNG（透明背景） |
| 首頁Banner背景 | `/images/taitung-culture.jpg` | 1920x800px | JPG |
| 團體預約icon | `/images/icons/group-booking.png` | 80x80px | PNG |
| 一般民眾預約icon | `/images/icons/individual-booking.png` | 80x80px | PNG |
| 導覽預約icon | `/images/icons/tour-guide.jpg` | 128x96px | JPG |
| 案件查詢icon | `/images/icons/case-query.jpg` | 128x96px | JPG |
| 送餐服務icon | `/images/icons/meal-delivery.jpg` | 128x96px | JPG |
| 關於我們圖片 | `/images/about.jpg` | 600x400px | JPG |

---

## 替換圖片的方法

### 方法一：透過程式碼編輯（推薦）

1. **準備新圖片**：確保新圖片符合建議尺寸和格式

2. **上傳圖片到專案**：將新圖片複製到 `client/public/images/` 目錄下

3. **替換舊檔案**：
   - 如果使用相同檔名，直接覆蓋舊檔案即可
   - 如果使用新檔名，需要修改對應的程式碼

4. **重新部署**：儲存checkpoint並發布網站

### 方法二：透過Manus管理介面

1. 在Manus聊天視窗中上傳新圖片

2. 告知Manus您想要替換哪個圖片

3. Manus會自動處理圖片替換和程式碼更新

---

## 各區塊圖片對應說明

### 首頁Banner背景

**檔案**：`/images/taitung-culture.jpg`

**程式碼位置**：`client/src/pages/Home.tsx` 第19行

```javascript
const heroBackground = "/images/taitung-culture.jpg";
```

**替換步驟**：
1. 準備新的背景圖片（建議寬度至少1920px）
2. 將圖片命名為 `taitung-culture.jpg` 並放入 `/images/` 目錄
3. 或修改程式碼中的檔案路徑指向新圖片

---

### 網站Logo

**檔案**：`/images/taitung-fire-dept-logo.png`

**程式碼位置**：
- `client/src/const.ts` 第5行
- `client/src/pages/Home.tsx` 導覽列區塊

```javascript
// const.ts
export const APP_LOGO = "/images/taitung-fire-dept-logo.png";
```

**替換步驟**：
1. 準備新的Logo圖片（建議使用PNG透明背景）
2. 將圖片命名為 `taitung-fire-dept-logo.png` 並放入 `/images/` 目錄
3. 或修改 `const.ts` 中的 `APP_LOGO` 路徑

---

### 快速預約區塊icon

**檔案位置**：`/images/icons/`

| 項目 | 檔案名稱 |
|-----|---------|
| 團體預約 | `group-booking.png` |
| 一般民眾預約 | `individual-booking.png` |

**程式碼位置**：`client/src/pages/Home.tsx` 第118-160行

**替換步驟**：
1. 準備新的icon圖片（建議80x80px，PNG格式）
2. 使用相同檔名替換 `/images/icons/` 目錄下的檔案

---

### 服務項目區塊icon

**檔案位置**：`/images/icons/`

| 項目 | 檔案名稱 |
|-----|---------|
| 導覽預約 | `tour-guide.jpg` |
| 案件查詢 | `case-query.jpg` |
| 送餐服務 | `meal-delivery.jpg` |

**程式碼位置**：`client/src/pages/Home.tsx` 第166-225行

**替換步驟**：
1. 準備新的icon圖片（建議128x96px或相近比例）
2. 使用相同檔名替換 `/images/icons/` 目錄下的檔案

---

## 圖片優化建議

### 檔案大小

為了確保網站載入速度，建議圖片檔案大小：

| 圖片類型 | 建議大小上限 |
|---------|-------------|
| Logo | 50KB |
| Icon | 100KB |
| Banner背景 | 500KB |
| 一般圖片 | 200KB |

### 圖片壓縮工具

推薦使用以下工具壓縮圖片：

- **TinyPNG** (https://tinypng.com/) - 適合PNG和JPG
- **Squoosh** (https://squoosh.app/) - Google開發的線上壓縮工具
- **ImageOptim** - Mac桌面應用程式

### 圖片格式選擇

| 情境 | 建議格式 |
|-----|---------|
| 需要透明背景 | PNG |
| 照片類圖片 | JPG |
| 簡單圖形/icon | PNG 或 SVG |
| 動畫 | GIF 或 WebP |

---

## 常見問題

### Q: 替換圖片後網站沒有更新？

**A**: 可能是瀏覽器快取問題，請嘗試：
1. 按 `Ctrl + F5`（Windows）或 `Cmd + Shift + R`（Mac）強制重新整理
2. 清除瀏覽器快取
3. 使用無痕模式開啟網站

### Q: 圖片顯示變形？

**A**: 請確保新圖片的長寬比與原圖片相近。如果比例差異太大，可能需要調整CSS樣式。

### Q: 如何新增更多icon？

**A**: 
1. 將新圖片放入 `/images/icons/` 目錄
2. 在對應的程式碼中新增 `<img>` 標籤引用新圖片

---

## 聯絡支援

如需協助，請透過Manus聊天視窗詢問，或聯絡系統管理員。

---

## 4. 關於防災館輪播圖片

輪播圖片存放在 `client/public/images/gallery/` 目錄下，用於展示防災館的設施照片。

### 目前的輪播圖片

| 檔案名稱 | 說明 | 建議尺寸 |
|---------|------|----------|
| building-exterior.jpg | 台東防災館外觀 | 1200x900px (4:3) |
| earthquake-simulation.jpg | 地震模擬區 | 1200x900px (4:3) |
| climate-globe.jpg | 即時氣候投影球 | 1200x900px (4:3) |
| fire-rescue-experience.jpg | 消防救災飛行體驗區 | 1200x900px (4:3) |

### 如何替換輪播圖片

1. 準備新的圖片檔案（建議使用 4:3 比例，解析度至少 1200x900px）
2. 將新圖片放入 `client/public/images/gallery/` 目錄
3. 使用相同的檔案名稱覆蓋舊圖片

### 如何新增輪播圖片

如需新增更多輪播圖片，需要修改 `client/src/pages/Home.tsx` 檔案：

1. 找到 `galleryImages` 陣列（約在第25行）
2. 新增一個物件，格式如下：
   ```javascript
   { src: "/images/gallery/新圖片檔名.jpg", title: "圖片標題", desc: "圖片描述" }
   ```
3. 將對應的圖片檔案放入 `client/public/images/gallery/` 目錄

### 輪播功能說明

- **自動輪播**：每4秒自動切換到下一張圖片
- **手動切換**：點擊左右箭頭按鈕可手動切換
- **指示點**：圖片下方的白色圓點可直接跳轉到指定圖片
- **設施快速瀏覽**：右側的設施按鈕可快速切換到對應圖片

### 圖片最佳化建議

- 使用 JPEG 格式，壓縮品質 80-85%
- 檔案大小控制在 200KB 以內
- 確保圖片清晰度足夠，避免模糊
- 保持一致的色調和風格

---

*文件更新日期：2025年12月*
