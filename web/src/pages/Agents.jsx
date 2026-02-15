import { useState, useEffect } from 'react'
import { Plus, Activity } from 'lucide-react'
import { api } from '../utils/api'
import AgentStatus from '../components/AgentStatus'

function Agents() {
  const [agents, setAgents] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    try {
      const [agentsData, statsData] = await Promise.all([
        api.get('/agents'),
        api.get('/agents/stats')
      ])
      setAgents(agentsData.agents)
      setStats(statsData)
    } catch (error) {
      console.error('Failed to load agents:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'idle': return 'bg-gray-400'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Agents</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
          <Plus className="w-4 h-4" />
          Register Agent
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Overview</h2>
          <AgentStatus stats={stats} />
        </div>

        <div className="lg:col-span-2 card">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Agent List</h2>
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {agents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-[var(--bg-primary)]"
                >
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`} />
                  
                  <div className="flex-1">
                    <p className="font-medium text-[var(--text-primary)]">{agent.name}</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {agent.type || 'Standard Agent'} • {agent.model || 'Unknown Model'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    {agent.reasoning_enabled && (
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-500">
                        Reasoning
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                      agent.status === 'active' ? 'bg-green-500/10 text-green-500' :
                      agent.status === 'error' ? 'bg-red-500/10 text-red-500' :
                      'bg-gray-500/10 text-gray-500'
                    }`}>
                      {agent.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Agents