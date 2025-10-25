# Sprint Change Proposal — Split GA4 Work from Epic 7 into Epic 8

**Date:** 2025-10-25
**Requested by:** vanTT
**Prepared by:** Winston (Architect)

## Issue Summary
- Need to generalize analytics architecture (Epic 7) as a multi-service abstraction.
- GA4-specific implementation should be isolated to a new epic to reduce coupling and clarify scope.

## Impact Analysis
- Epics: Epic 7 narrowed to analytics abstraction + param extraction; new Epic 8 for GA4.
- Stories moved: 7.2, 7.3, 7.4 → Epic 8 as 8.1, 8.2, 8.3.
- PRD/Architecture alignment: FR2 remains under Epic 7; FR3 (GA4) moved to Epic 8.
- Sprint tracking updated accordingly.

## Recommended Approach
- Keep Epic 7: focus on extraction and multi-service orchestration.
- Create Epic 8: GA4 payload builder, HTTP integration, and redirect flow wiring.

## Detailed Changes
- docs/epics.md:
  - Epic 7: Covers FR2 only; Story Count adjusted to 1 story (7.1).
  - Inserted Epic 8 with 3 stories:
    - 8.1 GA4 Measurement Protocol Payload Builder (from 7.2)
    - 8.2 GA4 Measurement Protocol HTTP Integration (from 7.3)
    - 8.3 Integrated GA4 in Redirect Flow (from 7.4)
- docs/sprint-status.yaml:
  - Removed 7-2/7-3/7-4; added epic-8 and 8-1/8-2/8-3 (all backlog).

## Handoff Plan
- Scope: Moderate (backlog reorganization + documentation updates)
- Owners:
  - PO/SM: Update planning cadence and priorities.
  - Dev: No code changes yet; follow new epic split for future implementation.

## Approval
- Status: Approved by requester (batch mode)

