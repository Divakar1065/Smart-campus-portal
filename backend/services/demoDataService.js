/**
 * Academic Progress and Achievement Tracking System (ATS)
 * Resilient Demo & Offline Sandbox Data Service
 * Mirrors authoritative schema and seed data from database/college_data.sql
 */

const bcrypt = require('bcryptjs');

const DEMO_USERS = [
  {
    id: 1,
    username: 'ishita_sharma',
    email: 'ishita.sharma@college.edu',
    password_hash: '$2a$10$7R6v782G54v9uF6n/B6UYe4wI2M1b7yCqN0Xq8xJ2X1h2K3l4M5N6', // Password123!
    plainPassword: 'Password123!',
    role: 'student',
    student_id: 1,
    name: 'Ishita Sharma',
    register_no: '2024CS101',
    dept_name: 'Computer Science & Engineering',
    dept_code: 'CSE',
    current_semester: 4,
    section: 'A',
    avatar_url: 'https://i.pravatar.cc/150?u=ishita',
  },
  {
    id: 2,
    username: 'arun_kumar',
    email: 'arun.kumar@college.edu',
    password_hash: '$2a$10$7R6v782G54v9uF6n/B6UYe4wI2M1b7yCqN0Xq8xJ2X1h2K3l4M5N6', // Password123!
    plainPassword: 'Password123!',
    role: 'student',
    student_id: 2,
    name: 'Arun Kumar',
    register_no: '2024CS102',
    dept_name: 'Computer Science & Engineering',
    dept_code: 'CSE',
    current_semester: 4,
    section: 'A',
    avatar_url: 'https://i.pravatar.cc/150?u=arun',
  },
  {
    id: 3,
    username: 'prof_ramesh',
    email: 'ramesh.faculty@college.edu',
    password_hash: '$2a$10$7R6v782G54v9uF6n/B6UYe4wI2M1b7yCqN0Xq8xJ2X1h2K3l4M5N6', // Password123!
    plainPassword: 'Password123!',
    role: 'faculty',
    student_id: null,
    name: 'Prof. Ramesh',
    register_no: null,
    dept_name: 'Computer Science & Engineering',
    dept_code: 'CSE',
    current_semester: null,
    avatar_url: 'https://i.pravatar.cc/150?u=ramesh',
  },
  {
    id: 4,
    username: 'admin_principal',
    email: 'admin@college.edu',
    password_hash: '$2a$10$9Z8v782G54v9uF6n/B6UYe4wI2M1b7yCqN0Xq8xJ2X1h2K3l4M5N6', // AdminPassword123!
    plainPassword: 'AdminPassword123!',
    role: 'admin',
    student_id: null,
    name: 'Campus Administrator',
    register_no: null,
    dept_name: 'Administration',
    dept_code: 'ADMIN',
    current_semester: null,
    avatar_url: 'https://i.pravatar.cc/150?u=admin',
  },
];

const DEMO_MARKS = {
  1: [
    { subject: 'Mathematics IV', code: 'CS401', marks: 84, maxMarks: 100, grade: 'A', credits: 4, grade_points: 8.0 },
    { subject: 'Data Structures & Algorithms', code: 'CS402', marks: 92, maxMarks: 100, grade: 'O', credits: 4, grade_points: 10.0 },
    { subject: 'Python Programming', code: 'CS403', marks: 82, maxMarks: 100, grade: 'A', credits: 3, grade_points: 8.0 },
    { subject: 'Database Management Systems', code: 'CS404', marks: 86, maxMarks: 100, grade: 'A+', credits: 3, grade_points: 9.0 },
    { subject: 'Operating Systems', code: 'CS405', marks: 72, maxMarks: 100, grade: 'B+', credits: 3, grade_points: 7.0 },
    { subject: 'Technical Communication', code: 'CS406', marks: 88, maxMarks: 100, grade: 'A+', credits: 2, grade_points: 9.0 },
  ],
  2: [
    { subject: 'Mathematics IV', code: 'CS401', marks: 42, maxMarks: 100, grade: 'F', credits: 4, grade_points: 0.0 },
    { subject: 'Data Structures & Algorithms', code: 'CS402', marks: 55, maxMarks: 100, grade: 'B', credits: 4, grade_points: 6.0 },
    { subject: 'Python Programming', code: 'CS403', marks: 64, maxMarks: 100, grade: 'B+', credits: 3, grade_points: 7.0 },
    { subject: 'Database Management Systems', code: 'CS404', marks: 50, maxMarks: 100, grade: 'B', credits: 3, grade_points: 6.0 },
    { subject: 'Operating Systems', code: 'CS405', marks: 38, maxMarks: 100, grade: 'F', credits: 3, grade_points: 0.0 },
    { subject: 'Technical Communication', code: 'CS406', marks: 60, maxMarks: 100, grade: 'B+', credits: 2, grade_points: 7.0 },
  ],
};

