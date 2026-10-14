/**
 * Academic Progress and Achievement Tracking System (ATS)
 * Achievements Controller
 */

const db = require('../config/db');

async function getAchievements(req, res) {
  try {
    let studentId = req.params.studentId || req.query.student_id || req.user.student_id;
    if (studentId) studentId = parseInt(studentId, 10);

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID required.' });
    }

    const rows = await db.query(
      `SELECT a.id, a.title, a.category, a.description, a.achievement_date, a.status, a.verified_by, a.created_at
       FROM achievements a
       WHERE a.student_id = ?
       ORDER BY a.achievement_date DESC`,
      [studentId]
    );

    return res.status(200).json({
      success: true,
      student_id: studentId,
      total: rows.length,
      achievements: rows,
    });
  } catch (err) {
    console.error('Error fetching achievements:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve achievements.' });
  }
}

async function createAchievement(req, res) {
  const { title, category = 'academic', description, achievement_date } = req.body;
  const studentId = req.user.student_id;

  if (!title || !studentId) {
    return res.status(400).json({ success: false, message: 'Title and student profile required.' });
  }

  try {
    const result = await db.query(
      `INSERT INTO achievements (student_id, title, category, description, achievement_date, status)
       VALUES (?, ?, ?, ?, ?, 'verified')`,
      [studentId, title.trim(), category, description || null, achievement_date || new Date().toISOString().split('T')[0]]
    );

    return res.status(201).json({
      success: true,
      message: 'Achievement added successfully.',
      achievementId: result.insertId,
    });
  } catch (err) {
    console.error('Error creating achievement:', err);
    return res.status(500).json({ success: false, message: 'Failed to create achievement.' });
  }
}

async function verifyAchievement(req, res) {
  const { id } = req.params;
  const { status = 'verified' } = req.body;

  try {
    await db.query(
      'UPDATE achievements SET status = ?, verified_by = ? WHERE id = ?',
      [status, req.user.name || req.user.username, id]
    );

    return res.status(200).json({
      success: true,
      message: `Achievement status updated to ${status}.`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update achievement status.' });
  }
}

module.exports = {
  getAchievements,
  createAchievement,
  verifyAchievement,
};
