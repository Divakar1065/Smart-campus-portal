const express = require('express');
const router = express.Router();
const achievementsController = require('../controllers/achievementsController');
const { verifyToken, requireRole, verifyStudentOwnership } = require('../middleware/authMiddleware');

router.get('/', verifyToken, verifyStudentOwnership, achievementsController.getAchievements);
router.get('/:studentId', verifyToken, verifyStudentOwnership, achievementsController.getAchievements);
router.post('/', verifyToken, achievementsController.createAchievement);
router.put('/:id/verify', verifyToken, requireRole('admin', 'faculty'), achievementsController.verifyAchievement);

module.exports = router;
