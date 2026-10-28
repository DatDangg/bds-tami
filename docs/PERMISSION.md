# PERMISSION.md — Vai trò & phân quyền

> **Trạng thái:** thiết kế ban đầu (16/10/2026), theo `docs/BRD.md` v1.5, chưa có code.
> Khi có code, nguồn chuẩn là: field `role` của collection `staff`, các hàm trong `src/access/`, và cấu hình `access` của từng collection/global. Lệch thì **code thắng**, và phải cập nhật file này trong cùng task.

## 1. Vai trò

| Vai trò | Số lượng | Mô tả | Nguồn (code) |
|---|---|---|---|
| `admin` | 1 theo BRD; hệ thống cho phép thêm, luôn còn tối thiểu 1 tài khoản hoạt động | Quản trị toàn quyền | `staff.role` |
| `sale` | Nhiều | Đăng dự án, tin cho thuê, Đăng tin BĐS, tin tức, tuyển dụng (Dịch vụ và trang pháp lý chỉ admin); chăm sóc lead được giao | `staff.role` |
| *(khách)* | — | Không đăng nhập; chỉ xem nội dung đã xuất bản và gửi form | — |
| *(`members`)* | — | Để dành cho người đăng bên ngoài, **chưa tạo** | — |

Không hardcode chuỗi vai trò rải rác: dùng hằng chung `ROLES` trong `src/access/roles.ts`.

## 2. Hàm phân quyền dùng chung (`src/access/`)

| Hàm | Ý nghĩa |
|---|---|
| `isAdmin` | `user.role === 'admin'` |
| `isStaff` | Đã đăng nhập và `user.active === true` |
| `isAuthorOrAdmin` | Admin, hoặc `doc.author === user.id` (trả về query constraint `{ author: { equals: user.id } }` cho sale) |
| `isAssignedOrAdmin` | Admin, hoặc `doc.assignedTo === user.id` |
| `publishedOnly` | Khách: chỉ bản ghi `status` công khai (§3 ERD) và chưa xoá mềm. Staff: thấy tất cả |

Hàm tạo dùng chung: `ownedByUserOrAdmin(field)` (nền của hai hàm `isAuthorOrAdmin`/`isAssignedOrAdmin`; `staff` dùng với `id` để sale chỉ thấy hồ sơ mình), `makePublishedOnly(statuses)` / `buildPublicWhere` (điều kiện công khai tập trung một chỗ; `rentalsPublishedOnly` cho `rentals` gồm `published` + `rented`). Điều kiện xoá mềm là `deletedAt` không tồn tại, nên collection dùng `publishedOnly` phải bật `trash: true`.

Tài khoản `active = false` bị chặn đăng nhập và mọi quyền.

## 3. Ma trận quyền theo collection

Ký hiệu: ✔ = được · **Mình** = chỉ bản ghi do mình đăng (`author`) · **Được giao** = chỉ bản ghi `assignedTo` là mình · — = không.

### 3.1. Nội dung

| Collection | Khách: đọc | Sale: tạo | Sale: đọc (admin) | Sale: sửa | Sale: xoá | Admin |
|---|---|---|---|---|---|---|
| `projects` | Đã xuất bản | ✔ | ✔ tất cả | Mình ⚠️ | Mình ⚠️ | ✔ |
| `rentals` | Đã xuất bản + Đã thuê | ✔ | ✔ tất cả | Mình ⚠️ | Mình ⚠️ | ✔ |
| `property-posts` | Đã xuất bản | ✔ | ✔ tất cả | Mình ⚠️ | Mình ⚠️ | ✔ |
| `news` | Đã xuất bản và `publishedAt` trống hoặc ≤ now (hẹn giờ, BL-091) | ✔ | ✔ tất cả | Mình ⚠️ | Mình ⚠️ | ✔ |
| `job-postings` | Đã xuất bản | ✔ | ✔ tất cả | Mình ⚠️ | Mình ⚠️ | ✔ |
| `services` | Đã xuất bản | — | ✔ | — | — | ✔ |
| `pages` | Đã xuất bản | — | ✔ | — | — | ✔ |
| `media` | ✔ | ✔ (upload) | ✔ | Mình | — | ✔ |

⚠️ Giả định A1 (BRD §8): sale chỉ sửa/xoá bài của mình. "Xoá" là xoá mềm; chỉ admin khôi phục / xoá hẳn.

### 3.2. Danh mục nền & cấu hình

| Collection / Global | Khách | Sale | Admin |
|---|---|---|---|
| `provinces`, `wards` | Đọc | Đọc | ✔ |
| `categories` | Đọc | Đọc | ✔ |
| `developers` | Đọc | Đọc ⚠️ | ✔ |
| `site-settings`, `homepage`, `header`, `footer` | Đọc (phần công khai) | — | ✔ |
| `redirects` | — | — | ✔ |

