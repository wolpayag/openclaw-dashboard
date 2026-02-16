import { useEffect, useState } from 'react';
import { Clock, Play, Pause, Trash2, Plus, Calendar, RefreshCw } from 'lucide-react';
import { api } from '../utils/api';

function CronJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newJob, setNewJob] = useState({
    name: '',
    schedule: '',
    command: '',
    enabled: true
  });

  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadJobs = async () => {
    try {
      const response = await api.get('/cron/jobs');
      setJobs(response.jobs || []);
    } catch (error) {
      console.error('Failed to load cron jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleJob = async (id, enabled) => {
    try {
      await api.patch(`/cron/jobs/${id}`, { enabled: !enabled });
      loadJobs();
    } catch (error) {
      console.error('Failed to toggle job:', error);
    }
  };

  const deleteJob = async (id) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    try {
      await api.delete(`/cron/jobs/${id}`);
      loadJobs();
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const runJobNow = async (id) => {
    try {
      await api.post(`/cron/jobs/${id}/run`);
      alert('Job triggered successfully');
    } catch (error) {
      console.error('Failed to run job:', error);
      alert('Failed to run job');
    }
  };

  const createJob = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cron/jobs', newJob);
      setShowAddModal(false);
      setNewJob({ name: '', schedule: '', command: '', enabled: true });
      loadJobs();
    } catch (error) {
      console.error('Failed to create job:', error);
    }
  };

  const formatNextRun = (nextRun) => {
    if (!nextRun) return 'Not scheduled';
    const date = new Date(nextRun);
    return date.toLocaleString();
  };

  const getScheduleDescription = (schedule) => {
    if (!schedule) return 'Unknown';
    // Common cron patterns
    if (schedule === '0 * * * *') return 'Every hour';
    if (schedule === '0 0 * * *') return 'Daily at midnight';
    if (schedule === '0 8 * * *') return 'Daily at 8:00 AM';
    if (schedule === '*/30 * * * *') return 'Every 30 minutes';
    if (schedule === '*/5 * * * *') return 'Every 5 minutes';
    return schedule;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-primary-500" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Cron Jobs</h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Job
        </button>
      </div>

      <div className="grid gap-4">
        {jobs.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-secondary)] card">
            <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No cron jobs configured</p>
            <p className="text-sm mt-2">Add a job to schedule automated tasks</p>
          </div>
        ) : (
          jobs.map((job) => (
            <div
              key={job.id}
              className={`card ${!job.enabled ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-[var(--text-primary)]">
                      {job.name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        job.enabled
                          ? 'bg-green-500/10 text-green-500'
                          : 'bg-gray-500/10 text-gray-500'
                      }`}
                    >
                      {job.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <Calendar className="w-4 h-4" />
                      <span>{getScheduleDescription(job.schedule)}</span>
                      <code className="bg-[var(--bg-secondary)] px-2 py-0.5 rounded text-xs">
                        {job.schedule}
                      </code>
                    </div>
                    
                    <div className="text-[var(--text-secondary)]">
                      <span className="font-medium">Command:</span> {job.command}
                    </div>
                    
                    {job.nextRun && (
                      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <RefreshCw className="w-4 h-4" />
                        <span>Next run: {formatNextRun(job.nextRun)}</span>
                      </div>
                    )}
                    
                    {job.lastRun && (
                      <div className="text-xs text-[var(--text-secondary)]">
                        Last run: {formatNextRun(job.lastRun)}
                        {job.lastStatus && (
                          <span
                            className={`ml-2 ${
                              job.lastStatus === 'success'
                                ? 'text-green-500'
                                : 'text-red-500'
                            }`}
                          >
                            ({job.lastStatus})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => runJobNow(job.id)}
                    className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                    title="Run now"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => toggleJob(job.id, job.enabled)}
                    className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                    title={job.enabled ? 'Disable' : 'Enable'}
                  >
                    {job.enabled ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => deleteJob(job.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-red-500"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Job Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-primary)] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Add Cron Job</h3>
            
            <form onSubmit={createJob} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Name</label>
                <input
                  type="text"
                  value={newJob.name}
                  onChange={(e) => setNewJob({ ...newJob, name: e.target.value })}
                  placeholder="e.g., Daily Backup"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Schedule (Cron)</label>
                <input
                  type="text"
                  value={newJob.schedule}
                  onChange={(e) => setNewJob({ ...newJob, schedule: e.target.value })}
                  placeholder="0 */6 * * *"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                  required
                />
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Format: minute hour day month weekday (e.g., 0 8 * * * for daily at 8 AM)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Command</label>
                <input
                  type="text"
                  value={newJob.command}
                  onChange={(e) => setNewJob({ ...newJob, command: e.target.value })}
                  placeholder="/path/to/script.sh"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                  required
                />
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={newJob.enabled}
                  onChange={(e) => setNewJob({ ...newJob, enabled: e.target.checked })}
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
                  Create Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CronJobs;