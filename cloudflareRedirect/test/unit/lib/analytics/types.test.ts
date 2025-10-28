import { describe, it, expect } from 'vitest'
import { AnalyticsEvent, AnalyticsAttributes, EventName, AttributeKey } from '../../../../src/lib/analytics/types'

describe('Analytics Types', () => {
  describe('AnalyticsAttributes', () => {
    it('should accept string values', () => {
      const attributes: AnalyticsAttributes = {
        utm_source: 'google',
        utm_medium: 'cpc'
      }
      expect(attributes.utm_source).toBe('google')
      expect(attributes.utm_medium).toBe('cpc')
    })

    it('should accept number values', () => {
      const attributes: AnalyticsAttributes = {
        session_duration: 1200,
        page_views: 5
      }
      expect(attributes.session_duration).toBe(1200)
      expect(attributes.page_views).toBe(5)
    })

    it('should accept boolean values', () => {
      const attributes: AnalyticsAttributes = {
        is_new_user: true,
        has_purchased: false
      }
      expect(attributes.is_new_user).toBe(true)
      expect(attributes.has_purchased).toBe(false)
    })

    it('should accept mixed value types', () => {
      const attributes: AnalyticsAttributes = {
        utm_source: 'facebook',
        session_count: 3,
        is_premium_user: true
      }
      expect(attributes.utm_source).toBe('facebook')
      expect(attributes.session_count).toBe(3)
      expect(attributes.is_premium_user).toBe(true)
    })
  })

  describe('AnalyticsEvent', () => {
    it('should create event with name and attributes', () => {
      const attributes: AnalyticsAttributes = {
        utm_source: 'google',
        utm_medium: 'cpc',
        session_count: 1
      }
      
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes
      }
      
      expect(event.name).toBe('redirect_click')
      expect(event.attributes.utm_source).toBe('google')
      expect(event.attributes.utm_medium).toBe('cpc')
      expect(event.attributes.session_count).toBe(1)
    })

    it('should create event with empty attributes', () => {
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: {}
      }
      
      expect(event.name).toBe('redirect_click')
      expect(Object.keys(event.attributes)).toHaveLength(0)
    })

    it('should enforce required fields via TypeScript', () => {
      // These should cause TypeScript compilation errors if uncommented:
      // const invalidEvent1: AnalyticsEvent = { name: 'test' } // missing attributes
      // const invalidEvent2: AnalyticsEvent = { attributes: {} } // missing name
      
      // Valid event:
      const validEvent: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: {}
      }
      
      expect(validEvent.name).toBe('redirect_click')
      expect(validEvent.attributes).toEqual({})
    })
  })

  describe('EventName enum', () => {
    it('should contain standard redirect_click event', () => {
      expect(EventName.REDIRECT_CLICK).toBe('redirect_click')
    })

    it('should be usable as event names', () => {
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: { utm_source: 'google' }
      }
      
      expect(event.name).toBe('redirect_click')
    })
  })

  describe('AttributeKey enum', () => {
    it('should contain standard tracking attributes', () => {
      expect(AttributeKey.UTM_SOURCE).toBe('utm_source')
      expect(AttributeKey.UTM_MEDIUM).toBe('utm_medium')
      expect(AttributeKey.UTM_CAMPAIGN).toBe('utm_campaign')
      expect(AttributeKey.UTM_CONTENT).toBe('utm_content')
      expect(AttributeKey.UTM_TERM).toBe('utm_term')
      expect(AttributeKey.XPTDK).toBe('xptdk')
      expect(AttributeKey.REF).toBe('ref')
    })

    it('should be usable as attribute keys', () => {
      const attributes: AnalyticsAttributes = {
        [AttributeKey.UTM_SOURCE]: 'facebook',
        [AttributeKey.UTM_MEDIUM]: 'social',
        [AttributeKey.XPTDK]: 'shopee_tracking'
      }
      
      expect(attributes.utm_source).toBe('facebook')
      expect(attributes.utm_medium).toBe('social')
      expect(attributes.xptdk).toBe('shopee_tracking')
    })
  })

  describe('Type safety and validation', () => {
    it('should maintain type information through transformations', () => {
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: {
          utm_source: 'google',
          session_count: 5,
          is_mobile: true
        }
      }

      // Type information should be preserved
      expect(typeof event.attributes.utm_source).toBe('string')
      expect(typeof event.attributes.session_count).toBe('number')
      expect(typeof event.attributes.is_mobile).toBe('boolean')
    })

    it('should allow additional attributes beyond standard tracking', () => {
      const event: AnalyticsEvent = {
        name: EventName.REDIRECT_CLICK,
        attributes: {
          utm_source: 'email',
          custom_business_metric: 42.5,
          feature_flag_enabled: true,
          user_tier: 'premium'
        }
      }

      expect(event.attributes.custom_business_metric).toBe(42.5)
      expect(event.attributes.feature_flag_enabled).toBe(true)
      expect(event.attributes.user_tier).toBe('premium')
    })
  })
})
