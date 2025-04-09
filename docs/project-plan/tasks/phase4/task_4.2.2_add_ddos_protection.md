# docs/project-plan/tasks/phase4/task_4.2.2_add_ddos_protection.md

## Task: 4.2.2 Add DDoS Protection (Cloudflare)

**Description:**
Ensure Cloudflare's standard DDoS protection is enabled for the zone and review its effectiveness. Configure advanced DDoS rules if necessary.

**Source Task:**
docs/project-plan/implementation.md -> Phase 4 -> 4.2 Security Hardening -> Add DDoS protection

**Detailed Specifications:**
- Cloudflare provides automatic L3/L4 DDoS protection by default for traffic proxied through its network.
- L7 DDoS protection is also largely automatic but can be customized.
- Review Cloudflare dashboard (Security -> DDoS) to ensure protection is active.
- Monitor DDoS metrics (attack traffic vs. passed traffic) during normal operation and potential incidents.
- If specific attack patterns emerge targeting the worker, consider configuring custom HTTP DDoS Managed Rulesets or Advanced Rate Limiting rules (potentially overlapping with Task 4.2.1).

**TDD Approach:**
- Not applicable (Infrastructure configuration/monitoring).

**Implementation Steps:**
1.  Verify the worker domain is proxied through Cloudflare (Orange Cloud in DNS settings).
2.  Navigate to Cloudflare Dashboard -> Security -> DDoS. Review the overview and reported attacks.
3.  (Optional) Explore HTTP DDoS rule settings. Understand the default sensitivity ("High") and ruleset ("Cloudflare Managed Ruleset"). Keep defaults unless specific issues arise.
4.  Establish a procedure for monitoring DDoS activity via the dashboard, especially if alerts (Task 3.4.2) indicate high error rates or 429s that might correlate with an attack.

**Technical References:**
- Cloudflare DDoS Protection: [https://www.cloudflare.com/ddos/](https://www.cloudflare.com/ddos/)
- Cloudflare HTTP DDoS Attack Protection: [https://developers.cloudflare.com/ddos-protection/http-ddos-attack-protection/](https://developers.cloudflare.com/ddos-protection/http-ddos-attack-protection/)

**Dependencies:**
- Worker deployed to a Cloudflare zone with proxy enabled.

**Acceptance Criteria:**
- Cloudflare DDoS protection status is confirmed as active.
- Basic understanding of monitoring DDoS activity in the Cloudflare dashboard is established.
- Default HTTP DDoS protection is deemed sufficient unless specific attack patterns necessitate custom rules later. 