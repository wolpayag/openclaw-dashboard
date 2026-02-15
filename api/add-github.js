import { initializeDatabase, getDb } from './src/models/index.js';

async function addGitHubRepo() {
  await initializeDatabase();
  const db = getDb();
  
  // Update the GitHub Repository Created task with repo info
  await db.run(`
    UPDATE tasks 
    SET github_repo = 'openclaw-dashboard', 
        github_url = 'https://github.com/wolpayag/openclaw-dashboard'
    WHERE title = 'GitHub Repository Created'
  `);
  
  // Also update Dashboard Setup task
  await db.run(`
    UPDATE tasks 
    SET github_repo = 'openclaw-dashboard', 
        github_url = 'https://github.com/wolpayag/openclaw-dashboard'
    WHERE title = 'Dashboard Setup'
  `);
  
  const tasks = await db.all('SELECT title, github_repo, github_url FROM tasks');
  console.log('Updated tasks:', tasks);
  
  process.exit(0);
}

addGitHubRepo().catch(err => {
  console.error(err);
  process.exit(1);
});