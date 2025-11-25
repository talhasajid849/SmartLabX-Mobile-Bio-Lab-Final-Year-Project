const { prisma } = require("../config/prisma");

const cleanupOldData = async ({ notificationDays = 90, logDays = 180 }) => {
  try {
    // Delete old notifications
    const notifDeleted = await prisma.notifications.deleteMany({
      where: {
        created_at: {
          lt: new Date(Date.now() - notificationDays * 24 * 60 * 60 * 1000),
        },
      },
    });
    console.log(`🗑 Deleted ${notifDeleted.count} notifications older than ${notificationDays} days`);

    // Delete old system logs
    const logDeleted = await prisma.systemLog.deleteMany({
      where: {
        timestamp: {
          lt: new Date(Date.now() - logDays * 24 * 60 * 60 * 1000),
        },
      },
    });
    console.log(`🗑 Deleted ${logDeleted.count} system logs older than ${logDays} days`);
  } catch (err) {
    console.error("❌ Cleanup service failed:", err);
  }
};

module.exports = cleanupOldData;
