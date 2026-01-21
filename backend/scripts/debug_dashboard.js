const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugDashboard() {
    try {
        // Get all plans with HAS_NG status
        const ngPlans = await prisma.machinePMPlan.findMany({
            where: { lastCheckStatus: 'HAS_NG' },
            include: {
                machine: true,
                preventiveType: true
            }
        });

        console.log(`\n=== Plans with HAS_NG status: ${ngPlans.length} ===`);
        ngPlans.forEach(p => {
            console.log(`  - Plan ${p.id}: ${p.machine?.name} (${p.preventiveType?.name})`);
        });

        // Check a specific machine from screenshot: LSW-001
        console.log(`\n=== Checking LSW-001 ===`);
        const lswMachine = await prisma.machine.findFirst({
            where: { name: { contains: 'LSW-001' } },
            include: {
                pmPlans: {
                    include: { preventiveType: true }
                }
            }
        });

        if (lswMachine) {
            console.log(`Machine: ${lswMachine.name} (ID: ${lswMachine.id})`);
            console.log(`Plans:`);
            lswMachine.pmPlans.forEach(p => {
                console.log(`  - ${p.preventiveType?.name || 'Unknown'}: lastCheckStatus = ${p.lastCheckStatus || 'NULL'}`);
            });
        }

        // Get total counts
        const allOkCount = await prisma.machinePMPlan.count({ where: { lastCheckStatus: 'ALL_OK' } });
        const hasNgCount = await prisma.machinePMPlan.count({ where: { lastCheckStatus: 'HAS_NG' } });
        const nullCount = await prisma.machinePMPlan.count({ where: { lastCheckStatus: null } });

        console.log(`\n=== Status Summary ===`);
        console.log(`  ALL_OK: ${allOkCount}`);
        console.log(`  HAS_NG: ${hasNgCount}`);
        console.log(`  NULL: ${nullCount}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugDashboard();
