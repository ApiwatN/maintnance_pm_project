const express = require('express');
const router = express.Router();
const machineTypeController = require('../controllers/machineTypeController');

const { authenticateToken } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, machineTypeController.getAllMachineTypes);
router.post('/', machineTypeController.createMachineType);
router.put('/:id', machineTypeController.updateMachineType);
router.delete('/:id', machineTypeController.deleteMachineType);

module.exports = router;
