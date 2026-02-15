import { useEffect, useState } from 'react'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Play, 
  Bot,
  Activity,
  TrendingUp,
  AlertTriangle
} from 'lucide-react'
import { useDashboardStore } from '../store/themeStore'
import { api } from '../utils/api'
import StatCard from '../components/StatCard'
import TaskList from '../components/TaskList'
import AgentStatus from '../components/AgentStatus'
import UsageChart from '../components/UsageChart'
import HealthIndicator from '../components/HealthIndicator'

function Dashboard() {
  const { stats } = useDashboardStore()
  const [health, setHealth] = useState(null)
  const [recentTasks, setRecentTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [healthData, tasksData] = await Promise.all([
        api.get('/stats/health'),
        api.get('/tasks?limit=10')
      ])
      setHealth(healthData)
      setRecentTasks(tasksData.tasks)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const taskStats = stats?.tasks || {}
  const agentStats = stats?.agents || {}
  const usage = stats?.usage || {}

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
        {health && <HealthIndicator health={health} />}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tasks"
          value={taskStats.total || 0}
          icon={Activity}
          trend="+12%"
          trendUp={true}
        />
        <StatCard
          title="Pending"
          value={taskStats.pending || 0}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="In Progress"
          value={taskStats.in_progress || 0}
          icon={Play}
          color="blue"
        />
        <StatCard
          title="Completed"
          value={taskStats.completed || 0}
          icon={CheckCircle2}
          color="green"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Queue */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Task Queue</h2>
            <a href="/tasks" className="text-sm text-primary-500 hover:underline">View all</a>
          </div>
          <TaskList tasks={recentTasks} compact />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Agent Status */}
          <div className="card">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Agents
            </h2>
            <AgentStatus stats={agentStats} />
          </div>

          {/* Usage Chart */}
          <div className="card">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Today's Usage
            </h2>
            <UsageChart data={usage.today} />
          </div>

          {/* Quick Stats */}
          <div className="card">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Quick Stats
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Failed Tasks</span>
                <span className="flex items-center gap-1 text-red-500">
                  <XCircle className="w-4 h-4" />
                  {taskStats.failed || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Active Agents</span>
                <span className="flex items-center gap-1 text-[var(--text-primary)]">
                  <Bot className="w-4 h-4" />
                  {agentStats.active || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Avg Duration</span>
                <span className="text-[var(--text-primary)]">
                  {Math.round(taskStats.avg_duration_minutes || 0)}m
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Health Score</span>
                <span className={`font-medium ${
                  (health?.score || 100) > 80 ? 'text-green-500' : 
                  (health?.score || 100) > 50 ? 'text-yellow-500' : 'text-red-500'
                }`}>
                  {health?.score || 100}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard