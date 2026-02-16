import { useState, useEffect } from 'react'
import { BookOpen, Calendar, Clock, FileText, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { api } from '../utils/api'
import { format, parseISO } from 'date-fns'

function Memory() {
  const [memoryEntries, setMemoryEntries] = useState({})
  const [loading, setLoading] = useState(true)
  const [expandedDates, setExpandedDates] = useState(new Set())

  useEffect(() => {
    loadMemoryEntries()
  }, [])

  const loadMemoryEntries = async () => {
    try {
      setLoading(true)
      const data = await api.get('/memory')
      
      // Group entries by date
      const grouped = data.entries.reduce((acc, entry) => {
        const date = entry.date
        if (!acc[date]) {
          acc[date] = []
        }
        acc[date].push(entry)
        return acc
      }, {})
      
      setMemoryEntries(grouped)
      
      // Expand the most recent date by default
      const dates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a))
      if (dates.length > 0) {
        setExpandedDates(new Set([dates[0]]))
      }
    } catch (error) {
      console.error('Failed to load memory entries:', error)
      // Fallback: load from local files structure
      loadLocalMemoryFiles()
    } finally {
      setLoading(false)
    }
  }

  const loadLocalMemoryFiles = async () => {
    try {
      // This is a fallback in case the API is not available
      // In a real implementation, the backend would serve these files
      const mockData = {
        '2026-02-15': [
          {
            id: '1',
            date: '2026-02-15',
            time: '14:30',
            content: 'Completed major features for the OpenClaw Dashboard including delete functionality and AI prompt tasks.'
          },
          {
            id: '2',
            date: '2026-02-15',
            time: '16:45',
            content: 'Fixed SQLite foreign key constraint issues with scheduled task logs.'
          }
        ]
      }
      setMemoryEntries(mockData)
    } catch (error) {
      console.error('Failed to load local memory:', error)
    }
  }

  const toggleDate = (date) => {
    const newExpanded = new Set(expandedDates)
    if (newExpanded.has(date)) {
      newExpanded.delete(date)
    } else {
      newExpanded.add(date)
    }
    setExpandedDates(newExpanded)
  }

  const formatDate = (dateStr) => {
    try {
      return format(parseISO(dateStr), 'EEEE, MMMM do, yyyy')
    } catch {
      return dateStr
    }
  }

  const sortedDates = Object.keys(memoryEntries).sort((a, b) => new Date(b) - new Date(a))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-7 h-7 text-primary-500" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Memory Viewer</h1>
        </div>
        <span className="text-sm text-[var(--text-secondary)]">
          {sortedDates.length} day{sortedDates.length !== 1 ? 's' : ''} of memories
        </span>
      </div>

      {/* Memory Entries */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : sortedDates.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-secondary)]">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No memory entries found</p>
            <p className="text-sm mt-2 opacity-70">Memories are stored in /home/paul/.openclaw/workspace/memory/</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDates.map((date) => (
              <div key={date} className="border border-[var(--border-color)] rounded-lg overflow-hidden">
                {/* Date Header */}
                <button
                  onClick={() => toggleDate(date)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-[var(--bg-secondary)] hover:bg-[var(--bg-primary)] transition-colors text-left"
                >
                  {expandedDates.has(date) ? (
                    <ChevronDown className="w-5 h-5 text-[var(--text-secondary)]" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
                  )}
                  <Calendar className="w-5 h-5 text-primary-500" />
                  <span className="font-semibold text-[var(--text-primary)]">{formatDate(date)}</span>
                  <span className="ml-auto text-sm text-[var(--text-secondary)]">
                    {memoryEntries[date].length} entr{memoryEntries[date].length !== 1 ? 'ies' : 'y'}
                  </span>
                </button>

                {/* Entries for this date */}
                {expandedDates.has(date) && (
                  <div className="divide-y divide-[var(--border-color)]">
                    {memoryEntries[date].map((entry) => (
                      <div key={entry.id} className="p-4 bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)]/50 transition-colors">
                        <div className="flex items-start gap-3">
                          <Clock className="w-4 h-4 text-[var(--text-secondary)] mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-primary-500">{entry.time}</span>
                              {entry.type && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                                  {entry.type}
                                </span>
                              )}
                            </div>
                            <p className="text-[var(--text-primary)] whitespace-pre-wrap">{entry.content}</p>
                            {entry.tags && entry.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {entry.tags.map((tag) => (
                                  <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-500">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {!loading && sortedDates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary-500" />
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {Object.values(memoryEntries).reduce((sum, entries) => sum + entries.length, 0)}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">Total Entries</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">{sortedDates.length}</p>
                <p className="text-sm text-[var(--text-secondary)]">Days Recorded</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {sortedDates[0] ? formatDate(sortedDates[0]) : 'N/A'}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">Latest Entry</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Memory
