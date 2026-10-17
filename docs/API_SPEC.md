# API Specification — Website TAMI

> **Trạng thái:** thiết kế ban đầu (16/10/2026), chưa có code.
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

**Ngôn ngữ** (song ngữ, BRD FR-PUB-18): endpoint công khai nhận `locale` = `vi` (mặc định) | `en`. Giá trị khác trả 400. Với `locale=en`, chỉ trả nội dung có `hasEnglish = true` và trả trường chữ bản tiếng Anh (không fallback sang tiếng Việt, ERD §1.1). Thông báo lỗi trong `error` / `details` trả theo `locale` để hiện thẳng lên form. Payload Local API / REST dùng tham số `locale` có sẵn của Payload (`fallbackLocale: false` ở phía công khai).

**Xác thực**: session cookie của Payload (`payload-token`, HttpOnly, Secure, SameSite=Lax). Không có API key công khai.

**Response contract** (chỉ áp dụng cho endpoint tuỳ biến, qua helper `ok()` / `fail()`; REST tự sinh của Payload giữ format riêng của Payload):

```
Thành công: { "success": true, "data": <payload> }
Lỗi:       { "success": false, "error": "<message>", "details": [...] }
```

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
| `pageUrl` | string | | |
| `locale` | `vi` \| `en` | | Mặc định `vi`. Lưu vào `leads.locale` (BR-17); dùng cho thông báo lỗi |

Kết quả `200`: `{ success: true, data: { received: true } }`. Luôn giống nhau dù lead được tạo mới hay gộp vào lead cũ (không lộ dữ liệu đã có).

Xử lý: rate limit → Turnstile → validate → chống trùng (BR-15) → tạo/gộp lead → phân công (BR-12) → đưa job email vào hàng đợi (BR-13). Chi tiết: `docs/ARCHITECTURE.md` §5.2.

### 3.2. `POST /api/public/job-applications`

`multipart/form-data`: `jobPostingId`, `fullName`, `phone`, `email`, `message?`, `consent=true`, `turnstileToken`, `locale?` (`vi` | `en`, lưu vào `job-applications.locale`), `cv` (file PDF/DOC/DOCX ≤ 5MB, kiểm tra MIME thật).

Vị trí phải đang `published` và chưa quá `deadline`, nếu không trả 400. File lưu vào `private-files`. Kết quả `200`: `{ success: true, data: { received: true } }`.

### 3.3. `GET /api/public/rentals`

Query params (đồng bộ với URL trang `/cho-thue` để chia sẻ được):

| Param | Ví dụ | Ghi chú |
|---|---|---|
| `locale` | `en` | Mặc định `vi`; quyết định slug danh mục, trường chữ trả về và `searchText` dùng để tìm |
| `q` | `studio quan 1` | Từ khoá, gõ không dấu vẫn ra (ERD §6) |
| `category` | `can-ho-dich-vu` · `serviced-apartments` | slug danh mục theo `locale` (gồm danh mục con) |
| `province` | `ho-chi-minh` | slug |
| `ward` | `ben-thanh` | slug |
| `priceMin`, `priceMax` | `5000000`, `15000000` | VNĐ/tháng |
| `areaMin`, `areaMax` | `25`, `60` | m² |
| `bedrooms` | `2` | `4` nghĩa là 4+ |
| `furnishing` | `full` | |
| `sort` | `newest` \| `price_asc` \| `price_desc` | Mặc định `newest` |
| `page`, `limit` | `1`, `12` | `limit` tối đa 48 |

Kết quả: `{ success: true, data: { items: RentalCard[], total, page, totalPages } }`. `RentalCard` chỉ gồm trường công khai (mã tin, tiêu đề, slug, ảnh đại diện, giá, diện tích, phòng ngủ, khu vực, trạng thái), chữ và slug theo `locale`. **Không** trả `address` khi `showExactAddress = false`. Không bao giờ trả trường nội bộ.

Gọi qua `SearchService`. Cache: `s-maxage=60` (cache key gồm `locale`).

### 3.4. `POST /api/public/click-events`

Body: `{ type: "hotline" | "zalo" | "fanpage", pagePath, refCollection?, refId? }`. Gửi bằng `navigator.sendBeacon`. Trả `204`.

