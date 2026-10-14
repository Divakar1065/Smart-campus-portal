/**
 * Academic Progress and Achievement Tracking System (ATS)
 * Institutional Administrator & Analytics Controller
 */

const db = require('../config/db');
const demoDataService = require('../services/demoDataService');

async function getOverview(req, res) {
  try {
    // 1. Total Students Count
    const [totalStudentsRow] = await db.query('SELECT COUNT(*) AS total FROM students');
    const totalStudents = totalStudentsRow ? totalStudentsRow.total : 0;

    // 2. Department Breakdown
    const deptRows = await db.query(
      `SELECT d.id, d.dept_name, d.dept_code, COUNT(s.id) AS student_count
       FROM departments d
       LEFT JOIN students s ON d.id = s.dept_id
       GROUP BY d.id, d.dept_name, d.dept_code`
    );

    // 3. Average CGPA across institution
    const cgpaRows = await db.query(
      `SELECT ROUND(SUM(m.grade_points * sub.credits) / SUM(sub.credits), 2) AS avg_cgpa
       FROM marks m
       JOIN subjects sub ON m.subject_id = sub.id`
    );
    const institutionalAvgCgpa = cgpaRows[0] && cgpaRows[0].avg_cgpa ? Number(cgpaRows[0].avg_cgpa) : 0.0;

    // 4. Institutional Overall Attendance
    const attRows = await db.query(
      `SELECT ROUND(SUM(attended_classes) * 100.0 / SUM(total_classes), 1) AS avg_attendance
       FROM attendance`
    );
    const institutionalAvgAttendance = attRows[0] && attRows[0].avg_attendance ? Number(attRows[0].avg_attendance) : 0.0;

    // 5. Total Achievements
    const [achRow] = await db.query('SELECT COUNT(*) AS total FROM achievements WHERE status = "verified"');
    const totalAchievements = achRow ? achRow.total : 0;

    // 6. At-Risk Student Count (Attendance < 75% or GPA < 6.0)
    const atRiskStudents = await getAtRiskStudentList();

    return res.status(200).json({
      success: true,
      overview: {
        totalStudents,
        totalDepartments: deptRows.length,
        averageCgpa: institutionalAvgCgpa,
        overallAttendance: institutionalAvgAttendance,
        totalAchievements,
        atRiskCount: atRiskStudents.length,
        departmentBreakdown: deptRows,
      },
    });
  } catch (err) {
    console.error('Error in admin overview:', err);
    if (err.status === 503) {
      const overview = demoDataService.getDemoAdminOverview();
      return res.status(200).json({ success: true, overview, isOfflineDemo: true });
    }
    return res.status(500).json({ success: false, message: 'Failed to retrieve administrative overview.' });
  }
}

async function getAtRiskStudentList() {
  const query = `
    SELECT s.id AS student_id, s.name, s.register_no, d.dept_code, s.current_semester,
           ROUND(SUM(a.attended_classes) * 100.0 / NULLIF(SUM(a.total_classes), 0), 1) AS overall_attendance,
           ROUND(SUM(m.grade_points * sub.credits) / NULLIF(SUM(sub.credits), 0), 2) AS cgpa
    FROM students s
    JOIN departments d ON s.dept_id = d.id
    LEFT JOIN attendance a ON s.id = a.student_id
    LEFT JOIN marks m ON s.id = m.student_id
    LEFT JOIN subjects sub ON m.subject_id = sub.id
    GROUP BY s.id, s.name, s.register_no, d.dept_code, s.current_semester
    HAVING (overall_attendance < 75.0 AND overall_attendance IS NOT NULL) OR (cgpa < 6.0 AND cgpa IS NOT NULL)
  `;
  const rows = await db.query(query);
  return rows.map(r => ({
    ...r,
    overall_attendance: Number(r.overall_attendance || 0),
    cgpa: Number(r.cgpa || 0),
    riskFactors: [
      ...(Number(r.overall_attendance) < 75 ? [`Attendance critical (${r.overall_attendance}%)`] : []),
      ...(Number(r.cgpa) < 6.0 ? [`Low academic performance (${r.cgpa} CGPA)`] : []),
    ],
  }));
}

async function getAtRisk(req, res) {
  try {
    const list = await getAtRiskStudentList();
    return res.status(200).json({
      success: true,
      totalAtRisk: list.length,
      students: list,
    });
  } catch (err) {
    console.error('Error fetching at-risk students:', err);
    if (err.status === 503) {
      const list = demoDataService.getDemoAdminAtRisk();
      return res.status(200).json({ success: true, totalAtRisk: list.length, students: list, isOfflineDemo: true });
    }
    return res.status(500).json({ success: false, message: 'Failed to retrieve at-risk student records.' });
  }
}

async function getAllStudents(req, res) {
  try {
    let sql = `
      SELECT s.id, s.name, s.register_no, s.current_semester, s.section, s.email, s.phone,
             d.dept_name, d.dept_code
      FROM students s
      JOIN departments d ON s.dept_id = d.id
    `;
    const params = [];

    if (req.query.dept_id) {
      sql += ' WHERE s.dept_id = ?';
      params.push(parseInt(req.query.dept_id, 10));
    }

    sql += ' ORDER BY s.register_no ASC';

    const students = await db.query(sql, params);
    return res.status(200).json({ success: true, total: students.length, students });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch students list.' });
  }
}

module.exports = {
  getOverview,
  getAtRisk,
  getAllStudents,
};
