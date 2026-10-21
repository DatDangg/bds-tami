Agent: reviewer

# Review — feature-listing-detail-redesign · phase-1-task-06 · round 1

Chi tiết Dự án `/du-an/[slug]` theo design BL-052 (`detail-du-an.webp`). Worktree `D:\prj\bds\.claude\worktrees\agent-af48886477619dfd3` (branch `worktree-agent-af48886477619dfd3`, base staging 6fa7d26, chưa commit).

- **Review level:** STRICT
- **Reason:** có thay đổi component dùng chung (`DetailPageShell` prop `bands`, `DetailSpecBar` đổi breakpoint, `DetailInfoGrid` prop `link`, `DetailDistanceList` `distance` thành tuỳ chọn, `icons.ts`), xoá 4 file, view model `project-detail-view.ts` có hàm giá ("Giá từ", Quyết định 6) mà P1-T04/T05 sẽ dùng lại, trang công khai có lead form + JSON-LD, render dữ liệu localized cho `/en`.
- **Blast radius:** `src/app/(frontend)/[locale]/du-an/[slug]/page.tsx`, `src/components/projects/{ProjectDetail,ProjectOverview,ProjectLocation,ProjectAmenities}.tsx`, `src/components/detail/{DetailPageShell,DetailSpecBar,DetailInfoGrid,DetailDistanceList}.tsx`, `src/lib/projects/project-detail-view.ts`, `src/components/icons.ts`, `src/i18n/messages/{vi,en}.json`. Đã xoá: `NearbyTabs.tsx`, `ProjectSpecs.tsx`, `SimilarProjects.tsx`, `use-project-facts.tsx`. Grep trong `src/` không còn tham chiếu tới file đã xoá. `DetailPageShell` / `DetailSpecBar` / `DetailInfoGrid` / `DetailDistanceList` hiện chỉ được dùng ở trang chi tiết Dự án và trong test của bộ detail. Thay đổi prop đều là additive hoặc nới lỏng nên P1-T07/T08 không bị phá. `src/payload-types.ts`: `git diff --ignore-all-space --stat` rỗng, tức chỉ khác EOL, bỏ qua.

## Verify commands + result (chạy trong worktree, DB `tami_wt52_p1t06`)

| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS: 0 error, 2 warning có sẵn ở `tools/task-dashboard/server.mjs`, ngoài scope |
| `npx vitest run src/components/projects src/components/detail src/lib/projects "src/app/(frontend)/[locale]/du-an"` | PASS: 21 file, 211 test |
| `pnpm build` | PASS (exit 0) |
| integration (toàn bộ) | không chạy lại. Dựa vào evidence của builder: 54/56 file PASS, 2 file chạy riêng 25/25 PASS. Diff không đụng query/collection/schema nên rủi ro thấp (Residual) |

