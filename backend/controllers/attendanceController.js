/**
 * Academic Progress and Achievement Tracking System (ATS)
 * Attendance Controller
 */

const db = require('../config/db');

async function getAttendance(req, res) {
  try {
    let studentId = req.params.studentId || req.query.student_id || req.user.student_id;
    if (studentId) studentId = parseInt(studentId, 10);

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID required.' });
    }

    const rows = await db.query(
      `SELECT a.id, a.total_classes, a.attended_classes, a.percentage, a.last_updated,
              sub.id AS subject_id, sub.subject_code, sub.subject_name
       FROM attendance a
       JOIN subjects sub ON a.subject_id = sub.id
       WHERE a.student_id = ?
       ORDER BY sub.subject_code ASC`,
      [studentId]
    );

    let totalAttended = 0;
    let totalClasses = 0;
    const lowAttendance = [];

    const subjects = rows.map(r => {
      const att = Number(r.attended_classes);
      const tot = Number(r.total_classes);
      const pct = tot > 0 ? Number(((att * 100.0) / tot).toFixed(2)) : 0.0;

      totalAttended += att;
      totalClasses += tot;

      if (pct < 75.0) {
        lowAttendance.push({
          subject: r.subject_name,
          code: r.subject_code,
          percentage: pct,
          classesNeededFor75: Math.max(0, Math.ceil((0.75 * tot - att) / 0.25)),
        });
      }

      return {
        id: r.id,
        subjectId: r.subject_id,
        subject: r.subject_name,
        code: r.subject_code,
        attended: att,
        total: tot,
        percentage: pct,
        isLow: pct < 75.0,
      };
    });

    const overallPercentage = totalClasses > 0 ? Number(((totalAttended * 100.0) / totalClasses).toFixed(2)) : 0.0;

    return res.status(200).json({
      success: true,
      student_id: studentId,
      overallPercentage,
      totalAttended,
      totalClasses,
      isEligible: overallPercentage >= 75.0,
      lowAttendanceWarnings: lowAttendance,
      attendance: subjects,
    });
  } catch (err) {
    console.error('Error fetching attendance:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve attendance records.' });
  }
}

async function recordAttendance(req, res) {
  const { student_id, subject_id, total_classes, attended_classes } = req.body;

  if (!student_id || !subject_id || total_classes === undefined || attended_classes === undefined) {
    return res.status(400).json({
      success: false,
      message: 'student_id, subject_id, total_classes, and attended_classes are required.',
    });
  }

  const tot = parseInt(total_classes, 10);
  const att = parseInt(attended_classes, 10);
  const percentage = tot > 0 ? (att * 100.0) / tot : 0;

  try {
    await db.query(
      `INSERT INTO attendance (student_id, subject_id, total_classes, attended_classes, percentage)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         total_classes = VALUES(total_classes),
         attended_classes = VALUES(attended_classes),
         percentage = VALUES(percentage)`,
      [student_id, subject_id, tot, att, percentage]
    );

    return res.status(200).json({
      success: true,
      message: 'Attendance recorded successfully.',
      percentage: Number(percentage.toFixed(2)),
    });
  } catch (err) {
    console.error('Error recording attendance:', err);
    return res.status(500).json({ success: false, message: 'Failed to record attendance.' });
  }
}

module.exports = {
  getAttendance,
  recordAttendance,
};
