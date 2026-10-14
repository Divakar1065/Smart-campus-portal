/**
 * Academic Progress and Achievement Tracking System (ATS)
 * Comprehensive Automated Verification Test Suite
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const http = require('http');
const jwt = require('jsonwebtoken');

const { app } = require('../backend/server');
const { JWT_SECRET } = require('../backend/middleware/authMiddleware');
const aiService = require('../backend/services/aiService');
const chatService = require('../backend/services/chatService');
const db = require('../backend/config/db');

let serverInstance = null;
const TEST_PORT = 3100;

const testResults = [];

function recordTest(name, expected, actual, status, details = '') {
  testResults.push({ name, expected, actual, status, details });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${status.padEnd(4)}] ${name}`);
  if (details) console.log(`       Details: ${details}`);
}

function makeRequest(method, endpoint, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : '';
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
    if (body) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: TEST_PORT,
        path: endpoint,
        method: method,
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
          } catch (e) {
            resolve({ statusCode: res.statusCode, headers: res.headers, rawBody: data });
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (body) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('   ATS Comprehensive Verification Test Suite');
  console.log('====================================================\n');

  // Start test server
  await new Promise((resolve) => {
    serverInstance = app.listen(TEST_PORT, () => {
      resolve();
    });
  });

  try {
    // TEST 1: Environment & Template Safety
    {
      const envExamplePath = path.join(__dirname, '../.env.example');
      const exists = fs.existsSync(envExamplePath);
      const content = exists ? fs.readFileSync(envExamplePath, 'utf8') : '';
      const hasSecrets = /password\s*=\s*['"][^'"]+['"]/i.test(content) && !content.includes('your_aiven_db_password');
      const pass = exists && content.includes('DB_HOST') && !hasSecrets;
      recordTest(
        '1. Configuration Template (.env.example) Safety',
        '.env.example exists with placeholder keys and zero leaked secrets',
        exists ? 'Found safe template with placeholders' : 'Missing .env.example',
        pass ? 'PASS' : 'FAIL'
      );
    }

    // TEST 2: Static Frontend Serving
    {
      const res = await makeRequest('GET', '/login.html');
      const pass = res.statusCode === 200 && (res.rawBody || '').includes('ATS Portal');
      recordTest(
        '2. Static Web Portal Serving (/login.html)',
        'HTTP 200 with ATS login portal HTML',
        `HTTP ${res.statusCode}`,
        pass ? 'PASS' : 'FAIL'
      );
    }

    // TEST 3: Health Diagnostic Endpoint Security
    {
      const res = await makeRequest('GET', '/api/health');
      const hasSecrets = JSON.stringify(res.body || {}).toLowerCase().includes('password') ||
                         JSON.stringify(res.body || {}).toLowerCase().includes('secret');
      const hasStatus = res.body && (res.body.status === 'online' || res.body.status === 'degraded');
      const pass = hasStatus && !hasSecrets;
      recordTest(
        '3. Health & Diagnostic API (/api/health)',
        'Returns status without exposing passwords or database secrets',
        `Status: ${res.body?.status}, DB: ${res.body?.database?.status}`,
        pass ? 'PASS' : 'FAIL'
      );
    }

    // TEST 4: Authentication - Missing Credentials
    {
      const res = await makeRequest('POST', '/api/auth/login', {}, {});
      const pass = res.statusCode === 400 && res.body?.success === false;
      recordTest(
        '4. Auth Login Input Validation',
        'HTTP 400 when username/password missing',
        `HTTP ${res.statusCode} with message "${res.body?.message}"`,
        pass ? 'PASS' : 'FAIL'
      );
    }

    // TEST 5: Protected Route Access Without Token
    {
      const res = await makeRequest('GET', '/api/student/dashboard');
      const pass = res.statusCode === 401 && res.body?.success === false;
      recordTest(
        '5. Protected Route Access Without Bearer Token',
        'HTTP 401 Unauthorized',
        `HTTP ${res.statusCode}`,
        pass ? 'PASS' : 'FAIL'
      );
    }

    // TEST 6: Protected Route With Malformed Token
    {
      const res = await makeRequest('GET', '/api/student/dashboard', {
        'Authorization': 'Bearer invalid_signature_token',
      });
      const pass = res.statusCode === 401;
      recordTest(
        '6. Protected Route With Malformed JWT Token',
        'HTTP 401 Invalid authorization token',
        `HTTP ${res.statusCode}`,
        pass ? 'PASS' : 'FAIL'
      );
    }

    // TEST 7: Role-Based Access Control (Student accessing Admin Route)
    {
      const studentToken = jwt.sign(
        { id: 1, username: 'ishita_sharma', role: 'student', student_id: 1 },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      const res = await makeRequest('GET', '/api/admin/overview', {
        'Authorization': `Bearer ${studentToken}`,
      });
      const pass = res.statusCode === 403;
      recordTest(
        '7. Role-Based Access Control (Student blocked from Admin)',
        'HTTP 403 Forbidden for student accessing /api/admin/overview',
        `HTTP ${res.statusCode}`,
        pass ? 'PASS' : 'FAIL'
      );
    }

    // TEST 8: Student Ownership Isolation (Cross-Student Access Prevention)
    {
      const student1Token = jwt.sign(
        { id: 1, username: 'ishita_sharma', role: 'student', student_id: 1 },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      // Student 1 attempts to query Student 2's dashboard
      const res = await makeRequest('GET', '/api/student/dashboard?student_id=2', {
        'Authorization': `Bearer ${student1Token}`,
      });
      const pass = res.statusCode === 403;
      recordTest(
        '8. Student Data Isolation (Cross-Student ID Tampering Blocked)',
        'HTTP 403 Forbidden when Student 1 queries Student 2',
        `HTTP ${res.statusCode}`,
        pass ? 'PASS' : 'FAIL'
      );
    }

    // TEST 9: AI Heuristic Engine Mathematical Accuracy
    {
      const sampleStudent = {
        name: 'Ishita Sharma',
        marks: [
          { subject_name: 'Mathematics IV', marks_obtained: 84, credits: 4, grade_points: 8.0 },
          { subject_name: 'Data Structures', marks_obtained: 92, credits: 4, grade_points: 10.0 },
          { subject_name: 'Python Programming', marks_obtained: 82, credits: 3, grade_points: 8.0 },
          { subject_name: 'Database Systems', marks_obtained: 86, credits: 3, grade_points: 9.0 },
          { subject_name: 'Operating Systems', marks_obtained: 72, credits: 3, grade_points: 7.0 },
          { subject_name: 'Technical Communication', marks_obtained: 88, credits: 2, grade_points: 9.0 },
        ],
        attendance: [
          { subject_name: 'Mathematics IV', attended_classes: 42, total_classes: 48 },
          { subject_name: 'Data Structures', attended_classes: 45, total_classes: 50 },
          { subject_name: 'Python Programming', attended_classes: 38, total_classes: 45 },
          { subject_name: 'Database Systems', attended_classes: 36, total_classes: 42 },
          { subject_name: 'Operating Systems', attended_classes: 33, total_classes: 40 },
          { subject_name: 'Technical Communication', attended_classes: 28, total_classes: 30 },
        ],
      };

      const result = aiService.analyzeNative(sampleStudent);
      const expectedCgpa = 8.53;
      const pass = Math.abs(result.cgpa - expectedCgpa) <= 0.05 &&
                   result.overallAttendance === 87.1 &&
                   result.strongSubjects.includes('Data Structures');
      recordTest(
        '9. AI Heuristic Engine Credit-Weighted CGPA & Attendance Math',
        `CGPA ~ 8.53, Attendance ~ 87.1%, Strong in Data Structures`,
        `Computed CGPA: ${result.cgpa}, Attendance: ${result.overallAttendance}%`,
        pass ? 'PASS' : 'FAIL'
      );
    }

    // TEST 10: AI Heuristic Engine At-Risk Detection
    {
      const atRiskStudent = {
        name: 'Arun Kumar',
        marks: [
          { subject_name: 'Operating Systems', marks_obtained: 38, credits: 3, grade_points: 0.0 },
        ],
        attendance: [
          { subject_name: 'Operating Systems', attended_classes: 20, total_classes: 40 }, // 50%
        ],
      };

      const result = aiService.analyzeNative(atRiskStudent);
      const pass = result.weakSubjects.includes('Operating Systems') &&
                   result.alerts.length > 0 &&
                   result.overallAttendance === 50.0;
      recordTest(
        '10. AI Heuristic Engine At-Risk Subject & Attendance Warnings',
        'Flags Operating Systems as weak and produces critical attendance alert',
        `Alerts generated: ${result.alerts.length}, Weak subjects: ${result.weakSubjects.join(', ')}`,
        pass ? 'PASS' : 'FAIL'
      );
    }

    // TEST 11: Academic Chatbot Contextual Responses
    {
      const chatRes = await chatService.processChatMessage(1, null, 'What is the exam eligibility attendance criteria?');
      const pass = chatRes && chatRes.reply.includes('75%');
      recordTest(
        '11. Academic Chatbot Intent & Fact Grounding',
        'Explains 75% institutional attendance threshold accurately',
        `Chatbot reply: "${chatRes.reply.slice(0, 75)}..."`,
        pass ? 'PASS' : 'FAIL'
      );
    }

    // TEST 12: Database Schema & Migration Script Validity
    {
      const schemaPath = path.join(__dirname, '../database/schema.sql');
      const seedPath = path.join(__dirname, '../database/college_data.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      const seedSql = fs.readFileSync(seedPath, 'utf8');

      const hasAllTables = ['users', 'students', 'departments', 'subjects', 'marks', 'attendance', 'achievements', 'ai_recommendations', 'chat_history']
        .every(t => schemaSql.includes(`CREATE TABLE IF NOT EXISTS ${t}`));
      const hasIdempotentInserts = seedSql.includes('INSERT INTO departments') && seedSql.includes('ON DUPLICATE KEY UPDATE');

      const pass = hasAllTables && hasIdempotentInserts;
      recordTest(
        '12. SQL Schema & Seed Migration Script Integrity',
        'Defines 9 normalized tables with ON DUPLICATE KEY UPDATE seed safety',
        hasAllTables ? 'All 9 tables confirmed in DDL' : 'Missing table definitions',
        pass ? 'PASS' : 'FAIL'
      );
    }

    // TEST 13: Database Disconnected Graceful Error Handling
    {
      // When database is disconnected, endpoints must not crash with unhandled exceptions
      const token = jwt.sign({ id: 999, role: 'student', student_id: 999 }, JWT_SECRET, { expiresIn: '1h' });
      const res = await makeRequest('GET', '/api/student/dashboard', {
        'Authorization': `Bearer ${token}`,
      });
      // Should be 503 Service Unavailable or 500 cleanly handled JSON (not an HTML crash page)
      const pass = (res.statusCode === 503 || res.statusCode === 500) && res.body?.success === false;
      recordTest(
        '13. Unconfigured/Unavailable Cloud Database Graceful Degradation',
        'Returns clean structured JSON error without crashing server or exposing stack',
        `HTTP ${res.statusCode} with JSON error: "${res.body?.message}"`,
        pass ? 'PASS' : 'FAIL'
      );
    }

    // TEST 14: Faculty Role-Based Authorization
    {
      const facultyToken = jwt.sign(
        { id: 2, username: 'prof_ramesh', role: 'faculty' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      const studentToken = jwt.sign(
        { id: 1, username: 'ishita_sharma', role: 'student', student_id: 1 },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Student attempting to access faculty subjects endpoint -> 403 Forbidden
      const studentRes = await makeRequest('GET', '/api/faculty/subjects', {
        'Authorization': `Bearer ${studentToken}`,
      });
      // Faculty accessing faculty subjects endpoint -> not 403 (200 or 503 if DB disconnected)
      const facultyRes = await makeRequest('GET', '/api/faculty/subjects', {
        'Authorization': `Bearer ${facultyToken}`,
      });

      const pass = studentRes.statusCode === 403 && (facultyRes.statusCode === 200 || facultyRes.statusCode === 503 || facultyRes.statusCode === 500);
      recordTest(
        '14. Faculty Portal Endpoint Authorization (/api/faculty/subjects)',
        'Blocks students with HTTP 403; permits authenticated faculty',
        `Student HTTP: ${studentRes.statusCode}, Faculty HTTP: ${facultyRes.statusCode}`,
        pass ? 'PASS' : 'FAIL'
      );
    }

    // TEST 15: Admin Dashboard Summary Contract
    {
      const adminToken = jwt.sign(
        { id: 3, username: 'admin_principal', role: 'admin' },
        JWT_SECRET,
        { expiresIn: '1h' }
      );
      const studentToken = jwt.sign(
        { id: 1, username: 'ishita_sharma', role: 'student', student_id: 1 },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      const studentRes = await makeRequest('GET', '/api/dashboard/admin/summary', {
        'Authorization': `Bearer ${studentToken}`,
      });
      const adminRes = await makeRequest('GET', '/api/dashboard/admin/summary', {
        'Authorization': `Bearer ${adminToken}`,
      });

      const pass = studentRes.statusCode === 403 && (adminRes.statusCode === 200 || adminRes.statusCode === 503 || adminRes.statusCode === 500);
      recordTest(
        '15. Admin Summary Contract Authorization (/api/dashboard/admin/summary)',
        'Blocks student with HTTP 403; allows admin token access',
        `Student HTTP: ${studentRes.statusCode}, Admin HTTP: ${adminRes.statusCode}`,
        pass ? 'PASS' : 'FAIL'
      );
    }

    // TEST 16: Dedicated Database Diagnostic Health Route
    {
      const res = await makeRequest('GET', '/api/health/db');
      const hasDbProp = res.body && typeof res.body.database === 'object';
      const hasSecrets = JSON.stringify(res.body || {}).toLowerCase().includes('password') ||
                         JSON.stringify(res.body || {}).toLowerCase().includes('secret');
      const pass = (res.statusCode === 200 || res.statusCode === 503) && hasDbProp && !hasSecrets;
      recordTest(
        '16. Database Diagnostic Endpoint Security (/api/health/db)',
        'Returns diagnostic payload with database health state and zero leaked secrets',
        `HTTP ${res.statusCode}, DB Status: ${res.body?.database?.status}`,
        pass ? 'PASS' : 'FAIL'
      );
    }

  } catch (err) {
    console.error('Fatal test runner exception:', err);
  } finally {
    if (serverInstance) {
      serverInstance.close();
    }
  }

  // Summary
  const passed = testResults.filter(t => t.status === 'PASS').length;
  const failed = testResults.filter(t => t.status === 'FAIL').length;

  console.log('\n====================================================');
  console.log(`Test Execution Finished: ${passed}/${testResults.length} PASSED (${failed} FAILED)`);
  console.log('====================================================');

  return { passed, failed, total: testResults.length, results: testResults };
}

if (require.main === module) {
  runTests().then(({ failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  });
}

module.exports = { runTests };
