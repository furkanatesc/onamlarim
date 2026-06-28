import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './useAuthStore.js'

describe('useAuthStore (mock mode)', () => {
  beforeEach(() => setActivePinia(createPinia()))
  it('signIn populates the user in mock mode', async () => {
    const store = useAuthStore()
    const user = await store.signIn('dr.muge', '123456')
    expect(user.email).toBe('dr.muge@onamlarim.com')
    expect(store.user?.role).toBe('DOCTOR')
  })
})
