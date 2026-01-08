"""  
PM Email Sender - Preventive Maintenance Email Notification
============================================================
ส่ง Email แจ้งเตือน PM ล่วงหน้าตามจำนวนวันที่กำหนด

Usage:
    python pm_email_sender.py

ใช้กับ Windows Task Scheduler:
    Action: Start a program
    Program: python
    Arguments: C:\FDB\Project\maintenance_pm_project\PM_Email_Sender\pm_email_sender.py

SMTP Mode: SMTP Relay (No Authentication) - Like Test_mail_2
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, date
from dotenv import load_dotenv
import pyodbc

# Load environment variables
load_dotenv()

# =============================================
# Configuration
# =============================================
DB_SERVER = os.getenv('DB_SERVER', '192.168.98.11')
DB_NAME = os.getenv('DB_NAME', 'TOOLING_PM')
DB_USER = os.getenv('DB_USER', 'sa')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')

SMTP_HOST = os.getenv('SMTP_HOST', '192.168.98.1')
SMTP_PORT = int(os.getenv('SMTP_PORT', '25'))
SMTP_FROM = os.getenv('SMTP_FROM', '')

APP_BASE_URL = os.getenv('APP_BASE_URL', 'http://localhost:3000')


def get_db_connection():
    """Connect to SQL Server database"""
    conn_str = (
        f"DRIVER={{ODBC Driver 17 for SQL Server}};"
        f"SERVER={DB_SERVER};"
        f"DATABASE={DB_NAME};"
        f"UID={DB_USER};"
        f"PWD={DB_PASSWORD}"
    )
    return pyodbc.connect(conn_str)


def get_preventive_types_with_recipients(conn):
    """Get PreventiveType records that have email recipients configured"""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, name, emailRecipients, notifyAdvanceDays
        FROM PreventiveType
        WHERE emailRecipients IS NOT NULL AND emailRecipients != ''
    """)
    return cursor.fetchall()


def get_due_machines(conn, preventive_type_id, notify_advance_days):
    """Get machines that are due for PM within the advance notice period"""
    today = date.today()
    
    cursor = conn.cursor()
    # Join with MachineMaster, MachineType, and Area to get full hierarchy
    cursor.execute("""
        SELECT m.code, m.name, p.nextPMDate,
               ISNULL(mt.name, 'N/A') as machineType,
               ISNULL(a.name, 'N/A') as areaName
        FROM MachinePMPlan p
        JOIN Machine m ON p.machineId = m.id
        LEFT JOIN MachineMaster mm ON m.machineMasterId = mm.id
        LEFT JOIN MachineType mt ON mm.machineTypeId = mt.id
        LEFT JOIN Area a ON mt.areaId = a.id
        WHERE p.preventiveTypeId = ?
          AND p.nextPMDate IS NOT NULL
    """, preventive_type_id)
    
    due_machines = []
    for row in cursor.fetchall():
        code, name, next_pm_date, machine_type, area_name = row
        if next_pm_date:
            # Calculate days difference
            next_date = next_pm_date.date() if hasattr(next_pm_date, 'date') else next_pm_date
            diff_days = (next_date - today).days
            
            # Check if exactly N days in advance OR Overdue
            if diff_days <= notify_advance_days:
                due_machines.append({
                    'code': code,
                    'name': name,
                    'date': next_date.strftime('%Y-%m-%d'),
                    'daysLeft': diff_days,
                    'machineType': machine_type,
                    'area': area_name
                })
    
    return due_machines


