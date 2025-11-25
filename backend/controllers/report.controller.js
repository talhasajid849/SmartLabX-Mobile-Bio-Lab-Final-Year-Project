const { prisma } = require("../config/prisma");
const logger = require("../logs/looger");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const pdfGenerator = require("../services/pdfGenerator");
const ErrorHandler = require("../utils/Errorhandler");
const sendMail = require("../utils/sendEmail");
const crypto = require("crypto");
const redis = require("../utils/redis");
const NotificationService = require("../services/NotificationService")

// Cache key helpers
const getReportCacheKey = (reportId) => `report:${reportId}`;
const getUserReportsCacheKey = (userId, page = 1, limit = 20) => 
  `user:${userId}:reports:page:${page}:limit:${limit}`;
const getAllReportsCacheKey = (page = 1, limit = 20) => 
  `reports:all:page:${page}:limit:${limit}`;
const getSharedReportCacheKey = (token) => `report:shared:${token}`;

// Helper function to generate report content
function generateReportContent(sample) {
  let content = `# Sample Analysis Report: ${sample.sample_identifier}\n\n`;

  content += `## Sample Information\n`;
  content += `- **Sample ID**: ${sample.sample_identifier}\n`;
  content += `- **Sample Type**: ${sample.sample_type}\n`;
  content += `- **Collection Date & Time**: ${new Date(
    sample.collection_datetime
  ).toLocaleString()}\n`;

  // Location Information
  content += `\n## Location Details\n`;
  if (sample.geolocation) {
    content += `- **Geolocation**: ${sample.geolocation}\n`;
  }
  if (sample.latitude && sample.longitude) {
    content += `- **Coordinates**: ${sample.latitude}°N, ${sample.longitude}°E\n`;
    content += `- **Map Link**: https://www.google.com/maps?q=${sample.latitude},${sample.longitude}\n`;
  }

  // Environmental Conditions
  content += `\n## Environmental Conditions\n`;
  if (sample.temperature !== null)
    content += `- **Temperature**: ${sample.temperature}°C\n`;
  if (sample.ph !== null) content += `- **pH Level**: ${sample.ph}\n`;
  if (sample.salinity !== null)
    content += `- **Salinity**: ${sample.salinity} ppt\n`;

  // Notes
  if (sample.notes) {
    content += `\n## Field Notes\n${sample.notes}\n`;
  }

  content += `\n---\n*Report generated on ${new Date().toLocaleString()}*\n`;
  content += `*Mobile Bio Lab - ABC Laboratories*\n`;

  return content;
}

