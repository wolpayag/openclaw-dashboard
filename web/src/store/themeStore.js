import { create } from 'zustand'

export const useThemeStore = create((set) => ({
  isDark: localStorage.getItem('theme') === 'dark' || 
          (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches),
  toggleTheme: () => set((state) => {
    const newTheme = !state.isDark
    localStorage.setItem('theme', newTheme ? 'dark' : 'light')
    return { isDark: newTheme }
  }),
}))

export const useDashboardStore = create((set, get) => ({
  stats: null,
  tasks: [],
  agents: [],
  events: [],
  isConnected: false,
  
  setStats: (stats) => set({ stats }),
  setTasks: (tasks) => set({ tasks }),
  setAgents: (agents) => set({ agents }),
  addEvent: (event) => set((state) => ({ 
    events: [event, ...state.events].slice(0, 100) 
  })),
  setConnected: (isConnected) => set({ isConnected }),
  
  updateTask: (task) => set((state) => ({
    tasks: state.tasks.map(t => t.id === task.id ? { ...t, ...task } : t)
  })),
  
  removeTask: (id) => set((state) => ({
    tasks: state.tasks.filter(t => t.id !== id)
  })),
  
  updateAgent: (agent) => set((state) => ({
    agents: state.agents.map(a => a.id === agent.id ? { ...a, ...agent } : a)
  })),
}))