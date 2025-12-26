import { describe, it, expect } from 'vitest'
import { generateBootstrapHTML } from '../../../src/routes/bootstrap'

describe('generateBootstrapHTML', () => {
  it('should generate HTML with injected fallback URL', () => {
    const fallback = 'https://fallback.com'
    const html = generateBootstrapHTML(fallback)
    
    expect(html).toContain(`window.location.href = '${fallback}'`)
    expect(html).toContain('<!DOCTYPE html>')
  })

  it('should use robust hash extraction logic', () => {
    const html = generateBootstrapHTML('https://example.com')
    
    // Check for the new robust logic
    expect(html).toContain('var hash = window.location.hash;')
    expect(html).toContain('var redirectUrl = hash ? hash.slice(1) : "";')
    
    // Ensure old buggy logic is gone
    expect(html).not.toContain('var path = window.location.href;')
    expect(html).not.toContain('var hashInd = path.indexOf("#");')
  })
})
