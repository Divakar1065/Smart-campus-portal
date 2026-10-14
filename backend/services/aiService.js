/**
 * Academic Progress and Achievement Tracking System (ATS)
 * Dual-Engine Academic Intelligence Service
 * 
 * Mode 1: Executes standalone Python statistical engine (ai/academic_analyzer.py)
 * Mode 2: High-precision Native Heuristic Intelligence Engine
 */

const { spawn } = require('child_process');
const path = require('path');

let pythonChecked = false;
let pythonExecutable = null;

async function detectPython() {
  if (pythonChecked) return pythonExecutable;

  // On Windows, verify python is not just the Microsoft Store redirect stub
  if (process.platform === 'win32') {
    try {
      const { execSync } = require('child_process');
      const whereOut = execSync('where python', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      // If path contains WindowsApps or no real python is listed, do not invoke
      const paths = whereOut.split(/\r?\n/).filter(p => p.trim());
      const realPath = paths.find(p => !p.includes('WindowsApps'));
      if (!realPath) {
        pythonChecked = true;
        pythonExecutable = null;
        return null;
      }
    } catch (e) {
      pythonChecked = true;
      pythonExecutable = null;
      return null;
    }
  }

  const candidates = ['python', 'python3', 'py'];
  for (const cmd of candidates) {
    const isAvailable = await new Promise((resolve) => {
      try {
        const proc = spawn(cmd, ['--version'], { timeout: 1500 });
        let resolved = false;
        proc.on('error', () => { if (!resolved) { resolved = true; resolve(false); } });
        proc.on('close', (code) => { if (!resolved) { resolved = true; resolve(code === 0); } });
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            try { proc.kill(); } catch (k) {}
            resolve(false);
          }
        }, 1500);
      } catch (e) {
        resolve(false);
      }
    });

    if (isAvailable) {
      pythonExecutable = cmd;
      break;
    }
  }

  pythonChecked = true;
  return pythonExecutable;
}

/**
 * Native Heuristic Intelligence Analyzer
 * Evaluates performance, subject mastery, credit-weighted trends, and attendance risks.
 */
