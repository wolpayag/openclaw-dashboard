import { initializeDatabase, getDb } from './src/models/index.js';

async function clearAlerts() {
  await initializeDatabase();
  const db = getDb();
  
  // Acknowledge all critical alerts
  await db.run(`
    UPDATE system_events 
    SET acknowledged = 1 
    WHERE severity IN ('critical', 'warning')
  `);
  
  // Or delete them
  await db.run(`
    DELETE FROM system_events 
    WHERE type LIKE 'usage.threshold%'
  `);
  
  const result = await db.get('SELECT COUNT(*) as count FROM system_events WHERE acknowledged = 0 AND severity IN ("critical", "warning", "error")');
  console.log(`Active alerts remaining: ${result.count}`);
  
  process.exit(0);
}

clearAlerts().catch(err => {
  console.error(err);
  process.exit(1);
});