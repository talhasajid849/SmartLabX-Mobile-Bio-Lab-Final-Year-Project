require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const cookieParser = require("cookie-parser");
const ErrorMiddleware = require("./middleware/ErrorMiddleware");
const helmet = require("helmet");
const hpp = require("hpp");
const compression = require("compression");
const { connectDB } = require("./config/prisma");

const app = express();

// ------------ GLOBAL SECURITY MIDDLEWARES ------------
app.use(helmet());
app.use(hpp());
app.use(compression());

// ------------ PARSERS ------------
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// ------------ CORS ------------
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
    exposedHeaders: ["Content-Disposition"],
  })
);

// ------------ RATE LIMITING (GLOBAL) ------------
// app.use(apiLimiter);
// app.use(speedLimiter);

// ------------ STATIC ------------
app.use("/api/uploads", (req, res, next) => {
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
}, express.static(path.join(__dirname, "uploads")));

// ------------ ROUTES ------------
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/user", require("./routes/profileRoutes"));
app.use("/api/samples", require("./routes/sampleRoutes"));
app.use("/api/sensors", require("./routes/sensorRoutes"));
app.use("/api/protocols", require("./routes/protocolRoutes"));
app.use("/api/reservations", require("./routes/reservationRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

// ------------ TEST ROUTE ------------
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is Working!", timestamp: new Date() });
});

// ------------ ERROR HANDLER ------------
app.use(ErrorMiddleware);


// ------------ AUTO CLEAN NOTIFICATION + lOGS ------------
require("./jobs/cleanup.job");


// ------------ SERVER + DB ------------
(async function startServer() {
  await connectDB();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
})();

