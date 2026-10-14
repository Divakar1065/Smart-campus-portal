# Academic Progress and Achievement Tracking System (ATS)
## Deep Project Audit & Technical Evaluation Report

**Date:** October 12, 2026  
**Auditor:** Senior Full-Stack, Security, & AI Systems Engineer  
**Workspace:** `C:\Users\Divakar\Desktop\APAATS MINI`  
**Status:** Audit Completed | Evidence-Based Assessment  

---

## 1. Executive Summary

A forensic and structural audit of the **Academic Progress and Achievement Tracking System (ATS)** workspace and user environment was conducted.

### Forensic Discovery Highlights:
1. **Workspace State:** The workspace `APAATS MINI` was opened as a fresh directory without committed version control files.
2. **Prior Version Artifacts Recovered:**
   - In VS Code storage and system recycle bins (`$ROO1PZQ`, `$RC7MRUG`, and VS Code History `2344eeda`, `-3cd9b377`, `1c197fca`), the complete authentic frontend application, CSS styling (`style.css`), earlier Express `server.js` prototypes, Chart.js integrations, and AI heuristic evaluation scripts were discovered and safely recovered into `frontend/`.
3. **Environment & Runtime Availability:**
   - **Node.js:** `v24.18.0` (Active and verified).
   - **npm:** `11.16.0` (Active and verified).
   - **Python:** Not installed in system PATH (Windows App Execution Alias stub triggers Microsoft Store redirect; native Python runtime missing).
   - **MySQL/Aiven:** Database credentials (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL`) are not yet populated in the workspace environment, requiring a resilient cloud-ready configuration and clear onboarding without silent mock fallbacks.

---

## 2. Confirmed Project Architecture (As Found)

```
[Previous Development State]
+---------------------------------------------------------+
| Frontend Prototype 1: Flat form (maths, python, comms)   |
| Frontend Prototype 2: Rich Poppins Dashboard UI         |
|   - Sidebar navigation: Dashboard, Student, Subjects,   |
|     Reports, AI Analysis, Settings                      |
|   - Hardcoded metrics: GPA 8.50, Attendance 86%, etc.   |
|   - Mock static canvas for Chart.js                     |
+---------------------------------------------------------+
                           |
        (Disconnected fetch calls to :3000 / :5000)
                           v
+---------------------------------------------------------+
| Backend Prototype: Minimal Express Server               |
|   - Missing database connection pool                   |
|   - Missing authentication/authorization               |
|   - Missing academic REST APIs                         |
|   - Missing session/JWT middleware                      |
+---------------------------------------------------------+
                           |
              (No Database Connection)
                           v
+---------------------------------------------------------+
| Intended Database: Aiven Cloud MySQL                    |
|   - No schema.sql in workspace                          |
|   - No .env configuration                               |
|   - No migration scripts                                |
+---------------------------------------------------------+
```

---

## 3. Detailed Problem & Bug Registry

### Finding 1: Disconnected Frontend and Hardcoded Dashboard Metrics
- **File Path:** `frontend/index.html`, `frontend/script.js`
- **Component:** Dashboard Cards, Academic Performance Graph, Attendance Chart, AI Recommendation
- **Observed Behavior:**
  - Student name is hardcoded to "Ishita".
  - Cards show static values (`8.50`, `86%`, `18`, `6`).
  - Charts are empty placeholder text boxes (`<div class="chart-box">Academic Performance Graph</div>`).
  - `script.js` only contains `console.log("Academic Tracking System Loaded Successfully");`.
- **Root Cause:** Frontend was created as an HTML/CSS layout before dynamic API data integration was wired up.
- **Severity:** High
- **Proposed Correction:**
  - Integrate Chart.js via CDN in `frontend/index.html`.
  - Implement full dynamic data-binding in `frontend/script.js` fetching `/api/student/dashboard`, `/api/marks`, `/api/attendance`, and `/api/achievements`.
  - Add auth token checks (`localStorage.getItem('ats_token')`), redirecting to login if unauthenticated.
- **Verification Method:** Load dashboard with authenticated test user; verify all cards and charts render real database values.

---

### Finding 2: Missing Authoritative Database Connection Module (Aiven Cloud MySQL)
- **File Path:** Root / `backend/config/db.js`
- **Component:** Database Abstraction Layer
- **Observed Behavior:** No active connection module to Aiven Cloud MySQL exists. Previous prototypes referenced `mysql` / `mysql2` without connection pooling, SSL certificates, or reconnect handlers.
- **Root Cause:** Project was in initial prototype migration phase without a centralized `db.js`.
- **Severity:** Critical
- **Proposed Correction:**
  - Build `backend/config/db.js` using `mysql2/promise` connection pool.
  - Support `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL_CA` or `DB_SSL_REJECT_UNAUTHORIZED`.
  - Support connection retry and safe query helpers.
  - Implement zero silent fallback to mock data in production mode.
  - Return clear diagnostic errors on `/api/health` without exposing secrets.
- **Verification Method:** Unit test `db.js` with valid and invalid configurations; verify `/api/health` reports status accurately.

---

### Finding 3: Lack of Authentication and Student Data Isolation
- **File Path:** `backend/routes/authRoutes.js`, `backend/middleware/authMiddleware.js`
- **Component:** Authentication and Authorization
- **Observed Behavior:**
  - No user login, registration, or JWT verification existed in the repository.
  - Students could hypothetically query arbitrary student records without identity validation.
- **Root Cause:** Backend had not progressed beyond a simple `app.get('/', ...)` ping endpoint.
- **Severity:** Critical
- **Proposed Correction:**
  - Implement secure JWT-based authentication with `bcryptjs` password hashing.
  - Implement role-based access control (`student`, `admin`, `faculty`).
  - Enforce ownership validation: Students can only view their own marks, attendance, and AI reports (`req.user.student_id === requested_id`).
  - Admins retain institutional oversight across departments.
- **Verification Method:** Execute automated tests attempting cross-student data access (must return HTTP 403 Forbidden).

---

### Finding 4: Missing Database Schema and Migration Pipeline
- **File Path:** `database/schema.sql`, `database/college_data.sql`, `database/migrate.js`
- **Component:** Relational Data Model
- **Observed Behavior:** No SQL DDL or DML files exist in the project directory.
- **Root Cause:** The database design was discussed in development context but not committed as versioned files.
- **Severity:** Critical
- **Proposed Correction:**
  - Create `database/schema.sql` defining:
    - `users` (id, username, email, password_hash, role, created_at)
    - `departments` (dept_id, dept_code, dept_name)
    - `students` (id, user_id, register_no, name, dept_id, semester, section, email, phone, avatar_url)
    - `subjects` (id, subject_code, subject_name, dept_id, semester, credits)
    - `marks` (id, student_id, subject_id, semester, exam_type, marks_obtained, max_marks, grade, grade_points)
    - `attendance` (id, student_id, subject_id, total_classes, attended_classes, percentage, last_updated)
    - `achievements` (id, student_id, title, category, description, achievement_date, status)
    - `ai_recommendations` (id, student_id, weak_subjects, strong_subjects, gpa_predicted, recommendations, alerts, generated_at)
    - `chat_history` (id, user_id, message, response, created_at)
  - Create `database/college_data.sql` with idempotent seed data (`INSERT IGNORE INTO`).
  - Ensure compatibility with both Aiven's `defaultdb` and custom databases.
  - Build `database/migrate.js` runner.
- **Verification Method:** Run migration runner against target database; verify schema creation without errors.

---

### Finding 5: Missing Python Runtime on Host System for AI Analysis
- **File Path:** `ai/academic_analyzer.py`, `backend/services/aiService.js`
- **Component:** Academic AI Engine
- **Observed Behavior:** Running `python --version` or `py --version` reveals that native Python is not installed in the Windows environment.
- **Root Cause:** Host machine has not installed Python 3 or configured environment variables for Python.
- **Severity:** Medium (Operational Dependency)
- **Proposed Correction:**
  - Provide a standalone, documented Python script `ai/academic_analyzer.py` for standard environments.
  - Implement a dual-mode AI engine in `backend/services/aiService.js`:
    - Mode 1: Executes `ai/academic_analyzer.py` if Python is detected in PATH.
    - Mode 2: Gracefully falls back to the native Node.js Heuristic Intelligence Engine that executes identical algorithms (credit-weighted CGPA, subject mastery thresholding, attendance risk detection, and study plan generation).
    - Mode 3: Grounded Academic Chatbot answering institutional and personal academic queries with zero hallucination of nonexistent facts.
- **Verification Method:** Test AI analysis with and without Python present; verify identical mathematical outputs.

---

### Finding 6: Cross-Origin and Port Fragmentation
- **File Path:** `app.js` (earlier history), `server.js`
- **Component:** Application Origin
- **Observed Behavior:** Prototype frontend fetched from `http://localhost:3000` while earlier `server.js` was listening on port 5000.
- **Root Cause:** Development conducted across disconnected test servers.
- **Severity:** Medium
- **Proposed Correction:**
  - Unify the application onto a single origin: Node.js Express server on port 3000 serves both the REST API at `/api/*` and the static frontend from `/frontend`.
  - Eliminate CORS complications and relative path mismatches.
- **Verification Method:** Navigate to `http://localhost:3000`; verify both frontend pages and API endpoints resolve from the same origin.

---

## 4. Audit Summary & Readiness Matrix

| Feature / Module | Found State | Required State | Priority |
|---|---|---|---|
| Frontend Layout | Static HTML/CSS | Interactive SPA / Dynamic Dashboard | P1 |
| Node.js / Express | 15-line stub | Production REST API with Security & Auth | P0 |
| Database Abstraction | Missing | Centralized Aiven MySQL Pool (`db.js`) | P0 |
| Relational Schema | Missing | Normalized 9-Table Schema (`schema.sql`) | P0 |
| Seed Data | Missing | Idempotent Sample & Reference Data | P1 |
| User Auth (JWT/Bcrypt) | Missing | Role-Based Auth + Student Ownership Rules | P0 |
| Marks & Attendance APIs | Missing | Complete CRUD & Aggregation Endpoints | P0 |
| AI Analysis Engine | Basic JS snippet | Resilient Dual-Engine (Python + Node.js) | P1 |
| Academic Chatbot | 10-line fetch stub | Grounded Context-Aware Academic Assistant | P1 |
| Automated Test Suite | Missing | Comprehensive Integration & Unit Tests | P1 |

---

*End of Project Audit Report.*
