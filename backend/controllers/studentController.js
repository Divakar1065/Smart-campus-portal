/**
 * Academic Progress and Achievement Tracking System (ATS)
 * Student Dashboard & Profile Controller
 */

const db = require('../config/db');
const aiService = require('../services/aiService');
const demoDataService = require('../services/demoDataService');

async function getDashboard(req, res) {
  try {
    let studentId = req.params.studentId || req.query.student_id || req.user.student_id;
    if (studentId) studentId = parseInt(studentId, 10);

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: 'No student identity associated with this account.',
      });
    }

    // 1. Retrieve Student Profile
    const studentRows = await db.query(
      `SELECT s.id AS student_id, s.name, s.register_no, s.current_semester,
              s.section, s.email, s.phone, s.avatar_url,
              d.id AS dept_id, d.dept_name, d.dept_code
       FROM students s
       JOIN departments d ON s.dept_id = d.id
       WHERE s.id = ?
       LIMIT 1`,
      [studentId]
    );

    if (!studentRows || studentRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student record not found.',
      });
    }

    const student = studentRows[0];

    // 2. Retrieve Marks
    const marksRows = await db.query(
      `SELECT m.id, m.semester, m.exam_type, m.marks_obtained, m.max_marks,
              m.grade, m.grade_points,
              sub.id AS subject_id, sub.subject_code, sub.subject_name, sub.credits
       FROM marks m
       JOIN subjects sub ON m.subject_id = sub.id
       WHERE m.student_id = ?
       ORDER BY sub.subject_code ASC`,
      [studentId]
    );

    // 3. Retrieve Attendance
    const attRows = await db.query(
      `SELECT a.id, a.total_classes, a.attended_classes, a.percentage,
              sub.id AS subject_id, sub.subject_code, sub.subject_name
       FROM attendance a
       JOIN subjects sub ON a.subject_id = sub.id
       WHERE a.student_id = ?
       ORDER BY sub.subject_code ASC`,
      [studentId]
    );

    // 4. Retrieve Achievements
    const achRows = await db.query(
      `SELECT id, title, category, description, achievement_date, status, verified_by
       FROM achievements
       WHERE student_id = ?
       ORDER BY achievement_date DESC`,
      [studentId]
    );

    // 5. Compute Credit-Weighted GPA
    let totalCredits = 0;
    let weightedPoints = 0;
    for (const m of marksRows) {
      const credits = Number(m.credits || 3);
      totalCredits += credits;
      weightedPoints += Number(m.grade_points || 0) * credits;
    }
    const calculatedGpa = totalCredits > 0 ? Number((weightedPoints / totalCredits).toFixed(2)) : 0.0;

    // 6. Compute Aggregate Attendance
    let totalAttended = 0;
    let totalClasses = 0;
    for (const a of attRows) {
      totalAttended += Number(a.attended_classes || 0);
      totalClasses += Number(a.total_classes || 0);
    }
    const overallAttendance = totalClasses > 0 ? Number(((totalAttended * 100.0) / totalClasses).toFixed(1)) : 0.0;

    // 7. Execute AI Analytics Engine
    const aiAnalysis = await aiService.analyzeStudentPerformance({
      name: student.name,
      marks: marksRows,
      attendance: attRows,
    });

    return res.status(200).json({
      success: true,
      profile: {
        student_id: student.student_id,
        name: student.name,
        register_no: student.register_no,
        department: student.dept_name,
        dept_code: student.dept_code,
        semester: student.current_semester,
        section: student.section,
        avatar_url: student.avatar_url,
        cgpa: calculatedGpa,
        overallAttendance: overallAttendance,
      },
      metrics: {
        gpa: calculatedGpa,
        attendance: Math.round(overallAttendance),
        assignments: marksRows.length * 3, // Estimated continuous coursework
        achievements: achRows.length,
      },
      performance: marksRows.map(m => ({
        subject: m.subject_name,
        code: m.subject_code,
        marks: Number(m.marks_obtained),
        maxMarks: Number(m.max_marks),
        grade: m.grade,
        credits: m.credits,
      })),
      attendanceSummary: attRows.map(a => ({
        subject: a.subject_name,
        code: a.subject_code,
        attended: a.attended_classes,
        total: a.total_classes,
        percentage: Number(a.percentage),
      })),
      achievements: achRows,
      aiRecommendation: aiAnalysis,
    });
  } catch (err) {
    console.error('Error fetching dashboard:', err);
    if (err.status === 503) {
      let studentId = req.params.studentId || req.query.student_id || req.user.student_id;
      if (studentId) studentId = parseInt(studentId, 10);
      const demoDashboard = demoDataService.getDemoStudentDashboard(studentId);
      if (demoDashboard) {
        return res.status(200).json(demoDashboard);
      }
      return res.status(503).json({
        success: false,
        message: 'Database unavailable. Cannot retrieve student dashboard.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve student dashboard data.',
    });
  }
}

async function getProfile(req, res) {
  try {
    let studentId = req.user.student_id;
    if ((req.user.role === 'admin' || req.user.role === 'faculty') && req.params.studentId) {
      studentId = parseInt(req.params.studentId, 10);
    }

    const students = await db.query(
      `SELECT s.*, d.dept_name, d.dept_code, u.username
       FROM students s
       JOIN departments d ON s.dept_id = d.id
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ?
       LIMIT 1`,
      [studentId]
    );

    if (!students || students.length === 0) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    return res.status(200).json({ success: true, profile: students[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch student profile.' });
  }
}

module.exports = {
  getDashboard,
  getProfile,
};
