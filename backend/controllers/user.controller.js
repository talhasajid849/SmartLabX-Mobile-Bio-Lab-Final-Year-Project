const ErrorHandler = require("../utils/Errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { prisma } = require("../config/prisma");
const uploadToCloudinary = require("../utils/cloudinaryUpload");
const sendToken = require("../utils/sendToken");
const sendMail = require("../utils/sendEmail");
const logger = require("../logs/looger");
const redis = require("../utils/redis");

// Helper function for cache keys
const getUserCacheKey = (userId) => `user:${userId}`;

// Signup User
exports.signup = catchAsyncErrors(async (req, res, next) => {
  try {
    const { first_name, last_name, email, password, role, mobile_no, city } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email || !password || !mobile_no || !city) {
      return next(new ErrorHandler("All fields are required", 400));
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(new ErrorHandler("Invalid email format", 400));
    }

    // Validate password strength
    if (password.length < 6) {
      return next(new ErrorHandler("Password must be at least 6 characters", 400));
    }

    // Check if email already exists
    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) {
      return next(new ErrorHandler("Email already registered", 409));
    }

    let profilePictureUrl = null;
    if (req.file) {
      try {
        const cloudResult = await uploadToCloudinary(req.file.buffer, "avatars");
        profilePictureUrl = cloudResult.secure_url;
      } catch (err) {
        logger.error("Cloudinary upload error:", {
          error: err.message,
          stack: err.stack,
        });
        return next(new ErrorHandler("Failed to upload profile picture: " + err.message, 502));
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        first_name,
        last_name,
        email,
        password: hashedPassword,
        role: role || "student",
        mobile_no,
        city,
        profile_picture: profilePictureUrl,
      },
    });

    // Cache user in Redis (TTL: 1 hour = 3600 seconds)
    const userCache = { ...user, password: undefined }; // Remove password from cache
    await redis.setex(getUserCacheKey(user.users_id), 3600, JSON.stringify(userCache));

    res.status(201).json({ 
      success: true, 
      message: "Registration successful",
      userId: user.users_id 
    });
  } catch (error) {
    logger.error("Signup error:", {
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Registration failed: " + error.message, 400));
  }
});

// Login User
exports.login = catchAsyncErrors(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ErrorHandler("Email and password required", 400));
    }

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return next(new ErrorHandler("Invalid email or password", 401));
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return next(new ErrorHandler("Invalid email or password", 401));
    }

    const userData = { 
      users_id: user.users_id, 
      email: user.email, 
      role: user.role,
      name: `${user.first_name} ${user.last_name}`
    };

    sendToken(userData, 200, res);

    // Update last login time
    await prisma.users.update({ 
      where: { email }, 
      data: { last_login: new Date() } 
    });

    // Update cache with last login
    const userCache = { ...user, password: undefined, last_login: new Date() };
    await redis.setex(getUserCacheKey(user.users_id), 3600, JSON.stringify(userCache));

    logger.info("User logged in successfully:", { userId: user.users_id, email });
  } catch (error) {
    logger.error("Login error:", {
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Login failed: " + error.message, 500));
  }
});

// Get User
exports.getUser = catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.user?.users_id) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    // Check Redis cache first
    const cachedUser = await redis.get(getUserCacheKey(req.user.users_id));
    if (cachedUser) {
      return res.status(200).json({ 
        success: true, 
        user: JSON.parse(cachedUser),
        cached: true 
      });
    }

    // Fetch from database using Prisma
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
      }
    });

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Cache the user (TTL: 1 hour)
    await redis.setex(getUserCacheKey(user.users_id), 3600, JSON.stringify(user));

    res.status(200).json({ 
      success: true, 
      user,
      cached: false 
    });
  } catch (error) {
    logger.error("GetUser error:", {
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to fetch user: " + error.message, 500));
  }
});

