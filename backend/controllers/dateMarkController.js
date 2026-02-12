const prisma = require('../prismaClient');

// GET user's date marks (with month/year filter) - INCLUDING recurring
const getDateMarks = async (req, res) => {
    try {
        const { month, year } = req.query;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const qMonth = parseInt(month);
        const qYear = parseInt(year);

        // Get all marks for this user
        const allMarks = await prisma.userDateMark.findMany({
            where: { userId },
            orderBy: { date: 'asc' }
        });

        // Calculate which dates to return for this month
        const result = [];
        const monthStart = new Date(qYear, qMonth - 1, 1);
        const monthEnd = new Date(qYear, qMonth, 0, 23, 59, 59);

        for (const mark of allMarks) {
            if (mark.isRecurring && mark.repeatEveryDays && mark.repeatStartDate && mark.repeatEndDate) {
                // Calculate recurring dates
                let current = new Date(mark.repeatStartDate);
                const repeatEnd = new Date(mark.repeatEndDate);

                while (current <= repeatEnd) {
                    // Check if this date falls within the query month
                    if (current >= monthStart && current <= monthEnd) {
                        result.push({
                            ...mark,
                            date: new Date(current),
                            isCalculated: true
                        });
                    }
                    current.setDate(current.getDate() + mark.repeatEveryDays);
                }
            } else {
                // Non-recurring mark
                const markDate = new Date(mark.date);
                if (markDate >= monthStart && markDate <= monthEnd) {
                    result.push(mark);
                }
            }
        }

        res.json(result);
    } catch (error) {
        console.error('Error fetching date marks:', error);
        res.status(500).json({ error: 'Failed to fetch date marks' });
    }
};

// CREATE or UPDATE date mark (upsert)
const createDateMark = async (req, res) => {
    try {
        const { date, color, note, isRecurring, repeatEveryDays, repeatStartDate, repeatEndDate } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!date || !color) {
            return res.status(400).json({ error: 'Date and color are required' });
        }

        // Validate color (must not be red - reserved for Admin Holiday)
        const adminColors = ['#FFCDD2', '#ffcdd2'];
        if (adminColors.includes(color)) {
            return res.status(400).json({ error: 'Red color is reserved for Admin holidays' });
        }

        // Normalize date
        const markDate = new Date(date);
        markDate.setHours(0, 0, 0, 0);

        const data = {
            color,
            note: note || null,
            isRecurring: isRecurring || false,
            repeatEveryDays: isRecurring ? repeatEveryDays : null,
            repeatStartDate: isRecurring && repeatStartDate ? new Date(repeatStartDate) : null,
            repeatEndDate: isRecurring && repeatEndDate ? new Date(repeatEndDate) : null
        };

        // Upsert - create or update
        const mark = await prisma.userDateMark.upsert({
            where: {
                userId_date: { userId, date: markDate }
            },
            update: data,
            create: {
                userId,
                date: markDate,
                ...data
            }
        });

        res.status(201).json(mark);
    } catch (error) {
        console.error('Error creating date mark:', error);
        res.status(500).json({ error: 'Failed to create date mark' });
    }
};

// DELETE date mark
const deleteDateMark = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Only allow deleting own marks
        const mark = await prisma.userDateMark.findFirst({
            where: { id: parseInt(id), userId }
        });

        if (!mark) {
            return res.status(404).json({ error: 'Date mark not found' });
        }

        await prisma.userDateMark.delete({
            where: { id: parseInt(id) }
        });

        res.json({ message: 'Date mark deleted successfully' });
    } catch (error) {
        console.error('Error deleting date mark:', error);
        res.status(500).json({ error: 'Failed to delete date mark' });
    }
};

// DELETE date mark by date (for removing mark on specific date)
const deleteDateMarkByDate = async (req, res) => {
    try {
        const { date } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const markDate = new Date(date);
        markDate.setHours(0, 0, 0, 0);

        await prisma.userDateMark.delete({
            where: {
                userId_date: { userId, date: markDate }
            }
        });

        res.json({ message: 'Date mark deleted successfully' });
    } catch (error) {
        console.error('Error deleting date mark:', error);
        if (error.code === 'P2025') {
            res.status(404).json({ error: 'Date mark not found' });
        } else {
            res.status(500).json({ error: 'Failed to delete date mark' });
        }
    }
};

module.exports = {
    getDateMarks,
    createDateMark,
    deleteDateMark,
    deleteDateMarkByDate
};
