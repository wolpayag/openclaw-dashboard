import { exec } from 'child_process';
import { promisify } from 'util';
import { ConfigService } from './config.js';

const execAsync = promisify(exec);

// API endpoints for different providers
const API_ENDPOINTS = {
  'moonshot': 'https://api.moonshot.cn/v1/chat/completions',
  'openai': 'https://api.openai.com/v1/chat/completions',
  'anthropic': 'https://api.anthropic.com/v1/messages'
};

export const ModelService = {
  async getAvailableModels() {
    // Get pre-configured models from OpenClaw config
    const configuredModels = ConfigService.getConfiguredModels();
    
    const models = [];
    
    // Configured models
    if (configuredModels.length > 0) {
      models.push({ id: 'header-configured', name: '─── Configured ───', type: 'header', disabled: true });
      models.push(...configuredModels.map(m => ({
        ...m,
        description: 'Uses OpenClaw config (may need manual key)'
      })));
    }
    
    // Local models section
    const localModels = [];
    
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
              description: 'Free, runs on your machine'
            });
          }
        }
      }
    } catch (e) {
      // Ollama not installed
    }
    
    if (localModels.length > 0) {
      models.push({ id: 'header-local', name: '─── Local Models ───', type: 'header', disabled: true });
      models.push(...localModels);
    }
    
    // Custom/External models
    models.push({ id: 'header-custom', name: '─── Custom API ───', type: 'header', disabled: true });
    models.push({ 
      id: 'custom', 
      name: 'Any Model (custom API)', 
      type: 'custom',
      description: 'Use any model with your own API key'
    });

    return models;
  },

  async generateWithModel(modelId, prompt, context = '', apiKey = null, customModelId = null) {
    const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;

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

    // Check if this is a pre-configured model
    const isConfigured = ConfigService.isModelConfigured(modelId);
    
    if (isConfigured) {
      const provider = modelId.split('/')[0];
      const openclawKey = ConfigService.getApiKeyForProvider(provider);
      const keyToUse = apiKey || openclawKey || process.env.MOONSHOT_API_KEY;
      
      if (!keyToUse) {
        return `⚠️ *API Key Required*\n\nPlease use "Any Model (custom API)" and enter your API key.`;
      }

      try {
        const response = await fetch(API_ENDPOINTS['moonshot'], {
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
          return data.choices?.[0]?.message?.content || 'No response';
        } else {
          return `⚠️ *API Error*\n\nThe configured key didn't work. Use "Any Model (custom API)" instead.`;
        }
      } catch (e) {
        return `Error: ${e.message}`;
      }
    }

    // Custom model - use provided API key
    if (modelId === 'custom') {
      if (!apiKey) {
        return `⚠️ *API Key Required*\n\nPlease enter your API key.`;
      }

      // Trim whitespace from inputs
      const trimmedApiKey = apiKey.trim();
      const trimmedModelId = (customModelId || 'gpt-3.5-turbo').trim();
      
      // Detect provider from model ID
      const isAnthropic = trimmedModelId.includes('claude');
      const isMoonshot = trimmedModelId.includes('kimi');
      
      try {
        let endpoint, body, headers;
        
        if (isAnthropic) {
          // Anthropic/Claude format
          endpoint = API_ENDPOINTS['anthropic'];
          headers = {
            'Content-Type': 'application/json',
            'x-api-key': trimmedApiKey,
            'anthropic-version': '2023-06-01'
          };
          body = JSON.stringify({
            model: trimmedModelId,
            max_tokens: 1000,
            messages: [{ role: 'user', content: fullPrompt }]
          });
        } else {
          // OpenAI-compatible format (works for OpenAI, Moonshot, etc.)
          endpoint = isMoonshot ? API_ENDPOINTS['moonshot'] : API_ENDPOINTS['openai'];
          headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${trimmedApiKey}`
          };
          body = JSON.stringify({
            model: trimmedModelId,
            messages: [{ role: 'user', content: fullPrompt }],
            temperature: 0.7,
            max_tokens: 1000
          });
        }

        const response = await fetch(endpoint, { method: 'POST', headers, body });

        if (response.ok) {
          const data = await response.json();
          if (isAnthropic) {
            return data.content?.[0]?.text || 'No response';
          }
          return data.choices?.[0]?.message?.content || 'No response';
        } else {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error?.message || `HTTP ${response.status}`;
          
          if (response.status === 401) {
            return `⚠️ *Invalid API Key*\n\nPlease check your API key is correct and active.`;
          }
          
          return `⚠️ *API Error*\n\n${errorMsg}`;
        }
      } catch (e) {
        return `Error: ${e.message}`;
      }
    }

    return `Model ${modelId} not supported`;
  }
};