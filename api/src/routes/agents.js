import { Router } from 'express';
import { AgentService } from '../services/agents.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/agents - List all agents
router.get('/', asyncHandler(async (req, res) => {
  const filters = {
    status: req.query.status,
    type: req.query.type
  };

  const agents = await AgentService.getAllAgents(filters);
  res.json({ agents, count: agents.length });
}));

// GET /api/agents/stats - Get agent statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const stats = await AgentService.getAgentStats();
  res.json(stats);
}));

// GET /api/agents/workload - Get workload distribution
router.get('/workload', asyncHandler(async (req, res) => {
  const workload = await AgentService.getWorkloadDistribution();
  res.json({ workload });
}));

// GET /api/agents/:id - Get agent by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const agent = await AgentService.getAgentById(req.params.id);
  res.json(agent);
}));

// POST /api/agents - Register new agent
router.post('/', asyncHandler(async (req, res) => {
  const agent = await AgentService.registerAgent(req.body);
  res.status(201).json(agent);
}));

// PATCH /api/agents/:id - Update agent
router.patch('/:id', asyncHandler(async (req, res) => {
  const agent = await AgentService.updateAgent(req.params.id, req.body);
  res.json(agent);
}));

// POST /api/agents/:id/heartbeat - Agent heartbeat
router.post('/:id/heartbeat', asyncHandler(async (req, res) => {
  const result = await AgentService.heartbeat(req.params.id, req.body);
  res.json(result);
}));

export default router;