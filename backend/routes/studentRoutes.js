const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyToken, verifyStudentOwnership } = require('../middleware/authMiddleware');

router.get('/dashboard', verifyToken, verifyStudentOwnership, studentController.getDashboard);
router.get('/dashboard/:studentId', verifyToken, verifyStudentOwnership, studentController.getDashboard);
router.get('/profile', verifyToken, verifyStudentOwnership, studentController.getProfile);
router.get('/profile/:studentId', verifyToken, verifyStudentOwnership, studentController.getProfile);
router.get('/me', verifyToken, studentController.getProfile);

module.exports = router;
