# Tài Liệu Xử Lý Lỗi - Cloudflare Redirect Service

## Tổng Quan

Tài liệu này mô tả chi tiết tất cả các tình huống xử lý lỗi trong hệ thống Cloudflare Redirect Service, bao gồm HTTP status code, error code, error message và điều kiện kích hoạt.

## Cấu Trúc Phản Hồi Lỗi

Tất cả các lỗi được trả về theo format JSON chuẩn:

```json
{
  "error": "<error_message>",
  "code": "<ERROR_CODE>"
}
```

---

## 1. LỖI CẤU HÌNH MÔI TRƯỜNG (HTTP 500)

### 1.1. CONFIG_VALIDATION_ERROR - Thiếu GA4_MEASUREMENT_ID

**HTTP Status:** 500 Internal Server Error
**Error Code:** `CONFIG_VALIDATION_ERROR`
**Error Message:** `"GA4_MEASUREMENT_ID is required when ANALYTICS_PROVIDERS includes \"ga4\""`

**Điều kiện kích hoạt:**
- Biến môi trường `ANALYTICS_PROVIDERS` chứa giá trị `"ga4"`
- Nhưng biến `GA4_MEASUREMENT_ID` không được cấu hình hoặc rỗng

**Vị trí code:** `src/lib/config.ts:64-68`

**Cách khắc phục:**
```bash
# Thêm GA4_MEASUREMENT_ID vào file .env
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

### 1.2. CONFIG_VALIDATION_ERROR - Thiếu GA4_API_SECRET

**HTTP Status:** 500 Internal Server Error
**Error Code:** `CONFIG_VALIDATION_ERROR`
**Error Message:** `"GA4_API_SECRET is required when ANALYTICS_PROVIDERS includes \"ga4\""`

**Điều kiện kích hoạt:**
- Biến môi trường `ANALYTICS_PROVIDERS` chứa giá trị `"ga4"`
- Nhưng biến `GA4_API_SECRET` không được cấu hình hoặc rỗng

**Vị trí code:** `src/lib/config.ts:71-77`

**Cách khắc phục:**
```bash
# Thêm GA4_API_SECRET vào file .env
GA4_API_SECRET=your_secret_key_here
```

---

### 1.3. CONFIG_VALIDATION_ERROR - ALLOWED_DOMAINS chứa domain rỗng

**HTTP Status:** 500 Internal Server Error
**Error Code:** `CONFIG_VALIDATION_ERROR`
**Error Message:** `"ALLOWED_DOMAINS must be a comma-separated list of non-empty domain names"`

**Điều kiện kích hoạt:**
- Biến môi trường `ALLOWED_DOMAINS` được cấu hình
- Danh sách chứa domain rỗng (ví dụ: `"example.com,,test.com"` hoặc `"example.com, , test.com"`)

**Vị trí code:** `src/lib/config.ts:85-92`

**Ví dụ giá trị sai:**
```bash
ALLOWED_DOMAINS=example.com,,test.com    # Domain rỗng giữa 2 dấu phẩy
ALLOWED_DOMAINS=example.com, , test.com  # Domain chỉ có khoảng trắng
```

**Cách khắc phục:**
```bash
# Đảm bảo không có domain rỗng trong danh sách
ALLOWED_DOMAINS=example.com,test.com,another.com
```

---

### 1.4. CONFIG_VALIDATION_ERROR - ALLOWED_DOMAINS chứa ký tự không hợp lệ

**HTTP Status:** 500 Internal Server Error
**Error Code:** `CONFIG_VALIDATION_ERROR`
**Error Message:** `"ALLOWED_DOMAINS contains invalid domain format. Domains should not contain special characters or whitespace."`

**Điều kiện kích hoạt:**
- Biến môi trường `ALLOWED_DOMAINS` được cấu hình
- Domain chứa các ký tự đặc biệt không hợp lệ: `< > : " / \ | ? * khoảng trắng`

