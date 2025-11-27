# 臺東縣消防局公私協力防災媒合平台 - 專案憲法

## 📋 專案概述

**專案名稱**：臺東縣消防局公私協力防災媒合平台  
**版本**：2.0  
**建立日期**：2024-11  
**維護單位**：臺東縣消防局預防調查科

本系統為整合型政府服務平台，包含三大子系統：
1. **消防檢修申報系統** - 自動化審核與比對
2. **社區互助送餐系統** - 長照餐食配送管理
3. **防災智慧導覽系統** - 防災教育館預約與知識庫

---

## 🏗️ 技術堆疊

### 核心框架
- **前端框架**：Streamlit 1.29+
- **程式語言**：Python 3.9+
- **資料庫**：SQLite 3+
- **版本控制**：Git

### 關鍵套件
```txt
streamlit >= 1.29.0
streamlit-calendar  # 日曆元件
pandas >= 1.5.3
pillow >= 10.0.0    # 圖片處理
PyPDF2 >= 3.0.1     # PDF 解析
python-docx         # Word 文件處理
```

### 資料夾結構
```
fire_dept_automation/
├── 首頁.py                    # 主入口
├── config.toml                # 系統設定
├── db_manager.py              # 資料庫操作層
├── utils.py                   # 共用工具函式
├── auth.py                    # 身份驗證
├── pages/                     # 功能模組
│   ├── 1_民眾申辦.py
│   ├── 2_進度查詢.py
│   ├── 2_🍱_社區互助送餐.py
│   ├── 3_案件審核.py
│   ├── 3_📢_防災智慧導覽.py
│   └── 4_自動比對系統.py
├── tests/                     # 自動化測試
│   ├── test_app.py
│   ├── test_meal_delivery.py
│   └── test_meal_backend.py
├── uploads/                   # 上傳檔案儲存
│   ├── delivery_photos/
│   └── delivery_proofs/
└── backups/                   # 資料庫備份

```

---

## 🎨 開發規範

### 1. 程式碼風格

#### 命名慣例
- **檔案名稱**：使用中文描述性命名（配合 Streamlit 多頁面應用）
  - 格式：`{順序}_{emoji}_{功能名稱}.py`
  - 範例：`2_🍱_社區互助送餐.py`
  
- **函式命名**：小寫字母+底線（snake_case）
  ```python
  def get_all_tasks():
      pass
  
  def create_delivery_record():
      pass
  ```

- **類別命名**：駝峰式（PascalCase）
  ```python
  class DatabaseManager:
      pass
  ```

#### 文件字串
- 所有函式必須包含 docstring
- 使用繁體中文描述功能
- 包含參數說明和回傳值

```python
def save_proof_photo(file_buffer, task_id):
    """
    儲存送達證明照片（強制拍照模式）
    
    Args:
        file_buffer: Streamlit camera_input 的 buffer
        task_id: 任務 ID
        
    Returns:
        str: 儲存的檔案相對路徑
    """
    pass
```

### 2. 資料庫設計原則

#### Schema 命名
- 表格名稱：複數形式 + 底線分隔
  - 範例：`delivery_records`, `daily_tasks`, `elderly_profiles`

#### 欄位命名
- 主鍵：`id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- 時間戳記：`created_at`, `updated_at`
- 外鍵：`{table}_id`（如 `route_id`, `task_id`）

#### 資料完整性
- 使用 FOREIGN KEY 約束
- 設定合理的 DEFAULT 值
- 必要欄位設為 NOT NULL

### 3. 前端 UI 規範

#### 頁面結構
```python
import streamlit as st
import db_manager as db
import utils

st.set_page_config(page_title="頁面標題", page_icon="📱", layout="wide")

# 載入設定
config = utils.load_config()

# 身份驗證
username = utils.check_login()

# 主要內容
def main():
    st.title("主標題")
    # ... 功能實作
    
if __name__ == "__main__":
    main()
```

#### 視覺一致性
- **Hero Section**：使用全寬圖片 + 標題覆蓋
- **配色**：統一使用 `custom.css` 定義的色彩
- **按鈕**：
  - 主要操作：`type="primary"`
  - 危險操作：`type="secondary"` + 紅色圖示
- **表單**：使用 `st.form` 避免頻繁重載

### 4. 權限控制 (RBAC)

#### 角色定義
- `admin`：完整系統權限
- `staff`：案件審核、報表檢視
- `volunteer`：送餐任務執行
- `user`：一般民眾（申辦、查詢）

#### 檢查方式
```python
def check_admin():
    user_info = db.get_user(st.session_state['username'])
    if user_info['role'] != 'admin':
        st.error("此功能僅限管理員使用")
        st.stop()
