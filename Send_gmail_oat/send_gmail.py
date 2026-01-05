# send_gmail_auto.py — ส่งอีเมล + คำนวณจำนวนวันที่เกินกำหนด + Highlight สีแดง

import os, ssl, time, smtplib, logging, argparse, re
from pathlib import Path
from logging.handlers import RotatingFileHandler
from datetime import datetime, timedelta, timezone
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
load_dotenv(override=True)

# -------------------------------------------------------------
# ENV helper
# -------------------------------------------------------------
def _getenv_stripped(key: str, default: str | None = None) -> str | None:
    v = os.getenv(key, default)
    return v.strip() if isinstance(v, str) else v

PG_URL       = _getenv_stripped("PG_URL", "postgresql+psycopg2://spindle_pcms_bpi:bangpa1n@10.120.123.25:5432/Machine_condition_2")
GMAIL_USER   = _getenv_stripped("GMAIL_USER", "nares.a@minebea.co.th")
GMAIL_APP_PASSWORD = _getenv_stripped("GMAIL_APP_PASSWORD")
LOG_DIR      = _getenv_stripped("LOG_DIR", "logs")
LOG_FILE     = _getenv_stripped("LOG_FILE", "send_mail.log")

# -------------------------------------------------------------
# Time parser
# -------------------------------------------------------------
def parse_times_strict(s: str | None) -> list[tuple[int, int]]:
    if not s:
        raise SystemExit("❌ กรุณาตั้งค่า SCHEDULE_TIMES ในไฟล์ .env เช่น SCHEDULE_TIMES=08:05,12:30")

    tokens = re.findall(r"\b(\d{1,2}):(\d{2})\b", s)
    times = set()

    for hh, mm in tokens:
        h, m = int(hh), int(mm)
        if 0 <= h <= 23 and 0 <= m <= 59:
            times.add((h, m))

    return sorted(times)

# -------------------------------------------------------------
# Timezone
# -------------------------------------------------------------
def get_tz():
    tz_name = _getenv_stripped("TZ_NAME", "Asia/Bangkok")
    try:
        from zoneinfo import ZoneInfo
        return ZoneInfo(tz_name)
    except Exception:
        offset_min = int(_getenv_stripped("TZ_OFFSET_MINUTES", "420"))
        return timezone(timedelta(minutes=offset_min))

# -------------------------------------------------------------
# Logging
# -------------------------------------------------------------
def init_logging():
    Path(LOG_DIR).mkdir(parents=True, exist_ok=True)
    handler = RotatingFileHandler(Path(LOG_DIR) / LOG_FILE,
                                  maxBytes=2_000_000,
                                  backupCount=5,
                                  encoding="utf-8")
    console  = logging.StreamHandler()
    fmt = logging.Formatter("%(asctime)s | %(levelname)-8s | %(message)s")
    handler.setFormatter(fmt)
    console.setFormatter(fmt)

    root = logging.getLogger()
    root.setLevel(logging.INFO)
    root.handlers.clear()
    root.addHandler(handler)
    root.addHandler(console)

    logging.info("=== Logger initialized ===")

# -------------------------------------------------------------
# Gmail sender
# -------------------------------------------------------------
def send_email_gmail(sender: str, app_password: str, to_addrs: list[str], subject: str, html_body: str):
    app_password = (app_password or "").strip()
    if len(app_password) != 16 or " " in app_password:
        raise RuntimeError("GMAIL_APP_PASSWORD ไม่ถูกต้อง (ต้องยาว 16 ตัวและไม่มีช่องว่าง)")

    msg = MIMEMultipart("alternative")
    msg["From"] = sender
    msg["To"]   = ", ".join(to_addrs)
    msg["Subject"] = subject
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    ctx = ssl.create_default_context()

    with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=ctx) as smtp:
        smtp.login(sender, app_password)
        smtp.send_message(msg)

    logging.info("📧 ส่ง Gmail ถึง %s สำเร็จ (เรื่อง: %s)", msg["To"], subject)

# -------------------------------------------------------------
# Helpers
# -------------------------------------------------------------
def escape_html(s: str) -> str:
    return (s or "").replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")

