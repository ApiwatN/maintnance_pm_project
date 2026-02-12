const prisma = require('../prismaClient');

// GET all holidays (with optional month/year filter) - INCLUDING recurring
const getHolidays = async (req, res) => {
    try {
        const { month, year } = req.query;

        const qMonth = parseInt(month);
        const qYear = parseInt(year);

        // Get all holidays (both single and recurring)
        const allHolidays = await prisma.holiday.findMany({
            orderBy: { date: 'asc' }
        });

        // Calculate which dates to return for this month
        const result = [];
        const monthStart = new Date(qYear, qMonth - 1, 1);
        const monthEnd = new Date(qYear, qMonth, 0, 23, 59, 59);

        for (const holiday of allHolidays) {
            if (holiday.isRecurring && holiday.repeatEveryDays && holiday.repeatStartDate && holiday.repeatEndDate) {
                // Calculate recurring dates
                let current = new Date(holiday.repeatStartDate);
                const repeatEnd = new Date(holiday.repeatEndDate);

                while (current <= repeatEnd) {
                    // Check if this date falls within the query month
                    if (current >= monthStart && current <= monthEnd) {
                        result.push({
                            ...holiday,
                            date: new Date(current), // Use the calculated date
                            isCalculated: true // Mark as calculated from recurring
                        });
                    }
                    // Move to next occurrence
                    current.setDate(current.getDate() + holiday.repeatEveryDays);
                }
            } else {
                // Non-recurring holiday - check if in query month
                const holidayDate = new Date(holiday.date);
                if (holidayDate >= monthStart && holidayDate <= monthEnd) {
                    result.push(holiday);
                }
            }
        }

        res.json(result);
    } catch (error) {
        console.error('Error fetching holidays:', error);
        res.status(500).json({ error: 'Failed to fetch holidays' });
    }
};

// CREATE holiday
const createHoliday = async (req, res) => {
    try {
        const { date, name, description, isRecurring, repeatEveryDays, repeatStartDate, repeatEndDate } = req.body;

        if (!date || !name) {
            return res.status(400).json({ error: 'Date and name are required' });
        }

        // Normalize date to start of day
        const holidayDate = new Date(date);
        holidayDate.setHours(0, 0, 0, 0);

        const data = {
            date: holidayDate,
            name,
            description: description || null,
            isRecurring: isRecurring || false,
            repeatEveryDays: isRecurring ? repeatEveryDays : null,
            repeatStartDate: isRecurring && repeatStartDate ? new Date(repeatStartDate) : null,
            repeatEndDate: isRecurring && repeatEndDate ? new Date(repeatEndDate) : null
        };

        const holiday = await prisma.holiday.create({ data });

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

// UPDATE holiday
const updateHoliday = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, isRecurring, repeatEveryDays, repeatStartDate, repeatEndDate } = req.body;

        const data = {
            name,
            description: description || null,
            isRecurring: isRecurring || false,
            repeatEveryDays: isRecurring ? repeatEveryDays : null,
            repeatStartDate: isRecurring && repeatStartDate ? new Date(repeatStartDate) : null,
            repeatEndDate: isRecurring && repeatEndDate ? new Date(repeatEndDate) : null
        };

        const holiday = await prisma.holiday.update({
            where: { id: parseInt(id) },
            data
        });

        res.json(holiday);
    } catch (error) {
        console.error('Error updating holiday:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Holiday not found' });
        } else {
            res.status(500).json({ error: 'Failed to update holiday' });
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
    updateHoliday,
    deleteHoliday
};
