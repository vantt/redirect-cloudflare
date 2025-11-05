# Technical Specification: Analytics Abstraction (Multi-Service)

Date: 2025-10-26
Author: vanTT
Epic ID: 7
Status: Draft

---

## Overview

Mục tiêu của Epic 7 là trừu tượng hóa tầng theo dõi phân tích (analytics) thành một giao diện nhà cung cấp thống nhất, giúp hệ thống gửi sự kiện theo dõi trước khi chuyển hướng mà không phụ thuộc vào một dịch vụ cụ thể. Thiết kế này bảo đảm khả năng cắm/rút (pluggable), cô lập lỗi theo nhà cung cấp, và ràng buộc thời gian chờ để không ảnh hưởng đến hiệu năng chuyển hướng biên (sub-5ms) được nêu trong PRD.

Epic này liên kết trực tiếp với các yêu cầu PRD: FR2 (Theo dõi trước khi chuyển hướng), FR3 (Tích hợp GA4), và NFR5 (Độ tin cậy). Đồng thời, nó chuẩn bị nền tảng để Epic 8 triển khai tích hợp GA4 cụ thể mà không thay đổi luồng xử lý cốt lõi.


## Objectives and Scope

Trong phạm vi (In-scope):
- Định nghĩa `TrackingParams` và cơ chế trích xuất tham số theo dõi từ URL đích.
- Thiết kế và chuẩn hóa giao diện `AnalyticsProvider` (gởi sự kiện, cấu hình thời gian chờ, xử lý lỗi không phá vỡ luồng).
- Tầng điều phối provider: cho phép 0..n provider hoạt động song song, tổng hợp kết quả và cô lập lỗi.
- Hook tích hợp vào luồng `/r` trước khi trả về phản hồi chuyển hướng.

Ngoài phạm vi (Out-of-scope):
- Cụ thể GA4 Measurement Protocol (thuộc Epic 8).
- GTM server-side, Data Layer chi tiết.
- UI quản trị hoặc báo cáo BI.


## System Architecture Alignment

Thiết kế bám sát kiến trúc đã chấp thuận: Cloudflare Workers + Hono, tuân thủ ADR-003 (GA4 trực tiếp, timeout 2s) và các quyết định về logging/cấu hình. Thành phần chính:
- `lib/tracking.ts`: định nghĩa `TrackingParams`, `AnalyticsProvider`, điều phối gọi nhiều provider với `AbortSignal.timeout`.
- `routes/redirect.ts`: chèn điểm gọi theo dõi trước khi trả về 301/302, không để lỗi tracking chặn chuyển hướng.
- Logging có cấu trúc để quan sát trạng thái gửi sự kiện (thành công/thất bại) theo từng provider.


## Detailed Design

### Services and Modules

- src/lib/analytics/types.ts
  - Trách nhiệm: Khai báo `AnalyticsAttributes`, `AnalyticsEvent` và các kiểu phụ trợ.
  - Đầu vào: Thuộc tính đã chuẩn hóa từ `TrackingParams`.
  - Đầu ra: Đối tượng sự kiện trung lập cho các provider.

- src/lib/analytics/provider.ts
  - Trách nhiệm: Định nghĩa `AnalyticsProvider` với hàm `send(event): Promise<void>`; quy ước lỗi/timeout.
  - Đầu vào: `AnalyticsEvent`.
  - Đầu ra: Lời hứa hoàn tất hoặc ghi log lỗi (không ném lỗi lên luồng chính).

- src/lib/analytics/router.ts
  - Trách nhiệm: `routeAnalyticsEvent(event, providers)` — fan-out đồng thời tới nhiều provider; cô lập lỗi từng provider; áp dụng timeout (`AbortSignal.timeout`).
  - Đầu vào: `AnalyticsEvent`, danh sách `AnalyticsProvider`.
  - Đầu ra: Hoàn tất sau khi tất cả lời hứa được chờ với chính sách timeout; log cấu trúc.

- src/lib/analytics/registry.ts
  - Trách nhiệm: `loadProviders(env)` dựa trên biến môi trường `ANALYTICS_PROVIDERS` (vd: `ga4,mixpanel`).
  - Đầu vào: `Env` (Wrangler bindings).
  - Đầu ra: Danh sách `AnalyticsProvider` đã khởi tạo.

