const Redis = require("ioredis");
require("dotenv").config();

const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
  connectTimeout: 10000,
  tls: { rejectUnauthorized: false } // Required for Upstash
});

redis.once("connect", () => console.log("🟢 Redis CONNECTED"));
redis.on("error", (err) => console.log("🔴 Redis ERROR:", err.message));

module.exports = redis;
