import { useEffect, useState } from 'react'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Play, 
  Bot,
  Activity,
  TrendingUp,
  AlertTriangle,
  ListTodo
} from 'lucide-react'
import { useDashboardStore } from '../store/themeStore'
import { api } from '../utils/api'
import StatCard from '../components/StatCard'
import TaskList from '../components/TaskList'
import AgentStatus from '../components/AgentStatus'
import UsageChart from '../components/UsageChart'
import HealthIndicator from '../components/HealthIndicator'
import ScheduledTasks from '../components/ScheduledTasks'

function Dashboard() {
  const { stats, tasks: liveTasks, isConnected } = useDashboardStore()
  const [health, setHealth] = useState(null)
  const [pendingTasks, setPendingTasks] = useState([])
  const [inProgressTasks, setInProgressTasks] = useState([])
  const [finishedTasks, setFinishedTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Update when live tasks change - this handles real-time updates including progress
  useEffect(() => {
    if (liveTasks) {
      categorizeTasks(liveTasks)
    }
  }, [liveTasks])

  const categorizeTasks = (taskList) => {
    const pending = taskList.filter(t => t.status === 'pending')
    const inProgress = taskList.filter(t => t.status === 'in_progress')
    const finished = taskList.filter(t => ['completed', 'failed', 'cancelled'].includes(t.status))
    
    setPendingTasks(pending)
    setInProgressTasks(inProgress)
    setFinishedTasks(finished)
  }

  const loadDashboardData = async () => {
    try {
      const [healthData, tasksData] = await Promise.all([
        api.get('/stats/health'),
        api.get('/tasks?limit=50')
      ])
      setHealth(healthData)
      categorizeTasks(tasksData.tasks)
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
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
          {!isConnected && (
            <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-sm font-medium">
              Disconnected
            </span>
          )}
        </div>
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

      {/* Task Board - 3 Columns */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Task Board</h2>
          <a href="/tasks" className="text-sm text-primary-500 hover:underline">View all tasks</a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pending Column */}
          <div className="bg-[var(--bg-primary)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold text-[var(--text-primary)]">Pending</h3>
              <span className="ml-auto px-2 py-0.5 bg-yellow-500/10 text-yellow-500 rounded-full text-sm">
                {pendingTasks.length}
              </span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pendingTasks.length > 0 ? (
                pendingTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-[var(--text-secondary)] truncate mt-1">{task.description}</p>
                    )}
                    <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${
                      task.priority === 'critical' ? 'bg-red-500/10 text-red-500' :
                      task.priority === 'high' ? 'bg-orange-500/10 text-orange-500' :
                      task.priority === 'medium' ? 'bg-blue-500/10 text-blue-500' :
                      'bg-gray-500/10 text-gray-500'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--text-secondary)] text-center py-4">No pending tasks</p>
              )}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="bg-[var(--bg-primary)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Play className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-[var(--text-primary)]">In Progress</h3>
              <span className="ml-auto px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-full text-sm">
                {inProgressTasks.length}
              </span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {inProgressTasks.length > 0 ? (
                inProgressTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{task.title}</p>
                    <div className="mt-2">
                      <div className="h-1.5 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${task.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-[var(--text-secondary)] mt-1">{task.progress || 0}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--text-secondary)] text-center py-4">No tasks in progress</p>
              )}
            </div>
          </div>

          {/* Finished Column */}
          <div className="bg-[var(--bg-primary)] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-[var(--text-primary)]">Finished</h3>
              <span className="ml-auto px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full text-sm">
                {finishedTasks.length}
              </span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {finishedTasks.length > 0 ? (
                finishedTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
                    <div className="flex items-start gap-2">
                      {task.status === 'completed' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                      ) : task.status === 'failed' ? (
                        <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                      ) : (
                        <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">{task.title}</p>
                        <span className={`text-xs ${
                          task.status === 'completed' ? 'text-green-500' :
                          task.status === 'failed' ? 'text-red-500' :
                          'text-gray-500'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--text-secondary)] text-center py-4">No finished tasks</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid - 4 columns including Scheduled Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Agent Status */}
        <div className="card">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Agents</h2>
          <AgentStatus stats={agentStats} />
        </div>

        {/* Usage Chart */}
        <div className="card">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Today's Usage</h2>
          <UsageChart data={usage.today} />
        </div>

        {/* Scheduled Tasks */}
        <div className="card">
          <ScheduledTasks />
        </div>

        {/* Quick Stats */}
        <div className="card">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Quick Stats</h2>
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
  )
}

export default Dashboard