const DEMO_ATTENDANCE = {
  1: [
    { subject: 'Mathematics IV', code: 'CS401', attended: 42, total: 48, percentage: 87.5 },
    { subject: 'Data Structures & Algorithms', code: 'CS402', attended: 45, total: 50, percentage: 90.0 },
    { subject: 'Python Programming', code: 'CS403', attended: 38, total: 45, percentage: 84.4 },
    { subject: 'Database Management Systems', code: 'CS404', attended: 36, total: 42, percentage: 85.7 },
    { subject: 'Operating Systems', code: 'CS405', attended: 33, total: 40, percentage: 82.5 },
    { subject: 'Technical Communication', code: 'CS406', attended: 28, total: 30, percentage: 93.3 },
  ],
  2: [
    { subject: 'Mathematics IV', code: 'CS401', attended: 28, total: 48, percentage: 58.3 },
    { subject: 'Data Structures & Algorithms', code: 'CS402', attended: 32, total: 50, percentage: 64.0 },
    { subject: 'Python Programming', code: 'CS403', attended: 30, total: 45, percentage: 66.7 },
    { subject: 'Database Management Systems', code: 'CS404', attended: 26, total: 42, percentage: 61.9 },
    { subject: 'Operating Systems', code: 'CS405', attended: 22, total: 40, percentage: 55.0 },
    { subject: 'Technical Communication', code: 'CS406', attended: 20, total: 30, percentage: 66.7 },
  ],
};

const DEMO_ACHIEVEMENTS = [
  { id: 1, title: 'First Prize in National Hackathon 2026', category: 'technical', achievement_date: '2026-03-15', status: 'verified' },
  { id: 2, title: 'Dean\'s Academic Honor Roll', category: 'academic', achievement_date: '2026-01-10', status: 'verified' },
];

function findDemoUser(usernameOrEmail) {
  const identifier = (usernameOrEmail || '').trim().toLowerCase();
  return DEMO_USERS.find(
    u => u.username.toLowerCase() === identifier || u.email.toLowerCase() === identifier
  );
}

function verifyDemoPassword(user, password) {
  if (!user || !password) return false;
  return password === user.plainPassword || password === 'Password123!' || password === 'AdminPassword123!';
}

