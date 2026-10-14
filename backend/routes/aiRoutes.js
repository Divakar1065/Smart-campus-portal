const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { verifyToken, verifyStudentOwnership } = require('../middleware/authMiddleware');

router.get('/analysis', verifyToken, verifyStudentOwnership, aiController.getAnalysis);
router.get('/analysis/:studentId', verifyToken, verifyStudentOwnership, aiController.getAnalysis);
router.post('/run-agent', verifyToken, verifyStudentOwnership, aiController.runAgent);
router.post('/chat', verifyToken, aiController.postChat);
router.post('/message', verifyToken, aiController.postChat);

module.exports = router;