```

### 5. 檔案上傳處理

#### 路徑組織
- 按月份分類：`uploads/{category}/{YYYYMM}/`
- 唯一命名：`{prefix}_{id}_{timestamp}.{ext}`

#### 圖片處理
- 壓縮至 800px 寬度（保持比例）
- 轉換為 JPEG 格式
- 品質設定：85

```python
image = Image.open(file_buffer)
if image.width > 800:
    ratio = 800 / image.width
    new_height = int(image.height * ratio)
    image = image.resize((800, new_height), Image.Resampling.LANCZOS)
image.save(file_path, "JPEG", quality=85)
```

---

## 🔧 設定管理

### config.toml 結構
```toml
[organization]
name = "臺東縣消防局"
full_name = "臺東縣消防局預防調查科"
phone = "089-XXXXXX"
email = "museum@ttfd.gov.tw"
address = "臺東縣臺東市中山路XXX號"

[system]
platform_name = "臺東縣消防局公私協力防災媒合平台"
database = "cases.db"
backup_retention_days = 30

[features]
enable_meal_delivery = true
enable_museum_booking = true
enable_inspection_review = true
```

### 讀取設定
```python
import tomli

def load_config():
    with open("config.toml", "rb") as f:
        return tomli.load(f)
```

---

## 🧪 測試規範

### 測試檔案命名
- 格式：`test_{module_name}.py`
- 位置：`tests/` 資料夾

### 測試案例編寫
```python
import unittest

class TestMealBackend(unittest.TestCase):
    
    @classmethod
    def setUpClass(cls):
        """測試前準備"""
        db_manager.init_db()
    
    def test_1_seed_data(self):
        """測試 1: 種子資料"""
        # ... 測試邏輯
```

### 執行測試
```bash
# 單一測試
python -m unittest tests/test_meal_backend.py

# 所有測試
python -m unittest discover tests/
```

---

## 📦 部署指南

### 環境需求
- Python 3.9+
- 虛擬環境 (venv 或 conda)
- 足夠的磁碟空間（備份與上傳檔案）

### 安裝步驟
```bash
# 1. 建立虛擬環境
python -m venv .venv
.venv\Scripts\activate

# 2. 安裝套件
pip install -r requirements.txt

# 3. 初始化資料庫
python -c "import db_manager; db_manager.init_db()"

# 4. 啟動系統
streamlit run 首頁.py
```

### 生產環境設定
- 使用反向代理（Nginx）
- 啟用 HTTPS
- 定期備份資料庫（每日）
- 監控系統日誌

---

## 🔐 安全性原則

1. **密碼處理**：使用 PBKDF2 + Salt 雜湊
2. **SQL 注入防護**：使用參數化查詢
3. **檔案上傳驗證**：檢查副檔名和 MIME 類型
4. **Session 管理**：Streamlit 內建 session_state
5. **敏感資訊**：不在程式碼中硬編碼，使用 config.toml

---

## 📝 版本控制規範

### Commit Message 格式
```
<type>: <subject>

<body>
```

#### Type 類型
- `feat`: 新功能
- `fix`: 錯誤修復
- `docs`: 文件更新
- `refactor`: 程式碼重構
- `test`: 測試相關
- `chore`: 建置或輔助工具

#### 範例
```
feat: 實作強制拍照驗證功能

- 新增 save_proof_photo 函式
- 更新 Tab 1 為兩階段送達流程
- 管理報表新增 ImageColumn
```

---

## 🌐 縣市復用指南

### 客製化步驟

1. **修改 config.toml**
   ```toml
   [organization]
   name = "新北市消防局"  # 修改機關名稱
   phone = "02-XXXXXXXX"  # 修改聯絡電話
   ```

2. **更新 Hero 圖片**
   - 替換 `uploads/hero/` 中的圖片
   - 或使用 `generate_image` 工具生成

3. **調整功能模組**
   - 在 `config.toml` 中啟用/停用功能
   - 不需要的頁面可移至 `_archive/`

4. **資料庫初始化**
   ```bash
   python -c "import db_manager; db_manager.init_db()"
   ```

---

## 👥 貢獻者

- **PM/開發**：臺東縣消防局預防調查科
- **技術支援**：Google Deepmind (Antigravity AI)
- **框架**：Streamlit

---

## 📞 聯絡資訊

如有系統問題或功能建議，請聯絡：
- **Email**：prevention@ttfd.gov.tw
- **電話**：089-XXXXXX
- **地址**：臺東縣臺東市中山路XXX號

---

**最後更新**：2024-11-24  
**文件版本**：1.0
