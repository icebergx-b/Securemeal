const express = require('express');
const {
  deleteStudent,
  getAllStudents,
  getStudentAttendance,
  getStudentLoginHistory,
  getStudentStats,
  registerStudent,
  updateStudent,
} = require('../controllers/studentController');

const router = express.Router();

router.post('/register', registerStudent);
router.get('/all', getAllStudents);
router.get('/:id/attendance', getStudentAttendance);
router.get('/:id/login-history', getStudentLoginHistory);
router.get('/:id/stats', getStudentStats);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);

module.exports = router;
