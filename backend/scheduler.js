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
    // Run every day at midnight (00:00)
    cron.schedule('0 0 * * *', async () => {
        console.log('Running daily PM check...');
        try {
            const today = new Date();
            // Fetch machines with their PM plans
            const machines = await prisma.machine.findMany({
                include: { pmPlans: true }
            });

            const dueItems = [];

            machines.forEach(machine => {
                if (machine.pmPlans && machine.pmPlans.length > 0) {
                    machine.pmPlans.forEach(plan => {
                        if (plan.nextPMDate) {
                            const nextDate = new Date(plan.nextPMDate);
                            const diffTime = nextDate - today;
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                            // Notify if overdue or within advance notice period
                            if (diffDays <= plan.advanceNotifyDays) {
                                dueItems.push({
                                    machineName: machine.name,
                                    pmDate: plan.nextPMDate.toDateString(),
                                    isOverdue: diffDays < 0
                                });
                            }
                        }
                    });
                }
            });

            if (dueItems.length > 0) {
                const machineList = dueItems.map(item => `- ${item.machineName} (Due: ${item.pmDate}) ${item.isOverdue ? '[OVERDUE]' : ''}`).join('\n');

                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: process.env.EMAIL_TO || 'admin@example.com',
                    subject: 'Daily Machine PM Alert',
                    text: `The following machines are due for PM:\n\n${machineList}`
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log('Error sending email:', error);
                    } else {
                        console.log('Email sent:', info.response);
                    }
                });
            }
        } catch (error) {
            console.error('Error in scheduler:', error);
        }
    });
};

module.exports = startScheduler;
