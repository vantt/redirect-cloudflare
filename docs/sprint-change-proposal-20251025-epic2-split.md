# Sprint Change Proposal: Epic 2 Split and Re‑prioritization

**Date:** 2025-10-25
**Project:** cloudflareRedirect
**Trigger:** Split Epic 2 into a minimal tracking placeholder and move full tracking work to a new Epic 7 (P1, after Epic 5).

## 1. Issue Summary

- Current plan places full tracking (Epic 2: Pre‑Redirect Tracking) in early MVP scope (P0), creating schedule pressure.
- Decision: De‑prioritize “real tracking” to a new Epic 7 (P1) and retain only a placeholder in Epic 2 to keep interfaces stable and unblock other work.

## 2. Impact Analysis

- Epic impact:
  - Epic 2 becomes “Tracking Placeholder” with a single, low‑effort story to establish stubs/interfaces and basic toggles; all GA4 integration moves out.
  - New Epic 7 “Full Tracking (GA4)” holds the original Epic 2 stories 2.1–2.4, renumbered to 7.1–7.4.
- Story impact:
  - Rename/move stories from Epic 2 to Epic 7; add one new placeholder story in Epic 2.
- Artifact impact:
  - Update docs/epics.md (sections, priorities, counts).
  - Update docs/sprint-status.yaml keys and statuses to reflect moved stories.
- Technical impact:
  - No functional tracking shipped in MVP P0; only stubs and configuration flags. Full GA4 work moves to P1.

## 3. Recommended Approach

- Direct Adjustment within current plan:
  - Keep Epic 2 in P0 but reduce it to a one‑story placeholder to preserve interfaces.
  - Create Epic 7 in P1 (after Epic 5) containing the original tracking stories.
- Rationale:
  - Protects MVP timeline while maintaining clean upgrade path.
  - Avoids rework: the placeholder stabilizes contracts for later integration.

## 4. Detailed Change Proposals

A) Epics document (docs/epics.md)
- Update Epic 2 heading and description:
  - Title: “Epic 2: Tracking Placeholder (Defer Full GA4 Integration)”
  - Scope: single placeholder story to define stubs, flags, and documentation markers; no GA4 wiring.
- Replace Epic 2 stories with one placeholder:
  - Story 2.1: Tracking Placeholder Stubs and Flags
    - Define no‑op tracker interface and env flag to disable tracking by default
    - Add TODO markers for GA4 payload builder and HTTP client (referenced by Epic 7)
- Add new Epic 7 (P1), placed after Epic 5:
  - Title: “Epic 7: Full Tracking (GA4 Integration)”
  - Stories (moved/renumbered from old Epic 2):
    - Story 7.1: Tracking Parameter Extraction from Destination URLs (was 2.1)
    - Story 7.2: GA4 Measurement Protocol Payload Builder (was 2.2)
    - Story 7.3: GA4 Measurement Protocol HTTP Integration (was 2.3)
    - Story 7.4: Integrated Tracking in Redirect Flow (was 2.4)
- Update Priority Summary:
  - P0 (MVP): Epics 1, 2 (placeholder), 6
  - P1 (Important): Epics 3, 5, 7 (new)
  - P2 (Future): Epic 4
- Update Total Story Count accordingly (+1 placeholder −4 moved = net −3 in P0; +4 in P1)

B) Sprint status (docs/sprint-status.yaml)
- Add keys for Epic 7 and its stories (status: backlog):
  - epic-7
  - 7-1-tracking-parameter-extraction-from-destination-urls
  - 7-2-ga4-measurement-protocol-payload-builder
  - 7-3-ga4-measurement-protocol-http-integration
  - 7-4-integrated-tracking-in-redirect-flow
  - epic-7-retrospective
- Remove/migrate old Epic 2 story keys to Epic 7 equivalents (preserve any advanced status, else backlog):
  - 2-1-tracking-parameter-extraction-from-destination-urls → 7-1-...
  - 2-2-ga4-measurement-protocol-payload-builder → 7-2-...
  - 2-3-ga4-measurement-protocol-http-integration → 7-3-...
  - 2-4-integrated-tracking-in-redirect-flow → 7-4-...
- Replace Epic 2 story list with a single placeholder key:
  - 2-1-tracking-placeholder-stubs-and-flags: backlog

## 5. Implementation Handoff

- Scope: Moderate (backlog reorganization needed)
- Handoff recipients: Scrum Master + Product Owner
- Success criteria:
  - Epics document updated with Epic 7 and revised Epic 2
  - Sprint status updated with all moved/added keys
  - No broken references in docs

## Appendix: Mapping Table

| Old Key (Epic 2) | New Key (Epic 7) |
| --- | --- |
| 2-1-tracking-parameter-extraction-from-destination-urls | 7-1-tracking-parameter-extraction-from-destination-urls |
| 2-2-ga4-measurement-protocol-payload-builder | 7-2-ga4-measurement-protocol-payload-builder |
| 2-3-ga4-measurement-protocol-http-integration | 7-3-ga4-measurement-protocol-http-integration |
| 2-4-integrated-tracking-in-redirect-flow | 7-4-integrated-tracking-in-redirect-flow |

---

Approval: Please confirm to apply the changes above to docs/epics.md and docs/sprint-status.yaml.
