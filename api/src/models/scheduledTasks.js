import { getDb } from './index.js';
import { v4 as uuidv4 } from 'uuid';

export const ScheduledTaskRepository = {
  async findAll(filters = {}) {
    const db = getDb();
    let query = 'SELECT * FROM scheduled_tasks WHERE 1=1';
    const params = [];

    if (filters.enabled !== undefined) {
      query += ' AND enabled = ?';
      params.push(filters.enabled ? 1 : 0);
    }

    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    query += ' ORDER BY created_at DESC';

    const tasks = await db.all(query, params);
    
    // Parse JSON fields
    return tasks.map(task => ({
      ...task,
      schedule: JSON.parse(task.schedule || '{}'),
      action: JSON.parse(task.action || '{}'),
      metadata: task.metadata ? JSON.parse(task.metadata) : null,
      enabled: !!task.enabled
    }));
  },

  async findById(id) {
    const db = getDb();
    const task = await db.get('SELECT * FROM scheduled_tasks WHERE id = ?', id);
    if (!task) return null;
    
    return {
      ...task,
      schedule: JSON.parse(task.schedule || '{}'),
      action: JSON.parse(task.action || '{}'),
      metadata: task.metadata ? JSON.parse(task.metadata) : null,
      enabled: !!task.enabled
    };
  },

  async create(taskData) {
    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db.run(`
      INSERT INTO scheduled_tasks (
        id, name, description, type, schedule, action, model,
        enabled, metadata, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      taskData.name,
      taskData.description || null,
      taskData.type || 'system_status',
      JSON.stringify(taskData.schedule || {}),
      JSON.stringify(taskData.action || {}),
      taskData.model || 'kimi-coding/k2p5',
      taskData.enabled ? 1 : 0,
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

    if (updates.name) {
      fields.push('name = ?');
      values.push(updates.name);
    }

    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }

    if (updates.schedule) {
      fields.push('schedule = ?');
      values.push(JSON.stringify(updates.schedule));
    }

    if (updates.action) {
      fields.push('action = ?');
      values.push(JSON.stringify(updates.action));
    }

    if (updates.model) {
      fields.push('model = ?');
      values.push(updates.model);
    }

    if (updates.enabled !== undefined) {
      fields.push('enabled = ?');
      values.push(updates.enabled ? 1 : 0);
    }

    if (updates.lastRunAt) {
      fields.push('last_run_at = ?');
      values.push(updates.lastRunAt);
    }

    if (updates.runCount !== undefined) {
      fields.push('run_count = ?');
      values.push(updates.runCount);
    }

    if (updates.lastError) {
      fields.push('last_error = ?');
      values.push(updates.lastError);
    }

    if (updates.lastErrorAt) {
      fields.push('last_error_at = ?');
      values.push(updates.lastErrorAt);
    }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());

    values.push(id);

    await db.run(`UPDATE scheduled_tasks SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  async delete(id) {
    const db = getDb();
    // Delete logs first (foreign key constraint)
    await db.run('DELETE FROM scheduled_task_logs WHERE task_id = ?', id);
    // Then delete the task
    await db.run('DELETE FROM scheduled_tasks WHERE id = ?', id);
    return { deleted: true };
  },

  async addExecutionLog(taskId, logData) {
    const db = getDb();
    await db.run(`
      INSERT INTO scheduled_task_logs (task_id, status, output, executed_at)
      VALUES (?, ?, ?, ?)
    `, [
      taskId,
      logData.status || 'success',
      JSON.stringify(logData),
      new Date().toISOString()
    ]);
  },

  async getExecutionLogs(taskId, limit = 10) {
    const db = getDb();
    return db.all(`
      SELECT * FROM scheduled_task_logs 
      WHERE task_id = ? 
      ORDER BY executed_at DESC 
      LIMIT ?
    `, [taskId, limit]);
  }
};