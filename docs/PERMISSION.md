# PERMISSION.md — Vai trò & phân quyền

> **Trạng thái:** thiết kế ban đầu (16/10/2026), theo `docs/BRD.md` v1.3, chưa có code.
> Khi có code, nguồn chuẩn là: field `role` của collection `staff`, các hàm trong `src/access/`, và cấu hình `access` của từng collection/global. Lệch thì **code thắng**, và phải cập nhật file này trong cùng task.

## 1. Vai trò

| Vai trò | Số lượng | Mô tả | Nguồn (code) |
|---|---|---|---|
| `admin` | 1 (tối thiểu 1 tài khoản luôn hoạt động) | Quản trị toàn quyền | `staff.role` |
| `sale` | Nhiều | Đăng bài mọi loại, chăm sóc lead được giao | `staff.role` |
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

Tài khoản `active = false` bị chặn đăng nhập và mọi quyền.

## 3. Ma trận quyền theo collection

Ký hiệu: ✔ = được · **Mình** = chỉ bản ghi do mình đăng (`author`) · **Được giao** = chỉ bản ghi `assignedTo` là mình · — = không.

### 3.1. Nội dung

| Collection | Khách: đọc | Sale: tạo | Sale: đọc (admin) | Sale: sửa | Sale: xoá | Admin |
|---|---|---|---|---|---|---|
| `projects` | Đã xuất bản | ✔ | ✔ tất cả | Mình ⚠️ | Mình ⚠️ | ✔ |
| `rentals` | Đã xuất bản + Đã thuê | ✔ | ✔ tất cả | Mình ⚠️ | Mình ⚠️ | ✔ |
| `property-posts` | Đã xuất bản | ✔ | ✔ tất cả | Mình ⚠️ | Mình ⚠️ | ✔ |
| `news` | Đã xuất bản | ✔ | ✔ tất cả | Mình ⚠️ | Mình ⚠️ | ✔ |
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
| `job-applications` | **Chỉ tạo** qua `POST /api/public/job-applications` | — | ✔ |
| `private-files` | — | — | ✔ (tải qua endpoint kiểm quyền) |

### 3.4. Hệ thống

| Collection | Sale | Admin |
|---|---|---|
| `staff` | Đọc + sửa **hồ sơ của chính mình** (tên, SĐT, ảnh, mật khẩu) | ✔ (tạo, khoá, đặt lại mật khẩu, đổi vai trò) |
| `audit-logs` | — | Chỉ đọc (không ai sửa/xoá) |
| `click-events`, `click-stats-daily` | — | Chỉ đọc |

## 4. Quyền theo trường (field-level)

| Collection | Trường | Quy tắc |
|---|---|---|
| Mọi nội dung | `author` | Tự gán người tạo; **chỉ admin đổi** |
| Mọi nội dung | `isFeatured` | **Chỉ admin** (khối nổi bật trên trang chủ do admin quyết) |
| `rentals`, `leads` | `code` | Chỉ đọc với tất cả (hệ thống sinh) |
| `leads` | `assignedTo`, `assignedAt` | **Chỉ admin** sửa; hệ thống tự gán theo BR-12 |
| `leads` | `phone`, `email`, `fullName`, `message` | Chỉ đọc với sale (không sửa dữ liệu khách gửi) |
| `staff` | `role`, `active` | **Chỉ admin** |

## 5. Thứ tự kiểm tra trên endpoint tuỳ biến

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

## 6. Thao tác bắt buộc ghi audit log

Phân công / đổi người phụ trách lead · Xuất Excel lead · Xem / tải CV · Xoá mềm, khôi phục, xoá hẳn nội dung · Tạo / khoá tài khoản, đổi vai trò · Đăng nhập thất bại.

## 7. Bảo vệ trang `/admin`

- Mật khẩu tối thiểu 10 ký tự; khoá tạm 10 phút sau 5 lần sai.
- **Lớp xác thực thứ 2:** đặt `/admin` sau **Cloudflare Access** (gói free, xác thực bằng mã OTP gửi email công ty). Payload chưa có 2FA tích hợp sẵn, nên đây là cách gọn nhất để có 2 lớp.
- Session hết hạn sau 8 giờ không hoạt động.

## Ghi chú sync

- Thêm/sửa vai trò, hàm access, hoặc quyền của collection thì **cập nhật file này trong cùng task**.
- Mở rộng cho `members` (người đăng bên ngoài): thêm cột vai trò mới vào §3, mặc định **không** có quyền gì với `leads` của người khác.
