const prisma = require('./prismaClient');

async function checkFixtureData() {
    // Find machine GE2-001 (code: 052453)
    const machine = await prisma.machine.findFirst({
        where: { code: '052453' }
    });

    if (!machine) {
        console.log('Machine not found');
        return;
    }

    console.log('Machine:', machine.id, machine.name, machine.code);

    // Get latest PM records for this machine
    const records = await prisma.pMRecord.findMany({
        where: { machineId: machine.id },
        include: {
            details: true,
            preventiveType: true
        },
        orderBy: { date: 'desc' },
        take: 5
    });

    console.log('\n=== Latest PM Records ===');
    for (const record of records) {
        console.log(`\nRecord ID: ${record.id}`);
        console.log(`Date: ${record.date}`);
        console.log(`PM Type: ${record.preventiveType?.name}`);
        console.log(`Details count: ${record.details.length}`);

        // Check for subItemName in details
        const subItemDetails = record.details.filter(d => d.subItemName);
        console.log(`Sub-item details: ${subItemDetails.length}`);

        if (subItemDetails.length > 0) {
            console.log('Sub-items found:');
            subItemDetails.forEach(d => {
                console.log(`  - ${d.topic} | subItemName: ${d.subItemName} | isPass: ${d.isPass}`);
            });
        } else {
            console.log('NO sub-item details found in this record');
        }
    }

    await prisma.$disconnect();
}

checkFixtureData().catch(e => {
    console.error(e);
    prisma.$disconnect();
});
