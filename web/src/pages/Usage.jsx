import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { api } from '../utils/api'

function Usage() {
  const [usage, setUsage] = useState([])
  const [models, setModels] = useState([])
  const [period, setPeriod] = useState('7d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsageData()
  }, [period])

  const loadUsageData = async () => {
    try {
      setLoading(true)
      const [usageData, modelData] = await Promise.all([
        api.get(`/stats/usage?period=${period}`),
        api.get('/stats/models')
      ])
      setUsage(usageData.usage)
      setModels(modelData.models)
    } catch (error) {
      console.error('Failed to load usage data:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalTokens = usage.reduce((sum, day) => sum + (day.tokens_input || 0) + (day.tokens_output || 0), 0)
  const totalCost = usage.reduce((sum, day) => sum + (day.cost_estimate || 0), 0)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Resource Usage</h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <p className="text-sm text-[var(--text-secondary)]">Total Tokens</p>
          <p className="text-3xl font-bold text-[var(--text-primary)]">{totalTokens.toLocaleString()}</p>
        </div>
        <div className="card">
          <p className="text-sm text-[var(--text-secondary)]">Total Requests</p>
          <p className="text-3xl font-bold text-[var(--text-primary)]">
            {usage.reduce((sum, day) => sum + (day.requests_count || 0), 0).toLocaleString()}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-[var(--text-secondary)]">Estimated Cost</p>
          <p className="text-3xl font-bold text-[var(--text-primary)]">${totalCost.toFixed(2)}</p>
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex gap-2">
        {['24h', '7d', '30d'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              period === p
                ? 'bg-primary-500 text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
            }`}
          >
            Last {p}
          </button>
        ))}
      </div>

      {/* Usage Chart */}
      <div className="card">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Token Usage Over Time</h2>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usage}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis 
                  dataKey="date" 
                  stroke="var(--text-secondary)"
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="tokens_input" name="Input Tokens" fill="#3b82f6" />
                <Bar dataKey="tokens_output" name="Output Tokens" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Model Performance */}
      <div className="card">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Model Performance</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left py-3 px-4 text-[var(--text-secondary)] font-medium">Model</th>
                <th className="text-left py-3 px-4 text-[var(--text-secondary)] font-medium">Usage Count</th>
                <th className="text-left py-3 px-4 text-[var(--text-secondary)] font-medium">Avg Tokens</th>
                <th className="text-left py-3 px-4 text-[var(--text-secondary)] font-medium">Total Cost</th>
              </tr>
            </thead>
            <tbody>
              {models.map((model) => (
                <tr key={model.model} className="border-b border-[var(--border-color)] last:border-0">
                  <td className="py-3 px-4 text-[var(--text-primary)]">{model.model}</td>
                  <td className="py-3 px-4 text-[var(--text-secondary)]">{model.usage_count.toLocaleString()}</td>
                  <td className="py-3 px-4 text-[var(--text-secondary)]">{Math.round(model.avg_tokens).toLocaleString()}</td>
                  <td className="py-3 px-4 text-[var(--text-primary)] font-medium">${model.total_cost.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Usage