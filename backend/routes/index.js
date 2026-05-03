const express = require('express');
const { healthCheck } = require('../controllers/healthController');
const studentRoutes = require('./studentRoutes');
const menuRoutes = require('./menuRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const feedbackRoutes = require('./feedbackRoutes');
const staffRoutes = require('./staffRoutes');
const labRoutes = require('./labRoutes');
const authRoutes = require('./authRoutes');
const adminRoutes = require('./adminRoutes');

const router = express.Router();

router.get('/health', healthCheck);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/student', studentRoutes);
router.use('/menu', menuRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/staff', staffRoutes);
router.use('/lab', labRoutes);

module.exports = router;
