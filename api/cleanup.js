import { initializeDatabase, getDb } from './src/models/index.js';

async function cleanup() {
  await initializeDatabase();
  const db = getDb();
  
  // Delete ALL agents with auto-generated UUIDs (keep only those with session key IDs)
  await db.exec(`
    DELETE FROM agents 
    WHERE id NOT LIKE '%:%'
  `);
  
  // Or delete all and let them be recreated properly
  await db.exec(`DELETE FROM agents`);
  
  const result = await db.get('SELECT COUNT(*) as count FROM agents');
  console.log(`Agents cleaned up. Remaining: ${result.count}`);
  
  process.exit(0);
}

cleanup().catch(err => {
  console.error(err);
  process.exit(1);
});