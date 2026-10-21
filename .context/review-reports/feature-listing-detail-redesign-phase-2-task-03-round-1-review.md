Agent: reviewer

# Review: feature-listing-detail-redesign, phase-2-task-03, round 1
Chi tiết Cho thuê `/cho-thue/[slug]` dựng theo khung chi tiết mới (BL-052)

- Worktree: `D:\prj\bds\.claude\worktrees\agent-a5283964a69f97c92` (branch `worktree-agent-a5283964a69f97c92`, base `73543c7`, chưa commit)
- Review level: **STRICT**
- Reason: trang công khai có quy tắc địa chỉ chính xác/toạ độ (`showExactAddress`), tin đã thuê (noindex, không JSON-LD), form lead; sửa component dùng chung (`DetailPageShell`, `DetailContactAside`, `DetailInfoGrid`) mà chi tiết Dự án cũng dùng; có loader global mới.
- Blast radius: route `src/app/(frontend)/[locale]/cho-thue/[slug]/page.tsx`; `src/components/rentals/{RentalDetail, SaleContactBox, SimilarRentals, RentalPriceText(new)}`; xoá `RentalSpecs`, `RentalVideoButton`, `use-rental-facts`; shared `src/components/detail/{DetailPageShell, DetailContactAside, DetailInfoGrid}.tsx` (cả `ProjectDetail` / `ProjectOverview` dùng); `src/lib/rentals/rental-detail-sections.ts` (đổi id tab/neo); `src/lib/content/load-listing-strengths.ts` (new); i18n `page.rentalDetail.v2` (vi/en). Không đổi schema/migration, không đổi `rental-view.ts`, metadata hay JSON-LD.

## Verify commands + result (chạy trong worktree)
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS: 0 error, 2 warning có sẵn ở `tools/task-dashboard/server.mjs` (ngoài diff) |
| `npx vitest run src/components/rentals src/components/detail "src/app/(frontend)/[locale]/cho-thue" src/lib/rentals src/lib/content src/components/projects` | PASS: 45 files / 486 tests |
| `npx vitest run tests/integration/rental-detail-queries.test.ts tests/integration/rentals.test.ts` (DB `tami_wt52_p2t03`) | PASS: 2 files / 45 tests |
| `pnpm build` | PASS (exit 0; `/[locale]/cho-thue/[slug]` SSG) |
| Rà file xoá | không còn tham chiếu `RentalSpecs` / `RentalVideoButton` / `use-rental-facts` / `useRentalFacts` trong `src` |
| So khoá i18n `page.rentalDetail.v2` vi và en | khớp nhau |

