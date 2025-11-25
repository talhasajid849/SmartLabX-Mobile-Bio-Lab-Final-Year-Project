const express = require('express');
const router = express.Router();

const {
  createSample,
  getMySamples,
  getSampleById,
  getSampleByQRCode,
  updateSample,
  deleteSample,
  shareSample,
  exportSamplePDF,
  getSampleChartData,
  getSampleAnalyticsAdmin,
  deleteSampleAdmin,
  updateSampleStatus
} = require('../controllers/sample.controller');
const authorizedRoles = require('../middleware/authorizedRoles');
const isAuthenticated = require('../middleware/isAuthenticated');


// ------------------------
// User routes
// ------------------------
router.post('/', isAuthenticated, createSample);
router.get('/', isAuthenticated, getMySamples);
router.get('/admin-chart', isAuthenticated, authorizedRoles('admin'), getSampleAnalyticsAdmin);
router.get('/chart-data', isAuthenticated, getSampleChartData); // specific route
router.get('/qr/:sampleId', isAuthenticated, getSampleByQRCode);
router.get('/:id', isAuthenticated, getSampleById);
router.get('/:id/export', isAuthenticated, exportSamplePDF);
router.post('/:id/share', isAuthenticated, shareSample);
router.delete('/:id', isAuthenticated, deleteSample);

// ------------------------
// Admin routes
// ------------------------
router.put('/admin/:id', isAuthenticated, authorizedRoles('admin'), updateSample);
router.put('/admin/status/:id', isAuthenticated, authorizedRoles('admin'), updateSampleStatus);
router.delete('/admin/:id', isAuthenticated, authorizedRoles('admin'), deleteSampleAdmin);

module.exports = router;
