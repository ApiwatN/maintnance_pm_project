const prisma = require('../prismaClient');

exports.getAllMachineTypes = async (req, res) => {
    try {
        const user = req.user;
        let whereClause = {};

        // If User (not Admin), filter by assigned machines -> machineTypes
        if (user && user.systemRole === 'USER') {
            // 1. Find all machines assigned to this user
            const assignedMachines = await prisma.machine.findMany({
                where: {
                    assignedUsers: {
                        some: { id: user.id }
                    }
                },
                select: {
                    machineMaster: {
                        select: { machineTypeId: true }
                    }
                }
            });

            // 2. Extract unique MachineType IDs
            const typeIds = new Set();
            assignedMachines.forEach(m => {
                if (m.machineMaster?.machineTypeId) {
                    typeIds.add(m.machineMaster.machineTypeId);
                }
            });

            // 3. Filter MachineTypes
            whereClause = {
                id: { in: Array.from(typeIds) }
            };
        }

        const types = await prisma.machineType.findMany({
            where: whereClause,
            include: { area: true }
        });
        res.json(types);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createMachineType = async (req, res) => {
    try {
        const { name, description, areaId } = req.body;
        const type = await prisma.machineType.create({
            data: {
                name,
                description,
                areaId: areaId ? parseInt(areaId) : null
            }
        });
        res.status(201).json(type);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateMachineType = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, areaId } = req.body;
        const type = await prisma.machineType.update({
            where: { id: parseInt(id) },
            data: {
                name,
                description,
                areaId: areaId ? parseInt(areaId) : null
            }
        });
        res.json(type);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteMachineType = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.machineType.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: 'Machine Type deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
