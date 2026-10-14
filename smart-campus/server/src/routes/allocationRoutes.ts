import { Router } from 'express';
import {
  allocateSingle,
  batchAllocate,
  autoAllocateDepartment,
  autoAllocateAllDepartments,
} from '../controllers/allocationController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Allocate or unassign a single student
router.post('/single', requireRole(['ADMIN', 'DEAN', 'HOD']), allocateSingle);

// Allocate or unassign batch of students
router.post('/batch', requireRole(['ADMIN', 'DEAN', 'HOD']), batchAllocate);

// Balanced greedy auto-allocation for a specific department
router.post('/auto-department', requireRole(['ADMIN', 'DEAN', 'HOD']), autoAllocateDepartment);

// Campus-wide balanced auto-allocation across all departments
router.post('/auto-all', requireRole(['ADMIN', 'DEAN']), autoAllocateAllDepartments);

export default router;
