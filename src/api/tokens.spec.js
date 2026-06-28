import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getAccess, getRefresh, setTokens, clearTokens } from './tokens.js'

describe('token helpers', () => {
  beforeEach(() => {
    const store = {}
    vi.stubGlobal('localStorage', {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v) },
      removeItem: (k) => { delete store[k] },
    })
  })
  it('round-trips tokens', () => {
    setTokens({ accessToken: 'a', refreshToken: 'r' })
    expect(getAccess()).toBe('a')
    expect(getRefresh()).toBe('r')
  })
  it('clears tokens', () => {
    setTokens({ accessToken: 'a', refreshToken: 'r' })
    clearTokens()
    expect(getAccess()).toBe(null)
    expect(getRefresh()).toBe(null)
  })
})
