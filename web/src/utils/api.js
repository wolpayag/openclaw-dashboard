import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export const api = {
  async get(endpoint) {
    const response = await axios.get(`${API_URL}/api${endpoint}`)
    return response.data
  },

  async post(endpoint, data) {
    const response = await axios.post(`${API_URL}/api${endpoint}`, data)
    return response.data
  },

  async patch(endpoint, data) {
    const response = await axios.patch(`${API_URL}/api${endpoint}`, data)
    return response.data
  },

  async delete(endpoint) {
    const response = await axios.delete(`${API_URL}/api${endpoint}`)
    return response.data
  }
}