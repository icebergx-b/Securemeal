const express = require('express');
const { healthCheck } = require('../controllers/healthController');
const authRoutes = require('./authRoutes');
const foodRoutes = require('./foodRoutes');

const router = express.Router();

router.get('/health', healthCheck);
router.use('/', authRoutes);
router.use('/food', foodRoutes);

module.exports = router;
