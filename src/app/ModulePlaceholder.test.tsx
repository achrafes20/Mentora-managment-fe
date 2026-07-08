import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ModulePlaceholder } from './ModulePlaceholder'

describe('ModulePlaceholder', () => {
  it('renders the given label', () => {
    render(<ModulePlaceholder label="Employés" />)
    expect(screen.getByText('Employés')).toBeInTheDocument()
  })
})
