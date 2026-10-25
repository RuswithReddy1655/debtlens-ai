import { Router } from 'express';
import { RepositoryController, createRepositorySchema } from '../controllers/repositoryController';
import { validateBody } from '../middleware/validate';
import { authenticate } from '../middleware/auth';

import { Phase4Controller } from '../controllers/phase4Controller';

const router = Router();

// List all repositories
router.get('/', RepositoryController.list);

// Get single repository by ID
router.get('/:id', RepositoryController.getById);

// Phase 4 Continuous Analysis Snapshots & Comparison
router.get('/:id/snapshots', Phase4Controller.getSnapshots);
router.get('/:id/comparison', Phase4Controller.getComparison);

// Create / register new repository
router.post('/', authenticate, validateBody(createRepositorySchema), RepositoryController.create);

export default router;
