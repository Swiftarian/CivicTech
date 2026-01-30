# 🏛️ CivicTech System Architecture

English | **[繁體中文](ARCHITECTURE.md)**

> This document details the technical architecture, subsystem composition, and tech stack of the CivicTech Public-Private Disaster Prevention Integration System.

---

## 📊 System Overview

CivicTech uses a **Monorepo** architecture, integrating two independent but complementary subsystems:

```mermaid
graph TB
    subgraph CivicTech["🏛️ CivicTech Public-Private Disaster Prevention Platform"]
        direction TB
        
        subgraph FD["🔥 Fire Dept. Automation System<br/>fire_dept_automation"]
            FD_UI[Streamlit Web UI]
            FD_BE[Python 3.12+ Backend]
            FD_DB[(SQLite)]
        end
        
        subgraph VM["👥 Volunteer Management System<br/>fire_volunteer_management"]
            VM_UI[React 19 + TypeScript]
            VM_API[tRPC 11 API Layer]
            VM_BE[Express 4 + Node.js 22]
            VM_DB[(MySQL / TiDB)]
        end
        
        subgraph Shared["🔧 Shared Infrastructure"]
            PKG[pnpm / uv]
            HOOKS[Husky + Lint-Staged]
            LINT[Prettier + ESLint]
        end
    end
    
    FD_UI --> FD_BE
    FD_BE --> FD_DB
    
    VM_UI --> VM_API
    VM_API --> VM_BE
    VM_BE --> VM_DB
    
    style FD fill:#ff6b35,color:#fff
    style VM fill:#4ecdc4,color:#fff
    style Shared fill:#2c3e50,color:#fff
```

---

## 🔥 Fire Department Automation System

### System Architecture Diagram

```mermaid
graph TB
    subgraph Frontend["📱 Frontend Interface"]
        HOME[home.py<br/>Main Entry]
        P1[1_Museum Booking]
        P2[2_Meal Delivery]
        P3[3_Public Application]
        P4[4_Case Review]
        P5[5_Auto Comparison]
    end
    
    subgraph Backend["⚙️ Business Logic Layer"]
        AUTH[auth.py<br/>Authentication]
        UTILS[utils.py<br/>Utilities]
        DB_MGR[db_manager.py<br/>Database Operations]
        AI[ai_engine.py<br/>AI/OCR Engine]
        CONFIG[config_loader.py<br/>Config Loader]
    end
    
    subgraph Data["💾 Data Layer"]
        SQLITE[(cases.db<br/>SQLite)]
        UPLOADS[/uploads/<br/>File Storage/]
    end
    
    subgraph External["🌐 External Services"]
        OCR1[Tesseract OCR]
        OCR2[PaddleOCR]
        EMAIL[SMTP Email]
    end
    
    subgraph Config["📁 Configuration"]
        TOML[config.toml<br/>System Config]
        SECRETS[secrets.toml<br/>Secrets]
    end
    
    HOME --> P1 & P2 & P3 & P4 & P5
    P1 & P2 & P3 & P4 & P5 --> AUTH
    AUTH --> DB_MGR
    P5 --> AI
    AI --> OCR1 & OCR2
    UTILS --> EMAIL
    DB_MGR --> SQLITE
    P1 & P2 & P3 --> UPLOADS
    CONFIG --> TOML
    AUTH --> SECRETS
    
    style Frontend fill:#FF4B4B,color:#fff
    style Backend fill:#1f77b4,color:#fff
    style Data fill:#2ca02c,color:#fff
    style External fill:#9467bd,color:#fff
```

### Tech Stack

| Category | Technology | Version | Description |
|----------|------------|---------|-------------|
| **Framework** | Streamlit | 1.31+ | Python Web application framework |
| **Language** | Python | 3.12+ | Primary programming language |
| **Database** | SQLite | 3.x | Lightweight embedded database |
| **OCR** | Tesseract | 5.x | Open-source OCR engine |
| **OCR** | PaddleOCR | 2.x | High-accuracy Chinese OCR |
| **PDF** | PyMuPDF | 1.x | PDF processing and conversion |
| **Data Processing** | Pandas | 2.x | Data analysis and processing |
| **Encryption** | bcrypt | 4.x | Password hashing |
| **Image** | Pillow | 10.x | Image processing |
| **Email** | smtplib | - | SMTP email sending |

### Feature Modules

```mermaid
mindmap
  root((Fire Dept. System))
    Fire Safety Reporting
      Online Form Submission
      Document Upload
      Progress Query
      Email Notifications
    OCR Auto-Comparison
      Document Recognition
      Data Comparison
      Difference Report
    Meal Delivery Service
      Delivery Management
      GPS Route Tracking
      Photo Verification
      Reimbursement Reports
    Museum Booking
      Group Booking
      Individual Booking
      Time Slot Management
      Reminders
    Case Review Management
      Case Overview
      Batch Operations
      Status Updates
      Audit Logs
```

