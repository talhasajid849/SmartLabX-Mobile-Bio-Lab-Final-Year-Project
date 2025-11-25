const cron = require("node-cron");
const cleanupOldData = require("../services/cleanup.service");

// Schedule: Every day at 2:00 AM
cron.schedule("0 2 * * *", async () => {
  console.log("🕒 Running daily cleanup job...");
  await cleanupOldData({ notificationDays: 90, logDays: 180 });
});
