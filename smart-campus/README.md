# Smart Campus Management System

A centralized, responsive, production-structured full-stack web application designed for engineering colleges. Built as **ONE SINGLE UNIFIED WEB APPLICATION** representing the complete institutional hierarchy:

```
Dean → Department → HOD → Faculty → Student → Student Portal
```

---

## 🏛️ Organizational Architecture & Mathematical Structure

To ensure complete engineering college realism, the system strictly implements the following structure:

- **1 Dean of Academic Affairs** at the apex of institutional leadership.
- **8 Academic Departments**:
  1. Electronics and Communication Engineering (`ECE`)
  2. Electrical and Electronics Engineering (`EEE`)
  3. Computer Science and Engineering (`CSE`)
  4. Information Technology (`IT`)
  5. Mechanical Engineering (`MECH`)
  6. Civil Engineering (`CIVIL`)
  7. Artificial Intelligence and Data Science (`AI & DS`)
  8. Biomedical Engineering (`BME`)
- **8 Heads of Department (HODs)** assigned 1 per department.
- **17 Faculty Mentors**:
  - `CSE`: 3 faculty members.
  - Other 7 departments: 2 faculty members each ($3 + 7 \times 2 = 17$).
- **560 Enrolled Students** (strictly within the target 30–35 students per mentor window):
  - $17 \times 32 = 544$ assigned students.
  - $16$ unassigned students ($2$ per department) preserved to test live manual and auto-balanced greedy allocation algorithms.
  - Every single student has a dedicated **Student Portal** user account.

---

## 🔑 One Login → 5 Role-Based Dashboards (Demo Credentials)

For live demonstration and verification, quick-switch buttons are available on both the login page and the top navigation bar:

| Role | Name & Title | Email | Password | Default Redirect | Access Scope & Clearance |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Administrator** | System Administrator | `admin@college.edu` | `AdminPassword123!` | `/admin` | Global system setup, user accounts, quotas, & audit logs |
| **Dean** | Dr. Arthur Vance | `dean@college.edu` | `Password123!` | `/dean` | Institutional cross-departmental hierarchy and metrics oversight |
| **HOD (CSE)** | Dr. Arvind Swaminathan | `hod.cse@college.edu` | `Password123!` | `/hod` | Departmental faculty oversight & student mentorship allocation |
| **Faculty (CSE)** | Prof. Priya Raman | `faculty.cse2@college.edu` | `Password123!` | `/faculty` | Class mentor view: assigned 32 students, capacity, & details |
| **Student** | Aarav Sharma (ECE) | `student@college.edu` | `Password123!` | `/student` | Student Portal: profile, assigned mentor, courses, & notices |

---

## 🚀 Role Capabilities & Modules

### 1. Administrator Dashboard (`/admin`)
- Total user metrics (579 accounts), department status, active vs inactive accounts.
- Direct links to department setup, faculty directory, student roster, and allocation workspace.
- Global audit log stream with tamper-evident actor timestamps.

### 2. Dean Dashboard (`/dean`)
- College-wide oversight across all 8 departments, 17 faculty mentors, and 560 students.
- Recharts visualization: department capacity vs enrollment.
- Average mentor workload metric ($32.0$ students/mentor).
- Quick access to the interactive College Hierarchy Tree.

### 3. HOD Dashboard (`/hod`)
- **Strictly Scoped to the HOD's Department**: Department name, HOD profile, faculty count, and student quotas.
- Faculty capacity utilization meters.
- Cross-department mutations and allocations are strictly blocked at the API level.

### 4. Faculty Dashboard (`/faculty`)
- Faculty profile: faculty code, designation, department, and subjects taught.
- Capacity utilization gauge: Assigned Students ($32$), Maximum Capacity ($35$), Remaining ($3$).
- Searchable and filterable student roster listing **only** their assigned mentees.
- Student profile inspection modal.

### 5. Student Portal (`/student`)
- **Strictly Scoped**: Backed by `GET /api/student/me` which determines student identity strictly from the authenticated JWT token without trusting user inputs.
- Sub-Navigation Views:
  1. **Dashboard**: Student ID, department, mentor, academic year, semester, section.
  2. **My Profile**: View registration record, update personal contact phone. Core academic fields remain immutable.
  3. **My Faculty Mentor**: Name, faculty ID, designation, department, email, and subjects taught.
  4. **Academic Information**: Enrolled department courses (e.g. EC401-EC405), credits, and proper empty states for attendance, internal assessment marks, and assignments.
  5. **Notifications**: Institutional broadcasts and department-specific announcements.
  6. **Change Password**: Self-service secure password update with validation.

### 6. Interactive College Hierarchy Tree (`/hierarchy`)
- Five recursive levels: Dean $\rightarrow$ Departments $\rightarrow$ HODs $\rightarrow$ Faculty Mentors $\rightarrow$ Assigned Students.
- Search with instant branch filtering and highlighting.
- Node inspection modal with zoom, expand all, collapse all, and print/PDF view.

### 7. Student-Mentor Allocation Engine (`/allocation`)
- **Greedy Balanced Allocation**: Repeatedly assigns the next unassigned student to the faculty mentor with the lowest current workload within the student's department.
- **Strict Boundary Integrity**: Blocks cross-department assignments with transactional rollbacks.
- **Capacity Ceiling**: Strictly enforces the maximum capacity ceiling ($35$ students per mentor).
- **Manual Batch Allocation**: Multi-select students from the unassigned queue and assign them to an eligible mentor with available capacity.

---

## 🛠️ Technology Stack

- **Backend**: Node.js, Express, TypeScript, REST API, Zod schema validation.
- **ORM & Database**: Prisma ORM with SQLite database (`server/prisma/dev.db`).
- **Security**: JWT Authentication, bcrypt password hashing, Role-Based Access Control (RBAC).
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React icons, Recharts analytics.
- **Testing**: Vitest + Supertest integration testing suite.

---

## 🏃 Running the Application

### Option A: Unified Full-Stack Server (Port 5000)
The backend is configured to serve the pre-built React production bundle:

```bash
cd smart-campus/server
npm start
```
Open **`http://localhost:5000`** in your browser.

### Option B: Concurrent Development Mode
To run client with Hot Module Replacement (HMR) and backend with live reloading:

**Terminal 1 (Backend API):**
```bash
cd smart-campus/server
npm run dev
```

**Terminal 2 (Vite Frontend):**
```bash
cd smart-campus/client
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🧪 Running Automated Tests

Run the Vitest integration suite:

```bash
cd smart-campus/server
npm test
```

All **24 integration test suites** pass cleanly, validating:
1. Authentication & Session Security (valid login, invalid login, protected route, session token).
2. Role-Based Access Control (Student blocked from Admin, Dean reports, HOD allocation, and student roster; HOD blocked from cross-department management).
3. Student Portal Endpoints (`/api/student/me`, `/faculty`, `/academic`, `/notifications`, `/profile` immutable protections).
4. Department Management & Validation (8 departments, duplicate code rejection).
5. Faculty Management & Capacity Constraints (17 mentors, duplicate email rejection).
6. Student Management & Mentorship Allocation Engine (560 students, cross-department rejection, greedy auto-balance).
7. College Hierarchy Tree & Institutional Reports (Dean $\rightarrow$ Dept $\rightarrow$ HOD $\rightarrow$ Faculty $\rightarrow$ Students, department summary, workload equity).
