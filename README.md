# Maintenance PM Project

ระบบจัดการการซ่อมบำรุงเครื่องจักร (Machine PM System)

## 1. วัตถุประสงค์ (Objective)

โครงการนี้จัดทำขึ้นเพื่อพัฒนาระบบบริหารจัดการการซ่อมบำรุงเครื่องจักร (Preventive Maintenance - PM) ภายในโรงงาน โดยมีวัตถุประสงค์หลักดังนี้:
- เพื่อเพิ่มประสิทธิภาพในการวางแผนและติดตามการซ่อมบำรุงเครื่องจักร
- เพื่อลดเวลา Down time ของเครื่องจักรจากการเสียฉุกเฉิน
- เพื่อจัดเก็บประวัติการซ่อมบำรุงและการใช้งานเครื่องจักรอย่างเป็นระบบ
- เพื่อให้ผู้บริหารและเจ้าหน้าที่สามารถดูสถานะของเครื่องจักรได้แบบ Real-time ผ่าน Dashboard
- เพื่ออำนวยความสะดวกในการออกรายงานและวิเคราะห์ข้อมูลการซ่อมบำรุง

## 2. Flow Chart

แผนภาพแสดงการทำงานของระบบ (System Architecture & Data Flow)

```mermaid
graph TD
    User[User / Staff] -->|Access via Web Browser| Frontend[Frontend (Next.js)]
    Admin[Admin] -->|Manage System| Frontend

    subgraph "Frontend Application"
        Frontend -->|HTTP Requests (Axios)| API[Backend API (Express.js)]
        Frontend -->|Real-time Updates (Socket.io)| Socket[Socket Server]
    end

    subgraph "Backend Server"
        API -->|Auth & Logic| Controller[Controllers]
        Socket -->|Event Handling| Controller
        Controller -->|ORM Queries| Prisma[Prisma Client]
        Scheduler[Cron Scheduler] -->|Trigger PM Tasks| Controller
    end

    subgraph "Database"
        Prisma -->|Read/Write| DB[(SQL Server Database)]
    end

    Controller -->|File Storage| Uploads[Uploads Folder]
```

## 3. Feature (คุณสมบัติของระบบ)

ระบบประกอบด้วยฟังก์ชันหลักดังนี้:

### 3.1 Dashboard
- แสดงภาพรวมสถานะของเครื่องจักรทั้งหมด
- กราฟแสดงผลการดำเนินงานและแผน PM
- การแจ้งเตือนงานซ่อมบำรุงที่ถึงกำหนด

### 3.2 Machine Management (จัดการเครื่องจักร)
- ทะเบียนเครื่องจักร (Machine Master)
- จัดการประเภทเครื่องจักร (Machine Types)
- ติดตามสถานะการทำงานของเครื่องจักร

### 3.3 Preventive Maintenance (PM)
- วางแผนการซ่อมบำรุง (PM Planning)
- บันทึกผลการซ่อมบำรุง (PM Recording)
- จัดการประเภทการซ่อมบำรุง (Preventive Types)
- ระบบแจ้งเตือนเมื่อถึงรอบ PM

### 3.4 User Management (จัดการผู้ใช้งาน)
- ระบบจัดการผู้ใช้งานและสิทธิ์การเข้าถึง (User Master)
- ระบบ Login/Authentication

### 3.5 Reports (รายงาน)
- ออกรายงานประวัติการซ่อมบำรุง
- Export ข้อมูลเป็น Excel/PDF

### 3.6 Real-time Features
- อัปเดตสถานะเครื่องจักรแบบ Real-time ด้วย Socket.io

## 4. วิธีการใช้งาน (Usage)

### Prerequisites (สิ่งที่ต้องมี)
- Node.js (v18 or higher recommended)
- SQL Server
- Git

### 4.1 การติดตั้งและรัน Backend

1. เข้าไปที่โฟลเดอร์ backend
   ```bash
   cd backend
   ```
2. ติดตั้ง dependencies
   ```bash
   npm install
   ```
3. ตั้งค่า Database และ Environment Variables ในไฟล์ `.env`
4. รัน Server
   ```bash
   npm start
   ```
   Server จะทำงานที่ Port ที่กำหนด (Default: 5003)

### 4.2 การติดตั้งและรัน Frontend

1. เข้าไปที่โฟลเดอร์ frontend
   ```bash
   cd frontend/my-app
   ```
2. ติดตั้ง dependencies
   ```bash
   npm install
   ```
3. รันโหมด Development
   ```bash
   npm run dev
   ```
   หรือรันโหมด Production
   ```bash
   npm run build
   npm start
   ```
4. เปิด Browser ไปที่ `http://localhost:3000` (หรือ Port ที่กำหนด)

### 4.3 โครงสร้างโปรเจกต์
- **backend/**: Source code ส่วน Server API, Database connection, Scheduler
- **frontend/my-app/**: Source code ส่วนหน้าเว็บ (Next.js), Components, Pages
