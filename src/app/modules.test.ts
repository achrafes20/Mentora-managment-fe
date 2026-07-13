import { describe, expect, it } from 'vitest'
import { modules } from './modules'

describe('modules', () => {
  it('lists the 10 business modules', () => {
    expect(modules).toHaveLength(10)
  })

  it('has auth, employees, and attendance enabled', () => {
    const enabledModules = modules.filter((m) => m.enabled)
    expect(enabledModules).toHaveLength(3)
    expect(modules.find((m) => m.key === 'auth')?.enabled).toBe(true)
    expect(modules.find((m) => m.key === 'employees')?.enabled).toBe(true)
    expect(modules.find((m) => m.key === 'attendance')?.enabled).toBe(true)
  })

  it('leaves the rest disabled until their task lands', () => {
    expect(
      modules
        .filter((m) => !['auth', 'employees', 'attendance'].includes(m.key))
        .every((m) => !m.enabled),
    ).toBe(true)
  })
})