// Generate report for a sample
exports.generateReport = catchAsyncErrors(async (req, res, next) => {
  try {
    const { sampleId } = req.params;
    const { reportTitle, reportType } = req.body;

    if (!req.user?.users_id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    if (!sampleId || isNaN(parseInt(sampleId))) {
      return next(new ErrorHandler("Invalid sample ID", 400));
    }

    if (!reportTitle || !reportTitle.trim()) {
      return next(new ErrorHandler("Report title is required", 400));
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

    // Generate report content
    const reportContent = generateReportContent(sample);

    // Create report
    const report = await prisma.reports.create({
      data: {
        user_id: req.user.users_id,
        sample_id: parseInt(sampleId),
        title: reportTitle.trim(),
        status: 'completed',
        chart_data: JSON.stringify({
          type: reportType || "analysis",
          content: reportContent,
        }),
        generated_on: new Date(),
      },
    });

    // Invalidate cache
    const userReportKeys = await redis.keys(`user:${req.user.users_id}:reports:*`);
    if (userReportKeys.length > 0) {
      await redis.del(...userReportKeys);
    }

    const allReportKeys = await redis.keys('reports:all:*');
    if (allReportKeys.length > 0) {
      await redis.del(...allReportKeys);
    }

    // Create notification
    await NotificationService.add(
      req.user.users_id,
      "Report Generated",
      `Report "${reportTitle}" has been generated for sample ${sample.sample_identifier}`,
      "success"
    );

    // Log action
    await LogService.write(
      req.user.users_id,
      "CREATED",
      `Report generated for sample ID: ${sampleId} - ${reportTitle}`
    );

    res.status(201).json({
      success: true,
      message: "Report generated successfully",
      reportId: report.report_id,
      report: {
        report_id: report.report_id,
        title: report.title,
        status: report.status,
        generated_on: report.generated_on,
        content: reportContent,
      },
    });
  } catch (error) {
    logger.error("Generate report error:", {
      userId: req.user?.users_id,
      sampleId: req.params.sampleId,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to generate report: " + error.message, 500));
  }
});

// Get all reports for user
exports.getMyReports = catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.user?.users_id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const cacheKey = getUserReportsCacheKey(req.user.users_id, page, limit);

    // Check cache
    const cachedReports = await redis.get(cacheKey);
    if (cachedReports) {
      return res.status(200).json({
        success: true,
        ...JSON.parse(cachedReports),
        cached: true,
      });
    }

    // Fetch from database
    const [reports, totalCount] = await Promise.all([
      prisma.reports.findMany({
        where: { user_id: req.user.users_id },
        include: {
          sample: {
            select: {
              sample_identifier: true,
              sample_type: true,
              collection_datetime: true,
            },
          },
        },
        orderBy: { generated_on: 'desc' },
        skip,
        take: limit,
      }),
      prisma.reports.count({
        where: { user_id: req.user.users_id },
      }),
    ]);

    const response = {
      success: true,
      count: totalCount,
      reports,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(response));

    res.status(200).json({ ...response, cached: false });
  } catch (error) {
    logger.error("Get my reports error:", {
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to fetch reports: " + error.message, 500));
  }
});

// Get single report
exports.getReportById = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.user?.users_id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    if (!id || isNaN(parseInt(id))) {
      return next(new ErrorHandler("Invalid report ID", 400));
    }

    const cacheKey = getReportCacheKey(id);

    // Check cache
    const cachedReport = await redis.get(cacheKey);
    if (cachedReport) {
      const report = JSON.parse(cachedReport);
      if (report.user_id !== req.user.users_id) {
        return next(new ErrorHandler("Unauthorized access to this report", 403));
      }
      return res.status(200).json({
        success: true,
        report,
        cached: true,
      });
    }

    // Fetch from database
    const report = await prisma.reports.findFirst({
      where: {
        report_id: parseInt(id),
        user_id: req.user.users_id,
      },
      include: {
        sample: true,
      },
    });

    if (!report) {
      return next(new ErrorHandler("Report not found", 404));
    }

    // Cache for 10 minutes
    await redis.setex(cacheKey, 600, JSON.stringify(report));

    res.status(200).json({
      success: true,
      report,
      cached: false,
    });
  } catch (error) {
    logger.error("Get report by ID error:", {
      reportId: req.params.id,
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to fetch report: " + error.message, 500));
  }
});

// Export report as PDF
exports.exportReport = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.user?.users_id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    const report = await prisma.reports.findFirst({
      where: {
        report_id: parseInt(id),
        user_id: req.user.users_id,
      },
      include: {
        sample: true,
      },
    });

    if (!report) {
      return next(new ErrorHandler("Report not found", 404));
    }

    // Generate PDF
    const pdfBuffer = await pdfGenerator.generateSampleReport(report);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Report-${report.title.replace(
        /[^a-z0-9]/gi,
        "-"
      )}-${Date.now()}.pdf`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    logger.error("Export report error:", {
      reportId: req.params.id,
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to export report: " + error.message, 500));
  }
});

// Delete report
exports.deleteReport = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.user?.users_id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    if (!id || isNaN(parseInt(id))) {
      return next(new ErrorHandler("Invalid report ID", 400));
    }

    const report = await prisma.reports.findFirst({
      where: {
        report_id: parseInt(id),
        user_id: req.user.users_id,
      },
    });

    if (!report) {
      return next(new ErrorHandler("Report not found", 404));
    }

    // Delete report
    await prisma.reports.delete({
      where: { report_id: parseInt(id) },
    });

    // Invalidate cache
    await redis.del(getReportCacheKey(id));
    
    const userReportKeys = await redis.keys(`user:${req.user.users_id}:reports:*`);
    if (userReportKeys.length > 0) {
      await redis.del(...userReportKeys);
    }

    // Log action
    await LogService.write(
      req.user.users_id,
      "DELETED",
      `Report deleted - ID: ${id}, Title: ${report.title}`
    );

    res.status(200).json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (error) {
    logger.error("Delete report error:", {
      reportId: req.params.id,
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to delete report: " + error.message, 500));
  }
});

// Share report via email
exports.shareReportViaEmail = catchAsyncErrors(async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const { email } = req.body;

    if (!req.user?.users_id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    if (!email || !email.includes("@")) {
      return next(new ErrorHandler("Valid email is required", 400));
    }

    const report = await prisma.reports.findFirst({
      where: {
        report_id: parseInt(reportId),
        user_id: req.user.users_id,
      },
    });

    if (!report) {
      return next(new ErrorHandler("Report not found", 404));
    }

    const shareToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create share record
    await prisma.reportShares.create({
      data: {
        report_id: parseInt(reportId),
        shared_by: req.user.users_id,
        shared_with_email: email,
        share_token: shareToken,
        expires_at: expiresAt,
      },
    });

    const shareLink = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/report/shared/${shareToken}`;

    // Send email
    const user = await prisma.users.findUnique({
      where: { users_id: req.user.users_id },
      select: { first_name: true, last_name: true },
    });

    await sendMail({
      email,
      subject: "Mobile Bio Lab - Report Shared With You",
      template: "reportShare.ejs",
      data: {
        reportIdentifier: report.title || `Report #${reportId}`,
        reportLink: shareLink,
        senderName: `${user.first_name} ${user.last_name}`,
        expiresAt: expiresAt.toLocaleDateString(),
      },
    });

    // Log action
    await LogService.write(
      req.user.users_id,
      "SHARED",
      `Report #${reportId} shared with ${email}`
    );

    res.status(200).json({
      success: true,
      message: `Report shared successfully with ${email}`,
      shareLink,
      expiresAt,
    });
  } catch (error) {
    logger.error("Share report error:", {
      reportId: req.params.reportId,
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to share report: " + error.message, 500));
  }
});

exports.sharedReportAccess = catchAsyncErrors(async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return next(new ErrorHandler("Invalid share token", 400));
    }

    const cacheKey = getSharedReportCacheKey(token);

    // Check cache
    const cachedReport = await redis.get(cacheKey);
    if (cachedReport) {
      return res.status(200).json({
        success: true,
        report: JSON.parse(cachedReport),
        message: "Shared report accessed successfully",
        cached: true,
      });
    }

    // Fetch from database
    const share = await prisma.reportShares.findFirst({
      where: {
        share_token: token,
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } },
        ],
      },
      include: {
        report: {
          include: {
            sample: true, // singular because of your schema
          },
        },
      },
    });

    if (!share) {
      return next(new ErrorHandler("Report not found or link expired", 404));
    }

    // Construct response
   const reportData = {
  report_id: share.report.report_id,
  title: share.report.title,
  status: share.report.status,
  generated_on: share.report.generated_on,
  chart_data: share.report.chart_data,
  sample_id: share.report.sample?.samples_id || null,
  sample_identifier: share.report.sample?.sample_identifier || null,
  sample_type: share.report.sample?.sample_type || null,
  collection_datetime: share.report.sample?.collection_datetime || null,
  geolocation: share.report.sample?.geolocation || null,
  latitude: share.report.sample?.latitude || null,
  longitude: share.report.sample?.longitude || null,
  ph: share.report.sample?.ph || null,
  temperature: share.report.sample?.temperature || null,
  salinity: share.report.sample?.salinity || null,
  notes: share.report.sample?.notes || null,
  qr_code_data: share.report.sample?.qr_code_data || null,
  shared_with_email: share.shared_with_email,
  expires_at: share.expires_at,
};


    // Cache for 15 minutes
    await redis.setex(cacheKey, 900, JSON.stringify(reportData));

    res.status(200).json({
      success: true,
      report: reportData,
      message: "Shared report accessed successfully",
      cached: false,
    });
  } catch (error) {
    logger.error("Access shared report error:", {
      token: req.params.token,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to access report: " + error.message, 500));
  }
});


