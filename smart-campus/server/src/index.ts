import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import prisma from './config/prisma';

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ SQLite Database connected successfully via Prisma');

    const server = app.listen(PORT, () => {
      console.log(`🚀 Smart Campus Server running on http://localhost:${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    });

    const shutdown = async () => {
      console.log('\nGracefully shutting down Smart Campus Server...');
      server.close(async () => {
        await prisma.$disconnect();
        console.log('Prisma disconnected. Server closed cleanly.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('❌ Failed to start Smart Campus Server:', error);
    process.exit(1);
  }
}

startServer();
