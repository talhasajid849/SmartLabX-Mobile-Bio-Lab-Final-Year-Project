const rateLimit = require("express-rate-limit");

module.exports = rateLimit({
    windowMs: 10 * 60 * 1000, // 10Min
    max: 5, // Only 5 Login Attempt
    message: "Too many login attempts. Try after 10 minutes.",
})