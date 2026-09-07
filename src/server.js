const app = require('./app');
const { PORT } = require('./config/env');
const prisma = require('./config/prisma');

async function startServer() {
  try {
    // Check DB Connection
    await prisma.$connect();
    console.log('📦 Database PostgreSQL berhasil terhubung via Prisma.');

    const server = app.listen(PORT, () => {
      console.log(`🚀 SIM-RIDA Backend Server berjalan pada port ${PORT}`);
      console.log(`📡 URL API: http://localhost:${PORT}/api/v1`);
      console.log(`🩺 Health Check: http://localhost:${PORT}/api/v1/health`);
    });

    // Graceful Shutdown
    const shutdown = async (signal) => {
      console.log(`\n🛑 Menerima sinyal ${signal}. Menutup server secara aman...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('👋 Database terputus. Server berhenti.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('❌ Gagal menjalankan server:', error);
    process.exit(1);
  }
}

startServer();
