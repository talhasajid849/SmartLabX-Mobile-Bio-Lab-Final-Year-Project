const jwt = require("jsonwebtoken");
const ErrorHandler = require("../utils/Errorhandler");

const isAuthenticated = (req, res, next) => {
  // Extract token from cookies (alter if you use headers instead)
  const token = req.cookies?.token;

  if (!token) {
    return next(new ErrorHandler("Authentication token missing", 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_TOKEN);

    // Attach user payload to request for access in controllers
    req.user = {
      users_id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };

    next();
  } catch (error) {
    return next(new ErrorHandler("Invalid or expired token", 401));
  }
};

module.exports = isAuthenticated;