| Trường | Ràng buộc |
|---|---|
| `type` | `hotline` \| `zalo` \| `fanpage` |
| `pagePath` | bắt đầu bằng `/`, 1–500 ký tự |
| `refCollection` | tuỳ chọn (null được), slug `[a-z0-9-]`, ≤ 64 ký tự |
| `refId` | tuỳ chọn (null được), `[A-Za-z0-9_-]`, ≤ 64 ký tự |

Body là JSON, nhận cả `Content-Type: text/plain` (sendBeacon), tối đa 2000 ký tự. Không cần Turnstile. Mã lỗi: `400` body sai, `429` vượt 30 lần/phút/IP (kèm `Retry-After`), `503` Redis không dùng được (theo §2). Code: `src/endpoints/public/click-events.ts`.

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

## 4. Endpoint quản trị

| Method | Path | Quyền | Mục đích | BRD |
|---|---|---|---|---|
| `GET` | `/api/admin/leads/export` | admin | Xuất lead ra `.xlsx` theo bộ lọc hiện tại (trạng thái, nguồn, sale, khoảng ngày). Ghi audit log `lead.export` | FR-ADM-10 |
| `POST` | `/api/admin/leads/:id/assign` | admin | Giao lead cho sale `{ staffId }`: chỉ cập nhật `assignedTo` qua Payload Local API; activity `assignment`, email cho sale và audit log `lead.assign` do **một** nơi duy nhất là hook `leads.afterChange` sinh (§5), để không sinh trùng khi admin đổi `assignedTo` trong form | FR-ADM-09; BR-12, 13 |
| `GET` | `/api/admin/private-files/:id/download` | admin | Tải CV. Ghi audit log `application.view_cv` | FR-ADM-05 |
| `GET` | `/api/admin/dashboard` | admin (toàn bộ), sale (số liệu lead của mình) | Số liệu dashboard (admin thấy thêm: số bài dịch lỗi / chờ duyệt, chi phí dịch tháng này) | FR-ADM-14 |
| `POST` | `/api/admin/translations/:collection/:id` | admin; sale với bài của mình | "Dịch lại bằng AI" (§5.1) | FR-ADM-18 |

Thứ tự kiểm tra: `docs/PERMISSION.md` §5. Giới hạn: xuất Excel 10 lần / giờ / user.

Các thao tác CRUD còn lại (nội dung, lead, tài khoản) dùng REST tự sinh của Payload qua trang `/admin`.

## 5. Sự kiện nội bộ (hook → job)

Không có webhook ra ngoài ở giai đoạn 1.

| Sự kiện | Nơi phát | Việc |
|---|---|---|
| Nội dung đổi / xuất bản / ẩn | hook `afterChange`, `afterDelete` | `revalidateTag` các trang liên quan ở **cả hai ngôn ngữ** |
| Lead mới / gộp | endpoint 3.1 | Job `send-notification-email` |
| Lead được giao / giao lại (`assignedTo` đổi, từ endpoint `/assign`, form admin hoặc tự giao BR-12) | hook `leads.afterChange` (nơi **duy nhất**) | Activity `assignment` + job email + audit log `lead.assign` (trừ tự giao) |
| Hồ sơ ứng tuyển mới | endpoint 3.2 | Job email cho `notificationEmails` |
| Đổi slug nội dung đã xuất bản | hook `beforeChange` | Tạo redirect 301 cho ngôn ngữ có slug đổi |
| Lưu bản `vi` đang xuất bản / lưu global | hook `afterChange` | Job `translate-content` (dịch trường đã đổi sang `en`, BRD BR-08) |
| Nhân viên sửa trường `en` | hook `beforeChange` | `translation.enSource = manual` |

Gọi ra ngoài duy nhất: **Claude API** từ job `translate-content` (chỉ nội dung công khai, ARCHITECTURE §7).

### 5.1. `POST /api/admin/translations/:collection/:id`

"Dịch lại bằng AI" cho một bản ghi (hoặc `:collection = globals`, `:id = <slug global>`). Quyền: admin, hoặc sale là `author` của bản ghi (`docs/PERMISSION.md` §4). Đưa job `translate-content` vào hàng đợi với `force: true` (dịch đè cả bản `manual`, đặt lại `enSource = ai`). Kết quả `202`: `{ success: true, data: { queued: true } }`. Giới hạn 30 lần / giờ / user. Ghi audit log `content.retranslate`.
