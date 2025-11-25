const express = require('express');
const router = express.Router();

const {
  generateReport,
  getMyReports,
  getReportById,
  exportReport,
  deleteReport,
  shareReportViaEmail,
  sharedReportAccess,
  exportSharedReport,
  getAllReports,
  getReportByIdAdmin,
  exportReportAdmin,
  deleteReportAdmin,
  shareReportViaEmailAdmin
} = require('../controllers/report.controller');
const authorizedRoles = require('../middleware/authorizedRoles');
const isAuthenticated = require('../middleware/isAuthenticated');


// ------------------------
// Admin routes
// ------------------------
router.get('/admin/all', isAuthenticated, authorizedRoles('admin'), getAllReports);
router.get('/admin/reports/:id', isAuthenticated, authorizedRoles('admin'), getReportByIdAdmin);
router.get('/admin/:id/export', isAuthenticated, authorizedRoles('admin'), exportReportAdmin);
router.delete('/admin/:id', isAuthenticated, authorizedRoles('admin'), deleteReportAdmin);
router.post('/admin/reports/:reportId/share', isAuthenticated, authorizedRoles('admin'), shareReportViaEmailAdmin);

// ------------------------
// Protected routes (authenticated users)
// ------------------------
router.post('/generate/:sampleId', isAuthenticated, generateReport);
router.get('/', isAuthenticated, getMyReports);
router.get('/:id', isAuthenticated, getReportById);
router.get('/:id/export', isAuthenticated, exportReport);
router.delete('/:id', isAuthenticated, deleteReport);
router.post('/:reportId/share', isAuthenticated, shareReportViaEmail);

// ------------------------
// Public routes (no auth)
// ------------------------
router.get('/shared/:token', sharedReportAccess);
router.get('/shared/:token/export', exportSharedReport);

module.exports = router;
