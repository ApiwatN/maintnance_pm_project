<div align="center">

# 📦 คู่มือการติดตั้งระบบ (Deployment Guide)

## ระบบบริหารจัดการการบำรุงรักษาเชิงป้องกัน
## (Preventive Maintenance Management System)

---

**ชื่อโปรเจค:** Maintenance PM Project  
**เวอร์ชัน:** 1.0.0  
**วันที่จัดทำ:** 10 มกราคม 2569 (2026)  
**จัดทำโดย:** ทีมพัฒนาระบบ

---

</div>

---

## 📋 ข้อมูลเอกสาร

| รายการ | รายละเอียด |
|--------|-----------|
| **ชื่อเอกสาร** | คู่มือการติดตั้งระบบ (Deployment Guide) |
| **รหัสเอกสาร** | PM-DOC-DG-001 |
| **เวอร์ชัน** | 1.0.0 |
| **วันที่จัดทำ** | 10 มกราคม 2569 |
| **ปรับปรุงล่าสุด** | 10 มกราคม 2569 |
| **สถานะ** | เผยแพร่ (Released) |
| **กลุ่มผู้ใช้** | ผู้ติดตั้งระบบ / ผู้ดูแลระบบ |

---

## 📝 ประวัติการแก้ไข

| เวอร์ชัน | วันที่ | ผู้แก้ไข | รายละเอียดการแก้ไข |
|---------|--------|---------|-------------------|
| 1.0.0 | 10/01/2569 | ทีมพัฒนา | เอกสารฉบับแรก |

---

## สารบัญ

