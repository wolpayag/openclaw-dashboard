import { useState, useEffect } from 'react'
import { 
  Calendar, 
  Clock, 
  Play, 
  Pause, 
  Trash2, 
  Plus,
  CheckCircle2,
  XCircle,
  Bell,
  Loader2,
  RotateCw
} from 'lucide-react'
import { api } from '../utils/api'
import { formatDistanceToNow, format } from 'date-fns'

function ScheduledTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [runningTaskId, setRunningTaskId] = useState(null)
  const [notification, setNotification] = useState(null)
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    type: 'system_status',
    schedule: { type: 'daily', time: '08:00' },
    model: 'kimi-coding/k2p5',
    apiKey: '',
    enabled: true
  })
  const [availableModels, setAvailableModels] = useState([
    { id: 'kimi-coding/k2p5', name: 'Kimi K2.5', type: 'cloud', description: 'High quality, API cost' }
  ])
  const [editingTask, setEditingTask] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    loadTasks()
    loadAvailableModels()
    const interval = setInterval(loadTasks, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const loadAvailableModels = async () => {
    try {
      const data = await api.get('/models')
      if (data.models && data.models.length > 0) {
        setAvailableModels(data.models)
      }
    } catch (error) {
      console.error('Failed to load models:', error)
    }
  }

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const loadTasks = async () => {
    try {
      const data = await api.get('/scheduled-tasks')
      setTasks(data.tasks)
    } catch (error) {
      console.error('Failed to load scheduled tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTask = async (id, enabled) => {
    try {
      await api.patch(`/scheduled-tasks/${id}`, { enabled: !enabled })
      loadTasks()
    } catch (error) {
      console.error('Failed to toggle task:', error)
    }
  }

  const deleteTask = async (id) => {
    if (!confirm('Are you sure you want to delete this task?')) return
    try {
      await api.delete(`/scheduled-tasks/${id}`)
      loadTasks()
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  const runTaskNow = async (id, taskName) => {
    setRunningTaskId(id)
    try {
      await api.post(`/scheduled-tasks/${id}/run`)
      setNotification({ 
        type: 'success', 
        message: `Task "${taskName}" executed successfully!` 
      })
      loadTasks()
    } catch (error) {
      console.error('Failed to run task:', error)
      setNotification({ 
        type: 'error', 
        message: `Failed to run "${taskName}"` 
      })
    } finally {
      setRunningTaskId(null)
    }
  }

  const createTask = async (e) => {
    e.preventDefault()
    try {
      // Build action based on task type
      let action = { type: newTask.type }
      
      if (newTask.type === 'weather' && newTask.action?.location) {
        action.location = newTask.action.location
      }
      
      if (newTask.type === 'telegram_message' && newTask.action?.message) {
        action.message = newTask.action.message
      }
      
      if (newTask.type === 'ai_prompt') {
        if (newTask.action?.prompt) {
          action.prompt = newTask.action.prompt
        }
        if (newTask.action?.context) {
          action.context = newTask.action.context
        }
      }
      
      const taskData = {
        name: newTask.name,
        description: newTask.description,
        type: newTask.type,
        schedule: newTask.schedule,
        model: newTask.model,
        apiKey: newTask.apiKey || null,
        enabled: newTask.enabled,
        action: action
      }
      await api.post('/scheduled-tasks', taskData)
      setShowAddModal(false)
      setNewTask({
        name: '',
        description: '',
        type: 'system_status',
        schedule: { type: 'daily', time: '08:00' },
        model: 'kimi-coding/k2p5',
        apiKey: '',
        enabled: true
      })
      loadTasks()
      setNotification({ 
        type: 'success', 
        message: 'Task created successfully!' 
      })
    } catch (error) {
      console.error('Failed to create task:', error)
      setNotification({ 
        type: 'error', 
        message: 'Failed to create task' 
      })
    }
  }

  const openEditModal = (task) => {
    setEditingTask(task)
    setNewTask({
      name: task.name,
      description: task.description || '',
      type: task.type,
      schedule: task.schedule,
      model: task.model,
      apiKey: task.api_key || '',
      enabled: task.enabled,
      action: task.action || {}
    })
    setShowEditModal(true)
  }

  const updateTask = async (e) => {
    e.preventDefault()
    if (!editingTask) return
    
    try {
      let action = { type: newTask.type }
      
      if (newTask.type === 'weather' && newTask.action?.location) {
        action.location = newTask.action.location
      }
      
      if (newTask.type === 'telegram_message' && newTask.action?.message) {
        action.message = newTask.action.message
      }
      
      if (newTask.type === 'ai_prompt') {
        if (newTask.action?.prompt) action.prompt = newTask.action.prompt
        if (newTask.action?.context) action.context = newTask.action.context
      }
      
      const taskData = {
        name: newTask.name,
        description: newTask.description,
        type: newTask.type,
        schedule: newTask.schedule,
        model: newTask.model,
        apiKey: newTask.apiKey || null,
        enabled: newTask.enabled,
        action: action
      }
      
      await api.patch(`/scheduled-tasks/${editingTask.id}`, taskData)
      setShowEditModal(false)
      setEditingTask(null)
      loadTasks()
      setNotification({ 
        type: 'success', 
        message: 'Task updated successfully!' 
      })
    } catch (error) {
      console.error('Failed to update task:', error)
      setNotification({ 
        type: 'error', 
        message: 'Failed to update task' 
      })
    }
  }

  const getScheduleLabel = (schedule) => {
    if (schedule.type === 'daily') {
      return `Daily at ${schedule.time}`
    }
    if (schedule.type === 'interval') {
      return `Every ${schedule.interval} minutes`
    }
    if (schedule.type === 'cron') {
      return `Custom: ${schedule.expression}`
    }
    return 'Unknown'
  }

  const getStatusIcon = (task) => {
    if (!task.enabled) return <Pause className="w-4 h-4 text-gray-400" />
    if (task.lastError) return <XCircle className="w-4 h-4 text-red-500" />
    return <CheckCircle2 className="w-4 h-4 text-green-500" />
  }

  return (
    <div className="space-y-4 relative">
      {/* Notification Toast - Fixed position at top */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg animate-fade-in ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            {notification.message}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-[var(--text-primary)]" />
          <h3 className="font-semibold text-[var(--text-primary)]">Scheduled Tasks</h3>
          <span className="px-2 py-0.5 bg-primary-500/10 text-primary-500 rounded-full text-xs">
            {tasks.filter(t => t.enabled).length} active
          </span>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4 text-[var(--text-secondary)]">Loading...</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-6 text-[var(--text-secondary)]">
          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No scheduled tasks</p>
          <p className="text-xs mt-1">Create one to get started</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {tasks.map(task => (
            <div 
              key={task.id} 
              className={`p-3 rounded-lg border ${
                task.enabled 
                  ? 'bg-[var(--bg-secondary)] border-[var(--border-color)]' 
                  : 'bg-gray-100/50 border-gray-200 opacity-60'
              } ${runningTaskId === task.id ? 'ring-2 ring-primary-500/50' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(task)}
                    <p className="font-medium text-[var(--text-primary)] truncate">{task.name}</p>
                    {runningTaskId === task.id && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-500 animate-pulse">
                        Running...
                      </span>
                    )}
                  </div>
                  
                  {task.description && (
                    <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">{task.description}</p>
                  )}
                  
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                      <Clock className="w-3 h-3" />
                      {getScheduleLabel(task.schedule)}
                    </span>
                    
                    {task.run_count > 0 && (
                      <span className="text-[var(--text-secondary)]">
                        Run {task.run_count} times
                      </span>
                    )}
                    {task.lastRunAt && (
                      <span className="text-green-600">
                        Last: {formatDistanceToNow(new Date(task.lastRunAt), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  
                  {task.nextRunAt && (
                    <div className="mt-2 text-xs">
                      <span className="text-[var(--text-secondary)]">Next: </span>
                      <span className="text-primary-500 font-medium">
                        {formatDistanceToNow(new Date(task.nextRunAt), { addSuffix: true })}
                      </span>
                      <span className="text-[var(--text-secondary)] ml-1">
                        ({format(new Date(task.nextRunAt), 'HH:mm')})
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => runTaskNow(task.id, task.name)}
                    disabled={runningTaskId === task.id}
                    className={`p-1.5 rounded transition-colors ${
                      runningTaskId === task.id 
                        ? 'bg-primary-500/10 text-primary-500 cursor-not-allowed' 
                        : 'hover:bg-[var(--bg-primary)] text-[var(--text-secondary)]'
                    }`}
                    title="Run now"
                  >
                    {runningTaskId === task.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => toggleTask(task.id, task.enabled)}
                    className="p-1.5 rounded hover:bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                    title={task.enabled ? 'Disable' : 'Enable'}
                  >
                    {task.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  
                  <button
                    onClick={() => openEditModal(task)}
                    className="p-1.5 rounded hover:bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 rounded hover:bg-red-500/10 text-red-500"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-primary)] rounded-lg p-6 w-full max-w-md max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Add Scheduled Task</h3>
            
            <form onSubmit={createTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Name</label>
                <input
                  type="text"
                  value={newTask.name}
                  onChange={(e) => setNewTask({...newTask, name: e.target.value})}
                  placeholder="e.g., Morning System Report"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Description</label>
                <input
                  type="text"
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  placeholder="What does this task do?"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Task Type</label>
                <select
                  value={newTask.type}
                  onChange={(e) => setNewTask({...newTask, type: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                >
                  <option value="system_status">System Status Report</option>
                  <option value="weather">Weather Report</option>
                  <option value="telegram_message">Custom Telegram Message</option>
                  <option value="ai_prompt">AI Prompt (Ask AI anything)</option>
                </select>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {newTask.type === 'system_status' && 'Sends system overview to Telegram'}
                  {newTask.type === 'weather' && 'Sends daily weather forecast'}
                  {newTask.type === 'telegram_message' && 'Sends a custom message'}
                  {newTask.type === 'ai_prompt' && 'AI answers your prompt and sends the response'}
                </p>
              </div>

              {newTask.type === 'weather' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Location</label>
                  <input
                    type="text"
                    value={newTask.action?.location || 'Vienna'}
                    onChange={(e) => setNewTask({
                      ...newTask, 
                      action: { ...newTask.action, location: e.target.value }
                    })}
                    placeholder="e.g., Vienna, London, New York"
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                  />
                </div>
              )}

              {newTask.type === 'telegram_message' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Message</label>
                  <textarea
                    value={newTask.action?.message || ''}
                    onChange={(e) => setNewTask({
                      ...newTask, 
                      action: { ...newTask.action, message: e.target.value }
                    })}
                    placeholder="Enter the message to send..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Schedule Type</label>
                <select
                  value={newTask.schedule.type}
                  onChange={(e) => setNewTask({
                    ...newTask, 
                    schedule: { ...newTask.schedule, type: e.target.value }
                  })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                >
                  <option value="daily">Daily at specific time</option>
                  <option value="interval">Every X minutes</option>
                </select>
              </div>
              
              {newTask.schedule.type === 'daily' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Time</label>
                  <input
                    type="time"
                    value={newTask.schedule.time}
                    onChange={(e) => setNewTask({
                      ...newTask, 
                      schedule: { ...newTask.schedule, time: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                  />
                </div>
              )}
              
              {newTask.schedule.type === 'interval' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Interval (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={newTask.schedule.interval || 30}
                    onChange={(e) => setNewTask({
                      ...newTask, 
                      schedule: { ...newTask.schedule, interval: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Model (for AI tasks)</label>
                <select
                  value={newTask.model || 'kimi-coding/k2p5'}
                  onChange={(e) => setNewTask({...newTask, model: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                >
                  {availableModels.map(model => (
                    <option 
                      key={model.id} 
                      value={model.id}
                      disabled={model.disabled}
                      style={model.type === 'header' ? {fontWeight: 'bold', backgroundColor: 'var(--bg-secondary)'} : {}}
                    >
                      {model.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {availableModels.find(m => m.id === newTask.model)?.description || 'Select a model'}
                </p>
              </div>

              {/* Show API key field only for custom models */}
              {newTask.model?.startsWith('custom-') && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">API Key *</label>
                  <input
                    type="password"
                    value={newTask.apiKey || ''}
                    onChange={(e) => setNewTask({...newTask, apiKey: e.target.value})}
                    placeholder="Enter your API key..."
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                    required
                  />
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Your API key is stored securely with this task
                  </p>
                </div>
              )}

              {newTask.type === 'ai_prompt' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">AI Prompt *</label>
                    <textarea
                      value={newTask.action?.prompt || ''}
                      onChange={(e) => setNewTask({
                        ...newTask, 
                        action: { ...newTask.action, prompt: e.target.value }
                      })}
                      placeholder="Enter a prompt for the AI to answer... (e.g., 'What are 3 productivity tips for today?')"
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                      required={newTask.type === 'ai_prompt'}
                    />
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      The AI will answer this prompt and send the response to Telegram
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Context (optional)</label>
                    <input
                      type="text"
                      value={newTask.action?.context || ''}
                      onChange={(e) => setNewTask({
                        ...newTask, 
                        action: { ...newTask.action, context: e.target.value }
                      })}
                      placeholder="Additional context for the AI..."
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                    />
                  </div>
                </>
              )}
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={newTask.enabled}
                  onChange={(e) => setNewTask({...newTask, enabled: e.target.checked})}
                  className="rounded border-[var(--border-color)]"
                />
                <label htmlFor="enabled" className="text-sm text-[var(--text-primary)]">Enable immediately</label>
              </div>
              
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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

      {/* Edit Task Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-primary)] rounded-lg p-6 w-full max-w-md max-h-[85vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Edit Scheduled Task</h3>
            
            <form onSubmit={updateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Name</label>
                <input
                  type="text"
                  value={newTask.name}
                  onChange={(e) => setNewTask({...newTask, name: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Description</label>
                <input
                  type="text"
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Task Type</label>
                <select
                  value={newTask.type}
                  onChange={(e) => setNewTask({...newTask, type: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                >
                  <option value="system_status">System Status Report</option>
                  <option value="weather">Weather Report</option>
                  <option value="telegram_message">Custom Telegram Message</option>
                  <option value="ai_prompt">AI Prompt (Ask AI anything)</option>
                </select>
              </div>

              {newTask.type === 'weather' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Location</label>
                  <input
                    type="text"
                    value={newTask.action?.location || 'Vienna'}
                    onChange={(e) => setNewTask({
                      ...newTask, 
                      action: { ...newTask.action, location: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                  />
                </div>
              )}

              {newTask.type === 'telegram_message' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Message</label>
                  <textarea
                    value={newTask.action?.message || ''}
                    onChange={(e) => setNewTask({
                      ...newTask, 
                      action: { ...newTask.action, message: e.target.value }
                    })}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                  />
                </div>
              )}

              {newTask.type === 'ai_prompt' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">AI Prompt *</label>
                    <textarea
                      value={newTask.action?.prompt || ''}
                      onChange={(e) => setNewTask({
                        ...newTask, 
                        action: { ...newTask.action, prompt: e.target.value }
                      })}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Context (optional)</label>
                    <input
                      type="text"
                      value={newTask.action?.context || ''}
                      onChange={(e) => setNewTask({
                        ...newTask, 
                        action: { ...newTask.action, context: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Schedule Type</label>
                <select
                  value={newTask.schedule.type}
                  onChange={(e) => setNewTask({
                    ...newTask, 
                    schedule: { ...newTask.schedule, type: e.target.value }
                  })}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                >
                  <option value="daily">Daily at specific time</option>
                  <option value="interval">Every X minutes</option>
                </select>
              </div>
              
              {newTask.schedule.type === 'daily' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Time</label>
                  <input
                    type="time"
                    value={newTask.schedule.time}
                    onChange={(e) => setNewTask({
                      ...newTask, 
                      schedule: { ...newTask.schedule, time: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                  />
                </div>
              )}
              
              {newTask.schedule.type === 'interval' && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Interval (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={newTask.schedule.interval || 30}
                    onChange={(e) => setNewTask({
                      ...newTask, 
                      schedule: { ...newTask.schedule, interval: parseInt(e.target.value) }
                    })}
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Model (for AI tasks)</label>
                <select
                  value={newTask.model || 'kimi-coding/k2p5'}
                  onChange={(e) => setNewTask({...newTask, model: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                >
                  {availableModels.map(model => (
                    <option 
                      key={model.id} 
                      value={model.id}
                      disabled={model.disabled}
                      style={model.type === 'header' ? {fontWeight: 'bold', backgroundColor: 'var(--bg-secondary)'} : {}}
                    >
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Show API key field only for custom models */}
              {newTask.model?.startsWith('custom-') && (
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">API Key</label>
                  <input
                    type="password"
                    value={newTask.apiKey || ''}
                    onChange={(e) => setNewTask({...newTask, apiKey: e.target.value})}
                    placeholder="Enter your API key..."
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                  />
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Leave blank to keep existing key
                  </p>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled-edit"
                  checked={newTask.enabled}
                  onChange={(e) => setNewTask({...newTask, enabled: e.target.checked})}
                  className="rounded border-[var(--border-color)]"
                />
                <label htmlFor="enabled-edit" className="text-sm text-[var(--text-primary)]">Enabled</label>
              </div>
              
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingTask(null); }}
                  className="flex-1 px-4 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScheduledTasks