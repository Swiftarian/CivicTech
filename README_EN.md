# 🏛️ CivicTech - Public-Private Disaster Prevention Integration System

English | **[繁體中文](README.md)**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://www.python.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)](https://www.typescriptlang.org/)

> **Taitung County Fire Department Public-Private Partnership Platform** - An integrated solution for fire safety reporting, volunteer management, meal delivery services, and disaster prevention education.

---

## 📖 Quick Navigation

| Document | Description |
|----------|-------------|
| [⚡ Quick Reference](docs/QUICK_REFERENCE.md) | Common commands and troubleshooting |
| [🔗 System Integration](docs/SYSTEM_INTEGRATION.md) | Complete connection and configuration guide |
| [📋 Contributing Guide](CONTRIBUTING.md) | How to contribute to this project |
| [📜 Code of Conduct](CODE_OF_CONDUCT.md) | Community guidelines |

---

## 🎯 Project Overview

CivicTech is an **open-source public-private disaster prevention integration platform** designed to help fire departments improve administrative efficiency, strengthen community disaster resilience, and optimize volunteer service management. This project uses a Monorepo architecture, integrating two core subsystems:

### 🔥 Fire Department Automation System (`fire_dept_automation`)

A disaster prevention service platform based on **Python + Streamlit**, providing:

- **📝 Online Fire Safety Inspection Reporting** - Citizens can fill out forms and upload documents online
- **🔍 OCR Auto-Comparison** - Tesseract OCR recognition for automatic comparison between reports and system data
- **🍱 Community Meal Delivery Service** - Long-term care meal delivery management, GPS route tracking, photo verification
- **🏛️ Disaster Prevention Museum Booking** - Group/individual reservations, time slot management
- **👮 Case Review Management** - Batch operations, status updates, automatic email notifications

### 👥 Volunteer Management System (`fire_volunteer_management`)

A full-stack application based on **React + TypeScript + Node.js**, providing:

- **📅 Smart Scheduling System** - Drag-and-drop volunteer scheduling management
- **⏰ Check-in/Check-out** - QR Code verification, GPS positioning
- **🚗 Meal Delivery Task Tracking** - Real-time route tracking, delivery verification
- **📊 Performance Dashboard** - Service hours statistics, contribution analysis
- **📱 Responsive Design** - Perfect adaptation for desktop and mobile devices

---

## 🚀 Quick Start

### System Requirements

