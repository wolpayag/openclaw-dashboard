import { TaskRepository } from '../models/tasks.js';
import { AgentRepository } from '../models/agents.js';
import { EventRepository } from '../models/events.js';
import { logger } from '../utils/logger.js';

export const TaskService = {
  async getAllTasks(filters) {
    return TaskRepository.findAll(filters);
  },

  async getTaskById(id) {
    const task = await TaskRepository.findById(id);
    if (!task) {
      throw Object.assign(new Error('Task not found'), { status: 404 });
    }
    return task;
  },

  async createTask(taskData) {
    logger.info('Creating new task', { title: taskData.title });
    
    const task = await TaskRepository.create(taskData);
    
    await EventRepository.create({
      type: 'task.created',
      message: `Task "${task.title}" created`,
      metadata: { taskId: task.id }
    });

    return task;
  },

  async updateTask(id, updates) {
    const existing = await TaskRepository.findById(id);
    if (!existing) {
      throw Object.assign(new Error('Task not found'), { status: 404 });
    }

    const previousStatus = existing.status;
    const task = await TaskRepository.update(id, updates);

    // Log status changes
    if (updates.status && updates.status !== previousStatus) {
      await EventRepository.create({
        type: `task.${updates.status}`,
        severity: updates.status === 'failed' ? 'error' : 'info',
        message: `Task "${task.title}" ${updates.status}`,
        metadata: { taskId: id, previousStatus, newStatus: updates.status }
      });

      // Update agent status if task completed/failed
      if ((updates.status === 'completed' || updates.status === 'failed') && task.agent_id) {
        await AgentRepository.update(task.agent_id, {
          status: 'idle',
          currentTaskId: null
        });
      }
    }

    return task;
  },

  async deleteTask(id) {
    const existing = await TaskRepository.findById(id);
    if (!existing) {
      throw Object.assign(new Error('Task not found'), { status: 404 });
    }

    await TaskRepository.delete(id);
    return { deleted: true };
  },

  async getTaskStats() {
    return TaskRepository.getStats();
  },

  async getTaskQueue() {
    return TaskRepository.getQueue();
  },

  async assignTask(taskId, agentId) {
    const task = await TaskRepository.update(taskId, {
      agentId,
      status: 'in_progress'
    });

    await AgentRepository.update(agentId, {
      status: 'active',
      currentTaskId: taskId
    });

    return task;
  }
};