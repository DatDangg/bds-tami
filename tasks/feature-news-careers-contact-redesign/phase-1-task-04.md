# feature-news-careers-contact-redesign · phase-1-task-04 — Đăng ký "Bản tin thị trường" (API + form + xuất Excel)

- Nguồn: BL-054 Quyết định 2. Spec 1.47.0 khối BL-054 mục "Bản tin thị trường" + API `POST /api/public/newsletter`, `GET /api/admin/newsletter-subscribers/export`.
- Plan: phase 1 wave B (sau P1-T01 merge; song song P1-T03).
- Phụ thuộc: P1-T01 (`newsletter-subscribers`).

## Classification / Risk
- Type: **ADDITIVE**. Risk: **HIGH** — endpoint công khai (Turnstile, spam), PII email + consent, export dữ liệu cá nhân (admin only). Review: **STRICT** (+ skill `security`).
- Blast radius: `src/endpoints/public/newsletter.ts` (mới) + đăng ký, `src/endpoints/admin/newsletter-export.ts` (mới, tái dùng `src/lib/export/xlsx-stream.ts`), nút "Xuất Excel" admin (như leads export), `src/components/news/NewsletterSignup.tsx` (mới, client — chưa gắn trang; P2-T01 gắn), tái dùng `src/components/forms/*` (`use-public-form`, `TurnstileWidget`, `ConsentCheckbox`, `FormStatus`), i18n namespace `newsletter`, `docs/API_SPEC.md`.
- Doc impact: `docs/API_SPEC.md`.

## Files to Create/Modify
- `src/endpoints/public/newsletter.ts`
- `src/endpoints/admin/newsletter-export.ts`
- `src/components/news/NewsletterSignup.tsx`
- `src/components/admin/NewsletterExportButton.tsx`
- `docs/API_SPEC.md`
- `src/lib/security/rate-limit.ts`
- `src/payload.config.ts`

## Scope
1. `POST /api/public/newsletter` `{ email, consent: true, locale, turnstileToken, sourcePath?, honeypot nếu form lead đang dùng }`: pipeline công khai sẵn có (rate limit như leads), Turnstile verify (giống `leads.ts`), validate email (trim + lowercase, ≤ 254), `consent === true` bắt buộc, `privacyPolicyVersion` lấy từ `site-settings` phía server, `consentAt` = now. Đã có email: `active` → trả thành công y hệt (không lộ tồn tại); `unsubscribed` → bật lại `active` + cập nhật consent. Race 2 request cùng email → bắt lỗi unique, vẫn trả thành công. Lỗi trả mã / khoá i18n như form lead.
2. `NewsletterSignup` (client): thẻ nền tối (token tối sẵn có, như design `tin-tuc.webp` cột phải): eyebrow "Bản tin thị trường", tiêu đề "Nhận tin tức bất động sản mới nhất mỗi tuần", ô email, ô đồng ý "Tôi đồng ý nhận bản tin qua email và để TAMI xử lý email theo Chính sách bảo mật" (link chính sách theo locale), Turnstile (site key qua prop như LeadForm), nút "Đăng ký" + mũi tên, trạng thái đang gửi / thành công / lỗi (`FormStatus`, `aria-live`), dòng cam kết không chia sẻ email. Hành vi không JS như form lead.
3. Export `GET /api/admin/newsletter-subscribers/export` (admin; sale / khách 403): Excel stream cột Email, Ngôn ngữ, Trạng thái, Ngày đăng ký, Ngày đồng ý, Phiên bản chính sách, Trang đăng ký; lọc `status` tuỳ chọn; ghi audit log nếu export lead đang ghi. Nút "Xuất Excel" ở đầu danh sách collection.
4. Test: endpoint (thiếu consent 400, email sai 400, Turnstile fail, trùng email OK không tạo bản mới, unsubscribed bật lại, rate limit), export (admin OK, sale / khách 403, cột đúng), component (submit thành công / lỗi, a11y).
5. `docs/API_SPEC.md`.
6. (P1-T01 review MINOR-1) `newsletter-subscribers`: các field consent (`email`, `locale`, `consentAt`, `privacyPolicyVersion`, `sourcePath`) thêm field-level `access: { update: denyAll }` (như `SiteSettings.ts` privacyPolicyVersion) — admin chỉ đổi `status` qua cả REST; endpoint công khai cập nhật qua Local API `overrideAccess`. Thêm test.

