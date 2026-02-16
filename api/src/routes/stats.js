import { Router } from 'express';
import { StatsService } from '../services/stats.js';
import { EventRepository } from '../models/events.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/stats - Get all stats (root endpoint)
router.get('/', asyncHandler(async (req, res) => {
  const stats = await StatsService.getDashboardStats();
  res.json(stats);
}));

// GET /api/stats/dashboard - Get dashboard overview stats
router.get('/dashboard', asyncHandler(async (req, res) => {
  const stats = await StatsService.getDashboardStats();
  res.json(stats);
}));

// GET /api/stats/usage - Get usage statistics
router.get('/usage', asyncHandler(async (req, res) => {
  const period = req.query.period || '7d';
  const usage = await StatsService.getUsageHistory(period);
  res.json({ usage, period });
}));

// GET /api/stats/models - Get model performance
router.get('/models', asyncHandler(async (req, res) => {
  const performance = await StatsService.getModelPerformance();
  res.json({ models: performance });
}));

// GET /api/stats/errors - Get error statistics
router.get('/errors', asyncHandler(async (req, res) => {
  const period = req.query.period || '7d';
  const errors = await StatsService.getErrorHistory(period);
  res.json({ errors, period });
}));

// GET /api/stats/health - Get system health
router.get('/health', asyncHandler(async (req, res) => {
  const health = await StatsService.getSystemHealth();
  res.json(health);
}));

// POST /api/stats/clear-alerts - Acknowledge all alerts
router.post('/clear-alerts', asyncHandler(async (req, res) => {
  const alerts = await EventRepository.findAll({ acknowledged: false });
  for (const alert of alerts) {
    await EventRepository.acknowledge(alert.id);
  }
  res.json({ cleared: alerts.length });
}));

export default router;