import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

function UsageChart({ data }) {
  const usageData = [
    { name: 'Input Tokens', value: data?.total_tokens ? data.total_tokens * 0.3 : 3000 },
    { name: 'Output Tokens', value: data?.total_tokens ? data.total_tokens * 0.7 : 7000 },
  ]

  const COLORS = ['#3b82f6', '#10b981']

  return (
    <div className="space-y-4">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={usageData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={5}
              dataKey="value"
            >
              {usageData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--bg-secondary)', 
                border: '1px solid var(--border-color)',
                borderRadius: '8px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2">
        {usageData.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: COLORS[index] }}
              />
              <span className="text-sm text-[var(--text-secondary)]">{item.name}</span>
            </div>
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-[var(--border-color)]">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--text-secondary)]">Total</span>
          <span className="font-semibold text-[var(--text-primary)]">
            {(data?.total_tokens || 10000).toLocaleString()} tokens
          </span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm text-[var(--text-secondary)]">Est. Cost</span>
          <span className="font-semibold text-[var(--text-primary)]">
            ${(data?.total_cost || 0.15).toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default UsageChart