Agent: reviewer

# Review — feature-news-careers-contact-redesign · phase-1-task-04 · round 1

Đăng ký "Bản tin thị trường": `POST /api/public/newsletter` + `NewsletterSignup` + xuất Excel `GET /api/admin/newsletter-subscribers/export` + khoá field consent (MINOR-1 của P1-T01).

- Worktree: `D:\prj\bds\.worktrees\feature-news-careers-contact-redesign__phase-1__task-04` (chưa commit, base staging `f7936d4`)
- Review level: **STRICT**
- Reason: endpoint công khai (Turnstile, rate limit, chống spam), PII email + bằng chứng đồng ý, xuất dữ liệu cá nhân, field-level access, migration enum, export lại helper dùng chung (`leads.ts`, `leads-export.ts`, `export-filters.ts`, `ConsentCheckbox`).
- Blast radius: `newsletter-subscribers` (field access), `audit_logs.action` enum (+ migration `20261022_031905_newsletter_export_audit`), `payload.config.ts` endpoints, bucket rate limit `admin-export-excel` (dùng chung với xuất lead), `RATE_LIMITS.newsletter`, `ConsentCheckbox` (dùng bởi LeadForm / ApplyForm), helper được `export` trong `leads.ts` / `leads-export.ts` / `export-filters.ts` (chỉ thêm `export`, không đổi thân hàm), i18n namespace `newsletter`, `importMap.js`, `payload-types.ts`, docs API_SPEC / ERD / PERMISSION.

## Verify commands + result

| Lệnh (trong worktree) | Kết quả |
|---|---|
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS — 0 error, 2 warning có sẵn ở `tools/task-dashboard/server.mjs` (ngoài diff) |
| `pnpm vitest run src/endpoints/public/newsletter.test.ts src/endpoints/admin src/components/news src/components/admin src/components/forms src/components/leads` | PASS — 60 file, 450/450 test |
| `docker exec tami-postgres psql -U tami -d postgres -Atc "select 1"` | `1` (Postgres sẵn sàng) |
| `DATABASE_URL_TEST=<DB worktree> pnpm vitest run tests/integration/newsletter.test.ts` | PASS — 5/5 (DB tạm, chạy migration thật, gồm cả migration mới) |
| `pnpm payload migrate:status` (DB `tami_wt54_p1t04`) | 38 migration trước đã chạy; `20261022_031905_newsletter_export_audit` = **No** (chưa apply vào DB worktree, chỉ áp vào DB tạm của integration test). Không phải defect; primary chạy `pnpm payload migrate` khi merge/deploy |
| `pnpm test` (toàn bộ) / `pnpm build` | Không chạy theo chỉ đạo (Builder báo PASS; residual risk) |

## Migration gate

- `up`: `ALTER TYPE "public"."enum_audit_logs_action" ADD VALUE IF NOT EXISTS 'newsletter.export';` — **SAFE_ADDITIVE**, không đụng dữ liệu, chạy lại được.
- Transaction: Postgres ≥ 12 cho phép `ADD VALUE` trong transaction; giá trị mới chỉ không dùng được **trong cùng** transaction. Migration không dùng giá trị trong cùng transaction → an toàn. Integration test chạy migration thật trên DB tạm → PASS (bằng chứng thực thi).
- `down`: no-op (`SELECT 1`), có comment lý do (giữ vết audit xuất PII; Postgres không bỏ được giá trị enum) — cùng mẫu `20261018_130000_data_retention`. Chấp nhận.
- Snapshot `.json`: `git diff --no-index` so với `20261022_022857_*.json` chỉ khác (1) thêm `"newsletter.export"` vào `public.enum_audit_logs_action`, (2) `id` mới → **khớp**.
- `migrations/index.ts`: thêm đúng thứ tự timestamp.
- **Không HIGH_RISK_MIGRATION.**

## Kiểm trọng tâm

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Consent bắt buộc server-side | OK | `newsletter.ts:24` `consent: z.literal(true)`; thiếu/false → 400 `consentRequired` (`fieldMessage`) |
| `privacyPolicyVersion` lấy từ server | OK | `readPolicyVersion` đọc `site-settings` (`:47-52`); body không có trường này, zod object strip key lạ → không mass-assign |
| Không lộ email tồn tại | OK | mới / active / bật lại / race đều `ok({ received: true })` (`:116-117`); integration test so byte phản hồi giống hệt. Lỗi zod không echo email |
| Turnstile như leads | OK | cùng `runPublicPipeline` + `new Request(..., { headers })` + `readToken` từ body như `leads.ts:170-194` |
| Rate limit | OK | `newsletter` 5/10 phút, chạy trước Turnstile (pipeline); 429/503 có test |
| Race unique | OK | `isDuplicateEmail` bắt `ValidationError` path `email`; integration 3 request song song → 1 bản |
| Export chỉ admin | OK | 401 (chưa đăng nhập/khoá) → 403 → 400 → rate limit → count; truy vấn `overrideAccess: false` + `user` |
| Audit không chứa email | OK | `meta: { filters: {status?}, rowCount }`; fail-closed 500 |
| Formula injection | OK | `xlsx-stream.ts:8` `FORMULA_TRIGGER /^[=+\-@\t\r\n]/` → `quotePrefix` áp cho mọi ô văn bản (email có thể bắt đầu `+`/`-`/`=`) |
| Field-level access consent | OK | `NewsletterSubscribers.ts` `lockedAfterCreate = { update: denyAll }` cho 5 field; integration REST PATCH admin chỉ đổi `status` |
| LeadForm / ApplyForm không đổi | OK | `ConsentCheckbox` mặc định `(link) => t.rich("consent.label", { policy: link })` tương đương bản cũ; test forms/leads PASS |
| Contrast thẻ tối | OK | `--color-error` → `#fbeae8` trên `#0a0c10` (rất cao); `FormStatus`/`FormErrorSummary` bị `cn()` (tailwind-merge) thay `bg-success-subtle`/`bg-error-subtle` bằng `bg-on-dark/5` nên không còn chữ sáng trên nền sáng; `on-dark-muted #b3b3b3` trên `#0a0c10` ≈ 9:1 |
| i18n VI/EN | OK | namespace `newsletter` đủ key ở cả 2 file, thêm cuối; lỗi API dùng `job-application-messages` vi/en |
| Nút Xuất Excel khoá khi lọc khác `status` | OK | `newsletterExportQueryFromWhere` chỉ nhận đúng 1 điều kiện `status equals active|unsubscribed`, search có chữ → khoá; ẩn trong drawer, ẩn non-admin |

