const express = require('express');
const { listRegisteredStudents, studentLogin } = require('../controllers/authController');

const router = express.Router();

router.get('/students', listRegisteredStudents);
router.post('/login', studentLogin);

module.exports = router;
