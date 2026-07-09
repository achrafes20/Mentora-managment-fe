import { describe, expect, it } from 'vitest'
import { modules } from './modules'

describe('modules', () => {
  it('lists the 10 business modules', () => {
    expect(modules).toHaveLength(10)
  })

  it('has only auth enabled (Phase 1)', () => {
    const enabledModules = modules.filter((m) => m.enabled)
    expect(enabledModules).toHaveLength(1)
    expect(enabledModules[0].key).toBe('auth')
  })
})
