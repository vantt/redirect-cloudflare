# Technical Specification: Google Analytics 4 Integration

Date: 2025-10-26
Author: vanTT
Epic ID: 8
Status: Draft

---

## Overview

Epic 8 triển khai tích hợp Google Analytics 4 (GA4) theo Measurement Protocol, dựa trên tầng trừu tượng analytics đã xây ở Epic 7. Mục tiêu là gửi sự kiện `redirect_click` trước khi trả về 301/302, đảm bảo độ tin cậy (NFR5) nhưng không làm chậm luồng người dùng nhờ timeout và cô lập lỗi.

Thiết kế tuân thủ PRD (FR2, FR3) và ADR-003: gửi trực tiếp GA4 với timeout 2 giây, ghi log cấu trúc, và không để lỗi tracking ảnh hưởng đến kết quả redirect.


## Objectives and Scope

Trong phạm vi (In-scope):
- Xây `buildGA4Payload(params, measurementId)` theo GA4 Measurement Protocol (v2).
- Xây `sendGA4Event(payload, apiSecret, measurementId)` gọi endpoint GA4 với timeout 2s.
- Tích hợp vào luồng `/r`: trích xuất TrackingParams → build payload → gửi GA4 trước redirect.
- Cấu hình ENV: `GA4_MEASUREMENT_ID`, `GA4_API_SECRET` (Wrangler secrets), kiểm thử đơn vị và tích hợp.

Ngoài phạm vi (Out-of-scope):
- GTM server-side; UI quản trị; báo cáo BI.
- Hạ tầng data warehouse/ETL; phân tích nâng cao.


## System Architecture Alignment

- Nền tảng: Cloudflare Workers + Hono (TypeScript), theo kiến trúc hiện có.
- Tuân thủ ADR-003: gửi GA4 trực tiếp, `AbortSignal.timeout(2000)`, log lỗi nhưng không throw ra luồng chính.
- Tích hợp với Epic 7: dùng `TrackingParams`, router analytics, logging có cấu trúc.


## Detailed Design

### Services and Modules

- src/lib/tracking.ts
  - Trách nhiệm: `buildGA4Payload`, `sendGA4Event`, `trackRedirect` (cầu nối từ TrackingParams sang GA4).
  - Đầu vào: `TrackingParams`, `Env` (GA4_MEASUREMENT_ID, GA4_API_SECRET).
  - Đầu ra: Gọi HTTP POST tới GA4 Measurement Protocol (mp/collect) với timeout 2s; log kết quả.

- src/routes/redirect.ts
  - Trách nhiệm: trích `TrackingParams` từ URL đích, gọi `trackRedirect()` trước khi trả redirect.

- src/utils/logger.ts
  - Trách nhiệm: log JSON 1 dòng (event, status, latency_ms, timeout_ms, provider='ga4').


### Data Models and Contracts

- TrackingParams
  - utm_source?, utm_medium?, utm_campaign?, utm_content?, utm_term?, xptdk?, ref?

- GA4 Payload (Measurement Protocol v2) – tối thiểu
  - client_id: string (hash hoặc UUID nhẹ)
  - events: [{ name: 'redirect_click', params: { campaign/source/medium/content/term, xptdk, ref } }]

- Env bindings (Wrangler)
  - GA4_MEASUREMENT_ID: string
  - GA4_API_SECRET: string


### APIs and Interfaces

- function buildGA4Payload(params: TrackingParams, measurementId: string): GA4Payload
- async function sendGA4Event(payload: GA4Payload, apiSecret: string, measurementId: string): Promise<void>
- async function trackRedirect(params: TrackingParams, env: Env): Promise<void>
- route: GET /r?to=... — gọi trackRedirect trước khi trả 301/302


### Workflows and Sequencing

1) Nhận request `/r?to=...` → validate `to`.
2) `extractTrackingParams(to)` → `TrackingParams`.
3) `buildGA4Payload(params, env.GA4_MEASUREMENT_ID)`.
4) `await sendGA4Event(payload, env.GA4_API_SECRET, env.GA4_MEASUREMENT_ID)` với `AbortSignal.timeout(2000)`.
5) Bắt/log lỗi (không throw), trả 301/302.


## Non-Functional Requirements

### Performance

- Timeout chuẩn: 2000ms cho HTTP POST GA4 (AbortSignal.timeout).
- Ảnh hưởng hiệu năng: mục tiêu <100ms trong đường hạnh phúc (không lỗi mạng), không vượt ngân sách sub-5ms cho phần redirect cốt lõi.
- Minimal payload và không dùng thư viện nặng.


