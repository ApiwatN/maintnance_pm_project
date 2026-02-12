const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSubItems() {
    try {
        // Find checklists with 'Test' topic or any with subItems in options
        const checklists = await prisma.masterChecklist.findMany({
            where: {
                options: {
                    contains: 'subItems'
                }
            },
            select: {
                id: true,
                topic: true,
                type: true,
                options: true
            },
            orderBy: {
                id: 'desc'
            },
            take: 10
        });

        console.log('\n=== MasterChecklists with subItems ===\n');
        if (checklists.length === 0) {
            console.log('No checklists found with subItems in options field.');
        } else {
            checklists.forEach(c => {
                console.log(`ID: ${c.id}`);
                console.log(`Topic: ${c.topic}`);
                console.log(`Type: ${c.type}`);
                console.log(`Options: ${c.options}`);
                console.log('---');
            });
        }

        // Also check the 'Test' topic specifically
        const testChecklists = await prisma.masterChecklist.findMany({
            where: {
                topic: 'Test'
            },
            select: {
                id: true,
                topic: true,
                type: true,
                options: true
            }
        });

        console.log('\n=== Checklists with topic "Test" ===\n');
        if (testChecklists.length === 0) {
            console.log('No checklists found with topic "Test".');
        } else {
            testChecklists.forEach(c => {
                console.log(`ID: ${c.id}`);
                console.log(`Topic: ${c.topic}`);
                console.log(`Type: ${c.type}`);
                console.log(`Options: ${c.options}`);
                try {
                    const opts = JSON.parse(c.options || '{}');
                    console.log(`Parsed subItems: ${JSON.stringify(opts.subItems)}`);
                } catch (e) {
                    console.log('Could not parse options');
                }
                console.log('---');
            });
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSubItems();
