const prisma = require('../prismaClient');

// GET all holidays (with optional month/year filter)
const getHolidays = async (req, res) => {
    try {
        const { month, year } = req.query;

        let whereClause = {};

        if (month && year) {
            const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
            whereClause = {
                date: {
                    gte: startDate,
                    lte: endDate
                }
            };
        }

        const holidays = await prisma.holiday.findMany({
            where: whereClause,
            orderBy: { date: 'asc' }
        });

        res.json(holidays);
    } catch (error) {
        console.error('Error fetching holidays:', error);
        res.status(500).json({ error: 'Failed to fetch holidays' });
    }
};

// CREATE holiday
const createHoliday = async (req, res) => {
    try {
        const { date, name, description } = req.body;

        if (!date || !name) {
            return res.status(400).json({ error: 'Date and name are required' });
        }

        // Normalize date to start of day
        const holidayDate = new Date(date);
        holidayDate.setHours(0, 0, 0, 0);

        const holiday = await prisma.holiday.create({
            data: {
                date: holidayDate,
                name,
                description: description || null
            }
        });

        res.status(201).json(holiday);
    } catch (error) {
        console.error('Error creating holiday:', error);
        if (error.code === 'P2002') {
            res.status(400).json({ error: 'Holiday already exists for this date' });
        } else {
            res.status(500).json({ error: 'Failed to create holiday' });
        }
    }
};

// DELETE holiday
const deleteHoliday = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.holiday.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Holiday deleted successfully' });
    } catch (error) {
        console.error('Error deleting holiday:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Holiday not found' });
        } else {
            res.status(500).json({ error: 'Failed to delete holiday' });
        }
    }
};

module.exports = {
    getHolidays,
    createHoliday,
    deleteHoliday
};
