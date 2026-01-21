# เอกสาร API Documentation

## ระบบ Maintenance PM Project

เอกสารนี้อธิบาย API Endpoints ทั้งหมดสำหรับระบบ Preventive Maintenance

---

## 📋 สารบัญ

1. [ข้อมูลทั่วไป](#ข้อมูลทั่วไป)
2. [Authentication API](#1-authentication-api)
3. [User Master API](#2-user-master-api)
4. [Machine API](#3-machine-api)
5. [Machine Master API](#4-machine-master-api)
6. [Machine Type API](#5-machine-type-api)
7. [Area API](#6-area-api)
8. [Preventive Type API](#7-preventive-type-api)
9. [PM Records API](#8-pm-records-api)
10. [Dashboard API](#9-dashboard-api)
11. [Report API](#10-report-api)
12. [Upload API](#11-upload-api)

---

## ข้อมูลทั่วไป

### Base URL
```
https://{hostname}:5006/api
```

### Authentication
API ส่วนใหญ่ต้องใช้ **Bearer Token** ใน Header:
```
Authorization: Bearer <token>
```

### Response Format
```json
{
  "data": { ... },
  "error": "ข้อความ error (ถ้ามี)"
}
```

### HTTP Status Codes
| Code | คำอธิบาย |
|------|---------|
| 200 | สำเร็จ |
| 201 | สร้างข้อมูลสำเร็จ |
| 400 | Request ไม่ถูกต้อง |
| 401 | ไม่มีสิทธิ์เข้าถึง (Unauthorized) |
| 403 | ห้ามเข้าถึง (Forbidden) |
| 404 | ไม่พบข้อมูล |
| 500 | Server Error |

---

## 1. Authentication API

### 1.1 เข้าสู่ระบบ (Login)

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `POST /api/auth/login` |
| **Auth Required** | ❌ ไม่ต้อง |

**Request Body:**
```json
{
  "username": "admin",
  "password": "password123",
  "rememberMe": true
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInN5c3RlbVJvbGUiOiJBRE1JTiIsInBlcm1pc3Npb25UeXBlIjoiQUxMIiwibmFtZSI6IkFkbWluIiwiaWF0IjoxNzA0Nzg4ODAwLCJleHAiOjE3MDQ4NzUyMDB9.abc123",
  "user": {
    "id": 1,
    "username": "admin",
    "name": "ผู้ดูแลระบบ",
    "systemRole": "ADMIN",
    "permissionType": "ALL",
    "role": "Admin"
  }
}
```

**Error Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

**Error Response (400):**
```json
{
  "error": "Username and password are required"
}
```

---

### 1.2 ดึงข้อมูลผู้ใช้ปัจจุบัน (Get Current User)

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `GET /api/auth/me` |
| **Auth Required** | ✅ ต้องใช้ Token |

**Response (200):**
```json
{
  "id": 1,
  "username": "admin",
  "name": "ผู้ดูแลระบบ",
  "systemRole": "ADMIN",
  "permissionType": "ALL",
  "role": "Admin",
  "assignedMachines": [
    { "id": 1, "name": "LSM-001", "code": "LSM-001" },
    { "id": 2, "name": "VNS-002", "code": "VNS-002" }
  ]
}
```

**Error Response (404):**
```json
{
  "error": "User not found"
}
```

---

## 2. User Master API

### 2.1 ดึงรายชื่อผู้ใช้ทั้งหมด

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `GET /api/user-master` |
| **Auth Required** | ✅ ต้องใช้ Token |

**Query Parameters:**
| Parameter | Type | คำอธิบาย |
|-----------|------|---------|
| machineId | number | กรองตามเครื่องจักรที่ assign |

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "สมชาย ใจดี",
    "role": "INSPECTOR",
    "employeeId": "EMP001",
    "email": "somchai@company.com",
    "username": "somchai",
    "systemRole": "USER",
    "permissionType": "PM_ONLY",
    "assignedMachines": [
      { "id": 1, "name": "LSM-001", "code": "LSM-001" },
      { "id": 2, "name": "LSM-002", "code": "LSM-002" }
    ]
  },
  {
    "id": 2,
    "name": "สมหญิง รักงาน",
    "role": "CHECKER",
    "employeeId": "EMP002",
    "email": "somying@company.com",
    "username": "somying",
    "systemRole": "USER",
    "permissionType": "PM_AND_RESCHEDULE",
    "assignedMachines": []
  }
]
```

---

### 2.2 สร้างผู้ใช้ใหม่

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `POST /api/user-master` |
| **Auth Required** | ✅ ต้องใช้ Token (ADMIN เท่านั้น) |

**Request Body:**
```json
{
  "name": "พนักงานใหม่",
  "role": "INSPECTOR",
  "employeeId": "EMP003",
  "email": "new@company.com",
  "username": "newuser",
  "password": "password123",
  "systemRole": "USER",
  "permissionType": "PM_ONLY",
  "assignedMachineIds": [1, 2, 3]
}
```

**Response (200):**
```json
{
  "id": 3,
  "name": "พนักงานใหม่",
  "role": "INSPECTOR",
  "employeeId": "EMP003",
  "email": "new@company.com",
  "username": "newuser",
  "systemRole": "USER",
  "permissionType": "PM_ONLY",
  "assignedMachines": [
    { "id": 1, "name": "LSM-001", "code": "LSM-001" },
    { "id": 2, "name": "LSM-002", "code": "LSM-002" },
    { "id": 3, "name": "VNS-001", "code": "VNS-001" }
  ]
}
```

**Error Response (400):**
```json
{
  "error": "Employee ID already exists"
}
```

```json
{
  "error": "Username already exists"
}
```

---

### 2.3 แก้ไขข้อมูลผู้ใช้

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `PUT /api/user-master/:id` |
| **Auth Required** | ✅ ต้องใช้ Token (ADMIN เท่านั้น) |

**Path Parameters:**
| Parameter | Type | คำอธิบาย |
|-----------|------|---------|
| id | number | ID ของผู้ใช้ |

**Request Body:**
```json
{
  "name": "สมชาย แก้ไข",
  "role": "BOTH",
  "employeeId": "EMP001-EDIT",
  "email": "somchai.edit@company.com",
  "username": "somchai_edit",
  "password": "newpassword123",
  "systemRole": "USER",
  "permissionType": "PM_AND_RESCHEDULE",
  "assignedMachineIds": [1, 2, 3, 4]
}
```

**Response (200):**
```json
{
  "id": 1,
  "name": "สมชาย แก้ไข",
  "role": "BOTH",
  "employeeId": "EMP001-EDIT",
  "email": "somchai.edit@company.com",
  "username": "somchai_edit",
  "systemRole": "USER",
  "permissionType": "PM_AND_RESCHEDULE",
  "assignedMachines": [
    { "id": 1, "name": "LSM-001", "code": "LSM-001" },
    { "id": 2, "name": "LSM-002", "code": "LSM-002" },
    { "id": 3, "name": "VNS-001", "code": "VNS-001" },
    { "id": 4, "name": "VNS-002", "code": "VNS-002" }
  ]
}
```

---

### 2.4 ลบผู้ใช้

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `DELETE /api/user-master/:id` |
| **Auth Required** | ✅ ต้องใช้ Token (ADMIN เท่านั้น) |

**Response (200):**
```json
{
  "message": "Deleted"
}
```

---

## 3. Machine API

### 3.1 ดึงรายการเครื่องจักรทั้งหมด

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `GET /api/machines` |
| **Auth Required** | ✅ ต้องใช้ Token |

**Response (200):**
```json
[
  {
    "id": 1,
    "code": "LSM-001",
    "name": "Laser Marker 001",
    "model": "LM-2000",
    "location": "Bay A1",
    "image": "/uploads/lsm001.jpg",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-09T10:30:00.000Z",
    "machineMasterId": 1,
    "pmPlans": [
      {
        "id": 1,
        "machineId": 1,
        "preventiveTypeId": 1,
        "frequencyDays": 7,
        "advanceNotifyDays": 2,
        "lastPMDate": "2026-01-05T00:00:00.000Z",
        "nextPMDate": "2026-01-12T00:00:00.000Z",
        "lastCheckStatus": "ALL_OK",
        "preventiveType": {
          "id": 1,
          "name": "Weekly PM",
          "description": "การตรวจสอบรายสัปดาห์"
        }
      }
    ],
    "machineMaster": {
      "id": 1,
      "code": "MC-LSM",
      "name": "Laser Marker",
      "description": "เครื่องยิงเลเซอร์",
      "machineType": {
        "id": 1,
        "name": "LSM",
        "description": "Laser Marker",
        "area": {
          "id": 1,
          "name": "CLASS100",
          "description": "พื้นที่ Class 100"
        }
      }
    }
  }
]
```

---

### 3.2 ดึงข้อมูลเครื่องจักรตาม ID

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `GET /api/machines/:id` |
| **Auth Required** | ❌ ไม่ต้อง |

**Response (200):**
```json
{
  "id": 1,
  "code": "LSM-001",
  "name": "Laser Marker 001",
  "model": "LM-2000",
  "location": "Bay A1",
  "image": "/uploads/lsm001.jpg",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-09T10:30:00.000Z",
  "pmPlans": [
    {
      "id": 1,
      "preventiveTypeId": 1,
      "frequencyDays": 7,
      "advanceNotifyDays": 2,
      "lastPMDate": "2026-01-05T00:00:00.000Z",
      "nextPMDate": "2026-01-12T00:00:00.000Z",
      "preventiveType": {
        "id": 1,
        "name": "Weekly PM",
        "masterChecklists": [
          {
            "id": 1,
            "topic": "ตรวจสอบความสะอาด",
            "type": "BOOLEAN",
            "order": 1
          },
          {
            "id": 2,
            "topic": "วัดค่าแรงดัน",
            "type": "NUMERIC",
            "minVal": 5.0,
            "maxVal": 10.0,
            "order": 2
          }
        ]
      }
    }
  ],
  "machineMaster": {
    "id": 1,
    "code": "MC-LSM",
    "name": "Laser Marker",
    "machineType": {
      "id": 1,
      "name": "LSM",
      "area": {
        "id": 1,
        "name": "CLASS100"
      }
    }
  },
  "checklistTemplates": [],
  "checklists": []
}
```

**Error Response (404):**
```json
{
  "error": "Machine not found"
}
```

---

### 3.3 ดึงประเภทเครื่องจักร

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `GET /api/machines/types` |
| **Auth Required** | ❌ ไม่ต้อง |

**Response (200):**
```json
[
  { "id": 1, "name": "LSM" },
  { "id": 2, "name": "VNS" },
  { "id": 3, "name": "ATX" }
]
```

---

### 3.4 สร้างเครื่องจักรใหม่

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `POST /api/machines` |
| **Auth Required** | ❌ ไม่ต้อง |

**Request Body:**
```json
{
  "code": "LSM-010",
  "name": "Laser Marker 010",
  "model": "LM-3000",
  "location": "Bay B2",
  "machineMasterId": 1
}
```

**Response (200):**
```json
{
  "id": 10,
  "code": "LSM-010",
  "name": "Laser Marker 010",
  "model": "LM-3000",
  "location": "Bay B2",
  "machineMasterId": 1,
  "createdAt": "2026-01-10T10:00:00.000Z",
  "updatedAt": "2026-01-10T10:00:00.000Z"
}
```

---

### 3.5 สร้างเครื่องจักรแบบ Bulk

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `POST /api/machines/bulk` |
| **Auth Required** | ❌ ไม่ต้อง |

**Request Body:**
```json
{
  "machines": [
    { "code": "LSM-011", "name": "Laser Marker 011", "machineMasterId": 1 },
    { "code": "LSM-012", "name": "Laser Marker 012", "machineMasterId": 1 }
  ]
}
```

**Response (200):**
```json
{
  "count": 2,
  "machines": [
    { "id": 11, "code": "LSM-011", "name": "Laser Marker 011" },
    { "id": 12, "code": "LSM-012", "name": "Laser Marker 012" }
  ]
}
```

---

### 3.6 แก้ไขเครื่องจักร

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `PUT /api/machines/:id` |
| **Auth Required** | ❌ ไม่ต้อง |

**Request Body:**
```json
{
  "name": "Laser Marker 001 Updated",
  "location": "Bay A2"
}
```

**Response (200):**
```json
{
  "id": 1,
  "code": "LSM-001",
  "name": "Laser Marker 001 Updated",
  "location": "Bay A2",
  "updatedAt": "2026-01-10T11:00:00.000Z"
}
```

---

### 3.7 ลบเครื่องจักร

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `DELETE /api/machines/:id` |
| **Auth Required** | ❌ ไม่ต้อง |

**Response (200):**
```json
{
  "message": "Deleted"
}
```

---

### 3.8 ลบแผน PM ของเครื่องจักร

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `DELETE /api/machines/plans/:planId` |
| **Auth Required** | ❌ ไม่ต้อง |

**Response (200):**
```json
{
  "message": "PM Plan deleted"
}
```

---

## 4. Machine Master API

### 4.1 ดึงรายการ Machine Master

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `GET /api/machine-master` |
| **Auth Required** | ✅ ต้องใช้ Token |

**Response (200):**
```json
[
  {
    "id": 1,
    "code": "MC-LSM",
    "name": "Laser Marker",
    "description": "เครื่องยิงเลเซอร์",
    "machineTypeId": 1,
    "machineType": {
      "id": 1,
      "name": "LSM"
    }
  },
  {
    "id": 2,
    "code": "MC-VNS",
    "name": "Vision System",
    "description": "ระบบตรวจสอบด้วยภาพ",
    "machineTypeId": 2,
    "machineType": {
      "id": 2,
      "name": "VNS"
    }
  }
]
```

---

### 4.2 สร้าง Machine Master

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `POST /api/machine-master` |
| **Auth Required** | ❌ ไม่ต้อง |

**Request Body:**
```json
{
  "code": "MC-NEW",
  "name": "New Machine Type",
  "description": "คำอธิบายใหม่",
  "machineTypeId": 1
}
```

**Response (200):**
```json
{
  "id": 3,
  "code": "MC-NEW",
  "name": "New Machine Type",
  "description": "คำอธิบายใหม่",
  "machineTypeId": 1
}
```

---

### 4.3 แก้ไข Machine Master

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `PUT /api/machine-master/:id` |
| **Auth Required** | ❌ ไม่ต้อง |

**Request Body:**
```json
{
  "code": "MC-LSM",
  "name": "Laser Marker Updated",
  "description": "เครื่องยิงเลเซอร์ (แก้ไข)",
  "machineTypeId": 1
}
```

**Response (200):**
```json
{
  "id": 1,
  "code": "MC-LSM",
  "name": "Laser Marker Updated",
  "description": "เครื่องยิงเลเซอร์ (แก้ไข)",
  "machineTypeId": 1
}
```

---

### 4.4 ลบ Machine Master

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `DELETE /api/machine-master/:id` |
| **Auth Required** | ❌ ไม่ต้อง |

**Response (200):**
```json
{
  "message": "Deleted"
}
```

---

## 5. Machine Type API

### 5.1 ดึงประเภทเครื่องจักรทั้งหมด

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `GET /api/machine-types` |
| **Auth Required** | ✅ ต้องใช้ Token |

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "LSM",
    "description": "Laser Marker",
    "areaId": 1,
    "area": {
      "id": 1,
      "name": "CLASS100",
      "description": "พื้นที่ Class 100"
    }
  },
  {
    "id": 2,
    "name": "VNS",
    "description": "Vision System",
    "areaId": 1,
    "area": {
      "id": 1,
      "name": "CLASS100",
      "description": "พื้นที่ Class 100"
    }
  }
]
```

---

### 5.2 สร้างประเภทเครื่องจักร

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `POST /api/machine-types` |
| **Auth Required** | ❌ ไม่ต้อง |

**Request Body:**
```json
{
  "name": "NEW",
  "description": "New Machine Type",
  "areaId": 1
}
```

**Response (200):**
```json
{
  "id": 5,
  "name": "NEW",
  "description": "New Machine Type",
  "areaId": 1
}
```

---

### 5.3 แก้ไขประเภทเครื่องจักร

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `PUT /api/machine-types/:id` |
| **Auth Required** | ❌ ไม่ต้อง |

**Request Body:**
```json
{
  "name": "LSM",
  "description": "Laser Marker Updated",
  "areaId": 1
}
```

**Response (200):**
```json
{
  "id": 1,
  "name": "LSM",
  "description": "Laser Marker Updated",
  "areaId": 1
}
```

---

### 5.4 ลบประเภทเครื่องจักร

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `DELETE /api/machine-types/:id` |
| **Auth Required** | ❌ ไม่ต้อง |

**Response (200):**
```json
{
  "message": "Deleted"
}
```

---

## 6. Area API

### 6.1 ดึงรายการพื้นที่ทั้งหมด

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `GET /api/areas` |
| **Auth Required** | ✅ ต้องใช้ Token |

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "CLASS100",
    "description": "พื้นที่ Class 100 - Clean Room",
    "machineTypes": [
      { "id": 1, "name": "LSM", "description": "Laser Marker" },
      { "id": 2, "name": "VNS", "description": "Vision System" }
    ]
  },
  {
    "id": 2,
    "name": "OUTDOOR",
    "description": "พื้นที่กลางแจ้ง",
    "machineTypes": [
      { "id": 3, "name": "GEN", "description": "Generator" }
    ]
  }
]
```

---

### 6.2 สร้างพื้นที่ใหม่

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `POST /api/areas` |
| **Auth Required** | ❌ ไม่ต้อง |

**Request Body:**
```json
{
  "name": "WAREHOUSE",
  "description": "คลังสินค้า"
}
```

**Response (200):**
```json
{
  "id": 3,
  "name": "WAREHOUSE",
  "description": "คลังสินค้า"
}
```

---

### 6.3 แก้ไขพื้นที่

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `PUT /api/areas/:id` |
| **Auth Required** | ❌ ไม่ต้อง |

**Request Body:**
```json
{
  "name": "CLASS100",
  "description": "พื้นที่ Class 100 - Clean Room (แก้ไข)"
}
```

**Response (200):**
```json
{
  "id": 1,
  "name": "CLASS100",
  "description": "พื้นที่ Class 100 - Clean Room (แก้ไข)"
}
```

---

### 6.4 ลบพื้นที่

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `DELETE /api/areas/:id` |
| **Auth Required** | ❌ ไม่ต้อง |

**Response (200):**
```json
{
  "message": "Deleted"
}
```

---

## 7. Preventive Type API

### 7.1 ดึงประเภท PM ทั้งหมด

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `GET /api/preventive-types` |
| **Auth Required** | ✅ ต้องใช้ Token |

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "Weekly PM",
    "description": "การตรวจสอบรายสัปดาห์",
    "image": "/uploads/weekly-pm-diagram.jpg",
    "isFixedDate": true,
    "postponeLogic": "SHIFT",
    "emailRecipients": "supervisor@company.com,manager@company.com",
    "notifyAdvanceDays": 3,
    "masterChecklists": [
      {
        "id": 1,
        "topic": "ตรวจสอบความสะอาดภายนอก",
        "description": "ทำความสะอาดฝุ่นและคราบสกปรก",
        "type": "BOOLEAN",
        "minVal": null,
        "maxVal": null,
        "options": null,
        "isRequired": true,
        "useValueLimit": false,
        "valueLimitCount": 0,
        "valueLimitHours": 0,
        "isActive": true,
        "order": 1
      },
      {
        "id": 2,
        "topic": "วัดค่าแรงดันลม",
        "description": "ค่าที่ยอมรับได้ 5-10 bar",
        "type": "NUMERIC",
        "minVal": 5.0,
        "maxVal": 10.0,
        "options": null,
        "isRequired": true,
        "useValueLimit": false,
        "valueLimitCount": 0,
        "valueLimitHours": 0,
        "isActive": true,
        "order": 2
      }
    ]
  },
  {
    "id": 2,
    "name": "Monthly PM",
    "description": "การตรวจสอบรายเดือน",
    "image": null,
    "isFixedDate": false,
    "postponeLogic": "MAINTAIN_CYCLE",
    "emailRecipients": null,
    "notifyAdvanceDays": 7,
    "masterChecklists": []
  }
]
```

---

### 7.2 สร้างประเภท PM

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `POST /api/preventive-types` |
| **Auth Required** | ❌ ไม่ต้อง |

**Request Body:**
```json
{
  "name": "Daily PM",
  "description": "การตรวจสอบรายวัน",
  "isFixedDate": true,
  "postponeLogic": "SHIFT",
  "emailRecipients": "team@company.com",
  "notifyAdvanceDays": 1
}
```

**Response (200):**
```json
{
  "id": 3,
  "name": "Daily PM",
  "description": "การตรวจสอบรายวัน",
  "image": null,
  "isFixedDate": true,
  "postponeLogic": "SHIFT",
  "emailRecipients": "team@company.com",
  "notifyAdvanceDays": 1
}
```

---

### 7.3 แก้ไขประเภท PM

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `PUT /api/preventive-types/:id` |
| **Auth Required** | ❌ ไม่ต้อง |

**Request Body:**
```json
{
  "name": "Weekly PM",
  "description": "การตรวจสอบรายสัปดาห์ (แก้ไข)",
  "isFixedDate": true,
  "postponeLogic": "SHIFT",
  "emailRecipients": "supervisor@company.com",
  "notifyAdvanceDays": 5
}
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Weekly PM",
  "description": "การตรวจสอบรายสัปดาห์ (แก้ไข)",
  "image": null,
  "isFixedDate": true,
  "postponeLogic": "SHIFT",
  "emailRecipients": "supervisor@company.com",
  "notifyAdvanceDays": 5
}
```

---

### 7.4 ลบประเภท PM

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `DELETE /api/preventive-types/:id` |
| **Auth Required** | ❌ ไม่ต้อง |

**Response (200):**
```json
{
  "message": "Deleted"
}
```

---

### 7.5 เพิ่ม Master Checklist

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `POST /api/preventive-types/:id/checklists` |
| **Auth Required** | ❌ ไม่ต้อง |

**Request Body:**
```json
{
  "topic": "ตรวจสอบหัวข้อใหม่",
  "description": "คำอธิบายหัวข้อ",
  "type": "BOOLEAN",
  "isRequired": true,
  "order": 3
}
```

**Response (200):**
```json
{
  "id": 10,
  "preventiveTypeId": 1,
  "topic": "ตรวจสอบหัวข้อใหม่",
  "description": "คำอธิบายหัวข้อ",
  "type": "BOOLEAN",
  "minVal": null,
  "maxVal": null,
  "isRequired": true,
  "order": 3
}
```

---

### 7.6 แก้ไข Master Checklist

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `PUT /api/preventive-types/checklists/:itemId` |
| **Auth Required** | ❌ ไม่ต้อง |

**Request Body:**
```json
{
  "topic": "ตรวจสอบความสะอาด (แก้ไข)",
  "description": "คำอธิบายใหม่",
  "type": "BOOLEAN",
  "isRequired": true,
  "isActive": true,
  "order": 1
}
```

**Response (200):**
```json
{
  "id": 1,
  "preventiveTypeId": 1,
  "topic": "ตรวจสอบความสะอาด (แก้ไข)",
  "description": "คำอธิบายใหม่",
  "type": "BOOLEAN",
  "minVal": null,
  "maxVal": null,
  "isRequired": true,
  "isActive": true,
  "order": 1
}
```

---

### 7.7 จัดลำดับ Master Checklists

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `PUT /api/preventive-types/checklists/reorder` |
| **Auth Required** | ❌ ไม่ต้อง |

**Request Body:**
```json
{
  "items": [
    { "id": 1, "order": 1 },
    { "id": 2, "order": 2 },
    { "id": 3, "order": 3 }
  ]
}
```

**Response (200):**
```json
{
  "message": "Reordered successfully"
}
```

---

## 8. PM Records API

### 8.1 ดึงตาราง PM (Schedule)

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `GET /api/pm/schedule` |
| **Auth Required** | ✅ ต้องใช้ Token |

**Query Parameters:**
| Parameter | Type | คำอธิบาย |
|-----------|------|---------|
| month | number | เดือน (1-12) |
| year | number | ปี ค.ศ. |

**Response (200):**
```json
[
  {
    "id": "record-1",
    "type": "completed",
    "date": "2026-01-05T10:30:00.000Z",
    "machine": {
      "id": 1,
      "name": "LSM-001",
      "code": "LSM-001"
    },
    "preventiveType": {
      "name": "Weekly PM"
    },
    "status": "COMPLETED",
    "lastCheckStatus": "ALL_OK",
    "inspector": "สมชาย ใจดี",
    "checker": "สมหญิง รักงาน"
  },
  {
    "id": "schedule-1-1",
    "type": "upcoming",
    "date": "2026-01-12T00:00:00.000Z",
    "machine": {
      "id": 1,
      "name": "LSM-001",
      "code": "LSM-001"
    },
    "preventiveType": {
      "name": "Weekly PM"
    },
    "daysUntil": 2,
    "frequencyDays": 7
  },
  {
    "id": "schedule-2-1",
    "type": "overdue",
    "date": "2026-01-08T00:00:00.000Z",
    "machine": {
      "id": 2,
      "name": "VNS-001",
      "code": "VNS-001"
    },
    "preventiveType": {
      "name": "Weekly PM"
    },
    "daysUntil": -2,
    "frequencyDays": 7
  }
]
```

---

### 8.2 ดึงสถิติ Dashboard

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `GET /api/pm/dashboard-stats` |
| **Auth Required** | ✅ ต้องใช้ Token |

**Response (200):**
```json
{
  "summary": {
    "completed": 45,
    "upcoming": 10,
    "overdue": 3,
    "has_ng": 2,
    "total": 60
  },
  "machines": [
    {
      "id": 1,
      "code": "LSM-001",
      "name": "Laser Marker 001",
      "model": "LM-2000",
      "location": "Bay A1",
      "machineMaster": {
        "id": 1,
        "code": "MC-LSM",
        "name": "Laser Marker",
        "machineType": {
          "id": 1,
          "name": "LSM",
          "area": {
            "id": 1,
            "name": "CLASS100"
          }
        }
      },
      "status": "OK",
      "lastCheckStatus": "ALL_OK",
      "preventiveType": {
        "id": 1,
        "name": "Weekly PM"
      },
      "preventiveTypeId": 1,
      "pmConfig": {
        "frequencyDays": 7,
        "advanceNotifyDays": 2,
        "lastPMDate": "2026-01-05T00:00:00.000Z",
        "nextPMDate": "2026-01-12T00:00:00.000Z"
      }
    }
  ]
}
```

---

### 8.3 ดึงสถานะเครื่องจักรภาพรวม

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `GET /api/pm/global-status` |
| **Auth Required** | ✅ ต้องใช้ Token |

**Response (200):** (โครงสร้างเหมือน Dashboard Stats)

---

### 8.4 ดึง PM Record ตาม ID

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `GET /api/pm/records/:id` |
| **Auth Required** | ✅ ต้องใช้ Token |

**Response (200):**
```json
{
  "id": 1,
  "machineId": 1,
  "preventiveTypeId": 1,
  "date": "2026-01-05T10:30:00.000Z",
  "inspector": "สมชาย ใจดี",
  "checker": "สมหญิง รักงาน",
  "status": "COMPLETED",
  "remark": "ทำ PM สำเร็จ ไม่พบปัญหา",
  "machine": {
    "id": 1,
    "code": "LSM-001",
    "name": "Laser Marker 001",
    "machineMaster": {
      "id": 1,
      "name": "Laser Marker",
      "machineType": {
        "id": 1,
        "name": "LSM",
        "area": {
          "id": 1,
          "name": "CLASS100"
        }
      }
    }
  },
  "preventiveType": {
    "id": 1,
    "name": "Weekly PM",
    "masterChecklists": [
      { "id": 1, "topic": "ตรวจสอบความสะอาด", "type": "BOOLEAN" },
      { "id": 2, "topic": "วัดค่าแรงดัน", "type": "NUMERIC" }
    ]
  },
  "details": [
    {
      "id": 1,
      "recordId": 1,
      "checklistId": 1,
      "topic": "ตรวจสอบความสะอาด",
      "isPass": true,
      "value": null,
      "remark": null,
      "subItemName": null,
      "image": null,
      "imageBefore": null,
      "imageAfter": null,
      "masterChecklist": {
        "id": 1,
        "topic": "ตรวจสอบความสะอาด"
      }
    },
    {
      "id": 2,
      "recordId": 1,
      "checklistId": 2,
      "topic": "วัดค่าแรงดัน",
      "isPass": true,
      "value": "7.5",
      "remark": null,
      "subItemName": null,
      "image": null,
      "imageBefore": null,
      "imageAfter": null,
      "masterChecklist": {
        "id": 2,
        "topic": "วัดค่าแรงดัน"
      }
    }
  ]
}
```

**Error Response (404):**
```json
{
  "error": "PM Record not found"
}
```

---

### 8.5 ดึงประวัติ PM ของเครื่องจักร

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `GET /api/pm/machine/:machineId/history` |
| **Auth Required** | ✅ ต้องใช้ Token |

**Query Parameters:**
| Parameter | Type | คำอธิบาย |
|-----------|------|---------|
| page | number | หน้าที่ต้องการ (default: 1) |
| limit | number | จำนวนรายการต่อหน้า (default: 10) |
| year | number | กรองตามปี |
| pmTypeId | number | กรองตามประเภท PM |
| area | string | กรองตามพื้นที่ |
| type | string | กรองตามประเภทเครื่อง |

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "machineId": 1,
      "date": "2026-01-05T10:30:00.000Z",
      "inspector": "สมชาย ใจดี",
      "checker": "สมหญิง รักงาน",
      "status": "COMPLETED",
      "remark": null,
      "machine": {
        "id": 1,
        "code": "LSM-001",
        "name": "Laser Marker 001"
      },
      "preventiveType": {
        "id": 1,
        "name": "Weekly PM",
        "masterChecklists": []
      },
      "details": []
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

**Error Response (403):**
```json
{
  "error": "Access denied to this machine"
}
```

---

### 8.6 บันทึกผล PM

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `POST /api/pm/record` |
| **Auth Required** | ✅ ต้องใช้ Token |

**Request Body:**
```json
{
  "machineId": 1,
  "preventiveTypeId": 1,
  "inspector": "สมชาย ใจดี",
  "checker": "สมหญิง รักงาน",
  "status": "COMPLETED",
  "remark": "ทำ PM สำเร็จ",
  "details": [
    {
      "checklistId": 1,
      "isPass": true,
      "value": null,
      "remark": null
    },
    {
      "checklistId": 2,
      "isPass": true,
      "value": "7.5",
      "remark": null
    }
  ]
}
```

**Response (200):**
```json
{
  "id": 10,
  "machineId": 1,
  "preventiveTypeId": 1,
  "date": "2026-01-10T10:00:00.000Z",
  "inspector": "สมชาย ใจดี",
  "checker": "สมหญิง รักงาน",
  "status": "COMPLETED",
  "remark": "ทำ PM สำเร็จ",
  "details": [
    { "id": 20, "checklistId": 1, "isPass": true },
    { "id": 21, "checklistId": 2, "isPass": true, "value": "7.5" }
  ]
}
```

---

### 8.7 แก้ไข PM Record

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `PUT /api/pm/records/:id` |
| **Auth Required** | ✅ ต้องใช้ Token |

**Request Body:**
```json
{
  "machineId": 1,
  "preventiveTypeId": 1,
  "inspector": "สมชาย ใจดี (แก้ไข)",
  "checker": "สมหญิง รักงาน",
  "status": "COMPLETED",
  "remark": "แก้ไขบันทึก PM",
  "details": [
    {
      "checklistId": 1,
      "isPass": true,
      "value": null,
      "remark": "ผ่าน"
    },
    {
      "checklistId": 2,
      "isPass": true,
      "value": "8.0",
      "remark": null
    }
  ]
}
```

**Response (200):**
```json
{
  "id": 10,
  "machineId": 1,
  "preventiveTypeId": 1,
  "date": "2026-01-10T10:00:00.000Z",
  "inspector": "สมชาย ใจดี (แก้ไข)",
  "checker": "สมหญิง รักงาน",
  "status": "COMPLETED",
  "remark": "แก้ไขบันทึก PM",
  "details": [
    { "id": 20, "checklistId": 1, "isPass": true, "remark": "ผ่าน" },
    { "id": 21, "checklistId": 2, "isPass": true, "value": "8.0" }
  ]
}
```

---

### 8.8 ลบ PM Record

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `DELETE /api/pm/records/:id` |
| **Auth Required** | ✅ ต้องใช้ Token |

**Response (200):**
```json
{
  "message": "Deleted"
}
```

---

### 8.9 วิเคราะห์ข้อมูลเครื่องจักร

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `GET /api/pm/analysis/machine` |
| **Auth Required** | ✅ ต้องใช้ Token |

**Response (200):**
```json
[
  {
    "machineId": 1,
    "machineName": "LSM-001",
    "totalRecords": 52,
    "completedOnTime": 48,
    "late": 4,
    "passRate": 92.3
  }
]
```

---

### 8.10 วิเคราะห์ข้อมูลผู้ปฏิบัติงาน

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `GET /api/pm/analysis/operator` |
| **Auth Required** | ✅ ต้องใช้ Token |

**Response (200):**
```json
[
  {
    "operatorName": "สมชาย ใจดี",
    "totalRecords": 100,
    "completedOnTime": 95,
    "late": 5,
    "efficiency": 95.0
  }
]
```

---

### 8.11 เลื่อนกำหนด PM

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `POST /api/pm/reschedule` |
| **Auth Required** | ✅ ต้องใช้ Token |

**Request Body:**
```json
{
  "machineId": 1,
  "preventiveTypeId": 1,
  "newDate": "2026-01-15"
}
```

**Response (200):**
```json
{
  "message": "Rescheduled successfully",
  "newNextPMDate": "2026-01-15T00:00:00.000Z"
}
```

---

## 9. Dashboard API

### 9.1 ดึงสถิติ Dashboard

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `GET /api/dashboard/stats` |
| **Auth Required** | ✅ ต้องใช้ Token |

**Response (200):**
```json
{
  "summary": {
    "completed": 45,
    "upcoming": 10,
    "overdue": 3,
    "has_ng": 2,
    "total": 60
  },
  "machines": [...]
}
```

(โครงสร้างเหมือน `/api/pm/dashboard-stats`)

---

### 9.2 ดึงสถิติผู้ปฏิบัติงาน

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `GET /api/dashboard/operator-stats` |
| **Auth Required** | ❌ ไม่ต้อง |

**Query Parameters:**
| Parameter | Type | คำอธิบาย |
|-----------|------|---------|
| startDate | string | วันที่เริ่มต้น (YYYY-MM-DD) |
| endDate | string | วันที่สิ้นสุด (YYYY-MM-DD) |

**Response (200):**
```json
[
  {
    "name": "สมชาย ใจดี",
    "total": 50,
    "completed": 45,
    "late": 3,
    "planned": 2,
    "records": [
      {
        "id": 1,
        "date": "2026-01-05T10:30:00.000Z",
        "machine": "LSM-001",
        "status": "COMPLETED"
      },
      {
        "id": 2,
        "date": "2026-01-06T09:00:00.000Z",
        "machine": "VNS-001",
        "status": "LATE"
      }
    ]
  },
  {
    "name": "สมหญิง รักงาน",
    "total": 30,
    "completed": 28,
    "late": 2,
    "planned": 0,
    "records": []
  }
]
```

---

## 10. Report API

### 10.1 ดึงรายงาน

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `GET /api/reports` |
| **Auth Required** | ✅ ต้องใช้ Token |

**Query Parameters:**
| Parameter | Type | คำอธิบาย |
|-----------|------|---------|
| startDate | string | วันที่เริ่มต้น (YYYY-MM-DD) |
| endDate | string | วันที่สิ้นสุด (YYYY-MM-DD) |
| machineId | number | กรองตามเครื่องจักร |
| status | string | กรองตามสถานะ (COMPLETED/LATE/PLANNED) |

**Response (200):**
```json
[
  {
    "id": 1,
    "machineId": 1,
    "preventiveTypeId": 1,
    "date": "2026-01-05T10:30:00.000Z",
    "inspector": "สมชาย ใจดี",
    "checker": "สมหญิง รักงาน",
    "status": "COMPLETED",
    "remark": null,
    "machine": {
      "id": 1,
      "code": "LSM-001",
      "name": "Laser Marker 001",
      "machineMaster": {
        "id": 1,
        "name": "Laser Marker",
        "machineType": {
          "id": 1,
          "name": "LSM",
          "area": {
            "id": 1,
            "name": "CLASS100"
          }
        }
      }
    },
    "details": [
      {
        "id": 1,
        "checklistId": 1,
        "topic": "ตรวจสอบความสะอาด",
        "isPass": true,
        "value": null,
        "masterChecklist": {
          "id": 1,
          "topic": "ตรวจสอบความสะอาด"
        }
      }
    ]
  }
]
```

**Error Response (403):**
```json
{
  "error": "Access denied to this machine"
}
```

---

## 11. Upload API

### 11.1 อัพโหลดรูปภาพ

| รายการ | รายละเอียด |
|--------|-----------|
| **Endpoint** | `POST /api/upload` |
| **Auth Required** | ❌ ไม่ต้อง |
| **Content-Type** | `multipart/form-data` |

**Request Body:**
| Field | Type | คำอธิบาย |
|-------|------|---------|
| image | File | ไฟล์รูปภาพ (jpg, png, gif) |

**Response (200):**
```json
{
  "url": "/uploads/1704788800000-image.jpg"
}
```

**Error Response (400):**
```json
{
  "error": "No file uploaded"
}
```

---

## 📌 หมายเหตุ

- API ที่มี `Auth Required: ✅` ต้องส่ง Token ใน Header
- Token ได้มาจาก `/api/auth/login`
- บาง API สำหรับ ADMIN เท่านั้น จะต้อง login ด้วย user ที่มี `systemRole: ADMIN`
- Response ทั้งหมดเป็น JSON format
- ค่า Date/DateTime จะอยู่ในรูปแบบ ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)

---

*เอกสารนี้ปรับปรุงเมื่อ: มกราคม 2026*
