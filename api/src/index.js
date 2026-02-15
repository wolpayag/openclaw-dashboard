import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { initializeDatabase } from './models/index.js';
import { initializeWebSocket } from './websocket/index.js';
import { startSchedulers } from './services/scheduler.js';
import { SchedulerService } from './services/schedulerService.js';

// Routes
import taskRoutes from './routes/tasks.js';
import agentRoutes from './routes/agents.js';
import statsRoutes from './routes/stats.js';
import webhookRoutes from './routes/webhooks.js';
import healthRoutes from './routes/health.js';
import scheduledTaskRoutes from './routes/scheduledTasks.js';
import modelRoutes from './routes/models.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST']
  },
  path: process.env.WS_PATH || '/ws'
});

const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 3002;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/models', modelRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/scheduled-tasks', scheduledTaskRoutes);
app.use('/health', healthRoutes);

// Error handling
app.use(errorHandler);

// Initialize services
async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    logger.info('Database initialized');

    // Initialize WebSocket
    initializeWebSocket(io);
    logger.info('WebSocket initialized');

    // Start schedulers
    startSchedulers(io);
    logger.info('Schedulers started');

    // Initialize scheduled tasks
    await SchedulerService.initializeScheduledTasks();
    logger.info('Scheduled tasks initialized');

    // Start HTTP server
    httpServer.listen(PORT, () => {
      logger.info(`API Server running on port ${PORT}`);
      logger.info(`WebSocket Server running on port ${WS_PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

startServer();

export { io };