import { TrendingUp, TrendingDown } from 'lucide-react'

function StatCard({ title, value, icon: Icon, trend, trendUp, color = 'primary' }) {
  const colorClasses = {
    primary: 'bg-primary-500/10 text-primary-500',
    green: 'bg-green-500/10 text-green-500',
    blue: 'bg-blue-500/10 text-blue-500',
    yellow: 'bg-yellow-500/10 text-yellow-500',
    red: 'bg-red-500/10 text-red-500',
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[var(--text-secondary)]">{title}</p>
          <p className="text-3xl font-bold text-[var(--text-primary)] mt-1">
            {value.toLocaleString()}
          </p>
          
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              trendUp ? 'text-green-500' : 'text-red-500'
            }`}>
              {trendUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{trend}</span>
            </div>
          )}
        </div>

        <div className={`p-3 rounded-lg ${colorClasses[color] || colorClasses.primary}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  )
}

export default StatCard