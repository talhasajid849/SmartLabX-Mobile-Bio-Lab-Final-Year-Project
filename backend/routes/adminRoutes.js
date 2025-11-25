const express = require('express');
const router = express.Router();

const {
  getDashboardStats,
  getRecentActivity,
  getAllUsers,
  getUserDetails,
  createUser,
  updateUser,
  deleteUser,
  getAllSamples,
  getActivityLogs,
  promoteToAdmin,
  getAllReportsAdmin,
} = require('../controllers/admin.controller');
const isAuthenticated = require('../middleware/isAuthenticated');
const authorizedRoles = require('../middleware/authorizedRoles');


router.use(isAuthenticated, authorizedRoles('admin'));

// Dashboard
router.get('/dashboard/stats', getDashboardStats);
router.get('/dashboard/activity', getRecentActivity);

// User management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetails);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/promote', promoteToAdmin);

// Other admin routes
router.get('/reports', getAllReportsAdmin);
router.get('/samples', getAllSamples);
router.get('/activity-logs', getActivityLogs);

module.exports = router;
