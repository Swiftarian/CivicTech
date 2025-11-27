import time
import os
import re
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# ==========================================
# 使用者設定區 (請修改這裡)
# ==========================================

# 1. 登入頁面網址
LOGIN_URL = "https://fps6.nfa.gov.tw/nfa14/KernelServlet" 

# 2. 關鍵按鈕的 XPath (通常不需要修改，除非按鈕文字變了)
# 策略：直接找網頁上所有 value 屬性為 "維護" 的 input 按鈕
# XPath 語法： (//input[@value='維護'])[第幾個]
MAINTENANCE_BUTTON_XPATH_TEMPLATE = "(//input[@value='維護'])[{row_index}]"

# 彈出視窗中的「列管場所基本資料(Excel)」按鈕 XPath
# 如果您的按鈕文字不同，請修改這裡的 value 值
DOWNLOAD_BUTTON_XPATH = "//input[@value='列管場所基本資料(Excel)']" 

# 「回上層」按鈕 XPath
BACK_BUTTON_XPATH = "//input[@value='回上層']"

# 下一頁按鈕 XPath
NEXT_PAGE_BUTTON_XPATH = "//a[contains(text(), '下一頁')]"

# ==========================================
# 程式邏輯區 (通常不需要修改)
# ==========================================

def setup_driver():
    """初始化 Chrome 瀏覽器"""
    options = webdriver.ChromeOptions()
    # 保持瀏覽器開啟，即使程式結束
    options.add_experimental_option("detach", True)
    
    # 設定下載路徑為當前目錄下的 downloads 資料夾
    download_dir = os.path.join(os.getcwd(), "downloads")
    if not os.path.exists(download_dir):
        os.makedirs(download_dir)
        
    prefs = {"download.default_directory": download_dir}
    options.add_experimental_option("prefs", prefs)
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    return driver, download_dir

