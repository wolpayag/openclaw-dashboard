import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  ListTodo, 
  Bot, 
  BarChart3, 
  Brain, 
  Settings,
  Moon,
  Sun,
  Wifi,
  WifiOff,
  BookOpen,
  Terminal,
  Clock
} from 'lucide-react'
import { useThemeStore, useDashboardStore } from '../store/themeStore'

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/tasks', icon: ListTodo, label: 'Tasks' },
  { path: '/agents', icon: Bot, label: 'Agents' },
  { path: '/usage', icon: BarChart3, label: 'Usage' },
  { path: '/models', icon: Brain, label: 'Models' },
  { path: '/memory', icon: BookOpen, label: 'Memory' },
  { path: '/logs', icon: Terminal, label: 'Logs' },
  { path: '/cron-jobs', icon: Clock, label: 'Cron Jobs' },
]

function Layout({ children }) {
  const { isDark, toggleTheme } = useThemeStore()
  const { isConnected } = useDashboardStore()

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <nav className="fixed left-0 top-0 h-full w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-color)]">
        <div className="p-6">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            🦞 OpenClaw
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">Dashboard</p>
        </div>

        <div className="px-4 py-2">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-primary)]">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600">Disconnected</span>
              </>
            )}
          </div>
        </div>

        <ul className="mt-4 px-4 space-y-1">
          {navItems.map(({ path, icon: Icon, label }) => (
            <li key={path}>
              <NavLink
                to={path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-500 text-white'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors flex-1 ${
                  isActive
                    ? 'bg-primary-500 text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
                }`
              }
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </NavLink>

            <button
              onClick={toggleTheme}
              className="p-3 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  )
}

export default Layout