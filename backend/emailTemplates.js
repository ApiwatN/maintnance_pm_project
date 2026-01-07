/**
 * emailTemplates.js - HTML Email Templates for PM Notifications
 * Uses Gmail SMTP SSL Port 465 (same logic as Test_mail_2)
 */

/**
 * Build HTML email for PM notification
 * @param {Object} pmType - PM Type object with name, notifyAdvanceDays
 * @param {Array} machines - Array of { code, name, date, daysLeft }
 * @param {string} baseUrl - Base URL for links (default: http://localhost:3000)
 * @returns {string} HTML string
 */
function buildPMEmailHtml(pmType, machines, baseUrl = 'http://localhost:3000') {
    const now = new Date();
    const sentDate = now.toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Build machine rows
    const machineRows = machines.map((m, idx) => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center;">${idx + 1}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; font-weight: bold; color: #2196F3;">${m.code}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e0e0e0;">${m.name}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e0e0e0; text-align: center; color: #e53935; font-weight: bold;">${m.date}</td>
        </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
        
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
                    <td style="padding: 5px 0; color: #1976D2; font-weight: bold;">${pmType.name}</td>
                </tr>
                <tr>
                    <td style="padding: 5px 0;"><strong>Advance Notice:</strong></td>
                    <td style="padding: 5px 0;">${pmType.notifyAdvanceDays} days</td>
                </tr>
                <tr>
                    <td style="padding: 5px 0;"><strong>Sent:</strong></td>
                    <td style="padding: 5px 0;">${sentDate}</td>
                </tr>
            </table>
        </div>
        
        <!-- Machine List -->
        <div style="padding: 25px;">
            <h2 style="color: #333; margin-top: 0; font-size: 18px;">
                📋 Machines Due for PM (${machines.length})
            </h2>
            <table style="width: 100%; border-collapse: collapse; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                <thead>
                    <tr style="background-color: #1976D2; color: #fff;">
                        <th style="padding: 14px; text-align: center;">No.</th>
                        <th style="padding: 14px; text-align: left;">Code</th>
                        <th style="padding: 14px; text-align: left;">Machine Name</th>
                        <th style="padding: 14px; text-align: center;">PM Due Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${machineRows}
                </tbody>
            </table>
        </div>
        
        <!-- Action Button -->
        <div style="padding: 0 25px 25px; text-align: center;">
            <a href="${baseUrl}/machines/overall" 
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
    `.trim();
}

module.exports = { buildPMEmailHtml };
