const { prisma } = require("../config/prisma");
const ErrorHandler = require("../utils/Errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const logger = require("../logs/looger");
const redis = require("../utils/redis"); // Redis client
const LogService = require("../services/logService");



const getCacheKey = (sampleId, type = 'readings') => `sensor:${sampleId}:${type}`;

// Validate sensor reading data
const validateSensorReading = (data) => {
  const { sampleId, deviceName, deviceType, readingType, value, unit } = data;
  
  if (!sampleId || isNaN(parseInt(sampleId))) {
    throw new Error("Valid sample ID is required");
  }
  
  if (!deviceName || !deviceName.trim()) {
    throw new Error("Device name is required");
  }
  
  if (!readingType || !readingType.trim()) {
    throw new Error("Reading type is required");
  }
  
  if (value === undefined || value === null || isNaN(parseFloat(value))) {
    throw new Error("Valid numeric value is required");
  }
  
  if (!unit || !unit.trim()) {
    throw new Error("Unit is required");
  }
  
  // Validate reading types
  const validReadingTypes = ['temperature', 'ph', 'salinity', 'turbidity', 'dissolved_oxygen'];
  if (!validReadingTypes.includes(readingType.toLowerCase())) {
    throw new Error(`Invalid reading type. Must be one of: ${validReadingTypes.join(', ')}`);
  }
  
  return true;
};

// Save sensor reading
exports.saveSensorReading = catchAsyncErrors(async (req, res, next) => {
  try {
    const { sampleId, deviceName, deviceType, readingType, value, unit } = req.body;

    if (!req.user?.users_id) {
      return next(new ErrorHandler("User ID not found", 401));
    }

    // Validate input data
    try {
      validateSensorReading(req.body);
    } catch (validationError) {
      return next(new ErrorHandler(validationError.message, 400));
    }

    // Verify sample exists and belongs to user using Prisma
    const sample = await prisma.samples.findFirst({
      where: {
        samples_id: parseInt(sampleId),
        users_id: req.user.users_id,
      },
    });

    if (!sample) {
      return next(new ErrorHandler("Sample not found or unauthorized", 404));
    }

    // Use Prisma transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Insert sensor reading
      const sensorReading = await tx.sensor_readings.create({
        data: {
          sample_id: parseInt(sampleId),
          device_name: deviceName.trim(),
          device_type: deviceType?.trim() || null,
          reading_type: readingType.toLowerCase(),
          value: parseFloat(value),
          unit: unit.trim(),
        },
      });

      // Update sample with latest reading based on reading type
      const updateData = {};
      const normalizedType = readingType.toLowerCase();
      
      if (normalizedType === "temperature") {
        updateData.temperature = parseFloat(value);
      } else if (normalizedType === "ph") {
        updateData.ph = parseFloat(value);
      } else if (normalizedType === "salinity") {
        updateData.salinity = parseFloat(value);
      }

      if (Object.keys(updateData).length > 0) {
        await tx.samples.update({
          where: { samples_id: parseInt(sampleId) },
          data: updateData,
        });
      }

      return sensorReading;
    });

    // Invalidate Redis cache
    await redis.del(getCacheKey(sampleId));
    await redis.del(getCacheKey(sampleId, 'latest'));
    await redis.del(getCacheKey(sampleId, 'stats'));

    // Log activity
    await LogService.write(
      req.user.users_id,
      "CREATED",
      `Sensor reading added for sample ID: ${sampleId} - ${readingType}: ${value} ${unit}`
    );

    res.status(201).json({
      success: true,
      message: "Sensor reading saved successfully",
      reading: {
        id: result.sensor_reading_id,
        deviceName: result.device_name,
        readingType: result.reading_type,
        value: result.value,
        unit: result.unit,
        timestamp: result.created_at,
      },
    });
  } catch (error) {
    logger.error("Save sensor reading error:", {
      userId: req.user?.users_id,
      sampleId: req.body?.sampleId,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to save sensor reading: " + error.message, 500));
  }
});

// Get all sensor readings for a sample
exports.getSensorReadings = catchAsyncErrors(async (req, res, next) => {
  try {
    const { sampleId } = req.params;
    const { page = 1, limit = 50, readingType } = req.query;

    if (!req.user?.users_id) {
      return next(new ErrorHandler("User ID not found", 401));
    }

    if (!sampleId || isNaN(parseInt(sampleId))) {
      return next(new ErrorHandler("Valid sample ID is required", 400));
    }

    const cacheKey = getCacheKey(sampleId, `page_${page}_${limit}_${readingType || 'all'}`);
    
    // Check Redis cache
    const cachedReadings = await redis.get(cacheKey);
    if (cachedReadings) {
      return res.status(200).json({
        success: true,
        ...JSON.parse(cachedReadings),
        cached: true,
      });
    }

    // Verify sample exists and belongs to user
    const sample = await prisma.samples.findFirst({
      where: {
        samples_id: parseInt(sampleId),
        users_id: req.user.users_id,
      },
    });

    if (!sample) {
      return next(new ErrorHandler("Sample not found or unauthorized", 404));
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {
      sample_id: parseInt(sampleId),
      ...(readingType && { reading_type: readingType.toLowerCase() }),
    };

    // Fetch readings with pagination
    const [readings, totalCount] = await Promise.all([
      prisma.sensor_readings.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: parseInt(limit),
        select: {
          sensor_reading_id: true,
          device_name: true,
          device_type: true,
          reading_type: true,
          value: true,
          unit: true,
          created_at: true,
        },
      }),
      prisma.sensor_readings.count({ where }),
    ]);

    const response = {
      success: true,
      readings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
      },
    };

    // Cache in Redis for 5 minutes (300 seconds)
    await redis.setex(cacheKey, 300, JSON.stringify(response));

    res.status(200).json({ ...response, cached: false });
  } catch (error) {
    logger.error("Get sensor readings error:", {
      userId: req.user?.users_id,
      sampleId: req.params?.sampleId,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to fetch sensor readings: " + error.message, 500));
  }
});

// Get latest reading by type
exports.getLatestReading = catchAsyncErrors(async (req, res, next) => {
  try {
    const { sampleId, readingType } = req.params;

    if (!req.user?.users_id) {
      return next(new ErrorHandler("User ID not found", 401));
    }

    if (!sampleId || isNaN(parseInt(sampleId))) {
      return next(new ErrorHandler("Valid sample ID is required", 400));
    }

    if (!readingType || !readingType.trim()) {
      return next(new ErrorHandler("Reading type is required", 400));
    }

    const cacheKey = getCacheKey(sampleId, `latest_${readingType}`);
    
    // Check Redis cache
    const cachedReading = await redis.get(cacheKey);
    if (cachedReading) {
      return res.status(200).json({
        success: true,
        reading: JSON.parse(cachedReading),
        cached: true,
      });
    }

    // Verify sample belongs to user
    const sample = await prisma.samples.findFirst({
      where: {
        samples_id: parseInt(sampleId),
        users_id: req.user.users_id,
      },
    });

    if (!sample) {
      return next(new ErrorHandler("Sample not found or unauthorized", 404));
    }

    // Fetch latest reading
    const reading = await prisma.sensor_readings.findFirst({
      where: {
        sample_id: parseInt(sampleId),
        reading_type: readingType.toLowerCase(),
      },
      orderBy: { created_at: 'desc' },
      select: {
        sensor_reading_id: true,
        device_name: true,
        device_type: true,
        reading_type: true,
        value: true,
        unit: true,
        created_at: true,
      },
    });

    if (!reading) {
      return next(new ErrorHandler(`No ${readingType} readings found for this sample`, 404));
    }

    // Cache in Redis for 2 minutes (120 seconds)
    await redis.setex(cacheKey, 120, JSON.stringify(reading));

    res.status(200).json({
      success: true,
      reading,
      cached: false,
    });
  } catch (error) {
    logger.error("Get latest reading error:", {
      userId: req.user?.users_id,
      sampleId: req.params?.sampleId,
      readingType: req.params?.readingType,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to fetch latest reading: " + error.message, 500));
  }
});

// Get sensor statistics for a sample
exports.getSensorStats = catchAsyncErrors(async (req, res, next) => {
  try {
    const { sampleId } = req.params;

    if (!req.user?.users_id) {
      return next(new ErrorHandler("User ID not found", 401));
    }

    if (!sampleId || isNaN(parseInt(sampleId))) {
      return next(new ErrorHandler("Valid sample ID is required", 400));
    }

    const cacheKey = getCacheKey(sampleId, 'stats');
    
    // Check Redis cache
    const cachedStats = await redis.get(cacheKey);
    if (cachedStats) {
      return res.status(200).json({
        success: true,
        statistics: JSON.parse(cachedStats),
        cached: true,
      });
    }

    // Verify sample belongs to user
    const sample = await prisma.samples.findFirst({
      where: {
        samples_id: parseInt(sampleId),
        users_id: req.user.users_id,
      },
    });

    if (!sample) {
      return next(new ErrorHandler("Sample not found or unauthorized", 404));
    }

    // Get all readings for the sample
    const readings = await prisma.sensor_readings.findMany({
      where: { sample_id: parseInt(sampleId) },
      select: {
        reading_type: true,
        value: true,
        unit: true,
      },
    });

    if (readings.length === 0) {
      return res.status(200).json({
        success: true,
        statistics: [],
        message: "No sensor readings found for this sample",
      });
    }

    // Calculate statistics grouped by reading type
    const statsMap = {};

    readings.forEach((reading) => {
      const type = reading.reading_type;
      
      if (!statsMap[type]) {
        statsMap[type] = {
          reading_type: type,
          values: [],
          unit: reading.unit,
        };
      }
      
      statsMap[type].values.push(parseFloat(reading.value));
    });

    const statistics = Object.values(statsMap).map((stat) => {
      const values = stat.values;
      const count = values.length;
      const sum = values.reduce((a, b) => a + b, 0);
      const average = sum / count;
      const minimum = Math.min(...values);
      const maximum = Math.max(...values);
      
      // Calculate standard deviation
      const variance = values.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / count;
      const std_dev = Math.sqrt(variance);

      return {
        reading_type: stat.reading_type,
        count,
        average: parseFloat(average.toFixed(2)),
        minimum: parseFloat(minimum.toFixed(2)),
        maximum: parseFloat(maximum.toFixed(2)),
        std_deviation: parseFloat(std_dev.toFixed(2)),
        unit: stat.unit,
      };
    });

    // Cache in Redis for 10 minutes (600 seconds)
    await redis.setex(cacheKey, 600, JSON.stringify(statistics));

    res.status(200).json({
      success: true,
      statistics,
      cached: false,
    });
  } catch (error) {
    logger.error("Get sensor stats error:", {
      userId: req.user?.users_id,
      sampleId: req.params?.sampleId,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to fetch sensor statistics: " + error.message, 500));
  }
});

// Delete sensor reading
exports.deleteSensorReading = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.user?.users_id) {
      return next(new ErrorHandler("User ID not found", 401));
    }

    if (!id || isNaN(parseInt(id))) {
      return next(new ErrorHandler("Valid reading ID is required", 400));
    }

    // Verify reading exists and belongs to user's sample
    const reading = await prisma.sensor_readings.findFirst({
      where: { sensor_reading_id: parseInt(id) },
      include: {
        samples: {
          select: { users_id: true },
        },
      },
    });

    if (!reading) {
      return next(new ErrorHandler("Sensor reading not found", 404));
    }

    if (reading.samples.users_id !== req.user.users_id) {
      return next(new ErrorHandler("Unauthorized to delete this reading", 403));
    }

    // Delete the reading
    await prisma.sensor_readings.delete({
      where: { sensor_reading_id: parseInt(id) },
    });

    // Invalidate Redis cache
    await redis.del(getCacheKey(reading.sample_id));
    await redis.del(getCacheKey(reading.sample_id, 'stats'));

    // Log activity
    await LogService.write(
      req.user.users_id,
      "DELETED",
      `Sensor reading deleted - ID: ${id}`
    );

    res.status(200).json({
      success: true,
      message: "Sensor reading deleted successfully",
    });
  } catch (error) {
    logger.error("Delete sensor reading error:", {
      userId: req.user?.users_id,
      readingId: req.params?.id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to delete sensor reading: " + error.message, 500));
  }
});