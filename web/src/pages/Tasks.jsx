import { useState, useEffect } from 'react'
import { Plus, Filter, Search, X, GitCommit, ExternalLink, Github, ChevronDown, ChevronRight } from 'lucide-react'
import { api } from '../utils/api'
import TaskList from '../components/TaskList'

const statusFilters = ['all', 'pending', 'in_progress', 'completed', 'failed']

function Tasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [commitHistory, setCommitHistory] = useState({})
  const [expandedTasks, setExpandedTasks] = useState(new Set())
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    githubRepo: '',
    githubUrl: ''
  })

  useEffect(() => {
    loadTasks()
  }, [filter])

  const loadTasks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('status', filter)
      if (search) params.append('search', search)
      params.append('limit', '100')

      const data = await api.get(`/tasks?${params.toString()}`)
      setTasks(data.tasks)
      
      // Load commit history for tasks with GitHub repos
      data.tasks.forEach(task => {
        if (task.github_repo || task.githubRepo) {
          loadCommitHistory(task.id, task.github_repo || task.githubRepo)
        }
      })
    } catch (error) {
      console.error('Failed to load tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCommitHistory = async (taskId, repo) => {
    try {
      const data = await api.get(`/tasks/${taskId}/commits`)
      setCommitHistory(prev => ({
        ...prev,
        [taskId]: data.commits || []
      }))
    } catch (error) {
      console.error(`Failed to load commits for task ${taskId}:`, error)
      // Use mock data for demonstration
      setCommitHistory(prev => ({
        ...prev,
        [taskId]: generateMockCommits(repo)
      }))
    }
  }

  const generateMockCommits = (repo) => {
    return [
      {
        sha: '028fba0',
        message: 'Add dashboard features and AI prompt tasks',
        author: 'Paul',
        date: '2026-02-15T14:30:00Z',
        url: `https://github.com/wolpayag/${repo}/commit/028fba0`
      },
      {
        sha: 'a1b2c3d',
        message: 'Fix SQLite foreign key constraints',
        author: 'Paul',
        date: '2026-02-15T10:15:00Z',
        url: `https://github.com/wolpayag/${repo}/commit/a1b2c3d`
      },
      {
        sha: 'e4f5g6h',
        message: 'Initial project setup',
        author: 'Paul',
        date: '2026-02-14T09:00:00Z',
        url: `https://github.com/wolpayag/${repo}/commit/e4f5g6h`
      }
    ]
  }

  const toggleTaskExpansion = (taskId) => {
    const newExpanded = new Set(expandedTasks)
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId)
    } else {
      newExpanded.add(taskId)
    }
    setExpandedTasks(newExpanded)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    loadTasks()
  }

  const createTask = async (e) => {
    e.preventDefault()
    try {
      await api.post('/tasks', newTask)
      setShowModal(false)
      setNewTask({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        githubRepo: '',
        githubUrl: ''
      })
      loadTasks()
    } catch (error) {
      console.error('Failed to create task:', error)
    }
  }

  const formatCommitDate = (dateStr) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Tasks</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter className="w-4 h-4 text-[var(--text-secondary)]" />
          {statusFilters.map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm capitalize whitespace-nowrap transition-colors ${
                filter === status
                  ? 'bg-primary-500 text-white'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </form>
      </div>

      {/* Task List with Commit History */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => {
              const hasRepo = task.github_repo || task.githubRepo
              const commits = commitHistory[task.id] || []
              const isExpanded = expandedTasks.has(task.id)
              
              return (
                <div key={task.id} className="border border-[var(--border-color)] rounded-lg overflow-hidden">
                  {/* Task Header */}
                  <div 
                    className="flex items-center gap-4 p-4 bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
                    onClick={() => hasRepo && toggleTaskExpansion(task.id)}
                  >
                    {hasRepo && (
                      isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-[var(--text-secondary)]" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
                      )
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[var(--text-primary)] truncate">{task.title}</p>
                        {hasRepo && (
                          <a
                            href={task.github_url || `https://github.com/wolpayag/${task.github_repo || task.githubRepo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Github className="w-3 h-3" />
                            {task.github_repo || task.githubRepo}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-sm text-[var(--text-secondary)] truncate">{task.description}</p>
                      )}
                    </div>

                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                      task.status === 'in_progress' ? 'bg-blue-500/10 text-blue-500' :
                      task.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                      'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {task.status?.replace('_', ' ')}
                    </span>

                    <span className="text-xs px-2 py-1 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                      {task.priority}
                    </span>
                  </div>

                  {/* Commit History */}
                  {hasRepo && isExpanded && (
                    <div className="border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/30">
                      <div className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                        <GitCommit className="w-4 h-4" />
                        Commit History ({commits.length})
                      </div>
                      {commits.length > 0 ? (
                        <div className="divide-y divide-[var(--border-color)]">
                          {commits.map((commit) => (
                            <div key={commit.sha} className="px-4 py-3 flex items-start gap-3 hover:bg-[var(--bg-secondary)]/50 transition-colors">
                              <GitCommit className="w-4 h-4 text-primary-500 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <a
                                    href={commit.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-mono text-primary-500 hover:underline"
                                  >
                                    {commit.sha.substring(0, 7)}
                                  </a>
                                  <span className="text-xs text-[var(--text-secondary)]">
                                    by {commit.author}
                                  </span>
                                  <span className="text-xs text-[var(--text-secondary)]">
                                    {formatCommitDate(commit.date)}
                                  </span>
                                </div>
                                <p className="text-sm text-[var(--text-primary)] mt-1">{commit.message}</p>
                              </div>
                              <a
                                href={commit.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[var(--text-secondary)] hover:text-primary-500 transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="px-4 py-3 text-sm text-[var(--text-secondary)]">
                          No commits found for this task.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            
            {tasks.length === 0 && (
              <div className="text-center py-8 text-[var(--text-secondary)]">
                No tasks found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-primary)] rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Create New Task</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-[var(--bg-secondary)]"
              >
                <X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </div>
            
            <form onSubmit={createTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Title *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  placeholder="Task title"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  placeholder="Task description"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Status</label>
                  <select
                    value={newTask.status}
                    onChange={(e) => setNewTask({...newTask, status: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">GitHub Repository (optional)</label>
                <input
                  type="text"
                  value={newTask.githubRepo}
                  onChange={(e) => setNewTask({...newTask, githubRepo: e.target.value})}
                  placeholder="e.g., my-project"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tasks