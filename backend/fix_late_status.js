const prisma = require('./prismaClient');

async function fixLateStatus() {
    console.log('Starting status fix...');
    try {
        const result = await prisma.pMRecord.updateMany({
            where: {
                status: 'LATE'
            },
            data: {
                status: 'COMPLETED'
            }
        });

        console.log(`Updated ${result.count} records from LATE to COMPLETED.`);
    } catch (error) {
        console.error('Error updating records:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixLateStatus();