# Highlight alert phrases
def highlight_keywords(html: str) -> str:
    html = html.replace(
        "Please check Condition!",
        "<span style='color:red;font-weight:bold'>Please check Condition!</span>"
    )
    html = html.replace(
        "Please check Loader!",
        "<span style='color:red;font-weight:bold'>Please check Loader!</span>"
    )
    return html

# Pick Date_Planing_Check based on machine type
def get_plan_date(r):
    return (
        getattr(r, "plan_date_cs", None)
        or getattr(r, "plan_date_tn", None)
        or getattr(r, "plan_date_ch", None)
    )

def calc_overdue(plan_date, today):
    if not plan_date:
        return None
    if isinstance(plan_date, datetime):
        plan_date = plan_date.date()
    return (today - plan_date).days

# -------------------------------------------------------------
# Build Email Body
# -------------------------------------------------------------
def build_body_from_messages(title: str, rows):
    TZ = get_tz()
    today = datetime.now(TZ).date()

    parts = [f"<h3>{title}</h3>", "<ol>"]

    for r in rows:
        raw_msg = escape_html(r.message or "")
        highlighted = highlight_keywords(raw_msg)

        plan_date_raw = get_plan_date(r)
        plan_date = plan_date_raw.date() if hasattr(plan_date_raw, "date") else plan_date_raw
        overdue = calc_overdue(plan_date_raw, today)

        overdue_text = (f"<b style='color:red'>Over {overdue} Day</b>"
                        if overdue is not None else "<b style='color:red'>Over ? วัน</b>")

        parts.append(
            "<li>"
            f"<div><b>{r.machine_number}</b> | Status: {r.Status_mc} | {overdue_text}</div>"
            f"<div>Date of inspection: {plan_date}</div>"
            f"<pre style='white-space:pre-wrap;font-family:inherit;margin-top:6px'>{highlighted}</pre>"
            "</li>"
        )

    parts.append("</ol>")
    return "".join(parts)

