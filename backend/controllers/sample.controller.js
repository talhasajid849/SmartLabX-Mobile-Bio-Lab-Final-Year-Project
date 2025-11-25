const ErrorHandler = require("../utils/Errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { prisma } = require("../config/prisma");
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");
const path = require("path");
const pdfGenerator = require("../services/pdfGenerator");
const fs = require("fs");
const logger = require("../logs/looger");
const sendMail = require("../utils/sendEmail");
const redis = require("../utils/redis");
const LogService = require("../services/logService");

// Cache key helpers
const getSampleCacheKey = (sampleId) => `sample:${sampleId}`;
const getUserSamplesCacheKey = (userId, page = 1, limit = 20) => `user:${userId}:samples:page:${page}:limit:${limit}`;
const getSampleChartCacheKey = (userId, filters) => {
  const { sampleType, startDate, endDate } = filters;
  return `user:${userId}:chart:${sampleType || 'all'}:${startDate || 'any'}:${endDate || 'any'}`;
};

exports.createSample = catchAsyncErrors(async (req, res, next) => {
  try {
    const {
      sample_identifier,
      sample_type,
      collection_datetime,
      geolocation,
      latitude,
      longitude,
      ph,
      temperature,
      salinity,
      notes,
      ble_session_id,
    } = req.body;

    if (!req.user?.users_id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    // Validate required fields
    if (!collection_datetime || !sample_type) {
      return next(
        new ErrorHandler("Sample type and collection date/time are required", 400)
      );
    }

    // Generate unique sample_identifier if not provided
    const sampleId =
      (sample_identifier || "SAMPLE-" + uuidv4().substring(0, 8))
        .trim()
        .replace(/\s+/g, "_");

    // If BLE session provided → validate
    if (ble_session_id) {
      const bleSession = await prisma.ble_sessions.findFirst({
        where: {
          ble_session_id: parseInt(ble_session_id),
          users_id: req.user.users_id,
        },
        include: { sensor_readings: true },
      });

      if (!bleSession) {
        return next(
          new ErrorHandler("BLE session not found or unauthorized", 404)
        );
      }

      // Check if already linked
      const existingSample = await prisma.samples.findFirst({
        where: { ble_session_id: parseInt(ble_session_id) },
      });

      if (existingSample) {
        return next(
          new ErrorHandler(
            "This BLE session is already linked to another sample",
            400
          )
        );
      }
    }

    // -----------------------------
    //  🔥 Generate QR Code & Upload to Cloudinary
    // -----------------------------

    const qrData = JSON.stringify({
      sample_identifier: sampleId,
      sample_type,
      collection_datetime,
    });

    // Generate QR as Buffer
    const qrBuffer = await QRCode.toBuffer(qrData);

    // Upload buffer to Cloudinary
    const qrUploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "biolab/qr-codes",
          public_id: `qr_${sampleId}_${Date.now()}`,
          resource_type: "image",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      uploadStream.end(qrBuffer);
    });

    // -----------------------------
    // ✔ Transaction: Create Sample + Update BLE readings
    // -----------------------------

    const result = await prisma.$transaction(async (tx) => {
      const sample = await tx.samples.create({
        data: {
          users_id: req.user.users_id,
          sample_identifier: sampleId,
          sample_type,
          collection_datetime: new Date(collection_datetime),
          geolocation: geolocation || null,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          ph: ph ? parseFloat(ph) : null,
          temperature: temperature ? parseFloat(temperature) : null,
          salinity: salinity ? parseFloat(salinity) : null,
          notes: notes || null,
          qr_code_data: qrUploadResult.secure_url, // <-- CLOUDINARY QR URL
          ble_session_id: ble_session_id ? parseInt(ble_session_id) : null,
          status: "pending",
        },
      });

      // If BLE session linked → update readings
      if (ble_session_id) {
        await tx.sensor_readings.updateMany({
          where: { ble_session_id: parseInt(ble_session_id) },
          data: { sample_id: sample.samples_id },
        });

        const bleReadings = await tx.sensor_readings.findMany({
          where: { ble_session_id: parseInt(ble_session_id) },
        });

        const updateData = {};

        // Auto-fill values from BLE if not manually provided
        bleReadings.forEach((reading) => {
          if (reading.reading_type === "temperature" && !temperature) {
            updateData.temperature = reading.value;
          } else if (reading.reading_type === "ph" && !ph) {
            updateData.ph = reading.value;
          } else if (reading.reading_type === "salinity" && !salinity) {
            updateData.salinity = reading.value;
          }
        });

        if (Object.keys(updateData).length > 0) {
          await tx.samples.update({
            where: { samples_id: sample.samples_id },
            data: updateData,
          });
        }
      }

      return sample;
    });

    // Clear cache
    const pattern = `user:${req.user.users_id}:samples:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);

    // Log
    await LogService.write(
      req.user.users_id,
      "CREATED",
      `Sample created: ${sampleId}${ble_session_id ? ` (BLE Session: ${ble_session_id})` : ""}`
    );

    res.status(201).json({
      success: true,
      message: ble_session_id
        ? "Sample created and linked to BLE session successfully"
        : "Sample created successfully",
      sample: {
        sample_identifier: sampleId,
        samples_id: result.samples_id,
        qr_code: qrUploadResult.secure_url,
        ble_session_id: result.ble_session_id,
      },
    });
  } catch (error) {
    logger.error("Create sample error:", {
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });
    return next(
      new ErrorHandler("Failed to create sample: " + error.message, 500)
    );
  }
});


// Get all samples for logged-in user
exports.getMySamples = catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.user?.users_id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const cacheKey = getUserSamplesCacheKey(req.user.users_id, page, limit);

    // Check Redis cache
    const cachedSamples = await redis.get(cacheKey);
    if (cachedSamples) {
      return res.status(200).json({
        success: true,
        ...JSON.parse(cachedSamples),
        cached: true,
      });
    }

    // Fetch from database
    const [samples, totalCount] = await Promise.all([
      prisma.samples.findMany({
        where: { users_id: req.user.users_id },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
        select: {
          samples_id: true,
          sample_identifier: true,
          sample_type: true,
          collection_datetime: true,
          status: true,
          temperature: true,
          ph: true,
          salinity: true,
          geolocation: true,
          qr_code_data: true,
          created_at: true,
        }
      }),
      prisma.samples.count({
        where: { users_id: req.user.users_id }
      })
    ]);

    const response = {
      success: true,
      samples,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    };

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(response));

    res.status(200).json({ ...response, cached: false });
  } catch (error) {
    logger.error("Get my samples error:", {
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to fetch samples: " + error.message, 500));
  }
});

// Get single sample by ID
exports.getSampleById = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.user?.users_id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    if (!id || isNaN(parseInt(id))) {
      return next(new ErrorHandler("Invalid sample ID", 400));
    }

    const cacheKey = getSampleCacheKey(id);

    // Check cache
    const cachedSample = await redis.get(cacheKey);
    if (cachedSample) {
      const sample = JSON.parse(cachedSample);
      // Verify ownership
      if (sample.users_id !== req.user.users_id) {
        return next(new ErrorHandler("Unauthorized access to this sample", 403));
      }
      return res.status(200).json({
        success: true,
        sample,
        cached: true,
      });
    }

    // Fetch from database
    const sample = await prisma.samples.findFirst({
      where: {
        samples_id: parseInt(id),
        users_id: req.user.users_id,
      },
    });

    if (!sample) {
      return next(new ErrorHandler("Sample not found", 404));
    }

    // Cache for 10 minutes
    await redis.setex(cacheKey, 600, JSON.stringify(sample));

    res.status(200).json({
      success: true,
      sample,
      cached: false,
    });
  } catch (error) {
    logger.error("Get sample by ID error:", {
      sampleId: req.params.id,
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to fetch sample: " + error.message, 500));
  }
});

// Get sample by scanning QR code (sample_identifier)
exports.getSampleByQRCode = catchAsyncErrors(async (req, res, next) => {
  try {
    const { sampleId } = req.params;

    if (!sampleId) {
      return next(new ErrorHandler("Sample identifier is required", 400));
    }

    const cacheKey = `sample:qr:${sampleId}`;

    // Check cache
    const cachedSample = await redis.get(cacheKey);
    if (cachedSample) {
      return res.status(200).json({
        success: true,
        sample: JSON.parse(cachedSample),
        cached: true,
      });
    }

    // Fetch from database
    const sample = await prisma.samples.findFirst({
      where: { sample_identifier: sampleId },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          }
        }
      }
    });

    if (!sample) {
      return next(new ErrorHandler("Sample not found", 404));
    }

    // Cache for 15 minutes
    await redis.setex(cacheKey, 900, JSON.stringify(sample));

    res.status(200).json({
      success: true,
      sample,
      cached: false,
    });
  } catch (error) {
    logger.error("Get sample by QR code error:", {
      sampleId: req.params.sampleId,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to fetch sample: " + error.message, 500));
  }
});

// Delete sample
exports.deleteSample = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.user?.users_id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    if (!id || isNaN(parseInt(id))) {
      return next(new ErrorHandler("Invalid sample ID", 400));
    }

    // Check if sample belongs to user
    const sample = await prisma.samples.findFirst({
      where: {
        samples_id: parseInt(id),
        users_id: req.user.users_id,
      },
    });

    if (!sample) {
      return next(new ErrorHandler("Sample not found", 404));
    }

    // ------------------------------------------
    // 🔥 Delete QR code from Cloudinary (NEW)
    // ------------------------------------------
    if (sample.qr_code_data) {
      try {
        // Example:
        // https://res.cloudinary.com/xxx/image/upload/v1234/biolab/qr-codes/qr_SAMPLE_xxx.png
        // We must extract: biolab/qr-codes/qr_SAMPLE_xxx

        const url = sample.qr_code_data;

        const publicId = url
          .split("/")
          .slice(-2) // -> ["qr-codes", "qr_SAMPLE_xxx.png"]
          .join("/") // -> "qr-codes/qr_SAMPLE_xxx.png"
          .replace(/\.[^/.]+$/, ""); // remove file extension

        await cloudinary.uploader.destroy(`biolab/${publicId}`);
      } catch (err) {
        logger.warn("Cloudinary QR deletion failed:", {
          error: err.message,
          qr_url: sample.qr_code_data,
        });
      }
    }

    // Delete sample from DB
    await prisma.samples.delete({
      where: { samples_id: parseInt(id) },
    });

    // Clear sample cache
    await redis.del(getSampleCacheKey(id));
    await redis.del(`sample:qr:${sample.sample_identifier}`);

    // Clear all user's samples cache
    const pattern = `user:${req.user.users_id}:samples:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);

    // Log action
    await LogService.write(
      req.user.users_id,
      "DELETED",
      `Sample deleted: ${sample.sample_identifier}`
    );

    res.status(200).json({
      success: true,
      message: "Sample deleted successfully",
    });
  } catch (error) {
    logger.error("Delete sample error:", {
      sampleId: req.params.id,
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });

    return next(
      new ErrorHandler("Failed to delete sample: " + error.message, 500)
    );
  }
});


