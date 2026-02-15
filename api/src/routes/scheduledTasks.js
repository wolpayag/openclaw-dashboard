import { Router } from 'express';
import { ScheduledTaskRepository } from '../models/scheduledTasks.js';
import { SchedulerService } from '../services/schedulerService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { getDb } from '../models/index.js';

const router = Router();

// GET /api/scheduled-tasks - List all scheduled tasks
router.get('/', asyncHandler(async (req, res) => {
  const filters = {
    enabled: req.query.enabled !== undefined ? req.query.enabled === 'true' : undefined,
    type: req.query.type
  };

  const tasks = await ScheduledTaskRepository.findAll(filters);
  
  // Add next execution time estimate
  const tasksWithNextRun = tasks.map(task => ({
    ...task,
    nextRunAt: calculateNextRun(task)
  }));
  
  res.json({ tasks: tasksWithNextRun, count: tasks.length });
}));

// GET /api/scheduled-tasks/:id - Get task by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const task = await ScheduledTaskRepository.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Scheduled task not found' });
  }
  
  const logs = await ScheduledTaskRepository.getExecutionLogs(req.params.id, 5);
  
  res.json({
    ...task,
    nextRunAt: calculateNextRun(task),
    recentLogs: logs
  });
}));

// POST /api/scheduled-tasks - Create new scheduled task
router.post('/', asyncHandler(async (req, res) => {
  const task = await SchedulerService.createTask(req.body);
  res.status(201).json(task);
}));

// PATCH /api/scheduled-tasks/:id - Update task
router.patch('/:id', asyncHandler(async (req, res) => {
  const task = await SchedulerService.updateTask(req.params.id, req.body);
  res.json(task);
}));

// POST /api/scheduled-tasks/:id/run - Run task manually
router.post('/:id/run', asyncHandler(async (req, res) => {
  const task = await ScheduledTaskRepository.findById(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  await SchedulerService.executeTaskAction(task);
  
  await ScheduledTaskRepository.update(req.params.id, {
    lastRunAt: new Date().toISOString(),
    runCount: (task.run_count || 0) + 1
  });
  
  res.json({ executed: true });
}));

// DELETE /api/scheduled-tasks/:id - Delete task
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    // First check if task exists
    const task = await ScheduledTaskRepository.findById(id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Stop the scheduled job if running
    await SchedulerService.deleteTask(id);
    
    res.status(200).json({ deleted: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete task', message: error.message });
  }
}));

// Helper to calculate next run time
function calculateNextRun(task) {
  if (!task.enabled) return null;
  
  const now = new Date();
  
  if (task.schedule.type === 'daily') {
    const [hour, minute] = task.schedule.time.split(':');
    const next = new Date();
    next.setHours(parseInt(hour), parseInt(minute), 0, 0);
    
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    
    return next.toISOString();
  }
  
  if (task.schedule.type === 'interval' && task.lastRunAt) {
    const lastRun = new Date(task.lastRunAt);
    const intervalMs = task.schedule.interval * 60 * 1000;
    const next = new Date(lastRun.getTime() + intervalMs);
    return next.toISOString();
  }
  
  return null;
}

export default router;