# -------------------------------------------------------------
# Main query + send email
# -------------------------------------------------------------
def send_report_once(dry_run: bool = False):

    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        raise RuntimeError("ต้องกำหนด GMAIL_USER และ GMAIL_APP_PASSWORD ใน .env")

    engine = create_engine(PG_URL, pool_pre_ping=True, future=True)
    TZ = get_tz()
    today = datetime.now(TZ).date()
    tomorrow = today + timedelta(days=1)

    # ---------------------------------------------------------
    # Query รวม Date_Planing_Check จาก 3 ตาราง
    # ---------------------------------------------------------
    query = text("""
        SELECT DISTINCT ON (e.machine_number)
            e.id,
            e.machine_number,
            e.alert_date,
            e.alert_type,
            e.status,
            e.message,
            e."Status_mc",
            cs."Date_Planing_Check" AS plan_date_cs,
            tn."Date_Planing_Check" AS plan_date_tn,
            ch."Date_Planing_Check" AS plan_date_ch
        FROM email_alert_logs e

        -- CS/SB: เลือกแถวล่าสุดของแต่ละเครื่อง
        LEFT JOIN LATERAL (
            SELECT *
            FROM condition_cs_sbs
            WHERE "Machine_Number" = e.machine_number
            ORDER BY id DESC
            LIMIT 1
        ) cs ON e.machine_number ~ '^(CS|SB)-'

        -- TN: เลือกแถวล่าสุดของแต่ละเครื่อง
        LEFT JOIN LATERAL (
            SELECT *
            FROM condition_tns
            WHERE "Machine_Number" = e.machine_number
            ORDER BY id DESC
            LIMIT 1
        ) tn ON e.machine_number ~ '^TN-'

        -- CH: เลือกแถวล่าสุดของแต่ละเครื่อง
        LEFT JOIN LATERAL (
            SELECT *
            FROM condition_ches
            WHERE "Machine_Number" = e.machine_number
            ORDER BY id DESC
            LIMIT 1
        ) ch ON e.machine_number ~ '^CH-'

        WHERE e.alert_date >= :today AND e.alert_date < :tomorrow
        AND e."Status_mc" = 'Running'
        AND (
            (e.machine_number ~ '^(CS|SB)-' AND cs."Date_Planing_Check" < :today)
        OR (e.machine_number ~ '^TN-'     AND tn."Date_Planing_Check" < :today)
        OR (e.machine_number ~ '^CH-'     AND ch."Date_Planing_Check" < :today)
        )

        ORDER BY e.machine_number, e.alert_date DESC;
    """)

    try:
        with engine.begin() as conn:
            rows = conn.execute(query, {"today": today, "tomorrow": tomorrow}).fetchall()

            logging.info("ℹ️ พบรายการวันนี้ที่เข้าเงื่อนไข: %d", len(rows))
            if not rows:
                logging.info("❎ ไม่มีรายการต้องส่งวันนี้")
                return True, 0

            # แบ่งกลุ่ม Machine
            tn_rows    = [r for r in rows if str(r.machine_number).startswith("TN-")]
            other_rows = [r for r in rows if not str(r.machine_number).startswith("TN-")]

            total = 0

            # -------------------------------------------------
            # TN Machines
            # -------------------------------------------------
            if tn_rows:
                recipients = [
                    "kriangsak.k@minebea.co.th",
                    "sirilux.t@minebea.co.th",
                    "tanathorn.p@minebea.co.th",
                    #"thanee.n@minebea.co.th",
                    "ymorita@minebea.co.th",
                    "nkoji@minebea.co.th",
                    "tarai.td@minebeamitsumi.com",
                    "makoto.uchibori@minebea.com"
                ]
                subject = f"⚙️ TN Machines Alert ({today})"
                body    = build_body_from_messages("TN Machines Alert", tn_rows)

                if not dry_run:
                    send_email_gmail(GMAIL_USER, GMAIL_APP_PASSWORD, recipients, subject, body)

                total += len(tn_rows)

            # -------------------------------------------------
            # CS / SB / CH Machines
            # -------------------------------------------------
            if other_rows:
                recipients = [
                    "korphong.h@minebea.co.th",
                    "wilailak.s@minebea.co.th",
                    "ymorita@minebea.co.th",
                    "tanathorn.p@minebea.co.th",
                    #"thanee.n@minebea.co.th",
                    "nkoji@minebea.co.th",
                    "tarai.td@minebeamitsumi.com",
                    "makoto.uchibori@minebea.com"
                ]
                subject = f"⚙️ CS/SB/CH Machines Alert ({today})"
                body    = build_body_from_messages("CS/SB/CH Machines Alert", other_rows)

                if not dry_run:
                    send_email_gmail(GMAIL_USER, GMAIL_APP_PASSWORD, recipients, subject, body)

                total += len(other_rows)

            logging.info("🎯 รวมส่ง: %d รายการ", total)
            return True, total

    except Exception as e:
        logging.exception("❌ Error in send_report_once()")
        raise SystemExit(f"เกิดข้อผิดพลาด: {e}")

# -------------------------------------------------------------
# Scheduler
# -------------------------------------------------------------
def run_daily_scheduler(dry_run: bool = False):
    TZ = get_tz()
    times = parse_times_strict(_getenv_stripped("SCHEDULE_TIMES", None))

    logging.info("🕒 เริ่ม Scheduler (เวลาส่ง: %s)", ", ".join([f"{h:02d}:{m:02d}" for h,m in times]))

    sent_keys = set()

    while True:
        now = datetime.now(TZ)
        key = now.strftime("%Y-%m-%d %H:%M")

        sent_keys = {k for k in sent_keys if k.startswith(now.strftime("%Y-%m-%d "))}

        if (now.hour, now.minute) in times and key not in sent_keys:
            logging.info("🔔 Trigger ส่งอีเมลเวลา %s", key)

            try:
                ok, total = send_report_once(dry_run)
                if ok:
                    logging.info("✔️ เสร็จสิ้น total=%d", total)
            except Exception as e:
                logging.error("❌ Scheduler Error: %s", e)

            sent_keys.add(key)

        next_min = (now.replace(second=0, microsecond=0) + timedelta(minutes=1))
        time.sleep(max(1, int((next_min - datetime.now(TZ)).total_seconds())))

# -------------------------------------------------------------
# Entry point
# -------------------------------------------------------------
if __name__ == "__main__":
    init_logging()

    parser = argparse.ArgumentParser(description="Send machine alert emails from email_alert_logs (auto)")
    parser.add_argument("--once", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if args.once:
        send_report_once(dry_run=args.dry_run)
    else:
        run_daily_scheduler(dry_run=args.dry_run)
