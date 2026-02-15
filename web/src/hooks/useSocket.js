import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { useDashboardStore } from '../store/themeStore'

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3002'

export function useSocket() {
  const { 
    setStats, 
    setTasks, 
    setAgents, 
    addEvent, 
    setConnected,
    updateTask,
    updateAgent 
  } = useDashboardStore()

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      path: '/ws',
      transports: ['websocket'],
      autoConnect: true,
    })

    socket.on('connect', () => {
      console.log('Connected to WebSocket')
      setConnected(true)
      socket.emit('subscribe', 'dashboard')
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket')
      setConnected(false)
    })

    socket.on('dashboard:data', (data) => {
      if (data.stats) setStats(data.stats)
      if (data.recentTasks) setTasks(data.recentTasks)
      if (data.agents) setAgents(data.agents)
    })

    socket.on('stats:update', (stats) => {
      setStats(stats)
    })

    socket.on('task:update', (task) => {
      updateTask(task)
    })

    socket.on('agent:update', (agent) => {
      updateAgent(agent)
    })

    socket.on('alert:warning', (alert) => {
      addEvent({ type: 'warning', ...alert, timestamp: new Date().toISOString() })
    })

    socket.on('alert:critical', (alert) => {
      addEvent({ type: 'critical', ...alert, timestamp: new Date().toISOString() })
    })

    return () => {
      socket.disconnect()
    }
  }, [])
}