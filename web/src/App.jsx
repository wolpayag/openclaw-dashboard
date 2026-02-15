import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useThemeStore } from './store/themeStore'
import { useSocket } from './hooks/useSocket'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Agents from './pages/Agents'
import Usage from './pages/Usage'
import Models from './pages/Models'
import Settings from './pages/Settings'

function App() {
  const { isDark } = useThemeStore()
  useSocket()

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/usage" element={<Usage />} />
        <Route path="/models" element={<Models />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  )
}

export default App