import { initializeDatabase, getDb } from './src/models/index.js';

async function createDefaultTask() {
  await initializeDatabase();
  const db = getDb();
  
  // Check if we already have scheduled tasks
  const existing = await db.get('SELECT COUNT(*) as count FROM scheduled_tasks');
  
  if (existing.count === 0) {
    // Create default morning system status task
    await db.run(`
      INSERT INTO scheduled_tasks (id, name, description, type, schedule, action, enabled, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'default-morning-status',
      'Morning System Status',
      'Daily system status report every morning at 8:00 AM',
      'system_status',
      JSON.stringify({ type: 'daily', time: '08:00', timezone: 'Europe/Vienna' }),
      JSON.stringify({ type: 'system_status' }),
      1,
      new Date().toISOString(),
      new Date().toISOString()
    ]);
    
    console.log('Created default morning system status task');
  } else {
    console.log('Scheduled tasks already exist, skipping default creation');
  }
  
  // Show all tasks
  const tasks = await db.all('SELECT id, name, enabled FROM scheduled_tasks');
  console.log('Scheduled tasks:', tasks);
  
  process.exit(0);
}

createDefaultTask().catch(err => {
  console.error(err);
  process.exit(1);
});