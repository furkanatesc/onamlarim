const ACCESS_KEY = 'onamlarim_access'
const REFRESH_KEY = 'onamlarim_refresh'

export const getAccess = () => localStorage.getItem(ACCESS_KEY)
export const getRefresh = () => localStorage.getItem(REFRESH_KEY)

export function setTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken)
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}