1. [ภาพรวมระบบ](#1-ภาพรวมระบบ)
2. [ความต้องการของระบบ](#2-ความต้องการของระบบ)
3. [การเตรียมสภาพแวดล้อม](#3-การเตรียมสภาพแวดล้อม)
4. [การติดตั้ง Database](#4-การติดตั้ง-database)
5. [การติดตั้ง Backend](#5-การติดตั้ง-backend)
6. [การติดตั้ง Frontend](#6-การติดตั้ง-frontend)
7. [การตั้งค่า SSL Certificate](#7-การตั้งค่า-ssl-certificate)
8. [การเริ่มต้นระบบ](#8-การเริ่มต้นระบบ)
9. [การทดสอบระบบ](#9-การทดสอบระบบ)
10. [การตั้งค่า Production](#10-การตั้งค่า-production)
11. [การ Troubleshooting](#11-การ-troubleshooting)

---

## 1. ภาพรวมระบบ

### 1.1 สถาปัตยกรรมระบบ

```
┌─────────────────────────────────────────────────────────────────┐
│                         Clients                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │    PC    │  │  Tablet  │  │  Mobile  │  │   Other  │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │             │             │             │               │
└───────┴─────────────┴─────────────┴─────────────┴───────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                           │
│                    Port: 3000 (HTTP)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Backend (Express.js)                          │
│                   Port: 5006 (HTTPS)                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  REST    │  │  Socket  │  │  Auth    │  │  Upload  │        │
│  │  API     │  │  IO      │  │  JWT     │  │  Multer  │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Prisma ORM                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  SQL Server Database                            │
│                  Port: 1433                                     │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js (React) | 16.x |
| **Backend** | Express.js (Node.js) | Node 20+ |
| **Database** | Microsoft SQL Server | 2019+ |
| **ORM** | Prisma | 5.x |
| **Realtime** | Socket.io | 4.x |

---

## 2. ความต้องการของระบบ

### 2.1 Hardware Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **CPU** | 2 Cores | 4+ Cores |
| **RAM** | 4 GB | 8+ GB |
| **Storage** | 20 GB | 50+ GB |
| **Network** | 100 Mbps | 1 Gbps |

### 2.2 Software Requirements

| Software | Version | หมายเหตุ |
|----------|---------|---------|
| **Windows Server** | 2016+ | หรือ Windows 10/11 |
| **Node.js** | 20.x+ | LTS Version |
| **npm** | 10.x+ | มาพร้อม Node.js |
| **SQL Server** | 2019+ | Express Edition หรือสูงกว่า |
| **Git** | 2.x+ | สำหรับดึงโค้ด |

### 2.3 Network Requirements

| Port | Service | Protocol | หมายเหตุ |
|------|---------|----------|---------|
| **3000** | Frontend | HTTP | สามารถเปลี่ยนได้ |
| **5006** | Backend | HTTPS | API Server |
| **1433** | SQL Server | TCP | Database |

---

## 3. การเตรียมสภาพแวดล้อม

### 3.1 ติดตั้ง Node.js

1. ดาวน์โหลด Node.js จาก https://nodejs.org/
2. เลือก LTS Version (v20.x หรือใหม่กว่า)
3. ติดตั้งและ Restart Terminal
4. ตรวจสอบการติดตั้ง:

```bash
node --version
# v20.x.x

npm --version
# 10.x.x
```

### 3.2 ติดตั้ง Git

1. ดาวน์โหลด Git จาก https://git-scm.com/
2. ติดตั้งด้วย Default Options
3. ตรวจสอบ:

```bash
git --version
# git version 2.x.x
```

### 3.3 Clone Repository

```bash
cd /path/to/install
git clone <repository-url> maintenance_pm_project
cd maintenance_pm_project
```

---

## 4. การติดตั้ง Database

### 4.1 ติดตั้ง SQL Server

1. ดาวน์โหลด SQL Server จาก Microsoft
2. ติดตั้ง SQL Server (Express Edition หรือสูงกว่า)
3. จดจำการตั้งค่า:
   - Instance Name
   - SA Password
   - TCP Port (default: 1433)

### 4.2 สร้าง Database

เปิด SQL Server Management Studio (SSMS) และรันคำสั่ง:

```sql
CREATE DATABASE maintenance_pm_db;
GO
```

### 4.3 สร้าง User (Optional)

```sql
USE maintenance_pm_db;
CREATE LOGIN pm_user WITH PASSWORD = 'YourSecurePassword';
CREATE USER pm_user FOR LOGIN pm_user;
ALTER ROLE db_owner ADD MEMBER pm_user;
GO
```

---

## 5. การติดตั้ง Backend

### 5.1 เข้าไปยังโฟลเดอร์ Backend

```bash
cd backend
```

### 5.2 ติดตั้ง Dependencies

```bash
npm install
```

### 5.3 สร้างไฟล์ .env

สร้างไฟล์ `.env` ในโฟลเดอร์ `backend`:

```env
# Database Configuration
DATABASE_URL="sqlserver://localhost:1433;database=maintenance_pm_db;user=sa;password=YourPassword;encrypt=true;trustServerCertificate=true"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here"

# Server Configuration
PORT=5006
NODE_ENV=production

# Email Configuration (Optional)
SMTP_HOST=smtp.company.com
SMTP_PORT=587
SMTP_USER=noreply@company.com
SMTP_PASS=email-password
EMAIL_FROM=PM System <noreply@company.com>
```

### 5.4 รัน Prisma Migration

```bash
npx prisma generate
npx prisma migrate deploy
```

### 5.5 สร้าง Admin User (Optional)

```bash
npx prisma db seed
```

หรือสร้างผ่าน SQL:

```sql
INSERT INTO UserMaster (name, role, username, password, systemRole, permissionType)
VALUES ('Administrator', 'BOTH', 'admin', 'admin123', 'ADMIN', 'PM_AND_RESCHEDULE');
```

---

## 6. การติดตั้ง Frontend

### 6.1 เข้าไปยังโฟลเดอร์ Frontend

```bash
cd ../frontend/my-app
```

### 6.2 ติดตั้ง Dependencies

```bash
npm install
```

### 6.3 ตั้งค่า API Server URL

แก้ไขไฟล์ `src/app/config.ts`:

```typescript
const config = {
  apiServer: 'https://YOUR-SERVER-IP:5006'
};

export default config;
```

### 6.4 Build Production

```bash
npm run build
```

---

## 7. การตั้งค่า SSL Certificate

### 7.1 สำหรับ Development (Self-signed)

Backend ใช้ Self-signed Certificate ที่อยู่ใน:
- `backend/ssl/server.key`
- `backend/ssl/server.crt`

### 7.2 สำหรับ Production

1. ขอ SSL Certificate จาก CA
2. วาง Certificate ไว้ใน `backend/ssl/`:
   - `server.key` (Private Key)
   - `server.crt` (Certificate)

3. หรือใช้ Let's Encrypt:

```bash
certbot certonly --standalone -d your-domain.com
```

---

## 8. การเริ่มต้นระบบ

### 8.1 Start Backend

```bash
cd backend
npm start
```

Output ที่คาดหวัง:
```
Starting server in HTTPS mode...
📅 Scheduler initialized
Server is running on port 5006
```

### 8.2 Start Frontend (Development)

```bash
cd frontend/my-app
npm run dev
```

### 8.3 Start Frontend (Production)

```bash
cd frontend/my-app
npm run start
```

### 8.4 ใช้ PM2 สำหรับ Production

ติดตั้ง PM2:
```bash
npm install -g pm2
```

สร้างไฟล์ `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'pm-backend',
      cwd: './backend',
      script: 'server.js',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'pm-frontend',
      cwd: './frontend/my-app',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

Start ด้วย PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 9. การทดสอบระบบ

### 9.1 ทดสอบ Backend

```bash
curl -k https://localhost:5006/api/auth/me
```

ควรได้ Response:
```json
{"error":"No token provided"}
```

### 9.2 ทดสอบ Frontend

เปิด Browser ไปที่:
```
http://localhost:3000/login
```

### 9.3 ทดสอบ Login

ใช้ Default Admin Account:
- Username: `admin`
- Password: `admin123` (หรือตามที่ตั้งไว้)

### 9.4 Checklist การทดสอบ

| รายการ | ผลลัพธ์ที่คาดหวัง | ✓ |
|--------|-----------------|---|
| เข้าหน้า Login ได้ | เห็น Form Login | □ |
| Login สำเร็จ | เข้า Dashboard | □ |
| Dashboard โหลดข้อมูล | เห็น KPI Cards | □ |
| สร้างผู้ใช้ใหม่ | บันทึกสำเร็จ | □ |
| ทำ PM | บันทึก Record | □ |
| ดู History | เห็นประวัติ | □ |
| Export Excel | Download ไฟล์ | □ |

---

## 10. การตั้งค่า Production

### 10.1 Firewall Rules

เปิด Port ที่จำเป็น:

```bash
# Windows Firewall
netsh advfirewall firewall add rule name="PM Frontend" dir=in action=allow protocol=tcp localport=3000
netsh advfirewall firewall add rule name="PM Backend" dir=in action=allow protocol=tcp localport=5006
```

### 10.2 Environment Variables

ตั้งค่า Environment Variables แทน .env file:

```bash
setx DATABASE_URL "sqlserver://..."
setx JWT_SECRET "your-secret"
```

### 10.3 Backup Configuration

ตั้ง Schedule Backup:

1. **SQL Server**
   - Full Backup: ทุก 7 วัน
   - Differential: ทุก 1 วัน
   - Transaction Log: ทุก 1 ชั่วโมง

2. **Files**
   - `/backend/uploads/`: ทุก 1 วัน

### 10.4 Monitoring

แนะนำเครื่องมือ Monitoring:
- **PM2 Monit**: ดู Process Status
- **SQL Server Activity Monitor**: ดู Database Performance

---

## 11. การ Troubleshooting

### 11.1 Database Connection Error

**ปัญหา:**
```
Error: Cannot connect to database
```

**วิธีแก้ไข:**
1. ตรวจสอบ SQL Server Service ทำงานอยู่
2. ตรวจสอบ Connection String ใน `.env`
3. ตรวจสอบ Firewall Port 1433

### 11.2 Port Already in Use

**ปัญหา:**
```
Error: listen EADDRINUSE :::5006
```

**วิธีแก้ไข:**
```bash
# Windows
netstat -ano | findstr :5006
taskkill /PID <PID> /F
```

### 11.3 SSL Certificate Error

**ปัญหา:** Browser แจ้ง Certificate Error

**วิธีแก้ไข:**
1. เข้า https://localhost:5006 โดยตรง
2. Accept Certificate Warning
3. กลับมา Frontend

### 11.4 Prisma Migration Error

**ปัญหา:**
```
Error: Migration failed
```

**วิธีแก้ไข:**
```bash
npx prisma migrate reset
npx prisma migrate deploy
```

### 11.5 Frontend Build Error

**ปัญหา:**
```
Error during build
```

**วิธีแก้ไข:**
```bash
rm -rf node_modules
rm -rf .next
npm install
npm run build
```

---

## 📎 ภาคผนวก

### A. โครงสร้างโฟลเดอร์

```
maintenance_pm_project/
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── prisma/
│   ├── routes/
│   ├── ssl/
│   ├── uploads/
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   └── my-app/
│       ├── src/
│       ├── public/
│       └── package.json
└── docs/
```

### B. Default Credentials

| Account | Username | Password | Role |
|---------|----------|----------|------|
| Admin | admin | admin123 | ADMIN |

> **⚠️ ข้อควรระวัง:** ให้เปลี่ยนรหัสผ่าน Default ทันทีหลังติดตั้ง

---

<div align="center">

---

**© 2026 Maintenance PM Project**

เอกสารนี้เป็นความลับ ห้ามเผยแพร่โดยไม่ได้รับอนุญาต

---

</div>
