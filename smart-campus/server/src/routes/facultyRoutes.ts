import { Router } from 'express';
import {
  getAllFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty,
} from '../controllers/facultyController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getAllFaculty);
router.get('/:id', getFacultyById);
router.post('/', requireRole(['ADMIN', 'DEAN', 'HOD']), createFaculty);
router.put('/:id', requireRole(['ADMIN', 'DEAN', 'HOD']), updateFaculty);
router.delete('/:id', requireRole(['ADMIN']), deleteFaculty);

export default router;
