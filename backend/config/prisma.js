const { PrismaClient } = require('@prisma/client');

let prisma;

if (!global.prisma) {
  global.prisma = new PrismaClient();
}

prisma = global.prisma;

async function connectDB() {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL connected via Prisma!');
  } catch (err) {
    console.error('❌ Failed to connect to PostgreSQL:', err);
    // ❌ Don't exit on serverless
  }
}

module.exports = { prisma, connectDB };