- src/lib/tracking.ts
  - Trách nhiệm: Trích xuất `TrackingParams` từ URL đích; chuyển đổi sang `AnalyticsEvent`; cầu nối tới router và (ở Epic 8) xây/xử lý GA4 payload.
  - Đầu vào: URL đích, `Env`.
  - Đầu ra: Promise hoàn tất gửi sự kiện; không chặn chuyển hướng.

- src/routes/redirect.ts
  - Trách nhiệm: Điểm tích hợp trong luồng `/r` trước khi trả về 301/302; luôn ưu tiên trả phản hồi nhanh, không để tracking làm hỏng luồng.
  - Đầu vào: Request, `Env`.
  - Đầu ra: Phản hồi redirect; log sự kiện.


### Data Models and Contracts

- TrackingParams (trích từ PRD FR2/FR3)
  - utm_source?: string
  - utm_medium?: string
  - utm_campaign?: string
  - utm_content?: string
  - utm_term?: string
  - xptdk?: string
  - ref?: string

- AnalyticsAttributes
  - Kiểu: Record<string, string | number | boolean>

- AnalyticsEvent
  - name: 'redirect_click'
  - attributes: AnalyticsAttributes (được ánh xạ từ TrackingParams + metadata: timestamp, path, userAgent nếu sẵn có)

- ProviderConfig (tùy chọn)
  - providers: string[] (nguồn: ENV `ANALYTICS_PROVIDERS`)
  - timeoutMs: number (mặc định 2000)


### APIs and Interfaces

- interface AnalyticsProvider { send(event: AnalyticsEvent, options?: { signal?: AbortSignal }): Promise<void> }
- function routeAnalyticsEvent(event: AnalyticsEvent, providers: AnalyticsProvider[], options?: { timeoutMs?: number }): Promise<void>
- function loadProviders(env: Env): AnalyticsProvider[]
- function extractTrackingParams(url: URL): TrackingParams
- function toAnalyticsEvent(params: TrackingParams): AnalyticsEvent
- function trackRedirect(params: TrackingParams, env: Env): Promise<void>

Ràng buộc môi trường (Wrangler):
- ANALYTICS_PROVIDERS: string (vd: 'ga4')
- GA4_MEASUREMENT_ID, GA4_API_SECRET (dùng ở Epic 8)


### Workflows and Sequencing

1) Người dùng gọi `/r?to=<destination>`
2) Validate `to` và giải mã URL đích
3) `extractTrackingParams(destination)` -> `TrackingParams`
4) Xây `AnalyticsEvent` từ `TrackingParams`
5) `loadProviders(c.env)` -> danh sách provider
6) `routeAnalyticsEvent(event, providers, { timeoutMs: 2000 })`
   - Gửi đồng thời tới từng provider (mỗi lệnh gọi có AbortSignal.timeout)
   - Bắt và log lỗi từng provider; không ném lỗi lên luồng chính
7) Trả về 301/302 với header phù hợp (không chặn bởi tracking)


## Non-Functional Requirements

### Performance

- Mục tiêu end-to-end: sub-5ms cho đường đi redirect (không tính thời gian mạng tới GA4).
- Tracking trước redirect phải KHÔNG chặn luồng phản hồi:
  a) Gọi gửi sự kiện được bảo vệ bởi `AbortSignal.timeout(2000)` theo ADR-003.
  b) Lỗi/timeout provider không ảnh hưởng tới 301/302.
- Fan-out nhiều provider chạy đồng thời; tổng thời gian bị khống chế bởi timeout nhỏ nhất cấu hình (mặc định 2000ms) nhưng redirect không chờ nếu áp dụng chế độ fire-and-forget cho provider không bắt buộc.
- Kích thước bundle giữ tối thiểu; không thêm thư viện nặng cho tầng abstraction.


### Security

- Không thu thập PII; chỉ nhận các tham số chiến dịch (UTM/xptdk/ref) theo PRD.
- Bảo vệ bí mật: `GA4_API_SECRET` là secret Wrangler; không commit vào repo; truy cập qua `c.env` có kiểu.
- Ràng buộc miền đích và kiểm soát open redirect ở tầng `/r`; tầng analytics chỉ dùng dữ liệu đã hợp lệ.
- Ghi log có cấu trúc nhưng loại trừ giá trị nhạy cảm; chỉ log nhãn chiến dịch và mã lỗi/timing.
- Harden fetch: timeout, bắt lỗi, không retry vô hạn; xác thực endpoint theo danh sách cho phép (provider đã biết).


