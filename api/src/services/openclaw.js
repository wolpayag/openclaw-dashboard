import { readFileSync } from 'fs';
import { logger } from '../utils/logger.js';
import { AgentRepository } from '../models/agents.js';
import { StatsRepository } from '../models/stats.js';
import { broadcastToAll } from '../websocket/index.js';

const SESSIONS_FILE = '/home/paul/.openclaw/agents/main/sessions/sessions.json';

// Track which agents we've already synced this session
const syncedAgents = new Map();

export const OpenClawIntegration = {
  async syncSessions() {
    try {
      const sessions = this.readSessionsFile();
      const sessionKeys = Object.keys(sessions);
      
      // Get list of current valid session keys
      const currentSessionKeys = new Set(sessionKeys);
      
      // First, mark all existing agents as offline if they're not in current sessions
      const allAgents = await AgentRepository.findAll();
      for (const agent of allAgents) {
        if (!currentSessionKeys.has(agent.id)) {
          await AgentRepository.update(agent.id, { status: 'offline' });
        }
      }
      
      // Sync current sessions
      for (const sessionKey of sessionKeys) {
        const sessionData = sessions[sessionKey];
        await this.upsertAgentFromSession(sessionKey, sessionData);
      }

      logger.info(`Synced ${sessionKeys.length} sessions from OpenClaw`);
      return sessionKeys;
    } catch (error) {
      logger.error('Failed to sync sessions:', error.message);
      return [];
    }
  },

  readSessionsFile() {
    try {
      const data = readFileSync(SESSIONS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      logger.error('Failed to read sessions file:', error.message);
      return {};
    }
  },

  async upsertAgentFromSession(sessionKey, session) {
    try {
      // Use sessionKey directly as ID - this prevents duplicates
      const existing = await AgentRepository.findById(sessionKey);
      
      const agentData = {
        id: sessionKey,  // Use the session key as the ID
        name: session.origin?.label || sessionKey.split(':').pop() || 'Unknown Agent',
        type: session.chatType || 'direct',
        status: 'active',
        model: `${session.modelProvider}/${session.model}`,
        reasoning_enabled: false,
        lastSeenAt: new Date(session.updatedAt).toISOString(),
        stats: JSON.stringify({
          inputTokens: session.inputTokens || 0,
          outputTokens: session.outputTokens || 0,
          totalTokens: session.totalTokens || 0,
          contextTokens: session.contextTokens || 262144,
          channel: session.lastChannel,
          provider: session.modelProvider
        })
      };

      if (existing) {
        // Update existing - use the session key as ID
        await AgentRepository.update(sessionKey, agentData);
      } else {
        // Create with session key as ID
        await AgentRepository.create(agentData);
      }
    } catch (error) {
      logger.error('Failed to upsert agent:', error.message);
    }
  },

  async recordCurrentUsage() {
    try {
      const sessions = this.readSessionsFile();
      
      let totalInput = 0;
      let totalOutput = 0;
      let totalRequests = 0;

      for (const session of Object.values(sessions)) {
        totalInput += session.inputTokens || 0;
        totalOutput += session.outputTokens || 0;
        totalRequests += 1;
      }

      // Estimate cost (Kimi K2.5 ~ $0.003 per 1K tokens)
      const costEstimate = ((totalInput + totalOutput) / 1000) * 0.003;

      await StatsRepository.recordUsage({
        model: 'kimi-coding/k2p5',
        tokensInput: totalInput,
        tokensOutput: totalOutput,
        requestsCount: totalRequests,
        costEstimate: costEstimate
      });

      // Broadcast update
      const currentUsage = await StatsRepository.getCurrentUsage();
      broadcastToAll('usage:update', currentUsage);

    } catch (error) {
      logger.error('Failed to record usage:', error.message);
    }
  },

  async getOpenClawStatus() {
    try {
      const sessions = this.readSessionsFile();
      const sessionCount = Object.keys(sessions).length;
      
      return {
        connected: true,
        status: 'healthy',
        sessions: sessionCount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        connected: false,
        status: 'disconnected',
        error: error.message
      };
    }
  }
};