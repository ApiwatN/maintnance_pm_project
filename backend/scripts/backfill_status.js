const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// [FIX] Helper function to check if a detail should be considered NG
// Skips "ghost items" - NUMERIC details with no value
const isDetailNG = (detail) => {
    // If isPass is true, it's not NG
    if (detail.isPass) return false;

    // Get type from masterChecklist or detail itself
    const type = (detail.masterChecklist?.type || detail.checklist?.type || '').toUpperCase();

    // For NUMERIC type: skip if value is empty (not filled in = ghost item)
    if (type === 'NUMERIC' && (!detail.value || detail.value.toString().trim() === '')) {
        return false;
    }

    // For other types or NUMERIC with value, check isPass
    return !detail.isPass;
};

async function backfill() {
    console.log('Starting backfill of lastCheckStatus...');

    try {
        // 1. Get all MachinePMPlans
        const plans = await prisma.machinePMPlan.findMany({
            include: {
                machine: true,
                preventiveType: true
            }
        });
        console.log(`Found ${plans.length} plans to check.`);

        let updatedCount = 0;
        let mismatchCount = 0;

        for (const plan of plans) {
            // 2. Find the latest PM Record for this plan
            const lastRecord = await prisma.pMRecord.findFirst({
                where: {
                    machineId: plan.machineId,
                    preventiveTypeId: plan.preventiveTypeId,
                    status: { in: ['COMPLETED', 'LATE'] } // Include LATE as well
                },
                orderBy: { date: 'desc' },
                include: {
                    details: {
                        include: { masterChecklist: true } // [FIX] Include masterChecklist for type checking
                    }
                }
            });

            if (lastRecord) {
                // 3. Determine status - [FIX] Use helper to skip ghost items
                const hasNG = lastRecord.details.some(d => isDetailNG(d));
                const calculatedStatus = hasNG ? 'HAS_NG' : 'ALL_OK';

                // Debug: Show mismatch
                if (plan.lastCheckStatus !== calculatedStatus) {
                    mismatchCount++;
                    console.log(`\n[MISMATCH] Plan ${plan.id} (Machine: ${plan.machine?.name}, Type: ${plan.preventiveType?.name})`);
                    console.log(`  Current: ${plan.lastCheckStatus || 'NULL'} -> Should be: ${calculatedStatus}`);

                    // Show which details are causing difference
                    const failedDetails = lastRecord.details.filter(d => isDetailNG(d));
                    if (failedDetails.length > 0) {
                        console.log(`  NG Details:`);
                        failedDetails.forEach(d => {
                            console.log(`    - [${d.masterChecklist?.type || 'UNKNOWN'}] ${d.topic || d.masterChecklist?.topic} = "${d.value}" (isPass=${d.isPass})`);
                        });
                    }

                    // 4. Update plan
                    await prisma.machinePMPlan.update({
                        where: { id: plan.id },
                        data: { lastCheckStatus: calculatedStatus }
                    });
                    updatedCount++;
                }
            } else {
                // No record found, set to null
                if (plan.lastCheckStatus !== null) {
                    console.log(`\n[NO RECORD] Plan ${plan.id} (Machine: ${plan.machine?.name}) - resetting to NULL`);
                    await prisma.machinePMPlan.update({
                        where: { id: plan.id },
                        data: { lastCheckStatus: null }
                    });
                    updatedCount++;
                }
            }
        }

        console.log(`\n========================================`);
        console.log(`Backfill complete.`);
        console.log(`  Total plans: ${plans.length}`);
        console.log(`  Mismatches found: ${mismatchCount}`);
        console.log(`  Updated: ${updatedCount} plans.`);
    } catch (error) {
        console.error('Backfill failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

backfill();
