/**
 * Academic Progress and Achievement Tracking System (ATS)
 * Cloud Database Migration Runner
 * Authoritative target: Aiven Cloud MySQL
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function runMigration() {
  console.log('====================================================');
  console.log('   ATS Aiven Cloud MySQL Migration Runner');
  console.log('====================================================');

  const host = process.env.DB_HOST;
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME || 'defaultdb';
  const useSsl = process.env.DB_SSL === 'true' || process.env.DB_SSL === true;
  const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true';

  if (!host || !user) {
    console.error('❌ Missing database configuration.');
    console.error('Please configure DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME in .env.');
    process.exit(1);
  }

  const sslConfig = useSsl
    ? {
        rejectUnauthorized: rejectUnauthorized,
        ca: process.env.DB_SSL_CA ? fs.readFileSync(process.env.DB_SSL_CA) : undefined,
      }
    : false;

  console.log(`Connecting to: ${host}:${port} / db: ${database} (SSL: ${useSsl ? 'enabled' : 'disabled'})`);

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database,
      ssl: sslConfig,
      multipleStatements: true,
    });
    console.log('✅ Successfully established connection to Aiven Cloud MySQL.');

    // 1. Read and execute schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('Applying database schema (schema.sql)...');
    await connection.query(schemaSql);
    console.log('✅ Schema tables verified/created successfully.');

    // 2. Hash standard passwords for college_data seed
    const studentHash = await bcrypt.hash('Password123!', 10);
    const adminHash = await bcrypt.hash('AdminPassword123!', 10);

    // 3. Read college_data.sql and replace placeholders with computed bcrypt hashes
    const seedPath = path.join(__dirname, 'college_data.sql');
    let seedSql = fs.readFileSync(seedPath, 'utf8');
    seedSql = seedSql.replace(/\$2a\$10\$7R6v782G54v9uF6n\/B6UYe4wI2M1b7yCqN0Xq8xJ2X1h2K3l4M5N6/g, studentHash);
    seedSql = seedSql.replace(/\$2a\$10\$9Z8v782G54v9uF6n\/B6UYe4wI2M1b7yCqN0Xq8xJ2X1h2K3l4M5N6/g, adminHash);

    console.log('Seeding reference and college data (college_data.sql)...');
    await connection.query(seedSql);
    console.log('✅ Seed data applied idempotently.');

    // 4. Verify table counts
    const tables = ['departments', 'users', 'students', 'subjects', 'semesters', 'marks', 'attendance', 'achievements', 'notifications', 'audit_logs'];
    console.log('\n--- Table Verification Summary ---');
    for (const tbl of tables) {
      const [rows] = await connection.query(`SELECT COUNT(*) AS total FROM \`${tbl}\``);
      console.log(`  Table [${tbl.padEnd(14)}]: ${rows[0].total} rows`);
    }

    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration Failed:');
    if (err.code === 'ENOTFOUND') {
      console.error(`  Category: DNS / Host resolution failed for ${host}`);
    } else if (err.code === 'ECONNREFUSED') {
      console.error(`  Category: Connection refused on ${host}:${port}. Verify host and port.`);
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('  Category: Authentication failed. Verify DB_USER and DB_PASSWORD.');
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.error(`  Category: Database ${database} does not exist or user lacks permission.`);
    } else if (err.code === 'CERT_HAS_EXPIRED' || err.message.includes('SSL') || err.message.includes('certificate')) {
      console.error('  Category: SSL/TLS handshake failed. Set DB_SSL_REJECT_UNAUTHORIZED=false or supply DB_SSL_CA.');
    } else {
      console.error(`  Error Code: ${err.code || 'UNKNOWN'} | Message: ${err.message}`);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
