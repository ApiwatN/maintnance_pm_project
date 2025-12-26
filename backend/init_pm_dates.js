const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function initializePMDates() {
    try {
        // Get all machines with PM config but no nextPMDate
        const machines = await prisma.machine.findMany({
            include: {
                pmPlans: true
            }
        });

        console.log(`Found ${machines.length} machines`);

        for (const machine of machines) {
            if (machine.pmPlans) {
                for (const plan of machine.pmPlans) {
                    // If no nextPMDate, set it to today + frequency
                    if (!plan.nextPMDate) {
                        const nextDate = new Date();
                        nextDate.setDate(nextDate.getDate() + plan.frequencyDays);

                        await prisma.machinePMPlan.update({
                            where: { id: plan.id },
                            data: {
                                lastPMDate: new Date(), // Set last PM as today
                                nextPMDate: nextDate
                            }
                        });

                        console.log(`✓ Initialized PM dates for machine: ${machine.name} (Plan ID: ${plan.id})`);
                        console.log(`  Last PM: ${new Date().toISOString().split('T')[0]}`);
                        console.log(`  Next PM: ${nextDate.toISOString().split('T')[0]}`);
                    }
                }
            }
        }

        console.log('\nDone! PM dates have been initialized.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

initializePMDates();
