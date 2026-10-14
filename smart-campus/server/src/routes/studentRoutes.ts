import { Router } from 'express';
import {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  exportStudentsCsv,
  importStudentsCsv,
} from '../controllers/studentController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Students are restricted from administrative bulk student endpoints
router.get('/', requireRole(['ADMIN', 'DEAN', 'HOD', 'FACULTY']), getAllStudents);
router.get('/export/csv', requireRole(['ADMIN', 'DEAN', 'HOD']), exportStudentsCsv);
router.post('/import/csv', requireRole(['ADMIN', 'DEAN', 'HOD']), importStudentsCsv);
router.get('/:id', requireRole(['ADMIN', 'DEAN', 'HOD', 'FACULTY']), getStudentById);
router.post('/', requireRole(['ADMIN', 'DEAN', 'HOD']), createStudent);
router.put('/:id', requireRole(['ADMIN', 'DEAN', 'HOD']), updateStudent);
router.delete('/:id', requireRole(['ADMIN', 'DEAN']), deleteStudent);

export default router;
