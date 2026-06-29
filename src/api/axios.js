import axios from 'axios'

// Centralized Axios instance
const apiClient = axios.create({
  baseURL: 'https://api.onamlarim.com/v1', // Mock production API endpoint
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Request interceptor (e.g. for authorization tokens)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('onamlarim_token') || 'mock-jwt-token-12345'
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor with simulated mock data fallbacks for showcase purposes
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    // If the server doesn't exist (e.g. localhost/mock API), we fallback to local mock responses
    // to keep the frontend prototype fully operational and beautiful.
    const { config } = error
    if (!config) return Promise.reject(error)

    // Simulate network delay for realistic loading animations
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Match routes and return mock responses.
    // NOTE: this instance is MHRS-only — patients/consents/auth go through src/api/client.js.
    if (config.url.includes('/mhrs/sync-status')) {
      return {
        data: {
          status: 'synced',
          lastSyncedAt: new Date().toISOString(),
          activeAppointments: 14
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }
    }

    // Default error fallback
    return Promise.reject(error)
  }
)

export default apiClient
