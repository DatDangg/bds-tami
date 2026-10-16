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
| 429 | Vượt giới hạn gửi |
| 500 | Lỗi hệ thống |

## 3. Endpoint công khai

| Method | Path | Mục đích | Giới hạn | BRD |
|---|---|---|---|---|
| `POST` | `/api/public/leads` | Gửi form liên hệ / để lại thông tin | 5 lần / 10 phút / IP | FR-PUB-03, 05, 07, 11; BR-10…16 |
| `POST` | `/api/public/job-applications` | Nộp hồ sơ ứng tuyển (multipart) | 3 lần / giờ / IP | FR-PUB-09; BR-20, 21 |
| `GET` | `/api/public/rentals` | Tìm & lọc tin cho thuê | 60 lần / phút / IP | FR-PUB-04 |
| `POST` | `/api/public/click-events` | Ghi lượt bấm Hotline/Zalo/Fanpage | 30 lần / phút / IP | FR-PUB-12 |
| `GET` | `/api/health` | Health check cho deploy & giám sát | — | ARCHITECTURE §6.3 |

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

Kết quả `200`: `{ success: true, data: { received: true } }`. Luôn giống nhau dù lead được tạo mới hay gộp vào lead cũ (không lộ dữ liệu đã có).

Xử lý: rate limit → Turnstile → validate → chống trùng (BR-15) → tạo/gộp lead → phân công (BR-12) → đưa job email vào hàng đợi (BR-13). Chi tiết: `docs/ARCHITECTURE.md` §5.2.

### 3.2. `POST /api/public/job-applications`

`multipart/form-data`: `jobPostingId`, `fullName`, `phone`, `email`, `message?`, `consent=true`, `turnstileToken`, `cv` (file PDF/DOC/DOCX ≤ 5MB, kiểm tra MIME thật).

Vị trí phải đang `published` và chưa quá `deadline`, nếu không trả 400. File lưu vào `private-files`. Kết quả `200`: `{ success: true, data: { received: true } }`.

### 3.3. `GET /api/public/rentals`

Query params (đồng bộ với URL trang `/cho-thue` để chia sẻ được):

| Param | Ví dụ | Ghi chú |
|---|---|---|
| `q` | `studio quan 1` | Từ khoá, gõ không dấu vẫn ra (ERD §6) |
| `category` | `can-ho-dich-vu` | slug danh mục (gồm danh mục con) |
| `province` | `ho-chi-minh` | slug |
| `ward` | `ben-thanh` | slug |
| `priceMin`, `priceMax` | `5000000`, `15000000` | VNĐ/tháng |
| `areaMin`, `areaMax` | `25`, `60` | m² |
| `bedrooms` | `2` | `4` nghĩa là 4+ |
| `furnishing` | `full` | |
| `sort` | `newest` \| `price_asc` \| `price_desc` | Mặc định `newest` |
| `page`, `limit` | `1`, `12` | `limit` tối đa 48 |

Kết quả: `{ success: true, data: { items: RentalCard[], total, page, totalPages } }`. `RentalCard` chỉ gồm trường công khai (mã tin, tiêu đề, slug, ảnh đại diện, giá, diện tích, phòng ngủ, khu vực, trạng thái). **Không** trả `address` khi `showExactAddress = false`. Không bao giờ trả trường nội bộ.

Gọi qua `SearchService`. Cache: `s-maxage=60`.

### 3.4. `POST /api/public/click-events`

Body: `{ type: "hotline" | "zalo" | "fanpage", pagePath, refCollection?, refId? }`. Gửi bằng `navigator.sendBeacon`. Trả `204`.

## 4. Endpoint quản trị

| Method | Path | Quyền | Mục đích | BRD |
|---|---|---|---|---|
| `GET` | `/api/admin/leads/export` | admin | Xuất lead ra `.xlsx` theo bộ lọc hiện tại (trạng thái, nguồn, sale, khoảng ngày). Ghi audit log `lead.export` | FR-ADM-10 |
| `POST` | `/api/admin/leads/:id/assign` | admin | Giao lead cho sale `{ staffId }`. Sinh activity `assignment`, email cho sale, ghi audit log | FR-ADM-09; BR-12, 13 |
| `GET` | `/api/admin/private-files/:id/download` | admin | Tải CV. Ghi audit log `application.view_cv` | FR-ADM-05 |
| `GET` | `/api/admin/dashboard` | admin (toàn bộ), sale (số liệu lead của mình) | Số liệu dashboard | FR-ADM-14 |

Thứ tự kiểm tra: `docs/PERMISSION.md` §5. Giới hạn: xuất Excel 10 lần / giờ / user.

Các thao tác CRUD còn lại (nội dung, lead, tài khoản) dùng REST tự sinh của Payload qua trang `/admin`.

## 5. Sự kiện nội bộ (hook → job)

Không có webhook ra ngoài ở giai đoạn 1.

| Sự kiện | Nơi phát | Việc |
|---|---|---|
| Nội dung đổi / xuất bản / ẩn | hook `afterChange`, `afterDelete` | `revalidateTag` các trang liên quan |
| Lead mới / gộp | endpoint 3.1 | Job `send-notification-email` |
| Lead được giao | hook `leads.afterChange` | Activity `assignment` + job email |
| Hồ sơ ứng tuyển mới | endpoint 3.2 | Job email cho `notificationEmails` |
| Đổi slug nội dung đã xuất bản | hook `beforeChange` | Tạo redirect 301 |
