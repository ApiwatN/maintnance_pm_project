const prisma = require('../prismaClient');

exports.getAll = async (req, res) => {
    try {
        let where = {};

        // [RBAC] Filter by assigned machines
        if (req.user && req.user.systemRole !== 'ADMIN') {
            const user = await prisma.userMaster.findUnique({
                where: { id: req.user.id },
                include: { assignedMachines: { include: { machineMaster: true } } }
            });

            // Get unique MachineMaster IDs from assigned machines
            const assignedMasterIds = [...new Set(user?.assignedMachines.map(m => m.machineMasterId).filter(id => id !== null))];
            where.id = { in: assignedMasterIds };
        }

        const masters = await prisma.machineMaster.findMany({
            where,
            orderBy: { name: 'asc' },
            include: {
                machineType: {
                    include: { area: true }
                }
            }
        });
        res.json(masters);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { code, name, description, machineTypeId } = req.body;
        const master = await prisma.machineMaster.create({
            data: {
                code,
                name,
                description,
                machineTypeId: machineTypeId ? parseInt(machineTypeId) : null
            }
        });
        res.json(master);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, name, description, machineTypeId } = req.body;
        const master = await prisma.machineMaster.update({
            where: { id: parseInt(id) },
            data: {
                code,
                name,
                description,
                machineTypeId: machineTypeId ? parseInt(machineTypeId) : null
            }
        });
        res.json(master);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.machineMaster.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
