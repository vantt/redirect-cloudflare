/**
 * GA4 Analytics Module Exports
 *
 * Exports all GA4-related components for easy importing.
 *
 * Part of Epic 8: Google Analytics 4 Integration
 */

export { GA4Provider } from './provider'
export type { GA4Config } from './types'
export { buildGA4Payload, generateGA4ClientId, mapAttributesToGA4Parameters } from './payload-builder'
export type { GA4Payload, GA4Event, GA4StandardParameters } from './types'