// Export shared report as PDF (public route)
exports.exportSharedReport = catchAsyncErrors(async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return next(new ErrorHandler("Invalid share token", 400));
    }

    const share = await prisma.reportShares.findFirst({
      where: {
        share_token: token,
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } },
        ],
      },
      include: {
        report: {
          include: {
            sample: true,
          },
        },
      },
    });

    if (!share) {
      return next(new ErrorHandler("Report not found or link expired", 404));
    }

    const pdfBuffer = await pdfGenerator.generateSampleReport(share.reports);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Shared-Report-${share.report.title.replace(
        /[^a-z0-9]/gi,
        "-"
      )}-${Date.now()}.pdf`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    logger.error("Export shared report error:", {
      token: req.params.token,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to export report: " + error.message, 500));
  }
});

// ===============================
// ADMIN ROUTES
// ===============================

// Get all reports (Admin)
exports.getAllReports = catchAsyncErrors(async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const cacheKey = getAllReportsCacheKey(page, limit);

    // Check cache
    const cachedReports = await redis.get(cacheKey);
    if (cachedReports) {
      return res.status(200).json({
        success: true,
        ...JSON.parse(cachedReports),
        cached: true,
      });
    }

    // Fetch from database
    const [reports, totalCount] = await Promise.all([
      prisma.reports.findMany({
        include: {
          user: {
            select: {
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          sample: {
            select: {
              sample_identifier: true,
              sample_type: true,
              collection_datetime: true,
            },
          },
        },
        orderBy: { generated_on: 'desc' },
        skip,
        take: limit,
      }),
      prisma.reports.count(),
    ]);

    const response = {
      success: true,
      count: totalCount,
      reports,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(response));

    res.status(200).json({ ...response, cached: false });
  } catch (error) {
    logger.error("Get all reports error:", {
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to fetch reports: " + error.message, 500));
  }
});

// Get single report by ID (Admin)
exports.getReportByIdAdmin = catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return next(new ErrorHandler('Admin access required', 403));
    }

    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return next(new ErrorHandler("Invalid report ID", 400));
    }

    const report = await prisma.reports.findUnique({
      where: { report_id: parseInt(id) },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        sample: true,
      },
    });

    if (!report) {
      return next(new ErrorHandler('Report not found', 404));
    }

    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    logger.error("Get report by ID (admin) error:", {
      reportId: req.params.id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to fetch report: " + error.message, 500));
  }
});

// Export report to PDF (Admin)
exports.exportReportAdmin = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return next(new ErrorHandler("Invalid report ID", 400));
    }

    const report = await prisma.reports.findUnique({
      where: { report_id: parseInt(id) },
      include: {
        sample: true,
      },
    });

    if (!report) {
      return next(new ErrorHandler('Report not found', 404));
    }

    const pdfBuffer = await pdfGenerator.generateSampleReport(report);

    const safeTitle = (report.title || "Report")
      .toString()
      .replace(/\W+/g, '-');

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${safeTitle}-${Date.now()}.pdf`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    res.send(pdfBuffer);
  } catch (error) {
    logger.error("Export report (admin) error:", {
      reportId: req.params.id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to export report: " + error.message, 500));
  }
});

