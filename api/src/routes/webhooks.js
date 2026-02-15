import { Router } from 'express';
import { EventRepository } from '../models/events.js';
import { TaskService } from '../services/tasks.js';
import { AgentService } from '../services/agents.js';
import { StatsService } from '../services/stats.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// POST /api/webhooks/openclaw - OpenClaw event webhook
router.post('/openclaw', asyncHandler(async (req, res) => {
  const { type, data, timestamp } = req.body;

  logger.info('Received OpenClaw webhook', { type, timestamp });

  try {
    switch (type) {
      case 'task.created':
        await TaskService.createTask({
          id: data.id,
          title: data.title || 'Untitled Task',
          description: data.description,
          priority: data.priority || 'medium',
          input: data.input,
          metadata: data.metadata
        });
        break;

      case 'task.started':
        await TaskService.updateTask(data.id, {
          status: 'in_progress',
          agentId: data.agentId,
          progress: 0
        });
        break;

      case 'task.progress':
        await TaskService.updateTask(data.id, {
          progress: data.progress
        });
        break;

      case 'task.completed':
        await TaskService.updateTask(data.id, {
          status: 'completed',
          progress: 100,
          output: data.output
        });
        break;

      case 'task.failed':
        await TaskService.updateTask(data.id, {
          status: 'failed',
          errorMessage: data.error,
          output: data.output
        });
        break;

      case 'agent.status_changed':
        await AgentService.updateAgent(data.id, {
          status: data.status,
          currentTaskId: data.currentTaskId,
          model: data.model
        });
        break;

      case 'usage.record':
        await StatsService.recordAPICall({
          model: data.model,
          tokensInput: data.tokensInput,
          tokensOutput: data.tokensOutput,
          requestsCount: data.requestsCount,
          costEstimate: data.costEstimate
        });
        break;

      default:
        logger.warn('Unknown webhook type', { type });
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Webhook processing error', { error: error.message, type });
    res.status(500).json({ error: 'Processing failed' });
  }
}));

// GET /api/webhooks/events - Get recent events
router.get('/events', asyncHandler(async (req, res) => {
  const events = await EventRepository.findAll({
    limit: req.query.limit || 50,
    severity: req.query.severity
  });
  res.json({ events });
}));

export default router;