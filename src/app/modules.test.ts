import { describe, expect, it } from 'vitest'
import { modules } from './modules'

describe('modules', () => {
  it('lists all business modules', () => {
    expect(modules.length).toBeGreaterThanOrEqual(10)
  })

  it('has all modules enabled after mockup alignment', () => {
    expect(modules.every((m) => m.enabled)).toBe(true)
  })

  it('includes core modules', () => {
    expect(modules.find((m) => m.key === 'employees')).toBeDefined()
    expect(modules.find((m) => m.key === 'attendance')).toBeDefined()
    expect(modules.find((m) => m.key === 'dashboard')).toBeDefined()
  })
})
