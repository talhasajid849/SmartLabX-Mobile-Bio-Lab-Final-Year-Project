const { prisma } = require("../config/prisma");
const logger = require("../logs/looger");

class NotificationService {
  static async add(userId, title, message, type) {
    if (!userId) return;

    try {
      await prisma.notifications.create({
        data: {
          user_id: userId,
          title,
          message,
          type,
        },
      });
    } catch (error) {
      logger.error("Failed to add notification", {
        message: error.message,
        code: error.code || null,
        stack: error.stack,
      });
    }
  }
}

module.exports = NotificationService;