// Delete report (Admin)
exports.deleteReportAdmin = catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.user.users_id) {
      return next(new ErrorHandler("Admin access required", 403));
    }

    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return next(new ErrorHandler("Invalid report ID", 400));
    }

    const report = await prisma.reports.findUnique({
      where: { report_id: parseInt(id) },
    });

    if (!report) {
      return next(new ErrorHandler('Report not found', 404));
    }

    // Delete report
    await prisma.reports.delete({
      where: { report_id: parseInt(id) },
    });

    // Invalidate caches
    await redis.del(getReportCacheKey(id));
    
    const userReportKeys = await redis.keys(`user:${report.user_id}:reports:*`);
    if (userReportKeys.length > 0) {
      await redis.del(...userReportKeys);
    }

    const allReportKeys = await redis.keys('reports:all:*');
    if (allReportKeys.length > 0) {
      await redis.del(...allReportKeys);
    }

    // Log action
    await LogService.write(req.user.users_id, 'DELETED', `Report ID ${id} deleted by admin`);

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    logger.error("Delete report (admin) error:", {
      reportId: req.params.id,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to delete report: " + error.message, 500));
  }
});

// Share report via email (Admin)
exports.shareReportViaEmailAdmin = catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return next(new ErrorHandler('Admin access required', 403));
    }

    const { reportId } = req.params;
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      return next(new ErrorHandler('Valid email is required', 400));
    }

    const report = await prisma.reports.findUnique({
      where: { report_id: parseInt(reportId) },
    });

    if (!report) {
      return next(new ErrorHandler('Report not found', 404));
    }

    const shareToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await prisma.reportShares.create({
      data: {
        report_id: parseInt(reportId),
        shared_by: req.user.users_id,
        shared_with_email: email,
        share_token: shareToken,
        expires_at: expiresAt,
      },
    });

    const reportLink = `${process.env.FRONTEND_URL}/report/shared/${shareToken}`;

    await sendMail({
      email,
      subject: 'Report Shared With You',
      template: 'reportShare.ejs',
      data: {
        reportIdentifier: report.title,
        reportLink,
        senderName: req.user.name || 'Admin',
        expiresAt: expiresAt.toLocaleDateString(),
      },
    });

    await LogService.write(req.user.users_id, 'SHARED', `Report ${reportId} shared with ${email} by admin`);

    res.status(200).json({
      success: true,
      message: `Report shared successfully with ${email}`,
      reportLink,
    });
  } catch (error) {
    logger.error("Share report (admin) error:", {
      reportId: req.params.reportId,
      error: error.message,
      stack: error.stack,
    });
    return next(new ErrorHandler("Failed to share report: " + error.message, 500));
  }
});