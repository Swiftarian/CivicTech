---
description: 上傳專案到 GitHub Swiftarian/CivicTech
---

# GitHub 上傳流程

## 環境需求
- Git 已安裝（需重新載入 PowerShell 以識別環境變數）
- GitHub 帳號權限

## 執行步驟

### 1. 遮蔽敏感資訊
修改 `config.toml` 中的個人資訊：
- 電話號碼遮蔽
- 地址遮蔽
- Email 遮蔽為範例

### 2. 重新載入 PowerShell 環境
關閉並重新開啟 PowerShell，或執行：
```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

### 3. 設定 Git Repository
```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

### 4. 連接遠端 Repository
如果是新的本地儲存庫：
```bash
git init
git remote add origin https://github.com/Swiftarian/CivicTech.git
```

如果已經是 Git 儲存庫：
```bash
git remote set-url origin https://github.com/Swiftarian/CivicTech.git
```

### 5. 提交並推送
```bash
git add .
git commit -m "feat: 更新消防局整合系統"
git push -u origin main
```

或推送到特定分支：
```bash
git push -u origin master
```

## 注意事項
- 確認 `.gitignore` 已正確設定
- 敏感檔案（secrets.toml, *.db, uploads/）不會被上傳
- 如需要輸入 GitHub 認證，可能需要使用 Personal Access Token
