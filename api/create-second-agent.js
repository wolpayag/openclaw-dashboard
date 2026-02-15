import { initializeDatabase, getDb } from './src/models/index.js';

async function createSecondAgent() {
  await initializeDatabase();
  const db = getDb();
  
  // Insert a second agent that's "active"
  await db.run(`
    INSERT INTO agents (id, name, type, status, model, reasoning_enabled, stats, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `, [
    'agent:worker:secondary',
    'Worker Agent (Secondary)',
    'worker',
    'active',
    'kimi-coding/k2p5',
    1,
    JSON.stringify({
      inputTokens: 15000,
      outputTokens: 8000,
      totalTokens: 23000,
      channel: 'internal',
      currentTask: 'Processing data'
    })
  ]);
  
  const agents = await db.all('SELECT name, status, model FROM agents');
  console.log('Agents:', agents);
  
  process.exit(0);
}

createSecondAgent().catch(err => {
  console.error(err);
  process.exit(1);
});