const { prisma } = require("../config/prisma");
const logger = require("../logs/looger");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const LogService = require("../services/logService");
const NotificationService = require("../services/NotificationService");
const ErrorHandler = require("../utils/Errorhandler");
const redis = require("../utils/redis");

// Cache key helpers
const getReservationCacheKey = (requestId) => `reservation:${requestId}`;
const getUserReservationsCacheKey = (userId) => `user:${userId}:reservations`;
const getAllReservationsCacheKey = (page, limit, search, status) =>
  `reservations:all:page:${page}:limit:${limit}:search:${
    search || "none"
  }:status:${status || "all"}`;
const getAvailableSlotsCacheKey = (date) => `available_slots:${date}`;

// Create new reservation
exports.createReservation = catchAsyncErrors(async (req, res, next) => {
  try {
    const { request_date, request_time, purpose } = req.body;
    if (!req.user?.users_id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }
    
    // Validate required fields
    if (!request_date || !request_time) {
      return next(new ErrorHandler("Request date and time are required", 400));
    }
    
    // Validate date format
    const requestDate = new Date(request_date);
    if (isNaN(requestDate.getTime())) {
      return next(new ErrorHandler("Invalid date format", 400));
    }
    
    // Convert request_date + request_time into a single Date object
    const [hours, minutes, seconds] = request_time.split(":").map(Number);
    const requestDateTime = new Date(requestDate);
    requestDateTime.setHours(hours, minutes, seconds, 0);
    
    console.log(request_date, request_time, purpose)
    // Check if date/time is in the past
    const now = new Date();
    if (requestDateTime < now) {
      return next(new ErrorHandler("Cannot book a reservation in the past", 400));
    }

   const conflicts = await prisma.mobileLabRequests.findMany({
  where: {
    request_date: requestDate,
    request_time: requestDateTime,
    status: { not: "cancelled" },
  },
});


    if (conflicts.length > 0) {
      return next(
        new ErrorHandler(
          "This time slot is already booked. Please choose another time.",
          409
        )
      );
    }

    // Create new mobile lab request
    const reservation = await prisma.mobileLabRequests.create({
      data: {
        users_id: req.user.users_id,
        request_date: requestDate,      // Only date part
        request_time: requestDateTime,  // Full DateTime for Prisma
        purpose: purpose || null,
        status: "pending",
      },
    });

    // Invalidate caches
    await redis.del(getUserReservationsCacheKey(req.user.users_id));
    await redis.del(getAvailableSlotsCacheKey(request_date));

    // Clear all reservations list cache
    const allReservationKeys = await redis.keys("reservations:all:*");
    if (allReservationKeys.length > 0) {
      await redis.del(...allReservationKeys);
    }

    // Add notification
    await NotificationService.add(
      req.user.users_id,
      "Mobile Lab Request Created",
      `Your mobile bio lab request for ${request_date} at ${request_time} has been submitted and is pending approval.`,
      "info"
    );

    // Log action
    await LogService.write(
      req.user.users_id,
      "CREATED",
      `Lab Request submitted - ID: ${reservation.request_id}`
    );

    res.status(201).json({
      success: true,
      message: "Mobile lab request created successfully",
      request_id: reservation.request_id,
      reservation,
    });
  } catch (error) {
    logger.error("Create reservation error:", {
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });
    return next(
      new ErrorHandler("Failed to create reservation: " + error.message, 500)
    );
  }
});


