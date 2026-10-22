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

Agent: builder-strong. i18n namespace mới: **`page.careers.v2`** (thêm cuối object `page.careers`, vi + en, 20 khoá).

1. **Tìm `q` không thêm cột / migration:** `listOpenJobs` không có `q` → truy vấn phân trang như cũ; có `q` → quét ≤ 10 × 50 = 500 tin còn hạn (cùng điều kiện công khai + hạn + danh mục + tỉnh, chỉ `title`), lọc bằng `matchesJobKeyword` (`normalizeSearchText` của `src/lib/search` — không dấu, "đ" = "d", mọi từ phải có, ≤ 8 từ) rồi MỘT truy vấn `id in` lấy trường thẻ của trang (giữ thứ tự `-publishedAt`). Cùng cách quét bộ nhớ của `/du-an`, `/tin-bds` (BL-052). Chạm trần → cảnh báo log. Trade-off: chỉ tìm **tên vị trí** (spec), không tìm mô tả / kỹ năng → placeholder i18n "Tìm theo tên vị trí…" thay chữ design "Tìm kiếm vị trí, kỹ năng…" để không hứa sai.
2. **Hero dùng `PageHero size="list" overlap={false}`** (đúng khung mà `ListingHero` bọc) + `children` = nút neo `<a href="#open-positions">` (chạy không JS). Không sửa `ListingHero` (không có slot nút; tránh đụng file các task song song dùng chung).
3. **Hàng việc = component mới `JobRow.tsx`** (không sửa `JobCard.tsx`): `JobCard` vẫn đang được `JobDetail` ("Vị trí khác") dùng; P2-T04 thiết kế lại khối đó — có thể xoá `JobCard` khi chuyển. Xuất kèm `UrgentBadge`, `JobDepartmentLine`, `useJobSalaryLabel` cho P2-T04 dùng lại (hero chi tiết, thẻ "Vị trí khác"). `JobCardData` thêm `categoryName` (qua `visibleCategory`: `/en` danh mục chưa có bản EN → `null`, không hiện chữ Việt) + `isUrgent`; `JOB_CARD_FIELDS` thêm `category`, `isUrgent`.
4. **"Tuyển gấp"** = `Badge variant="muted"` + class token `bg-error-subtle text-error` (không thêm variant / màu mới).
5. **Bộ lọc giữ nút "Tìm"** (lệch design — design không vẽ nút): ô chọn khu vực không tự gửi khi đổi (WCAG 3.2.2) và form phải chạy không JS. Nhãn ô ẩn trực quan (`sr-only`) vì design chỉ có icon + placeholder. Hàng chip + form tách 2 cột từ **xl** (< xl xếp dọc) để không chèn chip ở 1024.
6. **"Môi trường để bạn phát triển" đầu khối căn giữa** (theo design, như "Dự án nổi bật" trang chủ); các khối còn lại canh trái (`SectionHeading`). Không dùng lại `StrengthsBlock` (icon trái, dùng chung trang chủ) mà dựng `CareersPerks` (icon trên, vạch dọc ≥ lg) — không đụng trang chủ.
7. **Banner "Gửi CV ngay"** = `CtaBanner` dùng chung (canh trái, compact) — thêm 2 prop tuỳ chọn additive vào `src/components/layout/CtaBanner.tsx`: `eyebrow?`, và `actionLabel?/actionHref?` thành tuỳ chọn (nút chỉ dựng khi có cả hai) để thiếu email → ẩn nút. Đích nút: `mailto:<site-settings.email>` — cùng đích "Gửi CV tới <email>" của trạng thái trống (hành vi gửi CV hiện có). Ảnh nền = ảnh hero Tuyển dụng (`pageHeroes.careers`, không có trường ảnh riêng; thiếu → nền tối token). Email giờ đọc mọi lần (trước chỉ khi trống) — `getSiteSettings` đã cache theo tag.
8. **Quy trình ứng tuyển:** `src/lib/content/careers-process.ts` (thuần, `/en` bỏ bước thiếu title EN, cắt 6 bước) + `load-careers-process.ts` (global lỗi → rỗng). Không có ngưỡng tối thiểu (1 bước vẫn hiện; spec chỉ nói 0 → ẩn). `ol` + số 01.. `aria-hidden` (thứ tự đã có trong `ol`).
9. **"N vị trí"** đặt cạnh tiêu đề khối (`role=status aria-live`), chỉ hiện khi có kết quả (trạng thái trống đã có `role=status` riêng). Badge "Còn N ngày / hạn hôm nay" giữ (design-spec S12 cũ, design không vẽ).
10. **Icon `Wallet`** thêm vào `src/components/icons.ts` (cột lương). `Briefcase` đã có.
11. File chung bị đụng (primary lưu ý khi gộp): `src/components/layout/CtaBanner.tsx` (P2-T05 có thể cũng thêm eyebrow cho banner "Gia nhập TAMI HOMES" — gộp 1 prop), `src/components/icons.ts`, `src/i18n/messages/{vi,en}.json`, `docs/API_SPEC.md` (mục mới đánh số **3.13** — P2-T01 có thể chiếm 3.12, đánh lại số nếu trùng), `docs/DESIGN.md`, `.context/design-spec.md`.

