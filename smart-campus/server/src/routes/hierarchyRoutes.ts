import { Router } from 'express';
import { getHierarchyTree, searchHierarchy } from '../controllers/hierarchyController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(requireRole(['ADMIN', 'DEAN', 'HOD', 'FACULTY']));

// Full Dean -> Dept -> HOD -> Faculty -> Student tree
router.get('/tree', getHierarchyTree);

// Instant node finder across all hierarchy levels
router.get('/search', searchHierarchy);

export default router;
