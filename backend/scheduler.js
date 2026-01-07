/**
 * scheduler.js - Background Tasks Scheduler
 * 
 * Note: Email notifications have been moved to Python script (PM_Email_Sender)
 * This file is kept for future background tasks if needed
 */

const cron = require('node-cron');
const prisma = require('./prismaClient');

const startScheduler = () => {
    console.log('📅 Scheduler initialized (Email notifications handled by PM_Email_Sender)');

    // Example: Add other scheduled tasks here if needed
    // cron.schedule('0 0 * * *', async () => {
    //     // Daily maintenance tasks
    // });
};

module.exports = startScheduler;
