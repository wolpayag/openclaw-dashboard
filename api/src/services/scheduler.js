import cron from 'node-cron';
import { StatsService } from '../services/stats.js';
import { EventRepository } from '../models/events.js';
import { OpenClawIntegration } from '../services/openclaw.js';
import { logger } from '../utils/logger.js';
import { broadcastToAll } from '../websocket/index.js';

// Track when we last sent alerts to avoid spam
const lastAlerts = {
  high: null,
  medium: null,
  low: null
};

export function startSchedulers(io) {
  // Initial sync with OpenClaw
  syncWithOpenClaw();

  // Sync with OpenClaw every 30 seconds
  cron.schedule('*/30 * * * * *', async () => {
    try {
      await syncWithOpenClaw();
    } catch (error) {
      logger.error('Error syncing with OpenClaw', { error: error.message });
    }
  });

  // Update dashboard stats every 5 seconds
  cron.schedule('*/5 * * * * *', async () => {
    try {
      const stats = await StatsService.getDashboardStats();
      broadcastToAll('stats:update', stats);
    } catch (error) {
      logger.error('Error updating stats', { error: error.message });
    }
  });

  // Check usage thresholds every 5 minutes (not every minute to avoid spam)
  cron.schedule('*/5 * * * *', async () => {
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

async function syncWithOpenClaw() {
  try {
    // Sync sessions/agents
    await OpenClawIntegration.syncSessions();
    
    // Record current usage
    await OpenClawIntegration.recordCurrentUsage();
    
    // Get connection status
    const status = await OpenClawIntegration.getOpenClawStatus();
    broadcastToAll('openclaw:status', status);
    
  } catch (error) {
    logger.error('OpenClaw sync failed:', error.message);
  }
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

  const usagePercent = calculateUsagePercent(usage);
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;

  // Only alert once per hour for each threshold
  if (usagePercent >= thresholds.high) {
    if (!lastAlerts.high || (now - lastAlerts.high) > ONE_HOUR) {
      await EventRepository.create({
        type: 'usage.threshold.exceeded',
        severity: 'critical',
        message: `Usage exceeded ${thresholds.high}% threshold`,
        metadata: { usage: usagePercent, threshold: thresholds.high }
      });
      broadcastToAll('alert:critical', { type: 'usage', message: `Usage at ${usagePercent}%` });
      lastAlerts.high = now;
    }
  } else if (usagePercent >= thresholds.medium) {
    if (!lastAlerts.medium || (now - lastAlerts.medium) > ONE_HOUR) {
      await EventRepository.create({
        type: 'usage.threshold.warning',
        severity: 'warning',
        message: `Usage exceeded ${thresholds.medium}% threshold`,
        metadata: { usage: usagePercent, threshold: thresholds.medium }
      });
      broadcastToAll('alert:warning', { type: 'usage', message: `Usage at ${usagePercent}%` });
      lastAlerts.medium = now;
    }
  }
}

function calculateUsagePercent(usage) {
  // Simplified calculation - 1M tokens per day limit
  const dailyLimit = 1000000;
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