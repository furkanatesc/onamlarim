import { describe, it, expect } from 'vitest'
import { toEmail } from './auth.api.js'

describe('toEmail', () => {
  it('appends the domain when no @ is present', () => {
    expect(toEmail('dr.muge')).toBe('dr.muge@onamlarim.com')
  })
  it('leaves a full email untouched', () => {
    expect(toEmail('x@y.com')).toBe('x@y.com')
  })
})