### Reliability/Availability

- Cô lập lỗi theo provider: lỗi một provider không ảnh hưởng provider khác hoặc luồng redirect.
- Chính sách idempotent: gửi một sự kiện/redirect_click theo request; không yêu cầu đảm bảo ít nhất một lần (at-least-once) cho provider bên ngoài.
- Degrade gracefully: khi thiếu cấu hình hoặc secret, tầng analytics tự vô hiệu hoá và log cảnh báo.
- Bảo toàn thứ tự luồng: luôn gọi analytics trước khi trả redirect, nhưng không chặn phản hồi khi provider chậm.


### Observability

- Log có cấu trúc ở các điểm: build sự kiện, dispatch bắt đầu/kết thúc theo provider, lỗi/timeout; trường khuyến nghị: `event`, `provider`, `status`, `latency_ms`, `timeout_ms`, `epic`, `story`, `request_id` (nếu có).
- Mẫu log phù hợp với Cloudflare dashboard (JSON một dòng).
- Thêm hook đếm cơ bản (counter) theo provider và trạng thái để tiện quan sát.
- Hướng dẫn dev: cách bật "debug mode" để hiển thị payload khi ~~`n=1`~~ **`debug=1`** (tham chiếu Epic 5) — chỉ dùng môi trường dev. **[Update 2025-10-28: Legacy `n=` parameter removed in Story 1.10]**


## Dependencies and Integrations

- Runtime & Platform
  - Cloudflare Workers (compatibility_date: 2025-10-24) — wrangler.toml: wrangler.toml:1
  - KV Namespaces: REDIRECT_KV (URL mappings) — wrangler.toml bindings
  - Note: ANALYTICS_KV removed - retry queue deferred to Epic 9; current pipeline is fire-and-forget

- Language & Framework
  - TypeScript ^5.9.0 — package.json: typescript
  - Hono ^4.4.0 — package.json: hono
  - Zod ^4.1.0 + @hono/zod-validator ^0.7.0

- Tooling & Tests
  - Wrangler ^3.80.0 — CLI build/dev/deploy
  - Vitest ^4.0.3 — unit/integration tests (jsdom env)
  - Miniflare ^3.20250718.2 — Workers emulation

- Types & Libraries
  - @cloudflare/workers-types ^4.20241004.0
  - @types/node ^24.9.1

- Environment & Config
  - ANALYTICS_PROVIDERS (e.g., "ga4") — selects providers at runtime
  - GA4_MEASUREMENT_ID, GA4_API_SECRET — used by Epic 8
  - tsconfig.json — strict mode, ES2022 target

- Integrations (by provider abstraction)
  - GA4 Measurement Protocol (Epic 8) — HTTPS POST to mp/collect with 2s timeout


## Acceptance Criteria (Authoritative)

1. Định nghĩa mô hình trung lập và giao diện nhà cung cấp
   - Có `AnalyticsAttributes`, `AnalyticsEvent` và `AnalyticsProvider.send(event, options?)` được export công khai.
   - Biên dịch thành công dưới `tsconfig.json` (strict) và xuất hiện trong API công khai của module.

2. Router fan-out đồng thời với cô lập lỗi từng provider
   - `routeAnalyticsEvent(event, providers, { timeoutMs })` gọi tất cả providers đồng thời.
   - Lỗi/timeout ở bất kỳ provider nào KHÔNG ném lỗi ra ngoài; router vẫn hoàn tất.
   - Kiểm thử bằng mocks: tất cả thành công, một phần thất bại, tất cả thất bại, có timeout.

3. Chính sách timeout chuẩn hoá (mặc định 2000ms)
   - Có sử dụng `AbortSignal.timeout(2000)` hoặc cơ chế tương đương từng provider.
   - Khi một provider vượt timeout, phải log `status=timeout` và tiếp tục luồng.

4. Nạp provider từ biến môi trường
   - `loadProviders(env)` đọc `ANALYTICS_PROVIDERS` (ví dụ: `ga4,mixpanel`).
   - Bỏ qua provider không hỗ trợ với cảnh báo có cấu trúc.

