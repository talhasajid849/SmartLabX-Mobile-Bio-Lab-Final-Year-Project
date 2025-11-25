const { prisma } = require("../config/prisma");
const logger = require("../logs/looger");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const LogService = require("../services/logService");
const ErrorHandler = require("../utils/Errorhandler");
const redis = require("../utils/redis");

// Cache key helpers
const getProtocolCacheKey = (protocolId) => `protocol:${protocolId}`;
const getAllProtocolsCacheKey = (category, experimentType, search) => 
  `protocols:all:cat:${category || 'all'}:exp:${experimentType || 'all'}:search:${search || 'none'}`;
const getCategoriesCacheKey = () => 'protocols:categories';

// ====================== GET ALL PROTOCOLS ======================
exports.getAllProtocols = catchAsyncErrors(async (req, res, next) => {
  try {
    const { category, experimentType, search, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const cacheKey = getAllProtocolsCacheKey(category, experimentType, search);

    // Check Redis cache
    const cachedProtocols = await redis.get(cacheKey);
    if (cachedProtocols) {
      return res.status(200).json({
        success: true,
        ...JSON.parse(cachedProtocols),
        cached: true,
      });
    }

    // Build where clause
    const where = {
      ...(category && { category }),
      ...(experimentType && { experiment_type: experimentType }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { sample_type: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Fetch protocols with pagination
    const [protocols, totalCount] = await Promise.all([
      prisma.protocols.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: parseInt(limit),
        select: {
          protocols_id: true,
          title: true,
          description: true,
          sample_type: true,
          steps: true,
          category: true,
          experiment_type: true,
          created_at: true,
          created_by_admin: true,
        },
      }),
      prisma.protocols.count({ where }),
    ]);

    const response = {
      success: true,
      count: totalCount,
      protocols,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
      },
    };

    // Cache for 15 minutes (900 seconds)
    await redis.setex(cacheKey, 900, JSON.stringify(response));

    res.status(200).json({ ...response, cached: false });
  } catch (error) {
    logger.error("Get protocols error:", {
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to fetch protocols: " + error.message, 500));
  }
});

// ====================== GET SINGLE PROTOCOL ======================
exports.getProtocolById = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return next(new ErrorHandler("Invalid protocol ID", 400));
    }

    const cacheKey = getProtocolCacheKey(id);

    // Check Redis cache
    const cachedProtocol = await redis.get(cacheKey);
    if (cachedProtocol) {
      return res.status(200).json({
        success: true,
        protocol: JSON.parse(cachedProtocol),
        cached: true,
      });
    }

   const protocol = await prisma.protocols.findUnique({
  where: {
    protocols_id: Number(req.params.id)
  },
  include: {
    admin: {
      select: {
        users_id: true,
        first_name: true,
        last_name: true,
        email: true
      }
    }
  }
});

    if (!protocol) {
      return next(new ErrorHandler("Protocol not found", 404));
    }

    // Parse steps if stored as JSON string
    if (typeof protocol.steps === 'string') {
      try {
        protocol.steps = JSON.parse(protocol.steps);
      } catch (e) {
        logger.warn("Failed to parse protocol steps:", e);
      }
    }

    // Cache for 30 minutes (1800 seconds)
    await redis.setex(cacheKey, 1800, JSON.stringify(protocol));

    res.status(200).json({
      success: true,
      protocol,
      cached: false,
    });
  } catch (error) {
    logger.error("Get protocol error:", {
      protocolId: req.params.id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to fetch protocol: " + error.message, 500));
  }
});

// ====================== CREATE PROTOCOL (ADMIN ONLY) ======================
exports.createProtocol = catchAsyncErrors(async (req, res, next) => {
  try {
    const {
      title,
      description,
      sample_type,
      steps,
      category,
      experiment_type,
    } = req.body;

    if (!req.user?.users_id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    // Validate required fields
    if (!title || !title.trim()) {
      return next(new ErrorHandler("Title is required", 400));
    }

    if (!steps) {
      return next(new ErrorHandler("Steps are required", 400));
    }

    // Validate steps is an array
    if (Array.isArray(steps) && steps.length === 0) {
      return next(new ErrorHandler("Steps cannot be empty", 400));
    }


    
    // Convert steps array to JSON string if it's an array
    const stepsData = Array.isArray(steps) ? JSON.stringify(steps) : steps;
    
    // Validate JSON if steps is a string
    if (typeof stepsData === 'string') {
      try {
        JSON.parse(stepsData);
      } catch (e) {
        return next(new ErrorHandler("Steps must be valid JSON", 400));
      }
    }
 
    const protocol = await prisma.protocols.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        sample_type: sample_type?.trim() || null,
        steps: stepsData,
        category: category?.trim() || null,
        experiment_type: experiment_type?.trim() || null,
        created_by_admin: req.user.users_id,
      },
    });

    // Invalidate cache
    const protocolKeys = await redis.keys('protocols:all:*');
    if (protocolKeys.length > 0) {
      await redis.del(...protocolKeys);
    }
    await redis.del(getCategoriesCacheKey());

    // Log action
    await LogService.write(
      req.user.users_id,
      "CREATE_PROTOCOL",
      `Created protocol: ${title}`
    );

    res.status(201).json({
      success: true,
      message: "Protocol created successfully",
      protocol_id: protocol.protocols_id,
      protocol,
    });
  } catch (error) {
    logger.error("Create protocol error:", {
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to create protocol: " + error.message, 500));
  }
});

// ====================== UPDATE PROTOCOL (ADMIN ONLY) ======================
exports.updateProtocol = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      sample_type,
      steps,
      category,
      experiment_type,
    } = req.body;

    if (!req.user?.users_id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    if (!id || isNaN(parseInt(id))) {
      return next(new ErrorHandler("Invalid protocol ID", 400));
    }

    // Check if protocol exists
    const existingProtocol = await prisma.protocols.findUnique({
      where: { protocols_id: parseInt(id) },
    });

    if (!existingProtocol) {
      return next(new ErrorHandler("Protocol not found", 404));
    }

    // Validate steps if provided
    let stepsData = steps;
    if (steps) {
      if (Array.isArray(steps)) {
        if (steps.length === 0) {
          return next(new ErrorHandler("Steps cannot be empty", 400));
        }
        stepsData = JSON.stringify(steps);
      } else if (typeof steps === 'string') {
        try {
          JSON.parse(steps);
          stepsData = steps;
        } catch (e) {
          return next(new ErrorHandler("Steps must be valid JSON", 400));
        }
      }
    }

    // Update protocol
    const updatedProtocol = await prisma.protocols.update({
      where: { protocols_id: parseInt(id) },
      data: {
        title: title?.trim() || existingProtocol.title,
        description: description !== undefined ? (description?.trim() || null) : existingProtocol.description,
        sample_type: sample_type !== undefined ? (sample_type?.trim() || null) : existingProtocol.sample_type,
        steps: stepsData || existingProtocol.steps,
        category: category !== undefined ? (category?.trim() || null) : existingProtocol.category,
        experiment_type: experiment_type !== undefined ? (experiment_type?.trim() || null) : existingProtocol.experiment_type,
      },
    });

    // Invalidate cache
    await redis.del(getProtocolCacheKey(id));
    const protocolKeys = await redis.keys('protocols:all:*');
    if (protocolKeys.length > 0) {
      await redis.del(...protocolKeys);
    }
    await redis.del(getCategoriesCacheKey());

    // Log action
    await LogService.write(
      req.user.users_id,
      "UPDATE_PROTOCOL",
      `Updated protocol ID: ${id} - ${updatedProtocol.title}`
    );

    res.status(200).json({
      success: true,
      message: "Protocol updated successfully",
      protocol: updatedProtocol,
    });
  } catch (error) {
    logger.error("Update protocol error:", {
      protocolId: req.params.id,
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to update protocol: " + error.message, 500));
  }
});

