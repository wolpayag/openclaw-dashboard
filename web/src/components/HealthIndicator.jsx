import { CheckCircle2, AlertTriangle, AlertCircle, XCircle } from 'lucide-react'

function HealthIndicator({ health }) {
  const icons = {
    healthy: CheckCircle2,
    warning: AlertTriangle,
    critical: XCircle,
  }

  const colors = {
    healthy: 'text-green-500 bg-green-500/10',
    warning: 'text-yellow-500 bg-yellow-500/10',
    critical: 'text-red-500 bg-red-500/10',
  }

  const Icon = icons[health.status] || AlertCircle
  const colorClass = colors[health.status] || colors.warning

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${colorClass}`}>
      <Icon className="w-5 h-5" />
      <span className="font-medium capitalize">{health.status}</span>
      <span className="text-sm opacity-75">({health.score}%)</span>
    </div>
  )
}

export default HealthIndicator