### Database Schema

```mermaid
erDiagram
    CASES {
        int id PK
        string applicant_name
        string applicant_email
        string applicant_phone
        string line_id
        string place_name
        string place_address
        string file_path
        string status
        datetime submission_date
        string review_notes
        string assigned_to
    }
    
    USERS {
        int id PK
        string username UK
        string password_salt
        string password_hash
        string role
        string email
        datetime created_at
        datetime last_login
    }
    
    AUDIT_LOGS {
        int log_id PK
        string username FK
        string action
        text details
        datetime timestamp
    }
    
    USERS ||--o{ AUDIT_LOGS : creates
    USERS ||--o{ CASES : reviews
```

---

## 👥 Volunteer Management System

### System Architecture Diagram

```mermaid
graph TB
    subgraph Client["📱 Frontend Client"]
        REACT[React 19]
        TS[TypeScript 5]
        UI[shadcn/ui]
        TW[Tailwind CSS 4]
        TQ[TanStack Query]
        WOUTER[Wouter Router]
    end
    
    subgraph API["🔌 API Layer"]
        TRPC[tRPC 11<br/>End-to-end Type Safety]
    end
    
    subgraph Server["⚙️ Backend Server"]
        EXPRESS[Express 4]
        NODE[Node.js 22]
        DRIZZLE[Drizzle ORM]
    end
    
    subgraph Database["💾 Database"]
        MYSQL[(MySQL / TiDB)]
    end
    
    subgraph External["🌐 External Services"]
        S3[AWS S3<br/>File Storage]
        OAUTH[OAuth Server<br/>Authentication]
        SMS[SMS Gateway<br/>Notifications]
    end
    
    REACT --> TS
    TS --> UI & TW & TQ
    TQ --> TRPC
    TRPC --> EXPRESS
    EXPRESS --> NODE
    NODE --> DRIZZLE
    DRIZZLE --> MYSQL
    NODE --> S3 & OAUTH & SMS
    
    style Client fill:#61DAFB,color:#000
    style API fill:#398CCB,color:#fff
    style Server fill:#339933,color:#fff
    style Database fill:#4479A1,color:#fff
    style External fill:#FF9900,color:#000
```

### Tech Stack

| Category | Technology | Version | Description |
|----------|------------|---------|-------------|
| **Frontend Framework** | React | 19 | UI component library |
| **Type System** | TypeScript | 5.x | Static type checking |
| **UI Components** | shadcn/ui | - | Customizable UI components |
| **CSS Framework** | Tailwind CSS | 4 | Utility-first CSS |
| **State Management** | TanStack Query | 5.x | Server state management |
| **Routing** | Wouter | 3.x | Lightweight router |
| **API** | tRPC | 11 | End-to-end type-safe API |
| **Backend Framework** | Express | 4.x | Node.js web framework |
| **Runtime** | Node.js | 22.x | JavaScript runtime |
| **ORM** | Drizzle | - | TypeScript ORM |
| **Database** | MySQL/TiDB | 8.x | Relational database |
| **File Storage** | AWS S3 | - | Cloud object storage |
| **Testing** | Vitest | 2.x | Unit testing framework |

### Feature Modules

```mermaid
mindmap
  root((Volunteer System))
    Public Features
      Homepage
      Group Booking
      Individual Booking
      Booking Query
      Traffic Info
    Volunteer Features
      Personal Schedule
      Check-in/out
      Delivery Tasks
      Leave Requests
      Hours Statistics
    Admin Features
      Booking Management
      Volunteer Management
      Schedule Management
      Delivery Management
      Statistics Dashboard
    Meal Delivery
      Task Creation
      Volunteer Assignment
      Route Tracking
      QR Verification
      Delivery Confirmation
```

### Database Schema

```mermaid
erDiagram
    USERS {
        int id PK
        string manus_id UK
        string email
        string name
        string role
        string avatar_url
        datetime created_at
    }
    
    VOLUNTEERS {
        int id PK
        int user_id FK
        string phone
        string emergency_contact
        string skills
        boolean is_active
    }
    
    BOOKINGS {
        int id PK
        string booking_number UK
        string type
        string contact_name
        string contact_phone
        date booking_date
        string time_slot
        int group_size
        string status
    }
    
    SCHEDULES {
        int id PK
        int volunteer_id FK
        date schedule_date
        string shift_type
        string status
    }
    
    MEAL_DELIVERIES {
        int id PK
        int volunteer_id FK
        string recipient_name
        string recipient_address
        string status
        string qr_code
        datetime delivered_at
    }
    
    ATTENDANCES {
        int id PK
        int volunteer_id FK
        int schedule_id FK
        datetime check_in
        datetime check_out
        string location
    }
    
    USERS ||--o| VOLUNTEERS : has
    VOLUNTEERS ||--o{ SCHEDULES : assigned
    VOLUNTEERS ||--o{ MEAL_DELIVERIES : handles
    VOLUNTEERS ||--o{ ATTENDANCES : records
    SCHEDULES ||--o{ ATTENDANCES : tracks
```

