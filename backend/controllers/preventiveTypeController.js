const prisma = require('../prismaClient');

// Get all preventive types with master checklists
// Get all preventive types with master checklists
exports.getAllTypes = async (req, res) => {
    try {
        let where = {};

        // [RBAC] Filter by assigned machines
        if (req.user && req.user.systemRole !== 'ADMIN') {
            const user = await prisma.userMaster.findUnique({
                where: { id: req.user.id },
                include: {
                    assignedMachines: {
                        include: {
                            pmPlans: true
                        }
                    }
                }
            });

            // Get unique PreventiveType IDs from assigned machines' plans
            const assignedTypeIds = new Set();
            user?.assignedMachines.forEach(m => {
                m.pmPlans.forEach(p => assignedTypeIds.add(p.preventiveTypeId));
            });

            where.id = { in: Array.from(assignedTypeIds) };
        }

        const types = await prisma.preventiveType.findMany({
            where,
            include: {
                masterChecklists: { orderBy: { order: 'asc' } }
            }
        });
        res.json(types);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Create a new preventive type
exports.createType = async (req, res) => {
    try {
        const { name, description, image, isFixedDate, emailRecipients, notifyAdvanceDays } = req.body;
        const type = await prisma.preventiveType.create({
            data: {
                name,
                description,
                image,
                isFixedDate: isFixedDate !== undefined ? isFixedDate : true,
                postponeLogic: req.body.postponeLogic || 'SHIFT',
                emailRecipients,
                notifyAdvanceDays: notifyAdvanceDays ? parseInt(notifyAdvanceDays) : 3
            },
            include: { masterChecklists: true }
        });
        res.json(type);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a preventive type
exports.updateType = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, image, isFixedDate, emailRecipients, notifyAdvanceDays } = req.body;
        const type = await prisma.preventiveType.update({
            where: { id: parseInt(id) },
            data: {
                name,
                description,
                image,
                isFixedDate: isFixedDate !== undefined ? isFixedDate : undefined,
                postponeLogic: req.body.postponeLogic,
                emailRecipients,
                notifyAdvanceDays: notifyAdvanceDays !== undefined ? parseInt(notifyAdvanceDays) : undefined
            },
            include: { masterChecklists: true }
        });

        // [NEW] Emit update event so other clients (like Machine Settings) refresh
        if (req.io) {
            req.io.emit('machine_update', { action: 'update_type', typeId: id });
        }

        res.json(type);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a preventive type
exports.deleteType = async (req, res) => {
    try {
        const { id } = req.params;

        // [NEW] Check usage in Plans
        const planCount = await prisma.machinePMPlan.count({ where: { preventiveTypeId: parseInt(id) } });
        if (planCount > 0) {
            return res.status(400).json({ error: `Cannot delete: This PM Type is used in ${planCount} machine plans. Please remove the plans first.` });
        }

        // [NEW] Check usage in History Records
        const recordCount = await prisma.pMRecord.count({ where: { preventiveTypeId: parseInt(id) } });
        if (recordCount > 0) {
            return res.status(400).json({ error: `Cannot delete: This PM Type is used in ${recordCount} historical records.` });
        }

        await prisma.masterChecklist.deleteMany({ where: { preventiveTypeId: parseInt(id) } });
        await prisma.preventiveType.delete({ where: { id: parseInt(id) } });

        if (req.io) {
            req.io.emit('machine_update', { action: 'delete_type', typeId: id });
        }

        res.json({ message: 'Preventive Type deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Add a master checklist item
exports.addMasterChecklist = async (req, res) => {
    try {
        const { id } = req.params; // preventiveTypeId
        const { topic, type, minVal, maxVal, order, options, isRequired } = req.body;

        const item = await prisma.masterChecklist.create({
            data: {
                preventiveTypeId: parseInt(id),
                topic,
                type,
                minVal: minVal ? parseFloat(minVal) : null,
                maxVal: maxVal ? parseFloat(maxVal) : null,
                order: parseInt(order) || 0,
                options: options || null,
                isRequired: !!isRequired,
                useValueLimit: !!req.body.useValueLimit,
                valueLimitCount: parseInt(req.body.valueLimitCount) || 0,
                valueLimitHours: parseInt(req.body.valueLimitHours) || 0,
                isActive: req.body.isActive !== undefined ? !!req.body.isActive : true
            }
        });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update a master checklist item
exports.updateMasterChecklist = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { topic, type, minVal, maxVal, order, options, isRequired } = req.body;

        const item = await prisma.masterChecklist.update({
            where: { id: parseInt(itemId) },
            data: {
                topic,
                type,
                minVal: minVal ? parseFloat(minVal) : null,
                maxVal: maxVal ? parseFloat(maxVal) : null,
                order: parseInt(order) || 0,
                options: options || null,
                isRequired: !!isRequired,
                useValueLimit: !!req.body.useValueLimit,
                valueLimitCount: parseInt(req.body.valueLimitCount) || 0,
                valueLimitHours: parseInt(req.body.valueLimitHours) || 0,
                isActive: req.body.isActive !== undefined ? !!req.body.isActive : undefined
            }
        });
        res.json(item);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Delete a master checklist item
exports.deleteMasterChecklist = async (req, res) => {
    try {
        const { itemId } = req.params;

        // [NEW] Check usage in History
        const usageCount = await prisma.pMRecordDetail.count({ where: { checklistId: parseInt(itemId) } });

        if (usageCount > 0) {
            // Soft Delete (Deactivate)
            await prisma.masterChecklist.update({
                where: { id: parseInt(itemId) },
                data: { isActive: false }
            });
            return res.json({ message: 'Item deactivated (Soft Delete) because it is used in history.', softDelete: true });
        }

        await prisma.masterChecklist.delete({ where: { id: parseInt(itemId) } });
        res.json({ message: 'Checklist item deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Reorder master checklists
exports.reorderMasterChecklists = async (req, res) => {
    try {
        const { items } = req.body; // Array of { id, order }

        if (!items || !Array.isArray(items)) {
            return res.status(400).json({ error: 'Invalid data format' });
        }

        // Use transaction to ensure all updates succeed
        await prisma.$transaction(
            items.map(item =>
                prisma.masterChecklist.update({
                    where: { id: item.id },
                    data: { order: item.order }
                })
            )
        );

        res.json({ message: 'Order updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
