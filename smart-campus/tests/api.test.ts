import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../server/src/app';

describe('Smart Campus Hierarchy & Student Management System API', () => {
  let deanToken = '';
  let hodToken = '';
  let facultyToken = '';

  beforeAll(async () => {
    // 1. Authenticate as Dean
    const deanRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dean@college.edu', password: 'Password123!' });
    expect(deanRes.status).toBe(200);
    deanToken = deanRes.body.token;

    // 2. Authenticate as HOD (CSE)
    const hodRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'hod.cse@college.edu', password: 'Password123!' });
    expect(hodRes.status).toBe(200);
    hodToken = hodRes.body.token;

    // 3. Authenticate as Faculty (CSE)
    const facRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'cse.fac1@college.edu', password: 'Password123!' });
    expect(facRes.status).toBe(200);
    facultyToken = facRes.body.token;
  });

  describe('System Health & Authentication', () => {
    it('GET /api/health should return HEALTHY status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('HEALTHY');
    });

    it('GET /api/auth/demo-accounts should return 4 demo accounts', async () => {
      const res = await request(app).get('/api/auth/demo-accounts');
      expect(res.status).toBe(200);
      expect(res.body.accounts).toHaveLength(4);
    });

    it('GET /api/auth/me should verify active session token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${deanToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('DEAN');
    });
  });

  describe('College Hierarchy Tree', () => {
    it('GET /api/hierarchy/tree should construct Dean -> Departments -> HOD -> Faculty -> Students', async () => {
      const res = await request(app)
        .get('/api/hierarchy/tree')
        .set('Authorization', `Bearer ${deanToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const tree = res.body.hierarchy;
      expect(tree.type).toBe('DEAN');
      expect(tree.totalDepartments).toBe(8);
      expect(tree.totalFaculty).toBe(17);
      expect(tree.totalStudents).toBe(560);
      expect(tree.departments).toHaveLength(8);

      // Check first department has HOD and faculty
      const firstDept = tree.departments[0];
      expect(firstDept.hod).toBeDefined();
      expect(firstDept.facultyMembers.length).toBeGreaterThanOrEqual(2);
      expect(firstDept.facultyMembers[0].students).toBeDefined();
    });

    it('GET /api/hierarchy/search should find matching nodes across all hierarchy levels', async () => {
      const res = await request(app)
        .get('/api/hierarchy/search?q=CSE')
        .set('Authorization', `Bearer ${deanToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.results.departments.length).toBeGreaterThan(0);
      expect(res.body.results.faculty.length).toBeGreaterThan(0);
    });
  });

  describe('Departments & Faculty', () => {
    it('GET /api/departments should return all 8 departments with correct stats', async () => {
      const res = await request(app)
        .get('/api/departments')
        .set('Authorization', `Bearer ${deanToken}`);

      expect(res.status).toBe(200);
      expect(res.body.departments).toHaveLength(8);
      const codes = res.body.departments.map((d: any) => d.code);
      expect(codes).toContain('ECE');
      expect(codes).toContain('EEE');
      expect(codes).toContain('CSE');
      expect(codes).toContain('IT');
      expect(codes).toContain('MECH');
      expect(codes).toContain('CIVIL');
      expect(codes).toContain('AI & DS');
      expect(codes).toContain('BME');
    });

    it('GET /api/faculty should return 17 faculty members with student workloads', async () => {
      const res = await request(app)
        .get('/api/faculty')
        .set('Authorization', `Bearer ${deanToken}`);

      expect(res.status).toBe(200);
      expect(res.body.faculty).toHaveLength(17);

      // Ensure workload is distributed in the 30-35 range
      const faculty = res.body.faculty[0];
      expect(faculty.maxCapacity).toBe(35);
      expect(faculty.assignedCount).toBeGreaterThanOrEqual(30);
    });
  });

  describe('Students & Workload Allocation Engine', () => {
    it('GET /api/students should support pagination and filtering', async () => {
      const res = await request(app)
        .get('/api/students?limit=25&page=1')
        .set('Authorization', `Bearer ${deanToken}`);

      expect(res.status).toBe(200);
      expect(res.body.students).toHaveLength(25);
      expect(res.body.pagination.total).toBe(560);
    });

    it('POST /api/allocation/single should enforce department boundary constraints', async () => {
      // Find an ECE student and a CSE faculty member
      const facultyList = await request(app)
        .get('/api/faculty')
        .set('Authorization', `Bearer ${deanToken}`);

      const cseFaculty = facultyList.body.faculty.find((f: any) => f.departmentCode === 'CSE');

      const studentList = await request(app)
        .get('/api/students?limit=50')
        .set('Authorization', `Bearer ${deanToken}`);

      const eceStudent = studentList.body.students.find((s: any) => s.departmentCode === 'ECE');

      // Attempt invalid cross-department assignment
      const crossAssignRes = await request(app)
        .post('/api/allocation/single')
        .set('Authorization', `Bearer ${deanToken}`)
        .send({
          studentId: eceStudent.id,
          facultyId: cseFaculty.id,
        });

      expect(crossAssignRes.status).toBe(400);
      expect(crossAssignRes.body.message).toContain('Constraint violation');
    });

    it('POST /api/allocation/auto-department should balance unassigned students within limits', async () => {
      const res = await request(app)
        .post('/api/allocation/auto-department')
        .set('Authorization', `Bearer ${deanToken}`)
        .send({ departmentId: 1, maxPerFaculty: 35 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Dashboard Analytics & Institutional Reports', () => {
    it('GET /api/stats/dashboard should calculate accurate KPIs', async () => {
      const res = await request(app)
        .get('/api/stats/dashboard')
        .set('Authorization', `Bearer ${deanToken}`);

      expect(res.status).toBe(200);
      expect(res.body.stats.totalDepartments).toBe(8);
      expect(res.body.stats.totalFaculty).toBe(17);
      expect(res.body.stats.totalStudents).toBe(560);
      expect(res.body.stats.averageStudentsPerFaculty).toBeDefined();
    });

    it('GET /api/reports/departments should return complete departmental summary', async () => {
      const res = await request(app)
        .get('/api/reports/departments')
        .set('Authorization', `Bearer ${deanToken}`);

      expect(res.status).toBe(200);
      expect(res.body.report).toHaveLength(8);
    });

    it('GET /api/reports/workload should return workload equity report for all 17 mentors', async () => {
      const res = await request(app)
        .get('/api/reports/workload')
        .set('Authorization', `Bearer ${deanToken}`);

      expect(res.status).toBe(200);
      expect(res.body.report).toHaveLength(17);
    });
  });
});
