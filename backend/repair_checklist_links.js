console.log('Script started...');
const prisma = require('./prismaClient');

async function repairChecklistLinks() {
    try {
        console.log('Starting repair of checklist links...');

        // 1. Get all PM Records that have a machine with a preventive type
        const records = await prisma.pMRecord.findMany({
            include: {
                preventiveType: {
                    include: { masterChecklists: true }
                },
                machine: {
                    include: {
                        pmPlans: {
                            include: {
                                preventiveType: {
                                    include: {
                                        masterChecklists: true
                                    }
                                }
                            }
                        }
                    }
                },
                details: true
            }
        });

        console.log(`Found ${records.length} records to check.`);

        let updatedCount = 0;

        for (const record of records) {
            // 1. Try to get type from record directly
            let preventiveType = record.preventiveType;

            // 2. If not on record, try to infer from machine plans (fragile if multiple plans, but fallback)
            // But we can only fix if we know the type.
            if (!preventiveType) {
                // Try to find a plan that matches? No, logic was relying on machine.preventiveType which implies stored prop.
                // Correct logic: Machine has pmPlans.
                // If record has no preventiveTypeId, we can't reliably know which checklist to use unless machine has ONLY one plan.
                if (record.machine.pmPlans && record.machine.pmPlans.length === 1) {
                    preventiveType = record.machine.pmPlans[0].preventiveType;
                }
            }

            if (!preventiveType) continue;

            const masterChecklists = preventiveType.masterChecklists;
            if (!masterChecklists || masterChecklists.length === 0) continue;

            // Create a map of Topic -> MasterChecklist ID
            const topicMap = new Map();
            masterChecklists.forEach(mc => {
                topicMap.set(mc.topic, mc.id);
            });

            for (const detail of record.details) {
                // If checklistId is null or we want to force update
                // We match by topic name
                if (detail.topic && topicMap.has(detail.topic)) {
                    const masterId = topicMap.get(detail.topic);

                    if (detail.checklistId !== masterId) {
                        await prisma.pMRecordDetail.update({
                            where: { id: detail.id },
                            data: { checklistId: masterId }
                        });
                        updatedCount++;
                        process.stdout.write('.');
                    }
                }
            }
        }

        console.log(`\nRepair completed. Updated ${updatedCount} details.`);

    } catch (error) {
        console.error('Error repairing links:', error);
    } finally {
        await prisma.$disconnect();
    }
}

repairChecklistLinks();