5. Tích hợp vào luồng `/r` trước khi redirect
   - Từ URL đích xây `TrackingParams` -> `AnalyticsEvent` -> gọi router trước 301/302.
   - Redirect vẫn diễn ra ngay cả khi provider lỗi hoặc timeout.

6. Logging có cấu trúc cho mỗi provider
   - Trường tối thiểu: `event`, `provider`, `status` (success|error|timeout), `latency_ms`, `timeout_ms`.
   - Log một dòng JSON, phù hợp hiển thị trên Cloudflare dashboard.

7. Hành vi degrade khi thiếu cấu hình
   - Khi `ANALYTICS_PROVIDERS` trống/không đặt: tầng analytics tự vô hiệu hoá, ghi cảnh báo, không ảnh hưởng redirect.


## Traceability Mapping

| AC | Nguồn PRD/ADR | Thành phần/Kiến trúc | Ý tưởng kiểm thử |
|---|---|---|---|
| 1 | PRD FR2; Arch Epic 7 (types.ts) | src/lib/analytics/types.ts, provider.ts | Kiểm tra export type/interface, biên dịch strict |
| 2 | PRD FR2, NFR5; Arch router.ts | src/lib/analytics/router.ts | Unit: mocks multi-provider (success/fail/timeout); không throw |
| 3 | ADR-003 (timeout 2s) | router.ts, provider implementations | Unit: giả lập treo >2s -> status=timeout, log đúng |
| 4 | PRD FR2; Arch registry.ts | src/lib/analytics/registry.ts | Unit: các biến ENV khác nhau (rỗng, hợp lệ, chứa provider lạ) |
| 5 | PRD FR2/FR3; Arch redirect.ts | src/routes/redirect.ts, lib/tracking.ts | E2E Miniflare: redirect 302 không bị chặn khi fail/timeout |
| 6 | NFR Observability | logger.ts (hoặc tương đương) | Unit: assert log schema/fields có mặt; định dạng JSON một dòng |
| 7 | NFR Reliability | registry.ts, router.ts | Unit: ENV trống -> không gọi provider, có cảnh báo; redirect vẫn hoạt động |


## Risks, Assumptions, Open Questions

- Risk: Provider bên ngoài chậm/treo, làm tăng độ trễ.
  Mitigation: Áp dụng timeout 2s chuẩn hoá; log timeout; không chặn redirect.
- Risk: Sai cấu hình ENV (ANALYTICS_PROVIDERS, GA4_*).
  Mitigation: Kiểm tra cấu hình khi khởi tạo; degrade gracefully; cảnh báo rõ ràng.
- Risk: Rò rỉ thông tin nhạy cảm qua log.
  Mitigation: Chuẩn log tối thiểu, loại trừ PII; review log schema; kiểm thử bảo mật.
- Risk: Xử lý đồng thời nhiều provider gây bùng nổ lỗi.
  Mitigation: Cô lập try/catch từng provider; giới hạn số provider; backoff nếu cần (ngoài phạm vi hiện tại).
- Assumption: GA4 sẽ là provider đầu tiên, theo ADR-003.
  Next: Triển khai Epic 8 để hiện thực GA4 cụ thể.
- Assumption: Không yêu cầu đảm bảo at-least-once với provider bên ngoài.
  Next: Nếu yêu cầu thay đổi, cần cơ chế hàng đợi/buffer.
- Question: Có cần whitelist provider ở cấu hình không?
  Next: Thêm xác thực danh sách hợp lệ trong registry.


## Test Strategy Summary

- Unit Tests
  - types.ts/provider.ts: định nghĩa type/interface, lỗi compile nếu sai.
  - router.ts: multi-provider fan-out, các trường hợp success/fail/timeout; đo latency giả lập.
  - registry.ts: parse `ANALYTICS_PROVIDERS` (rỗng, hợp lệ, có provider lạ).
  - tracking.ts: extractTrackingParams, toAnalyticsEvent từ URL mẫu.
- Integration (Miniflare)
  - `/r`: với provider mocks: redirect 302 vẫn trả về khi provider lỗi/timeout; log tạo đủ trường.
  - Cấu hình ENV: bật/tắt GA4 mock qua `ANALYTICS_PROVIDERS`.
- Observability Checks
  - Snapshot log một dòng JSON, có: event, provider, status, latency_ms, timeout_ms.
- Acceptance Coverage
  - Mỗi AC có case test tương ứng; báo cáo coverage ≥ 80% cho module analytics.








