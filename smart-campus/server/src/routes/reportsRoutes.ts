import { Router } from 'express';
import {
  getDepartmentReport,
  getFacultyWorkloadReport,
  getUnassignedStudentsReport,
  getAuditLogsReport,
} from '../controllers/reportsController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireRole(['ADMIN', 'DEAN', 'HOD']));

router.get('/departments', getDepartmentReport);
router.get('/workload', getFacultyWorkloadReport);
router.get('/unassigned-students', getUnassignedStudentsReport);
router.get('/audit-logs', getAuditLogsReport);

export default router;