## Kiểm từng trọng tâm STRICT
1. **Địa chỉ chính xác / toạ độ khi `showExactAddress=false`**: OK. `toRentalDetailView` / `findRentalPrivateFields` không đổi. Hero `address` = `view.addressLine` (chỉ có số nhà khi `showExactAddress === true`, `rental-view.ts:81-83`); bản đồ = `view.map` (ẩn địa chỉ thì toạ độ đã làm tròn qua `approximateLocation`, `rental-view.ts:135-140`); prop `doc` chỉ tới Server Component (`RentalOverview` → `RichText`), không vào client. Test `page.test.tsx:263-291` (HTML + props `LazyMap` + JSON-LD không chứa số nhà hay toạ độ thật) giữ nguyên và PASS.
2. **Tin đã thuê**: OK. Badge trên hero, băng `role=status` + "Căn tương tự đang trống" nằm trong `belowSpecBar` (trước tab), cuối trang không lặp, Điều khoản `collapsed`, `Breadcrumb jsonLd={!view.rented}`, page.tsx giữ `!view.rented && …` cho JSON-LD, test noindex + 0 JSON-LD (`page.test.tsx:223-248`) PASS.
3. **Một LeadForm `source=rental` `#lead-form` + CTA dính đáy < lg**: OK. `SaleContactBox` → `DetailContactAside` với 1 `LeadFormSlot`; `ProjectStickyCta` giữ; `ConsultBanner actionHref="#lead-form"`; test "1 form" PASS.
4. **Thanh thông số đúng 6 ô theo spec, ô trống bỏ**: OK. Giá thuê · Diện tích · Phòng ngủ/tắm · Nội thất · Hướng (`houseDirection`) · Dọn vào từ (`terms.availableFromLabel`) (`RentalDetail.tsx:117-124`), khớp câu spec BL-052.
5. **Tab và khối trống ẩn**: OK. `visibleRentalSections` (overview luôn có; location khi có `map`; gallery khi có ≥ 2 ảnh; amenities/terms/legal theo dữ liệu); `bands` dựng từ cùng danh sách đó. `SimilarCarousel` trả `null` khi rỗng nên việc bỏ guard trong `SimilarRentals` vẫn an toàn.
6. **Component dùng chung không phá chi tiết Dự án**: OK. `DetailContactAside` khi không có `header` dựng đúng class cũ (`CARD_CLASS + SCROLL_MT_CLASS`). `ProjectOverview.tsx:49` luôn truyền `newTabLabel` nên vẫn vào nhánh link ngoài tab mới. `belowSpecBar` là prop tuỳ chọn. Test projects PASS.
7. **`loadListingStrengths`**: OK. Lấy `resolveListingPageContent(settings, "rentals").showStrengths` rồi theo điều kiện khối trang chủ (`resolveProjectStrengths`); global lỗi thì trả `null` kèm log; route gọi với `(locale, "rentals")` (đã có test).
8. **Lệch spec, cần ghi as-built**: chấp nhận được. Bỏ neo `#details`/`#video` (spec BL-052 không có hai tab này; video thành nút trên hero theo spec); bỏ nút chia sẻ (đồng bộ với P1-T06); "Thoả thuận" tách thành "Thương lượng" / "Liên hệ" (khớp Scope mục 1 của task). Close-out **phải** ghi 3 điểm này vào as-built spec (xem M3).
9. **EN / token / a11y / LCP**: OK. Có đủ khoá EN. Chỉ dùng token (`bg-surface`, `text-on-dark`, `rounded-pill`…). Badge "Đã thuê" dùng `dark` + viền để đủ tương phản. Ảnh bìa hero `priority sizes=100vw`. Link nội bộ trong lưới dùng `next/link`. Đúng 1 `h1`.

## Responsive Checklist Gate (diff có đụng UI; xác minh bằng đọc CSS/DOM, không chạy browser)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang 375/768/1280 | OK | Class mới không có bề rộng cố định (`flex flex-col gap-6`, `w-full`, `max-w-container px-gutter`). Builder đo DOM ở 375/1440 thấy không cuộn ngang và đã sửa chỗ giá xuống dòng giữa từ bằng U+200B |
| Mobile-first / grid auto-fit | OK | Lưới thông số và lưới thông tin là component chung đã PASS ở P1-T03/T06 (`minmax` ô ≥ 13rem); diff không thêm cột cố định |
| Font rem / heading fluid | OK | Chỉ dùng token chữ (`text-small`, `text-price`, `text-xsmall`), không có `px` font |
| Media | OK | `ResponsiveImage` (avatar `sizes=48px`, hero `100vw priority`, slider `IMAGE_SIZES`); video vẫn dùng `VideoFacade` của `DetailHeroMosaic` |
| Touch target ≥ 44px | OK | Nút gọi sale `size="lg" w-full`; nút "Gọi ngay" và CTA dính đáy là component chung đã PASS |
| Nav / table mobile | N/A | Diff không có nav hay table mới |
| 100vh / reduced-motion / overflow che lỗi | OK | Diff không thêm `100vh`, animation hay `overflow-hidden` mới |

Residual: 768 chỉ xác minh bằng CSS. Builder chụp ở 375 và 1440.

