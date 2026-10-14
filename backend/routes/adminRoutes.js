const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.get('/overview', verifyToken, requireRole('admin'), adminController.getOverview);
router.get('/summary', verifyToken, requireRole('admin'), adminController.getOverview);
router.get('/at-risk', verifyToken, requireRole('admin', 'faculty'), adminController.getAtRisk);
router.get('/students', verifyToken, requireRole('admin', 'faculty'), adminController.getAllStudents);

module.exports = router;
