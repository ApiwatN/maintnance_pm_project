const cron = require('node-cron');
const nodemailer = require('nodemailer');
const prisma = require('./prismaClient');

// Configure transporter (User needs to provide actual credentials)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-password'
    }
});

const startScheduler = () => {
    // Run every 15 minutes (at 00, 15, 30, 45)
    cron.schedule('*/15 * * * *', async () => {
        try {
            const now = new Date();
            const currentHours = String(now.getHours()).padStart(2, '0');
            const currentMinutes = String(now.getMinutes()).padStart(2, '0');
            const currentTime = `${currentHours}:${currentMinutes}`;

            console.log(`Checking PM Type notifications at ${currentTime}...`);

            // 1. Find PreventiveTypes that match current time
            const typesToNotify = await prisma.preventiveType.findMany({
                where: {
                    notifyTime: currentTime,
                    emailRecipients: { not: null } // Only if recipients exist
                }
            });

            if (typesToNotify.length === 0) return;

            for (const type of typesToNotify) {
                if (!type.emailRecipients) continue;

                // 2. Find machines with this plan
                const plans = await prisma.machinePMPlan.findMany({
                    where: { preventiveTypeId: type.id },
                    include: { machine: true }
                });

                const dueMachines = [];

                for (const plan of plans) {
                    if (plan.nextPMDate) {
                        const nextDate = new Date(plan.nextPMDate);
                        // Reset time to midnight for accurate day calculation
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        nextDate.setHours(0, 0, 0, 0);

                        const diffTime = nextDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        // Check if exactly N days in advance (or overdue if desired, but request was for advance)
                        // Using <= to catch missed runs, or === for strict. 
                        // Let's use === type.notifyAdvanceDays to avoid spamming every minute if we ran every minute?
                        // Actually, since we check time (HH:mm), it only runs once a day per type.
                        // So we can check if diffDays === type.notifyAdvanceDays

                        if (diffDays === type.notifyAdvanceDays) {
                            dueMachines.push({
                                name: plan.machine.name,
                                code: plan.machine.code,
                                date: plan.nextPMDate.toDateString(),
                                daysLeft: diffDays
                            });
                        }
                    }
                }

                // 3. Send Email if there are machines due
                if (dueMachines.length > 0) {
                    const machineList = dueMachines.map(m => `- [${m.code}] ${m.name} (Due: ${m.date})`).join('\n');

                    const mailOptions = {
                        from: process.env.SMTP_FROM || 'apiwat.n@minebea.co.th',
                        to: type.emailRecipients, // Comma separated string works in nodemailer
                        subject: `PM Alert: ${type.name} - ${dueMachines.length} Machines Due`,
                        text: `The following machines are due for ${type.name} in ${type.notifyAdvanceDays} days:\n\n${machineList}\n\nPlease prepare for maintenance.`
                    };

                    // Create transporter with new settings
                    const transporter = nodemailer.createTransport({
                        host: process.env.SMTP_HOST || 'smtp.minebea.co.th', // Fallback or env
                        port: parseInt(process.env.SMTP_PORT || '25'),
                        secure: false, // true for 465, false for other ports
                        auth: {
                            user: process.env.SMTP_USER || 'apiwat.n@minebea.co.th',
                            pass: process.env.SMTP_PASS || 'ApiwatNonut'
                        },
                        tls: {
                            rejectUnauthorized: false
                        }
                    });

                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            console.error(`Error sending email for type ${type.name}:`, error);
                        } else {
                            console.log(`Email sent for type ${type.name}:`, info.response);
                        }
                    });
                }
            }

        } catch (error) {
            console.error('Error in scheduler:', error);
        }
    });
};

module.exports = startScheduler;
