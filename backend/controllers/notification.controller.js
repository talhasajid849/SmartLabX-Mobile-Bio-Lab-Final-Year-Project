const { prisma } = require("../config/prisma");
const logger = require("../logs/looger");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/Errorhandler");
const redis = require("../utils/redis"); // Redis client

// Helper function to get cache key
const getCacheKey = (userId, type = 'list') => `notifications:${userId}:${type}`;

// Get all notifications for user
exports.getMyNotifications = catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.user?.users_id) {
      return next(new ErrorHandler("User ID not found", 401));
    }

    const cacheKey = getCacheKey(req.user.users_id);
    
    // Check Redis cache first
    const cachedNotifications = await redis.get(cacheKey);
    if (cachedNotifications) {
      return res.status(200).json({
        success: true,
        notifications: JSON.parse(cachedNotifications),
        cached: true,
      });
    }

    // Fetch from database using Prisma
    const notifications = await prisma.notifications.findMany({
      where: { user_id: req.user.users_id },
      orderBy: { created_at: 'desc' },
      take: 7,
      select: {
        notifications_id: true,
        user_id: true,
        type: true,
        message: true,
        is_read: true,
        created_at: true,
      }
    });

    // Cache the results in Redis (TTL: 5 minutes = 300 seconds)
    await redis.setex(cacheKey, 300, JSON.stringify(notifications));

    res.status(200).json({
      success: true,
      notifications,
      cached: false,
    });
  } catch (error) {
    logger.error("Get notifications error:", {
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to fetch notifications: " + error.message, 500));
  }
});

// Get unread count
exports.getUnreadCount = catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.user?.users_id) {
      return next(new ErrorHandler("User ID not found", 401));
    }

    const cacheKey = getCacheKey(req.user.users_id, 'unread');
    
    // Check Redis cache
    const cachedCount = await redis.get(cacheKey);
    if (cachedCount !== null) {
      return res.status(200).json({
        success: true,
        unreadCount: parseInt(cachedCount),
        cached: true,
      });
    }

    // Fetch unread count using Prisma
    const unreadCount = await prisma.notifications.count({
      where: {
        user_id: req.user.users_id,
        is_read: false,
      },
    });

    // Cache in Redis for 2 minutes (120 seconds)
    await redis.setex(cacheKey, 120, unreadCount.toString());

    res.status(200).json({
      success: true,
      unreadCount,
      cached: false,
    });
  } catch (error) {
    logger.error("Get unread count error:", {
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to fetch unread count: " + error.message, 500));
  }
});

// Mark notification as read
exports.markAsRead = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.user?.users_id) {
      return next(new ErrorHandler("User ID not found", 401));
    }

    if (!id || isNaN(parseInt(id))) {
      return next(new ErrorHandler("Invalid notification ID", 400));
    }

    // Verify notification exists and belongs to user
    const notification = await prisma.notifications.findFirst({
      where: {
        notifications_id: parseInt(id),
        user_id: req.user.users_id,
      },
    });

    if (!notification) {
      return next(new ErrorHandler("Notification not found", 404));
    }

    // Update notification
    await prisma.notifications.update({
      where: { notifications_id: parseInt(id) },
      data: { is_read: true },
    });

    // Invalidate Redis cache
    await redis.del(getCacheKey(req.user.users_id));
    await redis.del(getCacheKey(req.user.users_id, 'unread'));

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    logger.error("Mark as read error:", {
      userId: req.user?.users_id,
      notificationId: req.params.id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to mark notification as read: " + error.message, 500));
  }
});

// Mark all as read
exports.markAllAsRead = catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.user?.users_id) {
      return next(new ErrorHandler("User ID not found", 401));
    }

    // Update all unread notifications
    const result = await prisma.notifications.updateMany({
      where: {
        user_id: req.user.users_id,
        is_read: false,
      },
      data: { is_read: true },
    });

    // Invalidate Redis cache
    await redis.del(getCacheKey(req.user.users_id));
    await redis.del(getCacheKey(req.user.users_id, 'unread'));

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      updatedCount: result.count,
    });
  } catch (error) {
    logger.error("Mark all as read error:", {
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to mark all as read: " + error.message, 500));
  }
});

// Delete notification
exports.deleteNotification = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.user?.users_id) {
      return next(new ErrorHandler("User ID not found", 401));
    }

    if (!id || isNaN(parseInt(id))) {
      return next(new ErrorHandler("Invalid notification ID", 400));
    }

    // Verify notification exists and belongs to user
    const notification = await prisma.notifications.findFirst({
      where: {
        notifications_id: parseInt(id),
        user_id: req.user.users_id,
      },
    });

    if (!notification) {
      return next(new ErrorHandler("Notification not found", 404));
    }

    // Delete notification
    await prisma.notifications.delete({
      where: { notifications_id: parseInt(id) },
    });

    // Invalidate Redis cache
    await redis.del(getCacheKey(req.user.users_id));
    await redis.del(getCacheKey(req.user.users_id, 'unread'));

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    logger.error("Delete notification error:", {
      userId: req.user?.users_id,
      notificationId: req.params.id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to delete notification: " + error.message, 500));
  }
});

// Clear all notifications (optional feature)
exports.clearAllNotifications = catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.user?.users_id) {
      return next(new ErrorHandler("User ID not found", 401));
    }

    const result = await prisma.notifications.deleteMany({
      where: { user_id: req.user.users_id },
    });

    // Invalidate Redis cache
    await redis.del(getCacheKey(req.user.users_id));
    await redis.del(getCacheKey(req.user.users_id, 'unread'));

    res.status(200).json({
      success: true,
      message: "All notifications cleared",
      deletedCount: result.count,
    });
  } catch (error) {
    logger.error("Clear all notifications error:", {
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to clear notifications: " + error.message, 500));
  }
});