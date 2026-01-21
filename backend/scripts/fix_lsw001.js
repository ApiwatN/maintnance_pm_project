const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper function to check if a detail should be considered NG
const isDetailNG = (detail) => {
    if (detail.isPass) return false;
    const type = (detail.masterChecklist?.type || detail.checklist?.type || '').toUpperCase();
    if (type === 'NUMERIC' && (!detail.value || detail.value.toString().trim() === '' || detail.value === 'null')) {
        return false;
    }
    return !detail.isPass;
};

async function fixLSW001() {
    try {
        // Find machine
        const machine = await prisma.machine.findFirst({
            where: { name: { contains: 'LSW-001' } }
        });

        if (!machine) {
            console.log('Machine not found');
            return;
        }

        // Find the PM Plan
        const plan = await prisma.machinePMPlan.findFirst({
            where: { machineId: machine.id }
        });

        if (!plan) {
            console.log('Plan not found');
            return;
        }

        console.log(`Current lastCheckStatus: ${plan.lastCheckStatus}`);

        // Get latest record
        const latestRecord = await prisma.pMRecord.findFirst({
            where: {
                machineId: machine.id,
                preventiveTypeId: plan.preventiveTypeId,
                status: { in: ['COMPLETED', 'LATE'] }
            },
            orderBy: { date: 'desc' },
            include: {
                details: { include: { masterChecklist: true } }
            }
        });

        if (!latestRecord) {
            console.log('No record found');
            return;
        }

        // Check for actual NG
        const hasNG = latestRecord.details.some(d => isDetailNG(d));
        const newStatus = hasNG ? 'HAS_NG' : 'ALL_OK';

        console.log(`Calculated status: ${newStatus}`);

        // Force update
        await prisma.machinePMPlan.update({
            where: { id: plan.id },
            data: { lastCheckStatus: newStatus }
        });

        console.log(`Updated plan ${plan.id} to: ${newStatus}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixLSW001();