// Forgot Password
exports.forgotPassword = catchAsyncErrors(async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new ErrorHandler("Email is required", 400));
    }

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return next(new ErrorHandler("No account found with this email", 404));
    }

    const resetToken = jwt.sign({ email }, process.env.JWT_TOKEN, { expiresIn: "1h" });
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    // Store reset token in database
    await prisma.passwordResets.create({ 
      data: { 
        email, 
        token: resetToken, 
        expires_at: expiresAt 
      } 
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${email}`;

    // Send email
    await sendMail({ 
      email, 
      subject: "Password Reset Request - Mobile Bio Lab", 
      template: "forgot-password.ejs", 
      data: { 
        resetUrl,
        userName: `${user.first_name} ${user.last_name}`,
        expiresIn: "1 hour"
      } 
    });

    res.json({ 
      success: true, 
      message: "Password reset email sent. Please check your inbox." 
    });
  } catch (error) {
    logger.error("Forgot password error:", {
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to process password reset: " + error.message, 500));
  }
});

// Reset Password
exports.resetPassword = catchAsyncErrors(async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return next(new ErrorHandler("Token and new password are required", 400));
    }

    if (newPassword.length < 6) {
      return next(new ErrorHandler("Password must be at least 6 characters", 400));
    }

    let decoded;
    try { 
      decoded = jwt.verify(token, process.env.JWT_TOKEN); 
    } catch (err) { 
      return next(new ErrorHandler("Invalid or expired reset token", 400)); 
    }

    // Verify token exists and hasn't expired
    const resetEntry = await prisma.passwordResets.findFirst({
      where: { 
        token, 
        email: decoded.email, 
        expires_at: { gt: new Date() } 
      },
    });

    if (!resetEntry) {
      return next(new ErrorHandler("Invalid or expired reset token", 400));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and delete reset token
    await prisma.$transaction([
      prisma.users.update({ 
        where: { email: decoded.email }, 
        data: { password: hashedPassword } 
      }),
      prisma.passwordResets.deleteMany({ where: { token } })
    ]);

    // Get user ID to invalidate cache
    const user = await prisma.users.findUnique({ 
      where: { email: decoded.email },
      select: { users_id: true }
    });

    if (user) {
      // Invalidate Redis cache
      await redis.del(getUserCacheKey(user.users_id));
    }

    res.status(200).json({ 
      success: true, 
      message: "Password reset successful! You can now login with your new password." 
    });
  } catch (error) {
    logger.error("Reset password error:", {
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to reset password: " + error.message, 500));
  }
});

// User Logout
exports.userLogout = catchAsyncErrors(async (req, res, next) => {
  try {
    const isProd = process.env.NODE_ENV === "production";

    // If user is authenticated, invalidate their cache
    if (req.user?.users_id) {
      await redis.del(getUserCacheKey(req.user.users_id));
    }

    res.cookie("token", null, { 
      expires: new Date(0), 
      httpOnly: true, 
      sameSite: isProd ? "none" : "lax", 
      secure: isProd 
    });

    res.status(200).json({ 
      success: true, 
      message: "Logged out successfully" 
    });
  } catch (error) {
    logger.error("Logout error:", {
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Logout failed: " + error.message, 500));
  }
});

// Get User Activity
exports.userActivity = catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.user?.users_id) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const cacheKey = `user:activity:${req.user.users_id}:page:${page}:limit:${limit}`;

    // Check Redis cache
    const cachedActivity = await redis.get(cacheKey);
    if (cachedActivity) {
      return res.status(200).json({ 
        success: true, 
        ...JSON.parse(cachedActivity),
        cached: true 
      });
    }

    // Fetch from database
    const [logs, totalCount] = await Promise.all([
      prisma.systemLog.findMany({
        where: { users_id: req.user.users_id },
        orderBy: { timestamp: "desc" },
        skip: offset,
        take: limit,
        select: {
          log_id: true,
          action: true,
          details: true,  // corrected field name
          timestamp: true,
        }
      }),
      prisma.systemLog.count({
        where: { users_id: req.user.users_id }
      })
    ]);

    const response = {
      success: true,
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit),
      logs,
    };

    // Cache for 5 minutes (300 seconds)
    await redis.setex(cacheKey, 300, JSON.stringify(response));

    res.status(200).json({ ...response, cached: false });
  } catch (error) {
    logger.error("User activity error:", {
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to fetch activity: " + error.message, 500));
  }
});


// Clear user cache (admin or user themselves)
exports.clearUserCache = catchAsyncErrors(async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Only allow admins or the user themselves to clear cache
    if (req.user.role !== 'admin' && req.user.users_id !== parseInt(userId)) {
      return next(new ErrorHandler("Unauthorized to clear cache", 403));
    }

    await redis.del(getUserCacheKey(userId));

    res.status(200).json({
      success: true,
      message: "User cache cleared successfully"
    });
  } catch (error) {
    logger.error("Clear cache error:", {
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to clear cache: " + error.message, 500));
  }
});