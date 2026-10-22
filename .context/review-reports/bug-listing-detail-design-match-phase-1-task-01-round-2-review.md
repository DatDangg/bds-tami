Agent: reviewer

# Review — bug-listing-detail-design-match · phase-1-task-01 · round 2 (BL-056)

- **Review level:** STRICT
- **Reason:** sửa component dùng chung của khung chi tiết (`DetailSpecBar`, `DetailInfoGrid`, `DetailStatCards`, `DetailFeatureList`, `DetailOverviewIntro` mới), `FormField` + `LeadForm` (form lead dùng ở /lien-he, /tin-tuc và 3 màn chi tiết), helper `splitOverview` quyết định nội dung CMS nào được hiện, và 3 thẻ nổi bật danh sách. Bug task nên phải kiểm Repro Verification.
- **Blast radius:** chi tiết Dự án / Cho thuê / Tin BĐS (Tổng quan, thanh thông số, form lead, Tiện ích); thẻ nổi bật `/du-an`, `/cho-thue`, `/tin-bds`; mọi nơi dùng `FormField` (đường mặc định không đổi markup); i18n `form.lead.submitNow`, `detailKit.overview.*`; view model `ProjectDetailView` / `RentalDetailView` (bỏ field `hasOverview` / `hasDescription`, không còn ai dùng). Không đổi schema/API/DB.

## Verify commands + result (reviewer tự chạy)
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS — 0 error, 2 warning cũ ở `tools/task-dashboard/server.mjs` (ngoài scope) |
| `pnpm test` | PASS — 3905/3905 |
| `pnpm build` | PASS (exit 0) |

## Trạng thái finding round 1
| Finding | Trạng thái | Bằng chứng |
|---|---|---|
| M-1 ảnh / nội dung không chữ bị ẩn | **Đã khép** | `src/lib/content/rich-text-lead.ts:3,28-30,55-66`: `splitOverview` giữ mọi block có chữ hoặc `upload`/`table`/`horizontalrule`; test `rich-text-lead.test.ts:51-63`, `DetailOverviewIntro.test.tsx:41-51`. Còn 1 edge nhỏ: n-1 |
| M-2 khoảng trắng sai trước dấu câu | **Đã khép** | `rich-text-lead.ts:15-25`: nối inline bằng `""`, `linebreak`/`tab` → `" "`, đệ quy qua link, gộp khoảng trắng; test `rich-text-lead.test.ts:17-28` (đậm trước dấu phẩy, link lồng, đổi định dạng giữa từ) |
| M-3 thiếu Repro Verification / bằng chứng | **Đã khép** | Task file có `## Repro Verification` (A1, A8, A2, A3, A4, A5; before/after/evidence; Status PASS). 15 ảnh trong `.context/review-reports/assets/bl-056/` (Dự án Crown/Sun Festo, Cho thuê, Tin BĐS, `/du-an`, `/tin-bds` × 1440/768/390; EN `/en/projects` danh sách + chi tiết 1440/390). Đã xem: spotlight outline `/du-an` có viền tối rõ; Cho thuê 390 lead + "Xem thêm" + form có icon; EN chi tiết "Read more" + placeholder EN + "GET ADVICE NOW →". Test A4 `DetailLists.test.tsx:35-46`. EN Cho thuê / Tin BĐS không có dữ liệu local → chỉ vitest; ghi rõ trong task (residual) |
| m-1 đoạn đầu lặp khi mở | **Đã khép** | `splitOverview` loại `leadBlock` khỏi `rest`; test `rich-text-lead.test.ts:40-45`, `DetailOverviewIntro.test.tsx:45` |
| m-2 field chết | **Đã khép** | Đã xoá `hasOverview` (`project-detail-view.ts` + test) và `hasDescription` (`rental-view.ts`, kèm import `lexicalPlainText` thừa). Typecheck PASS → không còn chỗ dùng |
| m-3 tương phản placeholder | **Đã khép** | Repro A3 đo 5.33:1 (rgb 107 trên trắng) ≥ 4.5:1 |
| m-4 StatCards số dài tràn | **Đã khép** | `DetailStatCards.tsx:73-76`: ≥ xl số ≤ 3 ký tự `xl:text-h2-sm`, ≥ 4 ký tự `xl:text-h3` + `break-words`; token có trong `globals.css:76,80`; repro A2 đo 1280/1440 không tràn |
| m-5 `LeadForm` > 50 dòng | **Đã khép** | Tách `LeadFields` (`LeadForm.tsx` ~ dòng 120-133); hàm `LeadForm` còn ~48 dòng |

## A5 `cn()` — kiểm tailwind-merge
- Nguyên nhân gốc builder nêu là đúng: base của `buttonVariants` (`button.tsx:8`) có `border border-transparent`; `outline` thêm `border-text` (`button.tsx:18`). `cva` chỉ nối chuỗi nên cả hai class cùng có, và thứ tự trong CSS quyết định màu viền → viền vô hình.
- `cn` = `extendTailwindMerge` (`src/lib/utils.ts:23`) có khai token cỡ chữ (`text-button`…) nên không xoá nhầm `text-text` / `text-button`. `border-text` và `border-transparent` cùng nhóm border-color → twMerge giữ cái sau (`border-text`). Test thật qua `cn` khẳng định có `border-text`, `text-text` và **không** có `border-transparent` ở cả 3 thẻ (`project-components.test.tsx:373-375`, `post-components.test.tsx:273-274`, `RentalListPage.test.tsx:419-420`). Ảnh `du-an-list-vi-1440-spotlight-outline-after-fix.jpg` xác nhận viền tối.
- Các chỗ khác cùng pattern: `buttonVariants()` dùng thẳng (variant mặc định `primary`, không có màu viền nên không xung đột) ở `NewsCard.tsx:68`, `NewsArticleSidebar.tsx:59` và nút "Xem chi tiết" của 3 thẻ nổi bật → không lỗi. Không còn chỗ nào gọi thẳng `secondary`/`outline`/`chip` mà không qua `cn` (`FilterPanel.tsx:121` đã bọc `cn`). Follow-up ngoài scope: xem n-2.