⚠️ Sale đăng dự án mà chưa có chủ đầu tư thì nhờ admin tạo. Mở quyền tạo `developers` cho sale nếu thấy vướng.

### 3.3. Dữ liệu khách hàng

| Collection | Khách | Sale | Admin |
|---|---|---|---|
| `leads` | **Chỉ tạo** qua endpoint `POST /api/public/leads` | Đọc + sửa **Được giao**; không xoá, không xuất | ✔ (đọc, sửa, phân công, xoá mềm, xuất Excel) |
| `lead-activities` | — | Đọc + thêm trên lead **Được giao** | Đọc + thêm |
| `job-applications` | **Chỉ tạo** qua `POST /api/public/job-applications` (endpoint dùng Local API `overrideAccess`; không ai, kể cả admin, tạo được qua REST/admin) | — (403 đọc/sửa/xoá) | Đọc; sửa **chỉ `status` và `note`** (trường khách gửi là chỉ đọc, `ipHash` không bao giờ trả ra); xoá (kèm xoá CV, ghi audit không PII) |
| `newsletter-subscribers` | **Chỉ tạo** qua `POST /api/public/newsletter` (BL-054 P1-T04; Local API, không ai kể cả admin tạo được qua REST/admin) | — (403 đọc/sửa/xoá; ẩn khỏi menu) | Đọc; sửa (chỉ `status`: các trường consent / nguồn có field access `update: denyAll`, khoá cả form admin lẫn REST `PATCH`); xoá; xuất Excel `GET /api/admin/newsletter-subscribers/export` (audit `newsletter.export`) |
| `private-files` | — | — | Đọc + xoá + tải qua endpoint kiểm quyền; **không tạo/sửa** qua REST/admin (chỉ endpoint nộp CV bằng Local API `overrideAccess`); chỉ chứa CV |

> As-built (L8-T02): qua API/admin chỉ thêm loại `note`/`call` (cả admin; form admin chỉ liệt kê hai loại này, loại khác gửi qua API bị 403); `status_change`/`assignment`/`merged`/`email_sent` do hệ thống ghi. Sale chỉ thêm trên lead được giao (lead người khác → 403). Sale chỉ đổi `status` + `lostReason` của lead được giao; sửa dữ liệu khách chỉ admin, và lead đã ẩn danh không sửa được dữ liệu khách. Không ai sửa/xoá activity.

### 3.4. Hệ thống

| Collection | Sale | Admin |
|---|---|---|
| `staff` | Đọc + sửa **hồ sơ của chính mình** (tên, SĐT, ảnh, mật khẩu) | ✔ (tạo, khoá, đặt lại mật khẩu, đổi vai trò). Luôn còn ≥ 1 admin hoạt động: chặn khoá / hạ quyền / xoá admin cuối (kể cả `overrideAccess`). Sửa hàng loạt (`where`) đổi `role`/`active` hoặc xoá mà chạm admin đang hoạt động bị từ chối — đổi admin phải làm từng người |
| `audit-logs` | — | Chỉ đọc (không ai sửa/xoá) |
| `click-events`, `click-stats-daily` | — | Chỉ đọc |
| `news-views-daily` (BL-054) | — (403; ẩn khỏi menu) | Chỉ đọc (không ai tạo / sửa / xoá qua API; endpoint `POST /api/public/news-views` ghi bằng Local API / SQL) |
| `translation-usage` | — | Chỉ đọc |

## 4. Quyền theo trường (field-level)

| Collection | Trường | Quy tắc |
|---|---|---|
| Mọi nội dung | `author` | Tự gán người tạo; **chỉ admin đổi**. Sale không đọc được hồ sơ staff khác nên cột/ô "Người tạo" lấy tên (`fullName`, thiếu thì email) từ trường ảo `authorName` (chỉ staff đang hoạt động đọc được; khách/API công khai không có; không mở hồ sơ staff — BL-082) |
| Mọi nội dung | `isFeatured` | **Chỉ admin** (khối nổi bật trên trang chủ do admin quyết) |
| `rentals`, `leads` | `code` | Chỉ đọc với tất cả (hệ thống sinh; `rentals`: đã làm, hook từ sequence) |
| `rentals` | `rentedAt` | Chỉ đọc với tất cả (hệ thống ghi khi chuyển `rented`) |
| `rentals` | `address`, `location` | Nhân viên luôn đọc; **khách chỉ đọc khi `showExactAddress = true`** (chặn ở cấp trường nên áp cho cả REST/GraphQL và phiên bản; khách không lọc/sắp xếp theo hai trường này) |
| `rentals` | `searchText` | Chỉ nhân viên đọc/lọc được (ẩn khỏi API); hệ thống ghi |
| `leads` | `assignedTo`, `assignedAt` | **Chỉ admin** sửa; hệ thống tự gán theo BR-12. As-built L9-T03: `assignedAt` thực tế chỉ hệ thống đặt, giá trị gửi lên bị bỏ; `POST /api/admin/leads/:id/assign` kiểm 401 → 403 → 400 → 404, sale gọi luôn 403; mọi đường (endpoint, form/REST) chỉ nhận sale `active` khi đổi người phụ trách, admin/sale bị khoá trả 400 |
| `leads` | `phone`, `email`, `fullName`, `message`, `locale` | Chỉ đọc với sale (không sửa dữ liệu khách gửi) |
| `staff` | `role`, `active` | **Chỉ admin** |
| Mọi nội dung + globals | `translation.*` | Chỉ đọc với tất cả (hệ thống ghi). Sửa tay trường `en` thì được theo quyền sửa bài; nút "Dịch lại bằng AI" theo quyền sửa bài (`POST /api/admin/translations/...`) |
| `pages` (pháp lý) | `hasEnglish` | **Chỉ admin** bật sau khi duyệt bản dịch (BRD BR-08) |

