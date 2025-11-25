const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  getUser,
  forgotPassword,
  resetPassword,
  userLogout,
  userActivity,
} = require("../controllers/user.controller");

const { upload } = require("../utils/multer");
const isAuthenticated = require("../middleware/isAuthenticated");


// ------------------------
// Public routes
// ------------------------
router.post("/register", upload.single("profile_picture"), signup);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// ------------------------
// Protected routes
// ------------------------
router.get("/getuser", isAuthenticated, getUser);
router.get("/get-user-activities", isAuthenticated, userActivity);
router.get("/logout", isAuthenticated, userLogout);



module.exports = router;
