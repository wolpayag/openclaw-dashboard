import { initializeDatabase, getDb } from './src/models/index.js';

async function seed() {
  await initializeDatabase();
  const db = getDb();
  
  // Create default morning system status task
  await db.run(`
    INSERT INTO scheduled_tasks (id, name, description, type, schedule, action, model, enabled, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `, [
    'default-morning-status',
    'Morning System Status',
    'Daily system status report every morning at 8:00 AM',
    'system_status',
    JSON.stringify({ type: 'daily', time: '08:00' }),
    JSON.stringify({ type: 'system_status' }),
    'kimi-coding/k2p5',
    1
  ]);
  
  // Create sample tasks
  await db.run(`
    INSERT INTO tasks (id, title, description, status, priority, progress, github_repo, github_url, created_at, updated_at)
    VALUES 
    (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now')),
    (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now')),
    (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `, [
    'task-1', 'Dashboard Setup', 'Initial OpenClaw dashboard configuration', 'completed', 'high', 100, 'openclaw-dashboard', 'https://github.com/wolpayag/openclaw-dashboard',
    'task-2', 'GitHub Repository Created', 'Created openclaw-dashboard repository with initial implementation', 'completed', 'medium', 100, 'openclaw-dashboard', 'https://github.com/wolpayag/openclaw-dashboard',
    'task-3', 'Session Monitoring', 'Monitoring active OpenClaw sessions', 'in_progress', 'low', 65, null, null
  ]);
  
  // Create agents
  await db.run(`
    INSERT INTO agents (id, name, type, status, model, reasoning_enabled, stats, created_at, updated_at)
    VALUES 
    (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now')),
    (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `, [
    'agent:main:main', 'Paul (@wolpay) id:1001601662', 'direct', 'active', 'kimi-coding/k2p5', 0, JSON.stringify({ inputTokens: 62155, outputTokens: 734, totalTokens: 67024 }),
    'agent:worker:secondary', 'Worker Agent (Secondary)', 'worker', 'active', 'kimi-coding/k2p5', 1, JSON.stringify({ inputTokens: 15000, outputTokens: 8000, currentTask: 'Processing data' })
  ]);
  
  console.log('Database seeded successfully');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});