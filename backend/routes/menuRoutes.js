const express = require('express');
const { getMenu, addMenu } = require('../controllers/menuController');

const router = express.Router();

router.get('/', getMenu);
router.post('/add', addMenu);

module.exports = router;
