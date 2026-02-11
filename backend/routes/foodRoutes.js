const express = require('express');
const {
  addFood,
  getAvailableFood,
  claimFood,
  getClaimedFood,
  approveFood,
} = require('../controllers/foodController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/add', authMiddleware, addFood);
router.get('/available', authMiddleware, getAvailableFood);
router.get('/claimed', authMiddleware, getClaimedFood);
router.post('/claim', authMiddleware, claimFood);
router.put('/approve', authMiddleware, approveFood);

module.exports = router;
