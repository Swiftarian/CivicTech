# 自動化測試系統

本專案使用 Streamlit 原生測試框架 (`streamlit.testing`) 進行自動化測試，無需手動開啟瀏覽器即可驗證功能。

## 安裝依賴

確保已安裝 pytest（測試執行框架）：
```bash
pip install pytest
```

## 執行測試

### 方法 1：直接執行測試腳本
```bash
cd d:\下載\fire_dept_automation
python tests\test_app.py
```

### 方法 2：使用 pytest 執行（推薦）
```bash
cd d:\下載\fire_dept_automation
pytest tests\test_app.py -v
```

參數說明：
- `-v`：顯示詳細輸出
- `-s`：顯示 print 輸出
- `-k test_home`：只執行名稱包含 "test_home" 的測試

## 測試項目

### ✅ 已實作的測試

1. **test_home_page_loads**
   - 測試首頁是否正常載入
   - 檢查是否包含「臺東縣消防局」標題

2. **test_home_page_has_service_cards**
   - 測試首頁三個服務卡片是否正常顯示
   - 驗證消防申報、送餐、防災導覽卡片

3. **test_case_review_page_requires_login**
   - 測試案件審核頁面在未登入時的行為
   - 確保不會崩潰

4. **test_case_review_page_with_admin_login**
   - 模擬管理員登入
   - 測試案件審核頁面是否正常運作

5. **test_database_connection**
   - 測試資料庫連線
   - 驗證基本查詢功能

6. **test_museum_page_loads**
   - 測試防災館導覽頁面載入

7. **test_meal_delivery_page_loads**
   - 測試社區送餐頁面載入

## 測試輸出範例

```
==================================================
開始執行自動化測試...
==================================================

 Testing: 首頁載入...
✅ 首頁載入測試通過

 Testing: 首頁服務卡片...
✅ 首頁服務卡片測試通過

 Testing: 案件審核（未登入）...
✅ 未登入狀態測試通過

 Testing: 案件審核（管理員）...
✅ 管理員登入測試通過

 Testing: 資料庫連線...
✅ 資料庫連線測試通過

 Testing: 防災館頁面...
✅ 防災館頁面載入測試通過

 Testing: 送餐頁面...
✅ 送餐頁面載入測試通過

==================================================
測試完成！通過: 7, 失敗: 0
==================================================
```

## 擴充測試

若要新增測試，請在 `tests/test_app.py` 中仿照現有格式添加函式：

```python
def test_your_feature():
    """測試您的功能"""
    at = AppTest.from_file("your_page.py")
    
    # 設定 session state（如需要）
    at.session_state["key"] = "value"
    
    # 執行頁面
    at.run()
    
    # 斷言檢查
    assert not at.exception
    assert "expected_text" in str(at.main)
```

## 持續整合 (CI/CD)

可將測試整合至 GitHub Actions：

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      - run: pip install -r requirements.txt
      - run: pytest tests/test_app.py
```

## 注意事項

1. 測試前請確保 `cases.db` 資料庫存在
2. 某些測試需要模擬 Session State
3. 測試不會修改實際資料庫
4. 如果測試失敗，檢查錯誤訊息中的詳細資訊