// Share sample with another user (via email)
exports.shareSample = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { recipientEmail } = req.body;

    if (!req.user?.users_id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    if (!recipientEmail || !recipientEmail.includes('@')) {
      return next(new ErrorHandler("Valid recipient email is required", 400));
    }

    // Check if sample exists and belongs to user
    const sample = await prisma.samples.findFirst({
      where: {
        samples_id: parseInt(id),
        users_id: req.user.users_id,
      },
    });

    if (!sample) {
      return next(new ErrorHandler("Sample not found", 404));
    }

    // Check if recipient exists
    const recipient = await prisma.users.findUnique({
      where: { email: recipientEmail }
    });

    if (!recipient) {
      return next(new ErrorHandler("Recipient not found in system", 404));
    }

    const shareLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/samples/shared/${sample.sample_identifier}`;

    await sendMail({
      email: recipientEmail,
      subject: "Sample Shared With You - Mobile Bio Lab",
      template: "sampleShare.ejs",
      data: {
        shareLink,
        sampleId: sample.sample_identifier,
        sampleType: sample.sample_type,
        senderName: `${req.user.first_name} ${req.user.last_name}`
      },
    });

    res.status(200).json({
      success: true,
      message: `Sample shared successfully with ${recipientEmail}`,
    });
  } catch (error) {
    logger.error("Share sample error:", {
      sampleId: req.params.id,
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to share sample: " + error.message, 500));
  }
});

// Export sample as PDF
exports.exportSamplePDF = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.user?.users_id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    // Fetch sample, include user info
    const sample = await prisma.samples.findFirst({
      where: {
        samples_id: parseInt(id),
      },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    if (!sample) {
      return next(new ErrorHandler("Sample not found", 404));
    }

    // Check access: either owner or admin
    if (sample.users_id !== req.user.users_id && req.user.role !== "admin") {
      return next(new ErrorHandler("Access denied", 403));
    }

    const report = {
      sample: sample,
      title: `Sample Report - ${sample.sample_identifier}`,
      generated_on: new Date(),
      status: sample.status,
      report_id: sample.samples_id, // optional
    };
    const pdfBuffer = await pdfGenerator.generateSampleReport(report);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Sample-${sample.sample_identifier}-Report-${Date.now()}.pdf`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    res.send(pdfBuffer);

  } catch (error) {
    logger.error("Export PDF error:", {
      sampleId: req.params.id,
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to generate PDF: " + error.message, 500));
  }
});