def build_email_html(pm_type_name, notify_advance_days, machines):
    """Build HTML email content"""
    sent_date = datetime.now().strftime('%d/%m/%Y %H:%M')
    
    # Build machine rows
    machine_rows = ""
    for idx, m in enumerate(machines, 1):
        days_left = m['daysLeft']
        
        if days_left < 0:
            status_label = "OVERDUE"
            remaining_text = f"{abs(days_left)} days late"
            status_color = "#d32f2f" # Red
            bg_color = "#ffebee" # Light Red
        elif days_left == 0:
            status_label = "DUE TODAY"
            remaining_text = "-"
            status_color = "#f57c00" # Orange
            bg_color = "#fff3e0" # Light Orange
        else:
            status_label = "UPCOMING"
            remaining_text = f"{days_left} days"
            status_color = "#1976D2" # Blue
            bg_color = "#ffffff" # White

        machine_rows += f"""
        <tr style="background-color: {bg_color};">
            <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">{idx}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">{m['area']}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">{m['machineType']}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; font-weight: bold;">{m['name']}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center; color: #333;">{m['date']}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center; font-weight: bold; color: {status_color};">{status_label}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center; color: #555;">{remaining_text}</td>
        </tr>
        """
    
    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 1000px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1976D2 0%, #42A5F5 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">
                🔧 Preventive Maintenance Notification
            </h1>
        </div>
        
        <!-- PM Info -->
        <div style="padding: 25px; background-color: #E3F2FD; border-bottom: 1px solid #BBDEFB;">
            <table style="width: 100%;">
                <tr>
                    <td style="padding: 5px 0;"><strong>PM Type:</strong></td>
                    <td style="padding: 5px 0; color: #1976D2; font-weight: bold;">{pm_type_name}</td>
                </tr>
                <tr>
                    <td style="padding: 5px 0;"><strong>Advance Notice:</strong></td>
                    <td style="padding: 5px 0;">{notify_advance_days} days</td>
                </tr>
                <tr>
                    <td style="padding: 5px 0;"><strong>Sent:</strong></td>
                    <td style="padding: 5px 0;">{sent_date}</td>
                </tr>
            </table>
        </div>
        
        <!-- Machine List -->
        <div style="padding: 25px;">
            <h2 style="color: #333; margin-top: 0; font-size: 18px;">
                📋 Machines Due for PM ({len(machines)})
            </h2>
            <table style="width: 100%; border-collapse: collapse; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <thead>
                    <tr style="background-color: #1976D2; color: #fff;">
                        <th style="padding: 14px; text-align: center; width: 5%;">No.</th>
                        <th style="padding: 14px; text-align: left; width: 15%;">Area</th>
                        <th style="padding: 14px; text-align: left; width: 15%;">Machine Type</th>
                        <th style="padding: 14px; text-align: left; width: 25%;">Machine Name</th>
                        <th style="padding: 14px; text-align: center; width: 15%;">PM Due Date</th>
                        <th style="padding: 14px; text-align: center; width: 15%;">Status</th>
                        <th style="padding: 14px; text-align: center; width: 10%;">Remaining</th>
                    </tr>
                </thead>
                <tbody>
                    {machine_rows}
                </tbody>
            </table>
        </div>
        
        <!-- Action Button -->
        <div style="padding: 0 25px 25px; text-align: center;">
            <a href="{APP_BASE_URL}/machines/overall" 
               style="display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%); color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(76,175,80,0.4);">
                🔗 View All PM Plans
            </a>
            <p style="color: #666; font-size: 13px; margin-top: 15px;">
                Click the button above to view or reschedule PM plans
            </p>
        </div>
        
        <!-- Contact Info -->
        <div style="padding: 20px 25px; background-color: #FAFAFA; border-top: 1px solid #e0e0e0;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #555;">
                <strong>If you have any questions, please contact:</strong>
            </p>
            <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 14px;">
                <li>Apiwat Nonut, Tel: 2018, IoT Section</li>
                <li>Panachai Poochomchuan, Tel: 2016, Maintenance Section</li>
            </ul>
        </div>
        
        <!-- Footer -->
        <div style="padding: 15px; background-color: #37474F; text-align: center;">
            <p style="color: #B0BEC5; margin: 0; font-size: 12px;">
                Sent from PM Maintenance System
            </p>
        </div>
        
    </div>
</body>
</html>
    """.strip()


def send_email(to_emails, subject, html_body):
    """Send email via SMTP Relay (No Authentication - Like Test_mail_2)"""
    if not SMTP_FROM:
        print("❌ Error: SMTP_FROM not configured")
        return False
    
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = SMTP_FROM
    msg['To'] = to_emails
    
    # Attach HTML body
    msg.attach(MIMEText(html_body, 'html', 'utf-8'))
    
    try:
        # Connect to SMTP Relay (No Authentication - Like Test_mail_2)
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            # No login required for SMTP Relay
            server.sendmail(SMTP_FROM, to_emails.split(','), msg.as_string())
        
        print(f"📧 Email sent to: {to_emails}")
        return True
    except Exception as e:
        print(f"❌ Error sending email: {e}")
        return False


def main():
    """Main function - check PM schedules and send notifications"""
    print("=" * 50)
    print(f"🔧 PM Email Sender - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    try:
        # Connect to database
        conn = get_db_connection()
        print(f"✅ Connected to database: {DB_SERVER}/{DB_NAME}")
        
        # Get preventive types with email recipients
        pm_types = get_preventive_types_with_recipients(conn)
        print(f"📋 Found {len(pm_types)} PM Types with email recipients")
        
        for pm_type in pm_types:
            pm_id, pm_name, recipients, advance_days = pm_type
            print(f"\n🔍 Checking: {pm_name} (notify {advance_days} days in advance)")
            
            # Get machines due for PM
            due_machines = get_due_machines(conn, pm_id, advance_days)
            
            if due_machines:
                print(f"   📌 Found {len(due_machines)} machines due for PM")
                
                # Build and send email
                html_body = build_email_html(pm_name, advance_days, due_machines)
                subject = f"📅 PM Alert: {pm_name} - {len(due_machines)} Machines Due for PM"
                
                send_email(recipients, subject, html_body)
            else:
                print(f"   ✓ No machines due for PM today")
        
        conn.close()
        print("\n" + "=" * 50)
        print("✅ PM Email Sender completed")
        print("=" * 50)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        raise


if __name__ == "__main__":
    main()
