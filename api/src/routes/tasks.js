import { Router } from 'express';
import { TaskService } from '../services/tasks.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/tasks - List all tasks
router.get('/', asyncHandler(async (req, res) => {
  const filters = {
    status: req.query.status,
    agentId: req.query.agentId,
    priority: req.query.priority,
    fromDate: req.query.fromDate,
    toDate: req.query.toDate,
    search: req.query.search,
    limit: req.query.limit || 50,
    offset: req.query.offset || 0
  };

  const tasks = await TaskService.getAllTasks(filters);
  res.json({ tasks, count: tasks.length });
}));

// GET /api/tasks/stats - Get task statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await TaskService.getTaskStats();
  res.json(stats);
}));

// GET /api/tasks/queue - Get task queue
router.get('/queue', asyncHandler(async (req, res) => {
  const queue = await TaskService.getTaskQueue();
  res.json({ queue, count: queue.length });
}));

// GET /api/tasks/:id - Get task by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const task = await TaskService.getTaskById(req.params.id);
  res.json(task);
}));

// POST /api/tasks - Create new task
router.post('/', asyncHandler(async (req, res) => {
  const task = await TaskService.createTask(req.body);
  res.status(201).json(task);
}));

// PATCH /api/tasks/:id - Update task
router.patch('/:id', asyncHandler(async (req, res) => {
  const task = await TaskService.updateTask(req.params.id, req.body);
  res.json(task);
}));

// POST /api/tasks/:id/assign - Assign task to agent
router.post('/:id/assign', asyncHandler(async (req, res) => {
  const { agentId } = req.body;
  const task = await TaskService.assignTask(req.params.id, agentId);
  res.json(task);
}));

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', asyncHandler(async (req, res) => {
  await TaskService.deleteTask(req.params.id);
  res.status(204).send();
}));

export default router;