const prisma = require('../prismaClient');

exports.getDashboardStats = async (req, res) => {
    try {
        const today = new Date();
        const user = req.user;
        let whereClause = {};

        // If User (not Admin), filter by assigned machines
        if (user && user.systemRole === 'USER') {
            whereClause = {
                assignedUsers: {
                    some: { id: user.id }
                }
            };
        }

        // Fetch all machines with config, master, and type info
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
                            include: { area: true }
                        }
                    }
                },
                // Include recent records to check for NG per plan
                // pmrecords removed for optimization
            }
        });

        const status = {
            completed: 0,
            upcoming: 0,
            overdue: 0,
            has_ng: 0,
            total: 0 // Will count rows (plans), not machines
        };

        // Flatten: one row per (machine, plan) pair
        const rows = [];

        machines.forEach(machine => {
            if (!machine.pmPlans || machine.pmPlans.length === 0) {
                // Machine with no plans: one row with NO_PLAN status
                rows.push({
                    ...machine,
                    status: 'NO_PLAN',
                    pmConfig: null,
                    preventiveType: null,
                    preventiveTypeId: null
                });
                status.total++;
            } else {
                // One row per plan
                machine.pmPlans.forEach(plan => {
                    // Check Last PM Status for THIS Plan (Optimized)
                    let lastCheckStatus = plan.lastCheckStatus || null;
                    // Fallback logic removed as we now have backfilled data and live updates

                    // Determine Schedule Status first (for the row data)
                    let scheduleStatus = 'OK';
                    if (plan.nextPMDate) {
                        const diff = Math.ceil((new Date(plan.nextPMDate) - today) / (1000 * 60 * 60 * 24));
                        if (diff < 0) scheduleStatus = 'OVERDUE';
                        else if (diff <= plan.advanceNotifyDays) scheduleStatus = 'UPCOMING';
                    }

                    // Update Counters (Mutually Exclusive)
                    if (lastCheckStatus === 'HAS_NG') {
                        status.has_ng++;
                    } else if (scheduleStatus === 'OVERDUE') {
                        status.overdue++;
                    } else if (scheduleStatus === 'UPCOMING') {
                        status.upcoming++;
                    } else {
                        status.completed++;
                    }

                    // Assign to planStatus for the row return
                    let planStatus = scheduleStatus;

                    rows.push({
                        id: machine.id,
                        code: machine.code,
                        name: machine.name,
                        model: machine.model,
                        location: machine.location,
                        machineMaster: machine.machineMaster,
                        status: planStatus,
                        lastCheckStatus, // [NEW]
                        preventiveType: plan.preventiveType ? {
                            id: plan.preventiveType.id,
                            name: plan.preventiveType.name
                        } : null,
                        preventiveTypeId: plan.preventiveTypeId,
                        pmConfig: {
                            frequencyDays: plan.frequencyDays,
                            advanceNotifyDays: plan.advanceNotifyDays,
                            lastPMDate: plan.lastPMDate,
                            nextPMDate: plan.nextPMDate
                        }
                    });
                    status.total++;
                });
            }
        });

        res.json({
            summary: status,
            machines: rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getOperatorStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const where = {};
        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }

        const records = await prisma.pMRecord.findMany({
            where,
            include: { machine: true }
        });

        // Aggregate by inspector
        const stats = {};
        records.forEach(r => {
            const inspector = r.inspector || 'Unknown';
            if (!stats[inspector]) {
                stats[inspector] = {
                    name: inspector,
                    total: 0,
                    completed: 0,
                    late: 0,
                    planned: 0,
                    records: []
                };
            }
            stats[inspector].total++;
            if (r.status === 'COMPLETED') stats[inspector].completed++;
            else if (r.status === 'LATE') stats[inspector].late++;
            else stats[inspector].planned++;

            stats[inspector].records.push({
                id: r.id,
                date: r.date,
                machine: r.machine?.name,
                status: r.status
            });
        });

        res.json(Object.values(stats));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
