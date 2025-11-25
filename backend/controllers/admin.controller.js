const { prisma } = require("../config/prisma");
const logger = require("../logs/looger");
const bcrypt = require("bcryptjs");
const sendToken = require("../utils/sendToken");
const ErrorHandler = require("../utils/Errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const redis = require("../utils/redis");
const LogService = require("../services/logService");

// Cache key helpers
const getAdminCacheKey = (userId) => `admin:user:${userId}`;
const getDashboardStatsCacheKey = () => "admin:dashboard:stats";
const getAllUsersCacheKey = (role, search, page, limit) =>
  `admin:users:role:${role || "all"}:search:${
    search || "none"
  }:page:${page}:limit:${limit}`;

// ===============================
// DASHBOARD STATS
// ===============================
exports.getDashboardStats = catchAsyncErrors(async (req, res, next) => {
  try {
    const cacheKey = getDashboardStatsCacheKey();

    // Check cache
    const cachedStats = await redis.get(cacheKey);
    if (cachedStats) {
      return res.status(200).json({
        success: true,
        stats: JSON.parse(cachedStats),
        cached: true,
      });
    }

    // Fetch all statistics in parallel
    const [
      totalUsers,
      activeUsers,
      usersByRole,
      totalSamples,
      newSamplesThisWeek,
      samplesByType,
      totalRequests,
      pendingRequests,
      reservationsByStatus,
      todayReservations,
      totalProtocols,
      protocolCategories,
      newUsersThisWeek,
      totalReports,
    ] = await Promise.all([
      // Total users
      prisma.users.count(),

      // Active users (last 30 days)
      prisma.users.count({
        where: {
          last_login: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Users by role
      prisma.users.groupBy({
        by: ["role"],
        _count: { role: true },
      }),

      // Total samples
      prisma.samples.count(),

      // New samples this week
      prisma.samples.count({
        where: {
          collection_datetime: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Samples by type
      prisma.samples.groupBy({
        by: ["sample_type"],
        _count: { sample_type: true },
      }),

      // Total requests
      prisma.mobileLabRequests.count(),

      // Pending requests
      prisma.mobileLabRequests.count({
        where: { status: "pending" },
      }),

      // Reservations by status
      prisma.mobileLabRequests.groupBy({
        by: ["status"],
        _count: { status: true },
      }),

      // Today's reservations
      prisma.mobileLabRequests.count({
        where: {
          request_date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),

      // Total protocols
      prisma.protocols.count(),

      // Protocol categories
      prisma.protocols.findMany({
        where: { category: { not: null } },
        select: { category: true },
        distinct: ["category"],
      }),

      // New users this week
      prisma.users.count({
        where: {
          created_at: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Total reports
      prisma.reports.count(),
    ]);

    // Format data
    const usersByRoleObj = {};
    usersByRole.forEach((item) => {
      usersByRoleObj[item.role] = item._count.role;
    });

    const samplesByTypeObj = {};
    samplesByType.forEach((item) => {
      samplesByTypeObj[item.sample_type] = item._count.sample_type;
    });

    const reservationsByStatusObj = {};
    reservationsByStatus.forEach((item) => {
      reservationsByStatusObj[item.status] = item._count.status;
    });

    const stats = {
      totalUsers,
      activeUsers,
      usersByRole: usersByRoleObj,
      totalSamples,
      newSamplesThisWeek,
      samplesByType: samplesByTypeObj,
      totalRequests,
      pendingRequests,
      reservationsByStatus: reservationsByStatusObj,
      todayReservations,
      totalProtocols,
      protocolCategories: protocolCategories.length,
      newUsersThisWeek,
      totalReports,
      systemUptime: "99.9%",
    };

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(stats));

    res.status(200).json({
      success: true,
      stats,
      cached: false,
    });
  } catch (error) {
    logger.error("Dashboard stats error:", {
      error: error.message,
      stack: error.stack,
    });
    return next(
      new ErrorHandler("Failed to fetch dashboard stats: " + error.message, 500)
    );
  }
});

// ===============================
// RECENT ACTIVITY
// ===============================
exports.getRecentActivity = catchAsyncErrors(async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const cacheKey = `admin:recent_activity:${limit}`;

    // Check cache
    const cachedActivity = await redis.get(cacheKey);
    if (cachedActivity) {
      return res.status(200).json({
        success: true,
        activities: JSON.parse(cachedActivity),
        cached: true,
      });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Fetch activities from different sources
    const [users, samples, reservations, protocols, reports] =
      await Promise.all([
        prisma.users.findMany({
          where: { created_at: { gte: sevenDaysAgo } },
          select: {
            first_name: true,
            last_name: true,
            created_at: true,
          },
          take: limit,
        }),
        prisma.samples.findMany({
          where: { collection_datetime: { gte: sevenDaysAgo } },
          select: {
            sample_identifier: true,
            collection_datetime: true,
            user: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
          },
          take: limit,
        }),
        prisma.mobileLabRequests.findMany({
          where: { created_at: { gte: sevenDaysAgo } },
          select: {
            created_at: true,
            user: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
          },
          take: limit,
        }),
        prisma.protocols.findMany({
          where: { created_at: { gte: sevenDaysAgo } },
          select: {
            title: true,
            created_at: true,
            admin: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
          },
          take: limit,
        }),
        prisma.reports.findMany({
          where: { generated_on: { gte: sevenDaysAgo } },
          select: {
            title: true,
            generated_on: true,
            user: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
          },
          take: limit,
        }),
      ]);

    // Combine and format activities
    const activities = [
      ...users.map((u) => ({
        activity_type: "user_registered",
        user: `${u.first_name} ${u.last_name}`,
        description: "New user registered",
        timestamp: u.created_at,
      })),
      ...samples.map((s) => ({
        activity_type: "sample_created",
        user: `${s.users.first_name} ${s.users.last_name}`,
        description: `Created sample: ${s.sample_identifier}`,
        timestamp: s.collection_datetime,
      })),
      ...reservations.map((r) => ({
        activity_type: "reservation_created",
        user: `${r.users.first_name} ${r.users.last_name}`,
        description: "Lab reservation requested",
        timestamp: r.created_at,
      })),
      ...protocols.map((p) => ({
        activity_type: "protocol_created",
        user: p.users ? `${p.users.first_name} ${p.users.last_name}` : "Admin",
        description: `New protocol: ${p.title}`,
        timestamp: p.created_at,
      })),
      ...reports.map((r) => ({
        activity_type: "report_generated",
        user: `${r.users.first_name} ${r.users.last_name}`,
        description: `Generated report: ${r.title}`,
        timestamp: r.generated_on,
      })),
    ];

    // Sort by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivities = activities.slice(0, limit);

    // Cache for 3 minutes
    await redis.setex(cacheKey, 180, JSON.stringify(limitedActivities));

    res.status(200).json({
      success: true,
      count: limitedActivities.length,
      activities: limitedActivities,
      cached: false,
    });
  } catch (error) {
    logger.error("Recent activity error:", {
      error: error.message,
      stack: error.stack,
    });
    return next(
      new ErrorHandler("Failed to fetch recent activity: " + error.message, 500)
    );
  }
});

// ===============================
// USER MANAGEMENT
// ===============================

// Get all users with filters and pagination
exports.getAllUsers = catchAsyncErrors(async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const cacheKey = getAllUsersCacheKey(role, search, page, limit);

    // Check cache
    const cachedUsers = await redis.get(cacheKey);
    if (cachedUsers) {
      return res.json({
        success: true,
        ...JSON.parse(cachedUsers),
        cached: true,
      });
    }

    // Build where clause
    const where = {
      ...(role && { role }),
      ...(search && {
        OR: [
          { first_name: { contains: search, mode: "insensitive" } },
          { last_name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    // Fetch users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.users.findMany({
        where,
        select: {
          users_id: true,
          first_name: true,
          last_name: true,
          email: true,
          mobile_no: true,
          role: true,
          city: true,
          created_at: true,
          last_login: true,
        },
        orderBy: { created_at: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.users.count({ where }),
    ]);

    const response = {
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
      },
    };

    // Cache for 3 minutes
    await redis.setex(cacheKey, 180, JSON.stringify(response));

    res.json({ ...response, cached: false });
  } catch (error) {
    logger.error("Get all users error:", {
      error: error.message,
      stack: error.stack,
    });
    return next(
      new ErrorHandler("Failed to fetch users: " + error.message, 500)
    );
  }
});

// Get user details with stats
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return next(new ErrorHandler("Invalid user ID", 400));
    }

    const user = await prisma.users.findUnique({
      where: { users_id: parseInt(id) },
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
      },
    });

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Get user statistics
    const [samplesCount, requestsCount, reportsCount] = await Promise.all([
      prisma.samples.count({ where: { users_id: parseInt(id) } }),
      prisma.mobileLabRequests.count({ where: { users_id: parseInt(id) } }),
      prisma.reports.count({ where: { user_id: parseInt(id) } }),
    ]);

    res.json({
      success: true,
      user,
      stats: {
        samples: samplesCount,
        mobileLabRequests: requestsCount,
        reports: reportsCount,
      },
    });
  } catch (error) {
    logger.error("Get user details error:", {
      userId: req.params.id,
      error: error.message,
      stack: error.stack,
    });
    return next(
      new ErrorHandler("Failed to fetch user details: " + error.message, 500)
    );
  }
});

// Create new user (Admin)
exports.createUser = catchAsyncErrors(async (req, res, next) => {
  try {
    const { first_name, last_name, email, mobile_no, password, role, city } =
      req.body;

    // Validation
    if (!first_name || !last_name || !email || !password) {
      return next(new ErrorHandler("Required fields missing", 400));
    }

    // Check if user exists
    const existing = await prisma.users.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return next(new ErrorHandler("User already exists", 409));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: email.toLowerCase().trim(),
        mobile_no: mobile_no?.trim() || null,
        password: hashedPassword,
        role: role || "student",
        city: city?.trim() || null,
      },
    });

    // Clear users cache
    const userKeys = await redis.keys("admin:users:*");
    if (userKeys.length > 0) {
      await redis.del(...userKeys);
    }
    await redis.del(getDashboardStatsCacheKey());

    // Log action
    await LogService.write(
      req.user?.users_id,
      "CREATE_USER",
      `Created user: ${email}`
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user_id: user.users_id,
    });
  } catch (error) {
    logger.error("Create user error:", {
      error: error.message,
      stack: error.stack,
    });
    return next(
      new ErrorHandler("Failed to create user: " + error.message, 500)
    );
  }
});

// Update user (Admin)
exports.updateUser = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, mobile, role, city } = req.body;

    if (!id || isNaN(parseInt(id))) {
      return next(new ErrorHandler("Invalid user ID", 400));
    }

    const user = await prisma.users.findUnique({
      where: { users_id: parseInt(id) },
    });

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    await prisma.users.update({
      where: { users_id: parseInt(id) },
      data: {
        first_name: firstName?.trim() || user.first_name,
        last_name: lastName?.trim() || user.last_name,
        mobile_no: mobile?.trim() || user.mobile_no,
        role: role || user.role,
        city: city?.trim() || user.city,
      },
    });

    // Clear caches
    const userKeys = await redis.keys("admin:users:*");
    await redis.del(`user:${id}`, `user:profile:${id}`, getAdminCacheKey(id));
    if (userKeys.length > 0) {
      await redis.del(...userKeys);
    }
    await redis.del(getDashboardStatsCacheKey());

    // Log action
    await LogService.write(
      req.user?.users_id,
      "UPDATE_USER",
      `Updated user ID: ${id}`
    );

    res.status(200).json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    logger.error("Update user error:", {
      userId: req.params.id,
      error: error.message,
      stack: error.stack,
    });
    return next(
      new ErrorHandler("Failed to update user: " + error.message, 500)
    );
  }
});

