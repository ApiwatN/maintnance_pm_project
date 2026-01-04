const prisma = require('./prismaClient');

async function debugMachine216() {
    try {
        // Get all PM Types for reference
        const pmTypes = await prisma.preventiveType.findMany({
            where: { name: { contains: 'Weekly Cleaning Laser' } },
            select: { id: true, name: true }
        });
        console.log('=== PM Types matching "Weekly Cleaning Laser" ===');
        console.log(pmTypes);
        console.log('');

        // Get recent PM record for machine 216
        const record = await prisma.pMRecord.findFirst({
            where: { machineId: 216 },
            orderBy: { date: 'desc' },
            include: {
                machine: { select: { name: true, code: true } },
                preventiveType: {
                    select: {
                        id: true,
                        name: true,
                        masterChecklists: {
                            select: { id: true, topic: true, type: true, options: true, order: true },
                            orderBy: { order: 'asc' }
                        }
                    }
                },
                details: {
                    include: {
                        masterChecklist: { select: { id: true, topic: true, type: true } }
                    }
                }
            }
        });

        if (!record) {
            console.log('No PM record found for machine 216');
            return;
        }

        console.log('=== Latest PM Record for Machine 216 ===');
        console.log(`Record ID: ${record.id}`);
        console.log(`Machine: ${record.machine?.name} (${record.machine?.code})`);
        console.log(`PM Type ID: ${record.preventiveTypeId} - ${record.preventiveType?.name}`);
        console.log(`Date: ${record.date}`);
        console.log(`Total Details: ${record.details.length}`);
        console.log('');

        console.log('=== MasterChecklists from PM Type ===');
        const mcList = record.preventiveType?.masterChecklists || [];
        console.log(`Total MasterChecklists: ${mcList.length}`);
        mcList.forEach((mc, idx) => {
            let subItems = [];
            if (mc.options) {
                try {
                    const opts = JSON.parse(mc.options);
                    if (opts.subItems) subItems = opts.subItems;
                } catch { }
            }
            console.log(`${idx + 1}. [${mc.id}] "${mc.topic}" (Type: ${mc.type}) ${subItems.length ? `- SubItems: ${subItems.join(', ')}` : ''}`);
        });
        console.log('');

        // Check which masterChecklists have matching details
        console.log('=== Matching Analysis ===');
        mcList.forEach(mc => {
            let subItems = [];
            if (mc.options) {
                try {
                    const opts = JSON.parse(mc.options);
                    if (opts.subItems) subItems = opts.subItems;
                } catch { }
            }

            if (subItems.length === 0) {
                // No subItems - should have direct match
                const found = record.details.find(d => {
                    const resolvedTopic = d.masterChecklist?.topic || d.topic;
                    return resolvedTopic === mc.topic && !d.subItemName;
                });
                console.log(`Topic: "${mc.topic}"`);
                console.log(`  HasSubItems: NO`);
                console.log(`  Found in details: ${found ? 'YES' : 'NO'}`);
                if (found) {
                    console.log(`  isPass: ${found.isPass}, value: "${found.value || ''}"`);
                }
            } else {
                // Has subItems - check each
                console.log(`Topic: "${mc.topic}"`);
                console.log(`  HasSubItems: YES (${subItems.join(', ')})`);
                subItems.forEach(si => {
                    const found = record.details.find(d => {
                        return d.checklistId === mc.id && d.subItemName === si;
                    });
                    console.log(`  - SubItem "${si}": ${found ? `FOUND (isPass: ${found.isPass})` : 'NOT FOUND'}`);
                });
            }
            console.log('');
        });

        // List all details that have no matching masterChecklist
        console.log('=== Orphan Details (no matching MasterChecklist in PM Type) ===');
        record.details.forEach(d => {
            const mcId = d.checklistId;
            const matchingMC = mcList.find(mc => mc.id === mcId);
            if (!matchingMC) {
                console.log(`Detail: checklistId=${mcId}, topic="${d.topic}", subItemName="${d.subItemName}"`);
            }
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugMachine216();
