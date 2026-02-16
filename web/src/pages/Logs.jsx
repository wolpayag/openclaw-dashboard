import { useEffect, useState, useRef } from 'react';
import { Terminal, RefreshCw, Download, Trash2 } from 'lucide-react';
import { api } from '../utils/api';

function Logs() {
  const [apiLogs, setApiLogs] = useState([]);
  const [webLogs, setWebLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [activeTab, setActiveTab] = useState('api');
  const logsEndRef = useRef(null);

  useEffect(() => {
    loadLogs();
    let interval;
    if (autoRefresh) {
      interval = setInterval(loadLogs, 5000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  useEffect(() => {
    scrollToBottom();
  }, [apiLogs, webLogs, activeTab]);

  const loadLogs = async () => {
    try {
      const response = await api.get('/logs');
      setApiLogs(response.api || []);
      setWebLogs(response.web || []);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const clearLogs = async () => {
    if (!confirm('Are you sure you want to clear logs?')) return;
    try {
      await api.post('/logs/clear');
      loadLogs();
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  };

  const downloadLogs = () => {
    const logs = activeTab === 'api' ? apiLogs : webLogs;
    const content = logs.map(l => `${l.timestamp} [${l.level}] ${l.message}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLogColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'error':
      case 'fatal':
        return 'text-red-500';
      case 'warn':
      case 'warning':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      case 'debug':
        return 'text-gray-500';
      default:
        return 'text-[var(--text-secondary)]';
    }
  };

  const currentLogs = activeTab === 'api' ? apiLogs : webLogs;

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
          <Terminal className="w-6 h-6 text-primary-500" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">System Logs</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
              autoRefresh 
                ? 'bg-primary-500 text-white' 
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
          
          <button
            onClick={downloadLogs}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
          
          <button
            onClick={clearLogs}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-red-500/10 text-red-500 hover:bg-red-500/20"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-[var(--border-color)]">
        <button
          onClick={() => setActiveTab('api')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'api'
              ? 'border-primary-500 text-primary-500'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          API Logs ({apiLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('web')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'web'
              ? 'border-primary-500 text-primary-500'
              : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Web Logs ({webLogs.length})
        </button>
      </div>

      {/* Log display */}
      <div className="card overflow-hidden">
        <div className="bg-[var(--bg-secondary)] p-4 font-mono text-sm h-[600px] overflow-y-auto">
          {currentLogs.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-secondary)]">
              <Terminal className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No logs found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {currentLogs.map((log, index) => (
                <div key={index} className="flex gap-3 hover:bg-[var(--bg-primary)] p-1 rounded">
                  <span className="text-[var(--text-secondary)] whitespace-nowrap">
                    {log.timestamp}
                  </span>
                  <span className={`font-bold whitespace-nowrap ${getLogColor(log.level)}`}>
                    [{log.level?.toUpperCase() || 'INFO'}]
                  </span>
                  <span className="text-[var(--text-primary)] break-all">
                    {log.message}
                  </span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Logs;