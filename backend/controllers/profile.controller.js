const cloudinary = require("../config/cloudinary");
const { prisma } = require("../config/prisma");
const bcrypt = require("bcrypt");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/Errorhandler");
const redis = require("../utils/redis");
const LogService = require("../services/logService");
const logger = require("../logs/looger");

// Cache key helpers
const getUserProfileCacheKey = (userId) => `user:profile:${userId}`;

// Get Profile
exports.getProfile = catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.user?.users_id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    const cacheKey = getUserProfileCacheKey(req.user.users_id);

    // Check Redis cache
    const cachedProfile = await redis.get(cacheKey);
    if (cachedProfile) {
      return res.status(200).json({
        success: true,
        user: JSON.parse(cachedProfile),
        cached: true,
      });
    }

    const user = await prisma.users.findUnique({
      where: { users_id: req.user.users_id },
      select: {
        users_id: true,
        first_name: true,
        last_name: true,
        email: true,
        mobile_no: true,
        role: true,
        city: true,
        profile_picture: true,
        created_at: true,
        last_login: true,
        updated_at: true,
      },
    });

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Cache for 15 minutes
    await redis.setex(cacheKey, 900, JSON.stringify(user));

    res.status(200).json({
      success: true,
      user,
      cached: false,
    });
  } catch (error) {
    logger.error("Get profile error:", {
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to fetch profile: " + error.message, 500));
  }
});

// Update Profile
exports.updateProfile = catchAsyncErrors(async (req, res, next) => {
  try {
    const { first_name, last_name, mobile_no, city } = req.body;

    if (!req.user?.users_id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    // Validate input
    if (!first_name?.trim() || !last_name?.trim()) {
      return next(new ErrorHandler("First name and last name are required", 400));
    }

    if (mobile_no && !/^\+?[\d\s-()]+$/.test(mobile_no)) {
      return next(new ErrorHandler("Invalid mobile number format", 400));
    }

    // Update user profile
    const updatedUser = await prisma.users.update({
      where: { users_id: req.user.users_id },
      data: {
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        mobile_no: mobile_no?.trim() || null,
        city: city?.trim() || null,
      },
      select: {
        users_id: true,
        first_name: true,
        last_name: true,
        email: true,
        mobile_no: true,
        role: true,
        city: true,
        profile_picture: true,
        created_at: true,
      },
    });

    // Invalidate cache
    await redis.del(getUserProfileCacheKey(req.user.users_id));
    await redis.del(`user:${req.user.users_id}`); // Also clear main user cache

    // Log action
    await LogService.write(
      req.user.users_id,
      "UPDATED",
      "Profile details updated"
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    logger.error("Update profile error:", {
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to update profile: " + error.message, 500));
  }
});

// Upload Profile Picture
exports.uploadProfilePicture = catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new ErrorHandler("No file uploaded", 400));
    }

    if (!req.user?.users_id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return next(new ErrorHandler("Invalid file type. Only JPEG, PNG, and WebP are allowed", 400));
    }

    // Validate file size (5MB max)
    if (req.file.size > 5 * 1024 * 1024) {
      return next(new ErrorHandler("File size too large. Maximum 5MB allowed", 400));
    }

    // Upload to Cloudinary
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "biolab/profiles",
          public_id: `user_${req.user.users_id}_${Date.now()}`,
          transformation: [
            { width: 500, height: 500, crop: "limit" },
            { quality: "auto" },
            { fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const result = await uploadPromise;

    // Get old profile picture
    const user = await prisma.users.findUnique({
      where: { users_id: req.user.users_id },
      select: { profile_picture: true },
    });

    const oldPic = user?.profile_picture;

    // Delete old image from Cloudinary if exists
    if (oldPic) {
      try {
        const publicId = oldPic.split("/").slice(-2).join("/").split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        logger.warn("Error deleting old image:", {
          error: err.message,
          publicId: oldPic,
        });
      }
    }

    // Update new image URL in database
    await prisma.users.update({
      where: { users_id: req.user.users_id },
      data: { profile_picture: result.secure_url },
    });

    // Invalidate cache
    await redis.del(getUserProfileCacheKey(req.user.users_id));
    await redis.del(`user:${req.user.users_id}`);

    // Log action
    await LogService.write(
      req.user.users_id,
      "UPDATED",
      "Profile picture uploaded"
    );

    res.status(200).json({
      success: true,
      message: "Profile picture uploaded successfully",
      url: result.secure_url,
    });
  } catch (error) {
    logger.error("Upload picture error:", {
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to upload image: " + error.message, 500));
  }
});

// Delete Profile Picture
exports.deleteProfilePicture = catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.user?.users_id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    // Get current profile picture
    const user = await prisma.users.findUnique({
      where: { users_id: req.user.users_id },
      select: { profile_picture: true },
    });

    if (!user?.profile_picture) {
      return next(new ErrorHandler("No profile picture to delete", 400));
    }

    // Delete from Cloudinary
    try {
      const publicId = user.profile_picture.split("/").slice(-2).join("/").split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      logger.warn("Error deleting image from Cloudinary:", {
        error: err.message,
      });
    }

    // Remove from database
    await prisma.users.update({
      where: { users_id: req.user.users_id },
      data: { profile_picture: null },
    });

    // Invalidate cache
    await redis.del(getUserProfileCacheKey(req.user.users_id));
    await redis.del(`user:${req.user.users_id}`);

    // Log action
    await LogService.write(
      req.user.users_id,
      "UPDATED",
      "Profile picture deleted"
    );

    res.status(200).json({
      success: true,
      message: "Profile picture deleted successfully",
    });
  } catch (error) {
    logger.error("Delete picture error:", {
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to delete image: " + error.message, 500));
  }
});

// Change Password
exports.changePassword = catchAsyncErrors(async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!req.user?.users_id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return next(new ErrorHandler("Current password and new password are required", 400));
    }

    if (newPassword.length < 6) {
      return next(new ErrorHandler("New password must be at least 6 characters", 400));
    }

    if (currentPassword === newPassword) {
      return next(new ErrorHandler("New password must be different from current password", 400));
    }

    // Get user with password
    const user = await prisma.users.findUnique({
      where: { users_id: req.user.users_id },
    });

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return next(new ErrorHandler("Current password is incorrect", 400));
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.users.update({
      where: { users_id: req.user.users_id },
      data: { password: hashedPassword },
    });

    // Invalidate cache
    await redis.del(getUserProfileCacheKey(req.user.users_id));
    await redis.del(`user:${req.user.users_id}`);

    // Log action
    await LogService.write(
      req.user.users_id,
      "UPDATED",
      "Password changed successfully"
    );

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    logger.error("Change password error:", {
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to change password: " + error.message, 500));
  }
});

// Get Profile Statistics
exports.getProfileStats = catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.user?.users_id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    const cacheKey = `user:stats:${req.user.users_id}`;

    // Check cache
    const cachedStats = await redis.get(cacheKey);
    if (cachedStats) {
      return res.status(200).json({
        success: true,
        stats: JSON.parse(cachedStats),
        cached: true,
      });
    }

    // Get statistics
    const [
      samplesCount,
      reportsCount,
      reservationsCount,
      pendingReservations,
    ] = await Promise.all([
      prisma.samples.count({
        where: { users_id: req.user.users_id },
      }),
      prisma.reports.count({
        where: { user_id: req.user.users_id },
      }),
      prisma.mobile_lab_requests.count({
        where: { users_id: req.user.users_id },
      }),
      prisma.mobile_lab_requests.count({
        where: {
          users_id: req.user.users_id,
          status: 'pending',
        },
      }),
    ]);

    const stats = {
      totalSamples: samplesCount,
      totalReports: reportsCount,
      totalReservations: reservationsCount,
      pendingReservations,
    };

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(stats));

    res.status(200).json({
      success: true,
      stats,
      cached: false,
    });
  } catch (error) {
    logger.error("Get profile stats error:", {
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to fetch statistics: " + error.message, 500));
  }
});

