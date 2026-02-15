import { initializeDatabase, getDb } from './src/models/index.js';

async function deleteTask(id) {
  await initializeDatabase();
  const db = getDb();
  
  // Delete logs first (foreign key constraint)
  await db.run('DELETE FROM scheduled_task_logs WHERE task_id = ?', id);
  
  // Delete the task
  const result = await db.run('DELETE FROM scheduled_tasks WHERE id = ?', id);
  
  console.log(`Deleted task ${id}: ${result.changes} rows affected`);
  
  // Show remaining tasks
  const tasks = await db.all('SELECT id, name FROM scheduled_tasks');
  console.log('Remaining tasks:', tasks);
  
  process.exit(0);
}

// Delete the test task
deleteTask(process.argv[2] || '75c6a67c-f6cb-47d0-950c-64c3aba988ff').catch(err => {
  console.error(err);
  process.exit(1);
});