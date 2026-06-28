import apiClient from './client.js'
import { API_ENABLED } from './config.js'
import { setTokens, clearTokens } from './tokens.js'

const MOCK_USER = { name: 'Dr. Müge Ateş Tıkız', email: 'dr.muge@onamlarim.com', role: 'DOCTOR' }

export function toEmail(username) {
  return username.includes('@') ? username : `${username}@onamlarim.com`
}

export async function login(username, password) {
  if (!API_ENABLED) return { ...MOCK_USER }
  const { data } = await apiClient.post('/auth/login', { email: toEmail(username), password })
  setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken })
  return me()
}

export async function me() {
  if (!API_ENABLED) return { ...MOCK_USER }
  const { data } = await apiClient.get('/auth/me')
  // Backend /auth/me returns the current user; normalize to { name, email, role }.
  return { name: data.name, email: data.email, role: data.role }
}

export function logout() {
  clearTokens()
}
