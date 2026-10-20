const express = require('express');
const router = express.Router();
const { getAnalyticsSummary } = require('../controllers/analyticsController');

router.get('/summary', getAnalyticsSummary);

module.exports = router;