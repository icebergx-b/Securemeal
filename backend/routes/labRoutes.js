const express = require('express');
const {
  executePlayground,
  getLogs,
  getOverview,
  runPrebuiltQuery,
  runProcedureDemo,
} = require('../controllers/labController');

const router = express.Router();

router.get('/overview', getOverview);
router.get('/logs', getLogs);
router.post('/playground', executePlayground);
router.get('/prebuilt/:queryId', runPrebuiltQuery);
router.post('/procedure', runProcedureDemo);

module.exports = router;
