const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugNumericSubItems() {
    try {
        // Find NUMERIC checklists with sub-items 
        const checklists = await prisma.masterChecklist.findMany({
            where: {
                type: 'NUMERIC',
                options: {
                    contains: 'subItems'
                }
            },
            include: {
                preventiveType: true
            }
        });

        console.log(`\n=== NUMERIC Checklists with Sub-Items: ${checklists.length} ===\n`);

        checklists.forEach(c => {
            console.log(`ID: ${c.id} | PM Type: ${c.preventiveType?.name || 'N/A'}`);
            console.log(`  Topic: ${c.topic}`);
            console.log(`  Type: ${c.type}`);
            console.log(`  minVal: ${c.minVal} (type: ${typeof c.minVal})`);
            console.log(`  maxVal: ${c.maxVal} (type: ${typeof c.maxVal})`);

            try {
                const opts = JSON.parse(c.options);
                console.log(`  subItems: ${JSON.stringify(opts.subItems)}`);
            } catch {
                console.log(`  options: ${c.options}`);
            }
            console.log('');
        });

        // Also search for "Flow Counterplate" and "Flow Gas Argon"
        console.log(`\n=== Searching for Flow Counterplate / Flow Gas Argon ===\n`);

        const flowChecklists = await prisma.masterChecklist.findMany({
            where: {
                OR: [
                    { topic: { contains: 'Flow Counterplate' } },
                    { topic: { contains: 'Flow Gas Argon' } }
                ]
            },
            include: {
                preventiveType: true
            }
        });

        flowChecklists.forEach(c => {
            console.log(`ID: ${c.id} | PM Type: ${c.preventiveType?.name || 'N/A'}`);
            console.log(`  Topic: ${c.topic}`);
            console.log(`  Type: ${c.type}`);
            console.log(`  minVal: ${c.minVal}`);
            console.log(`  maxVal: ${c.maxVal}`);
            console.log(`  options: ${c.options}`);
            console.log('');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugNumericSubItems();