function analyzeNative(studentData) {
  const { name, marks = [], attendance = [] } = studentData;

  const weakSubjects = [];
  const strongSubjects = [];
  const alerts = [];
  const recommendations = [];

  // 1. Analyze marks & grade points
  let totalCredits = 0;
  let weightedPoints = 0;

  for (const m of marks) {
    const credits = Number(m.credits || 3);
    const score = Number(m.marks_obtained || 0);
    const gradePoints = Number(m.grade_points || (score >= 90 ? 10 : score >= 80 ? 9 : score >= 70 ? 8 : score >= 60 ? 7 : score >= 50 ? 6 : score >= 45 ? 5 : 0));

    totalCredits += credits;
    weightedPoints += gradePoints * credits;

    const subjectName = m.subject_name || m.subject || `Subject ${m.subject_id}`;
    if (score < 50 || gradePoints < 6) {
      weakSubjects.push({ subject: subjectName, score, gradePoints });
    } else if (score >= 80 || gradePoints >= 9) {
      strongSubjects.push({ subject: subjectName, score, gradePoints });
    }
  }

  const calculatedCgpa = totalCredits > 0 ? Number((weightedPoints / totalCredits).toFixed(2)) : 0;

  // 2. Analyze Attendance
  let totalAttended = 0;
  let totalClasses = 0;
  const lowAttendanceSubjects = [];

  for (const a of attendance) {
    const attended = Number(a.attended_classes || 0);
    const total = Number(a.total_classes || 0);
    const pct = total > 0 ? (attended * 100.0) / total : Number(a.percentage || 0);

    totalAttended += attended;
    totalClasses += total;

    const subjectName = a.subject_name || a.subject || `Subject ${a.subject_id}`;
    if (pct < 75) {
      lowAttendanceSubjects.push({ subject: subjectName, percentage: Number(pct.toFixed(1)) });
    }
  }

  const overallAttendancePct = totalClasses > 0 ? Number(((totalAttended * 100.0) / totalClasses).toFixed(1)) : 0;

  // 3. Generate Actionable Alerts & Guidance
  if (overallAttendancePct < 75 && totalClasses > 0) {
    alerts.push(`Critical: Overall attendance is ${overallAttendancePct}%, which is below the mandatory 75% institutional threshold.`);
  }

  for (const low of lowAttendanceSubjects) {
    alerts.push(`Attendance Alert: ${low.subject} is at ${low.percentage}%. Minimum 75% required to sit for end-semester examinations.`);
  }

  for (const weak of weakSubjects) {
    alerts.push(`Academic Alert: Low mastery detected in ${weak.subject} (Score: ${weak.score}%). Requires targeted revision.`);
    recommendations.push(`Dedicate an extra 4 hours weekly to practice problem-solving in ${weak.subject}.`);
  }

  if (weakSubjects.length === 0 && calculatedCgpa >= 8.0) {
    recommendations.push('Outstanding performance! Consider engaging in faculty research, technical hackathons, or peer tutoring.');
  } else if (calculatedCgpa >= 7.0) {
    recommendations.push('Consistent academic trajectory. Focus on converting B+ grades into A/A+ in core engineering subjects.');
  } else {
    recommendations.push('Schedule academic mentoring sessions with your faculty advisor to address core concept gaps.');
  }

  if (lowAttendanceSubjects.length === 0 && overallAttendancePct >= 85) {
    recommendations.push('Excellent attendance discipline. Maintain this cadence through end-semester assessments.');
  }

  // Summary message
  let summary = `Student ${name || 'Learner'} holds a credit-weighted GPA of ${calculatedCgpa} with ${overallAttendancePct}% aggregate attendance.`;
  if (weakSubjects.length > 0) {
    summary += ` Focus required in: ${weakSubjects.map(w => w.subject).join(', ')}.`;
  } else {
    summary += ` Academic standing is robust with strengths in ${strongSubjects.map(s => s.subject).slice(0, 2).join(', ')}.`;
  }

  return {
    engine: 'native-heuristic',
    studentName: name,
    cgpa: calculatedCgpa,
    overallAttendance: overallAttendancePct,
    weakSubjects: weakSubjects.map(w => w.subject),
    strongSubjects: strongSubjects.map(s => s.subject),
    alerts,
    recommendations,
    summary,
  };
}

/**
 * Primary Analyze Entry Point
 * Tries Python engine first; automatically falls back to native heuristic engine.
 */
async function analyzeStudentPerformance(studentData) {
  const pyCmd = await detectPython();

  if (pyCmd) {
    try {
      const scriptPath = path.join(__dirname, '../../ai/academic_analyzer.py');
      const result = await new Promise((resolve, reject) => {
        const proc = spawn(pyCmd, [scriptPath]);
        let stdout = '';
        let stderr = '';

        proc.stdin.write(JSON.stringify(studentData));
        proc.stdin.end();

        proc.stdout.on('data', (d) => { stdout += d.toString(); });
        proc.stderr.on('data', (d) => { stderr += d.toString(); });

        proc.on('close', (code) => {
          if (code === 0 && stdout.trim()) {
            try {
              const parsed = JSON.parse(stdout);
              parsed.engine = 'python-statistical';
              resolve(parsed);
            } catch (err) {
              reject(err);
            }
          } else {
            reject(new Error(`Python process exited with code ${code}: ${stderr}`));
          }
        });
      });

      return result;
    } catch (err) {
      console.warn('Python AI execution failed, using native heuristic engine:', err.message);
    }
  }

  return analyzeNative(studentData);
}

module.exports = {
  analyzeStudentPerformance,
  analyzeNative,
  detectPython,
};