### Security

- Bảo mật secret: `GA4_API_SECRET` là Wrangler secret; không commit.
- Không log PII; chỉ log nhãn chiến dịch và trạng thái gửi.
- Validate/sanitize URL đích ở `/r`; tầng GA4 chỉ dùng dữ liệu đã hợp lệ.


### Reliability/Availability

- Luôn `await` gửi GA4 với timeout; lỗi/timeout không chặn redirect.
- Degrade gracefully: thiếu cấu hình/secret → bỏ qua gửi, log cảnh báo.


### Observability

- Log JSON một dòng: event='ga4_send', status, latency_ms, timeout_ms, measurement_id (ẩn phần nhạy cảm).
- Thêm log trước/sau gửi để đo thời gian và bắt lỗi.


## Dependencies and Integrations

- Runtime & Platform
  - Cloudflare Workers (compatibility_date: 2025-10-24)

- Language & Framework
  - TypeScript ^5.9.0; Hono ^4.4.0; Zod ^4.1.0

- Tooling & Tests
  - Wrangler ^3.80.0; Vitest ^4.0.3; Miniflare ^3.20250718.2

- Env & Config
  - GA4_MEASUREMENT_ID (public), GA4_API_SECRET (secret)
  - ANALYTICS_PROVIDERS='ga4' (nếu dùng registry từ Epic 7)

- Integration
  - GA4 Measurement Protocol `https://www.google-analytics.com/mp/collect`


## Acceptance Criteria (Authoritative)

1. GA4 Payload Builder
   - `buildGA4Payload(params, measurementId)` tạo payload hợp lệ (client_id, events[0].name='redirect_click', params ánh xạ từ TrackingParams), bỏ qua trường undefined.

2. GA4 HTTP Integration
   - `sendGA4Event(payload, apiSecret, measurementId)` POST tới mp/collect, header JSON, timeout 2000ms; bắt lỗi/timeout và log.

3. Redirect Wiring
   - `/r` trích `TrackingParams`, build payload, `await sendGA4Event(...)` trước khi trả 301/302; lỗi không chặn redirect; log có cấu trúc.

4. Configuration
   - Đọc `GA4_MEASUREMENT_ID`, `GA4_API_SECRET` từ `c.env`; hướng dẫn thiết lập Wrangler secrets.

5. Tests
   - Unit: payload builder (đủ/trống/custom), HTTP timeout path; Integration (Miniflare): gọi đúng URL+payload.


## Traceability Mapping

| AC | Nguồn | Thành phần | Ý tưởng kiểm thử |
|---|---|---|---|
| 1 | PRD FR3; Arch tracking.ts | lib/tracking.ts | Unit: payload đầy đủ/tối thiểu; client_id dạng chuẩn |
| 2 | ADR-003; Arch GA4 fetch | lib/tracking.ts | Unit: timeout 2s; Integration: fetch URL đúng, header JSON |
| 3 | PRD FR2/FR3 | routes/redirect.ts | Integration: gọi GA4 trước redirect; lỗi không chặn 301/302 |
| 4 | Arch env bindings | wrangler.toml, types/env.ts | Unit: thiếu ENV -> degrade + cảnh báo |
| 5 | PRD NFR5 | test/* | Coverage ≥ 80% cho module tracking |


## Risks, Assumptions, Open Questions

- Risk: Sai cấu hình ENV (measurement_id/api_secret) gây lỗi gửi.
  Mitigation: Kiểm tra cấu hình khi khởi tạo; degrade gracefully; log cảnh báo.
- Risk: Thay đổi spec GA4.
  Mitigation: Đóng gói builder; tách cấu hình; viết test xác thực payload.
- Risk: Timeout/đứt kết nối làm tăng độ trễ.
  Mitigation: Timeout 2s; không retry vô hạn; log để giám sát.
- Assumption: GA4 đủ cho tracking MVP; có thể mở rộng đa-provider qua Epic 7.
- Question: Có cần map thêm custom params (xptdk/ref) theo chiến dịch?


## Test Strategy Summary

- Unit
  - buildGA4Payload: đủ/trống/custom; định dạng client_id.
  - sendGA4Event: header, URL, timeout; bắt lỗi.
- Integration (Miniflare)
  - /r: verify gọi GA4 trước 301/302; lỗi không chặn; log tồn tại.
- Observability
  - Snapshot log JSON một dòng: event, status, latency_ms, timeout_ms.
- Coverage
  - Mục tiêu ≥ 80% cho module tracking.