**Vị trí code:** `src/lib/config.ts:95-103`

**Ví dụ giá trị sai:**
```bash
ALLOWED_DOMAINS=example.com,test<script>.com    # Chứa <>
ALLOWED_DOMAINS=example.com,http://test.com     # Chứa ://
ALLOWED_DOMAINS=example.com,test domain.com     # Chứa khoảng trắng
```

**Cách khắc phục:**
```bash
# Chỉ sử dụng domain name thuần túy, không có protocol, không có ký tự đặc biệt
ALLOWED_DOMAINS=example.com,test.com,subdomain.example.com
```

---

### 1.5. CONFIG_VALIDATION_ERROR - ANALYTICS_TIMEOUT_MS không phải số

**HTTP Status:** 500 Internal Server Error
**Error Code:** `CONFIG_VALIDATION_ERROR`
**Error Message:** `"ANALYTICS_TIMEOUT_MS must be a valid number"`

**Điều kiện kích hoạt:**
- Biến môi trường `ANALYTICS_TIMEOUT_MS` được cấu hình
- Giá trị không thể parse thành số nguyên (NaN)

**Vị trí code:** `src/lib/config.ts:110-116`

**Ví dụ giá trị sai:**
```bash
ANALYTICS_TIMEOUT_MS=abc     # Chuỗi không phải số
ANALYTICS_TIMEOUT_MS=2.5s    # Có đơn vị
ANALYTICS_TIMEOUT_MS=        # Rỗng
```

**Cách khắc phục:**
```bash
# Sử dụng giá trị số nguyên (milliseconds)
ANALYTICS_TIMEOUT_MS=2000
```

---

### 1.6. CONFIG_VALIDATION_ERROR - ANALYTICS_TIMEOUT_MS không dương

**HTTP Status:** 500 Internal Server Error
**Error Code:** `CONFIG_VALIDATION_ERROR`
**Error Message:** `"ANALYTICS_TIMEOUT_MS must be a positive number"`

**Điều kiện kích hoạt:**
- Biến môi trường `ANALYTICS_TIMEOUT_MS` được cấu hình
- Giá trị là số hợp lệ nhưng <= 0

**Vị trí code:** `src/lib/config.ts:118-124`

**Ví dụ giá trị sai:**
```bash
ANALYTICS_TIMEOUT_MS=0      # Bằng 0
ANALYTICS_TIMEOUT_MS=-100   # Số âm
```

**Cách khắc phục:**
```bash
# Sử dụng giá trị dương (khuyến nghị: 2000-5000ms)
ANALYTICS_TIMEOUT_MS=2000
```

---

## 2. LỖI VALIDATION REQUEST (HTTP 400)

### 2.1. MISSING_PARAM - Thiếu tham số 'to'

**HTTP Status:** 400 Bad Request
**Error Code:** `MISSING_PARAM`
**Error Message:** `"Missing required parameter: to"`

**Điều kiện kích hoạt:**
- Request không có query string (không có dấu `?` trong URL)
- HOẶC query string không chứa tham số `to=`

**Vị trí code:** `src/routes/redirect.ts:23` và `src/routes/redirect.ts:44`

**Ví dụ request sai:**
```
GET /r
GET /r?debug=1
GET /r?other=value
```

**Ví dụ request đúng:**
```
GET /r?to=https://example.com
GET /r?to=https://example.com&debug=1
```

---

### 2.2. URL Validation Error - Chỉ cho phép HTTP/HTTPS

**HTTP Status:** 400 Bad Request
**Error Code:** `REDIRECT_ERROR` (default)
**Error Message:** `"Only HTTP/HTTPS URLs allowed"`

**Điều kiện kích hoạt:**
- URL destination không có scheme `http://` hoặc `https://`
- URL không parse được bằng `new URL()`
- URL rỗng hoặc chỉ có khoảng trắng

**Vị trí code:** `src/lib/validation.ts:4-23`