| Tool | Version | Description |
|------|---------|-------------|
| **Python** | 3.12+ | Fire Department Automation System |
| **uv** | Latest | Python Package Manager ([Installation Guide](https://docs.astral.sh/uv/)) |
| **Node.js** | 22.x | Volunteer Management System |
| **pnpm** | 9.x+ | Node.js Package Manager |

### One-Click Start All Systems

```powershell
# Windows PowerShell one-click start
.\start-all.ps1
```

### Startup Options

```powershell
# Skip dependency installation (if already installed)
.\start-all.ps1 -SkipInstall

# Start in production mode
.\start-all.ps1 -ProductionMode

# Combine options
.\start-all.ps1 -SkipInstall -ProductionMode
```

### Manually Start Individual Systems

```powershell
# Fire Department Automation System (Streamlit)
cd fire_dept_automation
uv sync
uv run streamlit run home.py --server.port 8501

# Volunteer Management System (React + Node.js)
cd fire_volunteer_management
pnpm install
pnpm run dev
```

---

## 🌐 System URLs

After startup, access:

| System | URL | Tech Stack |
|--------|-----|------------|
| 🔥 Fire Dept. System | http://localhost:8501 | Streamlit + Python |
| 👥 Volunteer System | http://localhost:3000 | React + Express |

---

## 📦 Project Structure

```
CivicTech/
├── 📂 fire_dept_automation/        # 🔥 Fire Department Automation System
│   ├── home.py                     # Main entry point
│   ├── pages/                      # Streamlit multi-page
│   │   ├── 1_disaster_prevention_museum_booking.py
│   │   ├── 2_community_meal_delivery.py
│   │   ├── 3_public_application_and_inquiry.py
│   │   ├── 4_case_review.py
│   │   └── 5_auto_comparison_system.py
│   ├── db_manager.py               # SQLite database operations
│   ├── ai_engine.py                # AI/OCR engine
│   ├── utils.py                    # Utility functions
│   ├── config.toml                 # System config (multi-county deployment)
│   └── pyproject.toml              # Python dependencies (uv)
│
├── 📂 fire_volunteer_management/   # 👥 Volunteer Management System
│   ├── client/                     # Frontend React application
│   │   └── src/
│   │       ├── pages/              # Page components
│   │       ├── components/         # UI components
│   │       └── hooks/              # Custom hooks
│   ├── server/                     # Backend Express + tRPC
│   ├── drizzle/                    # Database Schema (Drizzle ORM)
│   ├── shared/                     # Shared types for frontend/backend
│   └── package.json                # Node.js dependencies
│
├── 📂 docs/                        # 📚 Documentation
│   ├── QUICK_REFERENCE.md
│   ├── SYSTEM_INTEGRATION.md
│   ├── AWS_S3_SETUP_GUIDE.md
│   └── GOOGLE_MAPS_SETUP_GUIDE.md
│
├── start-all.ps1                   # Windows integrated startup script
├── start-all.bat                   # Windows Batch startup script
├── package.json                    # Monorepo config (Husky, Lint-Staged)
├── CODE_OF_CONDUCT.md              # Code of Conduct
├── CONTRIBUTING.md                 # Contributing Guide
├── SECURITY.md                     # Security Policy
└── LICENSE                         # MIT License
```

---

## 🛠️ Tech Stack

### Fire Department Automation System (Python)

| Category | Technology |
|----------|------------|
| Framework | Streamlit |
| Database | SQLite |
| OCR | Tesseract OCR + PaddleOCR |
| PDF Processing | PyMuPDF (fitz) |
| Data Processing | Pandas |
| Password Encryption | bcrypt |

### Volunteer Management System (TypeScript)

| Category | Technology |
|----------|------------|
| Frontend Framework | React 19 |
| Type System | TypeScript 5 |
| UI Components | shadcn/ui + Tailwind CSS 4 |
| State Management | TanStack Query |
| Routing | Wouter |
| Backend Framework | Express 4 |
| API | tRPC 11 (End-to-end type safety) |
| Database ORM | Drizzle ORM |
| Database | MySQL / TiDB |
| File Storage | AWS S3 |
| Testing | Vitest |

### Development Toolchain

| Tool | Purpose |
|------|---------|
| pnpm | Node.js package management |
| uv | Python package management |
| Husky | Git Hooks |
| Lint-Staged | Pre-commit linting |
| Prettier | Code formatting |
| ESLint | JavaScript/TypeScript linting |

---

## 📋 First-Time Setup

### 1. Copy Environment Variable Examples

```powershell
# Fire Department Automation System
copy fire_dept_automation\.env.example fire_dept_automation\.env

# Volunteer Management System
copy fire_volunteer_management\.env.example fire_volunteer_management\.env
```

### 2. Configure Environment Variables

Edit the `.env` files to configure:
- 📧 Email SMTP settings
- 🗄️ Database connection
- 🔑 API keys (Google Maps, AWS S3, etc.)
- 🔐 JWT secrets

### 3. Install Tesseract OCR (if OCR functionality is needed)

```powershell
# Windows - Download installer
# https://github.com/UB-Mannheim/tesseract/wiki
# Default path: C:\Program Files\Tesseract-OCR\
# Traditional Chinese language pack required
```

---

## 🔧 Troubleshooting

### Port Conflicts

```powershell
# Check port usage
netstat -ano | findstr :8501
netstat -ano | findstr :3000

# Terminate specific process
taskkill /PID <PID> /F
```

### Dependency Installation Issues

```powershell
# Fire Department System - Reinstall dependencies
cd fire_dept_automation
Remove-Item -Recurse -Force .venv
uv sync

# Volunteer Management System - Reinstall dependencies
cd fire_volunteer_management
Remove-Item -Recurse -Force node_modules
pnpm install
```

For more issues, see the [Quick Reference](docs/QUICK_REFERENCE.md).

---

## 🌏 Multi-County Deployment

This system is designed to be **easily portable to other county fire departments**! Simply modify the `config.toml` configuration file:

```toml
[agency]
name = "Hualien County Fire Department"
department = "Prevention and Investigation Division"
phone = "03-8234567"
email = "fire@hualien.gov.tw"

[features]
enable_meal_delivery = true
enable_museum_booking = false  # Disable unused features
enable_ocr = true
```

For detailed instructions, see the [Fire Department System README](fire_dept_automation/README.md).

---

## 🤝 Contributing

We welcome all forms of contribution! Please read [CONTRIBUTING.md](CONTRIBUTING.md) to learn about:

- How to report bugs
- How to suggest new features
- Pull Request process
- Code style guidelines

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
Copyright (c) 2026 Swiftarian
```

---

## 📞 Contact Information

### Documentation Resources

- 📖 [Fire Department System Documentation](fire_dept_automation/README.md)
- 📖 [Volunteer Management System Documentation](fire_volunteer_management/README.md)
- 📖 [Meal Delivery Service Guide](fire_volunteer_management/MEAL_DELIVERY_GUIDE.md)

### Report Issues

- 🐛 [GitHub Issues](https://github.com/Swiftarian/CivicTech/issues)
- 📧 Technical Support: Please report via GitHub Issues

---

## 🙏 Acknowledgments

- Thanks to Taitung County Fire Department colleagues for requirement feedback and testing assistance
- Thanks to all open-source project contributors
- Thanks to the volunteer community for their continued support

---

<div align="center">

**Building an Integrated Public-Private Disaster Prevention Platform**

✅ Disaster Education | ✅ Community Resource Coordination | ✅ Volunteer Management | ✅ Intelligent Document Processing | ✅ Real-time Notification System

---

**Last Updated**: 2026-01-31 | **Project Maintainer**: [Swiftarian](https://github.com/Swiftarian)

</div>