## Responsive Checklist Gate

`NewsletterSignup` là component UI mới nhưng **chưa gắn trang** (P2-T01 gắn) → kiểm bằng CSS math, không có browser.

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | `flex flex-col`, không width cố định; input `w-full min-w-0`; nút `w-full` |
| Mobile-first / grid | N/A | không có grid / media query |
| Container không fixed px | OK | chỉ `rounded-[20px]` (radius, không ảnh hưởng layout) |
| Typography rem / fluid | OK | dùng token `text-eyebrow` / `text-h3` / `text-small` / `text-xsmall` của hệ thống |
| Media | N/A | không ảnh |
| Touch target ≥ 44px | OK | `Button size="lg"` full width; checkbox/link dùng `ConsentCheckbox` có sẵn (`min-h-6` link — có sẵn, ngoài scope) |
| Nav / table | N/A | |
| 100vh / reduced-motion / overflow hidden | OK | không dùng |
| Admin `NewsletterExportButton` | OK | dùng class Payload sẵn có như `LeadExportButton` |

Residual: chưa xác minh trực quan 375/768/1280 vì component chưa mount — P2-T01 phải chụp.

## Skill gates

- aislop: skip, `aislop` không cấu hình trong `.context/project-config.md` verify commands.
- oxlint (anti-slop): skip, oxlint not configured (không có `.oxlintrc*`); ESLint + tsc PASS 0 error.
- ocr (open-code-review): skip, ocr not installed / không nằm trong verify commands.
- AI-readable: OK — tên rõ, hàm ≤ 50 dòng (`handleNewsletterExport` ~45 dòng), file ≤ 300 dòng, magic number đặt tên (`MAX_SOURCE_PATH_CHARS`, `MAX_NEWSLETTER_EXPORT_ROWS`, `REVOKE_DELAY_MS`), docs as-built cập nhật. 0 indicator đáng kể.
- ai-friendly-web: N/A (không thêm route public).
- blitzstrike: skip, không cài / không có môi trường được phép.

## Findings

Không có CRITICAL / MAJOR.

- **[MINOR-1]** `src/collections/NewsletterSubscribers.ts:17` — `const LOCALE_LABELS ={ vi: ...` thiếu khoảng trắng sau `=` (lỗi định dạng vô tình, drive-by trên dòng không cần đổi). Fix: trả lại `= {`.
- **[MINOR-2]** `src/endpoints/admin/newsletter-export.ts:23` `LOCALE_NAMES` lặp nội dung `LOCALE_LABELS` trong collection (không được export). Fix: export `LOCALE_LABELS` từ collection rồi dùng lại (như `NEWSLETTER_STATUS_LABELS`).
- **[MINOR-3 / residual]** Không double opt-in: người thứ ba có email của ai đó bật lại được bản `unsubscribed` → `active` (kèm consent mới). Đúng spec hiện tại (spec yêu cầu bật lại), không phải defect của task; đề xuất ghi vào backlog nếu sẽ gửi mail thật (xác nhận qua email trước khi `active`).
- **[MINOR-4 / residual]** Nhánh `active` trả về không ghi DB nên nhanh hơn nhánh tạo mới một chút (timing side-channel rất nhỏ, đã bị rate limit 5/10 phút + Turnstile chặn dò hàng loạt). Không cần sửa.

## Residual risk

- Không chạy `pnpm test` full / `pnpm build` (theo chỉ đạo; Builder báo PASS sau khi Postgres hồi phục).
- Migration chưa apply vào DB worktree `tami_wt54_p1t04` (đã chạy trên DB tạm của integration test).
- UI chưa render thực tế (chưa mount) — kiểm responsive/contrast bằng CSS math.

## Verdict

**PASS** — không CRITICAL/MAJOR; migration SAFE_ADDITIVE (không HIGH_RISK_MIGRATION). MINOR-1/2 có thể sửa khi close-out hoặc task sau.
