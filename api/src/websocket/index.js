import { logger } from '../utils/logger.js';
import { StatsService } from '../services/stats.js';
import { TaskService } from '../services/tasks.js';
import { AgentService } from '../services/agents.js';

let io = null;

export function initializeWebSocket(socketIo) {
  io = socketIo;

  io.on('connection', (socket) => {
    logger.info('Client connected', { socketId: socket.id });

    // Send initial dashboard data
    sendDashboardData(socket);

    // Handle subscription requests
    socket.on('subscribe', (channel) => {
      socket.join(channel);
      logger.debug(`Client ${socket.id} subscribed to ${channel}`);
    });

    socket.on('unsubscribe', (channel) => {
      socket.leave(channel);
      logger.debug(`Client ${socket.id} unsubscribed from ${channel}`);
    });

    socket.on('disconnect', () => {
      logger.info('Client disconnected', { socketId: socket.id });
    });
  });

  logger.info('WebSocket handlers initialized');
}

async function sendDashboardData(socket) {
  try {
    const [stats, tasks, agents] = await Promise.all([
      StatsService.getDashboardStats(),
      TaskService.getAllTasks({ limit: 10 }),
      AgentService.getAllAgents()
    ]);

    socket.emit('dashboard:data', {
      stats,
      recentTasks: tasks,
      agents
    });
  } catch (error) {
    logger.error('Error sending dashboard data', { error: error.message });
  }
}

export function broadcast(channel, data) {
  if (io) {
    io.to(channel).emit(channel, data);
  }
}

export function broadcastToAll(event, data) {
  if (io) {
    io.emit(event, data);
  }
}

export { io };