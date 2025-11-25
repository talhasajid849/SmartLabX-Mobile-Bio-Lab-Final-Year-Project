const express = require('express');
const router = express.Router();
const { upload } = require('../utils/multer');
const { 
  getProfile, 
  updateProfile, 
  uploadProfilePicture, 
  changePassword 
} = require('../controllers/profile.controller');
const isAuthenticated = require('../middleware/isAuthenticated');


// Protect all profile routes
router.use(isAuthenticated);

// Get user profile
router.get('/profile', getProfile);

// Update user profile
router.put('/profile', updateProfile);

// Upload/update profile picture
router.post('/profile-picture', upload.single('profilePicture'), uploadProfilePicture);

// Change password
router.put('/change-password', changePassword);

module.exports = router;
