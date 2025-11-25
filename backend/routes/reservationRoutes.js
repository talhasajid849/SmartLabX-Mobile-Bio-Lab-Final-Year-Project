const express = require('express');
const router = express.Router();

const {
  createReservation,
  getMyReservations,
  getAllReservations,
  getReservationById,
  updateReservationStatus,
  cancelReservation,
  getAvailableSlots
} = require('../controllers/reservation.controller');
const authorizedRoles = require('../middleware/authorizedRoles');
const isAuthenticated = require('../middleware/isAuthenticated');


// ------------------------
// User routes (authenticated)
// ------------------------
router.post('/', isAuthenticated, createReservation);
router.get('/my', isAuthenticated, getMyReservations);
router.get('/slots', isAuthenticated, getAvailableSlots);
router.put('/:id/cancel', isAuthenticated, cancelReservation);

// ------------------------
// Admin routes
// ------------------------
router.get('/all', isAuthenticated, authorizedRoles('admin'), getAllReservations);
router.get('/:id', isAuthenticated, authorizedRoles('admin'), getReservationById);
router.put('/:id/status', isAuthenticated, authorizedRoles('admin'), updateReservationStatus);

module.exports = router;
