/**
 * Academic Progress and Achievement Tracking System (ATS)
 * AI Intelligence & Academic Chatbot Controller
 */

const db = require('../config/db');
const aiService = require('../services/aiService');
const chatService = require('../services/chatService');

async function getAnalysis(req, res) {
  try {
    let studentId = req.params.studentId || req.query.student_id || req.user.student_id;
    if (studentId) studentId = parseInt(studentId, 10);

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID required for AI analysis.' });
    }

    const studentRows = await db.query('SELECT name FROM students WHERE id = ?', [studentId]);
    const studentName = studentRows[0] ? studentRows[0].name : 'Student';

    const marks = await db.query(
      `SELECT m.marks_obtained, m.max_marks, m.grade, m.grade_points,
              sub.subject_name, sub.credits
       FROM marks m
       JOIN subjects sub ON m.subject_id = sub.id
       WHERE m.student_id = ?`,
      [studentId]
    );

    const attendance = await db.query(
      `SELECT a.total_classes, a.attended_classes, a.percentage,
              sub.subject_name
       FROM attendance a
       JOIN subjects sub ON a.subject_id = sub.id
       WHERE a.student_id = ?`,
      [studentId]
    );

    const analysisResult = await aiService.analyzeStudentPerformance({
      name: studentName,
      marks,
      attendance,
    });

    return res.status(200).json({
      success: true,
      analysis: analysisResult,
    });
  } catch (err) {
    console.error('AI Analysis error:', err);
    return res.status(500).json({ success: false, message: 'Failed to run academic AI analysis.' });
  }
}

async function runAgent(req, res) {
  try {
    let studentId = req.body.student_id || req.user.student_id;
    if (studentId) studentId = parseInt(studentId, 10);

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Target student ID required for AI agent.' });
    }

    const studentRows = await db.query('SELECT name FROM students WHERE id = ?', [studentId]);
    const studentName = studentRows[0] ? studentRows[0].name : 'Student';

    const marks = await db.query(
      `SELECT m.marks_obtained, m.max_marks, m.grade, m.grade_points,
              sub.subject_name, sub.credits
       FROM marks m
       JOIN subjects sub ON m.subject_id = sub.id
       WHERE m.student_id = ?`,
      [studentId]
    );

    const attendance = await db.query(
      `SELECT a.total_classes, a.attended_classes, a.percentage,
              sub.subject_name
       FROM attendance a
       JOIN subjects sub ON a.subject_id = sub.id
       WHERE a.student_id = ?`,
      [studentId]
    );

    const analysisResult = await aiService.analyzeStudentPerformance({
      name: studentName,
      marks,
      attendance,
    });

    // Persist agent findings to ai_recommendations table
    try {
      await db.query(
        `INSERT INTO ai_recommendations (student_id, gpa_predicted, weak_subjects, strong_subjects, recommendations, alerts)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          studentId,
          analysisResult.cgpa || 0.0,
          JSON.stringify(analysisResult.weakSubjects || []),
          JSON.stringify(analysisResult.strongSubjects || []),
          JSON.stringify(analysisResult.recommendations || []),
          JSON.stringify(analysisResult.alerts || []),
        ]
      );
    } catch (saveErr) {
      console.warn('Could not persist ai recommendation to DB:', saveErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'AI agent completed analysis successfully.',
      agentResult: analysisResult,
    });
  } catch (err) {
    console.error('AI Agent error:', err);
    return res.status(500).json({ success: false, message: 'AI agent failed to execute.' });
  }
}

async function postChat(req, res) {
  const { message } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
  }

  try {
    const result = await chatService.processChatMessage(
      req.user.id,
      req.user.student_id,
      message
    );

    return res.status(200).json({
      success: true,
      reply: result.reply,
    });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ success: false, message: 'Chatbot processing encountered an issue.' });
  }
}

module.exports = {
  getAnalysis,
  runAgent,
  postChat,
};
