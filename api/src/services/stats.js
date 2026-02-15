import { StatsRepository } from '../models/stats.js';
import { EventRepository } from '../models/events.js';
import { TaskRepository } from '../models/tasks.js';
import { AgentRepository } from '../models/agents.js';

export const StatsService = {
  async getDashboardStats() {
    const [taskStats, agentStats, currentUsage] = await Promise.all([
      TaskRepository.getStats(),
      AgentRepository.getStats(),
      StatsRepository.getCurrentUsage()
    ]);

    return {
      tasks: taskStats,
      agents: agentStats,
      usage: currentUsage
    };
  },

  async getUsageHistory(period) {
    return StatsRepository.getUsageStats(period);
  },

  async getModelPerformance() {
    return StatsRepository.getModelPerformance();
  },

  async getErrorHistory(period) {
    return StatsRepository.getErrorStats(period);
  },

  async recordAPICall(data) {
    return StatsRepository.recordUsage(data);
  },

  async getSystemHealth() {
    const [taskStats, agentStats, activeAlerts] = await Promise.all([
      TaskRepository.getStats(),
      AgentRepository.getStats(),
      EventRepository.getActiveAlerts()
    ]);

    const failedRate = taskStats.total > 0 
      ? (taskStats.failed / taskStats.total) * 100 
      : 0;

    const health = {
      status: 'healthy',
      score: 100,
      indicators: {
        tasks: {
          status: failedRate > 20 ? 'warning' : 'healthy',
          failedRate: parseFloat(failedRate.toFixed(2)),
          pending: taskStats.pending,
          inProgress: taskStats.in_progress
        },
        agents: {
          status: agentStats.error > 0 ? 'warning' : 'healthy',
          active: agentStats.active,
          idle: agentStats.idle,
          error: agentStats.error
        },
        alerts: {
          count: activeAlerts.length,
          critical: activeAlerts.filter(a => a.severity === 'critical').length
        }
      }
    };

    // Calculate overall score
    if (health.indicators.alerts.critical > 0) {
      health.status = 'critical';
      health.score = Math.max(0, health.score - 50);
    } else if (health.indicators.alerts.count > 0 || failedRate > 20) {
      health.status = 'warning';
      health.score = Math.max(50, health.score - 25);
    }

    return health;
  }
};