## 5. Thứ tự kiểm tra trên endpoint tuỳ biến

> Phạm vi: luật "trả 404 thay vì 403" của mục này áp cho endpoint tự viết `/api/admin/*`. REST mặc định của Payload (`/api/<collection>/:id`) trả 403 khi sale `update` bản ghi không được giao (vd `leads`, L8-T02) — chấp nhận (id là uuid, không đoán được); không đổi hành vi Payload.

> Áp dụng cho các endpoint trong `src/endpoints/` (xem `docs/API_SPEC.md`). Collection mặc định của Payload dùng `access` như §3–4.

**Endpoint công khai** (`/api/public/*`):
1. `rateLimit`: theo IP, cấu hình từng endpoint (429 nếu vượt).
2. `verifyTurnstile`: token captcha hợp lệ (400 nếu sai).
3. `validate`: schema (zod) của body, kiểm tra `consent === true` (400).
4. handler.

**Endpoint quản trị** (`/api/admin/*`):
1. `authenticate`: session Payload hợp lệ, `active === true` (401).
2. `authorize(role)`: đúng vai trò (403).
3. `checkOwnership`: bản ghi theo `:id` thuộc phạm vi user (`isAuthorOrAdmin` / `isAssignedOrAdmin`), chặn BOLA/IDOR (`skills/security/bola-idor.md`). Không thuộc thì trả 404 để không lộ sự tồn tại.
4. `rateLimit`: cho thao tác nặng (xuất Excel).
5. `validate` → handler → `auditLog` nếu là thao tác nhạy cảm (§6).

> As-built (L10-T02): `POST /api/admin/translations/:collection/:id` kiểm theo thứ tự 401 → allowlist + định dạng id (404) → rate limit 30/giờ/user (429; Redis lỗi 503) → quyền sửa theo `access.update` của collection/global (404, cùng thông báo) → trạng thái dịch (409/503) → audit fail-closed → xếp job (202). `POST /api/admin/translations/pages/:id/approve`: 401 → 403 (không phải admin, trước khi đọc DB) → 400 → 404 → 409 → 422 → update + audit cùng transaction. Chi tiết: `docs/API_SPEC.md` §5.1, §5.2.

## 6. Thao tác bắt buộc ghi audit log

Phân công / đổi người phụ trách lead · Xuất Excel lead · Xem / tải CV · Xoá mềm, khôi phục, xoá hẳn nội dung · Tạo / khoá / mở lại / xoá tài khoản, đổi vai trò, đặt lại mật khẩu · Đăng nhập thất bại · Bấm "Dịch lại bằng AI" · Duyệt bản tiếng Anh trang pháp lý.

## 7. Bảo vệ trang `/admin`

- Mật khẩu tối thiểu 10 ký tự; khoá tạm 10 phút sau 5 lần sai.
- **Lớp xác thực thứ 2:** đặt `/admin` sau **Cloudflare Access** (gói free, xác thực bằng mã OTP gửi email công ty). Payload chưa có 2FA tích hợp sẵn, nên đây là cách gọn nhất để có 2 lớp.
- Session hết hạn sau 8 giờ không hoạt động. Cơ chế: token `payload-token` hạn 8 giờ (`tokenExpiration` 28800, hạn tuyệt đối); provider admin `SessionKeepAlive` gọi `refreshCookieAsync()` của Payload khi người dùng còn thao tác (tối đa 1 lần/15 phút, không gọi khi tab ẩn), token mới thêm 8 giờ và đồng bộ sang các tab admin khác. Refresh bị từ chối (401/403) → Payload chuyển màn `/admin/logout-inactivity` rồi về đăng nhập. Cookie HttpOnly, SameSite=Lax, Secure khi chạy production.

## Ghi chú sync

- Thêm/sửa vai trò, hàm access, hoặc quyền của collection thì **cập nhật file này trong cùng task**.
- Mở rộng cho `members` (người đăng bên ngoài): thêm cột vai trò mới vào §3, mặc định **không** có quyền gì với `leads` của người khác.
