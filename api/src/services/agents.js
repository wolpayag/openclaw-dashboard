import { AgentRepository } from '../models/agents.js';
import { EventRepository } from '../models/events.js';
import { logger } from '../utils/logger.js';

export const AgentService = {
  async getAllAgents(filters) {
    return AgentRepository.findAll(filters);
  },

  async getAgentById(id) {
    const agent = await AgentRepository.findById(id);
    if (!agent) {
      throw Object.assign(new Error('Agent not found'), { status: 404 });
    }
    return agent;
  },

  async registerAgent(agentData) {
    logger.info('Registering new agent', { name: agentData.name });
    
    const agent = await AgentRepository.create(agentData);
    
    await EventRepository.create({
      type: 'agent.registered',
      message: `Agent "${agent.name}" registered`,
      metadata: { agentId: agent.id }
    });

    return agent;
  },

  async updateAgent(id, updates) {
    const existing = await AgentRepository.findById(id);
    if (!existing) {
      throw Object.assign(new Error('Agent not found'), { status: 404 });
    }

    const previousStatus = existing.status;
    const agent = await AgentRepository.update(id, updates);

    // Log status changes
    if (updates.status && updates.status !== previousStatus) {
      await EventRepository.create({
        type: `agent.${updates.status}`,
        severity: updates.status === 'error' ? 'error' : 'info',
        message: `Agent "${agent.name}" is now ${updates.status}`,
        metadata: { agentId: id, previousStatus, newStatus: updates.status }
      });
    }

    return agent;
  },

  async getAgentStats() {
    return AgentRepository.getStats();
  },

  async getWorkloadDistribution() {
    return AgentRepository.getWorkload();
  },

  async heartbeat(agentId, data = {}) {
    const agent = await AgentRepository.findById(agentId);
    if (!agent) {
      throw Object.assign(new Error('Agent not found'), { status: 404 });
    }

    await AgentRepository.update(agentId, {
      status: data.status || 'idle',
      currentTaskId: data.currentTaskId || null,
      model: data.model || agent.model,
      reasoningEnabled: data.reasoningEnabled || agent.reasoning_enabled
    });

    return { acknowledged: true };
  }
};