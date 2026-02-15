import { getDb } from './index.js';

export const EventRepository = {
  async findAll(filters = {}) {
    const db = getDb();
    let query = 'SELECT * FROM system_events WHERE 1=1';
    const params = [];

    if (filters.severity) {
      query += ' AND severity = ?';
      params.push(filters.severity);
    }

    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters.acknowledged !== undefined) {
      query += ' AND acknowledged = ?';
      params.push(filters.acknowledged ? 1 : 0);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(parseInt(filters.limit));
    }

    return db.all(query, params);
  },

  async create(eventData) {
    const db = getDb();
    const result = await db.run(`
      INSERT INTO system_events (type, severity, message, metadata)
      VALUES (?, ?, ?, ?)
    `, [
      eventData.type,
      eventData.severity || 'info',
      eventData.message,
      eventData.metadata ? JSON.stringify(eventData.metadata) : null
    ]);

    return { id: result.lastID, ...eventData };
  },

  async acknowledge(id) {
    const db = getDb();
    await db.run('UPDATE system_events SET acknowledged = 1 WHERE id = ?', id);
    return { acknowledged: true };
  },

  async getActiveAlerts() {
    const db = getDb();
    return db.all(`
      SELECT * FROM system_events 
      WHERE severity IN ('warning', 'error', 'critical')
        AND acknowledged = 0
      ORDER BY 
        CASE severity 
          WHEN 'critical' THEN 1 
          WHEN 'error' THEN 2 
          WHEN 'warning' THEN 3 
        END,
        created_at DESC
      LIMIT 10
    `);
  }
};