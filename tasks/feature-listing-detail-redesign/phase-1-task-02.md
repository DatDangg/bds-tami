# feature-listing-detail-redesign · phase-1-task-02 — Bộ component danh sách dùng chung (`src/components/listing/*`)

- Nguồn: BL-052 change doc; design `docs/specs/listing-detail-redesign/list-du-an.webp`.
- Spec: 1.46.0 khối BL-052 mục "Trang danh sách (khung chung)".
- Plan: phase 1 wave A (song song P1-T01, P1-T03). Thuần trình bày + helper URL; **không** sửa `ProjectListPage` / `RentalListPage` / `PostListPage` (P1-T05, P2-T02, P3-T03 lắp ráp).
- Phụ thuộc: không. Tái dùng cho BL-054 (Tin tức / Tuyển dụng / Liên hệ) → API props chung, không gắn Dự án.

## Classification / Risk
- Type: **ADDITIVE** (component mới).
- Risk: **MEDIUM** — shared component, a11y, không đụng dữ liệu.
- Expected review level: **STRICT** (shared component dùng ≥ 3 trang).
- Blast radius: `src/components/listing/*` (mới), i18n `messages/*` (namespace `listing`), có thể `src/components/ui/*` nếu thêm primitive (vd slider 2 đầu).
- Doc impact: `.context/design-spec.md` (component mới) — gom ở P3-T06.

## Scope (mỗi component có test)
1. `ListingHero` — ảnh nền + scrim token (tái dùng `PageHero`/`PageBanner` nếu được, giữ breadcrumb trên ảnh), eyebrow, `h1` 2 dòng (dòng 2 màu nhấn), mô tả, form GET ô `q` + nút "Tìm kiếm" (giữ các tham số lọc khác bằng hidden input khi cần — prop), hàng "Tìm nhanh" chip link (ẩn khi rỗng). Chiều cao tối thiểu cố định (không CLS).
2. `ListingCategoryTabs` — tab link có icon + nhãn + dòng số ("28 dự án"), tab hiện tại gạch chân + `aria-current="page"`, cuộn ngang khi tràn, vùng chạm ≥ 44px. Icon: prop (component Phosphor) với fallback.
3. `FilterSidebar` (thẻ trắng, tiêu đề "Bộ lọc" + "Xoá tất cả") + `FilterSheet` (< lg: nút "Bộ lọc" + badge số lọc đang bật, mở `Sheet` sẵn có) dùng chung nội dung; nhóm: `FilterGroup` (tiêu đề nhỏ in hoa), `ChipChoice` (một lựa chọn, chip), `CheckboxFacetList` (ô tích + số đếm, mục 0 mờ; tuỳ chọn ô tìm trong danh sách + "Xem thêm" sau N mục), `SelectFacet` (Select TAMI sẵn có), `RangeSliderFacet` (thanh trượt 2 đầu, bàn phím ←/→/Home/End, `aria-valuetext`, nhãn hai đầu "0 tỷ" / "50+ tỷ"; đơn vị/định dạng qua prop).
   - Hành vi: đổi giá trị → điều hướng URL mới (giữ tham số khác, bỏ `page`) qua hook dùng chung (vd `useListingFilterNav`) với `PendingRegion`/`useLinkStatus` như danh sách hiện có; không JS → toàn bộ là `<form method="get">` + nút "Áp dụng" (slider → 2 ô số).
   - Helper thuần + test: parse/serialize tham số nhiều giá trị (`a,b`, khoá lặp, bỏ giá trị lạ, thứ tự ổn định), đếm số lọc đang bật cho badge.
4. `ResultsBar` — "N … phù hợp" (chuỗi qua prop/i18n) + slot sắp xếp ("Sắp xếp theo").
5. `SpotlightSlider` — khung thẻ nổi bật lớn: ảnh trái (badge "… nổi bật"), nội dung phải (slot), mũi tên + bộ đếm `1 / N`, nút `aria-label`, không autoplay, vuốt; 1 mục → không mũi tên.
6. `LearnMoreFaq` — trái: ảnh + nút phát video (Dialog/VideoFacade sẵn có) + eyebrow + tiêu đề 2 màu + mô tả + nút; phải: FAQ `<details>` + JSON-LD `FAQPage` (dùng helper JSON-LD sẵn có). Ẩn phần trống; cả hai trống → không render.
7. Phân trang: dùng `Pagination` sẵn có **không đổi** (Tin tức / Tuyển dụng đang dùng); cần kiểu khác → thêm prop biến thể, mặc định giữ nguyên.
6b. JSON-LD `FAQPage` của `LearnMoreFaq` chỉ phát khi trang truyền cờ `emitJsonLd` (trang sạch: trang 1, không lọc).
8. Không icon tim. Màu/token theo `no-raw-colors.test`. Sáng/tối nếu khu vực có dark.

## Acceptance
- [ ] Mỗi component có test (render, a11y attr, trạng thái rỗng, không JS fallback ở form).
- [ ] 375px / 768px / 1280px không tràn ngang (kiểm qua story/test hoặc trang tạm không commit).
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` PASS.

## Quy ước song song (spec-validation r1 F2/F6)
- i18n: chỉ thêm key trong **namespace riêng của task** (ghi tên namespace trong báo cáo), thêm vào **cuối** object namespace đó ở `src/i18n/messages/vi.json` + `en.json`; không sắp xếp lại / format lại file. Primary gộp xung đột khi merge.
- Không sửa file thuộc task song song cùng wave (xem mục Plan / Blast radius); cần thì ghi vào báo cáo để primary chuyển.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.
