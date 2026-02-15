import { initializeDatabase, getDb } from './src/models/index.js';

async function reset() {
  await initializeDatabase();
  const db = getDb();
  
  // Clear all agents
  await db.run('DELETE FROM agents');
  console.log('All agents deleted');
  
  process.exit(0);
}

reset().catch(err => {
  console.error(err);
  process.exit(1);
});