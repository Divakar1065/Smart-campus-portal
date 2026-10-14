/**
 * Academic Progress and Achievement Tracking System (ATS)
 * Health & Diagnostic Controller
 */

const db = require('../config/db');

async function getHealth(req, res) {
  const dbHealth = await db.checkHealth();
  const isHealthy = dbHealth.status === 'connected';

  const payload = {
    status: isHealthy ? 'online' : 'degraded',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: {
      status: dbHealth.status,
      provider: dbHealth.provider,
      ...(dbHealth.responseTimeMs !== undefined && { responseTimeMs: dbHealth.responseTimeMs }),
      ...(dbHealth.category && { category: dbHealth.category }),
      ...(dbHealth.message && { message: dbHealth.message }),
    },
    runtime: {
      node: process.version,
      platform: process.platform,
      uptimeSeconds: Math.floor(process.uptime()),
    },
  };

  return res.status(isHealthy ? 200 : 503).json(payload);
}

async function getDbHealth(req, res) {
  const dbHealth = await db.checkHealth();
  const isHealthy = dbHealth.status === 'connected';
  return res.status(isHealthy ? 200 : 503).json({
    database: dbHealth,
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  getHealth,
  getDbHealth,
};