// Get sample data for charts
exports.getSampleChartData = catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.user?.users_id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    const { sampleType, startDate, endDate } = req.query;

    const cacheKey = getSampleChartCacheKey(req.user.users_id, { sampleType, startDate, endDate });

    // Check cache
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        ...JSON.parse(cachedData),
        cached: true,
      });
    }

    const where = {
      users_id: req.user.users_id,
      ...(sampleType && sampleType !== "all" && { sample_type: sampleType }),
      ...(startDate && { collection_datetime: { gte: new Date(startDate) } }),
      ...(endDate && {
        collection_datetime: {
          ...(startDate && { gte: new Date(startDate) }),
          lte: new Date(endDate)
        }
      }),
    };

    const samples = await prisma.samples.findMany({
      where,
      orderBy: { collection_datetime: 'asc' },
      select: {
        sample_identifier: true,
        sample_type: true,
        collection_datetime: true,
        ph: true,
        temperature: true,
        salinity: true,
        geolocation: true,
        latitude: true,
        longitude: true,
      }
    });

    // Calculate statistics
    const stats = {
      totalSamples: samples.length,
      avgPh: 0,
      avgTemp: 0,
      avgSalinity: 0,
      sampleTypeDistribution: {},
    };

    let phCount = 0, tempCount = 0, salinityCount = 0;

    samples.forEach((sample) => {
      if (sample.ph !== null) {
        stats.avgPh += parseFloat(sample.ph);
        phCount++;
      }
      if (sample.temperature !== null) {
        stats.avgTemp += parseFloat(sample.temperature);
        tempCount++;
      }
      if (sample.salinity !== null) {
        stats.avgSalinity += parseFloat(sample.salinity);
        salinityCount++;
      }

      const type = sample.sample_type;
      stats.sampleTypeDistribution[type] = (stats.sampleTypeDistribution[type] || 0) + 1;
    });

    stats.avgPh = phCount > 0 ? parseFloat((stats.avgPh / phCount).toFixed(2)) : 0;
    stats.avgTemp = tempCount > 0 ? parseFloat((stats.avgTemp / tempCount).toFixed(2)) : 0;
    stats.avgSalinity = salinityCount > 0 ? parseFloat((stats.avgSalinity / salinityCount).toFixed(2)) : 0;

    const response = {
      success: true,
      samples,
      stats,
    };

    // Cache for 10 minutes
    await redis.setex(cacheKey, 600, JSON.stringify(response));

    res.status(200).json({ ...response, cached: false });
  } catch (error) {
    logger.error("Get chart data error:", {
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to fetch chart data: " + error.message, 500));
  }
});

