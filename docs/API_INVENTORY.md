# ATS REST API Inventory & Contract Specification

**Base URL:** `http://localhost:3000/api`  
**Authentication Scheme:** Bearer Token (JWT via `Authorization: Bearer <token>`)  
**Data Format:** JSON (`Content-Type: application/json`)  

---

## 1. System & Diagnostic Endpoints

### 1.1 System Health & Database Connectivity
- **Route:** `GET /api/health`
- **Auth:** Public
- **Purpose:** Verifies server responsiveness, uptime, and Aiven Cloud MySQL connection state without revealing database credentials or internal stack traces.
- **Success Response (200 OK):**
```json
{
  "status": "online",
  "version": "1.0.0",
  "timestamp": "2026-10-12T20:56:00.000Z",
  "database": {
    "status": "connected",
    "provider": "Aiven Cloud MySQL",
    "responseTimeMs": 14
  },
  "runtime": {
    "node": "v24.18.0",
    "aiEngine": "native-heuristic"
  }
}
```
- **Degraded Response (503 Service Unavailable):**
```json
{
  "status": "degraded",
  "version": "1.0.0",
  "timestamp": "2026-10-12T20:56:00.000Z",
  "database": {
    "status": "disconnected",
    "category": "AUTH_FAILED | HOST_UNREACHABLE | CONFIG_MISSING",
    "message": "Database connection unavailable. Please check credentials in .env"
  }
}
```

### 1.2 Dedicated Cloud Database Health Probe
- **Route:** `GET /api/health/db`
- **Auth:** Public
- **Purpose:** Direct probe of Aiven Cloud MySQL connection pool and TLS latency.
- **Success Response (200 OK):**
```json
{
  "database": {
    "status": "connected",
    "provider": "Aiven Cloud MySQL",
    "responseTimeMs": 18
  },
  "timestamp": "2026-10-13T15:30:00.000Z"
}
```
- **Error Response (503 Service Unavailable):**
```json
{
  "database": {
    "status": "disconnected",
    "category": "CONFIG_MISSING",
    "message": "Aiven database credentials missing or incomplete in environment."
  },
  "timestamp": "2026-10-13T15:30:00.000Z"
}
```

---

## 2. Authentication & Session Endpoints

### 2.1 User Login
- **Route:** `POST /api/auth/login`
- **Auth:** Public
- **Request Body:**
```json
{
  "username": "ishita_sharma",
  "password": "Password123!"
}
```
- **Success Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "student_id": 1,
    "username": "ishita_sharma",
    "name": "Ishita Sharma",
    "role": "student",
    "register_no": "2024CS101",
    "department": "Computer Science & Engineering"
  }
}
```
- **Error (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid username or password"
}
```

### 2.2 Get Current User Identity
- **Route:** `GET /api/auth/me`
- **Auth:** Bearer Token
- **Success Response (200 OK):** Current session user details.
- **Error (401 Unauthorized):** Missing or expired token.

---

## 3. Student Academic Endpoints

### 3.1 Student Comprehensive Dashboard
- **Route:** `GET /api/student/dashboard`
- **Auth:** Bearer Token (`student`, `admin`, `faculty`)
- **Query Params (Optional for Admin):** `?student_id=1`
- **Access Control:** Student can ONLY view their own dashboard. Admin/Faculty can query any student.
- **Success Response (200 OK):**
```json
{
  "success": true,
  "profile": {
    "student_id": 1,
    "name": "Ishita Sharma",
    "register_no": "2024CS101",
    "department": "Computer Science & Engineering",
    "semester": 4,
    "cgpa": 8.50,
    "overallAttendance": 86.4
  },
  "metrics": {
    "gpa": 8.50,
    "attendance": 86,
    "subjectsCount": 6,
    "achievementsCount": 6
  },
  "performance": [
    { "subject": "Mathematics IV", "marks": 88, "grade": "A+", "credits": 4 },
    { "subject": "Data Structures", "marks": 92, "grade": "O", "credits": 4 },
    { "subject": "Python Programming", "marks": 85, "grade": "A+", "credits": 3 },
    { "subject": "Database Systems", "marks": 80, "grade": "A", "credits": 3 },
    { "subject": "Operating Systems", "marks": 78, "grade": "B+", "credits": 3 },
    { "subject": "Technical Communication", "marks": 90, "grade": "O", "credits": 2 }
  ],
  "attendanceSummary": [
    { "subject": "Mathematics IV", "attended": 42, "total": 48, "percentage": 87.5 },
    { "subject": "Data Structures", "attended": 45, "total": 50, "percentage": 90.0 },
    { "subject": "Python Programming", "attended": 38, "total": 45, "percentage": 84.4 },
    { "subject": "Database Systems", "attended": 36, "total": 42, "percentage": 85.7 },
    { "subject": "Operating Systems", "attended": 33, "total": 40, "percentage": 82.5 },
    { "subject": "Technical Communication", "attended": 28, "total": 30, "percentage": 93.3 }
  ],
  "aiRecommendation": {
    "summary": "Strong grasp on Data Structures and Communication. Prioritize Operating Systems revision.",
    "status": "Good Standing",
    "weakSubjects": ["Operating Systems"],
    "strongSubjects": ["Data Structures", "Technical Communication"]
  }
}
```

---

## 4. Marks & Performance Endpoints

### 4.1 Get Student Marks
- **Route:** `GET /api/marks`
- **Auth:** Bearer Token
- **Query Params:** `?semester=4&student_id=1`
- **Success Response (200 OK):** Array of subject marks, credits, and grade points.

