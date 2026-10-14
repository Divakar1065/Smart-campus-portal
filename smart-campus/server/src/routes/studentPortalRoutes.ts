import { Router } from 'express';
import {
  getStudentMe,
  getStudentFaculty,
  getStudentAcademicInfo,
  getStudentNotifications,
  updateStudentProfile,
  changeStudentPassword,
} from '../controllers/studentPortalController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireRole(['STUDENT']));

router.get('/me', getStudentMe);
router.get('/faculty', getStudentFaculty);
router.get('/academic', getStudentAcademicInfo);
router.get('/notifications', getStudentNotifications);
router.put('/profile', updateStudentProfile);
router.put('/change-password', changeStudentPassword);

export default router;
