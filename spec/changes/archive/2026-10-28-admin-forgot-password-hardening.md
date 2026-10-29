---
id: admin-forgot-password-hardening
type: bug
status: done
created: 2026-10-28
---

# Quên mật khẩu admin: chống dò tài khoản, log lỗi gửi mail, cảnh báo SMTP placeholder, reset mail theo EMAIL_ALLOWLIST (follow-up BL-095)

## Yêu cầu
Gia cố luồng quên mật khẩu admin (`/api/staff/forgot-password`) và cấu hình email — phát hiện khi điều tra BL-095.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: `/admin/login` → Quên mật khẩu; `POST /api/staff/forgot-password`; staging/prod
- Bước tái hiện: SMTP lỗi (vd `smtp.invalid`) → gửi quên mật khẩu với email có tài khoản và email không có
- Expected: phản hồi giống nhau cho cả hai; lỗi gửi mail được log (không lộ secret); app cảnh báo khi SMTP là placeholder; staging chỉ gửi reset mail tới địa chỉ trong `EMAIL_ALLOWLIST`
- Actual: 500 (email tồn tại) vs 200 (không tồn tại) → dò được tài khoản; reset mail bỏ qua `EMAIL_ALLOWLIST`; không có cảnh báo SMTP placeholder lúc khởi động

## Acceptance (bắt buộc)
- [x] Email tồn tại / không tồn tại → cùng mã HTTP + cùng body, kể cả khi SMTP lỗi; thời gian phản hồi không chênh rõ
- [x] Lỗi gửi mail reset được log server (không có SMTP_PASS / token reset trong log)
- [x] Khởi động với SMTP_HOST placeholder (`smtp.invalid`, rỗng…) → log cảnh báo rõ (không chặn khởi động dev/test)
- [x] Staging (`EMAIL_ALLOWLIST` có đặt) → reset mail tới địa chỉ ngoài allowlist không gửi, theo cùng cơ chế các mail khác
- [x] Test khoá các hành vi trên

## Ghi chú
User duyệt 2026-10-28 ("Có, thêm task"). Đánh đổi đã nêu với user: phản hồi giống nhau → form vẫn báo thành công khi gửi lỗi, lỗi chỉ thấy ở log. Nguồn root cause: `spec/changes/2026-10-28-admin-forgot-password-email.md` (BL-095). Code: `src/lib/email/transport.ts`, `src/payload.config.ts:72`, collection Staff/Users auth, cơ chế `EMAIL_ALLOWLIST`.

## Close-out (change-request, 2026-10-29)
- Task `tasks/bug-admin-forgot-password-hardening/phase-1-task-01.md` — STRICT PASS r1 (`.context/review-reports/bug-admin-forgot-password-hardening-phase-1-task-01-round-1-review.md`).
- Fix: endpoint `src/endpoints/admin/staff-forgot-password.ts` (đồng nhất 200, handler mặc định chạy nền, log whitelist), adapter `src/lib/email/transport.ts` lọc `EMAIL_ALLOWLIST`, `src/lib/email/smtp-config.ts` + `onInit` cảnh báo placeholder.
- Spec: no spec change (1.61.0), test-scope v104. Doc: `docs/API_SPEC.md` §4, `docs/ARCHITECTURE.md` bảng env.
- Follow-up (MINOR, chưa làm): rate limit theo IP cho forgot-password (việc nền không bị chặn số lượng với email không tồn tại); production không viết lại `to` dạng chuỗi; email toàn khoảng trắng → 400; test assert SMTP_PASS; gộp helper tìm endpoint mặc định với reset-password.