// Get all requests for logged-in user
exports.getMyReservations = catchAsyncErrors(async (req, res, next) => {
  try {
    if (!req.user?.users_id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    const cacheKey = getUserReservationsCacheKey(req.user.users_id);

    // Check Redis cache
    const cachedReservations = await redis.get(cacheKey);
    if (cachedReservations) {
      return res.status(200).json({
        success: true,
        ...JSON.parse(cachedReservations),
        cached: true,
      });
    }

    // Fetch from database
    const requests = await prisma.mobileLabRequests.findMany({
      where: { users_id: req.user.users_id },
      orderBy: [{ request_date: "desc" }, { request_time: "desc" }],
      select: {
        request_id: true,
        request_date: true,
        request_time: true,
        purpose: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
    });

    const response = {
      success: true,
      count: requests.length,
      requests,
    };

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(response));

    res.status(200).json({ ...response, cached: false });
  } catch (error) {
    logger.error("Get my reservations error:", {
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });
    return next(
      new ErrorHandler("Failed to fetch reservations: " + error.message, 500)
    );
  }
});

// Get all reservations with search, filter, pagination (Admin)
exports.getAllReservations = catchAsyncErrors(async (req, res, next) => {
  try {
    let { page = 1, limit = 10, search = "", status = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    const cacheKey = getAllReservationsCacheKey(page, limit, search, status);

    // Check Redis cache
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        ...JSON.parse(cachedData),
        cached: true,
      });
    }

    // Build where clause
    const where = {};
    
    // Add status filter (outside of search)
    if (status && status !== "all") {
      where.status = status;
    }
    
    // Add search filter
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      
      // Check if search matches a status enum value
      const statusEnumValues = ['pending', 'confirmed', 'cancelled', 'completed'];
      const matchingStatuses = statusEnumValues.filter(s => 
        s.includes(searchTerm)
      );
      
      // Build OR conditions for search
      const searchConditions = [
        // Search in purpose (string field - can use contains)
        { purpose: { contains: searchTerm, mode: "insensitive" } },
        
        // Search in user fields
        { user: { first_name: { contains: searchTerm, mode: "insensitive" } } },
        { user: { last_name: { contains: searchTerm, mode: "insensitive" } } },
        { user: { email: { contains: searchTerm, mode: "insensitive" } } },
      ];
      
      // Add status matches if any (enum field - use 'in' instead of 'contains')
      if (matchingStatuses.length > 0) {
        searchConditions.push({
          status: { in: matchingStatuses }
        });
      }
      
      where.OR = searchConditions;
    }

    console.log("Search Query:", {
      search,
      status,
      where: JSON.stringify(where, null, 2)
    });

    // Fetch reservations with user details
    const [reservations, totalCount] = await Promise.all([
      prisma.mobileLabRequests.findMany({
        where,
        include: {
          user: {
            select: {
              first_name: true,
              last_name: true,
              email: true,
              mobile_no: true,
            },
          },
        },
        orderBy: [{ request_date: "desc" }, { request_time: "desc" }],
        skip,
        take: limit,
      }),
      prisma.mobileLabRequests.count({ where }),
    ]);

    // console.log("Results found:", totalCount);

    const response = {
      success: true,
      requests: reservations,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };

    // Cache for 3 minutes
    await redis.setex(cacheKey, 180, JSON.stringify(response));

    res.status(200).json({ ...response, cached: false });
  } catch (error) {
    logger.error("Get all reservations error:", {
      error: error.message,
      stack: error.stack,
      query: req.query,
    });
    return next(
      new ErrorHandler("Failed to fetch reservations: " + error.message, 500)
    );
  }
});


// Get single request (by ID)
exports.getReservationById = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(parseInt(id))) {
      return next(new ErrorHandler("Invalid reservation ID", 400));
    }

    const cacheKey = getReservationCacheKey(id);

    // Check cache
    const cachedReservation = await redis.get(cacheKey);
    if (cachedReservation) {
      const reservation = JSON.parse(cachedReservation);

      // Access control check
      const isAdmin = req.user.role != "admin" ? true : false;
      if (!isAdmin && reservation.users_id !== req.user?.users_id) {
        return next(
          new ErrorHandler("Unauthorized access to this reservation", 403)
        );
      }

      return res.status(200).json({
        success: true,
        request: reservation,
        cached: true,
      });
    }

    // Access control
    const isAdmin = req.user.role == "admin" ? true : false;
    const where = {
      request_id: parseInt(id),
      ...(!isAdmin && { users_id: req.user?.users_id }),
    };

    const request = await prisma.mobileLabRequests.findFirst({
      where,
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            mobile_no: true,
            city: true,
          },
        },
      },
    });

    if (!request) {
      return next(new ErrorHandler("Request not found", 404));
    }

    // Cache for 10 minutes
    await redis.setex(cacheKey, 600, JSON.stringify(request));

    res.status(200).json({
      success: true,
      request,
      cached: false,
    });
  } catch (error) {
    logger.error("Get reservation by ID error:", {
      reservationId: req.params.id,
      error: error.message,
      stack: error.stack,
    });
    return next(
      new ErrorHandler("Failed to fetch reservation: " + error.message, 500)
    );
  }
});

