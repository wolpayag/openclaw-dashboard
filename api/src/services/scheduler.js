import cron from 'node-cron';
import { StatsService } from '../services/stats.js';
import { EventRepository } from '../models/events.js';
import { logger } from '../utils/logger.js';
import { broadcastToAll } from '../websocket/index.js';

export function startSchedulers(io) {
  // Update dashboard stats every 5 seconds
  cron.schedule('*/5 * * * * *', async () => {
    try {
      const stats = await StatsService.getDashboardStats();
      broadcastToAll('stats:update', stats);
    } catch (error) {
      logger.error('Error updating stats', { error: error.message });
    }
  });

  // Check usage thresholds every minute
  cron.schedule('* * * * *', async () => {
    try {
      await checkUsageThresholds();
    } catch (error) {
      logger.error('Error checking thresholds', { error: error.message });
    }
  });

  // Clean up old data daily
  cron.schedule('0 0 * * *', async () => {
    try {
      await cleanupOldData();
    } catch (error) {
      logger.error('Error cleaning up old data', { error: error.message });
    }
  });

  logger.info('Schedulers started');
}

async function checkUsageThresholds() {
  const thresholds = {
    low: parseInt(process.env.ALERT_THRESHOLD_LOW) || 80,
    medium: parseInt(process.env.ALERT_THRESHOLD_MEDIUM) || 90,
    high: parseInt(process.env.ALERT_THRESHOLD_HIGH) || 95
  };

  // Get current usage
  const stats = await StatsService.getDashboardStats();
  const usage = stats.usage;

  // Check if we need to trigger alerts
  // This is a simplified example - in production you'd track alert state
  // to avoid spamming
  const usagePercent = calculateUsagePercent(usage);

  if (usagePercent >= thresholds.high) {
    await EventRepository.create({
      type: 'usage.threshold.exceeded',
      severity: 'critical',
      message: `Usage exceeded ${thresholds.high}% threshold`,
      metadata: { usage: usagePercent, threshold: thresholds.high }
    });
    broadcastToAll('alert:critical', { type: 'usage', message: `Usage at ${usagePercent}%` });
  } else if (usagePercent >= thresholds.medium) {
    await EventRepository.create({
      type: 'usage.threshold.warning',
      severity: 'warning',
      message: `Usage exceeded ${thresholds.medium}% threshold`,
      metadata: { usage: usagePercent, threshold: thresholds.medium }
    });
    broadcastToAll('alert:warning', { type: 'usage', message: `Usage at ${usagePercent}%` });
  }
}

function calculateUsagePercent(usage) {
  // Simplified calculation - adjust based on your actual limits
  const dailyLimit = 1000000; // Example: 1M tokens per day
  const todayTokens = usage.today?.total_tokens || 0;
  return Math.min(100, (todayTokens / dailyLimit) * 100);
}

async function cleanupOldData() {
  const db = (await import('../models/index.js')).getDb();
  
  // Keep 90 days of task history
  await db.run(`
    DELETE FROM tasks 
    WHERE status IN ('completed', 'failed', 'cancelled')
    AND completed_at < datetime('now', '-90 days')
  `);

  // Keep 30 days of usage stats
  await db.run(`
    DELETE FROM usage_stats 
    WHERE date < date('now', '-30 days')
  `);

  // Keep 7 days of system events
  await db.run(`
    DELETE FROM system_events 
    WHERE created_at < datetime('now', '-7 days')
    AND acknowledged = 1
  `);

  logger.info('Old data cleanup completed');
}