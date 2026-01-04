const prisma = require('../prismaClient');

exports.getAll = async (req, res) => {
    try {
        const { machineId } = req.query;
        const where = {};

        if (machineId) {
            where.assignedMachines = {
                some: { id: parseInt(machineId) }
            };
        }

        const users = await prisma.userMaster.findMany({
            where,
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                role: true,
                employeeId: true,
                email: true,
                username: true,
                systemRole: true,
                permissionType: true,
                assignedMachines: {
                    select: { id: true, name: true, code: true }
                }
            }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { name, role, employeeId, email, username, password, systemRole, permissionType, assignedMachineIds } = req.body;

        // Check duplicate employeeId
        if (employeeId) {
            const existing = await prisma.userMaster.findFirst({ where: { employeeId } });
            if (existing) return res.status(400).json({ error: 'Employee ID already exists' });
        }

        // Check duplicate username
        if (username) {
            const existingUser = await prisma.userMaster.findFirst({ where: { username } });
            if (existingUser) return res.status(400).json({ error: 'Username already exists' });
        }

        const user = await prisma.userMaster.create({
            data: {
                name,
                role,
                employeeId,
                email,
                username,
                password,
                systemRole: systemRole || 'USER',
                permissionType: permissionType || 'PM_ONLY',
                assignedMachines: {
                    connect: assignedMachineIds ? assignedMachineIds.map(id => ({ id: parseInt(id) })) : []
                }
            },
            include: { assignedMachines: true }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, role, employeeId, email, username, password, systemRole, permissionType, assignedMachineIds } = req.body;

        // Check duplicate employeeId (exclude self)
        if (employeeId) {
            const existing = await prisma.userMaster.findFirst({
                where: {
                    employeeId,
                    id: { not: parseInt(id) }
                }
            });
            if (existing) return res.status(400).json({ error: 'Employee ID already exists' });
        }

        // Check duplicate username
        if (username) {
            const existingUser = await prisma.userMaster.findFirst({
                where: {
                    username,
                    id: { not: parseInt(id) }
                }
            });
            if (existingUser) return res.status(400).json({ error: 'Username already exists' });
        }

        // Prepare update data
        const updateData = {
            name,
            role,
            employeeId,
            email,
            username,
            password,
            systemRole,
            permissionType
        };

        // Handle assigned machines update
        if (assignedMachineIds) {
            updateData.assignedMachines = {
                set: assignedMachineIds.map(mid => ({ id: parseInt(mid) }))
            };
        }

        const user = await prisma.userMaster.update({
            where: { id: parseInt(id) },
            data: updateData,
            include: { assignedMachines: true }
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.userMaster.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
