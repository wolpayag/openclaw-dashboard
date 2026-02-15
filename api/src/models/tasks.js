import { getDb } from './index.js';
import { v4 as uuidv4 } from 'uuid';

export const TaskRepository = {
  async findAll(filters = {}) {
    const db = getDb();
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params = [];

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    if (filters.agentId) {
      query += ' AND agent_id = ?';
      params.push(filters.agentId);
    }

    if (filters.priority) {
      query += ' AND priority = ?';
      params.push(filters.priority);
    }

    if (filters.fromDate) {
      query += ' AND created_at >= ?';
      params.push(filters.fromDate);
    }

    if (filters.toDate) {
      query += ' AND created_at <= ?';
      params.push(filters.toDate);
    }

    if (filters.search) {
      query += ' AND (title LIKE ? OR description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(parseInt(filters.offset));
    }

    return db.all(query, params);
  },

  async findById(id) {
    const db = getDb();
    return db.get('SELECT * FROM tasks WHERE id = ?', id);
  },

  async create(taskData) {
    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.run(`
      INSERT INTO tasks (id, title, description, status, priority, agent_id, 
                        parent_task_id, input, github_repo, github_url, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      taskData.title,
      taskData.description || null,
      taskData.status || 'pending',
      taskData.priority || 'medium',
      taskData.agentId || null,
      taskData.parentTaskId || null,
      taskData.input ? JSON.stringify(taskData.input) : null,
      taskData.githubRepo || null,
      taskData.githubUrl || null,
      taskData.metadata ? JSON.stringify(taskData.metadata) : null,
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

      if (updates.status === 'in_progress' && !updates.startedAt) {
        fields.push('started_at = ?');
        values.push(new Date().toISOString());
      }

      if ((updates.status === 'completed' || updates.status === 'failed') && !updates.completedAt) {
        fields.push('completed_at = ?');
        values.push(new Date().toISOString());
      }
    }

    if (updates.progress !== undefined) {
      fields.push('progress = ?');
      values.push(updates.progress);
    }

    if (updates.agentId) {
      fields.push('agent_id = ?');
      values.push(updates.agentId);
    }

    if (updates.output !== undefined) {
      fields.push('output = ?');
      values.push(typeof updates.output === 'object' ? JSON.stringify(updates.output) : updates.output);
    }

    if (updates.errorMessage) {
      fields.push('error_message = ?');
      values.push(updates.errorMessage);
    }

    if (updates.githubRepo !== undefined) {
      fields.push('github_repo = ?');
      values.push(updates.githubRepo);
    }

    if (updates.githubUrl !== undefined) {
      fields.push('github_url = ?');
      values.push(updates.githubUrl);
    }

    if (updates.metadata) {
      fields.push('metadata = ?');
      values.push(JSON.stringify(updates.metadata));
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(id);

    await db.run(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  async delete(id) {
    const db = getDb();
    await db.run('DELETE FROM tasks WHERE id = ?', id);
    return { deleted: true };
  },

  async getStats() {
    const db = getDb();
    return db.get(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        AVG(CASE WHEN status IN ('completed', 'failed') THEN 
          (julianday(completed_at) - julianday(created_at)) * 24 * 60 
          ELSE NULL END) as avg_duration_minutes
      FROM tasks
      WHERE created_at >= datetime('now', '-7 days')
    `);
  },

  async getQueue() {
    const db = getDb();
    return db.all(`
      SELECT * FROM tasks 
      WHERE status IN ('pending', 'in_progress')
      ORDER BY 
        CASE priority 
          WHEN 'critical' THEN 1 
          WHEN 'high' THEN 2 
          WHEN 'medium' THEN 3 
          ELSE 4 
        END,
        created_at ASC
    `);
  }
};