**Ví dụ request sai:**
```
GET /r?to=ftp://example.com          # FTP protocol không được phép
GET /r?to=javascript:alert(1)        # JavaScript protocol không được phép
GET /r?to=file:///etc/passwd         # File protocol không được phép
GET /r?to=                           # URL rỗng
GET /r?to=example.com                # Thiếu protocol
```

**Ví dụ request đúng:**
```
GET /r?to=https://example.com
GET /r?to=http://example.com
```

---

### 2.3. URL Validation Error - Không cho phép protocol-relative URL

**HTTP Status:** 400 Bad Request
**Error Code:** `REDIRECT_ERROR` (default)
**Error Message:** `"Only HTTP/HTTPS URLs allowed"`

**Điều kiện kích hoạt:**
- URL bắt đầu bằng `//` (protocol-relative URL)

**Vị trí code:** `src/lib/validation.ts:10-12`

**Ví dụ request sai:**
```
GET /r?to=//example.com
GET /r?to=//evil.com/phishing
```

**Lý do từ chối:**
Protocol-relative URLs có thể bị lợi dụng cho phishing attacks vì chúng kế thừa protocol của trang hiện tại.

---

## 3. LỖI BẢO MẬT / PHÂN QUYỀN (HTTP 403)

### 3.1. DOMAIN_NOT_ALLOWED - Domain không trong allowlist

**HTTP Status:** 403 Forbidden
**Error Code:** `DOMAIN_NOT_ALLOWED`
**Error Message:** `"Domain not allowed"`

**Điều kiện kích hoạt:**
- Biến môi trường `ALLOWED_DOMAINS` được cấu hình (không rỗng)
- Domain của destination URL không nằm trong danh sách cho phép
- Domain không match exact và không phải subdomain của các domain trong allowlist

**Vị trí code:** `src/routes/redirect.ts:261` và `src/lib/validation.ts:35-71`

**Logic kiểm tra:**
1. Parse destination URL để lấy hostname
2. So sánh hostname (lowercase) với từng domain trong allowlist
3. Cho phép nếu:
   - Hostname khớp chính xác với domain trong allowlist
   - Hostname là subdomain của domain trong allowlist (ví dụ: `sub.example.com` cho phép khi allowlist có `example.com`)

**Ví dụ:**

```bash
# Cấu hình
ALLOWED_DOMAINS=example.com,test.com

# Request ĐƯỢC PHÉP:
GET /r?to=https://example.com
GET /r?to=https://test.com/page
GET /r?to=https://sub.example.com       # Subdomain
GET /r?to=https://api.test.com          # Subdomain

# Request BỊ TỪ CHỐI (403):
GET /r?to=https://evil.com
GET /r?to=https://notallowed.com
GET /r?to=https://examplecom.net        # Không phải subdomain hợp lệ
```

**Lưu ý đặc biệt:**
- Nếu `ALLOWED_DOMAINS` không được cấu hình hoặc rỗng, tất cả domain đều được phép
- Kiểm tra không phân biệt chữ hoa/thường (case-insensitive)
- Nếu URL parsing fail, domain sẽ bị reject (defensive security)

**Vị trí code xử lý:**
- Validation logic: `src/lib/validation.ts:35-71`
- Throw error: `src/routes/redirect.ts:261`

---

## 4. LỖI HỆ THỐNG (HTTP 500)

### 4.1. INTERNAL_ERROR - Lỗi không xác định

**HTTP Status:** 500 Internal Server Error
**Error Code:** `INTERNAL_ERROR`
**Error Message:** `"Internal server error"`

**Điều kiện kích hoạt:**
- Bất kỳ exception nào không phải `RedirectError` bị throw trong quá trình xử lý request
- Lỗi không lường trước trong application logic

**Vị trí code:** `src/index.ts:71-74`

**Xử lý:**
- Global error handler bắt tất cả errors
- Nếu error là instance của `RedirectError`: trả về error với status code và message cụ thể
- Nếu không: trả về generic `INTERNAL_ERROR` với status 500

