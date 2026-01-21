<div align="center">

# ⚙️ คู่มือการตั้งค่าสภาพแวดล้อม (Environment Configuration Guide)

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
| **ชื่อเอกสาร** | คู่มือการตั้งค่าสภาพแวดล้อม |
| **รหัสเอกสาร** | PM-DOC-EC-001 |
| **เวอร์ชัน** | 1.0.0 |
| **วันที่จัดทำ** | 10 มกราคม 2569 |
| **ปรับปรุงล่าสุด** | 10 มกราคม 2569 |
| **สถานะ** | เผยแพร่ (Released) |

---

## สารบัญ

1. [ภาพรวม Environment Variables](#1-ภาพรวม-environment-variables)
2. [การตั้งค่า Database](#2-การตั้งค่า-database)
3. [การตั้งค่า JWT](#3-การตั้งค่า-jwt)
4. [การตั้งค่า Server](#4-การตั้งค่า-server)
5. [การตั้งค่า Email (SMTP)](#5-การตั้งค่า-email-smtp)
6. [การตั้งค่า Frontend](#6-การตั้งค่า-frontend)
7. [ตัวอย่างไฟล์ .env](#7-ตัวอย่างไฟล์-env)
8. [การตรวจสอบการตั้งค่า](#8-การตรวจสอบการตั้งค่า)

---

## 1. ภาพรวม Environment Variables

### 1.1 ตำแหน่งไฟล์ตั้งค่า

| ไฟล์ | ตำแหน่ง | คำอธิบาย |
|-----|---------|---------|
| **Backend .env** | `/backend/.env` | ตั้งค่า Backend Server |
| **Frontend config** | `/frontend/my-app/src/app/config.ts` | ตั้งค่า API Server URL |

### 1.2 สรุป Variables ทั้งหมด

| Variable | จำเป็น | ค่าเริ่มต้น | คำอธิบาย |
|----------|:------:|-----------|---------|
| DATABASE_URL | ✅ | - | Connection String ของ Database |
| JWT_SECRET | ✅ | - | Secret Key สำหรับ JWT Token |
| PORT | ❌ | 5006 | Port ของ Backend Server |
| NODE_ENV | ❌ | development | สภาพแวดล้อม (development/production) |
| SMTP_HOST | ❌ | - | SMTP Server สำหรับส่ง Email |
| SMTP_PORT | ❌ | 587 | Port ของ SMTP Server |
| SMTP_USER | ❌ | - | Username สำหรับ SMTP |
| SMTP_PASS | ❌ | - | Password สำหรับ SMTP |
| EMAIL_FROM | ❌ | - | Email Address ผู้ส่ง |

---

## 2. การตั้งค่า Database

### 2.1 รูปแบบ Connection String

```
DATABASE_URL="sqlserver://HOST:PORT;database=DATABASE_NAME;user=USERNAME;password=PASSWORD;encrypt=true;trustServerCertificate=true"
```

### 2.2 พารามิเตอร์

| พารามิเตอร์ | คำอธิบาย | ตัวอย่าง |
|------------|---------|---------|
| **HOST** | IP หรือ Hostname ของ SQL Server | `localhost`, `192.168.1.100` |
| **PORT** | Port ของ SQL Server | `1433` (Default) |
| **DATABASE_NAME** | ชื่อ Database | `maintenance_pm_db` |
| **USERNAME** | ชื่อผู้ใช้ Database | `sa`, `pm_user` |
| **PASSWORD** | รหัสผ่าน Database | `YourSecurePassword` |

### 2.3 ตัวเลือกเพิ่มเติม

| Option | คำอธิบาย | ค่า |
|--------|---------|-----|
| `encrypt` | เข้ารหัสการเชื่อมต่อ | `true` / `false` |
| `trustServerCertificate` | ยอมรับ Self-signed Certificate | `true` / `false` |
| `connectionTimeout` | Timeout การเชื่อมต่อ (ms) | `30000` |

### 2.4 ตัวอย่าง Connection String

**Local Development:**
```
DATABASE_URL="sqlserver://localhost:1433;database=maintenance_pm_db;user=sa;password=MyPassword123;encrypt=true;trustServerCertificate=true"
```

**Production (Remote Server):**
```
DATABASE_URL="sqlserver://192.168.1.100:1433;database=pm_production;user=pm_user;password=SecureP@ssw0rd;encrypt=true;trustServerCertificate=false"
```

**Named Instance:**
```
DATABASE_URL="sqlserver://SERVER_NAME\\INSTANCE_NAME:1433;database=pm_db;user=sa;password=Password123;encrypt=true;trustServerCertificate=true"
```

---

## 3. การตั้งค่า JWT

### 3.1 JWT_SECRET

เป็น Secret Key สำหรับเข้ารหัส JWT Token

```
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
```

### 3.2 ข้อกำหนด

| ข้อ | คำอธิบาย |
|----|---------|
| **ความยาว** | ควรมากกว่า 32 ตัวอักษร |
| **ความซับซ้อน** | ผสม ตัวอักษร ตัวเลข สัญลักษณ์ |
| **ความลับ** | ห้ามเปิดเผยหรือ Commit ลง Git |
| **เปลี่ยนแปลง** | หากเปลี่ยน Token เดิมจะใช้ไม่ได้ทั้งหมด |

### 3.3 การสร้าง Secret Key

**วิธีที่ 1: ใช้ Node.js**
```javascript
require('crypto').randomBytes(64).toString('hex')
```

**วิธีที่ 2: ใช้ OpenSSL**
```bash
openssl rand -hex 64
```

**วิธีที่ 3: ใช้ Online Generator**
- https://randomkeygen.com/

---

## 4. การตั้งค่า Server

### 4.1 PORT

Port ที่ Backend Server จะรับ Connection

```
PORT=5006
```

| ค่า | หมายเหตุ |
|----|---------|
| **5006** | Default (Production) |
| **3001** | Development (หลีกเลี่ยงชน Frontend) |

### 4.2 NODE_ENV

กำหนดสภาพแวดล้อมการทำงาน

```
NODE_ENV=production
```

| ค่า | Effect |
|----|--------|
| **development** | แสดง Error Details, Debug Mode |
| **production** | ซ่อน Error Details, Optimize Performance |

---

## 5. การตั้งค่า Email (SMTP)

### 5.1 Variables สำหรับ Email

```
SMTP_HOST=smtp.company.com
SMTP_PORT=587
SMTP_USER=noreply@company.com
SMTP_PASS=email-password
EMAIL_FROM="PM System <noreply@company.com>"
```

### 5.2 รายละเอียด

| Variable | คำอธิบาย | ตัวอย่าง |
|----------|---------|---------|
| **SMTP_HOST** | SMTP Server Address | `smtp.gmail.com`, `smtp.office365.com` |
| **SMTP_PORT** | SMTP Port | `587` (TLS), `465` (SSL), `25` (No Encryption) |
| **SMTP_USER** | Username/Email สำหรับ Login | `noreply@company.com` |
| **SMTP_PASS** | Password หรือ App Password | `your-app-password` |
| **EMAIL_FROM** | ข้อมูลผู้ส่ง | `"PM System <noreply@company.com>"` |

### 5.3 ตัวอย่าง SMTP Settings

**Gmail:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM="PM Notification <your-email@gmail.com>"
```

> **หมายเหตุ:** สำหรับ Gmail ต้องใช้ App Password แทน Password จริง

**Office 365:**
```
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=noreply@company.onmicrosoft.com
SMTP_PASS=your-password
EMAIL_FROM="PM System <noreply@company.onmicrosoft.com>"
```

**Internal SMTP (No Auth):**
```
SMTP_HOST=mail.internal.company.com
SMTP_PORT=25
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="PM System <pm@company.com>"
```

---

## 6. การตั้งค่า Frontend

### 6.1 ไฟล์ config.ts

ตำแหน่ง: `/frontend/my-app/src/app/config.ts`

```typescript
const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

const config = {
  apiServer: `https://${hostname}:5006`
};

export default config;
```

### 6.2 การปรับแต่ง

**Fixed IP Address:**
```typescript
const config = {
  apiServer: 'https://192.168.1.100:5006'
};
```

**Dynamic (ตาม Browser):**
```typescript
const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const config = {
  apiServer: `https://${hostname}:5006`
};
```

### 6.3 ข้อควรระวัง

| ข้อ | หมายเหตุ |
|----|---------|
| **Protocol** | ต้องตรงกับ Backend (HTTP หรือ HTTPS) |
| **Port** | ต้องตรงกับ Backend PORT |
| **CORS** | Backend ต้อง Allow Origin ของ Frontend |

---

## 7. ตัวอย่างไฟล์ .env

### 7.1 Development Environment

```env
# =================================
# Database Configuration
# =================================
DATABASE_URL="sqlserver://localhost:1433;database=maintenance_pm_dev;user=sa;password=Dev123456;encrypt=true;trustServerCertificate=true"

# =================================
# JWT Configuration
# =================================
JWT_SECRET="development-secret-key-do-not-use-in-production"

# =================================
# Server Configuration
# =================================
PORT=5006
NODE_ENV=development

# =================================
# Email Configuration (Optional)
# =================================
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=test@gmail.com
# SMTP_PASS=test-app-password
# EMAIL_FROM="PM Dev <test@gmail.com>"
```

### 7.2 Production Environment

```env
# =================================
# Database Configuration
# =================================
DATABASE_URL="sqlserver://DB-SERVER:1433;database=pm_production;user=pm_app;password=SecureP@ssw0rd!2024;encrypt=true;trustServerCertificate=false"

# =================================
# JWT Configuration
# =================================
JWT_SECRET="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2"

# =================================
# Server Configuration
# =================================
PORT=5006
NODE_ENV=production

# =================================
# Email Configuration
# =================================
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=pm-notification@company.com
SMTP_PASS=ProductionSmtpPassword!
EMAIL_FROM="PM Notification System <pm-notification@company.com>"
```

---

## 8. การตรวจสอบการตั้งค่า

### 8.1 Checklist ก่อน Deploy

| รายการ | ตรวจสอบ | ✓ |
|--------|--------|---|
| DATABASE_URL ถูกต้อง | เชื่อมต่อ Database ได้ | □ |
| JWT_SECRET เป็นค่า Production | ไม่ใช่ค่า Default | □ |
| NODE_ENV=production | ตั้งเป็น production | □ |
| SMTP ตั้งค่าถูกต้อง | ส่ง Email ได้ | □ |
| Frontend config ถูกต้อง | URL ชี้ไปที่ Backend ถูกต้อง | □ |
| ไม่มี .env ใน Git | .gitignore มี .env | □ |

### 8.2 การทดสอบ Database Connection

```bash
cd backend
npx prisma db pull
```

หากสำเร็จ = Connection ถูกต้อง

### 8.3 การทดสอบ SMTP

ใช้ Script ทดสอบ:

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

transporter.sendMail({
  from: process.env.EMAIL_FROM,
  to: 'test@example.com',
  subject: 'Test Email',
  text: 'This is a test email.'
}).then(() => console.log('Email sent successfully'))
  .catch(err => console.error('Email error:', err));
```

---

## 📎 Security Best Practices

### ข้อควรปฏิบัติ

| ข้อ | คำแนะนำ |
|----|---------|
| 1 | **ห้าม** Commit ไฟล์ `.env` ลง Git |
| 2 | ใช้ **Environment Variables** แทน Hardcode |
| 3 | เปลี่ยน **JWT_SECRET** เป็นค่าที่ซับซ้อน |
| 4 | ใช้ **Strong Password** สำหรับ Database |
| 5 | จำกัดสิทธิ์ **Database User** ให้น้อยที่สุด |
| 6 | **Encrypt** การเชื่อมต่อ Database (encrypt=true) |
| 7 | ตั้งค่า **Firewall** ให้เหมาะสม |

---

<div align="center">

---

**© 2026 Maintenance PM Project**

เอกสารนี้เป็นความลับ ห้ามเผยแพร่โดยไม่ได้รับอนุญาต

---

</div>
