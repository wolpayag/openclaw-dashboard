import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/cron/jobs - List all cron jobs
router.get('/jobs', asyncHandler(async (req, res) => {
  res.json({ jobs: [], count: 0, message: 'Cron jobs endpoint working' });
}));

export default router;