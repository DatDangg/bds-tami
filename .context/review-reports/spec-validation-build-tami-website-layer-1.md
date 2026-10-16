Agent: spec-validator

# Spec Validation — build tami-website, layer 1 close (round 1)

- Mode: Phase review (layer close, initial build)
- Scope: `tasks/tami-website/layer-1-task-01..07.md`, commit 14fa4df..9f3168b
- Sources: SPECIFICATIONS.md v1.2.2, docs/PERMISSION.md, docs/API_SPEC.md, docs/ARCHITECTURE.md, docs/ERD.md §4.1, `.context/project-config.md` § Secrets, `.env.example`, code `src/**`, `scripts/jobs-runner.ts`, `package.json`, reviewer reports layer-1.
- Không tính gap: follow-up đã ghi ở layer-3-task-03, layer-5-task-05, layer-9-task-06, layer-14-task-01.

## Verdict: ✅ COMPLETE (PASS) — không có lệch spec chưa có task xử lý; còn 5 mục as-built doc cần reconcile (LOW)

## Coverage matrix

| # | Requirement | Source | Status | Note / evidence |
|---|---|---|---|---|
| 1 | CI lint/typecheck/test/build + audit | ARCHITECTURE §6.4, §7 (Phụ thuộc) | ✅ | `.github/workflows/ci.yml`; `package.json` `pnpm.auditConfig.ignoreGhsas` (F3 có lý do trong task-01) |
| 2 | `staff` fields email/fullName/phone/role/active/lastLoginAt | ERD §4.1 | ✅ | `src/collections/Staff.ts:117-145` |
| 3 | `staff.avatar` | ERD §4.1 | ✅ (deferred) | Có task: layer-2-task-01 (`staff.avatar_id`) |
| 4 | Luôn còn ≥1 admin active | ERD §4.1 | ✅ (deferred) | Có task: layer-2-task-03 AC dòng 39 |
| 5 | Mật khẩu ≥10, khoá 10 phút sau 5 lần sai | PERMISSION §7 dòng 116 | ✅ | `Staff.ts:13-15,99-102`, endpoint reset-password chặn độ dài. Residual (task-02): Local API `resetPassword` không kiểm độ dài |
| 6 | Sale không đổi email/role/active; access self-or-admin | PERMISSION §3.4, §4 | ✅ | `Staff.ts:103-110,119,130,137`; `src/access/*` |
| 7 | Admin chỉ tiếng Việt | SPECIFICATIONS.md:19,138 | ✅ | `src/payload.config.ts:33` `supportedLanguages: { vi }` |
| 8 | VI không tiền tố, `/en/...`, `/vi/*` 301, không auto-redirect theo Accept-Language | SPECIFICATIONS F12; ARCHITECTURE §4, §5.1 | ✅ | `src/proxy.ts`, `src/i18n/*`; ARCHITECTURE:105,142 đã reconcile |
| 9 | Design tokens, không màu rời | design-tokens, DESIGN.md | ✅ | Theo reviewer PASS task-04 + `src/lib/contrast.test.ts`, `lint-rules.test.ts`; không re-verify từng token |
| 10 | Response contract `{success,data}` / `{success:false,error,details}` | API_SPEC §2 dòng 32-37 | ✅ | `src/lib/http/response.ts` |
| 11 | Rate limit theo IP, 429; Turnstile; validate; fail closed | API_SPEC §2-3, PERMISSION §5, ARCHITECTURE §7 | ✅ | `src/endpoints/_middleware/public-pipeline.ts:57-90` (429 + Retry-After, 503 khi Redis lỗi) |
| 12 | Lỗi trả theo `locale` | API_SPEC §2 dòng 28 | ✅ (deferred) | Pipeline hiện chỉ VI (`public-pipeline.ts:64,67,80,89`). Có task: layer-9-task-02 AC "lỗi theo `locale`" (dòng 44), layer-7-task-04 dòng 37. Lưu ý: cần sửa pipeline dùng chung lúc đó |
| 13 | Jobs lưu Postgres, retry, job `send-notification-email` | ARCHITECTURE §5.4 | ✅ | `src/jobs/*`, migration jobs queue, task-07 AC |
| 14 | Staging chỉ gửi email nội bộ | ARCHITECTURE §6.3 dòng 234 | ✅ | `src/lib/email/allowlist.ts`, `src/lib/env.ts:39-41`; deploy đặt `APP_ENV`/`EMAIL_ALLOWLIST` ở layer-3-task-03 dòng 106 |
| 15 | Prod tin `CF-Connecting-IP` sau Nginx | ARCHITECTURE §7 (Mạng) | ✅ (deferred) | Code `src/lib/security/client-ip.ts`; bật cờ ở layer-3-task-03 dòng 101 |
| 16 | Service `jobs` chạy riêng | ARCHITECTURE §6.2 | ✅ | `pnpm jobs` = `payload run scripts/jobs-runner.ts`; compose ở layer-3-task-03 dòng 39 |

