# PM Email Sender

ระบบส่ง Email แจ้งเตือน Preventive Maintenance (PM) ล่วงหน้า

## Requirements

- Python 3.8+
- ODBC Driver 17 for SQL Server
- Network access to SMTP server (192.168.98.1:25)

## Installation

```bash
cd C:\FDB\Project\maintenance_pm_project\PM_Email_Sender

# Activate virtual environment
.\venv\Scripts\activate

# Install dependencies (if needed)
pip install -r requirements.txt
```

## Configuration

1. Copy `.env.example` to `.env`
2. แก้ไขค่าใน `.env`:

```env
# Database
DB_SERVER=192.168.98.11
DB_USER=sa
DB_PASSWORD=your_password

# SMTP (No Auth - SMTP Relay)
SMTP_FROM=apiwat.n@minebea.co.th
```

## Usage

### Run Manually (ทดสอบ)
```bash
# Activate venv first
.\venv\Scripts\activate

# Run script
python pm_email_sender.py
```

### Windows Task Scheduler Setup

1. เปิด **Task Scheduler** (taskschd.msc)
2. คลิก **Create Task**
3. **General tab:**
   - Name: `PM Email Sender`
   - Run whether user is logged on or not: ✓
4. **Triggers tab:**
   - New → Daily at 08:00
5. **Actions tab:**
   - Action: Start a program
   - Program: `C:\FDB\Project\maintenance_pm_project\PM_Email_Sender\venv\Scripts\python.exe`
   - Arguments: `pm_email_sender.py`
   - Start in: `C:\FDB\Project\maintenance_pm_project\PM_Email_Sender`
6. **OK** → Enter password

## How it Works

```
1. อ่าน PreventiveType ที่มี emailRecipients จาก Database
2. ตรวจ MachinePMPlan.nextPMDate vs notifyAdvanceDays
3. สร้าง HTML Email
4. ส่งผ่าน SMTP Relay (192.168.98.1:25)
```