## Verification summary (Builder)

Agent: builder-strong · 2026-10-22 · worktree `wt/feature-news-careers-contact-redesign__phase-2__task-03` (base f7936d4), DB `tami_wt54_p2t03`.

| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS (0 error; 2 warning có sẵn ở `tools/task-dashboard/server.mjs`, không thuộc task) |
| `pnpm exec vitest run --project unit --project ui` | 3183/3187 lần đầu; 4 fail là **timeout 5s** do máy quá tải (Postgres chung đang recovery + suite song song) ở `ApplyForm` / `HeroSearch` / `Header` — chạy riêng 3 file đó: **57/57 PASS**. Test của task: `src/components/careers/*`, `src/lib/careers/*`, `src/lib/content/careers-process.test.ts` PASS |
| Integration (`DATABASE_URL_TEST` = DB worktree, chạy tuần tự) | `job-postings.test.ts` 33/33 (gồm test mới `q`: không dấu, AND, chỉ tin còn hạn + công khai, kết hợp tỉnh, `isUrgent` + phòng ban, phân trang 12/trang), `globals.test.ts` 34/34, `sitemap-jobs.test.ts` 2/2 PASS |
| `pnpm build` | PASS (Compiled successfully; CSS production có `xl:grid-cols-[13rem_18rem_auto]`) |
| Full `pnpm test` | **không đạt được kết quả tin cậy**: lần chạy toàn bộ trùng lúc `tami-postgres` sập ("too many clients" → crash → recovery ~30 phút) nên 62 file integration fail vì DB, không do code. Theo yêu cầu primary không chạy lại full suite song song; chỉ chạy lại các file liên quan (trên) |

Test mới / sửa: `job-filters.test.ts` (parse `q`, query string, `matchesJobKeyword`), `job-view.test.ts` (phòng ban `/en`, `isUrgent`, hạn dd/mm vs MM/DD), `careers-process.test.ts`, `JobFilters.test.tsx` (SSR no-JS có `q` + nút submit), `JobListPage.test.tsx` (badge "Tuyển gấp" + phòng ban, `q` truyền xuống + chip/clear mang theo, noindex khi `q`, form GET, neo hero `#open-positions`, quy trình ẩn khi rỗng / "N bước" số nhiều EN, banner Gửi CV mailto + thiếu email ẩn nút, thứ tự trước banner tư vấn), `tests/integration/job-postings.test.ts` (q trên DB thật).

**Trình duyệt** (dev `:3123`, dữ liệu thử nhập vào DB worktree: 7 vị trí theo design, 2 "Tuyển gấp", 3 phòng ban, 4 bước quy trình vi/en, email site-settings): ảnh full-page chụp đúng bề rộng qua CDP (Edge headless) — `.context/review-reports/assets/bl054-p2t03-vi-1440.png`, `bl054-p2t03-en-1440.png`, `bl054-p2t03-vi-390.png`, `bl054-p2t03-en-390.png`, `bl054-p2t03-vi-1440-q.png` (`?q=tu+van`). Tràn ngang: `scrollWidth == clientWidth` ở 1440 / 1024 / 768 / 390 / 375 (VI + EN). Ở 1440 chip + form một hàng; < xl xếp dọc; 390 hàng việc xếp dọc, chip cuộn ngang.

## Review

## Doc impact

- `.context/design-spec.md` S12: thêm khối **As-built BL-054 P2-T03** (bố cục theo `tuyen-dung.webp` + lệch design: nút "Tìm", placeholder theo tên vị trí, banner tư vấn giữ).
- `docs/DESIGN.md` bảng màn: dòng Tuyển dụng → as-built BL-054 (component `CareersPerks`, `JobFilters`, `JobRow` + `UrgentBadge`, `CareersProcess`, `CareersCvBanner`).
- `docs/API_SPEC.md`: mục mới **§3.13 Tham số URL trang `/tuyen-dung`** (`category`, `province`, `q` mới, `page`; noindex khi có lọc / tìm). Không endpoint JSON mới, không đổi response.
- `docs/ERD.md`: no doc impact (không đổi schema; `isUrgent` / `careersProcess` đã ghi ở P1-T01). Không migration.
- Intent docs (`SPECIFICATIONS.md`): không sửa.
