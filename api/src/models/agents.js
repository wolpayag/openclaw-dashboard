import { getDb } from './index.js';
import { v4 as uuidv4 } from 'uuid';

export const AgentRepository = {
  async findAll(filters = {}) {
    const db = getDb();
    let query = 'SELECT * FROM agents WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    query += ' ORDER BY name ASC';

    return db.all(query, params);
  },

  async findById(id) {
    const db = getDb();
    return db.get('SELECT * FROM agents WHERE id = ?', id);
  },

  async create(agentData) {
    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.run(`
      INSERT INTO agents (id, name, type, status, model, reasoning_enabled, 
                         capabilities, stats, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      agentData.name,
      agentData.type || null,
      agentData.status || 'idle',
      agentData.model || null,
      agentData.reasoningEnabled ? 1 : 0,
      agentData.capabilities ? JSON.stringify(agentData.capabilities) : null,
      agentData.stats ? JSON.stringify(agentData.stats) : null,
      now,
      now
    ]);

    return this.findById(id);
  },

  async update(id, updates) {
    const db = getDb();
    const fields = [];
    const values = [];

    if (updates.status) {
      fields.push('status = ?');
      values.push(updates.status);
    }

    if (updates.currentTaskId !== undefined) {
      fields.push('current_task_id = ?');
      values.push(updates.currentTaskId);
    }

    if (updates.model) {
      fields.push('model = ?');
      values.push(updates.model);
    }

    if (updates.reasoningEnabled !== undefined) {
      fields.push('reasoning_enabled = ?');
      values.push(updates.reasoningEnabled ? 1 : 0);
    }

    if (updates.stats) {
      fields.push('stats = ?');
      values.push(JSON.stringify(updates.stats));
    }

    fields.push('last_seen_at = ?');
    values.push(new Date().toISOString());

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(id);

    await db.run(`UPDATE agents SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  async getStats() {
    const db = getDb();
    return db.get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'idle' THEN 1 ELSE 0 END) as idle,
        SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error,
        SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) as offline
      FROM agents
    `);
  },

  async getWorkload() {
    const db = getDb();
    return db.all(`
      SELECT 
        a.id,
        a.name,
        a.status,
        a.model,
        COUNT(t.id) as task_count,
        AVG(CASE WHEN t.status = 'in_progress' THEN t.progress ELSE NULL END) as avg_progress
      FROM agents a
      LEFT JOIN tasks t ON a.id = t.agent_id AND t.status IN ('pending', 'in_progress')
      GROUP BY a.id
      ORDER BY task_count DESC
    `);
  }
};