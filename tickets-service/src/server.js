require('dotenv').config();

const buildApp = require('./app');

const PORT = Number(process.env.PORT || 3003);
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  const app = buildApp();

  try {
    await app.listen({
      port: PORT,
      host: HOST,
    });

    console.log(`tickets-service running on http://${HOST}:${PORT}`);
  } catch (error) {
    console.error('Error starting tickets-service:', error);
    process.exit(1);
  }
}

start();