// Update request status (Admin)
exports.updateReservationStatus = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (req.user.role != "admin") {
      return next(new ErrorHandler("Admin access required", 403));
    }

    if (!id || isNaN(parseInt(id))) {
      return next(new ErrorHandler("Invalid reservation ID", 400));
    }

    // Validate status
    const validStatuses = ["pending", "confirmed", "cancelled", "completed"];
    if (!validStatuses.includes(status)) {
      return next(new ErrorHandler("Invalid status value", 400));
    }

    const request = await prisma.mobileLabRequests.findUnique({
      where: { request_id: parseInt(id) },
      include: {
        user:  {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    if (!request) {
      return next(new ErrorHandler("Request not found", 404));
    }

    // Update status
    await prisma.mobileLabRequests.update({
      where: { request_id: parseInt(id) },
      data: { status },
    });

    // Invalidate caches
    await redis.del(getReservationCacheKey(id));
    await redis.del(getUserReservationsCacheKey(request.users_id));

    // Clear all reservations list cache
    const allReservationKeys = await redis.keys("reservations:all:*");
    if (allReservationKeys.length > 0) {
      await redis.del(...allReservationKeys);
    }

    // Add notification for user
    const statusMessages = {
      confirmed: "Your mobile lab request has been confirmed!",
      cancelled: "Your mobile lab request has been cancelled.",
      completed: "Your mobile lab request has been marked as completed.",
      pending: "Your mobile lab request status has been changed to pending.",
    };

    await NotificationService.add(
      request.users_id,
      "Request Status Updated",
      statusMessages[status] || "Your request status has been updated.",
      status === "confirmed" ? "success" : "info"
    );

    // Log action
    await LogService.write(
      req.user.users_id,
      "REQUEST_UPDATED",
      `Updated request ID ${id} status to: ${status}`
    );

    res.status(200).json({
      success: true,
      message: "Request status updated successfully",
    });
  } catch (error) {
    logger.error("Update reservation status error:", {
      reservationId: req.params.id,
      error: error.message,
      stack: error.stack,
    });
    return next(
      new ErrorHandler("Failed to update status: " + error.message, 500)
    );
  }
});

// Cancel request (User)
exports.cancelReservation = catchAsyncErrors(async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.user?.users_id) {
      return next(new ErrorHandler("Unauthorized", 401));
    }

    if (!id || isNaN(parseInt(id))) {
      return next(new ErrorHandler("Invalid reservation ID", 400));
    }

    const request = await prisma.mobileLabRequests.findFirst({
      where: {
        request_id: parseInt(id),
        users_id: req.user.users_id,
      },
    });

    if (!request) {
      return next(new ErrorHandler("Request not found", 404));
    }

    if (request.status === "completed") {
      return next(new ErrorHandler("Cannot cancel completed request", 400));
    }

    if (request.status === "cancelled") {
      return next(new ErrorHandler("Request is already cancelled", 400));
    }

    // Update to cancelled
    await prisma.mobileLabRequests.update({
      where: { request_id: parseInt(id) },
      data: { status: "cancelled" },
    });

    // Invalidate caches
    await redis.del(getReservationCacheKey(id));
    await redis.del(getUserReservationsCacheKey(req.user.users_id));
    await redis.del(
      getAvailableSlotsCacheKey(
        request.request_date.toISOString().split("T")[0]
      )
    );

    // Clear all reservations list cache
    const allReservationKeys = await redis.keys("reservations:all:*");
    if (allReservationKeys.length > 0) {
      await redis.del(...allReservationKeys);
    }

    // Log action
    await LogService.write(
      req.user.users_id,
      "CANCELLED",
      `Request cancelled - ID: ${id}`
    );

    res.status(200).json({
      success: true,
      message: "Request cancelled successfully",
    });
  } catch (error) {
    logger.error("Cancel reservation error:", {
      reservationId: req.params.id,
      userId: req.user?.users_id,
      error: error.message,
      stack: error.stack,
    });
    return next(
      new ErrorHandler("Failed to cancel reservation: " + error.message, 500)
    );
  }
});

