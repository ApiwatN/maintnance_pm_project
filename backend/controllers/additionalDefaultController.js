const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET /api/additional-defaults/:machineId/:typeId
 * Get all default values for a specific machine and PM type
 */
exports.getDefaults = async (req, res) => {
    try {
        const { machineId, typeId } = req.params;

        const defaults = await prisma.additionalDetailDefault.findMany({
            where: {
                machineId: parseInt(machineId),
                preventiveTypeId: parseInt(typeId)
            }
        });

        res.json(defaults);
    } catch (error) {
        console.error('Error fetching additional defaults:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * POST /api/additional-defaults
 * Upsert default values
 * Body: { machineId, preventiveTypeId, dropdownKey, textDefaults: [{ textChecklistId, textValue }] }
 */
exports.saveDefaults = async (req, res) => {
    try {
        const { machineId, preventiveTypeId, dropdownKey, textDefaults } = req.body;

        if (!machineId || !preventiveTypeId || !textDefaults || !Array.isArray(textDefaults)) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const results = [];

        for (const item of textDefaults) {
            if (!item.textChecklistId || item.textValue === undefined) continue;

            // Upsert: update if exists, create if not
            const result = await prisma.additionalDetailDefault.upsert({
                where: {
                    machineId_preventiveTypeId_dropdownKey_textChecklistId: {
                        machineId: parseInt(machineId),
                        preventiveTypeId: parseInt(preventiveTypeId),
                        dropdownKey: dropdownKey || '{}',
                        textChecklistId: parseInt(item.textChecklistId)
                    }
                },
                update: {
                    textValue: item.textValue
                },
                create: {
                    machineId: parseInt(machineId),
                    preventiveTypeId: parseInt(preventiveTypeId),
                    dropdownKey: dropdownKey || '{}',
                    textChecklistId: parseInt(item.textChecklistId),
                    textValue: item.textValue
                }
            });

            results.push(result);
        }

        res.json({ success: true, count: results.length });
    } catch (error) {
        console.error('Error saving additional defaults:', error);
        res.status(500).json({ error: error.message });
    }
};
