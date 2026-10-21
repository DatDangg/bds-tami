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

## Quyết định (builder)
- **Builder:** builder-strong · worktree `.claude/worktrees/agent-ac1778247aea60dd2` (base `c26d69e`), DB `tami_wt52_p1t02`, REDIS_DB 12. Không migration.
- **i18n namespace:** `page.listing` (namespace sẵn có, chỉ dùng bởi `CategoryListTemplate`) — thêm cuối object: `hero.*`, `filters.*`, `resultsMatching`, `spotlight.*`, `learnMore.*` (vi + en).
- **Hero = `PageHero size="list" overlap={false}`** (tái dùng chiều cao tối thiểu, scrim, breadcrumb, `h1` 2 dòng). Ô tìm dùng `next/form` (không JS = form GET). Vì hero là `.theme-dark-block` (token surface/text đổi sang tối) nên thẻ tìm trắng dùng token cố định `on-dark` / `dark` (+ `focus-visible:outline-dark` để vòng focus đạt tương phản trên nền trắng). Chip "Tìm nhanh" chỉ mang `?q=` (bỏ lọc khác) theo spec.
- **Tab:** dòng số do trang định dạng sẵn (`countLabel`, vì danh từ + số nhiều khác nhau từng màn); icon là prop component, thiếu → `Buildings`.
- **Bộ lọc:** ô dùng phần tử gốc để form GET không JS chạy được: `ChipChoice` = radio ẩn + nhãn chip; `CheckboxFacetList` = `input[type=checkbox]` gốc (`accent-primary`) thay Radix Checkbox (Radix chỉ gửi form sau hydrate); `SelectFacet` = `OptionSelect progressive`; `RangeSliderFacet` = **primitive mới `src/components/ui/slider.tsx` (Radix Slider có sẵn trong `radix-ui`)** — bàn phím ←/→/Home/End/PageUp/PageDown, `aria-valuetext`; chưa hydrate → 2 ô số `name`. Đầu ở mép → `null` (không lên URL). Mỗi ô giữ giá trị lạc quan và theo lại URL khi URL đổi từ ngoài.
- **Điều hướng:** `useListingFilterNav(path, current)` → `router.push(listingHref(...), { scroll: false })` trong transition + `useReportPending` (giữ chỗ cuộn và focus — đã kiểm trình duyệt). `current` do server đưa xuống, không `useSearchParams` (khỏi Suspense).
- **Helper thuần `listing-params.ts`:** `parseMultiValue` (nhận `a,b` + khoá lặp, bỏ rỗng/trùng/lạ, thứ tự theo danh sách hợp lệ), `serializeMultiValue`, `firstParam`, `listingHref` (giữ tham số khác, bỏ `page`, bỏ rỗng, mảng → `a,b`), `countActiveFilters` (single = 1, multi = số giá trị, range min/max = 1).
- **`FilterSidebar` / `FilterSheet`** chia cùng `children`. Sidebar: thẻ trắng + "Xoá tất cả" + một `<form method="get">` (input ẩn `preservedParams`) + nút "Áp dụng" chỉ khi chưa hydrate; ẩn < lg. Sheet: nút `ListFiltersButton` sẵn có (badge) + `Sheet` từ dưới; chân "Xoá tất cả" + "Xem kết quả" (đóng). Ô trong Sheet điều hướng ngay như sidebar (spec "đổi ô lọc áp dụng ngay"), khác Sheet nháp của `/cho-thue` cũ.
- **`ResultsBar`:** `countLabel` in đậm + "phù hợp"/"found" qua `t.rich`, `aria-live`; slot `sort` + `leading` (chỗ đặt nút Sheet < lg).
- **`SpotlightSlider`:** scroll-snap qua `useSnapSlider` sẵn có (vuốt, không autoplay); mũi tên + bộ đếm trong viên kính tối trên ảnh (chữ đọc được trên ảnh sáng); 1 mục → không điều khiển; 0 → null. Không import từ `src/components/detail/*` (file của P1-T03).
- **`LearnMoreFaq`:** nút phát video → `LearnMoreVideoButton` (Dialog + `VideoFacade`, theo mẫu `RentalVideoButton`), chỉ khi `parseVideoUrl` hợp lệ; `cta.href` nhận giá trị **đã phân giải** (nội bộ có tiền tố ngôn ngữ → `next/link`; `https://` → `<a rel="noopener">`); FAQ `details/summary` + `buildFaqPageJsonLd` chỉ khi `emitJsonLd`. Ẩn phần trống; cả hai trống → null.
- **Phân trang:** dùng `Pagination` sẵn có, không đổi (khớp design: mũi tên tròn + số, trang hiện tại nền `primary`).

