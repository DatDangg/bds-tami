---
id: admin-forgot-password-email
type: bug
status: pending
created: 2026-10-28
---

# Admin: "Quên mật khẩu" không gửi được email đặt lại mật khẩu (QA sheet bug 17, Cao)

## Yêu cầu
Quên mật khẩu ở `/admin/login` phải gửi email hướng dẫn đặt lại mật khẩu tới email đã đăng ký; giao diện báo phù hợp.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: `/admin/login` → Quên mật khẩu, Admin, server test `187-52-119-50.sslip.io`
- Bước tái hiện: chọn Quên mật khẩu → nhập email đã đăng ký → gửi → kiểm tra hộp thư + Spam/Junk
- Expected: nhận email đặt lại mật khẩu, link dùng được
- Actual: không nhận được email

## Acceptance (bắt buộc)
- [ ] Root cause xác định (code vs cấu hình SMTP/env server vs nhà cung cấp mail) có evidence
- [ ] Email đặt lại mật khẩu tới hộp thư trên staging; link đặt lại hoạt động
- [ ] Lỗi gửi mail được log (không lộ secret), giao diện không báo thành công giả nếu có thể phân biệt
- [ ] Không lộ việc email có tồn tại hay không (chống dò tài khoản)

## Ghi chú
Nguồn: QA sheet 28/10/2026 dòng 17. Email qua `src/lib/email/transport.ts` (nodemailer → SMTP Brevo, `skipVerify: true`). Nếu root cause là cấu hình server (env/SMTP/domain gửi) → cần user cung cấp/xác nhận, không tự đổi secret.

## Root cause (change-request, 2026-10-28) — BLOCKED chờ user
- **Cấu hình server, không phải code.** Container `tami-staging-app` (nginx `187-52-119-50.sslip.io` → `tami_staging_app`) chạy với `SMTP_HOST=smtp.invalid`, `SMTP_USER=placeholder`, `EMAIL_FROM_ADDRESS` không đặt. Đây là giá trị TẠM chốt lúc dựng staging (`.context/runs/build-tami-website-layer-6-task-01.md` 2026-10-18T15:40Z: "chưa có Brevo … SMTP giả smtp.invalid … TẠM, thay trước M3"). `tami-app` (prod `tami.genieplatform.cloud`) và `tami-staging-jobs` cũng `smtp.invalid`.
- Evidence log `docker logs tami-staging-app`: 2 lỗi `getaddrinfo ENOTFOUND smtp.invalid` lúc 2026-10-28T07:51:53Z và 07:52:17Z (đúng lúc QA thử).
- Luồng code đúng: `forgotPasswordOperation` (Payload 3.91) gọi trực tiếp `email.sendEmail` (adapter `src/lib/email/transport.ts`), không qua job queue/allowlist → SMTP lỗi thì operation ném lỗi (HTTP 500).
- Vì sao QA thấy "thành công": `ForgotPasswordForm` của `@payloadcms/next` (`handleResponse`) chỉ `res.json()` rồi luôn toast "submissionSuccessful", không xét HTTP status → UI báo thành công giả (hành vi của Payload).
- Phát hiện phụ (chưa sửa, cần user quyết): (1) API `/api/staff/forgot-password` trả 500 khi email TỒN TẠI + SMTP lỗi, 200 khi không tồn tại → dò được tài khoản ở tầng API khi SMTP hỏng; (2) email đặt lại mật khẩu không đi qua `EMAIL_ALLOWLIST` → khi có SMTP thật, staging gửi được tới mọi email staff; (3) app không cảnh báo lúc khởi động khi `SMTP_HOST` là placeholder.

## Cần user
1. Thông tin Brevo SMTP thật (`SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`) + `EMAIL_FROM_ADDRESS` là sender/domain đã xác minh ở Brevo — user tự đặt vào `/opt/tami/staging.env` (và env prod) rồi recreate `app` + `jobs`; agent không tự đổi secret.
2. Có muốn làm code hardening ở mục "Phát hiện phụ" không (phản hồi đồng nhất + log, cảnh báo khởi động).
