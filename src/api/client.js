import axios from 'axios'
import { API_BASE_URL } from './config.js'
import { getAccess, getRefresh, setTokens, clearTokens } from './tokens.js'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

let onAuthFailure = () => {}
export function setOnAuthFailure(fn) { onAuthFailure = fn }

apiClient.interceptors.request.use((config) => {
  const token = getAccess()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    // Do not try to refresh the refresh call itself, and only retry once.
    if (status === 401 && original && !original._retry && !original.url?.includes('/auth/refresh')) {
      original._retry = true
      const refreshToken = getRefresh()
      if (!refreshToken) { clearTokens(); onAuthFailure(); return Promise.reject(error) }
      try {
        const { data } = await apiClient.post('/auth/refresh', { refreshToken })
        setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken })
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return apiClient(original)
      } catch (refreshErr) {
        clearTokens()
        onAuthFailure()
        return Promise.reject(refreshErr)
      }
    }
    return Promise.reject(error)
  },
)

export default apiClient
