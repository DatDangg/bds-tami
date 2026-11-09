---
id: production-turnstile-real-key
type: feature
status: pending
created: 2026-11-09
---

# Production dùng Turnstile key thật cho `tamihomes.vn` (thay test key luôn-pass)

## Yêu cầu
Tách từ BL-112 (Q5, plan duyệt 2026-11-06T07:45Z): production trên `https://tamihomes.vn` vẫn dùng **Cloudflare Turnstile test key**
(`1x00…`, luôn pass) giống staging — form công khai (liên hệ, ứng tuyển, newsletter) thực tế không có lớp chống bot.

Classification dự kiến: MODIFY (cấu hình production, không đổi code nếu `src/lib/env.ts` đã đọc key lúc chạy). SMTP giả của production
(`SMTP_HOST=smtp.invalid`) **không** thuộc change này — đã có BL-095.

## Phải làm (dự kiến — change-request chốt)
1. **[USER]** Cloudflare → Turnstile: tạo widget (hoặc dùng widget có sẵn) với hostname `tamihomes.vn` (+ `www.tamihomes.vn` nếu cần), gửi site key + secret key qua kênh an toàn (không dán vào chat/log).
2. Server mới 179.197.242.57: cập nhật `/opt/tami/prod.env` (`TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` — `src/lib/env.ts`), `chmod 600`, chủ `deploy`; tái tạo `app` (deploy lại hoặc `up -d --force-recreate app`) — `[XÁC NHẬN]`.
3. Smoke: gửi form liên hệ thật trên `https://tamihomes.vn` PASS; request giả không token / token sai → bị từ chối.
4. Docs as-built: `docs/runbooks/deploy.md` §12, `docs/ARCHITECTURE.md` §6.3; spec-publisher.

## Câu hỏi mở
- Q1: Dùng widget Turnstile mới hay widget hiện có của công ty? Mode Managed / Non-interactive / Invisible?
- Q2: Staging giữ test key (khuyến nghị) hay cũng đổi key thật (khi đó thêm hostname `179-197-242-57.sslip.io`)?

## Acceptance
- [ ] Production dùng site key thật cho `tamihomes.vn`; form công khai vẫn gửi được với người dùng thật
- [ ] Token sai/thiếu bị từ chối ở production
- [ ] Runbook/ARCHITECTURE cập nhật; staging không bị ảnh hưởng
