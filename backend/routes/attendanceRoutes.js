const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { verifyToken, requireRole, verifyStudentOwnership } = require('../middleware/authMiddleware');

router.get('/', verifyToken, verifyStudentOwnership, attendanceController.getAttendance);
router.get('/:studentId', verifyToken, verifyStudentOwnership, attendanceController.getAttendance);
router.post('/', verifyToken, requireRole('admin', 'faculty'), attendanceController.recordAttendance);

module.exports = router;