**Log thông tin:**
Tất cả errors đều được log với structured logger bao gồm:
- Error message
- Status code
- Error code
- Request URL
- Request method

**Vị trí code:** `src/index.ts:51-75`

---

## 5. LỖI GA4 TRACKING (Non-blocking)

### 5.1. GA4 Request Timeout

**HTTP Status:** N/A (không ảnh hưởng response)
**Error Type:** Warning (logged only)
**Error Name:** `AbortError`

**Điều kiện kích hoạt:**
- GA4 tracking được kích hoạt (có tracking params trong destination URL)
- GA4 credentials được cấu hình (`GA4_MEASUREMENT_ID` và `GA4_API_SECRET`)
- Request tới GA4 API vượt quá timeout 2000ms

**Vị trí code:** `src/lib/tracking.ts:126-127`, `src/lib/tracking.ts:156-161`

**Hành vi:**
- Redirect vẫn thực hiện bình thường
- Log warning với thông tin:
  - `measurementId`
  - `timeoutMs: 2000`
  - Error message

**Log message:**
```
"GA4 tracking request timed out"
```

**Quan trọng:**
GA4 errors KHÔNG BAO GIỜ block redirect. User luôn được redirect về destination URL bất kể tracking có thành công hay không.

---

### 5.2. GA4 Request Failed

**HTTP Status:** N/A (không ảnh hưởng response)
**Error Type:** Warning (logged only)

**Điều kiện kích hoạt:**
- GA4 tracking được kích hoạt
- Request tới GA4 API thất bại do:
  - Network error
  - Invalid response (status code không phải 2xx)
  - Invalid credentials
  - Malformed payload

**Vị trí code:** `src/lib/tracking.ts:163-168`, `src/routes/redirect.ts:249-255`

**Hành vi:**
- Redirect vẫn thực hiện bình thường
- Log warning với thông tin:
  - Destination URL
  - Error message
  - Error name

**Log message (trong redirect handler):**
```
"GA4 tracking failed"
```

**Log message (trong tracking module):**
```
"GA4 tracking request failed"
```

---

### 5.3. GA4 Payload Build Error

**HTTP Status:** N/A (không ảnh hưởng response)
**Error Type:** Error (logged)

**Điều kiện kích hoạt:**
- `buildGA4Payload()` được gọi với `measurementId` rỗng hoặc undefined

**Vị trí code:** `src/lib/tracking.ts:95-98`

**Error thrown:**
```javascript
throw new Error('GA4 measurement ID is required to build payload')
```

**Lưu ý:**
Trong thực tế, lỗi này không xảy ra ở production vì đã có validation ở environment config level.

---

### 5.4. GA4 URL Parsing Error (Tracking Extraction)

**HTTP Status:** N/A (không ảnh hưởng response)
**Error Type:** Error (logged only)

**Điều kiện kích hoạt:**
- `extractTrackingParams()` nhận destination URL không hợp lệ
- URL không parse được bằng `new URL()`

**Vị trí code:** `src/lib/tracking.ts:86-92`

**Hành vi:**
- Log error với thông tin URL và error message
- Trả về object rỗng `{}`
- Redirect vẫn thực hiện bình thường (không có tracking)

**Log message:**
```
"Failed to parse destination URL for tracking extraction"
```

---

## 6. LỖI KV STORE (Silent Failure)

### 6.1. KV Parse Error - Malformed JSON

**HTTP Status:** N/A (không ảnh hưởng response)
**Error Type:** Error (logged to console only)

**Điều kiện kích hoạt:**
- KV store trả về data không phải JSON hợp lệ
- `kv.get(path, 'json')` throw error khi parse

**Vị trí code:** `src/lib/kv-store.ts:13-19`

**Hành vi:**
- Log error ra console với thông tin path và error details
- Trả về `null` thay vì throw exception
- Redirect handler sẽ fallback về temporary redirect (302) với destination URL gốc

