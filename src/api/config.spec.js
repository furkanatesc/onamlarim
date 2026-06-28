import { describe, it, expect } from 'vitest'
import { API_ENABLED, API_BASE_URL } from './config.js'

describe('api config', () => {
  it('exposes API_ENABLED as a boolean reflecting VITE_API_URL presence', () => {
    expect(typeof API_ENABLED).toBe('boolean')
    // With no VITE_API_URL set in the unit-test env, the API is disabled (mock mode).
    expect(API_ENABLED).toBe(false)
    expect(API_BASE_URL).toBe('')
  })
})
