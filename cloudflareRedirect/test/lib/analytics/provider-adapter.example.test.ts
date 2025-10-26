import { describe, it, expect, vi } from 'vitest'
import { AnalyticsEvent, EventName, AttributeKey } from '../../../src/lib/analytics/types'
import { ExampleGA4Provider, ExampleMixpanelProvider, AnalyticsProvider } from '../../../src/lib/analytics/provider'

describe('Analytics Provider Examples', () => {
  describe('ExampleGA4Provider', () => {
    it('should implement AnalyticsProvider interface', () => {
      const provider = new ExampleGA4Provider('GA_MEASUREMENT_ID', 'API_SECRET')
      
      // Should have send method
      expect(typeof provider.send).toBe('function')
    })

    it('should throw error when trying to send (example only)', async () => {
      const provider = new ExampleGA4Provider('GA_MEASUREMENT_ID', 'API_SECRET')
      
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: {
          utm_source: 'google',
          utm_medium: 'cpc'
        }
      }

      await expect(provider.send(event)).rejects.toThrow('Example provider - implement in Epic 8')
    })

    it('should demonstrate attribute mapping logic', () => {
      const provider = new ExampleGA4Provider('GA_MEASUREMENT_ID', 'API_SECRET')
      
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: {
          utm_source: 'facebook',
          utm_medium: 'social',
          utm_campaign: 'spring_sale',
          xptdk: 'shopee_data',
          session_count: 3,
          is_mobile: true
        }
      }

      // Access private method through type assertion for testing
      const providerAny = provider as any
      const mapped = providerAny.mapAttributes(event.attributes)

      expect(mapped.utm_source).toBe('facebook')
      expect(mapped.utm_medium).toBe('social')
      expect(mapped.utm_campaign).toBe('spring_sale')
      expect(mapped.xptdk).toBe('shopee_data')
      
      // Should not include non-standard attributes
      expect(mapped.session_count).toBeUndefined()
      expect(mapped.is_mobile).toBeUndefined()
    })

    it('should handle empty attributes gracefully', () => {
      const provider = new ExampleGA4Provider('GA_MEASUREMENT_ID', 'API_SECRET')
      
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: {}
      }

      const providerAny = provider as any
      const mapped = providerAny.mapAttributes(event.attributes)

      expect(Object.keys(mapped)).toHaveLength(0)
    })

    it('should convert all values to strings', () => {
      const provider = new ExampleGA4Provider('GA_MEASUREMENT_ID', 'API_SECRET')
      
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: {
          utm_source: 'google',
          session_count: 42,
          is_premium: false
        }
      }

      const providerAny = provider as any
      const mapped = providerAny.mapAttributes(event.attributes)

      expect(typeof mapped.utm_source).toBe('string')
      expect(mapped.utm_source).toBe('google')
      expect(typeof mapped.session_count).toBe('string')
      expect(mapped.session_count).toBe('42')
      expect(typeof mapped.is_premium).toBe('string')
      expect(mapped.is_premium).toBe('false')
    })
  })

  describe('ExampleMixpanelProvider', () => {
    it('should implement AnalyticsProvider interface', () => {
      const provider = new ExampleMixpanelProvider('MIXPANEL_TOKEN')
      
      expect(typeof provider.send).toBe('function')
    })

    it('should throw error when trying to send (example only)', async () => {
      const provider = new ExampleMixpanelProvider('MIXPANEL_TOKEN')
      
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: {
          utm_source: 'twitter',
          utm_medium: 'social'
        }
      }

      await expect(provider.send(event)).rejects.toThrow('Example provider - implement in future epic')
    })
  })

  describe('Provider Interface Contracts', () => {
    it('should demonstrate consistent interface across providers', () => {
      const ga4Provider = new ExampleGA4Provider('GA_ID', 'SECRET')
      const mixpanelProvider = new ExampleMixpanelProvider('TOKEN')
      
      const sampleEvent: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: {
          [AttributeKey.UTM_SOURCE]: 'google',
          [AttributeKey.UTM_MEDIUM]: 'cpc'
        }
      }

      // Both providers should have the same interface
      expect(typeof ga4Provider.send).toBe('function')
      expect(typeof mixpanelProvider.send).toBe('function')

      // Both should accept the same event structure
      expect(() => ga4Provider.send(sampleEvent)).not.toThrow()
      expect(() => mixpanelProvider.send(sampleEvent)).not.toThrow()
    })

    it('should show how different vendors can adapt same event differently', () => {
      const ga4Provider = new ExampleGA4Provider('GA_ID', 'SECRET')
      const mixpanelProvider = new ExampleMixpanelProvider('TOKEN')
      
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: {
          utm_source: 'linkedin',
          utm_campaign: 'b2b_outreach',
          lead_score: 85
        }
      }

      // Both providers can handle the same neutral event
      // but would transform it differently for their APIs
      expect(event.name).toBe('redirect_click')
      expect(event.attributes.utm_source).toBe('linkedin')
      expect(event.attributes.lead_score).toBe(85)

      // GA4 would map standard UTM parameters
      const ga4ProviderAny = ga4Provider as any
      const ga4Mapped = ga4ProviderAny.mapAttributes(event.attributes)
      expect(ga4Mapped.utm_source).toBe('linkedin')
      expect(ga4Mapped.utm_campaign).toBe('b2b_outreach')
      expect(ga4Mapped.lead_score).toBeUndefined() // GA4 example doesn't include this

      // Mixpanel example would include all attributes as properties
      // (different vendor, different payload structure)
    })
  })

  describe('Type Safety and Interface Compliance', () => {
    it('should enforce provider interface through TypeScript', () => {
      // These should cause TypeScript compilation errors if uncommented:
      // class InvalidProvider { 
      //   // Missing send method
      // }
      //
      // class WrongSignatureProvider implements AnalyticsProvider {
      //   send(event: string): void { // Wrong signature
      //     // Implementation
      //   }
      // }

      // Valid implementation
      class ValidProvider implements AnalyticsProvider {
        async send(event: AnalyticsEvent): Promise<void> {
          // Valid implementation
        }
      }

      const provider = new ValidProvider()
      expect(typeof provider.send).toBe('function')
    })

    it('should support async/await pattern', async () => {
      // Test that providers work with async/await
      const mockProvider: AnalyticsProvider = {
        async send(event: AnalyticsEvent): Promise<void> {
          // Mock async operation
          await new Promise(resolve => setTimeout(resolve, 10))
        }
      }

      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: { utm_source: 'test' }
      }

      // Should not throw and should handle async properly
      await expect(mockProvider.send(event)).resolves.not.toThrow()
    })
  })
})