**Console log:**
```
Failed to parse redirect data for path "<path>": <error>
```

---

### 6.2. KV Malformed Data - Missing 'type' field

**HTTP Status:** N/A (không ảnh hưởng response)
**Error Type:** Warning (logged)

**Điều kiện kích hoạt:**
- KV store trả về data hợp lệ (parse được JSON)
- Nhưng object không có field `type` hoặc `type` không phải `'permanent'` hoặc `'temporary'`

**Vị trí code:** `src/routes/redirect.ts:276-286`

**Hành vi:**
- Log warning ra console
- Fallback về temporary redirect (302)
- Redirect vẫn thực hiện về destination URL gốc

**Console log:**
```
Malformed redirect data for "<destination>": <redirectData>
```

**App log:**
```
"Redirect processed with malformed KV data"
{
  path: c.req.path,
  destination,
  type: 'temporary',
  tracking: false,
  warning: 'Malformed KV data'
}
```

---

## 7. XỬ LÝ ĐẶC BIỆT

### 7.1. Legacy Parameter Deprecation Warning

**HTTP Status:** N/A (không ảnh hưởng response)
**Error Type:** Warning (logged only)

**Điều kiện kích hoạt:**
- Request sử dụng tham số legacy `n=1` thay vì `debug=1`

**Vị trí code:** `src/routes/redirect.ts:207-214`

**Hành vi:**
- Chức năng hoạt động bình thường (backward compatible)
- Log warning khuyến khích migrate sang `debug=1`

**Log message:**
```
"Legacy debug parameter used"
{
  destination,
  legacy_param: 'n',
  recommended_param: 'debug',
  migration_note: 'Please update to use debug=1 instead of n=1'
}
```

**Ví dụ:**
```
GET /r?to=https://example.com&n=1        # Legacy, vẫn hoạt động
GET /r?to=https://example.com&debug=1    # Khuyến nghị
```

---

### 7.2. Debug Mode Response (200 OK)

**HTTP Status:** 200 OK
**Error Type:** N/A (không phải lỗi)

**Điều kiện kích hoạt:**
- Request có tham số `debug` với giá trị truthy:
  - `debug=1`, `debug=true`, `debug=yes`, `debug=on`, `debug=enabled`
  - Case-insensitive: `debug=YES`, `debug=True`, `debug=ON` cũng được chấp nhận
- Hoặc tham số legacy `n` với giá trị truthy: `n=1`, `n=true`, `n=yes`, `n=on`, `n=enabled`

**Các giá trị falsy (KHÔNG kích hoạt debug mode):**
- `debug=0`, `debug=false`, `debug=no`, `debug=off`, `debug=disabled`
- Giá trị không hợp lệ (ví dụ: `debug=2`, `debug=abc`) → log warning và default to false

**Vị trí code:**
- Helper function: `src/routes/redirect.ts:20-38` (isDebugMode)
- Usage in handler: `src/routes/redirect.ts:246-248`
- Response generator: `src/routes/redirect.ts:191-214`

**Hành vi:**
- KHÔNG thực hiện redirect
- Trả về JSON response với thông tin debug

**Response format:**
```json
{
  "destination": "https://example.com?utm_source=test",
  "tracking_params": {
    "utm_source": "test"
  },
  "redirect_type": "302",
  "note": "Debug mode - redirect suppressed"
}
```

**Headers:**
```
Content-Type: application/json
Cache-Control: no-cache
```

---

### 7.3. Invalid Debug Parameter Warning (Non-blocking)

**HTTP Status:** N/A (không ảnh hưởng response)
**Error Type:** Warning (logged only)

**Điều kiện kích hoạt:**
- Tham số `debug` hoặc `n` có giá trị không nằm trong danh sách truthy/falsy hợp lệ
- Ví dụ: `debug=2`, `debug=abc`, `debug=xyz`, `n=5`

**Vị trí code:** `src/routes/redirect.ts:32-37`