---

## 🔧 Shared Infrastructure

### Development Toolchain

```mermaid
graph LR
    subgraph PackageManagers["📦 Package Management"]
        PNPM[pnpm 9.x<br/>Node.js]
        UV[uv<br/>Python]
    end
    
    subgraph GitHooks["🪝 Git Hooks"]
        HUSKY[Husky 9.x]
        LINT_STAGED[Lint-Staged]
    end
    
    subgraph CodeQuality["✨ Code Quality"]
        PRETTIER[Prettier 3.x<br/>Formatting]
        ESLINT[ESLint<br/>JS/TS Lint]
    end
    
    subgraph CI["🔄 CI/CD"]
        GITHUB[GitHub Actions]
    end
    
    PNPM --> HUSKY
    UV --> HUSKY
    HUSKY --> LINT_STAGED
    LINT_STAGED --> PRETTIER & ESLINT
    PRETTIER & ESLINT --> GITHUB
    
    style PackageManagers fill:#f39c12,color:#000
    style GitHooks fill:#9b59b6,color:#fff
    style CodeQuality fill:#3498db,color:#fff
    style CI fill:#2ecc71,color:#000
```

### Project Directory Structure

```
CivicTech/
├── 📂 fire_dept_automation/        # 🔥 Fire Dept. Automation System
│   ├── home.py                     # Main entry point
│   ├── pages/                      # Streamlit multi-page
│   │   ├── 1_disaster_prevention_museum_booking.py
│   │   ├── 2_community_meal_delivery.py
│   │   ├── 3_public_application_and_inquiry.py
│   │   ├── 4_case_review.py
│   │   └── 5_auto_comparison_system.py
│   ├── db_manager.py               # Database operations
│   ├── ai_engine.py                # AI/OCR engine
│   ├── utils.py                    # Utility functions
│   ├── config.toml                 # System configuration
│   ├── pyproject.toml              # Python dependencies
│   └── tests/                      # Test files
│
├── 📂 fire_volunteer_management/   # 👥 Volunteer Management System
│   ├── client/                     # Frontend React app
│   │   └── src/
│   │       ├── pages/              # Page components
│   │       ├── components/         # UI components
│   │       └── hooks/              # Custom hooks
│   ├── server/                     # Backend Express + tRPC
│   ├── drizzle/                    # Database schema
│   ├── shared/                     # Shared types
│   ├── package.json                # Node.js dependencies
│   └── vitest.config.ts            # Test configuration
│
├── 📂 docs/                        # 📚 Documentation
│   ├── ARCHITECTURE.md             # System architecture (this doc)
│   ├── QUICK_REFERENCE.md          # Quick reference
│   └── SYSTEM_INTEGRATION.md       # System integration
│
├── start-all.ps1                   # Integrated startup script
├── package.json                    # Monorepo configuration
├── .husky/                         # Git hooks
└── .prettierrc                     # Prettier configuration
```

---

## 🚀 Deployment Architecture

### Development Environment

```mermaid
graph LR
    DEV[Developer] --> |localhost:8501| FD[Fire Dept. System<br/>Streamlit]
    DEV --> |localhost:3000| VM[Volunteer System<br/>Vite Dev Server]
    FD --> FD_DB[(SQLite<br/>Local File)]
    VM --> VM_DB[(MySQL<br/>Local/Docker)]
```

### Production Environment

```mermaid
graph TB
    Users[Users] --> LB[Load Balancer]
    
    LB --> FD_PROD[Fire Dept. System<br/>Docker Container]
    LB --> VM_PROD[Volunteer System<br/>Docker Container]
    
    FD_PROD --> FD_DB_PROD[(SQLite<br/>Volume Mount)]
    VM_PROD --> VM_DB_PROD[(TiDB Cloud<br/>or MySQL)]
    VM_PROD --> S3_PROD[AWS S3<br/>File Storage]
    
    style Users fill:#e74c3c,color:#fff
    style LB fill:#3498db,color:#fff
    style FD_PROD fill:#ff6b35,color:#fff
    style VM_PROD fill:#4ecdc4,color:#fff
```

---

## 📝 Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-31 | 1.0.0 | Initial version |

---

<div align="center">

**CivicTech - Building an Integrated Public-Private Disaster Prevention Platform**

[← Back to README](../README_EN.md) | [System Integration →](SYSTEM_INTEGRATION.md)

</div>