## Đối chiếu yêu cầu (SPECIFICATIONS BL-052 "Chi tiết Dự án" + design)

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Hero full-bleed: badge danh mục + tình trạng, h1, địa chỉ, mô tả, nút video (chỉ khi videoUrl hợp lệ), 3 thumbnail + "Xem tất cả N ảnh" | OK | `ProjectDetail.tsx` dùng `DetailHeroMosaic` (đã có ở T03). `videoUrl` qua whitelist `parseVideoUrl` (`project-detail-view.ts` toProjectDetailView). Badge "Đã bàn giao" dùng `dark` + viền sáng để giữ tương phản trên nền tối |
| Thanh thông số ≤ 6 ô, KHÔNG có Pháp lý | OK | `ProjectDetail.tsx:104-115`: Giá từ · Quy mô (ha) · Diện tích · Chủ đầu tư · Bàn giao · Loại hình |
| "Giá từ": min `priceTable[].priceFrom` > 0, rồi `priceFromVnd`, rồi "Liên hệ" | OK | `projectPriceFromVnd`: `numberOrNull` lọc giá trị ≤ 0 và không hữu hạn, fallback đúng thứ tự, đọc số không localized nên `/en` cùng giá. Có test |
| Tab: Tổng quan · Vị trí · Tiện ích · Hình ảnh → Nổi bật · Mặt bằng · Bảng giá · Pháp lý & chính sách · Tin liên quan · Hỏi đáp | OK | `SECTION_IDS` mới. Pháp lý + Chính sách gộp 1 tab và 1 dải. Neo `#legal` / `#sales-policy` / `#documents` giữ nguyên |
| Khối trống ẩn cả khối lẫn tab | OK | `tabs` và `bands` cùng sinh từ `visibleSections`. Hình ảnh chỉ hiện khi ≥ 2 ảnh. Sản phẩm rỗng thì thẻ ẩn và lưới rộng hết. `ProjectLocation` không dựng grid khi không có bản đồ lẫn danh sách |
| Tổng quan: richText/summary + lưới thông tin 6 ô (link website CĐT) + thẻ Sản phẩm | OK | `ProjectOverview.tsx`. Link http(s) đã được view kiểm, `rel="noopener noreferrer"`, có nhãn sr-only "(mở tab mới)" |
| Cột phải chỉ nằm cạnh Tổng quan, dính trong phạm vi khối đó; form + Hotline "Gọi ngay" | OK | Chỉ `ProjectOverview` là `children` của lưới, các khối sau nằm trong `bands`, ngoài lưới. `DetailContactAside` chứa đúng 1 `LeadForm source="project"`. `#lead-form` lấy từ `LeadFormSlot` |
| CTA dính đáy < lg tới form, banner tới `#lead-form` | OK | `ProjectStickyCta` không đổi. < lg aside nằm ngay sau Tổng quan. `ConsultBanner actionHref="#lead-form"` giữ |
| Scroll-spy với `bands` | OK | `DetailSubNav` là con của root `data-detail-page` (`DetailLayout.tsx:50-52`). Root này bọc cả `after` nên thanh tab vẫn dính khi cuộn qua các dải. Observer tìm mục bằng `document.getElementById` |
| Vị trí: bản đồ + danh sách khoảng cách (icon theo nhóm, > 8 thì "Xem thêm") | OK | `ProjectLocation.tsx`: lg 7/5 cột. Dòng không có khoảng cách vẫn hiện tên |
| Tiện ích: ảnh trái + list (tên + mô tả), > 5 thì "Khám phá tất cả tiện ích" | OK | `ProjectAmenities.tsx` dùng `DetailFeatureList`, `INITIAL_AMENITIES = 5`. Alt rỗng thì lấy tên dự án |
| Hình ảnh 1 lớn + 4 nhỏ | OK | `DetailGalleryGrid` (T03) |
| Tương tự (carousel + "Xem tất cả dự án") → Điểm mạnh (`showProjectStrengths`) → banner | OK | `SimilarCarousel` + `loadProjectStrengths(locale)` trong `page.tsx` |
| JSON-LD (Breadcrumb, FAQ…) giữ | OK | Khối `JsonLd` trong `page.tsx` không đổi. `pageUrl` vẫn được dùng |
| `/en`: bỏ hàng thiếu chữ EN (products.type EN trống) | OK | `toProducts` lọc `hasText(item.type)`. `type` là trường localized (test `listing-fields.test.ts:43-50`). Amenities lọc theo `name` |
| File bị xoá không còn ai dùng | OK | Grep `src/` sạch. typecheck và build PASS |
| Thay đổi component dùng chung không phá chỗ khác | OK | `bands` mặc định `[]`. `DetailDistance.distance` nới thành optional. `DetailInfoGrid.link` / `label` là tuỳ chọn. `DetailSpecBar` đổi lg→xl đúng theo yêu cầu review P1-T03. Key `label-index` |
| Bỏ nút chia sẻ | Chấp nhận, xem MINOR-1 | Design không có nút này, spec BL-052 không liệt kê, và menu sẽ bị `overflow-hidden` của hero che. Lý do hợp lệ nhưng chưa ghi vào spec |

## Responsive Checklist Gate (diff đụng UI; breakpoints 375 / 768 / 1280; kiểm bằng CSS math + evidence trình duyệt của builder ở 390 / 1440)

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang | OK | Mọi dải dùng `mx-auto w-full max-w-container px-gutter`, các cột có `min-w-0`. Builder chụp 390 VI/EN và 1440: không cuộn ngang |
| Mobile-first `min-width` | OK | Chỉ dùng prefix `sm:` / `lg:` / `xl:` |
| Grid không cố định cột | OK | `DetailInfoGrid` dùng `repeat(auto-fill,minmax(min(100%,13rem),1fr))`. Thanh thông số: 375 2 cột, 768 3 cột, 1280 flex 6 ô (mỗi ô khoảng 190px, phần chữ khoảng 110px, `break-words`). Vị trí `lg:grid-cols-12` (7/5). Tổng quan `xl:grid-cols-2` |
| Container không fixed px | OK | Không có width px mới. `rounded-[16px]` chỉ là bo góc |
| Font rem / heading fluid | OK | Dùng token `text-xsmall` / `text-small` / `text-body`. `h2` lấy từ `DetailSection` (T03) |
| Spacing theo scale / clamp | OK | `py-section-tight` = `clamp(3rem, 2.3rem + 3vw, 5rem)` |
| Media max-width / aspect-ratio / sizes | OK | Ảnh đều đi qua component T03 (`DetailHeroMosaic`, `DetailGalleryGrid`, `DetailFeatureList`). `SIMILAR_IMAGE_SIZES` khớp bề rộng slide |
| Touch target ≥ 44px | OK | Diff không thêm control tương tác mới ngoài link website CĐT. Đây là link inline trong văn bản, thuộc ngoại lệ inline. Nút tab / CTA / carousel lấy từ T03 |
| Nav mobile | OK | Thanh tab `overflow-x-auto` (có sẵn) |
| Table mobile | N/A | Bảng giá không đổi |
| 100vh | OK | Aside dùng `100dvh` (có sẵn) |
| prefers-reduced-motion | OK | Diff không thêm animation mới |
| Không che lỗi bằng overflow:hidden | OK | Diff không thêm `overflow-hidden` |