## Skill gates
- aislop: skip, chưa cài `aislop`
- oxlint (anti-slop): skip, chưa cấu hình oxlint; eslint PASS (0 error)
- ocr (open-code-review): skip, chưa cài `ocr`
- AI-readable: OK — tên rõ ràng (`splitOverview`, `LeadFields`, `COLUMNS_FIXED_2_CLASS`), hàm ngắn, file ≤ 300 dòng, comment nói lý do (WHY), `design-spec.md` + `DESIGN.md` đã cập nhật as-built. 0 indicator.
- ai-friendly-web: N/A (không đụng robots/sitemap/llms)
- blitzstrike: skip, không có môi trường được phép. Bề mặt: lead là chuỗi thuần render qua React (đã escape); phần mở rộng vẫn qua `RichText` (whitelist node, chặn `javascript:`) → không có XSS mới; form lead không đổi validate / Turnstile / consent.

## Responsive Checklist Gate (375/390 · 768 · 1280/1440 — CSS math + ảnh builder)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không tràn ngang | OK | SpecBar `line-clamp-2` / `xl:line-clamp-1` + `min-w-0`; InfoGrid `grid-cols-1 sm:grid-cols-2`; StatCards cỡ chữ nhỏ hơn + `break-words` ở xl; FeatureList `sm:2 lg:3`; repro đo sw ≤ iw ở 390/768/1440 |
| Mobile-first `min-width` | OK | chỉ biến thể `sm:`/`lg:`/`xl:` |
| Lưới auto-fit/minmax | OK | mặc định giữ `auto-fill minmax`; cột cố định chỉ từ sm/xl theo design, `minmax(0,11fr)_minmax(0,9fr)` không tràn |
| Font rem / heading fluid | OK | token `text-h2-sm`/`text-h3` là `clamp()` rem |
| Media | N/A | không thêm ảnh |
| Touch ≥ 44px | OK | ô nhập `h-12`, `summary` `min-h-11`, nút `size="lg"` |
| Nav / table mobile | N/A | không đổi |
| 100vh / reduced-motion | OK | không dùng `vh`; mũi tên `transition-transform` rất nhẹ (nên dùng `motion-safe:`, không chặn) |
| Không che lỗi bằng overflow:hidden | OK | line-clamp có chữ đầy đủ trong DOM + `title` |

## Findings mới (round 2)

### [MINOR] n-1 — Ảnh không dựng được vẫn tính là "nội dung thêm" → nút "Xem thêm" mở ra trống
`src/lib/content/rich-text-lead.ts:3,28-30`: mọi node `upload` đều tính là hiển thị được. Nhưng `RichText.renderUpload` (`src/components/content/RichText.tsx:112-114`) trả `null` khi `relationTo !== "media"`, `value` null (media đã xoá), `value` là id chưa populate, hoặc không có `url`. Khi đó: đoạn dẫn + 1 ảnh đã xoá → có nút "Xem thêm" nhưng mở ra trống. Test `DetailOverviewIntro.test.tsx:42,49` lại dùng `value: null` và khẳng định có nút, tức đang khoá đúng hành vi này. Tương tự (nhẹ hơn): chỉ có `horizontalrule` → mở ra chỉ một đường kẻ.
**Sửa đề xuất:** dùng cùng điều kiện với `renderUpload` (tách hàm `isRenderableUpload` dùng chung), đổi fixture test sang upload có `relationTo: "media"` + `value.url`, thêm test upload `value: null` → không có nút. Có thể bỏ `horizontalrule` khỏi `NON_TEXT_BLOCKS`. Không chặn PASS (cần media đã xoá trong nội dung CMS mới xảy ra).

### [MINOR] n-2 — Follow-up ngoài scope: `buttonVariants` trả chuỗi chưa merge
`src/components/ui/button.tsx:8,14-18`: ai gọi thẳng `buttonVariants({ variant: "secondary" | "outline" | "chip" })` mà quên `cn` sẽ gặp lại lỗi viền vô hình như A5. Hiện tại không còn chỗ nào lỗi. Đề xuất task riêng: cho `buttonVariants` tự chạy qua `cn`, hoặc bỏ `border-transparent` khỏi base và chỉ đặt ở variant không có viền. Không tính FAIL cho task này.

### [MINOR] n-3 — Residual: EN của Cho thuê / Tin BĐS chỉ kiểm bằng vitest
`/en/for-rent`, `/en/property-news` không có dữ liệu EN local; `/cho-thue` không có thẻ nổi bật trong dữ liệu local (A5 cho thuê chỉ có test). Đã ghi rõ trong Repro Verification; cùng component với `/en/projects` đã kiểm trên trang → chấp nhận được.

## Residual risk
- Không có trình duyệt trong phiên review; phần trên trang dựa vào ảnh + số đo builder ghi trong task (đã đối chiếu 3 ảnh, khớp mô tả).
- n-1 edge media đã xoá chưa được xử lý.
- `Verification summary` của task còn "(điền khi close-out)" — điền lúc close-out.

## Verdict
✅ **PASS** — 3 MAJOR và 5 MINOR của round 1 đều đã khép, có bằng chứng; 4 verify command đều PASS do reviewer tự chạy; Repro Verification có status PASS và evidence kiểm chứng được. Còn 3 MINOR mới (n-1 sửa tuỳ chọn, n-2/n-3 là follow-up/residual), không chặn.
