import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const ModelService = {
  async getAvailableModels() {
    const models = [
      { id: 'kimi-coding/k2p5', name: 'Kimi K2.5', type: 'cloud', description: 'High quality, API cost' }
    ];

    // Check for Ollama (local models)
    try {
      const { stdout } = await execAsync('ollama list 2>/dev/null || echo ""');
      if (stdout) {
        const lines = stdout.trim().split('\n').slice(1); // Skip header
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
      // Ollama not installed or not running
    }

    // Check for common local model endpoints
    const localEndpoints = [
      { url: 'http://localhost:11434/api/tags', name: 'Ollama API' },
      { url: 'http://localhost:8080/v1/models', name: 'LocalAI' },
      { url: 'http://localhost:5001/v1/models', name: 'LM Studio' }
    ];

    for (const endpoint of localEndpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1000);
        
        const response = await fetch(endpoint.url, { 
          signal: controller.signal 
        });
        clearTimeout(timeout);
        
        if (response.ok) {
          const data = await response.json();
          // Parse different API formats
          if (data.models) {
            for (const model of data.models) {
              const modelId = model.id || model.name || model.model;
              if (modelId && !models.find(m => m.id === `local:${modelId}`)) {
                models.push({
                  id: `local:${modelId}`,
                  name: `${modelId} (Local - ${endpoint.name})`,
                  type: 'local',
                  description: `Local model via ${endpoint.name}`
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

  async generateWithModel(modelId, prompt, context = '') {
    const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;

    if (modelId.startsWith('ollama:')) {
      // Use Ollama
      const modelName = modelId.replace('ollama:', '');
      try {
        const { stdout } = await execAsync(
          `ollama run ${modelName} "${fullPrompt.replace(/"/g, '\\"')}" 2>/dev/null`
        );
        return stdout.trim();
      } catch (e) {
        throw new Error(`Ollama failed: ${e.message}`);
      }
    }

    if (modelId.startsWith('local:')) {
      // Try LocalAI or LM Studio format
      const modelName = modelId.replace('local:', '');
      
      // Try LocalAI first
      try {
        const response = await fetch('http://localhost:8080/v1/chat/completions', {
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
        // Try LM Studio
        try {
          const response = await fetch('http://localhost:5001/v1/chat/completions', {
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
        } catch (e2) {
          throw new Error('No local model endpoint available');
        }
      }
    }

    // Default: return mock response for cloud models
    return `[Using ${modelId}]\n\nThis is a simulated response. In production, this would call the actual API.`;
  }
};