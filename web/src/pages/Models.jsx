import { useState, useEffect } from 'react'
import { Brain, Zap, Clock, DollarSign } from 'lucide-react'
import { api } from '../utils/api'
import { useDashboardStore } from '../store/themeStore'

function Models() {
  const [models, setModels] = useState([])
  const { stats } = useDashboardStore()

  useEffect(() => {
    loadModels()
  }, [])

  const loadModels = async () => {
    try {
      const data = await api.get('/stats/models')
      setModels(data.models)
    } catch (error) {
      console.error('Failed to load models:', error)
    }
  }

  const modelInfo = [
    { 
      name: 'Kimi K2.5', 
      id: 'kimi-coding/k2p5',
      description: 'Latest coding-optimized model from Moonshot AI',
      strengths: ['Code generation', 'Technical reasoning', 'Long context'],
      avgSpeed: 'Fast',
      quality: 'High'
    },
    {
      name: 'GPT-4',
      id: 'gpt-4',
      description: 'OpenAI\'s flagship model',
      strengths: ['General knowledge', 'Creative writing', 'Analysis'],
      avgSpeed: 'Medium',
      quality: 'Very High'
    },
    {
      name: 'Claude 3',
      id: 'claude-3',
      description: 'Anthropic\'s Claude model',
      strengths: ['Safety', 'Instruction following', 'Long context'],
      avgSpeed: 'Medium',
      quality: 'High'
    }
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Model Monitor</h1>

      {/* Current Model Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <Brain className="w-6 h-6 text-primary-500" />
            <h3 className="font-semibold text-[var(--text-primary)]">Active Model</h3>
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">Kimi K2.5</p>
          <p className="text-sm text-[var(--text-secondary)]">{kimi-coding/k2p5}</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-6 h-6 text-yellow-500" />
            <h3 className="font-semibold text-[var(--text-primary)]">Reasoning Mode</h3>
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">OFF</p>
          <p className="text-sm text-[var(--text-secondary)]">Standard mode active</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-6 h-6 text-blue-500" />
            <h3 className="font-semibold text-[var(--text-primary)]">Avg Response</h3>
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">1.2s</p>
          <p className="text-sm text-[var(--text-secondary)]">Last 24 hours</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-3">
            <DollarSign className="w-6 h-6 text-green-500" />
            <h3 className="font-semibold text-[var(--text-primary)]">Cost Efficiency</h3>
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">92%</p>
          <p className="text-sm text-[var(--text-secondary)]">Compared to GPT-4</p>
        </div>
      </div>

      {/* Model Comparison */}
      <div className="card">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Model Comparison</h2>
        
        <div className="space-y-4">
          {modelInfo.map((model) => {
            const usage = models.find(m => m.model === model.id)
            
            return (
              <div 
                key={model.id}
                className={`p-4 rounded-lg border ${
                  model.id === 'kimi-coding/k2p5' 
                    ? 'border-primary-500 bg-primary-500/5' 
                    : 'border-[var(--border-color)]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[var(--text-primary)]">{model.name}</h3>
                      {model.id === 'kimi-coding/k2p5' && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-primary-500 text-white">Active</span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">{model.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      {model.strengths.map((strength) => (
                        <span 
                          key={strength}
                          className="text-xs px-2 py-1 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                        >
                          {strength}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-[var(--text-secondary)]">Speed: </span>
                        <span className="text-[var(--text-primary)]">{model.avgSpeed}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-secondary)]">Quality: </span>
                        <span className="text-[var(--text-primary)]">{model.quality}</span>
                      </div>
                    </div>
                    
                    {usage && (
                      <div className="text-sm text-[var(--text-secondary)]">
                        Used {usage.usage_count.toLocaleString()} times • ${usage.total_cost.toFixed(4)} total
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Models