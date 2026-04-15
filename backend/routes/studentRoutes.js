const express = require('express');
const { registerStudent, getAllStudents } = require('../controllers/studentController');

const router = express.Router();

router.post('/register', registerStudent);
router.get('/all', getAllStudents);

module.exports = router;
