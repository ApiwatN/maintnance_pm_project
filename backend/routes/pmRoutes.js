const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const pmController = require('../controllers/pmController');

router.get('/global-status', authenticateToken, pmController.getMachineStatusOverview);
router.get('/schedule', authenticateToken, pmController.getSchedule);
router.get('/dashboard-stats', authenticateToken, pmController.getDashboardStats);
router.get('/records/:id', authenticateToken, pmController.getRecord);
router.get('/machine/:machineId/history', authenticateToken, pmController.getMachineHistory);
router.post('/record', authenticateToken, pmController.recordPM);
router.put('/records/:id', authenticateToken, pmController.updateRecord);
router.delete('/records/:id', authenticateToken, pmController.deleteRecord);
router.get('/analysis/machine', authenticateToken, pmController.getMachineAnalysis);
router.get('/analysis/operator', authenticateToken, pmController.getOperatorAnalysis);

module.exports = router;
