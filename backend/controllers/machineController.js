const prisma = require('../prismaClient');

// Get all machines
// Get all machines
exports.getMachines = async (req, res) => {
    try {
        const user = req.user;
        let whereClause = {};

        // If User (not Admin), filter by assigned machines
        if (user && user.systemRole === 'USER') {
            whereClause = {
                assignedUsers: {
                    some: {
                        id: user.id
                    }
                }
            };
        }

        const machines = await prisma.machine.findMany({
            where: whereClause,
            include: {
                pmPlans: {
                    include: {
                        preventiveType: true
                    }
                },
                machineMaster: {
                    include: {
                        machineType: {
                            include: {
                                area: true
                            }
                        }
                    }
                }
            }
        });
        res.json(machines);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get machine by ID
exports.getMachineById = async (req, res) => {
    try {
        const { id } = req.params;
        const { typeId } = req.query; // Optional: filter by preventive type

        const machine = await prisma.machine.findUnique({
            where: { id: parseInt(id) },
            include: {
                pmPlans: {
                    include: {
                        preventiveType: {
                            include: {
                                masterChecklists: {
                                    orderBy: { order: 'asc' }
                                }
                            }
                        }
                    }
                },
                machineMaster: {
                    include: {
                        machineType: {
                            include: {
                                area: true
                            }
                        }
                    }
                },
                checklistTemplates: {
                    orderBy: { order: 'asc' }
                }
            }
        });

        // Normalize response: if we fetched checklistTemplates, also expose as 'checklists'
        if (machine) {
            machine.checklists = machine.checklistTemplates || [];

            // [NEW] Query last PM record for this machine to get previous values
            const lastRecordWhere = { machineId: parseInt(id) };
            if (typeId) {
                lastRecordWhere.preventiveTypeId = parseInt(typeId);
            }

            const lastRecord = await prisma.pMRecord.findFirst({
                where: lastRecordWhere,
                orderBy: { date: 'desc' },
                include: {
                    details: {
                        select: { checklistId: true, value: true, subItemName: true }
                    }
                }
            });

            // Map to { checklistId: value } or { checklistId_subItemIndex: value }
            machine.lastPMValues = {};
            machine.lastPMDate = lastRecord?.date || null; // [NEW] Return date of last PM
            if (lastRecord?.details) {
                lastRecord.details.forEach(d => {
                    if (d.subItemName) {
                        // For sub-items: use checklistId_subItemName as key
                        machine.lastPMValues[`${d.checklistId}_${d.subItemName}`] = d.value;
                    } else if (d.checklistId) {
                        machine.lastPMValues[d.checklistId] = d.value;
                    }
                });
            }
        }
        if (!machine) return res.status(404).json({ error: 'Machine not found' });
        res.json(machine);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get all machine types
exports.getMachineTypes = async (req, res) => {
    try {
        const types = await prisma.preventiveType.findMany();
        res.json(types);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create a new machine
// Create a new machine
exports.createMachine = async (req, res) => {
    try {
        const { code, name, model, location, frequencyDays, advanceNotifyDays, machineTypeId, machineMasterId } = req.body;

        const machine = await prisma.machine.create({
            data: {
                code,
                name,
                model,
                location,
                machineMasterId: machineMasterId ? parseInt(machineMasterId) : null,
                pmPlans: {
                    create: machineTypeId ? [{
                        preventiveTypeId: parseInt(machineTypeId),
                        frequencyDays: parseInt(frequencyDays),
                        advanceNotifyDays: parseInt(advanceNotifyDays),
                        nextPMDate: new Date() // Set default or logic
                    }] : []
                }
            },
            include: { pmPlans: true, checklists: true }
        });

        if (req.io) {
            req.io.emit('machine_update', { action: 'create' });
            req.io.emit('dashboard_update');
        }

        res.json(machine);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Bulk Create Machines
// Bulk Create Machines
exports.createMachinesBulk = async (req, res) => {
    try {
        const { machineTypeId, frequencyDays, advanceNotifyDays, machines, nextPMDate } = req.body;

        if (!machines || !Array.isArray(machines) || machines.length === 0) {
            return res.status(400).json({ error: "Invalid machines data" });
        }

        // 1. Fetch Master Checklist ONCE
        let checklistData = [];
        if (machineTypeId) {
            const masterChecklists = await prisma.masterChecklist.findMany({
                where: { preventiveTypeId: parseInt(machineTypeId) }
            });

            checklistData = masterChecklists.map(mc => ({
                topic: mc.topic,
                description: mc.description,
                type: mc.type,
                minVal: mc.minVal,
                maxVal: mc.maxVal,
                order: mc.order,
                options: mc.options, // [NEW]
                isRequired: mc.isRequired // [NEW]
            }));
        }

        // 2. Perform Transaction
        const results = await prisma.$transaction(async (tx) => {
            const processedMachines = [];

            // Sequential processing to avoid Deadlocks
            for (const m of machines) {
                // Check if exists by unique code
                const existing = await tx.machine.findUnique({
                    where: { code: m.code }
                });

                let machineId;

                if (existing) {
                    // Update existing machine (basic info only)
                    const updateData = {
                        name: m.name,
                        model: m.model,
                        location: m.location,
                        // machineTypeId is removed from Machine
                        machineMasterId: m.machineMasterId ? parseInt(m.machineMasterId) : null,
                    };

                    await tx.machine.update({
                        where: { id: existing.id },
                        data: updateData
                    });
                    machineId = existing.id;
                } else {
                    // Create New
                    const newMachine = await tx.machine.create({
                        data: {
                            code: m.code,
                            name: m.name,
                            model: m.model,
                            location: m.location,
                            machineMasterId: m.machineMasterId ? parseInt(m.machineMasterId) : null,
                            // No initial pmConfig or machineTypeId
                        }
                    });
                    machineId = newMachine.id;
                }

                // Create or Update MachinePMPlan
                if (machineTypeId) {
                    await tx.machinePMPlan.upsert({
                        where: {
                            machineId_preventiveTypeId: {
                                machineId: machineId,
                                preventiveTypeId: parseInt(machineTypeId)
                            }
                        },
                        create: {
                            machineId: machineId,
                            preventiveTypeId: parseInt(machineTypeId),
                            frequencyDays: parseInt(frequencyDays),
                            advanceNotifyDays: parseInt(advanceNotifyDays),
                            // [MODIFIED] If Manual (freq=0), no next date. Else default to today.
                            nextPMDate: parseInt(frequencyDays) > 0 ? new Date() : null
                        },
                        update: {
                            frequencyDays: parseInt(frequencyDays),
                            advanceNotifyDays: parseInt(advanceNotifyDays),
                            // [MODIFIED] If Manual (freq=0), clear next date. Else update if provided.
                            ...(parseInt(frequencyDays) === 0 ? { nextPMDate: null } : (nextPMDate && { nextPMDate: new Date(nextPMDate) }))
                        }
                    });

                    // For checklists: Delete old and recreate (Legacy support)
                    // Note: Checklists are now technically tied to Type via Plan, but if we still copy to Machine (for legacy custom checks), we keep this.
                    // Ideally, we should rely on Type -> MasterChecklist directly.
                    // But for now, let's keep copying to ChecklistTemplate if it's the specific "Single PM" behavior, or remove it?
                    // "ChecklistTemplate" is for ad-hoc per-machine checks.
                    // "MasterChecklist" is for Type-based checks.
                    // If we use multiple types, copying to ChecklistTemplate causes conflicts or redundancy.
                    // Let's SKIP copying to ChecklistTemplate when using PM Types, and rely on rendering MasterChecklists dynamically.

                    /* 
                    // OLD BEHAVIOR: Copy to ChecklistTemplate
                    if (checklistData.length > 0) {
                        await tx.checklistTemplate.deleteMany({ where: { machineId: machineId } });
                        await tx.checklistTemplate.createMany({
                            data: checklistData.map(c => ({ ...c, machineId: machineId }))
                        });
                    } 
                    */
                    // For now, I will NOT copy check lists to Machine level to avoid pollution.
                }

                processedMachines.push({ id: machineId, code: m.code });
            }
            return processedMachines;
        });

        if (req.io) {
            req.io.emit('machine_update', { action: 'create_bulk', count: results.length });
            req.io.emit('dashboard_update');
        }

        res.json({ message: "Bulk creation successful", count: results.length, machines: results });

    } catch (error) {
        console.error("Bulk create error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Update machine
exports.updateMachine = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, model, location, frequencyDays, advanceNotifyDays, machineTypeId, machineMasterId, nextPMDate } = req.body;

        // Update basic info
        await prisma.machine.update({
            where: { id: parseInt(id) },
            data: {
                code,
                name,
                model,
                location,
                machineMasterId: machineMasterId ? parseInt(machineMasterId) : null,
                // Only update specific plan if type is provided? 
                // With Many-to-Many, "Edit Machine" form needs to be smarter.
                // For now, let's assume we are updating ONE specific plan or just basic info
                // This is tricky. If frontend sends `machineTypeId`, we essentially Upsert that plan.
            }
        });

        if (machineTypeId && frequencyDays !== undefined && frequencyDays !== null) {
            await prisma.machinePMPlan.upsert({
                where: {
                    machineId_preventiveTypeId: {
                        machineId: parseInt(id),
                        preventiveTypeId: parseInt(machineTypeId)
                    }
                },
                create: {
                    machineId: parseInt(id),
                    preventiveTypeId: parseInt(machineTypeId),
                    frequencyDays: parseInt(frequencyDays),
                    advanceNotifyDays: parseInt(advanceNotifyDays),
                },
                update: {
                    frequencyDays: parseInt(frequencyDays),
                    advanceNotifyDays: parseInt(advanceNotifyDays),
                    // [MODIFIED] If Manual (freq=0), clear next date. Else update if provided.
                    ...(parseInt(frequencyDays) === 0 ? { nextPMDate: null } : (nextPMDate && { nextPMDate: new Date(nextPMDate) }))
                }
            });
        }

        const machine = await prisma.machine.findUnique({
            where: { id: parseInt(id) },
            include: { pmPlans: true }
        });

        if (req.io) {
            req.io.emit('machine_update', { action: 'update', machineId: id });
            req.io.emit('dashboard_update');
        }

        res.json(machine);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete machine
exports.deleteMachine = async (req, res) => {
    try {
        const { id } = req.params;
        // Delete config first (cascade should handle this but explicit is safer if not set)
        // Delete config first (cascade should handle this but explicit is safer if not set)
        // Delete config first (cascade should handle this but explicit is safer if not set)
        await prisma.machinePMPlan.deleteMany({ where: { machineId: parseInt(id) } });
        // Delete PM records (fixes foreign key constraint error)
        await prisma.pMRecord.deleteMany({ where: { machineId: parseInt(id) } });

        await prisma.machine.delete({ where: { id: parseInt(id) } });

        if (req.io) {
            req.io.emit('machine_update', { action: 'delete', machineId: id });
            req.io.emit('dashboard_update');
        }

        res.json({ message: 'Machine deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a machine PM plan
exports.deleteMachinePMPlan = async (req, res) => {
    try {
        const { planId } = req.params;
        await prisma.machinePMPlan.delete({
            where: { id: parseInt(planId) }
        });

        if (req.io) {
            req.io.emit('machine_update', { action: 'delete_plan', planId });
            req.io.emit('dashboard_update');
        }

        res.json({ message: 'Plan deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
