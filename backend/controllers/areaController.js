const prisma = require('../prismaClient');

exports.getAreas = async (req, res) => {
    try {
        const user = req.user;
        let whereClause = {};

        // If User (not Admin), filter by assigned machines -> machineTypes -> areas
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
                        select: {
                            machineType: {
                                select: { areaId: true }
                            }
                        }
                    }
                }
            });

            // 2. Extract unique Area IDs
            const areaIds = new Set();
            assignedMachines.forEach(m => {
                if (m.machineMaster?.machineType?.areaId) {
                    areaIds.add(m.machineMaster.machineType.areaId);
                }
            });

            // 3. Filter Areas
            whereClause = {
                id: { in: Array.from(areaIds) }
            };
        }

        const areas = await prisma.area.findMany({
            where: whereClause,
            include: { machineTypes: true }
        });
        res.json(areas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createArea = async (req, res) => {
    try {
        const { name, description } = req.body;
        const area = await prisma.area.create({
            data: { name, description }
        });
        res.json(area);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateArea = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const area = await prisma.area.update({
            where: { id: parseInt(id) },
            data: { name, description }
        });
        res.json(area);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteArea = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.area.delete({
            where: { id: parseInt(id) }
        });
        res.json({ message: "Area deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
