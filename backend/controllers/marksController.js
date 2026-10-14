/**
 * Academic Progress and Achievement Tracking System (ATS)
 * Marks & Academic Performance Controller
 */

const db = require('../config/db');

function calculateGradeAndPoints(marks, maxMarks = 100) {
  const percentage = (marks / maxMarks) * 100;
  if (percentage >= 90) return { grade: 'O', points: 10.0 };
  if (percentage >= 80) return { grade: 'A+', points: 9.0 };
  if (percentage >= 70) return { grade: 'A', points: 8.0 };
  if (percentage >= 60) return { grade: 'B+', points: 7.0 };
  if (percentage >= 50) return { grade: 'B', points: 6.0 };
  if (percentage >= 45) return { grade: 'C', points: 5.0 };
  return { grade: 'F', points: 0.0 };
}

async function getMarks(req, res) {
  try {
    let studentId = req.params.studentId || req.query.student_id || req.user.student_id;
    if (studentId) studentId = parseInt(studentId, 10);

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID required.' });
    }

    let sql = `
      SELECT m.id, m.semester, m.exam_type, m.marks_obtained, m.max_marks,
             m.grade, m.grade_points,
             sub.id AS subject_id, sub.subject_code, sub.subject_name, sub.credits
      FROM marks m
      JOIN subjects sub ON m.subject_id = sub.id
      WHERE m.student_id = ?
    `;
    const params = [studentId];

    if (req.query.semester) {
      sql += ' AND m.semester = ?';
      params.push(parseInt(req.query.semester, 10));
    }

    sql += ' ORDER BY m.semester ASC, sub.subject_code ASC';

    const marks = await db.query(sql, params);

    // Compute credit-weighted summary
    let totalCredits = 0;
    let weightedPoints = 0;
    for (const m of marks) {
      const c = Number(m.credits || 3);
      totalCredits += c;
      weightedPoints += Number(m.grade_points || 0) * c;
    }
    const gpa = totalCredits > 0 ? Number((weightedPoints / totalCredits).toFixed(2)) : 0.0;

    return res.status(200).json({
      success: true,
      student_id: studentId,
      gpa,
      totalCredits,
      marks: marks.map(m => ({
        id: m.id,
        subject: m.subject_name,
        code: m.subject_code,
        semester: m.semester,
        examType: m.exam_type,
        marksObtained: Number(m.marks_obtained),
        maxMarks: Number(m.max_marks),
        grade: m.grade,
        gradePoints: Number(m.grade_points),
        credits: m.credits,
      })),
    });
  } catch (err) {
    console.error('Error fetching marks:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve academic marks.' });
  }
}

async function recordMarks(req, res) {
  const { student_id, subject_id, semester, exam_type = 'semester', marks_obtained, max_marks = 100 } = req.body;

  if (!student_id || !subject_id || !semester || marks_obtained === undefined) {
    return res.status(400).json({
      success: false,
      message: 'student_id, subject_id, semester, and marks_obtained are required.',
    });
  }

  const { grade, points } = calculateGradeAndPoints(Number(marks_obtained), Number(max_marks));

  try {
    await db.query(
      `INSERT INTO marks (student_id, subject_id, semester, exam_type, marks_obtained, max_marks, grade, grade_points)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         marks_obtained = VALUES(marks_obtained),
         max_marks = VALUES(max_marks),
         grade = VALUES(grade),
         grade_points = VALUES(grade_points)`,
      [student_id, subject_id, semester, exam_type, marks_obtained, max_marks, grade, points]
    );

    return res.status(200).json({
      success: true,
      message: 'Marks recorded successfully.',
      grade,
      grade_points: points,
    });
  } catch (err) {
    console.error('Error recording marks:', err);
    return res.status(500).json({ success: false, message: 'Failed to record marks.' });
  }
}

module.exports = {
  getMarks,
  recordMarks,
};
