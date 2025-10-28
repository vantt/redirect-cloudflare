# Story 8.1: GA4 Measurement Protocol Payload Builder

Status: Ready

## Story

As a developer,
I want to construct valid GA4 Measurement Protocol payloads from tracking parameters,
so that analytics events can be sent to Google Analytics 4 with correct data structure.

## Acceptance Criteria

1. `lib/tracking.ts` exports `buildGA4Payload(params, measurementId)` function
2. Function constructs GA4 Measurement Protocol v2 payload structure with:

## Tasks / Subtasks

- [ ] Implement buildGA4Payload(params, measurementId) (AC:1)
  - [ ] Include client_id and events array per GA4 spec
- [ ] Handle optional/custom params (xptdk, ref) (AC:2)
  - [ ] Omit undefined fields from payload
- [ ] Unit tests for payload builder (AC:3)
  - [ ] Full parameters, minimal parameters, custom parameters

## Dev Notes

- Follow GA4 Measurement Protocol v2 structure
- Client_id generation: hash of timestamp + random (non-PII)
- Validate fields and omit undefined to reduce payload size
- Cite: docs/tech-spec-epic-8.md, docs/architecture.md

### Project Structure Notes

- Alignment with unified project structure (paths, modules, naming)
- Detected conflicts or variances (with rationale)

### References

- Cite all technical details with source paths and sections, e.g. [Source: docs/<file>.md#Section]

## Dev Agent Record

- docs/stories/story-context-8.1.xml

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

1. Plan (`src/lib/tracking.ts`): add GA4 payload types, generate client_id via timestamp+random hash, sanitize params (omit undefined), validate measurementId input, return spec-compliant payload.
2. Tests (`test/unit/lib/tracking.test.ts`): align expectations with new payload shape, cover full/minimal/custom inputs plus undefined pruning.

### Completion Notes List

### File List