// ====================== DELETE PROTOCOL (ADMIN ONLY) ======================
exports.deleteProtocol = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.user?.users_id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    if (!id || isNaN(parseInt(id))) {
      return next(new ErrorHandler("Invalid protocol ID", 400));
    }

    // Check if protocol exists
    const protocol = await prisma.protocols.findUnique({
      where: { protocols_id: parseInt(id) },
    });

    if (!protocol) {
      return next(new ErrorHandler("Protocol not found", 404));
    }

    // Delete protocol
    await prisma.protocols.delete({
      where: { protocols_id: parseInt(id) },
    });

    // Invalidate cache
    await redis.del(getProtocolCacheKey(id));
    const protocolKeys = await redis.keys('protocols:all:*');
    if (protocolKeys.length > 0) {
      await redis.del(...protocolKeys);
    }
    await redis.del(getCategoriesCacheKey());

    // Log action
    await LogService.write(
      req.user.users_id,
      "DELETE_PROTOCOL",
      `Deleted protocol ID: ${id} - ${protocol.title}`
    );

    res.status(200).json({
      success: true,
      message: "Protocol deleted successfully",
    });
  } catch (error) {
    logger.error("Delete protocol error:", {
      protocolId: req.params.id,
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to delete protocol: " + error.message, 500));
  }
});

