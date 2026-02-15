import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;

export async function initializeDatabase() {
  const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/dashboard.db');
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  
  // Enable foreign keys
  await db.run('PRAGMA foreign_keys = ON');

  await createTables();
  logger.info(`Database initialized at ${dbPath}`);
  return db;
}

async function createTables() {
  // Tasks table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')),
      priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
      agent_id TEXT,
      parent_task_id TEXT,
      progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
      input TEXT,
      output TEXT,
      github_repo TEXT,
      github_url TEXT,
      error_message TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      started_at DATETIME,
      completed_at DATETIME,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (parent_task_id) REFERENCES tasks(id)
    )
  `);

  // Agents table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT,
      status TEXT DEFAULT 'idle' CHECK (status IN ('active', 'idle', 'error', 'offline')),
      model TEXT,
      reasoning_enabled BOOLEAN DEFAULT 0,
      capabilities TEXT,
      current_task_id TEXT,
      stats TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen_at DATETIME,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (current_task_id) REFERENCES tasks(id)
    )
  `);

  // Usage statistics table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS usage_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE NOT NULL,
      hour INTEGER CHECK (hour >= 0 AND hour <= 23),
      model TEXT,
      tokens_input INTEGER DEFAULT 0,
      tokens_output INTEGER DEFAULT 0,
      requests_count INTEGER DEFAULT 0,
      cost_estimate REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(date, hour, model)
    )
  `);

  // System events table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS system_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      severity TEXT DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
      message TEXT NOT NULL,
      metadata TEXT,
      acknowledged BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // API calls log table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS api_calls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint TEXT,
      method TEXT,
      status_code INTEGER,
      response_time_ms INTEGER,
      error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // API keys table for storing user API credentials
  await db.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      provider TEXT NOT NULL,
      key_value TEXT NOT NULL,
      is_default BOOLEAN DEFAULT 0,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Scheduled tasks table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS scheduled_tasks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT DEFAULT 'system_status',
      schedule TEXT NOT NULL,
      action TEXT NOT NULL,
      model TEXT DEFAULT 'kimi-coding/k2p5',
      api_key_id TEXT,
      enabled BOOLEAN DEFAULT 1,
      metadata TEXT,
      run_count INTEGER DEFAULT 0,
      last_run_at DATETIME,
      last_error TEXT,
      last_error_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (api_key_id) REFERENCES api_keys(id)
    )
  `);

  // Scheduled task execution logs
  await db.exec(`
    CREATE TABLE IF NOT EXISTS scheduled_task_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT NOT NULL,
      status TEXT DEFAULT 'success',
      output TEXT,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES scheduled_tasks(id)
    )
  `);

  // Create indexes for performance
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)`);
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_agent ON tasks(agent_id)`);
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at)`);
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status)`);
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_usage_date ON usage_stats(date)`);
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_events_created ON system_events(created_at)`);
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_enabled ON scheduled_tasks(enabled)`);
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_scheduled_task_logs_task ON scheduled_task_logs(task_id)`);
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

export { db };