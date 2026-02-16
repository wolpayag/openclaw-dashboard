import { Router } from 'express';
import { readFileSync, writeFileSync } from 'fs';
import { asyncHandler } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

const CRON_JOBS_FILE = '/home/paul/.openclaw/cron/jobs.json';

const router = Router();

// Read cron jobs from file
function readCronJobs() {
  try {
    const content = readFileSync(CRON_JOBS_FILE, 'utf-8');
    const data = JSON.parse(content);
    return data.jobs || [];
  } catch (error) {
    return [];
  }
}

// Write cron jobs to file
function writeCronJobs(jobs) {
  const data = {
    version: 1,
    jobs
  };
  writeFileSync(CRON_JOBS_FILE, JSON.stringify(data, null, 2));
}

// GET /api/cron/jobs - List all cron jobs
router.get('/', asyncHandler(async (req, res) => {
  const jobs = readCronJobs();
  res.json({ jobs, count: jobs.length });
}));

// POST /api/cron/jobs - Create new cron job
router.post('/', asyncHandler(async (req, res) => {
  const { name, schedule, command, enabled = true } = req.body;
  
  if (!name || !schedule || !command) {
    return res.status(400).json({ error: 'Name, schedule, and command are required' });
  }

  const jobs = readCronJobs();
  const newJob = {
    id: uuidv4(),
    name,
    schedule,
    command,
    enabled,
    createdAt: new Date().toISOString()
  };
  
  jobs.push(newJob);
  writeCronJobs(jobs);
  
  res.status(201).json(newJob);
}));

// PATCH /api/cron/jobs/:id - Update cron job
router.patch('/:id', asyncHandler(async (req, res) => {
  const jobs = readCronJobs();
  const jobIndex = jobs.findIndex(j => j.id === req.params.id);
  
  if (jobIndex === -1) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  jobs[jobIndex] = { ...jobs[jobIndex], ...req.body };
  writeCronJobs(jobs);
  
  res.json(jobs[jobIndex]);
}));

// DELETE /api/cron/jobs/:id - Delete cron job
router.delete('/:id', asyncHandler(async (req, res) => {
  const jobs = readCronJobs();
  const filteredJobs = jobs.filter(j => j.id !== req.params.id);
  
  if (filteredJobs.length === jobs.length) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  writeCronJobs(filteredJobs);
  res.json({ deleted: true });
}));

// POST /api/cron/jobs/:id/run - Run job now
router.post('/:id/run', asyncHandler(async (req, res) => {
  const jobs = readCronJobs();
  const job = jobs.find(j => j.id === req.params.id);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  // In a real implementation, this would trigger the job
  // For now, just update the last run info
  job.lastRun = new Date().toISOString();
  job.lastStatus = 'success';
  writeCronJobs(jobs);
  
  res.json({ executed: true });
}));

export default router;