### API props (tóm tắt)
- `ListingHero({ title, titleAccent?, eyebrow?, description?, image?, breadcrumb?, search?: { action, value?, placeholder, preservedParams? }, quickSearch?: string[] })` — Server.
- `ListingCategoryTabs({ label, tabs: { key, href, label, countLabel?, icon?, current? }[] })` — Server.
- `FilterSidebar({ action, clearHref?, preservedParams?, children, className? })` · `FilterSheet({ activeCount, clearHref?, children, className? })` — Client.
- `FilterGroup({ title, children })` · `ChipChoice({ name, options: {value,label}[], value, onChange? })` · `CheckboxFacetList({ name, label, options: {value,label,count?}[], value: string[], onChange?, searchPlaceholder?, initialVisible? })` · `SelectFacet({ name, label, options, value, onChange? })` · `RangeSliderFacet({ names: [min,max], min, max, step, value: [n|null, n|null], formatValue, thumbLabels?, onCommit? })` — Client.
- `ResultsBar({ countLabel, sort?, leading?, className? })` — Server.
- `SpotlightSlider({ label, badge, items: { id, image?, content }[], className? })` — Client.
- `LearnMoreFaq({ learnMore?: { eyebrow?, title, titleAccent?, description?, image?, videoUrl?, cta?: {label, href} } | null, faqs?: {question, answer}[], emitJsonLd?, className? })` — Server.
- `useListingFilterNav(path, current) → { navigate(patch), pending }`; helper `listing-params.ts` như trên.

## Verification summary (Builder)
- `pnpm typecheck` PASS · `pnpm lint` PASS (0 error; 2 warning có sẵn ở `tools/task-dashboard/server.mjs`).
- `pnpm test`: 3629 passed / 55 skipped; 4 file integration fail khi chạy cả bộ (`access`, `jobs-email`, `media-upload`, `session-refresh` — môi trường/song song, không liên quan) → chạy riêng 4 file: **55/55 PASS**.
- Test mới: 41 (`listing-params.test.ts`, `listing-layout.test.tsx`, `listing-filters.test.tsx`, `SpotlightSlider.test.tsx`) — render, a11y attr (`aria-current`, `aria-valuetext`, `aria-expanded`, `aria-live`, tên vùng), trạng thái rỗng, fallback không JS (`renderToString`: form GET + "Áp dụng", ô số Từ/Đến, `<select name>`, hiện hết mục). `no-raw-colors.test` phủ `ui/slider.tsx` PASS.
- Trình duyệt (dev `-p 3102`, trang tạm đã xoá): 375 / 768 / 1280 không tràn ngang (`scrollWidth == clientWidth`); đổi chip / ô tích / phím slider → URL đúng, giữ vị trí cuộn, focus còn ở slider; Sheet < lg mở/đóng, badge "Bộ lọc (3)".

## Quyết định (builder) — attempt 2 (review r1 FAIL)
- **M1** `useListingFilterNav`: ref gom các patch chưa về tới URL; mỗi `navigate` gộp patch mới vào ref rồi dựng URL từ `current` + patch gộp. Ref xoá trong effect khi URL chuẩn hoá của `current` (`listingHref(path, current)`) đổi — so theo chuỗi URL, không theo danh tính object (trang tạo object mới mỗi render vẫn đúng; back/forward về URL cũ cũng xoá đúng). Lưu ý cho trang lắp ráp: sidebar và Sheet mỗi bên gọi hook riêng thì ref riêng — nên gọi hook MỘT lần ở component cha và truyền `navigate` xuống cả hai.
- **m1** không JS < lg: `FilterSheet` (nay nhận `action` + `preservedParams`) khi chưa hydrate render `<details>` gốc — `summary` cùng cỡ/kiểu nút "Bộ lọc" (+ badge) mở `FilterForm` (form GET + "Áp dụng"); hydrate xong đổi sang nút Sheet cùng kích thước nên không xô bố cục. `FilterForm` tách chung cho sidebar + details.
- **m2** slider: commit trì hoãn `RANGE_COMMIT_DELAY_MS` = 300ms sau commit cuối của Radix (mỗi phím một commit; thả chuột cũng qua độ trễ này), timer dọn khi unmount.
- **m3** sidebar: khi có JS thêm dòng `sr-only` "Chọn tiêu chí, danh sách cập nhật ngay." làm `aria-describedby` của vùng (chỉ khi hydrate — không JS thì không đúng).
- **m4** vùng chạm: các ô trong bộ lọc + chip "Tìm nhanh" giữ 44px tới < lg (đổi `md:min-h-*`/`md:h-9` → `lg:`), chỉ thu nhỏ ở sidebar desktop.
- **m5** id cố định → `useId()` (ListingHero "Tìm nhanh", LearnMoreFaq hai tiêu đề).
- **m6** Spotlight: hằng `IMAGE_BOX` dùng chung cho ô ảnh và khung phủ điều khiển (`absolute top-0 left-0`, ≥ lg kéo hết chiều cao thẻ); điều khiển `bottom-4 left-4` trong khung đó — bỏ số lệch cứng. Kiểm trình duyệt: 375 và 1280 điều khiển cách đáy ảnh đúng 16px, không tràn ngang.
- **m7** `RangeSliderFacet`: `[min,max]` từ URL kẹp rồi sắp tăng dần trước khi đưa vào slider (server vẫn phải tự chuẩn hoá).

