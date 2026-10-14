const express = require('express');
const router = express.Router();
const marksController = require('../controllers/marksController');
const { verifyToken, requireRole, verifyStudentOwnership } = require('../middleware/authMiddleware');

router.get('/', verifyToken, verifyStudentOwnership, marksController.getMarks);
router.get('/:studentId', verifyToken, verifyStudentOwnership, marksController.getMarks);
router.post('/', verifyToken, requireRole('admin', 'faculty'), marksController.recordMarks);

module.exports = router;
