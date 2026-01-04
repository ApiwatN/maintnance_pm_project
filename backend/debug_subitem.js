const prisma = require('./prismaClient');

async function debugSubItems() {
    try {
        console.log('=== Checking PMRecordDetail with subItemName ===\n');

        // 1. Check all PMRecordDetail entries with subItemName
        const subItemDetails = await prisma.pMRecordDetail.findMany({
            where: {
                subItemName: { not: null }
            },
            include: {
                record: {
                    select: {
                        id: true,
                        date: true,
                        machine: { select: { name: true, code: true } }
                    }
                },
                masterChecklist: {
                    select: { topic: true, type: true, options: true }
                }
            },
            take: 20,
            orderBy: { id: 'desc' }
        });

        console.log(`Found ${subItemDetails.length} PMRecordDetail entries with subItemName:\n`);

        subItemDetails.forEach((detail, idx) => {
            console.log(`${idx + 1}. Record ID: ${detail.recordId}`);
            console.log(`   Machine: ${detail.record?.machine?.name || 'N/A'}`);
            console.log(`   Date: ${detail.record?.date?.toISOString() || 'N/A'}`);
            console.log(`   Topic: ${detail.topic || 'N/A'}`);
            console.log(`   SubItemName: ${detail.subItemName}`);
            console.log(`   isPass: ${detail.isPass}`);
            console.log(`   value: ${detail.value || 'N/A'}`);
            console.log('');
        });

        console.log('=== Checking recent PM Records ===\n');

        // 2. Check recent PM Records to see all details
        const recentRecords = await prisma.pMRecord.findMany({
            include: {
                machine: { select: { name: true, code: true } },
                preventiveType: { select: { name: true } },
                details: {
                    include: {
                        masterChecklist: { select: { topic: true, options: true } }
                    }
                }
            },
            take: 5,
            orderBy: { date: 'desc' }
        });

        console.log(`Showing ${recentRecords.length} most recent PM Records:\n`);

        recentRecords.forEach((record, idx) => {
            console.log(`${idx + 1}. PM Record ID: ${record.id}`);
            console.log(`   Machine: ${record.machine?.name || 'N/A'} (${record.machine?.code || 'N/A'})`);
            console.log(`   PM Type: ${record.preventiveType?.name || 'N/A'}`);
            console.log(`   Date: ${record.date?.toISOString() || 'N/A'}`);
            console.log(`   Total Details: ${record.details.length}`);

            // Show details with subItemName
            const subItems = record.details.filter(d => d.subItemName);
            console.log(`   Details with subItemName: ${subItems.length}`);

            subItems.forEach((d, i) => {
                console.log(`     - ${d.topic || d.masterChecklist?.topic || 'N/A'} : ${d.subItemName} = ${d.isPass ? 'OK' : 'NG'} (value: ${d.value || 'N/A'})`);
            });
            console.log('');
        });

        console.log('=== Checking MasterChecklists with subItems ===\n');

        // 3. Check MasterChecklists that have subItems in options
        const checklists = await prisma.masterChecklist.findMany({
            where: {
                options: { not: null }
            },
            include: {
                preventiveType: { select: { name: true } }
            }
        });

        const checklistsWithSubItems = checklists.filter(c => {
            try {
                const opts = JSON.parse(c.options);
                return opts.subItems && Array.isArray(opts.subItems) && opts.subItems.length > 0;
            } catch {
                return false;
            }
        });

        console.log(`Found ${checklistsWithSubItems.length} MasterChecklists with subItems:\n`);

        checklistsWithSubItems.forEach((c, idx) => {
            try {
                const opts = JSON.parse(c.options);
                console.log(`${idx + 1}. ID: ${c.id} | Topic: ${c.topic}`);
                console.log(`   PM Type: ${c.preventiveType?.name || 'N/A'}`);
                console.log(`   Type: ${c.type}`);
                console.log(`   SubItems: ${JSON.stringify(opts.subItems)}`);
                console.log('');
            } catch { }
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

debugSubItems();
