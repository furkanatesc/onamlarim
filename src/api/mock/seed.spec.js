import { describe, it, expect } from 'vitest'
import { mockPatients, mockConsents } from './seed.js'

describe('mock seed', () => {
  it('returns multi-branch patients in frontend shape', () => {
    const list = mockPatients()
    expect(list.length).toBeGreaterThanOrEqual(5)
    expect(list[0]).toHaveProperty('lastVisit')
    expect(list[0]).toHaveProperty('status')
  })
  it('returns consents in frontend shape with lowercase status', () => {
    const list = mockConsents()
    expect(list.some(c => c.status === 'pending')).toBe(true)
    expect(list.some(c => c.status === 'signed')).toBe(true)
    expect(list[0]).toHaveProperty('patientName')
    expect(list[0]).toHaveProperty('doctor')
  })
  it('returns fresh copies each call', () => {
    expect(mockPatients()).not.toBe(mockPatients())
  })
})