**Hành vi:**
- Log warning message với structured format
- Default debug mode về `false` (không kích hoạt debug mode)
- Redirect vẫn thực hiện bình thường

**Warning log format:**
```json
{
  "level": "warn",
  "message": "Invalid debug parameter value",
  "value": "2",
  "expected": "one of: 1, true, yes, on, enabled, 0, false, no, off, disabled",
  "defaulting_to": false
}
```

**Ví dụ:**
```bash
# Request với giá trị không hợp lệ
GET /r?to=https://example.com&debug=2

# Hành vi:
# 1. Log warning về invalid value
# 2. Set debugMode = false
# 3. Thực hiện redirect 302 về https://example.com
```

---

## 8. BẢNG TỔNG HỢP ERROR CODES

| HTTP Status | Error Code | Error Message | Vị trí code |
|-------------|-----------|---------------|------------|
| 400 | `MISSING_PARAM` | Missing required parameter: to | `redirect.ts:23,44` |
| 400 | `INVALID_ENCODING` | Invalid URL encoding | `redirect.ts:23,44` |
| 400 | `REDIRECT_ERROR` | Only HTTP/HTTPS URLs allowed | `validation.ts:22` |
| 403 | `DOMAIN_NOT_ALLOWED` | Domain not allowed | `redirect.ts:261` |
| 500 | `CONFIG_VALIDATION_ERROR` | GA4_MEASUREMENT_ID is required when ANALYTICS_PROVIDERS includes "ga4" | `config.ts:64` |
| 500 | `CONFIG_VALIDATION_ERROR` | GA4_API_SECRET is required when ANALYTICS_PROVIDERS includes "ga4" | `config.ts:71` |
| 500 | `CONFIG_VALIDATION_ERROR` | ALLOWED_DOMAINS must be a comma-separated list of non-empty domain names | `config.ts:87` |
| 500 | `CONFIG_VALIDATION_ERROR` | ALLOWED_DOMAINS contains invalid domain format... | `config.ts:98` |
| 500 | `CONFIG_VALIDATION_ERROR` | ANALYTICS_TIMEOUT_MS must be a valid number | `config.ts:112` |
| 500 | `CONFIG_VALIDATION_ERROR` | ANALYTICS_TIMEOUT_MS must be a positive number | `config.ts:119` |
| 500 | `INTERNAL_ERROR` | Internal server error | `index.ts:72` |

---

## 9. FLOW XỬ LÝ LỖI

### 9.1. Error Handling Flow

```
Request
  │
  ├─► Environment Validation Middleware
  │     ├─► Validation fails → throw RedirectError (500, CONFIG_VALIDATION_ERROR)
  │     └─► Validation passes → continue
  │
  ├─► Route Handler (/r endpoint)
  │     │
  │     ├─► Parse Query String
  │     │     └─► Missing 'to' → throw RedirectError (400, MISSING_PARAM)
  │     │
  │     ├─► URL Validation
  │     │     └─► Invalid scheme/format → throw RedirectError (400, REDIRECT_ERROR)
  │     │
  │     ├─► Domain Allowlist Check
  │     │     └─► Domain not allowed → throw RedirectError (403, DOMAIN_NOT_ALLOWED)
  │     │
  │     ├─► GA4 Tracking (non-blocking)
  │     │     └─► Any error → log warning, continue redirect
  │     │
  │     ├─► KV Store Lookup (graceful degradation)
  │     │     ├─► Parse error → return null, fallback to temporary redirect
  │     │     └─► Malformed data → log warning, fallback to temporary redirect
  │     │
  │     └─► Create Redirect Response
  │
  └─► Global Error Handler
        ├─► RedirectError → return JSON with error.statusCode
        └─► Unknown error → return JSON with 500 INTERNAL_ERROR
```

---

## 10. BEST PRACTICES

### 10.1. Error Handling Principles

1. **Fail-safe for user experience:**
   - GA4 tracking errors KHÔNG bao giờ block redirect
   - KV store errors fallback về temporary redirect
   - User luôn được redirect về destination (trừ khi lỗi security/validation)