def main():
    driver, download_dir = setup_driver()
    
    try:
        print("正在開啟瀏覽器...")
        if LOGIN_URL.startswith("http"):
             driver.get(LOGIN_URL)
        else:
            print("警告：未設定正確的登入網址，請手動在瀏覽器輸入網址。")

        print("==========================================")
        print("請在瀏覽器中手動完成登入。")
        print("登入完成並進入「列管場所」列表頁面後，")
        input("請按 Enter 鍵開始自動下載流程...")
        print("==========================================")

        page_count = 1
        while True:
            print(f"正在處理第 {page_count} 頁...")
            
            # 重新抓取本頁有多少個「維護」按鈕
            maintenance_btns = driver.find_elements(By.XPATH, "//input[@value='維護']")
            total_rows = len(maintenance_btns)
            print(f"本頁偵測到 {total_rows} 筆資料")

            if total_rows == 0:
                print("警告：本頁找不到任何「維護」按鈕，請確認頁面是否正確，或按鈕文字是否為「維護」。")
                break
            
            # XPath 的索引是從 1 開始
            for i in range(1, total_rows + 1):
                try:
                    print(f"  正在處理第 {i} 筆...")
                    
                    # 1. 點擊「維護」按鈕
                    xpath = MAINTENANCE_BUTTON_XPATH_TEMPLATE.format(row_index=i)
                    # 等待按鈕出現 (確保回到列表頁了)
                    maintenance_btn = WebDriverWait(driver, 10).until(
                        EC.element_to_be_clickable((By.XPATH, xpath))
                    )
                    
                    # === 抓取場所名稱 (用於檔名) ===
                    place_name = "Unknown"
                    try:
                        # 往上找 tr，再找第 2 個 td (場所名稱)
                        tr = maintenance_btn.find_element(By.XPATH, "./ancestor::tr")
                        raw_name = tr.find_element(By.XPATH, "./td[2]").text
                        # 移除檔名中的非法字元
                        place_name = re.sub(r'[\\/*?:"<>|]', "_", raw_name).strip()
                        print(f"    目標場所: {place_name}")
                    except Exception as e:
                        print(f"    ⚠️ 無法抓取場所名稱，將使用預設檔名。錯誤: {e}")
                    # ==========================

                    maintenance_btn.click()
                    
                    # 2. 點擊下載按鈕 (在同一頁面等待)
                    try:
                        print("    正在尋找下載按鈕...")
                        download_btn = WebDriverWait(driver, 10).until(
                            EC.element_to_be_clickable((By.XPATH, DOWNLOAD_BUTTON_XPATH))
                        )
                        
                        # 紀錄下載前的檔案列表
                        existing_files = set(os.listdir(download_dir))
                        
                        download_btn.click()
                        print("    已觸發下載...")
                        
                        # === 等待新檔案並重新命名 ===
                        new_file = None
                        for _ in range(30): # 最多等 30 秒
                            current_files = set(os.listdir(download_dir))
                            new_files = current_files - existing_files
                            # 過濾掉暫存檔 (.crdownload, .tmp)
                            valid_new_files = [f for f in new_files if not f.endswith('.crdownload') and not f.endswith('.tmp')]
                            
                            if valid_new_files:
                                new_file = valid_new_files[0]
                                break
                            time.sleep(1)
                            
                        if new_file:
                            old_path = os.path.join(download_dir, new_file)
                            # 取得副檔名 (通常是 .xls)
                            ext = os.path.splitext(new_file)[1]
                            new_filename = f"{place_name}{ext}"
                            new_path = os.path.join(download_dir, new_filename)
                            
                            # 如果檔名重複，加數字
                            counter = 1
                            while os.path.exists(new_path):
                                new_filename = f"{place_name}_{counter}{ext}"
                                new_path = os.path.join(download_dir, new_filename)
                                counter += 1
                                
                            # 等待檔案完全寫入 (避免被佔用)
                            time.sleep(1)
                            try:
                                os.rename(old_path, new_path)
                                print(f"    ✅ 檔案已儲存為: {new_filename}")
                            except Exception as rename_error:
                                print(f"    ⚠️ 改名失敗 (可能被佔用): {rename_error}")
                        else:
                            print("    ⚠️ 下載逾時或找不到新檔案")
                        # ==========================

                    except Exception as e:
                        print(f"    ❌ 下載失敗: 找不到按鈕或點擊無效。錯誤: {e}")
                        driver.save_screenshot(f"error_download_{page_count}_{i}.png")

                    # 3. 點擊「回上層」返回列表
                    try:
                        print("    正在返回列表...")
                        back_btn = WebDriverWait(driver, 10).until(
                            EC.element_to_be_clickable((By.XPATH, BACK_BUTTON_XPATH))
                        )
                        back_btn.click()
                        
                        # 等待列表頁重新載入 (等待第一個維護按鈕出現)
                        WebDriverWait(driver, 10).until(
                            EC.presence_of_element_located((By.XPATH, "//input[@value='維護']"))
                        )
                    except Exception as e:
                        print(f"    ❌ 返回列表失敗: {e}")
                        # 如果回不去，可能需要用瀏覽器的上一頁
                        driver.back()
                        time.sleep(2)

                    # 稍微休息一下
                    time.sleep(1)
                    
                except Exception as e:
                    print(f"  ❌ 處理第 {i} 筆時發生錯誤: {e}")
                    # 嘗試回到列表頁，以免卡住
                    try:
                        driver.back()
                    except:
                        pass

            # 處理完一頁，嘗試點擊下一頁
            # 處理完一頁，嘗試點擊下一頁
            try:
                print("正在尋找下一頁按鈕...")
                
                # 滾動到底部，確保按鈕在視野內
                driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                time.sleep(1)
                
                next_page_btn = None
                
                # 嘗試不同的 XPath 組合 (使用 . 來匹配所有子文字)
                possible_xpaths = [
                    "//a[contains(., '下一頁')]",           # 連結型式 (包含子元素)
                    "//a[contains(text(), '下一頁')]",      # 連結型式 (純文字)
                    "//input[@value='下一頁']",             # 按鈕型式
                    "//a[contains(., 'Next')]",            # 英文連結
                    "//input[@value='Next']",              # 英文按鈕
                    "//a[contains(., '>')]",               # 符號連結
                    "//a[@id='ctl00_ContentPlaceHolder1_GridView1_ctl01_LinkButtonNext']" # 常見 ASP.NET ID
                ]
                
                for xpath in possible_xpaths:
                    try:
                        element = driver.find_element(By.XPATH, xpath)
                        if element and element.is_displayed():
                            print(f"  找到下一頁按鈕 (XPath: {xpath})")
                            next_page_btn = element
                            break
                    except:
                        continue

                if next_page_btn:
                    # 檢查是否為 disabled
                    if "disabled" in next_page_btn.get_attribute("class") or \
                       next_page_btn.get_attribute("href") is None:
                        print("已到達最後一頁 (按鈕失效)，任務結束。")
                        break
                    
                    print("前往下一頁...")
                    # 使用 JavaScript 點擊，避免被其他元素遮擋
                    driver.execute_script("arguments[0].click();", next_page_btn)
                    page_count += 1
                    time.sleep(5) # 等待頁面載入
                else:
                    print("⚠️ 自動尋找下一頁失敗。")
                    print("請您手動點擊瀏覽器中的「下一頁」按鈕，")
                    input("點擊完畢後，請在這裡按下 Enter 鍵繼續...")
                    page_count += 1
                    time.sleep(2)
                    
            except Exception as e:
                print(f"換頁時發生錯誤: {e}")
                print("請您手動點擊瀏覽器中的「下一頁」按鈕，")
                input("點擊完畢後，請在這裡按下 Enter 鍵繼續...")
                page_count += 1

    except Exception as e:
        print(f"發生未預期的錯誤: {e}")
    finally:
        print("程式結束。因為設定了 detach，瀏覽器應該會保持開啟。")

if __name__ == "__main__":
    main()
