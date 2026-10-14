/**
 * Academic Progress and Achievement Tracking System (ATS)
 * Faculty Controller
 */

const db = require('../config/db');
const marksController = require('./marksController');
const attendanceController = require('./attendanceController');
const demoDataService = require('../services/demoDataService');

async function getAssignedSubjects(req, res) {
  try {
    const subjects = await db.query(
      `SELECT sub.id, sub.subject_code, sub.subject_name, sub.semester, sub.credits,
              d.dept_name, d.dept_code,
              COUNT(DISTINCT m.student_id) AS enrolled_students
       FROM subjects sub
       JOIN departments d ON sub.dept_id = d.id
       LEFT JOIN marks m ON sub.id = m.subject_id
       GROUP BY sub.id, sub.subject_code, sub.subject_name, sub.semester, sub.credits, d.dept_name, d.dept_code
       ORDER BY sub.semester ASC, sub.subject_code ASC`
    );

    return res.status(200).json({
      success: true,
      total: subjects.length,
      subjects,
    });
  } catch (err) {
    console.error('Faculty subjects error:', err);
    if (err.status === 503) {
      const subjects = demoDataService.getDemoFacultySubjects();
      return res.status(200).json({ success: true, total: subjects.length, subjects, isOfflineDemo: true });
    }
    return res.status(500).json({ success: false, message: 'Failed to retrieve assigned subjects.' });
  }
}

async function getStudentRoster(req, res) {
  try {
    let sql = `
      SELECT s.id, s.register_no, s.name, s.current_semester, s.section, s.email,
             d.dept_code, d.dept_name,
             ROUND(SUM(a.attended_classes) * 100.0 / NULLIF(SUM(a.total_classes), 0), 1) AS attendance_pct,
             ROUND(SUM(m.grade_points * sub.credits) / NULLIF(SUM(sub.credits), 0), 2) AS current_gpa
      FROM students s
      JOIN departments d ON s.dept_id = d.id
      LEFT JOIN attendance a ON s.id = a.student_id
      LEFT JOIN marks m ON s.id = m.student_id
      LEFT JOIN subjects sub ON m.subject_id = sub.id
    `;
    const params = [];

    if (req.query.dept_id) {
      sql += ' WHERE s.dept_id = ?';
      params.push(parseInt(req.query.dept_id, 10));
    }

    sql += ' GROUP BY s.id, s.register_no, s.name, s.current_semester, s.section, s.email, d.dept_code, d.dept_name ORDER BY s.register_no ASC';

    const roster = await db.query(sql, params);

    return res.status(200).json({
      success: true,
      totalStudents: roster.length,
      roster: roster.map(r => ({
        ...r,
        attendance_pct: Number(r.attendance_pct || 0),
        current_gpa: Number(r.current_gpa || 0),
        isAtRisk: Number(r.attendance_pct || 0) < 75.0 || Number(r.current_gpa || 0) < 6.0,
      })),
    });
  } catch (err) {
    console.error('Faculty roster error:', err);
    if (err.status === 503) {
      const roster = demoDataService.getDemoFacultyRoster();
      return res.status(200).json({ success: true, totalStudents: roster.length, roster, isOfflineDemo: true });
    }
    return res.status(500).json({ success: false, message: 'Failed to retrieve student roster.' });
  }
}

async function updateMarks(req, res) {
  return marksController.recordMarks(req, res);
}

async function updateAttendance(req, res) {
  return attendanceController.recordAttendance(req, res);
}

module.exports = {
  getAssignedSubjects,
  getStudentRoster,
  updateMarks,
  updateAttendance,
};
