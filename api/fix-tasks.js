import { initializeDatabase, getDb } from './src/models/index.js';

async function fixTasks() {
  await initializeDatabase();
  const db = getDb();
  
  // Update the in_progress task to have 65% progress
  await db.run(`
    UPDATE tasks 
    SET progress = 65 
    WHERE status = 'in_progress'
  `);
  
  // Verify
  const tasks = await db.all('SELECT id, title, status, progress FROM tasks');
  console.log('Tasks updated:', tasks);
  
  process.exit(0);
}

fixTasks().catch(err => {
  console.error(err);
  process.exit(1);
});