import { Router } from 'express';
import { getDashboardStats } from '../controllers/statsController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireRole(['ADMIN', 'DEAN', 'HOD', 'FACULTY']));

router.get('/dashboard', getDashboardStats);

export default router;
