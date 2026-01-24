"""
設定檔讀取模組
提供統一的介面讀取 config.toml 設定
"""
import os

# 嘗試導入 tomli，如果沒安裝則使用預設值
try:
    import tomli
    TOMLI_AVAILABLE = True
except ImportError:
    TOMLI_AVAILABLE = False
    print("⚠️ tomli 未安裝，使用預設設定。執行 'pip install tomli' 以啟用設定檔功能。")

# 讀取配置檔
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.toml")

def load_config():
    """讀取 config.toml 設定檔"""
    if not TOMLI_AVAILABLE:
        return get_default_config()

    try:
        with open(CONFIG_PATH, "rb") as f:
            return tomli.load(f)
    except FileNotFoundError:
        # 如果找不到設定檔，使用預設值
        print("⚠️ 找不到 config.toml，使用預設設定")
        return get_default_config()
    except Exception as e:
        print(f"❌ 讀取設定檔失敗: {e}")
        return get_default_config()

def get_default_config():
    """預設設定（當 config.toml 不存在時使用）"""
    return {
        "agency": {
            "name": "臺東縣消防局",
            "department": "預防調查科",
            "full_name": "臺東縣消防局預防調查科",
            "phone": "089-322112",
            "address": "臺東縣臺東市...",
            "email": "fire@taitung.gov.tw"
        },
        "system": {
            "title": "消防安全設備檢修申報平台",
            "page_title": "消防安全設備檢修申報",
            "subtitle": "Fire Safety Equipment Inspection Automation System",
            "registration_key": "322112"
        },
        "ui": {
            "logo_path": "assets/logo.png",
            "favicon": "🚒",
            "primary_color": "#e53e3e",
            "secondary_color": "#1a365d"
        },
        "email": {
            "signature_org": "臺東縣消防局 預防調查科 敬啟",
            "auto_reply_notice": "【系統自動發信，請勿直接回覆】"
        },
        "ocr": {
            "default_excel_path": "d:\\下載\\downloads\\00. 列管場所資料.xls",
            "default_tesseract_path": "C:\\Program Files\\Tesseract-OCR\\tesseract.exe"
        },
        "features": {
            "enable_2fa": True,
            "enable_line_notify": False,
            "enable_ocr": True,
            "enable_self_registration": True
        }
    }

# 載入配置
CONFIG = load_config()

# 便捷存取變數
AGENCY_NAME = CONFIG["agency"]["name"]
DEPARTMENT_NAME = CONFIG["agency"]["department"]
FULL_AGENCY_NAME = CONFIG["agency"]["full_name"]
CONTACT_PHONE = CONFIG["agency"]["phone"]
SYSTEM_TITLE = CONFIG["system"]["title"]
PAGE_TITLE = CONFIG["system"]["page_title"]
# Security Fix: Allow overriding registration key via environment variable
REGISTRATION_KEY = os.environ.get("REGISTRATION_KEY", CONFIG["system"].get("registration_key", "322112"))