## Skill gates
- aislop: skip, `aislop` chưa cài
- oxlint (anti-slop): skip, oxlint chưa cấu hình (repo không có `.oxlintrc*`). ESLint PASS, 0 error
- ocr (open-code-review): skip, `ocr` chưa cài
- AI-readable: OK, chỉ có 1 indicator nhẹ (M1: ký tự vô hình literal), dưới ngưỡng 3. Hàm ≤ 50 dòng trừ phần JSX của `RentalDetail` (khoảng 110 dòng, đa phần là cây JSX khai báo, cùng mẫu với `ProjectDetail` đã PASS). File ≤ 300 dòng (`RentalDetail.tsx` 218 dòng)
- ai-friendly-web: N/A (không đổi robots/sitemap/llms; metadata giữ nguyên)
- blitzstrike: skip, không có môi trường pentest. Rủi ro lộ địa chỉ đã được test tự động kiểm

## Findings
Không có CRITICAL hay MAJOR.

- **[MINOR] M1** `src/components/rentals/RentalPriceText.tsx:20`: U+200B được viết thẳng vào template string nên mắt thường không thấy (người đọc hoặc AI dễ xoá nhầm hay copy sai). Fix: viết `` `${amount}\u200B${perMonth}` `` hoặc tách hằng `const ZWSP = "\u200B"`. Test `page.test.tsx` cũng nên dùng escape.
- **[MINOR] M2** `src/components/detail/DetailInfoGrid.tsx:15,39`: chọn link ngoài hay nội bộ dựa vào việc `newTabLabel` có giá trị truthy. Nếu link ngoài bị thiếu nhãn (hoặc nhãn rỗng) thì sẽ thành `next/link` mở tại chỗ, mất `rel="noopener noreferrer"`. Hiện tại an toàn vì `ProjectOverview` luôn truyền nhãn. Fix (tuỳ chọn): đổi sang discriminated union `{ href; external: true; newTabLabel: string } | { href; external?: false }`.
- **[MINOR] M3** As-built spec: close-out phải ghi vào spec/updates của khối BL-052 ba điểm: (a) bỏ neo `#details` / `#video`, link cũ rơi về đầu trang; (b) bỏ nút chia sẻ trên chi tiết Cho thuê; (c) giá chi tiết tách "Thương lượng" / "Liên hệ", trong khi `RentalCard` ("Căn tương tự") vẫn hiện "Thoả thuận" tới khi xong P2-T01, nên trong cùng một trang tạm thời có hai cách hiển thị.
- **[MINOR] M4** `src/components/rentals/RentalDetail.tsx:86`: ngày đăng mất thẻ `<time dateTime>` vì lưới chỉ nhận chuỗi. Builder đã ghi nhận và chấp nhận. Có thể bổ sung sau nếu `DetailInfoItem.value` nhận `ReactNode`.
- **[MINOR] M5** i18n: khoá cũ không còn dùng (`subNav.*`, `sections.overview/details/video`, `eyebrow.overview/details/video`, `facts.sanitary`, `contact.hotlineTitle`, `video.*`, `specs.negotiable`) được để lại có chủ đích để tránh xung đột merge. Cần theo dõi để dọn ở P3.

## Residual risk
- Chưa xem lại bằng browser (reviewer không chạy app). Bố cục 768 và so với design chỉ dựa vào đọc CSS cùng số đo DOM builder ghi lại. Design `detail-du-an.webp` có khung khớp với cách lắp: hero, thanh thông số, tab, Tổng quan cạnh cột liên hệ, các dải, phần tương tự.
- Tiêu đề tin dài làm `h1` hero 3–4 dòng (cỡ chữ của component chung, builder đã ghi).

## Verdict
**PASS**. Không có CRITICAL hay MAJOR. Typecheck, lint, unit, integration và build đều PASS. M1–M5 là MINOR, không chặn; riêng M3 phải xử lý khi close-out.