// ====================== GET DISTINCT CATEGORIES ======================
exports.getCategories = catchAsyncErrors(async (req, res, next) => {
  try {
    const cacheKey = getCategoriesCacheKey();

    // Check Redis cache
    const cachedCategories = await redis.get(cacheKey);
    if (cachedCategories) {
      return res.status(200).json({
        success: true,
        categories: JSON.parse(cachedCategories),
        cached: true,
      });
    }

    // Fetch distinct categories
    const categories = await prisma.protocols.findMany({
      where: {
        category: { not: null },
      },
      select: {
        category: true,
      },
      distinct: ['category'],
      orderBy: {
        category: 'asc',
      },
    });

    const categoryList = categories.map((c) => c.category);

    // Cache for 1 hour (3600 seconds)
    await redis.setex(cacheKey, 3600, JSON.stringify(categoryList));

    res.status(200).json({
      success: true,
      count: categoryList.length,
      categories: categoryList,
      cached: false,
    });
  } catch (error) {
    logger.error("Get categories error:", {
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to fetch categories: " + error.message, 500));
  }
});

// ====================== GET EXPERIMENT TYPES ======================
exports.getExperimentTypes = catchAsyncErrors(async (req, res, next) => {
  try {
    const cacheKey = 'protocols:experiment_types';

    // Check Redis cache
    const cachedTypes = await redis.get(cacheKey);
    if (cachedTypes) {
      return res.status(200).json({
        success: true,
        experimentTypes: JSON.parse(cachedTypes),
        cached: true,
      });
    }

    // Fetch distinct experiment types
    const types = await prisma.protocols.findMany({
      where: {
        experiment_type: { not: null },
      },
      select: {
        experiment_type: true,
      },
      distinct: ['experiment_type'],
      orderBy: {
        experiment_type: 'asc',
      },
    });

    const typeList = types.map((t) => t.experiment_type);

    // Cache for 1 hour (3600 seconds)
    await redis.setex(cacheKey, 3600, JSON.stringify(typeList));

    res.status(200).json({
      success: true,
      count: typeList.length,
      experimentTypes: typeList,
      cached: false,
    });
  } catch (error) {
    logger.error("Get experiment types error:", {
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to fetch experiment types: " + error.message, 500));
  }
});

// ====================== GET PROTOCOL STATISTICS (ADMIN) ======================
exports.getProtocolStats = catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.user?.users_id || req.user.role !== 'admin') {
      return next(new ErrorHandler("Admin access required", 403));
    }

    const cacheKey = 'protocols:stats';

    // Check Redis cache
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
      totalProtocols,
      protocolsByCategory,
      protocolsByExperimentType,
      protocolsBySampleType,
    ] = await Promise.all([
      prisma.protocols.count(),
      prisma.protocols.groupBy({
        by: ['category'],
        where: { category: { not: null } },
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
      }),
      prisma.protocols.groupBy({
        by: ['experiment_type'],
        where: { experiment_type: { not: null } },
        _count: { experiment_type: true },
        orderBy: { _count: { experiment_type: 'desc' } },
      }),
      prisma.protocols.groupBy({
        by: ['sample_type'],
        where: { sample_type: { not: null } },
        _count: { sample_type: true },
        orderBy: { _count: { sample_type: 'desc' } },
      }),
    ]);

    // Get recently created protocols
    const recentProtocols = await prisma.protocols.findMany({
      orderBy: { created_at: 'desc' },
      take: 5,
      select: {
        protocols_id: true,
        title: true,
        category: true,
        created_at: true,
      },
    });

    const stats = {
      total: totalProtocols,
      byCategory: protocolsByCategory.map(item => ({
        category: item.category,
        count: item._count.category,
      })),
      byExperimentType: protocolsByExperimentType.map(item => ({
        experiment_type: item.experiment_type,
        count: item._count.experiment_type,
      })),
      bySampleType: protocolsBySampleType.map(item => ({
        sample_type: item.sample_type,
        count: item._count.sample_type,
      })),
      recent: recentProtocols,
    };

    // Cache for 15 minutes (900 seconds)
    await redis.setex(cacheKey, 900, JSON.stringify(stats));

    res.status(200).json({
      success: true,
      stats,
      cached: false,
    });
  } catch (error) {
    logger.error("Get protocol stats error:", {
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to fetch protocol statistics: " + error.message, 500));
  }
});

// ====================== DUPLICATE PROTOCOL (ADMIN) ======================
exports.duplicateProtocol = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.user?.users_id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    if (!id || isNaN(parseInt(id))) {
      return next(new ErrorHandler("Invalid protocol ID", 400));
    }

    // Get original protocol
    const originalProtocol = await prisma.protocols.findUnique({
      where: { protocols_id: parseInt(id) },
    });

    if (!originalProtocol) {
      return next(new ErrorHandler("Protocol not found", 404));
    }

    // Create duplicate
    const duplicateProtocol = await prisma.protocols.create({
      data: {
        title: `${originalProtocol.title} (Copy)`,
        description: originalProtocol.description,
        sample_type: originalProtocol.sample_type,
        steps: originalProtocol.steps,
        category: originalProtocol.category,
        experiment_type: originalProtocol.experiment_type,
        created_by_admin: req.user.users_id,
      },
    });

    // Invalidate cache
    const protocolKeys = await redis.keys('protocols:all:*');
    if (protocolKeys.length > 0) {
      await redis.del(...protocolKeys);
    }

    // Log action
    await LogService.write(
      req.user.users_id,
      "DUPLICATE_PROTOCOL",
      `Duplicated protocol ID: ${id} to ID: ${duplicateProtocol.protocols_id}`
    );

    res.status(201).json({
      success: true,
      message: "Protocol duplicated successfully",
      protocol: duplicateProtocol,
    });
  } catch (error) {
    logger.error("Duplicate protocol error:", {
      protocolId: req.params.id,
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to duplicate protocol: " + error.message, 500));
  }
});