const express = require('express');
const router = express.Router();

const {
  saveSensorReading,
  getSensorReadings,
  getLatestReading,
  getSensorStats
} = require('../controllers/sensor.controller');
const isAuthenticated = require('../middleware/isAuthenticated');


// ------------------------
// All sensor routes require authentication
// ------------------------
router.use(isAuthenticated);

router.post('/', saveSensorReading);
router.get('/sample/:sampleId', getSensorReadings);
router.get('/sample/:sampleId/:readingType/latest', getLatestReading);
router.get('/sample/:sampleId/stats', getSensorStats);

module.exports = router;
