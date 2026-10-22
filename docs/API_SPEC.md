# API Specification — Website TAMI

> **Trạng thái:** thiết kế ban đầu (16/10/2026); đã có code cho các endpoint ghi dòng `Code:`. Doc được reconcile as-built theo từng task (và lúc đóng layer): mục ghi **As-built** đã đối chiếu với code, mục khác vẫn là thiết kế chờ task tương ứng.
> Khi có code, nguồn chuẩn theo thứ tự: (1) code trong `src/endpoints/` và `src/collections/`; (2) schema dùng chung `src/shared/types/api.ts` (zod + type); (3) `docs/generated/` (sinh tự động, không sửa tay). Lệch thì **code thắng**.

## 1. Tổng quan

Website và admin chạy chung một app (Next.js + Payload). Có 3 cách truy cập dữ liệu:

| Cách | Dùng cho | Ghi chú |
|---|---|---|
| **Payload Local API** (gọi hàm trực tiếp trên server) | Server component của website render trang | Không qua HTTP. Luôn gọi với `overrideAccess: false` và user khách để áp đúng quyền "chỉ nội dung đã xuất bản" |
| **Payload REST API** `/api/<collection>` (tự sinh) | Trang `/admin` | Bảo vệ bằng `access` của từng collection (`docs/PERMISSION.md`). Khách gọi trực tiếp chỉ đọc được nội dung đã xuất bản |
| **Endpoint tuỳ biến** `/api/public/*`, `/api/admin/*` | Form công khai, tìm kiếm, xuất dữ liệu, tải file riêng | Mô tả ở §3, §4 |

GraphQL của Payload: **tắt** (không dùng ở giai đoạn 1).

## 2. Quy ước

**Base URL**

```
Development: http://localhost:3000/api
Staging:     https://staging.<domain>/api
Production:  https://<domain>/api
```