// ===============================
// ADMIN FUNCTIONS
// ===============================

// Update sample (Admin)
exports.updateSample = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;

    const {
      sample_type,
      collection_datetime,
      geolocation,
      latitude,
      longitude,
      temperature,
      ph,
      salinity,
      notes,
      status,
    } = req.body;

    // ADMIN CHECK
    if (!req.admin?.admins_id && req.user?.role !== "admin") {
      return next(new ErrorHandler("Admin access required", 403));
    }

    if (!id || isNaN(parseInt(id))) {
      return next(new ErrorHandler("Invalid sample ID", 400));
    }

    // Find existing sample
    const existingSample = await prisma.samples.findUnique({
      where: { samples_id: parseInt(id) },
    });

    if (!existingSample) {
      return next(new ErrorHandler("Sample not found", 404));
    }

    // ----------------------------------------------------
    // 🔥 Determine if QR code should be regenerated
    // QR code depends on: sample_identifier, sample_type, collection_datetime
    // ----------------------------------------------------

    let shouldRegenerateQR = false;

    if (
      (sample_type && sample_type !== existingSample.sample_type) ||
      (collection_datetime &&
        new Date(collection_datetime).toISOString() !==
          existingSample.collection_datetime.toISOString())
    ) {
      shouldRegenerateQR = true;
    }

    let newQRCodeUrl = existingSample.qr_code_data; // default keep old

    // ----------------------------------------------------
    // 🔥 If QR changes → delete old from Cloudinary + upload new
    // ----------------------------------------------------
    if (shouldRegenerateQR) {
      // STEP 1: Delete old QR from Cloudinary
      try {
        if (existingSample.qr_code_data) {
          const oldUrl = existingSample.qr_code_data;

          const publicId = oldUrl
            .split("/")
            .slice(-2)
            .join("/")
            .replace(/\.[^/.]+$/, ""); // remove extension

          await cloudinary.uploader.destroy(`biolab/${publicId}`);
        }
      } catch (err) {
        logger.warn("QR delete failed:", { err: err.message });
      }

      // STEP 2: Generate new QR data
      const qrPayload = JSON.stringify({
        sample_identifier: existingSample.sample_identifier,
        sample_type: sample_type || existingSample.sample_type,
        collection_datetime:
          collection_datetime || existingSample.collection_datetime,
      });

      // STEP 3: Generate QR Buffer
      const qrBuffer = await QRCode.toBuffer(qrPayload);

      // STEP 4: Upload new QR to Cloudinary
      const qrUploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "biolab/qr-codes",
            public_id: `qr_${existingSample.sample_identifier}_${Date.now()}`,
            resource_type: "image",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(qrBuffer);
      });

      newQRCodeUrl = qrUploadResult.secure_url;
    }

    // ----------------------------------------------------
    // 🔥 Update sample
    // ----------------------------------------------------
    const updatedSample = await prisma.samples.update({
      where: { samples_id: parseInt(id) },
      data: {
        sample_type: sample_type || existingSample.sample_type,
        collection_datetime: collection_datetime
          ? new Date(collection_datetime)
          : existingSample.collection_datetime,

        geolocation:
          geolocation !== undefined ? geolocation : existingSample.geolocation,

        latitude:
          latitude !== undefined ? parseFloat(latitude) : existingSample.latitude,

        longitude:
          longitude !== undefined
            ? parseFloat(longitude)
            : existingSample.longitude,

        temperature:
          temperature !== undefined
            ? parseFloat(temperature)
            : existingSample.temperature,

        ph: ph !== undefined ? parseFloat(ph) : existingSample.ph,

        salinity:
          salinity !== undefined
            ? parseFloat(salinity)
            : existingSample.salinity,

        notes: notes !== undefined ? notes : existingSample.notes,
        status: status || existingSample.status,

        // If regenerated, store new QR
        qr_code_data: newQRCodeUrl,
      },
    });

    // ----------------------------------------------------
    // 🔥 Invalidate Redis Cache
    // ----------------------------------------------------
    await redis.del(getSampleCacheKey(id));
    await redis.del(`sample:qr:${existingSample.sample_identifier}`);

    const userSampleKeys = await redis.keys(
      `user:${existingSample.users_id}:samples:*`
    );
    if (userSampleKeys.length > 0) await redis.del(...userSampleKeys);

    // ----------------------------------------------------
    // 🔥 Log Admin Action
    // ----------------------------------------------------
    await LogService.write(
      req.admin?.admins_id || req.user.users_id,
      "UPDATED",
      `Sample updated - ID: ${id}`
    );

    res.status(200).json({
      success: true,
      message: "Sample updated successfully",
      sample: updatedSample,
    });
  } catch (error) {
    logger.error("Update sample (admin) error:", {
      sampleId: req.params.id,
      error: error.message,
      stack: error.stack,
    });

    return next(
      new ErrorHandler("Failed to update sample: " + error.message, 500)
    );
  }
});