Residual: 768 chưa có ảnh chụp trình duyệt, chỉ kiểm bằng CSS math. Bản đồ trong ảnh chụp chưa tải (placeholder, hành vi cũ).

## Skill gates

| Gate | Kết quả |
|---|---|
| aislop | skip, không cài `aislop` (`command -v` rỗng) |
| oxlint (anti-slop) | skip, oxlint chưa được cấu hình (không có `.oxlintrc.json` / `oxlint.json`). ESLint + tsc PASS |
| ocr (open-code-review) | skip, không cài `ocr` |
| AI-readable | OK: 1 indicator (hàm `ProjectDetail` khoảng 150 dòng, xem MINOR-2; hàm này trước diff cũng đã dài hơn 50 dòng). Tên rõ, không có magic number (`ICON_SIZE`, `INITIAL_AMENITIES`, `SQUARE_METERS_PER_HECTARE` đều có tên), JSDoc nói WHY. Dưới ngưỡng 3 |
| ai-friendly-web | N/A: không đổi `robots` / `sitemap` / `llms`, trang chi tiết đã có sẵn |
| blitzstrike | skip: không có môi trường được phép. Bề mặt nhạy cảm gần nhất là LeadForm, và nó không đổi |

## Findings

Không có CRITICAL hay MAJOR.

- **[MINOR-1] Bỏ nút Chia sẻ chưa được ghi vào spec.** `src/components/projects/ProjectDetail.tsx:84` (prop `shareUrl` bị bỏ) và `src/app/(frontend)/[locale]/du-an/[slug]/page.tsx:36`. Lý do có trong task file: design không có nút, và menu sẽ bị `overflow-hidden` của hero che. Nhưng hành vi chia sẻ của BL-045 trên chi tiết Dự án đã biến mất mà `SPECIFICATIONS.md` BL-052 không có dòng nào nói vậy. **Fix:** ở close-out, ghi as-built "chi tiết Dự án bỏ nút chia sẻ (theo design BL-052)" trong khối BL-052, hoặc để change-request hỏi user nếu muốn giữ nút. Nếu giữ thì đặt nút trong hero, không mở menu xuống dưới.
- **[MINOR-2] `ProjectDetail` khoảng 150 dòng (dòng 84–235), vượt mức 50 dòng/hàm.** Hàm này trước diff đã dài hơn 50 dòng, nên không tính là vi phạm mới. **Fix (khuyến nghị):** tách `buildSpecItems(view, t, tType, locale)` và `buildBands(...)` thành hàm thuần.
- **[MINOR-3] Lặp logic nhỏ.** `ICON_SIZE = 20` khai ở cả `ProjectDetail.tsx:50` và `ProjectOverview.tsx:12`. Chuỗi "Loại hình" `view.productTypes.map((type) => tType(type)).join(", ")` lặp ở `ProjectDetail.tsx:114` và `ProjectOverview.tsx:53`. Quy mô (ha) cũng tính ở cả hai nơi. **Fix:** gom vào một helper hoặc hook dùng chung (vd `useProjectTypeLabels`).
- **[MINOR-4] Khoá i18n cũ không còn dùng vẫn nằm lại** (`page.projectDetail.facts.*` trừ `unitsValue`, `nearby.*`, một phần `specs.*`). Builder đã ghi lại và hẹn dọn ở P3. Cần giữ đúng lời hẹn đó để không thành nợ.
- **[Note] "Giá từ" lấy min trên mọi dòng `priceTable`, kể cả dòng bị ẩn ở bảng giá `/en` vì thiếu chữ EN.** Cách làm này khớp Quyết định 6 (số không localized, `/en` cùng giá) và có ghi trong JSDoc. Không cần sửa. P1-T04/T05 phải dùng lại đúng `projectPriceFromVnd` để thẻ, bộ lọc và trang chi tiết cho ra cùng một giá.

## Residual risk
- Integration test không được chạy lại trong lần review này (dựa vào evidence của builder). Diff không đổi query hay schema.
- 768px chỉ kiểm bằng CSS math. Phần so khớp trực quan với design dựa vào ảnh chụp của builder và đối chiếu bố cục trong code; reviewer không chạy app.
- Hai dải nền trắng liền nhau (dải cuối và "Dự án tương tự") có thể nhìn dính nền tuỳ số dải. Builder đã chấp nhận rủi ro này, nó chỉ ảnh hưởng thẩm mỹ.

## Verdict
**PASS**. Không có CRITICAL hay MAJOR. 4 MINOR xử lý ở close-out hoặc P3. MINOR-1 cần một dòng as-built trong spec khi close-out.
