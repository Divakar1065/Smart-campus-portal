/**
 * Academic Progress and Achievement Tracking System (ATS)
 * Unified Backend Server & Static Web Server
 */

require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

// Route modules
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const marksRoutes = require('./routes/marksRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const achievementsRoutes = require('./routes/achievementsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const aiRoutes = require('./routes/aiRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Controllers & middleware for Phase 11 contract bindings
const studentController = require('./controllers/studentController');
const marksController = require('./controllers/marksController');
const attendanceController = require('./controllers/attendanceController');
const achievementsController = require('./controllers/achievementsController');
const adminController = require('./controllers/adminController');
const aiController = require('./controllers/aiController');
const { verifyToken, requireRole, verifyStudentOwnership } = require('./middleware/authMiddleware');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Core Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging (non-sensitive)
app.use((req, res, next) => {
  if (!req.path.startsWith('/assets') && !req.path.includes('.css') && !req.path.includes('.js')) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Serve frontend static assets from /frontend directory
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// API Route Mounts
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/marks', marksRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/ai', aiRoutes);

// Phase 11 Direct Contract Endpoints & Aliases
app.get('/api/students/me', verifyToken, studentController.getProfile);
app.get('/api/dashboard/:studentId', verifyToken, verifyStudentOwnership, studentController.getDashboard);
app.get('/api/performance/:studentId', verifyToken, verifyStudentOwnership, marksController.getMarks);
app.get('/api/attendance/:studentId', verifyToken, verifyStudentOwnership, attendanceController.getAttendance);
app.get('/api/achievements/:studentId', verifyToken, verifyStudentOwnership, achievementsController.getAchievements);
app.get('/api/dashboard/admin/summary', verifyToken, requireRole('admin'), adminController.getOverview);
app.post('/api/chatbot/message', verifyToken, aiController.postChat);
app.get('/api/analysis', verifyToken, verifyStudentOwnership, aiController.getAnalysis);
app.post('/api/chat', verifyToken, aiController.postChat);

// Single Page Application Fallback: Route unmatched GET requests to frontend/index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Centralized Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server if executed directly
let server = null;
if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log('====================================================');
    console.log(`🚀 ATS Server listening on http://localhost:${PORT}`);
    console.log(`📁 Static Frontend served from: ${frontendPath}`);
    console.log(`🩺 Healthcheck: http://localhost:${PORT}/api/health`);
    console.log('====================================================');
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use by another process.`);
      console.error(`   Please terminate the conflicting process or set PORT=<new_port> in .env.`);
    } else {
      console.error(`❌ Server startup error:`, err);
    }
    process.exit(1);
  });
}

module.exports = { app, server };
