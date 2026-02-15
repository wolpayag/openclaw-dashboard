import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Model API endpoints
const MODEL_APIS = {
  'kimi-coding/k2p5': {
    url: 'https://api.moonshot.cn/v1/chat/completions',
    model: 'kimi-k2-5'
  }
};

export const ModelService = {
  async getAvailableModels() {
    const models = [
      { id: 'kimi-coding/k2p5', name: 'Kimi K2.5', type: 'cloud', description: 'High quality, API cost' }
    ];

    // Check for Ollama (local models)
    try {
      const { stdout } = await execAsync('ollama list 2>/dev/null || echo ""');
      if (stdout) {
        const lines = stdout.trim().split('\n').slice(1);
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 4) {
            const modelName = parts[0];
            models.push({
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

    // Check for local API endpoints
    const localEndpoints = [
      { url: 'http://localhost:11434/api/tags', name: 'Ollama API' },
      { url: 'http://localhost:8080/v1/models', name: 'LocalAI' },
      { url: 'http://localhost:5001/v1/models', name: 'LM Studio' }
    ];

    for (const endpoint of localEndpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1000);
        const response = await fetch(endpoint.url, { signal: controller.signal });
        clearTimeout(timeout);
        
        if (response.ok) {
          const data = await response.json();
          if (data.models) {
            for (const model of data.models) {
              const modelId = model.id || model.name || model.model;
              if (modelId && !models.find(m => m.id === `local:${modelId}`)) {
                models.push({
                  id: `local:${modelId}`,
                  name: `${modelId} (Local)`,
                  type: 'local',
                  description: `Local model`
                });
              }
            }
          }
        }
      } catch (e) {
        // Endpoint not available
      }
    }

    return models;
  },

  async generateWithModel(modelId, prompt, context = '', apiKey = null) {
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

    // Local API models (LocalAI, LM Studio)
    if (modelId.startsWith('local:')) {
      const modelName = modelId.replace('local:', '');
      const endpoints = [
        'http://localhost:8080/v1/chat/completions',
        'http://localhost:5001/v1/chat/completions'
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: modelName,
              messages: [{ role: 'user', content: fullPrompt }],
              temperature: 0.7
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            return data.choices?.[0]?.message?.content || 'No response';
          }
        } catch (e) {
          continue;
        }
      }
      throw new Error('No local model endpoint available');
    }

    // Cloud models - use provided API key or fall back to env
    if (modelId === 'kimi-coding/k2p5' || modelId.includes('kimi')) {
      const keyToUse = apiKey || process.env.MOONSHOT_API_KEY || process.env.OPENCLAW_MOONSHOT_KEY;
      
      if (!keyToUse) {
        return `⚠️ *AI Response Unavailable*\n\n` +
          `Prompt: "${prompt}"\n\n` +
          `No API key configured. Please enter your Moonshot API key in the task settings.`;
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
            return `⚠️ *Invalid API Key*\n\n` +
              `The API key you provided is invalid or expired.\n\n` +
              `Please check your Moonshot API key and try again.`;
          }
          
          throw new Error(`API error: ${errorMsg}`);
        }
      } catch (e) {
        if (e.message.includes('fetch') || e.message.includes('network')) {
          return `⚠️ *Network Error*\n\n` +
            `Could not connect to Moonshot API.\n\n` +
            `Please check your internet connection.`;
        }
        return `Error calling AI: ${e.message}`;
      }
    }

    return `Model ${modelId} not supported`;
  }
};