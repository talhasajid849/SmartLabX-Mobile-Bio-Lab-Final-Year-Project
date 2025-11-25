const { prisma } = require("../config/prisma");
const logger = require("../logs/looger");

class LogService {
  static async write(userId, action, details = null) {
    if (!userId) return;
    try {
      await prisma.systemLog.create({
        data: { users_id: userId, action, details },
      });
    } catch (err) {
      logger.error("Failed to write log:", err);
    }
  }
}

module.exports = LogService;
