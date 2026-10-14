const express = require('express');
const router = express.Router();
const facultyController = require('../controllers/facultyController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.get('/subjects', verifyToken, requireRole('faculty', 'admin'), facultyController.getAssignedSubjects);
router.get('/students', verifyToken, requireRole('faculty', 'admin'), facultyController.getStudentRoster);
router.post('/marks', verifyToken, requireRole('faculty', 'admin'), facultyController.updateMarks);
router.post('/attendance', verifyToken, requireRole('faculty', 'admin'), facultyController.updateAttendance);

module.exports = router;
