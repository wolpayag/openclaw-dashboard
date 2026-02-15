import { Router } from 'express';
import { StatsService } from '../services/stats.js';

const router = Router();

// GET /health - Health check endpoint
router.get('/', async (req, res) => {
  const health = await StatsService.getSystemHealth();
  const statusCode = health.status === 'critical' ? 503 : 200;
  res.status(statusCode).json({
    status: health.status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

export default router;