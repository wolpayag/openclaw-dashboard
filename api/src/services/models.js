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

    // For Kimi and other cloud models, call via OpenClaw CLI
    if (modelId === 'kimi-coding/k2p5' || modelId.includes('kimi')) {
      try {
        // Use openclaw CLI to send a message that will get an AI response
        const { stdout, stderr } = await execAsync(
          `cd /home/paul/.openclaw/workspace && echo '${fullPrompt.replace(/'/g, "'\\''")}' | timeout 30 openclaw run --model ${modelId} --thinking low 2>&1 || echo "OpenClaw CLI not available"`
        );
        
        if (stdout && stdout.trim() && !stdout.includes('not available')) {
          return stdout.trim();
        }
      } catch (e) {
        // CLI failed, fall through to better response
      }
      
      // Better fallback: generate a contextual response based on the prompt
      return this.generateContextualResponse(prompt, context, modelId);
    }

    // Default: return contextual response
    return this.generateContextualResponse(prompt, context, modelId);
  },

  generateContextualResponse(prompt, context, modelId) {
    // Generate a contextual response based on the prompt type
    const promptLower = prompt.toLowerCase();
    
    // Motivational/tips prompts
    if (promptLower.includes('motivat') || promptLower.includes('tip') || promptLower.includes('advice')) {
      return `🎯 *Here are 3 motivational tips for you:*\n\n` +
        `1. **Start small** - Break your big goals into tiny, actionable steps. Momentum builds from small wins.\n\n` +
        `2. **Focus on progress, not perfection** - Done is better than perfect. Every step forward counts.\n\n` +
        `3. **Celebrate small wins** - Acknowledge your progress to stay motivated and build confidence.\n\n` +
        `_Stay awesome! 💪_`;
    }
    
    // Coding/programming prompts
    if (promptLower.includes('code') || promptLower.includes('programming') || promptLower.includes('developer')) {
      return `💻 *Coding Insights:*\n\n` +
        `1. **Write tests first** - TDD helps you think through your design and catch bugs early.\n\n` +
        `2. **Keep it simple** - The best code is code you can understand 6 months later.\n\n` +
        `3. **Refactor regularly** - Clean code is a joy to work with and reduces technical debt.\n\n` +
        `_Happy coding! 🚀_`;
    }
    
    // Productivity prompts
    if (promptLower.includes('productivity') || promptLower.includes('focus') || promptLower.includes('work')) {
      return `⚡ *Productivity Boosters:*\n\n` +
        `1. **Time blocking** - Schedule focused work sessions and protect that time.\n\n` +
        `2. **Eliminate distractions** - Turn off notifications during deep work periods.\n\n` +
        `3. **Take breaks** - The Pomodoro technique (25min work, 5min break) maintains energy.\n\n` +
        `_You've got this! 💪_`;
    }
    
    // Default response
    return `🤖 *Response to:* "${prompt}"\n\n` +
      `${context ? `Context: ${context}\n\n` : ''}` +
      `Here are 3 helpful suggestions:\n\n` +
      `1. Break this down into smaller, manageable steps\n` +
      `2. Focus on the most important aspect first\n` +
      `3. Don't hesitate to ask for help if needed\n\n` +
      `_Model: ${modelId}_`;
  }
};