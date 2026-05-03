const express = require('express');
const {
  bulkAttendance,
  getAdminStats,
  getLoginLogs,
  getMealSummary,
  getTodayAttendance,
  getTriggerLogs,
} = require('../controllers/adminController');

const router = express.Router();

router.get('/login-logs', getLoginLogs);
router.get('/trigger-logs', getTriggerLogs);
router.get('/stats', getAdminStats);
router.get('/meal-summary', getMealSummary);
router.get('/attendance/today', getTodayAttendance);
router.post('/attendance/bulk', bulkAttendance);

module.exports = router;
