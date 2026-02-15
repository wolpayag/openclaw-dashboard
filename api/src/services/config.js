import { readFileSync } from 'fs';
import { logger } from '../utils/logger.js';

const OPENCLAW_CONFIG_PATH = '/home/paul/.openclaw/openclaw.json';

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