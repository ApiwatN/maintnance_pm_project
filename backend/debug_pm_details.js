const prisma = require('./prismaClient');

async function debugPMDetails() {
    try {
        // Get recent PM record with all details
        const record = await prisma.pMRecord.findFirst({
            where: { machineId: 172 },
            orderBy: { date: 'desc' },
            include: {
                machine: { select: { name: true, code: true } },
                preventiveType: {
                    select: {
                        name: true,
                        masterChecklists: {
                            select: { id: true, topic: true, type: true, options: true, order: true }
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
            console.log('No PM record found for machine 172');
            return;
        }

        console.log('=== Latest PM Record ===');
        console.log(`ID: ${record.id}`);
        console.log(`Machine: ${record.machine?.name} (${record.machine?.code})`);
        console.log(`PM Type: ${record.preventiveType?.name}`);
        console.log(`Date: ${record.date}`);
        console.log(`Total Details: ${record.details.length}`);
        console.log('');

        console.log('=== MasterChecklists (From PM Type) ===');
        const masterChecklists = record.preventiveType?.masterChecklists || [];
        masterChecklists.forEach((mc, idx) => {
            console.log(`${idx + 1}. ID: ${mc.id} | Topic: "${mc.topic}" | Type: ${mc.type}`);
        });
        console.log('');

        console.log('=== Saved Details ===');
        record.details.forEach((d, idx) => {
            console.log(`${idx + 1}. checklistId: ${d.checklistId}`);
            console.log(`   topic (from detail): "${d.topic}"`);
            console.log(`   masterChecklist.topic: "${d.masterChecklist?.topic}"`);
            console.log(`   subItemName: ${d.subItemName || 'null'}`);
            console.log(`   isPass: ${d.isPass}`);
            console.log(`   value: "${d.value || ''}"`);
            console.log('');
        });

        // Check what topics are expected vs what's in details
        console.log('=== Topic Matching Analysis ===');
        masterChecklists.forEach(mc => {
            // Check if this checklist has subItems
            let hasSubItems = false;
            if (mc.options) {
                try {
                    const opts = JSON.parse(mc.options);
                    hasSubItems = opts.subItems && Array.isArray(opts.subItems) && opts.subItems.length > 0;
                } catch { }
            }

            if (!hasSubItems) {
                // Look for this topic in details
                const foundDetail = record.details.find(d => {
                    const resolvedTopic = d.masterChecklist?.topic || d.topic;
                    return resolvedTopic === mc.topic && !d.subItemName;
                });

                console.log(`Topic: "${mc.topic}" (Type: ${mc.type})`);
                console.log(`  Found in details: ${foundDetail ? 'YES' : 'NO'}`);
                if (foundDetail) {
                    console.log(`  isPass: ${foundDetail.isPass}, value: "${foundDetail.value || ''}"`);
                }
                console.log('');
            }
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugPMDetails();
