# feature-news-careers-contact-redesign · phase-2-task-05 — Liên hệ `/lien-he` theo design + văn phòng / giờ làm việc + backfill

- Nguồn: BL-054 Quyết định 4, 5, 6; design `docs/specs/listing-detail-redesign/lien-he.webp`. Spec 1.47.0 khối BL-054 mục "Liên hệ", "Văn phòng + giờ làm việc".
- Plan: phase 2 wave A (song song P2-T01, P2-T03).
- Phụ thuộc: P1-T01 (`offices`, `workingHours`).

## Classification / Risk
- Type: **MODIFY** (+ script backfill dev). Risk: **MEDIUM–HIGH** — form lead `source=contact` (giữ nguyên), dữ liệu site-settings (fallback không mất dữ liệu), script ghi global. Review: **STRICT**.
- Blast radius: `src/app/(frontend)/[locale]/lien-he/page.tsx`, `src/components/contact/*` (`ContactDetails` → `ContactCards`, `OfficeSystem` (client: tab + bản đồ), `JoinTeamBanner`), `src/lib/content/contact-view.ts` (+ offices / workingHours / fallback), bản đồ nhúng hiện có, `scripts/backfill-offices.ts` (mới) + `package.json` script `backfill:offices`, i18n namespace `page.contact.v2`, `.context/design-spec.md`, `docs/DESIGN.md`.
- Doc impact: `.context/design-spec.md` (Liên hệ), `docs/DESIGN.md`, `docs/reports/` (báo cáo backfill).

## Files to Create/Modify
- `src/app/(frontend)/[locale]/lien-he/page.tsx`
- `src/components/contact/ContactDetails.tsx`
- `src/components/contact/ContactCards.tsx`
- `src/components/contact/OfficeSystem.tsx`
- `src/components/contact/JoinTeamBanner.tsx`
- `src/lib/content/contact-view.ts`
- `scripts/backfill-offices.ts`
- `package.json`

## Scope (theo spec — xem ảnh design)
1. Hero ảnh (`pageHeroes.contact` + ảnh banner sẵn có): breadcrumb, eyebrow, `h1` 2 dòng, mô tả.
2. 4 thẻ nổi đè mép dưới hero: Hotline ("Gọi ngay" `tel:`), Email ("Gửi email" `mailto:`), Zalo OA (giá trị = `siteName`, "Nhắn tin" `zaloUrl`, tab mới `rel="noopener noreferrer"`), Giờ làm việc (`workingHours.hours` + `days`); thiếu dữ liệu → ẩn thẻ, lưới co theo số thẻ. Click Hotline / Zalo vẫn ghi `click-events` nếu nút liên hệ hiện đang ghi (tái dùng cơ chế sẵn có).
3. Trái: form "Bạn cần TAMI hỗ trợ điều gì?" (eyebrow "Gửi yêu cầu") — LeadForm `source=contact` hiện có (Họ tên, SĐT, Email, Nội dung, consent, "Gửi yêu cầu"); **không** chip loại yêu cầu; style theo design (icon trong ô nếu LeadForm có biến thể — không đổi trường / payload).
4. Phải: "Hệ thống văn phòng" + mô tả; tab chi nhánh (ẩn khi 1 văn phòng; ARIA tabs hoặc nút `aria-pressed`, bàn phím); bản đồ của văn phòng đang chọn (cách nhúng bản đồ hiện có của trang Liên hệ, lazy; không toạ độ → bản đồ theo địa chỉ hoặc ẩn); thẻ văn phòng (ảnh, tên, địa chỉ, điện thoại `tel:`, email `mailto:`, nút "Chỉ đường" → Google Maps theo toạ độ / địa chỉ, tab mới). View model: `offices` (`/en` bỏ hàng thiếu `name`/`address` EN) → rỗng thì **fallback 1 văn phòng từ `address` / `mapLocation` / `hotline` / `email`** (tên = tên công ty / chuỗi i18n "Văn phòng TAMI HOMES").
5. Banner "Gia nhập TAMI HOMES" (eyebrow, tiêu đề, mô tả i18n, nút "Xem vị trí đang tuyển" → `/tuyen-dung` theo locale, ảnh nền có sẵn trong media / ảnh hero tuyển dụng). Không banner tư vấn (giữ BL-045).
6. Script `pnpm backfill:offices` (mẫu `backfill:listing-fields`): mặc định dry-run, `--apply` ghi; chỉ khi `offices` trống; tạo 1 văn phòng VI (+ EN nếu `address` EN có) từ trường cũ; báo cáo `docs/reports/backfill-offices-<ngày-giờ>-<mode>.md`; idempotent; chỉ chạy DB dev (cảnh báo khi DATABASE_URL không phải local). Builder chạy dry-run + apply trên **DB worktree**; primary chạy trên DB dev.
7. Responsive 375 / 768 / 1280 / 1440 (thẻ nổi 2×2 tablet, 1 cột mobile).
8. Test: contact-view (fallback, EN lọc, workingHours rỗng ẩn), component (tab ẩn khi 1, chuyển tab đổi bản đồ / thẻ, link đúng), script (dry-run không ghi, apply idempotent); regression LeadForm; chụp 1440 + 390 lưu `.context/review-reports/assets/bl054-p2t05-*`.

## Acceptance
- [ ] Bố cục khớp `lien-he.webp` ở desktop; mobile hợp lý.
- [ ] Không có `offices` → vẫn hiện 1 văn phòng từ dữ liệu cũ; giờ làm việc trống → ẩn thẻ.
- [ ] Form lead liên hệ hoạt động như cũ.
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` PASS.

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
