import { readFileSync } from 'fs';
import { logger } from '../utils/logger.js';

const OPENCLAW_CONFIG_PATH = '/home/paul/.openclaw/openclaw.json';
const OPENCLAW_AUTH_PROFILES_PATH = '/home/paul/.openclaw/agents/main/agent/auth-profiles.json';

export const ConfigService = {
  readOpenClawConfig() {
    try {
      const data = readFileSync(OPENCLAW_CONFIG_PATH, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      logger.error('Failed to read OpenClaw config:', error.message);
      return null;
    }
  },

  readAuthProfiles() {
    try {
      const data = readFileSync(OPENCLAW_AUTH_PROFILES_PATH, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      logger.error('Failed to read auth profiles:', error.message);
      return null;
    }
  },

  getApiKeyForProvider(provider) {
    const authProfiles = this.readAuthProfiles();
    if (!authProfiles?.profiles) {
      return null;
    }

    // Find profile for provider
    for (const [profileId, profile] of Object.entries(authProfiles.profiles)) {
      if (profile.provider === provider && profile.key) {
        return profile.key;
      }
    }

    return null;
  },

  getConfiguredModels() {
    const config = this.readOpenClawConfig();
    if (!config?.agents?.defaults?.models) {
      return [];
    }

    const models = [];
    const modelConfigs = config.agents.defaults.models;

    for (const [modelId, modelData] of Object.entries(modelConfigs)) {
      models.push({
        id: modelId,
        name: modelData.alias || modelId,
        type: 'configured',
        description: 'Pre-configured in OpenClaw',
        provider: modelId.split('/')[0]
      });
    }

    return models;
  },

  getDefaultModel() {
    const config = this.readOpenClawConfig();
    return config?.agents?.defaults?.model?.primary || 'kimi-coding/k2p5';
  },

  isModelConfigured(modelId) {
    const config = this.readOpenClawConfig();
    return !!config?.agents?.defaults?.models?.[modelId];
  }
};