// Delete user (Admin)
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return next(new ErrorHandler("Invalid user ID", 400));
    }

    const user = await prisma.users.findUnique({
      where: { users_id: parseInt(id) },
    });

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Don't allow deleting the last admin
    if (user.role === "admin") {
      const adminCount = await prisma.users.count({
        where: { role: "admin" },
      });

      if (adminCount <= 1) {
        return next(new ErrorHandler("Cannot delete the last admin user", 400));
      }
    }

    await prisma.users.delete({
      where: { users_id: parseInt(id) },
    });

    // Clear caches
    const userKeys = await redis.keys("admin:users:*");
    const specificKeys = await redis.keys(`user:${id}*`);
    const allKeys = [...userKeys, ...specificKeys, getAdminCacheKey(id)];
    if (allKeys.length > 0) {
      await redis.del(...allKeys);
    }
    await redis.del(getDashboardStatsCacheKey());

    // Log action
    await LogService.write(
      req.user?.users_id,
      "DELETE_USER",
      `Deleted user: ${user.email}`
    );

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    logger.error("Delete user error:", {
      userId: req.params.id,
      error: error.message,
      stack: error.stack,
    });
    return next(
      new ErrorHandler("Failed to delete user: " + error.message, 500)
    );
  }
});

// Promote user to admin
exports.promoteToAdmin = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return next(new ErrorHandler("Invalid user ID", 400));
    }

    const user = await prisma.users.findUnique({
      where: { users_id: parseInt(id) },
    });

    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    if (user.role === "admin") {
      return next(new ErrorHandler("User is already an admin", 400));
    }

    // Update user role to admin
    await prisma.users.update({
      where: { users_id: parseInt(id) },
      data: { role: "admin" },
    });

    // Clear caches
    await redis.del(`user:${id}`, `user:profile:${id}`, getAdminCacheKey(id));
    await redis.del(getDashboardStatsCacheKey());
    const userKeys = await redis.keys("admin:users:*");
    if (userKeys.length > 0) {
      await redis.del(...userKeys);
    }

    // Log action
    await LogService.write(
      req.user?.users_id,
      "PROMOTE_USER",
      `Promoted user ID ${id} (${user.email}) to admin`
    );

    // 🔔 Send notification to promoted user
    await NotificationService.add(
      user.users_id,
      "Congratulations! 🎉",
      "Your account has been promoted to Admin.",
      "success"
    );
    res.status(200).json({
      success: true,
      message: "User promoted to admin successfully",
    });
  } catch (error) {
    logger.error("Promote user error:", {
      userId: req.params.id,
      error: error.message,
      stack: error.stack,
    });
    return next(
      new ErrorHandler("Failed to promote user: " + error.message, 500)
    );
  }
});


