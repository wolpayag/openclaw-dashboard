import { formatDistanceToNow } from 'date-fns'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Play, 
  Pause,
  AlertCircle 
} from 'lucide-react'

const statusIcons = {
  pending: Clock,
  in_progress: Play,
  completed: CheckCircle2,
  failed: XCircle,
  cancelled: Pause,
}

const statusColors = {
  pending: 'text-yellow-500 bg-yellow-500/10',
  in_progress: 'text-blue-500 bg-blue-500/10',
  completed: 'text-green-500 bg-green-500/10',
  failed: 'text-red-500 bg-red-500/10',
  cancelled: 'text-gray-500 bg-gray-500/10',
}

function TaskList({ tasks, compact = false }) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-secondary)]">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No tasks found</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const StatusIcon = statusIcons[task.status] || Clock
        const statusColor = statusColors[task.status] || statusColors.pending

        return (
          <div
            key={task.id}
            className="flex items-center gap-4 p-3 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
          >
            <div className={`p-2 rounded-lg ${statusColor}`}>
              <StatusIcon className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-[var(--text-primary)] truncate">
                {task.title}
              </p>
              {!compact && task.description && (
                <p className="text-sm text-[var(--text-secondary)] truncate">
                  {task.description}
                </p>
              )}
            </div>

            {!compact && (
              <>
                <span className="text-xs px-2 py-1 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                  {task.priority}
                </span>

                {task.progress > 0 && task.progress < 100 && (
                  <div className="w-24">
                    <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 transition-all"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {task.progress}%
                    </span>
                  </div>
                )}
              </>
            )}

            <span className="text-xs text-[var(--text-secondary)]">
              {task.created_at && formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default TaskList