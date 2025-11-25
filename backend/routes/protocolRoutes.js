const express = require('express');
const router = express.Router();

const {
  getAllProtocols,
  getProtocolById,
  createProtocol,
  updateProtocol,
  deleteProtocol,
  getCategories
} = require('../controllers/protocol.controller');
const isAuthenticated = require('../middleware/isAuthenticated');
const authorizedRoles = require('../middleware/authorizedRoles');


// ------------------------
// Public routes
// ------------------------
router.get('/', isAuthenticated, getAllProtocols); // now protected
router.get('/categories', isAuthenticated, getCategories);
router.get('/:id', isAuthenticated, getProtocolById);

// ------------------------
// Admin-only routes
// ------------------------
router.post('/', isAuthenticated, authorizedRoles('admin'), createProtocol);
router.put('/:id', isAuthenticated, authorizedRoles('admin'), updateProtocol);
router.delete('/:id', isAuthenticated, authorizedRoles('admin'), deleteProtocol);

module.exports = router;