// ===============================
// SYSTEM LOGS
// ===============================
exports.getActivityLogs = catchAsyncErrors(async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const searchTerm = req.query.search?.trim() || "";
    const actionFilter = req.query.action || "all";

    const cacheKey = `admin:logs:page:${page}:limit:${limit}:search:${searchTerm}:action:${actionFilter}`;

    // Check Redis cache
    const cachedLogs = await redis.get(cacheKey);
    if (cachedLogs) {
      return res.status(200).json({
        success: true,
        ...JSON.parse(cachedLogs),
        cached: true,
      });
    }

    // =====================
    // Build where clause
    // =====================
    const where = {};

    // Action filter
    if (actionFilter && actionFilter !== "all") {
      where.action = actionFilter;
    }

    // Search filter
    if (searchTerm) {
      where.OR = [
        { action: { contains: searchTerm, mode: "insensitive" } },
        { details: { contains: searchTerm, mode: "insensitive" } },
        { user: { first_name: { contains: searchTerm, mode: "insensitive" } } },
        { user: { last_name: { contains: searchTerm, mode: "insensitive" } } },
        { user: { email: { contains: searchTerm, mode: "insensitive" } } },
      ];
    }

    // Fetch logs and total count
    const [logs, totalCount] = await Promise.all([
      prisma.systemLog.findMany({
        where,
        include: {
          user: {
            select: {
              first_name: true,
              last_name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: { timestamp: "desc" },
        skip,
        take: limit,
      }),
      prisma.systemLog.count({ where }),
    ]);

    const response = {
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    // Cache for 2 minutes
    await redis.setex(cacheKey, 120, JSON.stringify(response));

    res.status(200).json({ ...response, cached: false });
  } catch (error) {
    logger.error("Get activity logs error:", {
      error: error.message,
      stack: error.stack,
    });
    return next(
      new ErrorHandler("Failed to fetch activity logs: " + error.message, 500)
    );
  }
});

// ===============================
// SAMPLES MANAGEMENT (ADMIN VIEW)
// ===============================
exports.getAllSamples = catchAsyncErrors(async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      user_id = "",
      sort_by = "collection_datetime",
      order = "desc",
      sample_type = "",
      status = "",
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const cacheKey = `admin:samples:page:${page}:limit:${limit}:search:${search}:user:${user_id}:type:${sample_type}:status:${status}`;

    // Check cache
    const cachedSamples = await redis.get(cacheKey);
    if (cachedSamples) {
      return res.status(200).json({
        success: true,
        ...JSON.parse(cachedSamples),
        cached: true,
      });
    }

    // Build where clause
    const where = {
      ...(user_id && { users_id: parseInt(user_id) }),
      ...(sample_type && sample_type !== "all" && { sample_type }),
      ...(status && status !== "all" && { status }),
      ...(search && {
        OR: [
          { sample_identifier: { contains: search, mode: "insensitive" } },
          { sample_type: { contains: search, mode: "insensitive" } },
          {
            user: {
              OR: [
                { first_name: { contains: search, mode: "insensitive" } },
                { last_name: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        ],
      }),
    };

    // Validate sort_by field
    const validSortFields = [
      "collection_datetime",
      "created_at",
      "sample_identifier",
      "status",
    ];
    const sortField = validSortFields.includes(sort_by)
      ? sort_by
      : "collection_datetime";
    const sortOrder = order.toLowerCase() === "asc" ? "asc" : "desc";

    // Fetch samples with pagination
    const [samples, totalCount] = await Promise.all([
      prisma.samples.findMany({
        where,
        include: {
          user: {
            select: {
              users_id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
        orderBy: { [sortField]: sortOrder },
        skip,
        take: parseInt(limit),
      }),
      prisma.samples.count({ where }),
    ]);

    const response = {
      success: true,
      samples,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
      },
    };

    // Cache for 3 minutes
    await redis.setex(cacheKey, 180, JSON.stringify(response));

    res.status(200).json({ ...response, cached: false });
  } catch (error) {
    logger.error("Get all samples (admin) error:", {
      error: error.message,
      stack: error.stack,
    });
    return next(
      new ErrorHandler("Failed to fetch samples: " + error.message, 500)
    );
  }
});

// ===============================
// REPORTS MANAGEMENT (ADMIN VIEW)
// ===============================
exports.getAllReportsAdmin = catchAsyncErrors(async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = "", status = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const cacheKey = `admin:reports:page:${page}:limit:${limit}:search:${search}:status:${status}`;

    // Check cache
    const cachedReports = await redis.get(cacheKey);
    if (cachedReports) {
      return res.status(200).json({
        success: true,
        ...JSON.parse(cachedReports),
        cached: true,
      });
    }

    // Build where clause
    const where = {
      ...(status && status !== "all" && { status }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          {
            user: {
              OR: [
                { first_name: { contains: search, mode: "insensitive" } },
                { last_name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
          },
          {
            sample: {
              sample_identifier: { contains: search, mode: "insensitive" },
            },
          },
        ],
      }),
    };

    const [reports, totalCount] = await Promise.all([
      prisma.reports.findMany({
        where,
        include: {
          user: {
            select: {
              users_id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          sample: {
            select: {
              samples_id: true,
              sample_identifier: true,
              sample_type: true,
              collection_datetime: true,
            },
          },
        },
        orderBy: { generated_on: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.reports.count({ where }),
    ]);

    const response = {
      success: true,
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
      },
    };

    // Cache for 3 minutes
    await redis.setex(cacheKey, 180, JSON.stringify(response));

    res.status(200).json({ ...response, cached: false });
  } catch (error) {
    logger.error("Get all reports (admin) error:", {
      error: error.message,
      stack: error.stack,
    });
    return next(
      new ErrorHandler("Failed to fetch reports: " + error.message, 500)
    );
  }
});

// ===============================
// GET ALL ADMINS
// ===============================
exports.getAllAdmins = catchAsyncErrors(async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const cacheKey = `admin:admins_list:page:${page}:limit:${limit}`;

    // Check cache
    const cachedAdmins = await redis.get(cacheKey);
    if (cachedAdmins) {
      return res.status(200).json({
        success: true,
        ...JSON.parse(cachedAdmins),
        cached: true,
      });
    }

    const [admins, totalCount] = await Promise.all([
      prisma.users.findMany({
        where: { role: "admin" },
        select: {
          users_id: true,
          first_name: true,
          last_name: true,
          email: true,
          mobile_no: true,
          profile_picture: true,
          created_at: true,
          last_login: true,
        },
        orderBy: { created_at: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.users.count({ where: { role: "admin" } }),
    ]);

    const response = {
      success: true,
      admins,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
      },
    };

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(response));

    res.status(200).json({ ...response, cached: false });
  } catch (error) {
    logger.error("Get all admins error:", {
      error: error.message,
      stack: error.stack,
    });
    return next(
      new ErrorHandler("Failed to fetch admins: " + error.message, 500)
    );
  }
});

// ===============================
// BULK OPERATIONS
// ===============================

// Bulk delete users
exports.bulkDeleteUsers = catchAsyncErrors(async (req, res, next) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return next(new ErrorHandler("User IDs array is required", 400));
    }

    // Check if any of the users are admins
    const adminUsers = await prisma.users.findMany({
      where: {
        users_id: { in: userIds.map((id) => parseInt(id)) },
        role: "admin",
      },
    });

    if (adminUsers.length > 0) {
      const totalAdmins = await prisma.users.count({
        where: { role: "admin" },
      });

      // Don't allow deleting all admins
      if (adminUsers.length >= totalAdmins) {
        return next(new ErrorHandler("Cannot delete all admin users", 400));
      }
    }

    // Delete users
    const result = await prisma.users.deleteMany({
      where: {
        users_id: { in: userIds.map((id) => parseInt(id)) },
      },
    });

    // Clear caches
    const userKeys = await redis.keys("admin:users:*");
    for (const id of userIds) {
      await redis.del(`user:${id}`, `user:profile:${id}`, getAdminCacheKey(id));
    }
    if (userKeys.length > 0) {
      await redis.del(...userKeys);
    }
    await redis.del(getDashboardStatsCacheKey());

    // Log action
    await LogService.write(
      req.user?.users_id,
      "BULK_DELETE_USERS",
      `Bulk deleted ${result.count} users`
    );

    res.status(200).json({
      success: true,
      message: `Successfully deleted ${result.count} users`,
      deletedCount: result.count,
    });
  } catch (error) {
    logger.error("Bulk delete users error:", {
      error: error.message,
      stack: error.stack,
    });
    return next(
      new ErrorHandler("Failed to delete users: " + error.message, 500)
    );
  }
});

// Bulk update user roles
exports.bulkUpdateUserRoles = catchAsyncErrors(async (req, res, next) => {
  try {
    const { userIds, newRole } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return next(new ErrorHandler("User IDs array is required", 400));
    }

    if (!newRole) {
      return next(new ErrorHandler("New role is required", 400));
    }

    const validRoles = ["admin", "student", "researcher", "teacher"];
    if (!validRoles.includes(newRole)) {
      return next(
        new ErrorHandler(
          `Invalid role. Must be one of: ${validRoles.join(", ")}`,
          400
        )
      );
    }

    // If changing to non-admin role, check we're not removing all admins
    if (newRole !== "admin") {
      const affectedAdmins = await prisma.users.count({
        where: {
          users_id: { in: userIds.map((id) => parseInt(id)) },
          role: "admin",
        },
      });

      if (affectedAdmins > 0) {
        const totalAdmins = await prisma.users.count({
          where: { role: "admin" },
        });

        if (affectedAdmins >= totalAdmins) {
          return next(new ErrorHandler("Cannot demote all admin users", 400));
        }
      }
    }

    // Update roles
    const result = await prisma.users.updateMany({
      where: {
        users_id: { in: userIds.map((id) => parseInt(id)) },
      },
      data: { role: newRole },
    });

    // Clear caches
    const userKeys = await redis.keys("admin:users:*");
    for (const id of userIds) {
      await redis.del(`user:${id}`, `user:profile:${id}`, getAdminCacheKey(id));
    }
    if (userKeys.length > 0) {
      await redis.del(...userKeys);
    }
    await redis.del(getDashboardStatsCacheKey());

    // Log action
    await LogService.write(
      req.user?.users_id,
      "BULK_UPDATE_ROLES",
      `Bulk updated ${result.count} users to role: ${newRole}`
    );

    res.status(200).json({
      success: true,
      message: `Successfully updated ${result.count} users to ${newRole}`,
      updatedCount: result.count,
    });
  } catch (error) {
    logger.error("Bulk update roles error:", {
      error: error.message,
      stack: error.stack,
    });
    return next(
      new ErrorHandler("Failed to update roles: " + error.message, 500)
    );
  }
});