## Verification summary (Builder) — attempt 2
- `pnpm typecheck` PASS · `pnpm lint` PASS (0 error; 2 warning có sẵn ngoài diff).
- `pnpm vitest run src/components/listing`: 5 file, 53 test PASS (thêm 6 so với attempt 1: 2 lần navigate liên tiếp khác khoá, reset khi URL đổi, object mới cùng URL; slider debounce giữ phím → 1 commit; min > max sắp lại; details không JS < lg; useId không trùng; gợi ý aria-describedby).
- `pnpm vitest run --project ui`: 123 file / 1112 test PASS. `no-raw-colors` + `src/i18n`: 36 PASS.
- Không chạy lại integration (diff chỉ UI client).

## Quyết định (builder) — attempt 3 (review r2 FAIL)
- **N1** (hẹn giờ slider gọi closure cũ): sửa cả hai phía. `RangeSliderFacet` giữ `onCommitRef` cập nhật mỗi render (`useLayoutEffect`), timer gọi `onCommitRef.current`. `useListingFilterNav` giữ `latest = { path, current }` mới nhất qua ref; `navigate` ổn định (deps `[router]`) và luôn dựng URL từ `current` mới nhất + patch đang gom → người gọi trễ bất kỳ đều an toàn.
- **m-c**: hook trả thêm `reset()`; `FilterSidebar` / `FilterSheet` nhận `onClear` gắn vào `onClick` link "Xoá tất cả" (trang truyền `reset`). Không chọn "reset khi transition kết thúc" vì với `router.push` giả trong test transition kết thúc ngay → phá test gom thay đổi và không kiểm được; `reset` tường minh đơn giản, test được.
- **m-b**: nút Sheet `ListFiltersButton className="md:h-11"` → cùng 44px với `summary` không JS ở mọi cỡ < lg (không nhảy 4px ở md, đúng chính sách m4).
- **m-d**: badge trong `summary` `aria-hidden` + `sr-only " (n)"` → tên đọc "Bộ lọc (n)" như nút Sheet.
- **m-a**: `RangeSliderFacet` (+ `RangeValue`, `RANGE_COMMIT_DELAY_MS`, `clamp`, `sameNumbers`) tách sang `src/components/listing/RangeSliderFacet.tsx`; `useUrlBackedState` export từ `FilterFacets.tsx` (215 dòng).
- **Hợp đồng cho trang lắp ráp**: gọi `useListingFilterNav` MỘT lần ở cha; `navigate` cho ô lọc của cả sidebar + Sheet; `reset` → `onClear` của cả hai.

## Verification summary (Builder) — attempt 3
- `pnpm typecheck` PASS · `pnpm lint` 0 error (2 warning có sẵn ngoài diff).
- `pnpm vitest run src/components/listing`: 5 file / 55 test PASS — mới: (1) slider hẹn commit → rerender `current={province}` → hết giờ → `push("/du-an?province=ha-noi&priceMin=1")` đúng 1 lần (code attempt 2 sẽ ra `?priceMin=1`); (2) `reset` giữa hai navigate bỏ thay đổi đang gom; cập nhật: link "Xoá tất cả" gọi `onClear`, `summary` có `sr-only (2)` + badge `aria-hidden` + `h-11`, nút Sheet có `md:h-11`, không `md:h-10`.
- `pnpm vitest run --project ui`: 123 file / 1114 test PASS. `no-raw-colors` + `src/i18n`: 36 PASS.

## Review
- Round 1 FAIL (M1 mất bộ lọc khi đổi nhanh) → attempt 2; Round 2 FAIL (N1 stale closure slider) → attempt 3; **Round 3 STRICT PASS** — `.context/review-reports/feature-listing-detail-redesign-phase-1-task-02-round-3-review.md`. MINOR mở n1 (Xoá tất cả/Back không huỷ timer slider), n2 (bấm "Xem kết quả" trong 300ms mất giá), n3 (chip lệch khi xoá về URL trùng) → **giao P1-T05**: `reset` tăng `generation` làm `key` nội dung lọc; slider commit ngay khi thả chuột, chỉ debounce bàn phím.

## Verification summary (close-out)
- Acceptance: **PASS**. typecheck · lint 0 error · listing 55/55 · ui 1114/1114 · no-raw-colors+i18n PASS. Không migration.

## Doc impact
- Component mới → `.context/design-spec.md` ở P3-T06.
