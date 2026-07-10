import { describe, expect, it } from 'vitest'
import { modules } from './modules'

describe('modules', () => {
  it('lists the 10 business modules', () => {
    expect(modules).toHaveLength(10)
  })

  it('enables employees now that Départements (T1.B1) is built', () => {
    expect(modules.find((m) => m.key === 'employees')?.enabled).toBe(true)
  })

  it('leaves the rest disabled until their task lands', () => {
    expect(modules.filter((m) => m.key !== 'employees').every((m) => !m.enabled)).toBe(true)
  })
})
