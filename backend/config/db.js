/**
 * Academic Progress and Achievement Tracking System (ATS)
 * Authoritative Database Client: Aiven Cloud MySQL
 */

const mysql = require('mysql2/promise');
const fs = require('fs');

let pool = null;
let lastConnectionStatus = {
  connected: false,
  checkedAt: null,
  errorCategory: null,
  errorMessage: null,
};

function getSslConfig() {
  const useSsl = process.env.DB_SSL === 'true' || process.env.DB_SSL === true || process.env.DB_SSL_MODE === 'REQUIRED';
  if (!useSsl) return false;

  const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true';
  const sslOpts = {
    rejectUnauthorized: rejectUnauthorized,
  };

  const caPath = process.env.DB_CA_PATH || process.env.DB_SSL_CA;
  if (caPath && fs.existsSync(caPath)) {
    sslOpts.ca = fs.readFileSync(caPath);
  }

  return sslOpts;
}

function initPool() {
  if (pool) return pool;

  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME || 'defaultdb';
  const port = parseInt(process.env.DB_PORT || '3306', 10);

  if (!host || !user) {
    lastConnectionStatus = {
      connected: false,
      checkedAt: new Date().toISOString(),
      errorCategory: 'CONFIG_MISSING',
      errorMessage: 'Database host or user is not configured in environment.',
    };
    return null;
  }

  try {
    pool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      ssl: getSslConfig(),
      waitForConnections: true,
      connectionLimit: 10,
      maxIdle: 10,
      idleTimeout: 60000,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
    });

    return pool;
  } catch (err) {
    categorizeError(err);
    return null;
  }
}

function categorizeError(err) {
  let category = 'UNKNOWN_DATABASE_ERROR';
  if (!err) {
    category = 'CONFIG_MISSING';
  } else if (err.code === 'ENOTFOUND') {
    category = 'DNS_RESOLUTION_FAILED';
  } else if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    category = 'HOST_OR_PORT_UNREACHABLE';
  } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
    category = 'AUTHENTICATION_FAILED';
  } else if (err.code === 'ER_BAD_DB_ERROR') {
    category = 'DATABASE_NOT_FOUND_OR_FORBIDDEN';
  } else if (err.message && (err.message.includes('SSL') || err.message.includes('certificate'))) {
    category = 'TLS_CERTIFICATE_VERIFICATION_FAILED';
  }

  lastConnectionStatus = {
    connected: false,
    checkedAt: new Date().toISOString(),
    errorCategory: category,
    errorMessage: 'Database connection failed. Check service credentials and TLS configuration.',
  };

  return category;
}

/**
 * Health & connectivity probe
 * Runs a lightweight query (SELECT 1) without leaking credentials
 */
async function checkHealth() {
  const currentPool = initPool();
  if (!currentPool) {
    return {
      status: 'disconnected',
      category: lastConnectionStatus.errorCategory || 'CONFIG_MISSING',
      message: lastConnectionStatus.errorMessage || 'Database pool not initialized.',
      provider: 'Aiven Cloud MySQL',
      checkedAt: new Date().toISOString(),
    };
  }

  const startTime = Date.now();
  try {
    const [rows] = await currentPool.query('SELECT 1 AS alive');
    const responseTimeMs = Date.now() - startTime;

    lastConnectionStatus = {
      connected: true,
      checkedAt: new Date().toISOString(),
      errorCategory: null,
      errorMessage: null,
    };

    return {
      status: 'connected',
      provider: 'Aiven Cloud MySQL',
      responseTimeMs,
      checkedAt: lastConnectionStatus.checkedAt,
    };
  } catch (err) {
    categorizeError(err);
    return {
      status: 'disconnected',
      category: lastConnectionStatus.errorCategory,
      message: 'Failed to communicate with authoritative cloud database.',
      provider: 'Aiven Cloud MySQL',
      checkedAt: new Date().toISOString(),
    };
  }
}

/**
 * Executes a parameterized query against Aiven Cloud MySQL
 */
async function query(sql, params = []) {
  const currentPool = initPool();
  if (!currentPool) {
    const err = new Error('Database is unavailable. Configure Aiven Cloud MySQL in .env.');
    err.status = 503;
    err.category = lastConnectionStatus.errorCategory || 'CONFIG_MISSING';
    throw err;
  }

  try {
    const [results] = await currentPool.execute(sql, params);
    return results;
  } catch (err) {
    categorizeError(err);
    err.status = 500;
    throw err;
  }
}

module.exports = {
  getPool: initPool,
  checkHealth,
  query,
};
