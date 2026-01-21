@echo off
echo ============================================
echo  แปลงเอกสาร Markdown เป็น Word และ PDF
echo ============================================
echo.

REM ตรวจสอบว่ามี Pandoc หรือไม่
where pandoc >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] ไม่พบ Pandoc กรุณาติดตั้งก่อน
    echo.
    echo วิธีติดตั้ง Pandoc:
    echo 1. ดาวน์โหลดจาก https://pandoc.org/installing.html
    echo 2. เลือก Windows installer
    echo 3. ติดตั้งและ restart command prompt
    echo.
    pause
    exit /b 1
)

echo [OK] พบ Pandoc

REM ไปยังโฟลเดอร์ docs
cd /d "%~dp0"

echo.
echo กำลังแปลง Markdown เป็น DOCX...
pandoc PM-System-Documentation-Complete.md -o PM-System-Documentation-v1.0.0.docx --from markdown --to docx --reference-doc=reference.docx 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] สร้างไฟล์ PM-System-Documentation-v1.0.0.docx สำเร็จ
) else (
    pandoc PM-System-Documentation-Complete.md -o PM-System-Documentation-v1.0.0.docx --from markdown --to docx
    if %ERRORLEVEL% EQU 0 (
        echo [OK] สร้างไฟล์ PM-System-Documentation-v1.0.0.docx สำเร็จ
    ) else (
        echo [ERROR] ไม่สามารถสร้างไฟล์ DOCX ได้
    )
)

echo.
echo กำลังแปลง Markdown เป็น PDF...
REM ต้องมี LaTeX หรือ wkhtmltopdf
pandoc PM-System-Documentation-Complete.md -o PM-System-Documentation-v1.0.0.pdf --from markdown --pdf-engine=xelatex -V mainfont="TH Sarabun New" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] สร้างไฟล์ PM-System-Documentation-v1.0.0.pdf สำเร็จ
) else (
    echo [WARNING] ไม่สามารถสร้าง PDF ด้วย LaTeX ลองใช้ wkhtmltopdf...
    pandoc PM-System-Documentation-Complete.md -o PM-System-Documentation-v1.0.0.html --from markdown --to html --standalone --metadata title="PM System Documentation"
    if %ERRORLEVEL% EQU 0 (
        echo [OK] สร้างไฟล์ HTML สำเร็จ - กรุณาเปิดด้วย Browser แล้ว Print เป็น PDF
    )
)

echo.
echo ============================================
echo  เสร็จสิ้น
echo ============================================
echo.
echo ไฟล์ที่สร้าง:
dir /b *.docx *.pdf *.html 2>nul
echo.
pause
