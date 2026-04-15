const express = require('express');
const { addFeedback, getAllFeedback } = require('../controllers/feedbackController');

const router = express.Router();

router.post('/add', addFeedback);
router.get('/all', getAllFeedback);

module.exports = router;
