const express = require('express');
const router = express.Router();
const controller = require('../controllers/additionalDefaultController');

// GET /api/additional-defaults/:machineId/:typeId
router.get('/:machineId/:typeId', controller.getDefaults);

// POST /api/additional-defaults
router.post('/', controller.saveDefaults);

module.exports = router;
