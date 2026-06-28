// Single source of truth for whether the SPA talks to the real backend.
// VITE_API_URL is set in .env.local for local dev; absent on Vercel (mock mode).
export const API_BASE_URL = import.meta.env.VITE_API_URL || ''
export const API_ENABLED = !!API_BASE_URL
