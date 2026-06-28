import { describe, it, expect } from 'vitest'
import { toFrontendPatient } from './patients.api.js'

describe('toFrontendPatient', () => {
  it('derives lastVisit from createdAt and defaults status to Active', () => {
    const out = toFrontendPatient({
      id: 'u1', name: 'Ada', tcNo: '12345678901', phone: null, email: null,
      bloodType: 'A Rh+', createdAt: '2026-06-28T09:30:00.000Z',
    })
    expect(out.lastVisit).toBe('2026-06-28')
    expect(out.status).toBe('Active')
    expect(out.name).toBe('Ada')
    expect(out.phone).toBe('')
    expect(out.email).toBe('')
    expect(out.bloodType).toBe('A Rh+')
  })

  it('sets lastVisit to empty string when createdAt is missing', () => {
    const out = toFrontendPatient({ id: 'x', name: 'N', tcNo: '1', bloodType: 'A Rh+' })
    expect(out.lastVisit).toBe('')
  })
})
