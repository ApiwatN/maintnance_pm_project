const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function backfill() {
    console.log('Starting backfill of lastCheckStatus...');

    try {
        // 1. Get all MachinePMPlans
        const plans = await prisma.machinePMPlan.findMany();
        console.log(`Found ${plans.length} plans to check.`);

        let updatedCount = 0;

        for (const plan of plans) {
            // 2. Find the latest PM Record for this plan
            const lastRecord = await prisma.pMRecord.findFirst({
                where: {
                    machineId: plan.machineId,
                    preventiveTypeId: plan.preventiveTypeId,
                    status: 'COMPLETED'
                },
                orderBy: { date: 'desc' },
                include: { details: true }
            });

            if (lastRecord) {
                // 3. Determine status
                const hasNG = lastRecord.details.some(d => !d.isPass);
                const status = hasNG ? 'HAS_NG' : 'ALL_OK';

                // 4. Update plan if status is different or missing
                if (plan.lastCheckStatus !== status) {
                    await prisma.machinePMPlan.update({
                        where: { id: plan.id },
                        data: { lastCheckStatus: status }
                    });
                    updatedCount++;
                    // console.log(`Updated Plan ${plan.id}: ${status}`);
                }
            }
        }

        console.log(`Backfill complete. Updated ${updatedCount} plans.`);
    } catch (error) {
        console.error('Backfill failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

backfill();
