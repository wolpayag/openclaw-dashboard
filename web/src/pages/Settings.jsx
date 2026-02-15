import { useThemeStore } from '../store/themeStore'
import { 
  Moon, 
  Sun, 
  Bell, 
  Shield, 
  Database, 
  RefreshCw,
  Save
} from 'lucide-react'

function Settings() {
  const { isDark, toggleTheme } = useThemeStore()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appearance */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            {isDark ? <Moon className="w-5 h-5 text-[var(--text-primary)]" /> : <Sun className="w-5 h-5 text-[var(--text-primary)]" />}
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Appearance</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[var(--text-primary)]">Dark Mode</p>
                <p className="text-sm text-[var(--text-secondary)]">Toggle between light and dark theme</p>
              </div>
              
              <button
                onClick={toggleTheme}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  isDark ? 'bg-primary-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                    isDark ? 'translate-x-7' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-[var(--text-primary)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Notifications</h2>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Task Completion', desc: 'Get notified when tasks complete' },
              { label: 'Error Alerts', desc: 'Receive alerts for failed tasks' },
              { label: 'Usage Warnings', desc: 'Alert when approaching usage limits' },
            ].map(({ label, desc }) => (
              <div key={label} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{label}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{desc}</p>
                </div>
                <input 
                  type="checkbox" 
                  defaultChecked 
                  className="w-5 h-5 rounded border-[var(--border-color)] text-primary-500 focus:ring-primary-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* API Configuration */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-[var(--text-primary)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">API Configuration</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                OpenClaw API URL
              </label>
              <input
                type="text"
                defaultValue="http://localhost:8080"
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                Kimi API Key
              </label>
              <input
                type="password"
                placeholder="••••••••••••••••"
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-[var(--text-primary)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Data Management</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[var(--text-primary)]">Data Retention</p>
                <p className="text-sm text-[var(--text-secondary)]">Keep task history for 90 days</p>
              </div>
              <select className="px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]">
                <option>30 days</option>
                <option selected>90 days</option>
                <option>1 year</option>
              </select>
            </div>

            <button className="flex items-center gap-2 px-4 py-2 border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors">
              <RefreshCw className="w-4 h-4" />
              Clear Cache
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button className="flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </div>
  )
}

export default Settings