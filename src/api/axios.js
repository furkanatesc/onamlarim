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

    // Match routes and return mock responses
    if (config.url.includes('/patients')) {
      return {
        data: {
          success: true,
          data: [
            { id: 'P-101', name: 'Ahmet Yılmaz', tcNo: '23485910292', phone: '+90 532 123 45 67', email: 'ahmet.yilmaz@email.com', bloodType: 'A Rh+', lastVisit: '2026-06-10', status: 'Active' },
            { id: 'P-102', name: 'Merve Demir', tcNo: '10984950384', phone: '+90 543 987 65 43', email: 'merve.demir@email.com', bloodType: '0 Rh-', lastVisit: '2026-06-08', status: 'Active' },
            { id: 'P-103', name: 'Caner Özkan', tcNo: '48201938592', phone: '+90 505 456 78 90', email: 'caner.ozkan@email.com', bloodType: 'B Rh+', lastVisit: '2026-06-05', status: 'Completed' },
            { id: 'P-104', name: 'Elif Kaya', tcNo: '59203948591', phone: '+90 555 111 22 33', email: 'elif.kaya@email.com', bloodType: 'AB Rh+', lastVisit: '2026-06-11', status: 'Active' },
            { id: 'P-105', name: 'Mustafa Şahin', tcNo: '30491827463', phone: '+90 533 444 55 66', email: 'mustafa.sahin@email.com', bloodType: '0 Rh+', lastVisit: '2026-05-28', status: 'Inactive' },
          ]
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }
    }

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
