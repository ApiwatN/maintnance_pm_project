const nodemailer = require('nodemailer');

async function sendTestEmail() {
    console.log('Attempting to connect to SMTP server...');

    // Create a transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
        host: '10.127.20.44', // IP ที่คุณให้มา
        port: 25,
        secure: false, // true for 465, false for other ports
        auth: {
            user: 'apiwat.n@minebea.co.th',
            pass: 'apiwatnonut'
        },
        tls: {
            // do not fail on invalid certs
            rejectUnauthorized: false
        },
        // debug: true, // show debug output
        // logger: true // log information in console
    });

    try {
        // Verify connection configuration
        await transporter.verify();
        console.log('✅ Connection successful! Server is ready to take our messages');

        // Send mail with defined transport object
        const info = await transporter.sendMail({
            from: '"Test System" <apiwat.n@minebea.co.th>', // sender address
            to: "apiwat.n@minebea.co.th", // list of receivers (ส่งหาตัวเองเพื่อทดสอบ)
            subject: "Test Email from Node.js", // Subject line
            text: "Hello world? This is a test email from your Maintenance PM System.", // plain text body
            html: "<b>Hello world?</b><br>This is a test email from your <b>Maintenance PM System</b>." // html body
        });

        console.log("✅ Message sent: %s", info.messageId);
        console.log("Check your inbox (apiwat.n@minebea.co.th) to confirm receipt.");

    } catch (error) {
        console.error("❌ Error occurred:");
        console.error(error);
    }
}

sendTestEmail();
