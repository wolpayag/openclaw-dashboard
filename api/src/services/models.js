import { exec } from 'child_process';
import { promisify } from 'util';
import { ConfigService } from './config.js';

const execAsync = promisify(exec);

export const ModelService = {
  async getAvailableModels() {
    // Get pre-configured models from OpenClaw config
    const configuredModels = ConfigService.getConfiguredModels();
    
    const models = [];
    
    // Configured models (may need API key via custom model)
    if (configuredModels.length > 0) {
      models.push({ id: 'header-configured', name: 'Configured Models', type: 'header', disabled: true });
      models.push(...configuredModels.map(m => ({
        ...m,
        description: '⚠️ May need custom API key (see below)'
      })));
    }
    
    // Local models section
    const localModels = [];
    
    // Check for Ollama
    try {
      const { stdout } = await execAsync('ollama list 2>/dev/null || echo ""');
      if (stdout) {
        const lines = stdout.trim().split('\n').slice(1);
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 4) {
            const modelName = parts[0];
            localModels.push({
              id: `ollama:${modelName}`,
              name: `${modelName} (Local)`,
              type: 'local',
              description: 'Runs locally, no API cost'
            });
          }
        }
      }
    } catch (e) {
      // Ollama not installed
    }
    
    if (localModels.length > 0) {
      models.push({ id: 'header-local', name: 'Local Models', type: 'header', disabled: true });
      models.push(...localModels);
    }
    
    // Custom/External models (need API key)
    models.push({ id: 'header-custom', name: 'Custom Models', type: 'header', disabled: true });
    models.push({ 
      id: 'custom-kimi', 
      name: 'Kimi K2.5 (with API key)', 
      type: 'custom',
      provider: 'moonshot',
      description: 'Requires your own API key'
    });

    return models;
  },

  async generateWithModel(modelId, prompt, context = '', apiKey = null) {
    const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;

    // Check if this is a pre-configured model
    const isConfigured = ConfigService.isModelConfigured(modelId);
    
    // Local Ollama models
    if (modelId.startsWith('ollama:')) {
      const modelName = modelId.replace('ollama:', '');
      try {
        const { stdout } = await execAsync(
          `ollama run ${modelName} "${fullPrompt.replace(/"/g, '\\"')}" 2>/dev/null`,
          { timeout: 60000 }
        );
        return stdout.trim();
      } catch (e) {
        throw new Error(`Ollama failed: ${e.message}`);
      }
    }

    // For configured models - get API key from OpenClaw's auth profiles
    if (isConfigured) {
      // Get provider from model ID (e.g., "kimi-coding/k2p5" -> "kimi-coding")
      const provider = modelId.split('/')[0];
      
      // Try to get API key from OpenClaw's stored credentials
      const openclawKey = ConfigService.getApiKeyForProvider(provider);
      
      // Use provided key, OpenClaw key, or env var
      const keyToUse = apiKey || openclawKey || process.env.MOONSHOT_API_KEY;
      
      if (!keyToUse) {
        return `⚠️ *API Key Not Available*\n\n` +
          `The model is configured in OpenClaw, but the API key could not be read.\n\n` +
          `Options:\n` +
          `1. Use "Custom Model" and provide your own API key\n` +
          `2. Set MOONSHOT_API_KEY environment variable`;
      }

      try {
        const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${keyToUse}`
          },
          body: JSON.stringify({
            model: 'kimi-k2-5',
            messages: [{ role: 'user', content: fullPrompt }],
            temperature: 0.7,
            max_tokens: 1000
          })
        });

        if (response.ok) {
          const data = await response.json();
          return data.choices?.[0]?.message?.content || 'No response from AI';
        } else {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error?.message || `HTTP ${response.status}`;
          
          if (errorMsg.includes('Invalid') || response.status === 401) {
            return `⚠️ *API Key Issue*\n\n` +
              `The stored API key could not be used directly.\n\n` +
              `Workaround: Use "Custom Model" and enter your API key manually.`;
          }
          
          throw new Error(`API error: ${errorMsg}`);
        }
      } catch (e) {
        return `Error: ${e.message}`;
      }
    }

    // Custom models - require API key
    if (modelId.startsWith('custom-') || modelId.includes('kimi')) {
      if (!apiKey) {
        return `⚠️ *API Key Required*\n\n` +
          `Please enter your API key to use this model.`;
      }

      try {
        const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'kimi-k2-5',
            messages: [{ role: 'user', content: fullPrompt }],
            temperature: 0.7,
            max_tokens: 1000
          })
        });

        if (response.ok) {
          const data = await response.json();
          return data.choices?.[0]?.message?.content || 'No response from AI';
        } else {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error?.message || `HTTP ${response.status}`;
          
          if (errorMsg.includes('Invalid') || response.status === 401) {
            return `⚠️ *Invalid API Key*\n\nPlease check your API key.`;
          }
          
          throw new Error(`API error: ${errorMsg}`);
        }
      } catch (e) {
        return `Error: ${e.message}`;
      }
    }

    return `Model ${modelId} not supported`;
  },

  isPreConfigured(modelId) {
    return ConfigService.isModelConfigured(modelId);
  }
};