**Ngôn ngữ** (song ngữ, BRD FR-PUB-18): endpoint công khai nhận `locale` = `vi` (mặc định) | `en`. Giá trị khác trả 400. Với `locale=en`, chỉ trả nội dung có `hasEnglish = true` và trả trường chữ bản tiếng Anh (không fallback sang tiếng Việt, ERD §1.1). Thông báo lỗi trong `error` / `details` trả theo `locale` để hiện thẳng lên form. Payload Local API / REST dùng tham số `locale` có sẵn của Payload (`fallbackLocale: false` ở phía công khai). REST đọc (`find`/`findByID`) của các collection nội dung (`withContentDefaults`) không kèm `locale` đọc theo `vi` (hook `defaultReadLocale`, BL-021 #07); `locale=en` / `locale=all` giữ nguyên, vẫn không fallback.

**Xác thực**: session cookie của Payload (`payload-token`, HttpOnly, Secure, SameSite=Lax). Không có API key công khai.

**Response contract** (chỉ áp dụng cho endpoint tuỳ biến, qua helper `ok()` / `fail()`; REST tự sinh của Payload giữ format riêng của Payload):

```
Thành công: { "success": true, "data": <payload> }
Lỗi:       { "success": false, "error": "<message>", "details": [...], "code"?: "<mã máy đọc được>" }
```

`code` (tuỳ chọn) chỉ có ở lỗi mà client cần nhận ra bằng máy thay vì dựa vào chữ hay cấu trúc `details`; hiện có một giá trị: `postingClosed` (§3.2). Định nghĩa ở `API_ERROR_CODES` (`src/shared/types/api.ts`), helper `fail(status, error, details, code?)`.

**Mã lỗi**

| Code | Ý nghĩa |
|---|---|
| 400 | Dữ liệu không hợp lệ / thiếu consent / captcha sai |
| 401 | Chưa đăng nhập |
| 403 | Không đủ quyền |
| 404 | Không tìm thấy (kể cả khi bản ghi tồn tại nhưng ngoài phạm vi quyền) |
| 413 | File quá lớn |
| 415 | Loại file không hỗ trợ |
| 429 | Vượt giới hạn gửi (kèm header `Retry-After` tính bằng giây) |
| 500 | Lỗi hệ thống |
| 503 | Hệ thống chống spam (Redis) tạm không dùng được: endpoint công khai từ chối thay vì bỏ qua rate limit |

## 3. Endpoint công khai

| Method | Path | Mục đích | Giới hạn | BRD |
|---|---|---|---|---|
| `POST` | `/api/public/leads` | Gửi form liên hệ / để lại thông tin | 5 lần / 10 phút / IP | FR-PUB-03, 05, 07, 11; BR-10…16 |
| `POST` | `/api/public/job-applications` | Nộp hồ sơ ứng tuyển (multipart) | 3 lần / giờ / IP | FR-PUB-09; BR-20, 21 |
| `GET` | `/api/public/rentals` | Tìm & lọc tin cho thuê | 60 lần / phút / IP | FR-PUB-04 |
| `POST` | `/api/public/click-events` | Ghi lượt bấm Hotline/Zalo/Fanpage | 30 lần / phút / IP | FR-PUB-12 |
| `POST` | `/api/public/newsletter` | Đăng ký "Bản tin thị trường" (§3.12) | 5 lần / 10 phút / IP | BL-054 |
| `GET` | `/api/health` | Health check cho deploy & giám sát | — | ARCHITECTURE §6.4 |

### 3.1. `POST /api/public/leads`

Body (JSON):

| Trường | Kiểu | Bắt buộc | Ràng buộc |
|---|---|---|---|
| `source` | `rental` \| `property_post` \| `project` \| `contact` | ✔ | |
| `sourceId` | string (UUID) | ✔ trừ khi `source=contact` | Phải là bản ghi đang công khai |
| `fullName` | string | ✔ | 2–100 ký tự |
| `phone` | string | ✔ | SĐT Việt Nam hợp lệ |
| `email` | string | | Email hợp lệ |
| `message` | string | | ≤ 1000 ký tự |
| `consent` | `true` | ✔ | Phải là `true` |
| `turnstileToken` | string | ✔ | |
| `utm` | object | | `source`, `medium`, `campaign`, `term`, `content` |
| `pageUrl` | string | | Cắt còn 2000 ký tự |
| `referrer` | string | | `document.referrer` của khách; cắt còn 2000 ký tự |
| `locale` | `vi` \| `en` | | Mặc định `vi`. Lưu vào `leads.locale` (BR-17); dùng cho thông báo lỗi |

Kết quả `200`: `{ success: true, data: { received: true } }`. Luôn giống nhau dù lead được tạo mới hay gộp vào lead cũ (không lộ dữ liệu đã có).

Xử lý: rate limit → Turnstile → validate → chống trùng (BR-15) → tạo/gộp lead → phân công (BR-12) → đưa job email vào hàng đợi (BR-13). Chi tiết: `docs/ARCHITECTURE.md` §5.2.

> **As-built (layer-9-task-02):** `src/endpoints/public/leads.ts` (+ `src/lib/leads/create-or-merge.ts`, `dedupe.ts`, `assign.ts`; schema `leadInputSchema` ở `src/shared/types/api.ts`). Thứ tự: rate limit `leads` 5/10 phút/IP (Redis lỗi → 503) → Turnstile (sai → 400, thông báo luôn có chữ "captcha" ở cả vi/en) → zod (`consent` phải là boolean `true`; SĐT VN lưu E.164 `+84…`; `email`/`message` rỗng coi như không gửi; `sourceId` bắt buộc trừ `contact` và bị bỏ qua nếu `contact`; `utm`/`pageUrl`/`referrer` quá dài bị cắt chứ không từ chối; body > 16.000 ký tự hoặc không phải JSON → 400) → bản ghi nguồn phải đang công khai (`published`; tin cho thuê nhận cả `rented`; nháp/xoá mềm/không tồn tại/sai loại đều cùng một lỗi 400, `details` field `sourceId`) → một transaction: khoá advisory theo (SĐT chuẩn hoá, nguồn, bản ghi nguồn) → tìm lead trùng (cùng SĐT chuẩn hoá + `source` + bản ghi nguồn, `createdAt` trong 7 ngày, `status` không phải `won/lost/spam`, chưa xoá mềm) → **gộp**: `mergedCount` +1, activity `merged` (`content` = lời nhắn lần gửi sau, không actor; hook của activity đẩy `lastActivityAt`), KHÔNG tạo lead, KHÔNG email → hoặc **tạo** lead `new` (`consentAt`, `consentVersion` = `privacyPolicyVersion` hoặc `"unknown"` + cảnh báo log, `locale`, `utm`, `pageUrl`, `referrer`, `ipHash` HMAC-SHA256, `userAgent` cắt 500) + tự giao BR-12 + job `send-notification-email` template `new-lead` tới `notificationEmails` (ghi ngôn ngữ khách; bỏ qua + cảnh báo nếu danh sách trống). Tự giao: chỉ `rental`/`property_post`, `assignedTo = author` của tin khi `isAssignableSale(author)` (sale `active`), còn lại để trống (admin giao sau); endpoint chỉ đặt `assignedTo`, hook `recordAssignmentChange` sinh activity `assignment` + email `lead-assigned` cho sale (không audit vì không có user). Lỗi xếp job làm rollback cả lead (khách nộp lại được, không mất lead âm thầm), trả 500. Thành công **luôn** `200 { success: true, data: { received: true } }`, giống hệt từng byte cho tạo mới và gộp. Lỗi (400/429/500/503) theo `locale` của body (thiếu thì `Accept-Language`); `details` chỉ có tên trường + thông điệp, không echo giá trị nhập. Log chỉ có tên lỗi, không PII.

### 3.2. `POST /api/public/job-applications`

`multipart/form-data`: `jobPostingId`, `fullName`, `phone`, `email`, `message?`, `consent=true`, `turnstileToken`, `locale?` (`vi` | `en`, lưu vào `job-applications.locale`), `cv` (file PDF/DOC/DOCX ≤ 5MB, kiểm tra MIME thật).

Vị trí phải đang `published` và chưa quá `deadline`, nếu không trả 400 kèm `code: "postingClosed"`. File lưu vào `private-files`. Kết quả `200`: `{ success: true, data: { received: true } }`.

> **As-built (layer-6-task-09):** `src/endpoints/public/job-applications.ts` (+ `job-application-body.ts`, schema `jobApplicationFieldsSchema` ở `src/shared/types/api.ts`). Thứ tự: rate limit 3/giờ/IP → Turnstile → đọc body giới hạn ~5,25 MB (Content-Length + đếm byte thật) → zod (`consent` = `"true"`, `jobPostingId` UUID, SĐT VN lưu E.164, `locale` mặc định `vi`) → tin phải `published`, chưa xoá mềm, chưa quá hết ngày `deadline` theo giờ Việt Nam (`isPastDeadline` ở `src/lib/careers/deadline.ts`, dùng chung với danh sách/nhãn "hết hạn" của trang tuyển dụng) (mọi trường hợp đóng/không tồn tại trả cùng một thông báo 400 kèm `code: "postingClosed"`; `ApplyForm` dựa vào `code` này để hiện "Vị trí này đã hết hạn nhận hồ sơ"). CV kiểm bằng magic bytes (`inspectUpload`), lưu `private-files` tên UUID; tạo hồ sơ lỗi → xoá CV bù trừ (không dùng transaction vì S3). Lưu `consentAt`, `consentVersion` (= `privacyPolicyVersion`, thiếu thì `"unknown"` + cảnh báo), `ipHash` (HMAC-SHA256 IP). Email: job `send-notification-email` template `job-application` tới `notificationEmails` (không đính CV, chỉ link admin); lỗi hàng đợi vẫn trả 200. Mã lỗi: 400 (validate / tin đóng / CV hỏng; lỗi CV kèm `details` field `cv` và không có `code`; tin đóng có `code: "postingClosed"`), 413 (body hoặc CV quá cỡ), 415 (loại file sai), 429 (+`Retry-After`), 503 (Turnstile/hạ tầng); thông báo theo `locale` của form.

### 3.3. `GET /api/public/rentals`

Query params (đồng bộ với URL trang `/cho-thue` để chia sẻ được):

| Param | Ví dụ | Ghi chú |
|---|---|---|
| `locale` | `en` | Mặc định `vi`; quyết định slug danh mục, trường chữ trả về và `searchText` dùng để tìm |
| `q` | `studio quan 1` | Từ khoá, gõ không dấu vẫn ra (ERD §6) |
| `category` | `can-ho-dich-vu` · `serviced-apartments` | slug danh mục theo `locale` (gồm danh mục con) |
| `province` | `ho-chi-minh` | slug |
| `ward` | `ben-thanh` | slug phường; **bắt buộc kèm `province`** (slug phường chỉ duy nhất trong tỉnh), thiếu `province` → 400; chỉ khớp phường THUỘC tỉnh đó |
| `project` | `vinhomes-ocean-park` | BL-052. Slug dự án theo `locale`; chỉ khớp tin thuộc dự án **công khai** (`published`, chưa xoá mềm, `en` cần `hasEnglish`). Cùng quy ước với `category`/`province`: slug không tồn tại hoặc dự án chưa công khai → `200` rỗng (không 400) |
| `priceMin`, `priceMax` | `5000000`, `15000000` | VNĐ/tháng |
| `areaMin`, `areaMax` | `25`, `60` | m² |
| `bedrooms` | `2` | `4` nghĩa là 4+ |
| `furnishing` | `full` | |
| `amenities` | `pool,gym` | BL-044. Nhiều giá trị phân cách dấu phẩy; khoá lặp `amenities=pool&amenities=gym` được gộp tương đương (riêng tham số này — các khoá khác lặp chỉ lấy giá trị đầu), trong `RENTAL_AMENITIES`; tin phải có **đủ** mọi tiện ích (AND). Giá trị ngoài danh sách **bị bỏ** (không 400, khác `furnishing` — tham số danh sách nên phần hợp lệ còn lại vẫn có nghĩa); không còn giá trị nào = không lọc |
| `available` | `true` | Chỉ tin còn trống (`published`), bỏ tin `rented`. Mặc định (hoặc `false`) trả cả `published` lẫn `rented`. Trang `/cho-thue` dùng `true` (design-spec S04) |
| `sort` | `newest` \| `price_asc` \| `price_desc` | Mặc định `newest` |
| `page`, `limit` | `1`, `12` | `limit` tối đa 48 |

Kết quả: `{ success: true, data: { items: RentalCard[], total, page, totalPages } }`. `RentalCard` chỉ gồm trường công khai (mã tin, tiêu đề, slug, ảnh đại diện, giá, diện tích, phòng ngủ, phòng tắm, nội thất, khu vực, danh mục, trạng thái), chữ và slug theo `locale`. `category` (BL-052, thêm — additive) = `{ name, slug }` của danh mục CỦA TIN (có thể là danh mục con) theo `locale`, hoặc `null` khi tin không có danh mục / danh mục đã xoá mềm / `/en` mà danh mục chưa có bản EN. **Không** trả `address` khi `showExactAddress = false`. Không bao giờ trả trường nội bộ.

Gọi qua `SearchService`. Cache: `s-maxage=60` (cache key gồm `locale`).

> **As-built (layer-7-task-02):** `src/endpoints/public/rentals.ts` (`GET /api/public/rentals`), `src/lib/search/search-service.ts` (`SearchService` + `PostgresRentalSearch`), `rental-search-sql.ts` (WHERE/ORDER BY tham số hoá), schema `rentalSearchParamsSchema` + kiểu `RentalCard`/`RentalSearchResult` ở `src/shared/types/api.ts`. Thứ tự: rate limit `rentals` 60/phút/IP (không Turnstile; Redis lỗi → 503) → zod (sai kiểu/ngoài khoảng → 400; `priceMin ≤ priceMax`, `areaMin ≤ areaMax`; ô rỗng `?x=` coi như không truyền; khoá lạ bị bỏ qua; `q` ≤ 100 ký tự; `page` ≤ 500; `bedrooms` 0..4) → một truy vấn SQL lấy cả trang (khu vực + ảnh đại diện bằng `LATERAL`, không N+1). Tin hiển thị theo cùng điều kiện `publicWhere("rentals")` (`published`/`rented`, chưa xoá mềm, `en` cần `hasEnglish`; test đối chiếu hai bên). `q` chuẩn hoá như `searchText`, tách từ, mọi từ phải khớp (`LIKE %từ%` trên index trigram; tối đa 8 từ; `%`, `_` và dấu gạch chéo ngược được thoát). Tin chưa có giá (thương lượng) xếp cuối ở cả hai chiều sắp xếp giá; `id` chốt thứ tự phân trang. `RentalCard` KHÔNG có khoá `address` khi `showExactAddress=false` (SQL chỉ trả địa chỉ khi bật). Response thành công: `Cache-Control: public, s-maxage=60`; lỗi 400/429/503: `no-store`. Đo trên 100.000 tin giả lập (DB dev, `pnpm bench:rentals-search`): p95 tổng ≈ 80ms, kịch bản chậm nhất ≈ 95ms (ngưỡng 500ms).

> **As-built (layer-8-task-03):** thêm `available` và luật `ward` cần `province` (400); `category` không còn khớp danh mục cha đã xoá mềm. Trang `/cho-thue` (`src/components/rentals/RentalListPage.tsx`) gọi thẳng `PostgresRentalSearch` (không qua HTTP) với `available=true`, 12 tin/trang; Sheet bộ lọc mobile gọi chính endpoint này (`limit=1`, `available=true`) để đếm "Xem n tin". URL trang dùng CÙNG tên khoá với API (`src/lib/search/url-params.ts`: `parseRentalFilters` / `rentalListQueryString` / `toRentalSearchParams`) nhưng khoan dung hơn API: tham số lạ hoặc giá trị sai bị bỏ qua (API trả 400), slug danh mục/tỉnh/phường không tồn tại bị bỏ, khoảng min > max được đảo lại, `ward` không kèm `province` bị bỏ.

> **As-built (BL-052 phase-2-task-01):** thêm tham số `project` + khoá `category` của `RentalCard` (cả hai additive, response giữ khung `{ items, total, page, totalPages }`). Trang `/cho-thue` không gọi endpoint mà gọi `PostgresRentalSearch.listing` (`src/lib/search/search-service.ts`, qua `listRentals` ở `src/lib/rentals/rental-list-queries.ts`): 4 truy vấn song song — (1) đếm tổng + số tin nổi bật (`LEAST(count FILTER is_featured, 5)`), (2) trang lưới với `r.id NOT IN (≤ 5 id nổi bật mới nhất của cùng bộ lọc)` nên tin nổi bật không lặp ở MỌI trang, (3) thẻ nổi bật (chỉ trang 1), (4) số đếm theo chiều trong MỘT lượt quét `GROUPING SETS` (tab danh mục cấp 1 + "Tất cả" bỏ chiều danh mục; tỉnh bỏ chiều tỉnh **và phường**; tổng theo tỉnh không lọc để sắp). `total` gồm tin nổi bật, `totalPages` tính trên phần còn lại. Ô "Dự án" = `listRentalProjectOptions` (dự án công khai có ≥ 1 tin công khai còn trống). URL trang bỏ slug `project` không có trong danh sách đó. Đo p95 trên DB dev: xem `tasks/feature-listing-detail-redesign/phase-2-task-01.md` (Verification summary).

### 3.4. `POST /api/public/click-events`

> As-built (layer-6-task-05): trang chi tiết dự án gửi `refCollection=projects` + `refId` (id dự án) qua `ClickRefMarker`; body beacon `text/plain;charset=UTF-8`.

Body: `{ type: "hotline" | "zalo" | "fanpage", pagePath, refCollection?, refId? }`. Gửi bằng `navigator.sendBeacon`. Trả `204`.

| Trường | Ràng buộc |
|---|---|
| `type` | `hotline` \| `zalo` \| `fanpage` |
| `pagePath` | cắt khoảng trắng hai đầu (`trim`), rồi 1–500 ký tự, bắt đầu bằng `/`; **không** được bắt đầu bằng `//` hoặc `/\` (URL cùng giao thức, không phải đường dẫn nội bộ) → `400` |
| `refCollection` | tuỳ chọn (null được), một trong 11 giá trị `CLICK_REF_COLLECTIONS` (nhóm "Danh mục nền" + "Nội dung" ở ERD §3): `provinces`, `wards`, `categories`, `developers`, `projects`, `rentals`, `property-posts`, `news`, `services`, `job-postings`, `pages`. Giá trị khác (vd `leads`) → `400` |
| `refId` | tuỳ chọn (null được), `[A-Za-z0-9_-]`, ≤ 64 ký tự |

Body là JSON, nhận cả `Content-Type: text/plain` (sendBeacon), tối đa 2000 ký tự. Không cần Turnstile. Mã lỗi: `400` body sai, `429` vượt 30 lần/phút/IP (kèm `Retry-After`), `503` Redis không dùng được (theo §2). Code: `src/endpoints/public/click-events.ts`.

**As-built (layer-5-task-06, reconcile lúc đóng layer 5):** ràng buộc `pagePath`/`refCollection` ở bảng trên khớp `clickEventBodySchema` (`src/endpoints/public/click-events.ts`) và danh sách `CLICK_REF_COLLECTIONS` (`src/lib/click-stats/click-types.ts`). Siết theo G2 (spec-validation layer 2) để endpoint công khai không sinh dòng rác trong `click-stats-daily`.

### 3.5. `GET /api/health`

Không cần đăng nhập, không rate limit. Dùng cho CD health gate, Docker `HEALTHCHECK`, Uptime Kuma.
Kiểm song song DB (`select 1`), Redis (`PING`), storage (`HeadBucket` cả bucket public và private); mỗi check tối đa 2 giây.

| Mã | Body |
|---|---|
| `200` | `{ "status": "ok", "checks": { "db": "up", "redis": "up", "storage": "up" } }` |
| `503` | `{ "status": "down", "checks": { ... } }`; thành phần lỗi hoặc quá 2 giây có giá trị `"down"` |

Header `Cache-Control: no-store`. Không trả version, host, chuỗi kết nối, stack trace.
Code: `src/app/(payload)/api/health/route.ts`, `src/lib/health/`.

### 3.6. `GET /api/monitoring-config`

Không cần đăng nhập. Trả cấu hình GlitchTip cho trình duyệt, đọc lúc chạy (cùng image promote staging → prod).

| Mã | Body |
|---|---|
| `200` | `{ "dsn": string | null, "environment": "development" | "staging" | "production" }` (`dsn` = `GLITCHTIP_PUBLIC_DSN`, null khi chưa đặt) |

Header `Cache-Control: private, max-age=300` (ngoại lệ của ARCHITECTURE §5.1). Code: `src/app/(payload)/api/monitoring-config/route.ts`.

### 3.7. `GET /api/metrics` (nội bộ)

Dành cho Prometheus, **không public**: Nginx trả 404 cho đường này; scrape qua `127.0.0.1`/network nội bộ. Xác thực `Authorization: Bearer <METRICS_TOKEN>` (so sánh thời gian hằng).

| Mã | Body |
|---|---|
| `200` | Prometheus text format, metric `tami_*` (in-memory theo từng process) |
| `401` | Thiếu/sai token, kèm `WWW-Authenticate: Bearer realm="metrics"` |
| `404` | Chưa đặt `METRICS_TOKEN` (coi như không tồn tại) |

Header `Cache-Control: no-store`. Code: `src/app/(payload)/api/metrics/route.ts`, `src/lib/monitoring/metrics*.ts`.

### 3.8. `POST /api/internal/revalidate` (nội bộ)

Dành cho process `jobs` (`expire-offers`, `close-job-postings`) làm mới cache trang công khai, **không public**: Nginx trả 404 cho `/api/internal/`; job gọi thẳng `INTERNAL_APP_URL` trong mạng Docker. Xác thực `Authorization: Bearer <token>` với token = HMAC-SHA256(`PAYLOAD_SECRET`, `tami:internal-revalidate:v1`) dạng hex (so sánh thời gian hằng). Body JSON `{ "paths": ["/vi/tin-bds/x", "/en", ...] }`, tối đa 200 đường dẫn, mỗi đường dẫn phải là đường dẫn nội bộ của trang công khai `/{vi|en}[/segment...]` (không `..`, không query).

| Mã | Body |
|---|---|
| `200` | `{ "revalidated": <số đường dẫn> }` |
| `400` | Body sai (không phải JSON, quá 200 đường dẫn, đường dẫn không hợp lệ) |
| `401` | Thiếu/sai token |

Header `Cache-Control: no-store`. Code: `src/app/(payload)/api/internal/revalidate/route.ts`, `src/lib/revalidate/internal-revalidate.ts`.

### 3.9. Tham số URL trang `/du-an` (BL-045 + BL-052, as-built; không phải endpoint JSON)

Trang danh sách dự án (`/du-an` · `/en/projects`), URL là nguồn sự thật, dùng được không JS (form GET của cột lọc + nút "Áp dụng"; có JS thì đổi ô là điều hướng ngay, `router.push` không cuộn). Code: `src/lib/projects/project-filters.ts` (`parseProjectFilters` / `projectQueryString` / `hasFilterParams`), `src/components/projects/project-list-data.ts`, `ProjectListPage.tsx`.

| Tham số | Ý nghĩa | Giá trị không hợp lệ |
|---|---|---|
| `category` | Slug danh mục dự án (tab cấp 1; cấp 1 gồm dự án của danh mục con) | Slug lạ → bỏ (không 404) |
| `province` | BL-052: nhiều slug tỉnh `a,b` hoặc khoá lặp, **OR**; link cũ một slug vẫn chạy; tối đa 50 slug | Slug lạ → bỏ |
| `status` | `upcoming` · `selling` · `handed_over` | Giá trị lạ → bỏ |
| `q` | Từ khoá, không phân biệt hoa/thường/dấu, khớp tên + địa chỉ + phường/xã + tỉnh; tối đa 100 ký tự | Quá dài hoặc rỗng → bỏ |
| `developer` | Id chủ đầu tư CÓ dự án công khai ở ngôn ngữ đang xem | Id lạ → bỏ, không 500 |
| `type` | BL-052: loại sản phẩm (`PROPERTY_TYPES`), nhiều giá trị, **OR** | Giá trị lạ → bỏ |
| `feature` | BL-052: tiện ích nổi bật (`PROJECT_FEATURES`), nhiều giá trị, **AND** | Giá trị lạ → bỏ |
| `priceMin`, `priceMax` | BL-052: **tỷ đồng**, số nguyên 0–50 (thanh trượt bước 1; 0 = không giới hạn dưới, 50 = "50+" không giới hạn trên — đầu ở mép không lên URL); theo giá "từ" hiệu lực của dự án | Không phải số nguyên → bỏ; > 50 → 50; `min > max` → đổi chỗ |
| `sort` | `newest` (mặc định, không lên URL) · `price_asc` · `price_desc` (dự án chưa có giá luôn cuối) | Giá trị lạ → mặc định |
| `page` | Trang lưới (12 dự án); vượt số trang → `404` | |

Có bất kỳ tham số lọc nào (kể cả giá trị sai; `?province=` rỗng do form gửi "Tất cả" thì không tính) hoặc `sort` khác mặc định → `noindex, follow` + canonical `/du-an`; không lọc → canonical chính nó (kèm `?page=n`). FAQ JSON-LD (`FAQPage`) chỉ phát ở trang sạch (trang 1, không tham số lọc) — cùng điều kiện noindex. Đổi một ô lọc hoặc sắp xếp: giữ mọi tham số khác, **bỏ `page`** (về trang 1); tab / phân trang mang theo mọi tham số (tab bỏ `page`). Dữ liệu: quét ≤ 1000 dự án công khai rồi lọc / đếm / sắp ở bộ nhớ (chạm trần ghi cảnh báo log), MỘT truy vấn lấy trường thẻ; ≤ 5 dự án `isFeatured` khớp lọc là thẻ nổi bật (trang 1) và bị loại khỏi lưới ở mọi trang; số đếm tab / ô tích theo quy tắc "khớp mọi lọc khác trừ chính chiều đó". Không migration, không endpoint mới.

### 3.10. Tham số URL trang `/cho-thue` (BL-052, as-built)

`/cho-thue` · `/en/for-rent` (+ trang danh mục `/cho-thue/danh-muc/[category]`) dùng CÙNG tên khoá với `GET /api/public/rentals` (§3.3: `q`, `category`, `province`, `ward`, `project`, `priceMin`/`priceMax` VNĐ/tháng, `areaMin`/`areaMax`, `bedrooms`, `furnishing`, `amenities`, `sort`, `page`) nhưng khoan dung hơn API: giá trị sai / slug lạ (danh mục, tỉnh, phường, **dự án** — ô "Dự án" chỉ liệt kê dự án công khai có tin còn trống) bị bỏ, `min > max` đảo lại, `ward` thiếu `province` bị bỏ. Thanh trượt Giá thuê 0 – 100+ triệu/tháng (bước 1 triệu, giá trị trên URL vẫn là VNĐ), Diện tích 0 – 300+ m² (bước 5). Trang danh mục: `?category=` bị bỏ qua (danh mục nằm trong đường dẫn). Link cũ `/cho-thue?category=<slug có thật>` vẫn lọc + đánh dấu tab, canonical về trang danh mục. Noindex: `hasNarrowingParams` (trang gốc, trang chỉ lọc MỘT danh mục hoặc MỘT tỉnh vẫn index; tổ hợp sâu hơn hoặc đổi sắp xếp → `noindex, follow` + canonical trang sạch). FAQ JSON-LD chỉ ở `/cho-thue` khi URL không có tham số nào (kể cả slug lạ đã bị trang bỏ); trang danh mục hiện khối FAQ nhưng không phát `FAQPage`. Code: `src/lib/search/url-params.ts`, `src/components/rentals/RentalListPage.tsx`, `rental-list-metadata.ts`.

### 3.11. Tham số URL trang `/tin-bds` (BL-052, as-built)

`/tin-bds` · `/en/property-news` (+ trang danh mục `/tin-bds/danh-muc/[category]`): `?q=&type=&province=&priceMin=&priceMax=&areaMin=&areaMax=&bedrooms=&direction=&handover=&sort=&page=`. Code: `src/lib/posts/post-filters.ts`, `src/components/posts/PostListPage.tsx`, `post-list-metadata.ts`.

| Tham số | Ý nghĩa | Giá trị không hợp lệ |
|---|---|---|
| `q` | Từ khoá không phân biệt hoa/thường/dấu, khớp tiêu đề + tóm tắt + địa chỉ + phường + tỉnh; tối đa 100 ký tự | Quá dài / rỗng → bỏ |
| `type` | Loại hình (`PROPERTY_TYPES`), nhiều giá trị, OR | Giá trị lạ → bỏ |
| `province` | Nhiều slug tỉnh, OR; tối đa 50 | Slug lạ → bỏ (không lọc thành rỗng) |
| `priceMin`, `priceMax` | **Tỷ đồng**, số nguyên 0–50 (50 = "50+") | Không phải số nguyên → bỏ; > 50 → 50; `min > max` → đổi chỗ; `priceMax=0` (gõ tay / kéo đầu trên về 0) = không giới hạn trên |
| `areaMin`, `areaMax` | m², số nguyên 0–500 (500 = "500+") | Như giá; `areaMax=0` = không giới hạn trên |
| `bedrooms` | `1` · `2` · `3` · `4` (4 = 4+), một giá trị | Giá trị lạ → bỏ |
| `direction` | Hướng nhà (`DIRECTIONS`: `N`, `NE`, `E`, `SE`, `S`, `SW`, `W`, `NW`), nhiều giá trị, OR | Giá trị lạ → bỏ |
| `handover` | Tình trạng bàn giao (`HANDOVER_CONDITIONS`), nhiều giá trị, OR | Giá trị lạ → bỏ |
| `sort` | `newest` (mặc định, không lên URL) · `price_asc` · `price_desc` (tin không giá cuối) | Giá trị lạ → mặc định |
| `page` | Trang lưới; vượt số trang → `404` | |
| `category` | **Link cũ, chỉ ở `/tin-bds`** (route danh mục bỏ qua): slug danh mục tin BĐS theo ngôn ngữ đang xem → lọc theo danh mục đó (+ con) và đánh dấu tab; hero / breadcrumb / đường dẫn form vẫn của `/tin-bds`; "Xoá tất cả" xoá luôn danh mục | Slug lạ → bỏ (không lọc, không 404) |

Metadata: có tham số lọc / `q` / `sort` khác mặc định, hoặc `?category=` (kể cả slug lạ) → `noindex, follow`. Canonical: trang sạch (`/tin-bds` hoặc trang danh mục, không `?page`); riêng `/tin-bds?category=<slug có thật>` → canonical **trang danh mục** `/tin-bds/danh-muc/<slug>` (slug của ngôn ngữ đang xem, không hreflang). Không lọc → canonical chính nó (kèm `?page=n`). FAQ JSON-LD chỉ ở `/tin-bds` sạch (trang 1, cùng điều kiện noindex); trang danh mục không phát. Tin ưu đãi đã kết thúc luôn xếp sau (BR-06); ≤ 5 tin `isFeatured` còn hiệu lực là thẻ nổi bật (trang 1), loại khỏi lưới mọi trang; số đếm ô tích theo quy tắc "trừ chính chiều đó" (chip Phòng ngủ không đếm).

### 3.12. `POST /api/public/newsletter` (BL-054, as-built P1-T04)

Body (JSON): `email` (✔, cắt khoảng trắng + chữ thường rồi kiểm email hợp lệ, ≤ 254 ký tự), `consent` (✔, phải là boolean `true`), `turnstileToken` (✔), `locale` (`vi` | `en`, mặc định `vi`), `sourcePath` (tuỳ chọn: đường dẫn trong site bắt đầu `/`, không `//`; sai kiểu / ngoài site → bỏ qua chứ không từ chối; cắt còn 500 ký tự). Không có honeypot (form lead cũng không dùng).

Thứ tự (như §3.1): rate limit `newsletter` 5/10 phút/IP (Redis lỗi → 503) → Turnstile (sai → 400, thông báo có chữ "captcha" ở cả vi/en) → zod (sai → 400, `details` chỉ tên trường + thông điệp theo `locale`, không echo email; body > 16.000 ký tự / không phải JSON → 400) → `privacyPolicyVersion` lấy từ `site-settings` (trống → `"unknown"` + cảnh báo log), `consentAt` = now → tìm theo email: **chưa có** → tạo `active`; **`active`** → không đổi gì (giữ bằng chứng đồng ý lần đầu); **`unsubscribed`** → bật lại `active` + ghi lại `locale`, `consentAt`, `privacyPolicyVersion`, `sourcePath`. Hai request cùng email chạy song song: bản thua đụng UNIQUE `email` (`ValidationError` path `email`) → vẫn coi là thành công. Ghi bằng Local API `overrideAccess` (REST tạo bị khoá, các trường consent khoá sửa — ERD `newsletter-subscribers`).

Kết quả `200 { success: true, data: { received: true } }` **giống hệt** cho mọi trường hợp đăng ký được (mới / đã có / bật lại / đua nhau): không lộ email đã đăng ký. Lỗi bất ngờ → 500 chung theo `locale`, log chỉ có tên lỗi (không email). Code: `src/endpoints/public/newsletter.ts` (dùng lại `createJsonBodyReader` / `localizePipelineFailure` của `leads.ts`). Form: `src/components/news/NewsletterSignup.tsx` (client, `usePublicForm`; gửi `sourcePath` = `location.pathname`, không query/hash). Chưa gửi mail định kỳ.

## 4. Endpoint quản trị

| Method | Path | Quyền | Mục đích | BRD |
|---|---|---|---|---|
| `GET` | `/api/admin/newsletter-subscribers/export` | admin | Xuất danh sách đăng ký bản tin ra `.xlsx` (lọc `status` tuỳ chọn). Ghi audit log `newsletter.export` | BL-054 |
| `GET` | `/api/admin/leads/export` | admin | Xuất lead ra `.xlsx` theo bộ lọc hiện tại (trạng thái — một hoặc nhiều, nguồn, sale hoặc chỉ lead chưa giao, khoảng ngày; gồm các chip lọc nhanh Trạng thái của danh sách lead). Ghi audit log `lead.export` | FR-ADM-10 |
| `POST` | `/api/admin/leads/:id/assign` | admin | Giao lead cho sale `{ staffId }`: chỉ cập nhật `assignedTo` qua Payload Local API; activity `assignment`, email cho sale và audit log `lead.assign` do **một** nơi duy nhất là hook `leads.afterChange` sinh (§5), để không sinh trùng khi admin đổi `assignedTo` trong form | FR-ADM-09; BR-12, 13 |
| `GET` | `/api/admin/private-files/:id/download` | admin | Tải CV. Ghi audit log `application.view_cv` | FR-ADM-05 |
| `GET` | `/api/admin/dashboard` | admin (toàn bộ), sale (số liệu lead của mình) | Số liệu dashboard (admin thấy thêm: số bài dịch lỗi / chờ duyệt, chi phí dịch tháng này) | FR-ADM-14 |
| `POST` | `/api/admin/translations/:collection/:id` | admin; sale với bài của mình | "Dịch lại bằng AI" (§5.1) | FR-ADM-18 |
| `POST` | `/api/admin/translations/pages/:id/approve` | admin | Duyệt bản EN trang pháp lý, đường duy nhất bật `pages.hasEnglish` (§5.2). Audit `content.approve_translation` | BR-08 |

Thứ tự kiểm tra: `docs/PERMISSION.md` §5. Giới hạn: xuất Excel 10 lần / giờ / user.

> **As-built (BL-054 P1-T04) — xuất bản tin:** `src/endpoints/admin/newsletter-export.ts` (dùng lại `xlsx-stream`, keyset `(createdAt, id)`, rate limit và header của xuất lead). `GET /api/admin/newsletter-subscribers/export?status=active|unsubscribed` (rỗng = tất cả; giá trị khác → 400 `details`). Thứ tự: 401 (chưa đăng nhập / tài khoản khoá) → 403 (không phải admin; sale và khách không xuất) → 400 → rate limit **chung** `admin-export-excel` với xuất lead (10/giờ/user; 429 + `Retry-After`; Redis lỗi 503) → đếm (quá 20.000 → 422) → audit `newsletter.export` (`collection: newsletter-subscribers`, `meta`: `filters` + `rowCount`, không có email; ghi lỗi → 500, không có file) → stream. `200` xlsx, `Content-Disposition: attachment; filename="tami-ban-tin-YYYYMMDDHHmm.xlsx"`, `Cache-Control: private, no-store`, `X-Content-Type-Options: nosniff`. Cột: Email, Ngôn ngữ, Trạng thái (nhãn tiếng Việt), Ngày đăng ký, Ngày đồng ý (giờ Việt Nam), Phiên bản chính sách, Trang đăng ký. Nút "Xuất Excel" (`src/components/admin/NewsletterExportButton.tsx`, slot `beforeListTable`; chỉ admin, ẩn trong list drawer) chuyển bộ lọc "Trạng thái là …" của danh sách sang `?status=`; bộ lọc khác hoặc ô tìm kiếm có chữ → nút khoá kèm lý do (không xuất rộng hơn danh sách đang thấy).

> **As-built (layer-9-task-05):** `src/endpoints/admin/leads-export.ts` (+ `src/lib/leads/export-filters.ts`, `src/lib/export/xlsx-stream.ts`, nút `src/components/admin/LeadExportButton.tsx` trên danh sách lead qua slot server `LeadExportSlot.tsx` (`beforeListTable`, đứng sau thanh chip lọc nhanh `LeadQuickFilterSlot.tsx`), chỉ admin thấy). `GET /api/admin/leads/export?status=&statusIn=&source=&assignedTo=&unassigned=&createdFrom=&createdTo=&search=` (`status`/`source` theo danh sách cố định, `statusIn` = nhiều trạng thái phân tách dấu phẩy (vd `contacted,consulting`; mỗi giá trị thuộc danh sách trạng thái, không rỗng, tối đa 6 phần tử, trùng thì gộp; where `status in`), `assignedTo` UUID, `unassigned=1` = chỉ lead chưa có sale phụ trách (where `assignedTo exists false`; giá trị khác `1` → 400); `status` + `statusIn` hoặc `assignedTo` + `unassigned` cùng lúc → 400 `details` (mâu thuẫn, không đoán); audit `meta.filters` chỉ ghi các giá trị chuẩn hoá này, `createdFrom`/`createdTo` là mốc ISO 8601 có múi giờ (vd `2026-10-01T12:00:00.000Z`, đúng giá trị bộ chọn ngày của danh sách), lọc `createdAt >= createdFrom` / `createdAt <= createdTo` y như danh sách nên file khớp 1-1 với danh sách, `createdFrom ≤ createdTo`, tối đa 40 ký tự; `search` = từ khoá ô tìm kiếm của danh sách (nguyên văn, không trim — danh sách Payload cũng không trim, chỉ chuỗi rỗng = không tìm; tối đa 100 ký tự, vượt → 400 kèm `details`, nút phía client cũng khoá với thông báo riêng): server không nhận where thô mà tự dựng điều kiện tìm bằng `mergeListSearchAndWhere` của Payload trên đúng tập trường `LEAD_LIST_SEARCHABLE_FIELDS` (mã, họ tên, SĐT, email — cùng nguồn với `Leads.admin.listSearchableFields`), AND với bộ lọc, và hook `expandPhoneSearch` mở rộng nhánh SĐT (gõ `0956 789 012` / `0956789012` / `+84956789012` đều ra) nên file khớp đúng tập lead danh sách đang thấy; tham số rỗng = không lọc; sai → 400 kèm `details`). Chỉ admin (không đăng nhập hoặc tài khoản khoá → 401, sale → 403, kể cả lead được giao cho sale đó). Thứ tự: 401 → 403 → validate (400) → rate limit `admin-export-excel` 10/giờ/user (429 + `Retry-After` + `no-store`; Redis lỗi → 503) → đếm dòng (lead xoá mềm không tính; quá 20.000 dòng → 422, bảo thu hẹp bộ lọc) → audit `lead.export` (`meta`: `filters` + `rowCount`, không có dữ liệu khách; từ khoá tìm kiếm có thể là SĐT/email nên **không ghi nội dung**, chỉ ghi cờ `filters.search: true`; fail-closed: ghi lỗi → 500, không có file) → stream. Phản hồi `200`, `Content-Type` xlsx, `Content-Disposition: attachment; filename="tami-leads-YYYYMMDDHHmm.xlsx"`, `Cache-Control: private, no-store`, `X-Content-Type-Options: nosniff`, không có `Content-Length` (sinh dần, đọc DB từng trang 500 dòng theo keyset `(createdAt, id)`, dừng đúng `rowCount` đã audit). Mọi ô là chuỗi/số inline, không công thức; ô văn bản bắt đầu bằng `=`, `+`, `-`, `@`, tab, CR, LF dùng kiểu ô `quotePrefix` (văn bản thuần, nội dung giữ nguyên, SĐT `+84…` không bị thêm ký tự). Lead đã ẩn danh xuất `Đã ẩn danh` cho họ tên/SĐT, email và lời nhắn để trống, bất kể DB còn gì. Cột: mã, họ tên, SĐT, email, lời nhắn, nguồn, trạng thái, lý do không thành, sale phụ trách, ngày tạo, ngày giao, hoạt động gần nhất, ngôn ngữ. Nút trong admin (ẩn ở thùng rác — slot server đọc `params.segments[2] === "trash"`, vì endpoint chỉ xuất lead chưa xoá; ẩn trong list drawer — client đọc `useListDrawerContext().isInDrawer`, vì `filterOptions` của drawer không nằm trong `where`) chuyển bộ lọc của danh sách (Payload ghi dạng `or[0].and[...]`: equals của trạng thái/nguồn/sale, `status in` (mảng, hoặc chuỗi khi đọc lại từ URL) → `statusIn`, `assignedTo exists false` (boolean hoặc chuỗi `"false"` từ URL) → `unassigned=1`, `>=`/`<=` ngày tạo, giữ nguyên giá trị; `status equals` cùng `status in` hay `assignedTo equals` cùng `exists false` là mâu thuẫn → khoá nút) sang query. Ô tìm kiếm không còn làm khoá nút: nút gửi `search` kèm bộ lọc. Bộ lọc không chuyển được (nhiều nhánh `or`, toán tử/field khác, trùng field) thì nút bị khoá kèm thông báo liệt kê field + toán tử hỗ trợ theo đúng nhãn Payload vi đã ghi đè ở `src/lib/admin/payload-vi-overrides.ts` (BL-040: "là", "là một trong" cho Trạng thái, "có giá trị" = Không cho Sale phụ trách, "lớn hơn hoặc bằng", "nhỏ hơn hoặc bằng"), không xuất lặng lẽ toàn bộ lead. Server so `createdFrom ≤ createdTo` theo thời điểm (`Date.parse`), không so chuỗi.

> **As-built (layer-6-task-10) — tải CV:** `src/endpoints/admin/private-file-download.ts`. Thứ tự: chưa đăng nhập / tài khoản `active !== true` → 401; không phải admin → 403 (kể cả id không tồn tại, tránh dò); id không phải UUID → 400; không có bản ghi hoặc object S3 → 404. Stream thẳng từ bucket riêng (không presigned URL, không buffer). Audit `application.view_cv` (`collection: private-files`, `docId` = id file, IP hash, không PII) ghi sau khi mở object, trước byte đầu; ghi lỗi → huỷ stream, 500 (fail-closed). Header: `Content-Disposition: attachment` (tên ASCII đã làm sạch + `filename*` RFC 5987), `Content-Type` theo MIME đã lưu (lạ → `application/octet-stream`), `X-Content-Type-Options: nosniff`, `Content-Security-Policy: default-src 'none'; sandbox`, `Cache-Control: private, no-store`. `/api/private-files/file/:name` trả 404. Admin: nút "Tải CV" (ui field `cvDownload`) trong form hồ sơ.

> **As-built (layer-9-task-03) — giao lead:** `src/endpoints/admin/lead-assign.ts`, body `{ "staffId": "<uuid>" }`. Thứ tự: chưa đăng nhập / tài khoản `active !== true` → 401; không phải admin → 403 (kể cả id lead không tồn tại); `:id` không phải UUID → 400; lead không có hoặc đã xoá mềm → 404; body sai hoặc `staffId` không phải sale `active` → 400. Thành công `200` `{ success: true, data: { id, assignedTo, assignedAt, changed } }` (`changed: false` khi giao đúng người đang phụ trách: không sinh gì). Endpoint chỉ gọi `payload.update` đặt `assignedTo` (có kiểm access, người gọi là admin). Hook `recordAssignmentChange` (`src/hooks/leads/on-assignment-change.ts`, `leads.afterChange`) là nơi duy nhất sinh hệ quả, cùng transaction: 1 activity `assignment` (`fromAssignee`/`toAssignee`, `actor` = admin, trống nếu hệ thống), job `send-notification-email` template `lead-assigned` cho sale mới (không gửi khi bỏ giao hoặc lead đã ẩn danh), audit `lead.assign` (`meta` chỉ có id người cũ/mới; bỏ khi không có user, tức tự giao BR-12). Hook chỉ chạy khi `assignedTo` thật sự đổi, kể cả lúc tạo lead đã có `assignedTo` (endpoint công khai tự giao). `assignedAt` do hook `stampAssignedAt` (`beforeChange`) đặt = lúc đổi, xoá khi bỏ giao; giá trị client gửi lên bị bỏ. Admin bỏ giao trong form (`assignedTo = null`) cũng ghi activity + audit. Ngoài endpoint, mọi đường ghi (form admin, REST `PATCH /api/leads/:id`, Local API) đổi `assignedTo` sang người không phải sale `active` → 400 (`ValidationError`, path `assignedTo`); bỏ giao (null) và giữ nguyên giá trị vẫn được. Không gửi email phân công khi: bỏ giao, lead đã ẩn danh, lead đang trong thùng rác (`deletedAt`), người nhận không phải sale `active`.

Các thao tác CRUD còn lại (nội dung, lead, tài khoản) dùng REST tự sinh của Payload qua trang `/admin`.

## 5. Sự kiện nội bộ (hook → job)

Không có webhook ra ngoài ở giai đoạn 1.

| Sự kiện | Nơi phát | Việc |
|---|---|---|
| Nội dung đổi / xuất bản / ẩn | hook `afterChange`, `afterDelete` | `revalidateTag` các trang liên quan ở **cả hai ngôn ngữ** |
| Lead mới / gộp | endpoint 3.1 | Job `send-notification-email` |
| Lead được giao / giao lại (`assignedTo` đổi, từ endpoint `/assign`, form admin hoặc tự giao BR-12) | hook `leads.afterChange` (nơi **duy nhất**) | Activity `assignment` + job email + audit log `lead.assign` (trừ tự giao) |
| Hồ sơ ứng tuyển mới | endpoint 3.2 | Job email cho `notificationEmails` |
| Đổi slug nội dung đã xuất bản | hook `afterChange` (`create-slug-redirect`) | Tạo/cập nhật redirect 301 cho ngôn ngữ có slug đổi; `proxy.ts` trả 301 cho URL cũ |
| Lưu bản `vi` đang xuất bản / lưu global | hook `afterChange` | Job `translate-content` (dịch trường đã đổi sang `en`, BRD BR-08) |
| Nhân viên sửa trường `en` | hook `beforeChange` | `translation.enSource = manual` |

Gọi ra ngoài duy nhất: **Claude API** từ job `translate-content` (chỉ nội dung công khai, ARCHITECTURE §7).

### 5.1. `POST /api/admin/translations/:collection/:id`

"Dịch lại bằng AI" cho một bản ghi (hoặc `:collection = globals`, `:id = <slug global>`). Quyền: admin, hoặc sale là `author` của bản ghi (`docs/PERMISSION.md` §4). Đưa job `translate-content` vào hàng đợi với `force: true` (dịch đè cả bản `manual`, đặt lại `enSource = ai`). Kết quả `202`: `{ success: true, data: { queued: true } }`. Giới hạn 30 lần / giờ / user. Ghi audit log `content.retranslate`.

As-built (L10-T02): `401` chưa đăng nhập/tài khoản khoá; `404` khi `:collection` ngoài allowlist dịch (`projects`, `rentals`, `property-posts`, `news`, `services`, `job-postings`, `pages`, `categories`, `developers`, hoặc `globals` với `:id` ∈ `site-settings|homepage|header|footer`), `:id` sai dạng, không có bản ghi, hoặc người gọi không có quyền sửa bản ghi (theo `access.update` của collection/global: sale chỉ bài là `author`; `services`, `pages`, globals chỉ admin) — cùng một thông báo để không lộ bài của người khác; `429` (kèm `Retry-After`) khi quá 30 lần/giờ, `503` khi Redis lỗi; `409` khi dịch đang tắt (`site-settings.translationEnabled = false`) hoặc hạn mức tháng bằng 0 (job sẽ bỏ qua, nên không trả 202), `503` khi chưa cấu hình dịch; bản ghi đã xoá mềm là `404`. Audit ghi trước khi xếp job (fail-closed: lỗi audit → `500`, không xếp job). Job đang chờ của bản ghi được nâng lên `force: true` và chạy ngay (không chờ cửa sổ debounce), không tạo job thứ hai.

### 5.2. `POST /api/admin/translations/pages/:id/approve`

Duyệt bản EN của trang pháp lý (BR-08), đường DUY NHẤT bật `pages.hasEnglish` (mọi request khác, kể cả form admin, REST `PATCH /api/pages/:id` và Local API, bị hook `guardEnglishApproval` giữ nguyên giá trị đang lưu; form mở sẵn còn `hasEnglish = true` cũ không tự duyệt được). Chỉ admin; duyệt được MỌI bản EN khi `hasEnglish` còn tắt: bản AI chờ duyệt (`pending_review`), bản admin sửa/dán tay (status `none`), kể cả khi dịch tự động đang tắt hoặc hạn mức bằng 0. Mã: `401` chưa đăng nhập/tài khoản khoá; `403` không phải admin (kể cả id không tồn tại); `400` id không phải UUID; `404` không có trang hoặc đã xoá mềm; `409` khi `hasEnglish` đã bật; `422` khi bản EN thiếu trường bắt buộc (`title`, `content`), `details` liệt kê từng trường (`path`). Thành công `200`: `{ success: true, data: { id, hasEnglish: true } }`. Hook `approveEnglish` cùng transaction ghi audit `content.approve_translation` (fail-closed: audit lỗi → rollback, `500`) và chuyển status `done` (kể cả từ `none`). Mỗi lần job dịch (dịch lại hoặc tự dịch sau khi sửa bản Việt) ghi bản AI cho `pages` thì đặt `hasEnglish = false` + `pending_review` và làm mới `/en` + `/vi` của trang. **Sửa tay bản EN đã duyệt (BR-08, BL-013):** request không mang cờ duyệt và không phải job dịch, ghi locale `en` (hoặc `all`, nhánh `en`) làm đổi thật nội dung EN dịch được (`title`, `content`; cùng tiêu chí nhận diện sửa tay `hasManualEnglishEdit`) của trang đang `hasEnglish = true` → hook `revokeEnglishOnManualEdit` (`beforeChange`) đặt `hasEnglish = false` + `translation.status = pending_review` (giữ `enSource = manual`), `/en` ẩn và cache `/en` + `/vi` được làm mới tới khi admin gọi lại endpoint này. Lưu không đổi nội dung EN (gửi lại y nguyên, chỉ sửa bản `vi`, `version`, `effectiveDate`) giữ duyệt.
