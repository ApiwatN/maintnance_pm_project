/**
 * server.js - Test Email Server (SMTP Relay via Firewall)
 * 
 * ส่งอีเมลผ่าน Internal SMTP Relay (Firewall)
 * SMTP Server: 192.168.98.1:25
 * 
 * ต้องการ:
 *   - SMTP_HOST: SMTP server address (default: 192.168.98.1)
 *   - SMTP_PORT: SMTP port (default: 25)
 *   - MAIL_FROM: Email address to send from
 */

const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Load env from current directory
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(bodyParser.json());

// =============================================
// SMTP Config (ค่าจาก .env หรือ default)
// =============================================
const SMTP_HOST = (process.env.SMTP_HOST || '192.168.98.1').trim();
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '25', 10);
const MAIL_FROM = (process.env.MAIL_FROM || process.env.GMAIL_USER || '').trim();

// =============================================
// Send Email API
// =============================================
app.post('/send-email', async (req, res) => {
    const { to, subject, message } = req.body;

    if (!to || !subject || !message) {
        return res.status(400).json({ success: false, error: 'Missing required fields: to, subject, message' });
    }

    // Validate MAIL_FROM
    if (!MAIL_FROM) {
        return res.status(500).json({
            success: false,
            error: 'ไม่ได้ตั้งค่า MAIL_FROM ใน .env'
        });
    }

    console.log(`Attempting to send email to: ${to} via ${SMTP_HOST}:${SMTP_PORT}`);

    // =============================================
    // SMTP Relay via Firewall (192.168.98.1:25)
    // ไม่ต้องใช้ authentication, ไม่ใช้ TLS/SSL
    // =============================================
    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: false,  // false for port 25 (no SSL)
        tls: {
            rejectUnauthorized: false  // ยอมรับ self-signed certificates
        }
    });

    const mailOptions = {
        from: MAIL_FROM,
        to: to,
        subject: subject,
        text: message,
        html: `<p>${message.replace(/\n/g, '<br>')}</p>`
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`📧 ส่ง Email ถึง ${to} สำเร็จ (เรื่อง: ${subject})`);
        console.log('Message ID:', info.messageId);
        res.json({ success: true, info: info.response });
    } catch (error) {
        console.error('❌ Error sending email:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Serve test page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'test_email.html'));
});

app.listen(PORT, () => {
    console.log('====================================');
    console.log(`🚀 Test Email Server running on http://localhost:${PORT}`);
    console.log('====================================');
    console.log(`📮 SMTP Server: ${SMTP_HOST}:${SMTP_PORT}`);
    console.log(`📧 Mail From:   ${MAIL_FROM || 'NOT SET'}`);
    console.log('====================================');

    if (!MAIL_FROM) {
        console.warn('⚠️  กรุณาตั้งค่า MAIL_FROM ใน .env');
    }
});