function getDemoStudentDashboard(studentId) {
  const user = DEMO_USERS.find(u => u.student_id === studentId);
  if (!user) return null;

  const performance = DEMO_MARKS[studentId] || [];
  const attendance = DEMO_ATTENDANCE[studentId] || [];

  let totalPoints = 0;
  let totalCredits = 0;
  performance.forEach(p => {
    totalPoints += (p.grade_points * p.credits);
    totalCredits += p.credits;
  });
  const cgpa = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0;

  let totalAttended = 0;
  let totalClasses = 0;
  attendance.forEach(a => {
    totalAttended += a.attended;
    totalClasses += a.total;
  });
  const overallAttendance = totalClasses > 0 ? Number(((totalAttended * 100) / totalClasses).toFixed(1)) : 0;

  return {
    success: true,
    isOfflineDemo: true,
    profile: {
      id: user.student_id,
      name: user.name,
      register_no: user.register_no,
      department: user.dept_name,
      dept_code: user.dept_code,
      semester: user.current_semester,
      section: user.section,
      email: user.email,
      avatar_url: user.avatar_url,
      cgpa: cgpa,
      overallAttendance: overallAttendance,
    },
    metrics: {
      gpa: cgpa,
      attendance: overallAttendance,
      subjectsCount: performance.length,
      achievements: studentId === 1 ? DEMO_ACHIEVEMENTS.length : 0,
    },
    performance,
    attendanceSummary: attendance,
    achievements: studentId === 1 ? DEMO_ACHIEVEMENTS : [],
    aiRecommendation: {
      cgpa,
      overallAttendance,
      strongSubjects: studentId === 1 ? ['Data Structures & Algorithms', 'Technical Communication'] : ['Python Programming'],
      weakSubjects: studentId === 1 ? ['Operating Systems'] : ['Mathematics IV', 'Operating Systems'],
      alerts: overallAttendance < 75 ? [`Attendance critical (${overallAttendance}%). University requires at least 75% for exam hall tickets.`] : [],
      recommendations: [
        'Review core memory management and scheduling concepts.',
        'Maintain daily lecture attendance to ensure continuous semester eligibility.',
      ],
    },
  };
}

function getDemoFacultySubjects() {
  return [
    { id: 1, subject_code: 'CS401', subject_name: 'Mathematics IV', semester: 4, credits: 4, dept_name: 'Computer Science & Engineering', dept_code: 'CSE', enrolled_students: 28 },
    { id: 2, subject_code: 'CS402', subject_name: 'Data Structures & Algorithms', semester: 4, credits: 4, dept_name: 'Computer Science & Engineering', dept_code: 'CSE', enrolled_students: 30 },
    { id: 3, subject_code: 'CS403', subject_name: 'Python Programming', semester: 4, credits: 3, dept_name: 'Computer Science & Engineering', dept_code: 'CSE', enrolled_students: 32 },
  ];
}

function getDemoFacultyRoster() {
  return [
    { id: 1, register_no: '2024CS101', name: 'Ishita Sharma', current_semester: 4, section: 'A', email: 'ishita.sharma@college.edu', dept_code: 'CSE', dept_name: 'Computer Science & Engineering', attendance_pct: 87.1, current_gpa: 8.50, isAtRisk: false },
    { id: 2, register_no: '2024CS102', name: 'Arun Kumar', current_semester: 4, section: 'A', email: 'arun.kumar@college.edu', dept_code: 'CSE', dept_name: 'Computer Science & Engineering', attendance_pct: 62.0, current_gpa: 5.40, isAtRisk: true },
  ];
}

function getDemoAdminOverview() {
  return {
    totalStudents: 4,
    totalDepartments: 4,
    averageCgpa: 8.01,
    overallAttendance: 78.4,
    totalAchievements: 6,
    atRiskCount: 1,
    departmentBreakdown: [
      { id: 1, dept_name: 'Computer Science & Engineering', dept_code: 'CSE', student_count: 2 },
      { id: 2, dept_name: 'Electronics & Communication Engineering', dept_code: 'ECE', student_count: 1 },
      { id: 3, dept_name: 'Information Technology', dept_code: 'IT', student_count: 1 },
    ],
  };
}

function getDemoAdminAtRisk() {
  return [
    {
      student_id: 2,
      name: 'Arun Kumar',
      register_no: '2024CS102',
      dept_code: 'CSE',
      current_semester: 4,
      overall_attendance: 62.0,
      cgpa: 5.40,
      riskFactors: ['Attendance critical (62.0%)', 'Low academic performance (5.40 CGPA)'],
    },
  ];
}

module.exports = {
  DEMO_USERS,
  findDemoUser,
  verifyDemoPassword,
  getDemoStudentDashboard,
  getDemoFacultySubjects,
  getDemoFacultyRoster,
  getDemoAdminOverview,
  getDemoAdminAtRisk,
};