Cross-doc conflict HIGH: không có. Lệch spec chưa có task: không có.

## Gaps
- Không có [MISSING].
- Không có [PARTIAL] chưa có task. Các mục 3, 4, 12, 15 là deferred, đã có task.

## As-built doc cần reconcile (LOW, không chặn layer)

Các task 06/07 ghi `no doc impact`, nhưng code đã thêm env/lệnh mà doc as-built chưa có:

1. **ARCHITECTURE §6.3** (dòng 227-236): chưa nêu `APP_ENV` (`development|test|staging|production`, prod BẮT BUỘC `production`), `EMAIL_ALLOWLIST` (cách thực hiện "chỉ gửi email nội bộ"), `TRUST_CF_CONNECTING_IP` (prod/staging = `true`), `SMTP_PORT` (mặc định 587), `EMAIL_FROM_ADDRESS`. Doc impact của layer-3-task-03 chỉ ghi "§6 nếu cổng/service khác", nên không chắc mục này được làm ở đó. Đề xuất: reconcile ngay ở close-out layer 1, hoặc ghi rõ vào Doc impact của layer-3-task-03.
2. **`.context/project-config.md` § Secrets** (dòng 117): `required` không có 5 biến trên. Chúng có default/optional trong `src/lib/env.ts` nên không sai về mặt "required". Nhưng `APP_ENV` thực tế bắt buộc ở staging/prod (sai thì email bị chặn). Đề xuất thêm danh sách `optional`/ghi chú qua `/brainstorm secrets` (file do brainstorm ghi, không sửa tay).
3. **ARCHITECTURE §5.4 / §6.2** (dòng 177-187, 219): chưa ghi cách chạy worker: `pnpm jobs` (`payload run scripts/jobs-runner.ts`), dừng an toàn bằng SIGTERM/SIGINT. Reviewer task-07 round 1 (dòng 66) và round 2 (dòng 50) đã nêu.
4. **ARCHITECTURE §4 cây thư mục** (dòng 88-111): thiếu `scripts/` (jobs-runner), `src/lib/security/`, `src/lib/email/`, `src/lib/http/`, `src/endpoints/_middleware/` (public pipeline).
5. **API_SPEC §2 bảng mã lỗi** (dòng 41-50): thiếu `503` (Redis lỗi thì endpoint công khai trả 503, fail closed: `public-pipeline.ts:64`; health check layer-2-task-06 cũng dùng 503) và header `Retry-After` kèm 429 (`public-pipeline.ts:68`).

## Residual risk
- Local API `resetPassword` không kiểm độ dài mật khẩu (task-02 Verification). Hiện chưa có đường gọi nào, cần nhớ khi viết seed/script.
- Pipeline dùng chung đang trả thông báo lỗi cố định bằng tiếng Việt. layer-9-task-02 phải đổi chữ ký pipeline (thêm locale), nên blast radius chạm cả endpoint rentals/click-events/job-applications.
- Design tokens (mục 9) dựa vào reviewer PASS + test, chưa kiểm lại từng token.
