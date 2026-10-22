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

## Verification summary (Builder)

## Review

## Doc impact
