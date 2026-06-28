import { describe, it, expect } from 'vitest'
import { toFrontendConsent } from './consents.api.js'

describe('toFrontendConsent', () => {
  const patientsById = { p1: 'Ada Lovelace' }
  it('maps backend fields and resolves patientName, lowercasing status', () => {
    const out = toFrontendConsent({
      id: 'c1', patientId: 'p1', procedure: 'Histeroskopi', doctorName: 'Dr. Müge',
      status: 'SIGNED', signatureData: 'data:...', signedAt: '2026-06-28T10:00:00.000Z',
      createdAt: '2026-06-27T08:00:00.000Z', pdfPath: 'storage/consents/c1.pdf',
    }, patientsById)
    expect(out.doctor).toBe('Dr. Müge')
    expect(out.signature).toBe('data:...')
    expect(out.status).toBe('signed')
    expect(out.date).toBe('2026-06-28')
    expect(out.patientName).toBe('Ada Lovelace')
    expect(out.pdfPath).toBe('storage/consents/c1.pdf')
  })
  it('falls back to date=createdAt and patientName=patientId when unsigned/unknown', () => {
    const out = toFrontendConsent({
      id: 'c2', patientId: 'pX', procedure: 'X', doctorName: 'D',
      status: 'PENDING', signatureData: null, signedAt: null,
      createdAt: '2026-06-27T08:00:00.000Z', pdfPath: null,
    }, {})
    expect(out.status).toBe('pending')
    expect(out.date).toBe('2026-06-27')
    expect(out.patientName).toBe('pX')
  })
})