## Acceptance
- [ ] Đăng ký được với consent + Turnstile; trùng không tạo bản ghi mới; thông báo thành công / lỗi VI / EN.
- [ ] Admin xem danh sách + xuất Excel; sale không truy cập.
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` PASS.
- Song song P1-T03: cả 2 task thêm `RATE_LIMITS` (`src/lib/security/rate-limit.ts`) + đăng ký endpoint (`src/payload.config.ts`) — thêm **cuối** danh sách, primary gộp khi merge.

## Quy ước song song
- i18n: chỉ thêm key trong **namespace riêng của task** (ghi tên namespace trong báo cáo), thêm vào **cuối** object namespace ở `src/i18n/messages/vi.json` + `en.json`; không sắp xếp lại / format lại file. Primary gộp xung đột khi merge.
- `src/payload-types.ts` là file sinh: regen bằng `pnpm generate:types` (primary regen lại khi merge nếu xung đột).
- Không sửa file thuộc task song song cùng wave; cần thì ghi vào báo cáo để primary chuyển.
- Tái dùng component BL-052 (`src/components/listing/*`, `src/components/detail/*`, `Pagination`, `ConsultBanner`, `SectionHeading`, Button/Badge/chip sẵn có); token màu theo `no-raw-colors.test`; không thêm màu / kiểu nút mới.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`. Migration phát sinh thao tác phá huỷ → DỪNG, gắn `HIGH_RISK_MIGRATION`, báo primary.

## Quyết định (builder)
Agent: builder-strong.
1. **Audit `newsletter.export` mới + migration** `20261022_031905_newsletter_export_audit` (chỉ `ALTER TYPE … ADD VALUE IF NOT EXISTS`, SAFE_ADDITIVE; `down` cố ý no-op như `20261018_130000_data_retention` để giữ vết xuất dữ liệu cá nhân). Lý do: tái dùng `lead.export` sẽ hiện "Xuất Excel lead" trong nhật ký cho một lần xuất email bản tin — sai nghĩa với audit dữ liệu cá nhân. Lệch "Files to Create/Modify" (thêm `src/lib/audit/actions.ts`, `src/collections/AuditLogs.ts`, migration + `.json` snapshot + `migrations/index.ts`). Primary: nếu P1-T03 cũng sinh migration, giữ thứ tự timestamp, snapshot `.json` mới nhất phải chứa cả hai thay đổi (regen bằng `migrate:create` sau merge nếu drift).
2. **Rate limit**: thêm `newsletter` 5/10 phút/IP (như leads) ở **cuối** `RATE_LIMITS`. Export dùng **chung** bucket `admin-export-excel` (10/giờ/user) với xuất lead — đúng câu "xuất Excel 10 lần / giờ / user" của API_SPEC §4; thông báo 429 của nút nói rõ "tính chung với xuất lead".
3. **Tái dùng thay vì nhân bản**: chỉ thêm `export` cho helper sẵn có — `leads.ts` (`createJsonBodyReader`, `declaredLocale`, `failWithKey`, `localizePipelineFailure`), `leads-export.ts` (`formatTime`, `afterCursor`, `checkExportRateLimit`, `XLSX_CONTENT_TYPE`), `export-filters.ts` (`collectConditions`). Không đổi hành vi các file đó.
4. **Đăng ký**: email đã `active` → không ghi gì (giữ `consentAt` / phiên bản của lần đồng ý đầu; spec chỉ yêu cầu cập nhật consent khi bật lại `unsubscribed`). Race → bắt `ValidationError` path `email` (adapter Postgres đổi 23505 thành lỗi này), trả 200. `sourcePath` sai / ngoài site (`//host`, URL tuyệt đối, không phải chuỗi) → bỏ (ghi `null`), không từ chối. Không có honeypot (form lead không dùng). Phản hồi `{ received: true }` như lead.
5. **MINOR-1**: field access `update: denyAll` cho `email`, `locale`, `consentAt`, `privacyPolicyVersion`, `sourcePath` (const `lockedAfterCreate`). Payload bỏ lặng lẽ giá trị (REST PATCH vẫn 200, chỉ `status` đổi) — test integration khoá hành vi này.
6. **Nút "Xuất Excel"**: chỉ ánh xạ "Trạng thái là active/unsubscribed"; field/toán tử khác, nhiều nhánh `or`, hoặc ô tìm kiếm có chữ → khoá nút kèm lý do (không xuất rộng hơn danh sách). Collection không có thùng rác nên gắn thẳng component client vào `beforeListTable` (không cần slot server như lead). `importMap.js` regen.
7. **`NewsletterSignup` trên nền tối**: `theme-dark-block` + `bg-dark-deep` (token sẵn có, như `DetailContactAside`). `FormStatus` / `FormErrorSummary` mặc định nền sáng (chữ `--color-text` thành trắng trong khối tối → không đọc được) nên đổi nền sang `bg-on-dark/5`; trong thẻ đặt `--color-error: var(--color-error-subtle)` và `--color-success: var(--color-on-dark-accent)` để chữ lỗi / icon đạt tương phản trên nền tối — chỉ trỏ lại token có sẵn, không thêm mã màu. `ConsentCheckbox` thêm prop tuỳ chọn `label` (render-prop nhận hàm bọc link chính sách) để dùng câu "nhận bản tin…"; mặc định giữ `form.consent.label` (LeadForm / ApplyForm không đổi). Ô email không `readOnly` khi đang gửi (trong khối tối `read-only:bg-surface-muted` là nền sáng + chữ trắng); chống gửi đôi đã có `inFlightRef` + nút `disabled`.
8. i18n namespace **`newsletter`** (thêm cuối `vi.json` / `en.json`). Lỗi API dùng chung `job-application-messages` (`consentRequired`, `fieldInvalid`, `captcha`, `rateLimited`…) như form lead.

## Verification summary (Builder)
Worktree `wt/feature-news-careers-contact-redesign__phase-1__task-04` (base f7936d4), `.env.local` riêng (DB `tami_wt54_p1t04`, Redis db 14). Không chạy dev server (component chưa gắn trang — P2-T01).
- `pnpm generate:types` + `pnpm generate:importmap` + `pnpm payload migrate:create newsletter_export_audit` (sau đó sửa tay `up` thêm `IF NOT EXISTS`, `down` no-op). `pnpm i18n:check` PASS.
- `pnpm typecheck` PASS · `pnpm lint` PASS (0 error; 2 warning có sẵn ở `tools/task-dashboard/server.mjs`).
- `pnpm test` (có `DATABASE_URL_TEST` + `REDIS_URL` của worktree): lượt đầy đủ 333/396 file PASS; 63 file FAIL do **môi trường** — Postgres dùng chung `tami-postgres` hết kết nối ("sorry, too many clients already"), một backend thoát code 2 → postmaster reinit + recovery fsync ~23 phút ("database system is in recovery mode"), UI test timeout 5s vì máy quá tải. Sau khi Postgres hồi phục: chạy lại đúng 63 file đó (`vitest run --maxWorkers=3 <63 file>`) → **63/63 file, 848/848 test PASS**. Tổng: 396/396 file PASS.
- Test mới: `src/endpoints/public/newsletter.test.ts` (15: tạo mới, active không ghi, bật lại, race unique, 500 không log email, policy `unknown`, 6 ca 400, locale vi/en, captcha, 429/503 + bucket `newsletter`, `sourcePath`, JSON hỏng), `src/endpoints/admin/newsletter-export.test.ts` (5: 401/403, 400 + lọc + audit, 429 trước đếm + 422, audit lỗi 500, cột/dòng), `src/components/admin/NewsletterExportButton.test.tsx` (13), `src/components/news/NewsletterSignup.test.tsx` (5: a11y vùng/nhãn/link chính sách, gửi thành công + body, lỗi client, 429 EN, 400 field), `tests/integration/newsletter.test.ts` (5, DB tạm migration thật: tạo + trùng không tạo bản mới + phản hồi giống hệt byte, bật lại, 3 request song song → 1 bản, 400 không tạo, **MINOR-1** REST PATCH admin chỉ đổi `status`, export admin 200 / sale 403 / khách 401 / 400, cột + lọc + audit `newsletter.export` không chứa email). `tests/integration/news-views-newsletter.test.ts` (P1-T01) vẫn PASS.
- `pnpm build` PASS.

## Review

## Doc impact
- `docs/API_SPEC.md`: bảng §3 thêm `POST /api/public/newsletter`; §3.12 mới (body, thứ tự kiểm, chống lộ email, race, as-built); bảng §4 thêm `GET /api/admin/newsletter-subscribers/export` + đoạn as-built (quyền, rate limit chung, audit, cột, nút).
- `docs/ERD.md`: audit `action` thêm `newsletter.export`; as-built P1-T04 của `newsletter-subscribers` (field access khoá consent, nút xuất, migration enum).
- `docs/PERMISSION.md`: dòng `newsletter-subscribers` (chỉ sửa `status` kể cả REST; xuất Excel + audit).
- Intent docs (`SPECIFICATIONS.md`) không đổi. `.context/design-spec.md` / `docs/DESIGN.md` (thẻ trên trang) để P2-T01 khi gắn `NewsletterSignup` vào `/tin-tuc`.