// Delete sample (Admin)
exports.deleteSampleAdmin = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;

    // Allow only admins
    if (!req.user?.role !== "admin") {
      return next(new ErrorHandler("Admin access required", 403));
    }

    const sampleId = parseInt(id);
    if (!sampleId) {
      return next(new ErrorHandler("Invalid sample ID", 400));
    }

    // Check sample
    const sample = await prisma.samples.findUnique({
      where: { samples_id: sampleId },
    });

    if (!sample) {
      return next(new ErrorHandler("Sample not found", 404));
    }

    // Delete QR file
    if (sample.qr_code_data) {
      const filePath = path.join(__dirname, "..", sample.qr_code_data);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    // Delete DB record
    await prisma.samples.delete({
      where: { samples_id: sampleId },
    });

    // Clear caches
    await redis.del(getSampleCacheKey(sampleId));
    await redis.del(`sample:qr:${sample.sample_identifier}`);

    const userKeys = await redis.keys(`user:${sample.users_id}:samples:*`);
    if (userKeys.length) await redis.del(...userKeys);

    // Log
    await LogService.write(
      req.admin?.admins_id || req.user.users_id,
      "DELETED",
      `Sample deleted - ID: ${sampleId}`
    );

    res.status(200).json({
      success: true,
      message: "Sample deleted successfully",
    });
  } catch (error) {
    logger.error("Delete sample admin error:", error);
    return next(new ErrorHandler("Failed to delete sample", 500));
  }
});


