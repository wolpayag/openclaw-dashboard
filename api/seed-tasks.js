import { initializeDatabase, getDb } from './src/models/index.js';

async function seedData() {
  await initializeDatabase();
  const db = getDb();
  
  // Insert sample tasks with github repos
  const tasks = [
    {
      id: 'task-1',
      title: 'Dashboard Setup',
      description: 'Initial OpenClaw dashboard configuration',
      status: 'completed',
      priority: 'high',
      progress: 100,
      github_repo: 'openclaw-dashboard',
      github_url: 'https://github.com/wolpayag/openclaw-dashboard'
    },
    {
      id: 'task-2',
      title: 'GitHub Repository Created',
      description: 'Created openclaw-dashboard repository with initial implementation',
      status: 'completed',
      priority: 'medium',
      progress: 100,
      github_repo: 'openclaw-dashboard',
      github_url: 'https://github.com/wolpayag/openclaw-dashboard'
    },
    {
      id: 'task-3',
      title: 'Session Monitoring',
      description: 'Monitoring active OpenClaw sessions',
      status: 'in_progress',
      priority: 'low',
      progress: 65,
      github_repo: null,
      github_url: null
    }
  ];
  
  for (const task of tasks) {
    await db.run(`
      INSERT OR REPLACE INTO tasks (id, title, description, status, priority, progress, github_repo, github_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `, [
      task.id,
      task.title,
      task.description,
      task.status,
      task.priority,
      task.progress,
      task.github_repo,
      task.github_url
    ]);
  }
  
  const result = await db.all('SELECT title, github_repo FROM tasks');
  console.log('Tasks:', result);
  
  process.exit(0);
}

seedData().catch(err => {
  console.error(err);
  process.exit(1);
});