### 4.2 Record or Update Marks
- **Route:** `POST /api/marks`
- **Auth:** Bearer Token (`admin`, `faculty`)
- **Request Body:**
```json
{
  "student_id": 1,
  "subject_id": 2,
  "semester": 4,
  "exam_type": "semester",
  "marks_obtained": 92,
  "max_marks": 100
}
```

---

## 5. Attendance Endpoints

### 5.1 Get Attendance Records
- **Route:** `GET /api/attendance`
- **Auth:** Bearer Token
- **Success Response (200 OK):** Array of subject-wise attendance metrics and low-attendance warnings.

---

## 6. Achievements Endpoints

### 6.1 Get Student Achievements
- **Route:** `GET /api/achievements`
- **Auth:** Bearer Token
- **Success Response (200 OK):**
```json
{
  "success": true,
  "total": 6,
  "achievements": [
    {
      "id": 1,
      "title": "1st Prize - Smart India Hackathon",
      "category": "technical",
      "achievement_date": "2026-03-15",
      "description": "Developed an automated irrigation monitoring platform.",
      "status": "verified"
    }
  ]
}
```

### 6.2 Submit Achievement
- **Route:** `POST /api/achievements`
- **Auth:** Bearer Token (`student`)
- **Request Body:** `{ title, category, description, achievement_date }`

---

## 7. AI Analysis & Chatbot Endpoints

### 7.1 Generate Real-Time Academic Insights
- **Route:** `GET /api/analysis`
- **Auth:** Bearer Token
- **Success Response (200 OK):**
```json
{
  "success": true,
  "engine": "native-heuristic",
  "student": "Ishita Sharma",
  "cgpa": 8.50,
  "attendancePercentage": 86.4,
  "strengths": ["Data Structures", "Technical Communication"],
  "areasForImprovement": ["Operating Systems"],
  "alerts": [],
  "recommendations": [
    "Review Operating Systems memory management concepts.",
    "Maintain current attendance cadence to safeguard eligibility."
  ]
}
```

### 7.2 Academic Chatbot Interaction
- **Route:** `POST /api/chat`
- **Auth:** Bearer Token
- **Request Body:**
```json
{
  "message": "What is my current attendance in Operating Systems?"
}
```
- **Success Response (200 OK):**
```json
{
  "success": true,
  "reply": "Your current attendance in Operating Systems is 82.5% (33 classes attended out of 40). You meet the 75% threshold, but ensure you attend upcoming lectures to stay safely above 80%."
}
```

---

## 8. Administrative Endpoints

### 8.1 Institutional Overview
- **Route:** `GET /api/admin/overview` (and alias `GET /api/dashboard/admin/summary`)
- **Auth:** Bearer Token (`admin`)
- **Success Response (200 OK):**
```json
{
  "success": true,
  "overview": {
    "totalStudents": 4,
    "totalDepartments": 4,
    "averageCgpa": 8.01,
    "overallAttendance": 78.4,
    "totalAchievements": 6,
    "atRiskCount": 1,
    "departmentBreakdown": [
      { "id": 1, "dept_name": "Computer Science & Engineering", "dept_code": "CSE", "student_count": 2 }
    ]
  }
}
```

### 8.2 At-Risk Student Registry
- **Route:** `GET /api/admin/at-risk`
- **Auth:** Bearer Token (`admin`, `faculty`)
- **Success Response (200 OK):**
```json
{
  "success": true,
  "totalAtRisk": 1,
  "students": [
    {
      "student_id": 3,
      "name": "Rohan Verma",
      "register_no": "2024ECE101",
      "dept_code": "ECE",
      "current_semester": 4,
      "overall_attendance": 68.2,
      "cgpa": 5.85,
      "riskFactors": ["Attendance critical (68.2%)", "Low academic performance (5.85 CGPA)"]
    }
  ]
}
```

### 8.3 Institutional Student Registry
- **Route:** `GET /api/admin/students`
- **Auth:** Bearer Token (`admin`, `faculty`)
- **Success Response (200 OK):** Complete student roster across all departments.

---

## 9. Faculty Portal Endpoints

### 9.1 Assigned Subjects
- **Route:** `GET /api/faculty/subjects`
- **Auth:** Bearer Token (`faculty`, `admin`)
- **Success Response (200 OK):**
```json
{
  "success": true,
  "total": 3,
  "subjects": [
    {
      "id": 1,
      "subject_code": "CS401",
      "subject_name": "Data Structures & Algorithms",
      "semester": 4,
      "credits": 4,
      "dept_name": "Computer Science & Engineering",
      "dept_code": "CSE",
      "enrolled_students": 25
    }
  ]
}
```

### 9.2 Student Evaluation Roster
- **Route:** `GET /api/faculty/students`
- **Auth:** Bearer Token (`faculty`, `admin`)
- **Query Params (Optional):** `?dept_id=1`
- **Success Response (200 OK):** Roster of enrolled students with attendance percentage, current GPA, and at-risk status flags.

### 9.3 Record / Update Marks
- **Route:** `POST /api/faculty/marks`
- **Auth:** Bearer Token (`faculty`, `admin`)
- **Request Body:** `{ student_id, subject_id, semester, exam_type, marks_obtained, max_marks }`
- **Success Response (200 OK):** Updated marks entry.

### 9.4 Record / Update Attendance
- **Route:** `POST /api/faculty/attendance`
- **Auth:** Bearer Token (`faculty`, `admin`)
- **Request Body:** `{ student_id, subject_id, semester, attended_classes, total_classes }`
- **Success Response (200 OK):** Updated attendance percentage and exam eligibility flag.

---

*End of API Inventory.*