// Update sample status (Admin)
exports.updateSampleStatus = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!req.admin?.admins_id && req.user?.role !== 'admin') {
      return next(new ErrorHandler("Admin access required", 403));
    }

    if (!id || isNaN(parseInt(id))) {
      return next(new ErrorHandler("Invalid sample ID", 400));
    }

    // Validate status
    const validStatuses = ["pending", "approved", "rejected", "under_review"];
    if (!validStatuses.includes(status)) {
      return next(new ErrorHandler("Invalid status value. Must be: " + validStatuses.join(', '), 400));
    }

    // Check if sample exists
    const sample = await prisma.samples.findUnique({
      where: { samples_id: parseInt(id) },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    if (!sample) {
      return next(new ErrorHandler("Sample not found", 404));
    }

    // Update status
    await prisma.samples.update({
      where: { samples_id: parseInt(id) },
      data: { status },
    });

    // Invalidate caches
    await redis.del(getSampleCacheKey(id));
    const userSampleKeys = await redis.keys(`user:${sample.users_id}:samples:*`);
    if (userSampleKeys.length > 0) {
      await redis.del(...userSampleKeys);
    }

    // Send notification email to user
    const statusMessages = {
      approved: "has been approved and is ready for analysis",
      rejected: "has been rejected. Please review and resubmit if necessary",
      under_review: "is currently under review by our team",
    };

    if (status !== "pending" && sample.user.email) {
      try {
        await sendMail({
          email: sample.user.email,
          subject: `Sample Status Update - ${sample.sample_identifier}`,
          template: "sampleStatusUpdate.ejs",
          data: {
            userName: `${sample.user.first_name} ${sample.user.last_name}`,
            sampleId: sample.sample_identifier,
            status: status,
            statusMessage: statusMessages[status],
            dashboardLink: `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard`,
          },
        });
      } catch (emailError) {
        logger.error("Failed to send status update email:", emailError);
      }
    }

    // Log action
    await LogService.write(
      req.admin?.admins_id || req.user.users_id,
      "STATUS_UPDATED",
      `Sample ${sample.sample_identifier} status changed to: ${status}`
    );

    res.status(200).json({
      success: true,
      message: `Sample ${status} successfully`,
    });
  } catch (error) {
    logger.error("Update sample status error:", {
      sampleId: req.params.id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to update status: " + error.message, 500));
  }
});

// Get sample analytics (Admin)
exports.getSampleAnalyticsAdmin = catchAsyncErrors(async (req, res, next) => {
  try {

    const { startDate, endDate, sampleType } = req.query;

    const cacheKey = `sample:analytics:${sampleType || 'all'}:${startDate || 'any'}:${endDate || 'any'}`;

    // 2️⃣ Check Redis cache
    const cachedAnalytics = await redis.get(cacheKey);
    if (cachedAnalytics) {
      return res.status(200).json({
        success: true,
        analytics: JSON.parse(cachedAnalytics),
        cached: true,
      });
    }

    // 3️⃣ Build Prisma where clause
    const where = {
      ...(sampleType && sampleType !== "all" && { sample_type: sampleType }),
      ...(startDate && endDate && {
        collection_datetime: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      }),
    };

    // 4️⃣ Overall statistics
    const [
      totalSamples,
      pendingSamples,
      approvedSamples,
      rejectedSamples,
      underReviewSamples,
    ] = await Promise.all([
      prisma.samples.count({ where }),
      prisma.samples.count({ where: { ...where, status: 'pending' } }),
      prisma.samples.count({ where: { ...where, status: 'approved' } }),
      prisma.samples.count({ where: { ...where, status: 'rejected' } }),
      prisma.samples.count({ where: { ...where, status: 'under_review' } }),
    ]);

    // 5️⃣ Fetch samples for averages
    const samples = await prisma.samples.findMany({
      where,
      select: { ph: true, temperature: true, salinity: true },
    });

    // 6️⃣ Calculate averages
    const avg = (arr) => (arr.length ? parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)) : null);

    const phValues = samples.map(s => s.ph).filter(v => v !== null);
    const tempValues = samples.map(s => s.temperature).filter(v => v !== null);
    const salinityValues = samples.map(s => s.salinity).filter(v => v !== null);

    const stats = {
      total_samples: totalSamples,
      pending_samples: pendingSamples,
      approved_samples: approvedSamples,
      rejected_samples: rejectedSamples,
      under_review_samples: underReviewSamples,
      avg_ph: avg(phValues),
      avg_temperature: avg(tempValues),
      avg_salinity: avg(salinityValues),
    };

    // 7️⃣ Samples by type
    const samplesByType = await prisma.samples.groupBy({
      by: ['sample_type'],
      where,
      _count: { sample_type: true },
    });

    // 8️⃣ Samples by status
    const samplesByStatus = await prisma.samples.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    });

    // 9️⃣ Samples trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const samplesTrendRaw = await prisma.samples.groupBy({
      by: ["collection_datetime"],
      where: {
        collection_datetime: { gte: thirtyDaysAgo },
        ...(sampleType && sampleType !== "all" && { sample_type: sampleType }),
      },
      _count: true,
      orderBy: { collection_datetime: 'asc' },
    });

    const samplesTrend = samplesTrendRaw.map(item => ({
      date: item.collection_datetime.toISOString().split("T")[0],
      count: item._count,
    }));

    // 🔟 Top users by sample count
    const topUsers = await prisma.samples.groupBy({
      by: ['users_id'],
      where,
      _count: { users_id: true },
      orderBy: { _count: { users_id: 'desc' } },
      take: 10,
    });

    // 1️⃣1️⃣ Add user details
    const topUsersWithDetails = await Promise.all(
      topUsers.map(async (item) => {
        const user = await prisma.users.findUnique({
          where: { users_id: item.users_id },
          select: { users_id: true, first_name: true, last_name: true, email: true },
        });
        return {
          ...user,
          user_name: `${user.first_name} ${user.last_name}`,
          sample_count: item._count.users_id,
        };
      })
    );

    // 1️⃣2️⃣ Final analytics object
    const analytics = {
      overview: stats,
      samplesByType: samplesByType.map(item => ({
        sample_type: item.sample_type,
        count: item._count.sample_type,
      })),
      samplesByStatus: samplesByStatus.map(item => ({
        status: item.status,
        count: item._count.status,
      })),
      samplesTrend,
      topUsers: topUsersWithDetails,
    };

    // 1️⃣3️⃣ Cache analytics for 10 minutes
    await redis.setex(cacheKey, 600, JSON.stringify(analytics));

    res.status(200).json({
      success: true,
      analytics,
      cached: false,
    });

  } catch (error) {
    logger.error("Get sample analytics error:", { error: error.message, stack: error.stack });
    return next(new ErrorHandler("Failed to fetch analytics: " + error.message, 500));
  }
});


