const prisma = require('../prismaClient');

exports.getReport = async (req, res) => {
    try {
        const { startDate, endDate, machineId, status } = req.query;

        const where = {};

        // [RBAC] Filter by assigned machines
        if (req.user && req.user.systemRole !== 'ADMIN') {
            const user = await prisma.userMaster.findUnique({
                where: { id: req.user.id },
                include: { assignedMachines: { select: { id: true } } }
            });
            const assignedIds = user?.assignedMachines.map(m => m.id) || [];

            if (machineId) {
                if (!assignedIds.includes(parseInt(machineId))) {
                    return res.status(403).json({ error: 'Access denied to this machine' });
                }
                where.machineId = parseInt(machineId);
            } else {
                where.machineId = { in: assignedIds };
            }
        } else if (machineId) {
            where.machineId = parseInt(machineId);
        }

        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }

        if (status) {
            where.status = status;
        }

        const records = await prisma.pMRecord.findMany({
            where,
            include: {
                machine: {
                    include: {
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
                },
                details: {
                    include: { checklist: true }
                }
            },
            orderBy: { date: 'desc' }
        });

        res.json(records);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
