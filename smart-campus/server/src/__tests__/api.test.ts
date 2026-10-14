import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('Smart Campus Management System — Full Integration & Security Test Suite', () => {
  let adminToken = '';
  let deanToken = '';
  let hodCseToken = '';
  let hodEceToken = '';
  let facultyCseToken = '';
  let studentToken = '';

  let eceDeptId = 0;
  let cseDeptId = 0;

  beforeAll(async () => {
    // 1. Authenticate Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@college.edu', password: 'AdminPassword123!' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;

    // 2. Authenticate Dean
    const deanRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dean@college.edu', password: 'Password123!' });
    expect(deanRes.status).toBe(200);
    deanToken = deanRes.body.token;

    // 3. Authenticate HOD (CSE)
    const hodRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'hod.cse@college.edu', password: 'Password123!' });
    expect(hodRes.status).toBe(200);
    hodCseToken = hodRes.body.token;

    // 4. Authenticate HOD (ECE)
    const hodEceRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'hod.ece@college.edu', password: 'Password123!' });
    expect(hodEceRes.status).toBe(200);
    hodEceToken = hodEceRes.body.token;

    // 5. Authenticate Faculty (CSE)
    const facRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'faculty.cse2@college.edu', password: 'Password123!' });
    expect(facRes.status).toBe(200);
    facultyCseToken = facRes.body.token;

    // 6. Authenticate Student (ECE - Aarav Sharma)
    const stuRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@college.edu', password: 'Password123!' });
    expect(stuRes.status).toBe(200);
    studentToken = stuRes.body.token;

    // 7. Dynamically resolve department IDs
    const deptListRes = await request(app)
      .get('/api/departments')
      .set('Authorization', `Bearer ${adminToken}`);
    const ece = deptListRes.body.departments.find((d: any) => d.code === 'ECE');
    const cse = deptListRes.body.departments.find((d: any) => d.code === 'CSE');
    eceDeptId = ece.id;
    cseDeptId = cse.id;
  });

  // ================= 1. AUTHENTICATION =================
  describe('1. Authentication & Session Security', () => {
    it('should authenticate valid credentials and return JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'dean@college.edu', password: 'Password123!' });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('DEAN');
    });

    it('should reject invalid password with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'dean@college.edu', password: 'WrongPassword!' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject unauthenticated requests to protected routes', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should verify active session token via /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${deanToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('dean@college.edu');
    });
  });

  // ================= 2. AUTHORIZATION & RBAC =================
  describe('2. Role-Based Access Control (RBAC) & Security Enforcements', () => {
    it('Student cannot access Admin endpoints (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ code: 'HACK', name: 'Unauthorized Dept' });
      expect(res.status).toBe(403);
    });

    it('Student cannot access Dean/Admin reports (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/reports/departments')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('Student cannot access HOD allocation endpoints (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/allocation/auto-department')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ departmentId: eceDeptId });
      expect(res.status).toBe(403);
    });

    it('Student cannot access full student roster listing (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('HOD cannot manage another department resources', async () => {
      // HOD CSE attempts to auto-allocate department ECE
      const res = await request(app)
        .post('/api/allocation/auto-department')
        .set('Authorization', `Bearer ${hodCseToken}`)
        .send({ departmentId: eceDeptId, maxPerFaculty: 35 });
      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Forbidden');
    });
  });

  // ================= 3. STUDENT PORTAL =================
  describe('3. Student Portal Endpoints & Self-Scoped Security', () => {
    it('GET /api/student/me returns ONLY the authenticated student profile', async () => {
      const res = await request(app)
        .get('/api/student/me')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.student.studentId).toBe('ECE2026001');
      expect(res.body.student.department.code).toBe('ECE');
    });

    it('GET /api/student/faculty returns the assigned mentor details', async () => {
      const res = await request(app)
        .get('/api/student/faculty')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.assigned).toBe(true);
      expect(res.body.faculty.name).toBeDefined();
    });

    it('GET /api/student/academic returns department courses and empty states', async () => {
      const res = await request(app)
        .get('/api/student/academic')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.academic.subjects.length).toBeGreaterThan(0);
      expect(res.body.academic.attendance.hasRecords).toBe(false);
      expect(res.body.academic.internalMarks.hasRecords).toBe(false);
    });

    it('GET /api/student/notifications returns broadcasts for students', async () => {
      const res = await request(app)
        .get('/api/student/notifications')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(res.body.notifications.length).toBeGreaterThan(0);
    });

    it('PUT /api/student/profile updates permitted phone and ignores immutable fields', async () => {
      const res = await request(app)
        .put('/api/student/profile')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          phone: '+91 9999988888',
          studentId: 'HACKED999', // Must NOT be modified!
          departmentId: 999,      // Must NOT be modified!
        });
      expect(res.status).toBe(200);
      expect(res.body.student.phone).toBe('+91 9999988888');
      expect(res.body.student.studentId).toBe('ECE2026001'); // Intact!
    });
  });

  // ================= 4. DEPARTMENT MANAGEMENT =================
  describe('4. Department Management & Validation', () => {
    it('GET /api/departments returns all 8 academic departments', async () => {
      const res = await request(app)
        .get('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.departments).toHaveLength(8);
      const codes = res.body.departments.map((d: any) => d.code);
      expect(codes).toContain('ECE');
      expect(codes).toContain('CSE');
      expect(codes).toContain('MECH');
    });

    it('should reject creating duplicate department code (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'CSE',
          name: 'Duplicate Computer Science',
        });
      expect(res.status).toBe(409);
    });
  });

  // ================= 5. FACULTY & WORKLOAD =================
  describe('5. Faculty Management & Capacity Constraints', () => {
    it('GET /api/faculty returns 17 faculty members with workload meters', async () => {
      const res = await request(app)
        .get('/api/faculty')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.faculty).toHaveLength(17);
      const fac = res.body.faculty[0];
      expect(fac.maxCapacity).toBe(35);
      expect(fac.assignedCount).toBeGreaterThanOrEqual(30);
    });

    it('should reject creating duplicate faculty with existing email', async () => {
      const res = await request(app)
        .post('/api/faculty')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Duplicate Faculty',
          email: 'faculty.cse2@college.edu',
          departmentId: cseDeptId,
          designation: 'Assistant Professor',
        });
      expect(res.status).toBe(409);
    });
  });

  // ================= 6. STUDENT MANAGEMENT & ALLOCATION =================
  describe('6. Student Management & Mentorship Allocation Engine', () => {
    it('GET /api/students returns 560 students with pagination', async () => {
      const res = await request(app)
        .get('/api/students?limit=25&page=1')
        .set('Authorization', `Bearer ${deanToken}`);
      expect(res.status).toBe(200);
      expect(res.body.students).toHaveLength(25);
      expect(res.body.pagination.total).toBe(560);
    });

    it('should reject cross-department faculty allocation', async () => {
      // Find ECE student and CSE faculty
      const facRes = await request(app)
        .get('/api/faculty')
        .set('Authorization', `Bearer ${adminToken}`);
      const cseFac = facRes.body.faculty.find((f: any) => f.departmentCode === 'CSE');

      const stuRes = await request(app)
        .get('/api/students?limit=50')
        .set('Authorization', `Bearer ${adminToken}`);
      const eceStu = stuRes.body.students.find((s: any) => s.departmentCode === 'ECE');

      const res = await request(app)
        .post('/api/allocation/single')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentId: eceStu.id,
          facultyId: cseFac.id,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Constraint violation');
    });

    it('POST /api/allocation/auto-department executes greedy balanced allocation', async () => {
      const res = await request(app)
        .post('/api/allocation/auto-department')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ departmentId: eceDeptId, maxPerFaculty: 35 });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ================= 7. HIERARCHY & REPORTS =================
  describe('7. College Hierarchy & Institutional Reports', () => {
    it('GET /api/hierarchy/tree constructs full Dean -> Dept -> HOD -> Faculty -> Students', async () => {
      const res = await request(app)
        .get('/api/hierarchy/tree')
        .set('Authorization', `Bearer ${deanToken}`);
      expect(res.status).toBe(200);
      expect(res.body.hierarchy.totalDepartments).toBe(8);
      expect(res.body.hierarchy.totalFaculty).toBe(17);
      expect(res.body.hierarchy.totalStudents).toBe(560);
    });

    it('GET /api/reports/departments returns all 8 departmental summaries', async () => {
      const res = await request(app)
        .get('/api/reports/departments')
        .set('Authorization', `Bearer ${deanToken}`);
      expect(res.status).toBe(200);
      expect(res.body.report).toHaveLength(8);
    });

    it('GET /api/reports/workload returns workload equity for 17 faculty members', async () => {
      const res = await request(app)
        .get('/api/reports/workload')
        .set('Authorization', `Bearer ${deanToken}`);
      expect(res.status).toBe(200);
      expect(res.body.report).toHaveLength(17);
    });
  });
});
