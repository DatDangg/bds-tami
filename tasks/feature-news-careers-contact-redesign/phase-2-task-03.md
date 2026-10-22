# feature-news-careers-contact-redesign · phase-2-task-03 — Danh sách Tuyển dụng `/tuyen-dung` theo design

- Nguồn: BL-054; design `docs/specs/listing-detail-redesign/tuyen-dung.webp`. Spec 1.47.0 khối BL-054 mục "Danh sách Tuyển dụng", "Tuyển gấp", "Quy trình ứng tuyển".
- Plan: phase 2 wave A (song song P2-T01, P2-T05).
- Phụ thuộc: P1-T01 (`isUrgent`, `careersProcess`).

## Classification / Risk
- Type: **MODIFY** (+ tham số `q`). Risk: **MEDIUM–HIGH** — trang công khai ISR, lọc + noindex, JSON-LD, thẻ / hàng việc dùng ở chi tiết. Review: **STRICT**.
- Blast radius: `src/app/(frontend)/[locale]/tuyen-dung/page.tsx`, `src/components/careers/JobListPage.tsx`, `src/components/careers/JobFilters.tsx`, `src/components/careers/JobCard.tsx` (→ hàng `JobRow`), `src/components/careers/*` mới (`CareersProcess`, `CareersCvBanner`), `src/lib/careers/job-filters.ts` (`q`), `src/lib/careers/job-queries.ts`, `src/lib/careers/job-view.ts` (`isUrgent`, lương, hạn), `src/lib/content/careers-perks.ts` + loader mới `careersProcess`, i18n namespace `page.careers.v2`, `.context/design-spec.md`, `docs/DESIGN.md`, `docs/API_SPEC.md` (tham số).
- Doc impact: `.context/design-spec.md` (Tuyển dụng), `docs/DESIGN.md`, `docs/API_SPEC.md`.

## Files to Create/Modify
- `src/app/(frontend)/[locale]/tuyen-dung/page.tsx`
- `src/components/careers/JobListPage.tsx`
- `src/components/careers/JobFilters.tsx`
- `src/components/careers/JobCard.tsx`
- `src/components/careers/CareersProcess.tsx`
- `src/lib/careers/job-filters.ts`
- `src/lib/careers/job-queries.ts`
- `src/lib/careers/job-view.ts`
- `src/lib/content/careers-process.ts`

## Scope (theo spec — xem ảnh design)
1. Hero ảnh (`ListingHero` / hero BL-052, `pageHeroes.careers`): breadcrumb trên ảnh, eyebrow, `h1`, mô tả, nút "Xem vị trí đang tuyển" → `#open-positions` (link neo, chạy không JS).
2. "Môi trường để bạn phát triển": 4 phúc lợi `careersPerks` (loader sẵn có) theo style design (icon tròn + tiêu đề + mô tả); < 2 mục → ẩn như cũ.
3. "Vị trí đang tuyển" (`id="open-positions"`) + "N vị trí": chip phòng ban (danh mục `job` + "Tất cả", link), ô chọn khu vực (`province`, Select TAMI), ô tìm `q` (tên vị trí, không dấu — tái dùng `src/lib/search`, không thêm cột / migration) — form GET không JS; danh sách **hàng** `JobRow`: phòng ban + badge "Tuyển gấp" (`isUrgent`), tên vị trí, tỉnh/thành, hình thức, mức lương (`salaryText` / khoảng lương theo helper sẵn có), "Hạn: dd/mm/yyyy" (`/en` MM/DD/YYYY), nút mũi tên; cả hàng là link. Phân trang giữ. Lọc / tìm → `noindex` như hiện tại; trạng thái trống giữ thông điệp + "Gửi CV tới <email>".
4. "Quy trình ứng tuyển — N bước đơn giản": loader `careersProcess` (VI đủ, `/en` bỏ bước thiếu title EN), mỗi bước icon + số 01.. + tiêu đề + mô tả, mũi tên giữa các bước ≥ lg; 0 bước → ẩn khối.
5. Banner "Chưa tìm thấy vị trí phù hợp? — Gửi CV ngay": giữ hành vi gửi CV hiện có (mailto email tuyển dụng / hành vi hiện tại — kiểm code, không đổi đích); thiếu email → ẩn nút. → banner tư vấn (**giữ** dù design không vẽ — change doc "banner tư vấn giữ nguyên", spec-validation F6).
6. JSON-LD `JobPosting` / ItemList hiện có giữ; tin hết hạn vẫn ẩn khỏi danh sách.
7. Responsive 375 / 768 / 1280 / 1440 (hàng việc xếp dọc trên mobile).
8. Test: filters (`q` parse / query string), queries (q, isUrgent hiển thị), view (lương / hạn / EN), component (badge gấp, process ẩn khi rỗng, CV banner); chụp 1440 + 390 lưu `.context/review-reports/assets/bl054-p2t03-*`.

## Acceptance
- [ ] Bố cục khớp `tuyen-dung.webp` ở desktop; mobile hợp lý.
- [ ] Lọc phòng ban / khu vực / tìm chạy không JS, noindex khi lọc; EN như VI.
- [ ] "Tuyển gấp" hiện đúng; quy trình rỗng ẩn.
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