2. **Structured logging:**
   - Tất cả errors được log với structured format
   - Include context: url, method, error details
   - Phân biệt level: error, warn, info

3. **Security-first:**
   - Strict URL scheme validation (chỉ http/https)
   - Reject protocol-relative URLs
   - Domain allowlist với subdomain support
   - Environment config validation at startup

4. **Graceful degradation:**
   - KV malformed data → fallback to temporary redirect
   - Missing KV data → fallback to temporary redirect
   - GA4 timeout → continue redirect without tracking

### 10.2. Testing Error Scenarios

```bash
# Test missing 'to' parameter
curl "https://your-worker.dev/r"

# Test invalid URL scheme
curl "https://your-worker.dev/r?to=ftp://example.com"

# Test protocol-relative URL
curl "https://your-worker.dev/r?to=//evil.com"

# Test domain not allowed
curl "https://your-worker.dev/r?to=https://evil.com"

# Test debug mode - truthy values
curl "https://your-worker.dev/r?to=https://example.com&debug=1"
curl "https://your-worker.dev/r?to=https://example.com&debug=true"
curl "https://your-worker.dev/r?to=https://example.com&debug=yes"
curl "https://your-worker.dev/r?to=https://example.com&debug=on"
curl "https://your-worker.dev/r?to=https://example.com&debug=enabled"

# Test debug mode - falsy values (should redirect normally)
curl "https://your-worker.dev/r?to=https://example.com&debug=0"
curl "https://your-worker.dev/r?to=https://example.com&debug=false"
curl "https://your-worker.dev/r?to=https://example.com&debug=no"
curl "https://your-worker.dev/r?to=https://example.com&debug=off"
curl "https://your-worker.dev/r?to=https://example.com&debug=disabled"

# Test case-insensitive debug values
curl "https://your-worker.dev/r?to=https://example.com&debug=YES"
curl "https://your-worker.dev/r?to=https://example.com&debug=OFF"

# Test invalid debug value (should log warning and redirect)
curl "https://your-worker.dev/r?to=https://example.com&debug=2"
curl "https://your-worker.dev/r?to=https://example.com&debug=abc"

# Test legacy parameter
curl "https://your-worker.dev/r?to=https://example.com&n=1"
curl "https://your-worker.dev/r?to=https://example.com&n=yes"
```

---

## 11. MONITORING & ALERTS

### 11.1. Error Metrics cần theo dõi

1. **Rate of 400 errors:**
   - High rate của `MISSING_PARAM` → có thể có integration issues
   - High rate của URL validation errors → có thể có malicious attempts

2. **Rate of 403 errors:**
   - `DOMAIN_NOT_ALLOWED` → Monitor cho phishing attempts
   - Sudden spike → có thể cần update allowlist

3. **Rate of 500 errors:**
   - `CONFIG_VALIDATION_ERROR` → Environment misconfiguration
   - `INTERNAL_ERROR` → Application bugs cần investigate

4. **GA4 tracking failures:**
   - High timeout rate → có thể cần tăng timeout hoặc investigate GA4 API
   - High failure rate → check credentials và network connectivity

### 11.2. Structured Logs để Query

Tất cả logs sử dụng structured format (JSON), dễ dàng query trong Cloudflare Analytics:

```javascript
// Error log format
{
  level: 'error',
  message: 'Request error',
  error: 'error message',
  statusCode: 500,
  code: 'CONFIG_VALIDATION_ERROR',
  url: 'https://worker.dev/r?to=...',
  method: 'GET'
}

// Warning log format
{
  level: 'warn',
  message: 'GA4 tracking failed',
  destination: 'https://example.com',
  error: 'timeout',
  errorName: 'AbortError'
}
```

---

**Tài liệu được tạo:** 2025-10-28
**Phiên bản:** 1.0
**Codebase version:** Story 1.9+
