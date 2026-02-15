import { Bot, CheckCircle2, AlertCircle, MinusCircle } from 'lucide-react'

function AgentStatus({ stats }) {
  const items = [
    { label: 'Active', value: stats.active || 0, icon: CheckCircle2, color: 'text-green-500' },
    { label: 'Idle', value: stats.idle || 0, icon: MinusCircle, color: 'text-gray-500' },
    { label: 'Error', value: stats.error || 0, icon: AlertCircle, color: 'text-red-500' },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-4 rounded-lg bg-[var(--bg-primary)]">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary-500/10">
            <Bot className="w-6 h-6 text-primary-500" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-secondary)]">Total Agents</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.total || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {items.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="text-center p-3 rounded-lg bg-[var(--bg-primary)]">
            <Icon className={`w-5 h-5 mx-auto mb-1 ${color}`} />
            <p className="text-lg font-semibold text-[var(--text-primary)]">{value}</p>
            <p className="text-xs text-[var(--text-secondary)]">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AgentStatus