// Get available time slots
exports.getAvailableSlots = catchAsyncErrors(async (req, res, next) => {
  try {
    const { date } = req.query;

    if (!date) {
      return next(new ErrorHandler("Date is required", 400));
    }

    // Validate date format
    const requestDate = new Date(date);
    if (isNaN(requestDate.getTime())) {
      return next(new ErrorHandler("Invalid date format", 400));
    }

    const cacheKey = getAvailableSlotsCacheKey(date);

    // Check cache
    const cachedSlots = await redis.get(cacheKey);
    if (cachedSlots) {
      return res.status(200).json({
        success: true,
        ...JSON.parse(cachedSlots),
        cached: true,
      });
    }

    // Get booked slots for that date
    const booked = await prisma.mobileLabRequests.findMany({
      where: {
        request_date: requestDate,
        status: { not: "cancelled" },
      },
      select: {
        request_time: true,
      },
    });

    const bookedTimes = booked.map((slot) => slot.request_time);

    // Working hours: 9 AM to 5 PM
    const workingHours = [];
    for (let hour = 9; hour < 17; hour++) {
      const time = `${hour.toString().padStart(2, "0")}:00:00`;
      const isBooked = bookedTimes.includes(time);

      workingHours.push({
        time,
        displayTime: `${hour.toString().padStart(2, "0")}:00`,
        available: !isBooked,
      });
    }

    const response = {
      success: true,
      date,
      slots: workingHours,
      totalSlots: workingHours.length,
      availableSlots: workingHours.filter((s) => s.available).length,
      bookedSlots: workingHours.filter((s) => !s.available).length,
    };

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(response));

    res.status(200).json({ ...response, cached: false });
  } catch (error) {
    logger.error("Get available slots error:", {
      date: req.query.date,
      error: error.message,
      stack: error.stack,
    });
    return next(
      new ErrorHandler("Failed to fetch available slots: " + error.message, 500)
    );
  }
});

// Get reservation statistics (Admin)
exports.getReservationStats = catchAsyncErrors(async (req, res, next) => {
  try {
    const cacheKey = "reservation:stats";

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
    const [total, pending, confirmed, cancelled, completed] = await Promise.all(
      [
        prisma.mobileLabRequests.count(),
        prisma.mobileLabRequests.count({ where: { status: "pending" } }),
        prisma.mobileLabRequests.count({ where: { status: "confirmed" } }),
        prisma.mobileLabRequests.count({ where: { status: "cancelled" } }),
        prisma.mobileLabRequests.count({ where: { status: "completed" } }),
      ]
    );

    // Get today's reservations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayReservations = await prisma.mobileLabRequests.count({
      where: {
        request_date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Get this week's reservations
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const thisWeekReservations = await prisma.mobileLabRequests.count({
      where: {
        request_date: {
          gte: startOfWeek,
        },
      },
    });

    const stats = {
      total,
      byStatus: {
        pending,
        confirmed,
        cancelled,
        completed,
      },
      today: todayReservations,
      thisWeek: thisWeekReservations,
    };

    // Cache for 10 minutes
    await redis.setex(cacheKey, 600, JSON.stringify(stats));

    res.status(200).json({
      success: true,
      stats,
      cached: false,
    });
  } catch (error) {
    logger.error("Get reservation stats error:", {
      error: error.message,
      stack: error.stack,
    });
    return next(
      new ErrorHandler("Failed to fetch statistics: " + error.message, 500)
    );
  }
});
