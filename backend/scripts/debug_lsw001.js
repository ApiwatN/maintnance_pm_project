const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// [FIX] Helper function to check if a detail should be considered NG
const isDetailNG = (detail) => {
    if (detail.isPass) return false;
    const type = (detail.masterChecklist?.type || detail.checklist?.type || '').toUpperCase();
    if (type === 'NUMERIC' && (!detail.value || detail.value.toString().trim() === '')) {
        return false;
    }
    return !detail.isPass;
};

async function debugLSW001() {
    try {
        // Find LSW-001 machine
        const machine = await prisma.machine.findFirst({
            where: { name: { contains: 'LSW-001' } },
            include: {
                pmPlans: {
                    include: { preventiveType: true }
                }
            }
        });

        if (!machine) {
            console.log('Machine LSW-001 not found');
            return;
        }

        console.log(`\n=== Machine: ${machine.name} (ID: ${machine.id}) ===\n`);

        // Check PM Plan lastCheckStatus
        console.log('PM Plans:');
        for (const plan of machine.pmPlans) {
            console.log(`  Plan ${plan.id}: ${plan.preventiveType?.name}`);
            console.log(`    lastCheckStatus (DB): ${plan.lastCheckStatus || 'NULL'}`);
        }

        // Get latest PM Record for this machine
        const latestRecord = await prisma.pMRecord.findFirst({
            where: {
                machineId: machine.id,
                status: { in: ['COMPLETED', 'LATE'] }
            },
            orderBy: { date: 'desc' },
            include: {
                details: {
                    include: { masterChecklist: true }
                },
                preventiveType: true
            }
        });

        if (!latestRecord) {
            console.log('\nNo COMPLETED/LATE records found for this machine');
            return;
        }

        console.log(`\n=== Latest PM Record ===`);
        console.log(`  Record ID: ${latestRecord.id}`);
        console.log(`  Date: ${latestRecord.date}`);
        console.log(`  Status: ${latestRecord.status}`);
        console.log(`  PM Type: ${latestRecord.preventiveType?.name || 'N/A'}`);
        console.log(`  Total Details: ${latestRecord.details.length}`);

        // Check which details have isPass = false
        const failedDetails = latestRecord.details.filter(d => !d.isPass);
        const ngDetails = latestRecord.details.filter(d => isDetailNG(d));

        console.log(`\n  Details with isPass=false: ${failedDetails.length}`);
        if (failedDetails.length > 0) {
            failedDetails.forEach(d => {
                console.log(`    - [${d.masterChecklist?.type || 'UNKNOWN'}] ${d.topic || d.masterChecklist?.topic}`);
                console.log(`      value="${d.value}" | isPass=${d.isPass} | subItemName="${d.subItemName || 'N/A'}"`);
            });
        }

        console.log(`\n  Details that are actually NG (after filter): ${ngDetails.length}`);
        if (ngDetails.length > 0) {
            ngDetails.forEach(d => {
                console.log(`    - [${d.masterChecklist?.type || 'UNKNOWN'}] ${d.topic || d.masterChecklist?.topic}`);
                console.log(`      value="${d.value}" | isPass=${d.isPass}`);
            });
        }

        // Calculate what status SHOULD be
        const shouldBeHasNG = ngDetails.length > 0;
        console.log(`\n  Should be HAS_NG: ${shouldBeHasNG}`);
        console.log(`  Expected lastCheckStatus: ${shouldBeHasNG ? 'HAS_NG' : 'ALL_OK'}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugLSW001();
