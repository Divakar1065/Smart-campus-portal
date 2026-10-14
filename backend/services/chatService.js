/**
 * Academic Progress and Achievement Tracking System (ATS)
 * Grounded Contextual Academic Chatbot Service
 */

const db = require('../config/db');

async function processChatMessage(userId, studentId, message) {
  if (!message || !message.trim()) {
    return {
      reply: 'Please ask a question regarding your academic progress, attendance, marks, or achievements.',
    };
  }

  const queryText = message.toLowerCase().trim();

  // If studentId is present, fetch student academic context from DB
  let studentProfile = null;
  let marks = [];
  let attendance = [];
  let achievements = [];

  if (studentId) {
    try {
      const studentRows = await db.query(
        `SELECT s.id, s.name, s.register_no, d.dept_name, s.current_semester
         FROM students s
         LEFT JOIN departments d ON s.dept_id = d.id
         WHERE s.id = ?`,
        [studentId]
      );
      if (studentRows && studentRows.length > 0) {
        studentProfile = studentRows[0];
      }

      marks = await db.query(
        `SELECT m.marks_obtained, m.max_marks, m.grade, m.grade_points,
                sub.subject_name, sub.subject_code, sub.credits
         FROM marks m
         JOIN subjects sub ON m.subject_id = sub.id
         WHERE m.student_id = ?`,
        [studentId]
      );

      attendance = await db.query(
        `SELECT a.total_classes, a.attended_classes, a.percentage,
                sub.subject_name, sub.subject_code
         FROM attendance a
         JOIN subjects sub ON a.subject_id = sub.id
         WHERE a.student_id = ?`,
        [studentId]
      );

      achievements = await db.query(
        `SELECT title, category, status, achievement_date
         FROM achievements
         WHERE student_id = ?`,
        [studentId]
      );
    } catch (err) {
      console.warn('Could not retrieve DB context for chatbot:', err.message);
    }
  }

  // Calculate stats from DB records
  let overallAttendance = 0;
  let totalAttended = 0;
  let totalClasses = 0;
  for (const a of attendance) {
    totalAttended += Number(a.attended_classes || 0);
    totalClasses += Number(a.total_classes || 0);
  }
  if (totalClasses > 0) {
    overallAttendance = Number(((totalAttended * 100.0) / totalClasses).toFixed(1));
  }

  let totalCredits = 0;
  let weightedPoints = 0;
  for (const m of marks) {
    const c = Number(m.credits || 3);
    totalCredits += c;
    weightedPoints += Number(m.grade_points || 0) * c;
  }
  const calculatedGpa = totalCredits > 0 ? (weightedPoints / totalCredits).toFixed(2) : 'N/A';

  let reply = '';

  // 1. Intent: GPA / CGPA / Marks
  if (queryText.includes('gpa') || queryText.includes('cgpa') || queryText.includes('score') || queryText.includes('grade')) {
    if (marks.length > 0) {
      const topMark = [...marks].sort((a, b) => b.marks_obtained - a.marks_obtained)[0];
      reply = `📊 **Academic Performance Facts:**\n- Your calculated credit-weighted GPA is **${calculatedGpa}** across ${marks.length} evaluated subjects.\n- Top subject: **${topMark.subject_name}** with **${topMark.marks_obtained}%** (Grade ${topMark.grade}).`;
    } else {
      reply = 'No academic marks have been recorded yet for your current semester.';
    }
  }
  // 2. Intent: Attendance
  else if (queryText.includes('attendance') || queryText.includes('absent') || queryText.includes('present') || queryText.includes('bunk')) {
    if (attendance.length > 0) {
      const lowAtt = attendance.filter(a => Number(a.percentage) < 75);
      reply = `📅 **Attendance Facts:**\n- Overall Aggregate Attendance: **${overallAttendance}%** (${totalAttended}/${totalClasses} lectures attended).\n- Eligibility Status: ${overallAttendance >= 75 ? '✅ Eligible for examinations' : '⚠️ Below 75% cutoff — immediate remediation required'}.`;
      if (lowAtt.length > 0) {
        reply += `\n- Subjects requiring attention: ${lowAtt.map(a => `${a.subject_name} (${a.percentage}%)`).join(', ')}.`;
      }
    } else {
      reply = '📅 **Attendance Policy & Criteria:**\nInstitutional regulations mandate a minimum of **75%** overall and subject-wise attendance to remain eligible for end-semester examinations. (No personal attendance records found for your account yet).';
    }
  }
  // 3. Intent: Specific Subject Search (e.g., Operating Systems, Python, Maths)
  else if (marks.some(m => queryText.includes(m.subject_name.toLowerCase()) || queryText.includes(m.subject_code.toLowerCase())) ||
           attendance.some(a => queryText.includes(a.subject_name.toLowerCase()) || queryText.includes(a.subject_code.toLowerCase()))) {
    const matchMark = marks.find(m => queryText.includes(m.subject_name.toLowerCase()) || queryText.includes(m.subject_code.toLowerCase()));
    const matchAtt = attendance.find(a => queryText.includes(a.subject_name.toLowerCase()) || queryText.includes(a.subject_code.toLowerCase()));
    const subName = matchMark ? matchMark.subject_name : matchAtt.subject_name;

    reply = `📘 **Subject Status for ${subName}:**\n`;
    if (matchMark) {
      reply += `- Marks: **${matchMark.marks_obtained}/${matchMark.max_marks}** (Grade: **${matchMark.grade}**, Points: **${matchMark.grade_points}**)\n`;
    }
    if (matchAtt) {
      reply += `- Attendance: **${matchAtt.percentage}%** (${matchAtt.attended_classes}/${matchAtt.total_classes} classes attended)\n`;
    }
    reply += matchAtt && Number(matchAtt.percentage) < 75
      ? '⚠️ Warning: Attendance is below 75% in this subject.'
      : '✅ Meeting institutional attendance norms.';
  }
  // 4. Intent: Weak Subjects / Areas of Improvement
  else if (queryText.includes('weak') || queryText.includes('improve') || queryText.includes('focus') || queryText.includes('help')) {
    const weakList = marks.filter(m => Number(m.marks_obtained) < 60 || Number(m.grade_points) < 7);
    if (weakList.length > 0) {
      reply = `💡 **Academic Recommendations:**\nBased on your marks records, you should focus on:\n${weakList.map(w => `- **${w.subject_name}** (${w.marks_obtained}%, Grade ${w.grade})`).join('\n')}\nRecommendation: Review lecture notes and schedule lab practice for these topics.`;
    } else {
      reply = `💡 **Academic Standing:**\nYou have no subjects under the critical 60% threshold! Maintain your strong rhythm with **${calculatedGpa}** GPA.`;
    }
  }
  // 5. Intent: Achievements
  else if (queryText.includes('achievement') || queryText.includes('award') || queryText.includes('prize') || queryText.includes('certificate')) {
    reply = `🏆 **Achievements Summary:**\nYou have **${achievements.length}** recorded achievements.\n`;
    if (achievements.length > 0) {
      reply += achievements.map(ach => `- **${ach.title}** (${ach.category.toUpperCase()}) — ${ach.status}`).join('\n');
    }
  }
  // 6. Intent: Exam Eligibility
  else if (queryText.includes('eligible') || queryText.includes('hall ticket') || queryText.includes('exam')) {
    if (overallAttendance >= 75) {
      reply = `✅ **Exam Eligibility Confirmed:** Your overall attendance of **${overallAttendance}%** qualifies you for upcoming semester examinations.`;
    } else {
      reply = `⚠️ **Ineligible / At-Risk:** Your overall attendance of **${overallAttendance}%** is below the university 75% cutoff. Please speak with your HOD for condonation procedures.`;
    }
  }
  // 7. General Assistant Greeting & Fallback
  else {
    const studentGreeting = studentProfile ? `Hello ${studentProfile.name}! ` : 'Hello! ';
    reply = `${studentGreeting}I am your ATS Academic Assistant. Here are topics you can ask me about:\n- *"What is my GPA?"*\n- *"What is my attendance in Operating Systems?"*\n- *"Am I eligible for end-semester exams?"*\n- *"Which subjects should I focus on?"*\n- *"List my achievements."*`;
  }

  // Persist interaction to chat_history table if user exists and DB is connected
  if (userId) {
    try {
      await db.query(
        'INSERT INTO chat_history (user_id, message, response) VALUES (?, ?, ?)',
        [userId, message.trim(), reply]
      );
    } catch (err) {
      // Non-blocking log
    }
  }

  return { reply };
}

module.exports = {
  processChatMessage,
};
