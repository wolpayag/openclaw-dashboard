import cron from 'node-cron';
import { logger } from '../utils/logger.js';
import { ScheduledTaskRepository } from '../models/scheduledTasks.js';
import { ApiKeyRepository } from '../models/apiKeys.js';
import { broadcastToAll } from '../websocket/index.js';
import { message } from '../utils/message.js';
import { ModelService } from './models.js';

// In-memory store for scheduled task handles
const scheduledHandles = new Map();

export const SchedulerService = {
  async initializeScheduledTasks() {
    try {
      // Load all enabled scheduled tasks from database
      const tasks = await ScheduledTaskRepository.findAll({ enabled: true });
      
      for (const task of tasks) {
        this.scheduleTask(task);
      }
      
      logger.info(`Initialized ${tasks.length} scheduled tasks`);
    } catch (error) {
      logger.error('Failed to initialize scheduled tasks:', error.message);
    }
  },

  scheduleTask(task) {
    // Cancel existing if any
    if (scheduledHandles.has(task.id)) {
      scheduledHandles.get(task.id).stop();
      scheduledHandles.delete(task.id);
    }

    if (!task.enabled) return;

    let cronExpression;
    
    // Parse schedule
    if (task.schedule.type === 'cron') {
      cronExpression = task.schedule.expression;
    } else if (task.schedule.type === 'daily') {
      // Daily at specific time, e.g., "08:00"
      const [hour, minute] = task.schedule.time.split(':');
      cronExpression = `${minute} ${hour} * * *`;
    } else if (task.schedule.type === 'interval') {
      // Interval in minutes
      const minutes = task.schedule.interval;
      cronExpression = `*/${minutes} * * * *`;
    }

    if (!cronExpression || !cron.validate(cronExpression)) {
      logger.error(`Invalid cron expression for task ${task.id}: ${cronExpression}`);
      return;
    }

    const job = cron.schedule(cronExpression, async () => {
      try {
        logger.info(`Executing scheduled task: ${task.name}`);
        
        // Update last run
        await ScheduledTaskRepository.update(task.id, {
          lastRunAt: new Date().toISOString(),
          runCount: (task.run_count || 0) + 1
        });

        // Execute the task action
        await this.executeTaskAction(task);
        
        // Broadcast update
        broadcastToAll('scheduled-task:executed', { taskId: task.id, timestamp: new Date().toISOString() });
        
      } catch (error) {
        logger.error(`Failed to execute scheduled task ${task.name}:`, error.message);
        await ScheduledTaskRepository.update(task.id, {
          lastError: error.message,
          lastErrorAt: new Date().toISOString()
        });
      }
    }, {
      scheduled: true,
      timezone: task.schedule.timezone || 'Europe/Vienna'
    });

    scheduledHandles.set(task.id, job);
    logger.info(`Scheduled task '${task.name}' with cron: ${cronExpression}`);
  },

  async executeTaskAction(task) {
    switch (task.action.type) {
      case 'system_status':
        // Generate system status report
        await this.generateSystemStatusReport(task);
        break;
      case 'telegram_message':
        // Send Telegram message
        await this.sendTelegramMessage(task);
        break;
      case 'weather':
        // Get weather and send
        await this.sendWeatherReport(task);
        break;
      case 'ai_prompt':
        // Generate AI response to prompt
        await this.sendAIPromptResponse(task);
        break;
      case 'webhook':
        // Call webhook
        await this.callWebhook(task.action.url, task.action.payload);
        break;
      case 'command':
        // Execute command (be careful with this)
        logger.info(`Would execute command: ${task.action.command}`);
        break;
      default:
        logger.warn(`Unknown task action type: ${task.action.type}`);
    }
  },

  async generateSystemStatusReport(task) {
    try {
      // Get current stats
      const { StatsService } = await import('./stats.js');
      const stats = await StatsService.getDashboardStats();
      
      const report = {
        timestamp: new Date().toISOString(),
        type: 'system_status',
        data: {
          tasks: stats.tasks,
          agents: stats.agents,
          usage: stats.usage
        }
      };

      // Format message for Telegram
      const messageText = `📊 *System Status Report*

` +
        `*Tasks:* ${stats.tasks.total} total\n` +
        `  • Pending: ${stats.tasks.pending || 0}\n` +
        `  • In Progress: ${stats.tasks.in_progress || 0}\n` +
        `  • Completed: ${stats.tasks.completed || 0}\n\n` +
        `*Agents:* ${stats.agents.active || 0} active / ${stats.agents.total || 0} total\n\n` +
        `*Usage Today:*\n` +
        `  • Tokens: ${(stats.usage?.today?.total_tokens || 0).toLocaleString()}\n` +
        `  • Cost: $${(stats.usage?.today?.total_cost || 0).toFixed(4)}\n\n` +
        `_Report generated: ${new Date().toLocaleString('de-DE')}_`;

      // Send to Telegram
      await message({
        action: 'send',
        message: messageText,
        target: 'telegram:1001601662'  // Paul's Telegram ID
      });

      logger.info('System status report sent to Telegram');
      
      // Store the report
      await ScheduledTaskRepository.addExecutionLog(task.id, report);
      
      // Broadcast to dashboard
      broadcastToAll('scheduled-task:report', report);
      
    } catch (error) {
      logger.error('Failed to generate/send system status report:', error.message);
      throw error;
    }
  },

  async sendTelegramMessage(task) {
    try {
      let messageText;
      
      // If it's an AI-generated message prompt, use the model
      if (task.action.useAI || task.action.message?.includes('?') || task.action.message?.length < 50) {
        // Generate AI response using OpenClaw
        const prompt = task.action.message || 'Hello!';
        
        // Call OpenClaw to generate a response
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        try {
          // Try to use OpenClaw to generate a response
          const openclawPrompt = `Generate a helpful, friendly Telegram message responding to: "${prompt}". Keep it concise (under 200 characters) and engaging.`;
          
          // For now, create an enhanced message
          const timestamp = new Date().toLocaleString('de-DE', { 
            hour: '2-digit', 
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit'
          });
          
          messageText = `🤖 *${task.name}*\n\n${prompt}\n\n_${timestamp}_`;
          
          // If there's context for the message, add it
          if (task.action.context) {
            messageText += `\n\nContext: ${task.action.context}`;
          }
          
        } catch (aiError) {
          logger.warn('AI generation failed, using basic message:', aiError.message);
          messageText = `🤖 *${task.name}*\n\n${prompt}`;
        }
      } else {
        // Use the provided message directly
        messageText = task.action.message || 'Scheduled task executed!';
      }
      
      await message({
        action: 'send',
        message: messageText,
        target: 'telegram:1001601662'
      });
      
      logger.info(`Telegram message sent for task ${task.name}`);
      
      await ScheduledTaskRepository.addExecutionLog(task.id, {
        status: 'success',
        message: messageText,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to send Telegram message:', error.message);
      throw error;
    }
  },

  async sendWeatherReport(task) {
    try {
      // Get weather data
      const { getWeather } = await import('../utils/weather.js');
      const location = task.action.location || 'Vienna';
      const weather = await getWeather(location);
      
      const messageText = `🌤️ *Good Morning!*\n\n` +
        `*Weather in ${location}:*\n` +
        `  • Condition: ${weather.condition}\n` +
        `  • Temperature: ${weather.temperature}°C\n` +
        `  • Feels like: ${weather.feelsLike}°C\n` +
        `  • Humidity: ${weather.humidity}%\n\n` +
        `_Have a great day! ☀️_`;

      await message({
        action: 'send',
        message: messageText,
        target: 'telegram:1001601662'
      });
      
      logger.info(`Weather report sent to Telegram for ${location}`);
      
      await ScheduledTaskRepository.addExecutionLog(task.id, {
        status: 'success',
        message: `Weather report for ${location}`,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to send weather report:', error.message);
      throw error;
    }
  },

  async sendAIPromptResponse(task) {
    try {
      const prompt = task.action.prompt || 'Hello!';
      const context = task.action.context || '';
      const model = task.model || 'kimi-coding/k2p5';
      const apiKey = task.api_key || null;
      const customModelId = task.custom_model_id || null;
      
      let aiResponse;
      
      try {
        // Use ModelService to generate response with API key and custom model ID
        aiResponse = await ModelService.generateWithModel(model, prompt, context, apiKey, customModelId);
        logger.info(`Generated AI response using ${model}`);
      } catch (error) {
        logger.error('AI generation failed:', error.message);
        aiResponse = `❌ Failed to generate AI response: ${error.message}`;
      }
      
      const messageText = `📅 *Scheduled Task: ${task.name}*\n\n🤖 *AI Response*\n\n${aiResponse}\n\n` +
        `_Model: ${model}_\n` +
        `_Time: ${new Date().toLocaleString('de-DE')}_`;

      await message({
        action: 'send',
        message: messageText,
        target: 'telegram:1001601662'
      });
      
      logger.info(`AI prompt response sent for task ${task.name}`);
      
      await ScheduledTaskRepository.addExecutionLog(task.id, {
        status: 'success',
        message: 'AI response sent',
        model: model,
        prompt: prompt,
        response: aiResponse,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to send AI prompt response:', error.message);
      throw error;
    }
  },

  async callWebhook(url, payload) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      logger.info(`Webhook call to ${url}: ${response.status}`);
    } catch (error) {
      logger.error(`Webhook call failed: ${error.message}`);
    }
  },

  async createTask(taskData) {
    const task = await ScheduledTaskRepository.create(taskData);
    if (task.enabled) {
      this.scheduleTask(task);
    }
    return task;
  },

  async updateTask(id, updates) {
    const task = await ScheduledTaskRepository.update(id, updates);
    
    // Re-schedule if needed
    if (updates.schedule || updates.enabled !== undefined) {
      this.scheduleTask(task);
    }
    
    return task;
  },

  async deleteTask(id) {
    if (scheduledHandles.has(id)) {
      scheduledHandles.get(id).stop();
      scheduledHandles.delete(id);
    }
    return ScheduledTaskRepository.delete(id);
  },

  getNextExecutionTime(cronExpression, timezone = 'Europe/Vienna') {
    try {
      // Simple next execution calculation for display
      // In production, use a proper cron parser
      return null; // Placeholder
    } catch (error) {
      return null;
    }
  }
};