// Delete Account
exports.deleteAccount = catchAsyncErrors(async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!req.user?.users_id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    if (!password) {
      return next(new ErrorHandler("Password is required to delete account", 400));
    }

    // Get user
    const user = await prisma.users.findUnique({
      where: { users_id: req.user.users_id },
    });

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new ErrorHandler("Incorrect password", 400));
    }

    // Delete profile picture from Cloudinary if exists
    if (user.profile_picture) {
      try {
        const publicId = user.profile_picture.split("/").slice(-2).join("/").split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        logger.warn("Error deleting profile picture:", err);
      }
    }

    // Delete user account and related data using transaction
    await prisma.$transaction([
      // Delete related data first
      prisma.reports.deleteMany({ where: { user_id: req.user.users_id } }),
      prisma.mobile_lab_requests.deleteMany({ where: { users_id: req.user.users_id } }),
      prisma.samples.deleteMany({ where: { users_id: req.user.users_id } }),
      prisma.notifications.deleteMany({ where: { user_id: req.user.users_id } }),
      prisma.system_log_user.deleteMany({ where: { users_id: req.user.users_id } }),
      // Finally delete user
      prisma.users.delete({ where: { users_id: req.user.users_id } }),
    ]);

    // Clear all caches for this user
    const userKeys = await redis.keys(`user:${req.user.users_id}:*`);
    const profileKeys = await redis.keys(`user:profile:${req.user.users_id}*`);
    const allKeys = [...userKeys, ...profileKeys, `user:${req.user.users_id}`, `user:stats:${req.user.users_id}`];
    
    if (allKeys.length > 0) {
      await redis.del(...allKeys);
    }

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    logger.error("Delete account error:", {
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to delete account: " + error.message, 500));
  }
});