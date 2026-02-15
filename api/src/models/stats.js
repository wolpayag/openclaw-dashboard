import { getDb } from './index.js';

export const StatsRepository = {
  async getUsageStats(period = '7d') {
    const db = getDb();
    const days = parseInt(period) || 7;

    return db.all(`
      SELECT 
        date,
        model,
        SUM(tokens_input) as tokens_input,
        SUM(tokens_output) as tokens_output,
        SUM(requests_count) as requests_count,
        SUM(cost_estimate) as cost_estimate
      FROM usage_stats
      WHERE date >= date('now', '-${days} days')
      GROUP BY date, model
      ORDER BY date DESC
    `);
  },

  async getHourlyStats(date) {
    const db = getDb();
    return db.all(`
      SELECT 
        hour,
        SUM(tokens_input) as tokens_input,
        SUM(tokens_output) as tokens_output,
        SUM(requests_count) as requests_count,
        SUM(cost_estimate) as cost_estimate
      FROM usage_stats
      WHERE date = ?
      GROUP BY hour
      ORDER BY hour
    `, date);
  },

  async recordUsage(data) {
    const db = getDb();
    const date = new Date().toISOString().split('T')[0];
    const hour = new Date().getHours();

    await db.run(`
      INSERT INTO usage_stats (date, hour, model, tokens_input, tokens_output, requests_count, cost_estimate)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(date, hour, model) DO UPDATE SET
        tokens_input = tokens_input + excluded.tokens_input,
        tokens_output = tokens_output + excluded.tokens_output,
        requests_count = requests_count + excluded.requests_count,
        cost_estimate = cost_estimate + excluded.cost_estimate
    `, [
      date,
      hour,
      data.model || 'unknown',
      data.tokensInput || 0,
      data.tokensOutput || 0,
      data.requestsCount || 1,
      data.costEstimate || 0
    ]);
  },

  async getCurrentUsage() {
    const db = getDb();
    const today = new Date().toISOString().split('T')[0];

    const todayStats = await db.get(`
      SELECT 
        SUM(tokens_input) + SUM(tokens_output) as total_tokens,
        SUM(requests_count) as total_requests,
        SUM(cost_estimate) as total_cost
      FROM usage_stats
      WHERE date = ?
    `, today);

    const monthStats = await db.get(`
      SELECT 
        SUM(tokens_input) + SUM(tokens_output) as total_tokens,
        SUM(requests_count) as total_requests,
        SUM(cost_estimate) as total_cost
      FROM usage_stats
      WHERE date >= date('now', 'start of month')
    `);

    return {
      today: todayStats || { total_tokens: 0, total_requests: 0, total_cost: 0 },
      month: monthStats || { total_tokens: 0, total_requests: 0, total_cost: 0 }
    };
  },

  async getModelPerformance() {
    const db = getDb();
    return db.all(`
      SELECT 
        model,
        COUNT(*) as usage_count,
        AVG(tokens_input + tokens_output) as avg_tokens,
        SUM(cost_estimate) as total_cost,
        AVG(cost_estimate) as avg_cost
      FROM usage_stats
      WHERE date >= date('now', '-30 days')
      GROUP BY model
      ORDER BY usage_count DESC
    `);
  },

  async getErrorStats(period = '7d') {
    const db = getDb();
    const days = parseInt(period) || 7;

    return db.all(`
      SELECT 
        date(created_at) as date,
        type,
        COUNT(*) as count
      FROM system_events
      WHERE severity IN ('error', 'critical')
        AND created_at >= datetime('now', '-${days} days')
      GROUP BY date(created_at), type
      ORDER BY date DESC
    `);
  }
};