// Bulk update sample status (Admin)
exports.bulkUpdateSampleStatus = catchAsyncErrors(async (req, res, next) => {
  try {
    const { sampleIds, status } = req.body;

    if (req.user?.role !== "admin" && !req.admin?.admins_id) {
      return next(new ErrorHandler("Admin access required", 403));
    }

    if (!Array.isArray(sampleIds) || sampleIds.length === 0) {
      return next(new ErrorHandler("Sample IDs array is required", 400));
    }

    // Validate status
    const validStatuses = ["pending", "approved", "rejected", "under_review"];
    if (!validStatuses.includes(status)) {
      return next(new ErrorHandler("Invalid status value", 400));
    }

    // Update all samples
    const result = await prisma.samples.updateMany({
      where: {
        samples_id: { in: sampleIds.map(id => parseInt(id)) },
      },
      data: { status },
    });

    // Invalidate caches for all affected samples
    for (const id of sampleIds) {
      await redis.del(getSampleCacheKey(id));
    }

    // Get affected users to clear their cache
    const affectedSamples = await prisma.samples.findMany({
      where: {
        samples_id: { in: sampleIds.map(id => parseInt(id)) },
      },
      select: { users_id: true },
      distinct: ['users_id'],
    });

    for (const sample of affectedSamples) {
      const userSampleKeys = await redis.keys(`user:${sample.users_id}:samples:*`);
      if (userSampleKeys.length > 0) {
        await redis.del(...userSampleKeys);
      }
    }

    // Log action
    await LogService.write(
      req.admin?.admins_id || req.user.users_id,
      "BULK_STATUS_UPDATE",
      `Bulk updated ${result.count} samples to status: ${status}`
    );

    res.status(200).json({
      success: true,
      message: `${result.count} samples updated to ${status}`,
      updatedCount: result.count,
    });
  } catch (error) {
    logger.error("Bulk update sample status error:", {
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to bulk update: " + error.message, 500));
  }
});