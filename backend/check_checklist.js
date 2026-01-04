const prisma = require('./prismaClient');

async function checkCleaningChecklist() {
    // Find Check Sheet Cleaning preventive type
    const pmType = await prisma.preventiveType.findFirst({
        where: { name: 'Check Sheet Cleaning' },
        include: {
            masterChecklists: {
                where: { isActive: true },
                orderBy: { order: 'asc' }
            }
        }
    });

    if (!pmType) {
        console.log('PM Type not found');
        return;
    }

    console.log('PM Type:', pmType.id, pmType.name);
    console.log('\n=== Master Checklists ===');

    pmType.masterChecklists.forEach((c, idx) => {
        console.log(`\n[${idx}] ID: ${c.id} | Topic: ${c.topic} | Type: ${c.type}`);

        if (c.options) {
            try {
                const opts = JSON.parse(c.options);
                if (opts.subItems && opts.subItems.length > 0) {
                    console.log(`    *** HAS SUB-ITEMS: ${JSON.stringify(opts.subItems)}`);
                }
            } catch (e) {
                console.log(`    Options (not JSON): ${c.options.substring(0, 50)}`);
            }
        }
    });

    await prisma.$disconnect();
}

checkCleaningChecklist().catch(e => {
    console.error(e);
    prisma.$disconnect();
});
