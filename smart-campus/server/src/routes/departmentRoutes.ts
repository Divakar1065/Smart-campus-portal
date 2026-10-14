import { Router } from 'express';
import {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  assignHod,
  deleteDepartment,
} from '../controllers/departmentController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getAllDepartments);
router.get('/:id', getDepartmentById);
router.post('/', requireRole(['ADMIN', 'DEAN']), createDepartment);
router.put('/:id', requireRole(['ADMIN', 'DEAN', 'HOD']), updateDepartment);
router.put('/:id/assign-hod', requireRole(['ADMIN', 'DEAN']), assignHod);
router.delete('/:id', requireRole(['ADMIN']), deleteDepartment);

export default router;
