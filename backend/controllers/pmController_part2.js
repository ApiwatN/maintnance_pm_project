
// [NEW] Get Failure Breakdown (Drill-down)
exports.getFailureBreakdown = async (req, res) => {
    try {
        const { year, level, parentId } = req.query;
        // level: 'AREA' | 'TYPE' | 'MACHINE' | 'TOPIC'

        const where = {};

        // [RBAC] Filter by assigned machines (Common logic)
        let assignedMachineIds = null;
        if (req.user && req.user.systemRole !== 'ADMIN') {
            const user = await prisma.userMaster.findUnique({
                where: { id: req.user.id },
                include: { assignedMachines: { select: { id: true } } }
            });
            assignedMachineIds = user?.assignedMachines.map(m => m.id) || [];
            // We will apply this filter in specific queries below
        }

        // Date Filter
        const dateFilter = year ? {
            date: {
                gte: new Date(`${year}-01-01`),
                lte: new Date(`${year}-12-31T23:59:59`)
            }
        } : {};

        let results = [];

        // ---------------------------------------------------------
        // LEVEL 1: AREA (Root)
        // ---------------------------------------------------------
        if (!level || level === 'AREA') {
            // Fetch all Areas
            const areas = await prisma.area.findMany({
                include: {
                    machineTypes: {
                        include: {
                            machineMasters: {
                                include: {
                                    machines: {
                                        select: { id: true }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            // Count failures per Area
            for (const area of areas) {
                // Collect all machine Ids in this area
                const machineIdsInArea = [];
                area.machineTypes.forEach(mt => {
                    mt.machineMasters.forEach(mm => {
                        mm.machines.forEach(m => {
                            if (!assignedMachineIds || assignedMachineIds.includes(m.id)) {
                                machineIdsInArea.push(m.id);
                            }
                        });
                    });
                });

                if (machineIdsInArea.length === 0) continue;

                // Count NG records for these machines
                const count = await prisma.pMRecordDetail.count({
                    where: {
                        isPass: false,
                        record: {
                            machineId: { in: machineIdsInArea },
                            ...dateFilter
                        }
                    }
                });

                if (count > 0) {
                    results.push({
                        id: area.id,
                        name: area.name,
                        value: count,
                        level: 'AREA'
                    });
                }
            }

            // [OPTIMIZATION] If only 1 Area found, Auto-skip to TYPE level
            if (results.length === 1) {
                return exports.getFailureBreakdown({
                    ...req,
                    query: { ...req.query, level: 'TYPE', parentId: results[0].id }
                }, res);
            }
        }

        // ---------------------------------------------------------
        // LEVEL 2: MACHINE TYPE (Parent: Area)
        // ---------------------------------------------------------
        else if (level === 'TYPE') {
            const areaId = parseInt(parentId);

            const machineTypes = await prisma.machineType.findMany({
                where: { areaId: areaId },
                include: {
                    machineMasters: {
                        include: {
                            machines: { select: { id: true } }
                        }
                    }
                }
            });

            for (const type of machineTypes) {
                const machineIdsInType = [];
                type.machineMasters.forEach(mm => {
                    mm.machines.forEach(m => {
                        if (!assignedMachineIds || assignedMachineIds.includes(m.id)) {
                            machineIdsInType.push(m.id);
                        }
                    });
                });

                if (machineIdsInType.length === 0) continue;

                const count = await prisma.pMRecordDetail.count({
                    where: {
                        isPass: false,
                        record: {
                            machineId: { in: machineIdsInType },
                            ...dateFilter
                        }
                    }
                });

                if (count > 0) {
                    results.push({
                        id: type.id,
                        name: type.name,
                        value: count,
                        level: 'TYPE'
                    });
                }
            }
        }

        // ---------------------------------------------------------
        // LEVEL 3: MACHINE (Parent: Machine Type)
        // ---------------------------------------------------------
        else if (level === 'MACHINE') {
            const typeId = parseInt(parentId);

            // Find machines via MachineMaster -> MachineType
            const machines = await prisma.machine.findMany({
                where: {
                    machineMaster: {
                        machineTypeId: typeId
                    },
                    ...(assignedMachineIds ? { id: { in: assignedMachineIds } } : {})
                }
            });

            for (const machine of machines) {
                const count = await prisma.pMRecordDetail.count({
                    where: {
                        isPass: false,
                        record: {
                            machineId: machine.id,
                            ...dateFilter
                        }
                    }
                });

                if (count > 0) {
                    results.push({
                        id: machine.id,
                        name: machine.code, // Use Code or Name
                        value: count,
                        level: 'MACHINE'
                    });
                }
            }
        }

        // ---------------------------------------------------------
        // LEVEL 4: TOPIC (Parent: Machine)
        // ---------------------------------------------------------
        else if (level === 'TOPIC') {
            const machineId = parseInt(parentId);

            const details = await prisma.pMRecordDetail.findMany({
                where: {
                    isPass: false,
                    record: {
                        machineId: machineId,
                        ...dateFilter
                    }
                },
                include: {
                    record: {
                        select: { date: true, inspector: true, remark: true }
                    },
                    masterChecklist: { select: { topic: true } }
                }
            });

            // Group by Topic
            const topicMap = {}; // topicName -> { count, details: [] }

            details.forEach(d => {
                const topicName = d.topic || d.masterChecklist?.topic || "Unknown";

                if (!topicMap[topicName]) {
                    topicMap[topicName] = {
                        id: topicName, // Use name as ID for topic
                        name: topicName,
                        value: 0,
                        level: 'TOPIC',
                        occurrences: []
                    };
                }

                topicMap[topicName].value++;
                topicMap[topicName].occurrences.push({
                    date: d.record.date,
                    inspector: d.record.inspector,
                    remark: d.remark || d.record.remark // Item remark or record remark
                });
            });

            results = Object.values(topicMap);
        }

        res.json(results);

    } catch (error) {
        console.error("Drilldown Error:", error);
        res.status(500).json({ error: error.message });
    }
};
