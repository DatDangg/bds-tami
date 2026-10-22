Agent: reviewer

# Review — bug-listing-detail-design-match · phase-1-task-01 · round 1 (BL-056)

- **Review level:** STRICT
- **Reason:** sửa component dùng chung của khung chi tiết (`DetailSpecBar`, `DetailInfoGrid`, `DetailStatCards`, `DetailFeatureList`, `DetailOverviewIntro` mới) dùng ở 3 màn, cùng `FormField` / `LeadForm` dùng ở /lien-he, /tin-tuc và 3 cột liên hệ chi tiết. Helper mới trích chữ từ rich text quyết định nội dung nào được hiện.
- **Blast radius:** chi tiết Dự án / Cho thuê / Tin BĐS (Tổng quan, thanh thông số, form lead, Tiện ích); thẻ nổi bật `/du-an`, `/cho-thue`, `/tin-bds`; mọi nơi dùng `FormField` (default path không đổi markup, đã kiểm bằng diff); i18n `form.lead.submitNow`, `detailKit.overview.*`. Không đổi schema/API.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS — 0 error, 2 warning cũ ở `tools/task-dashboard/server.mjs` (ngoài scope) |
| `pnpm test` | PASS — 3895/3895 |
| `pnpm build` | PASS |

## Skill gates
- aislop: skip, chưa cài `aislop`
- oxlint (anti-slop): skip, chưa cấu hình oxlint (không có `.oxlintrc.json`/`oxlint.json`); eslint PASS
- ocr (open-code-review): skip, chưa cài `ocr`
- AI-readable: OK — tên rõ ràng, file ≤ 300 dòng (FormField 143, LeadForm 106, PostDetail 258, ProjectDetail 253, RentalDetail 218), hàm mới ngắn; doc as-built `design-spec.md` + `DESIGN.md` đã cập nhật. Có 1 indicator: field chết (xem M-3) → < 3 indicator.
- ai-friendly-web: N/A (task UI nội bộ của trang; không đụng robots/sitemap/llms)
- blitzstrike: skip, không có môi trường được phép. Bề mặt bảo mật: lead text là chuỗi thuần render qua React (đã escape); `RichText` giữ whitelist node → không có XSS mới.

## Responsive Checklist Gate (375 / 768 / 1280; không có browser, kiểm bằng CSS math + 3 ảnh builder lưu)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không tràn ngang | OK (còn residual) | SpecBar `line-clamp-2` / `xl:line-clamp-1` + `min-w-0`; InfoGrid `grid-cols-1 sm:grid-cols-2`; FeatureList `sm:2 lg:3`. Residual: StatCards ≥ xl 3 cột cố định (xem m-4) |
| Mobile-first `min-width` | OK | chỉ dùng biến thể `sm:`/`lg:`/`xl:` |
| Lưới auto-fit/minmax | OK | auto mặc định giữ `auto-fill minmax`; cột cố định chỉ từ sm/xl theo design |
| Font rem / heading fluid | OK | dùng token `text-body`/`text-small`/`text-h2`, không px mới |
| Media | N/A | không thêm ảnh |
| Touch ≥ 44px | OK | ô nhập `h-12` (48px), `summary` `min-h-11` (44px), nút `size="lg"` |
| Nav / table mobile | N/A | không đổi |
| 100vh / reduced-motion | OK | không dùng `vh`; `transition-transform` của mũi tên rất nhẹ (`motion-safe:` sẽ tốt hơn — không chặn) |
| Không che lỗi bằng overflow:hidden | OK | line-clamp có chữ đầy đủ trong DOM + `title` |

## Findings

### [MAJOR] M-1 — Ảnh / nội dung không chữ trong rich text bị ẩn mất (hồi quy so với trước)
`src/lib/content/rich-text-lead.ts:21-24` (`hasContentBeyond`) và `src/components/detail/DetailOverviewIntro.tsx:24-29`.
`hasContentBeyond` chỉ so **chữ thuần**. Node `upload` (ảnh — `RichText.tsx:218` có render) không có chữ, nên:
- `overview`/`description`/`content` = 1 đoạn văn + ảnh → `full === lead` → không có `<details>` → ảnh **không bao giờ hiện**;
- có `summary` nhưng rich text chỉ có ảnh → `full === ""` → ảnh mất.
Trước đây `RichText` dựng cả bài nên ảnh luôn hiện. Đây là mất nội dung CMS ở cả 3 màn.
**Sửa:** `hasContentBeyond` trả `true` khi còn bất kỳ block hiển thị được ngoài đoạn đã dùng làm đoạn dẫn (vd duyệt `root.children`: block khác paragraph-lead và (có chữ hoặc `type` ∈ {upload, table, …})). Thêm test: đoạn + ảnh → có nút; summary + chỉ ảnh → có nút.

### [MAJOR] M-2 — Đoạn dẫn trích từ rich text bị chèn khoảng trắng sai trước dấu câu
`src/lib/content/rich-text-lead.ts:14` gọi `lexicalPlainText` (`src/lib/news/read-time.ts:16`, nối các text node bằng `" "`). Trong Lexical, chữ in đậm / nghiêng / link là **text node riêng** và tự mang khoảng trắng. Ví dụ `["Dự án ", link("Sun Festo Town"), ", nằm tại…"]` → `"Dự án Sun Festo Town , nằm tại…"`; chữ đổi định dạng giữa từ thì bị tách làm hai. Cho thuê không có trường tóm tắt nên **luôn** dùng đường này. Đây là đoạn chữ đầu tiên người đọc thấy ở Tổng quan.
**Sửa:** viết bộ gom chữ riêng cho phạm vi một đoạn văn: nối các node inline bằng `""`, `linebreak`/`tab` → `" "`, sau đó gộp khoảng trắng. `hasContentBeyond` phải so cùng một cách chuẩn hoá. Thêm test cho chữ đậm/link đứng ngay trước dấu phẩy.

### [MAJOR] M-3 — Không kiểm chứng được Repro / bằng chứng trình duyệt (bug task)
Task file không có mục `Repro Verification`, `Verification summary` còn trống. Builder báo đã kiểm "7 URL × 1440/768/390", nhưng `.context/review-reports/assets/bl-056/` chỉ có **3 ảnh**, cả 3 là The Crown VI (1440 ×2, 390 ×1). Không có bằng chứng cho Cho thuê, Tin BĐS, 3 trang danh sách (A5), Tiện ích không ảnh (A4), khổ 768 hay EN. Acceptance "Bằng chứng trình duyệt VI/EN × mobile/tablet/desktop" chưa đạt (EN được chính builder ghi là không kiểm được). A4 (`DetailFeatureList`) cũng không có test tự động nào.
**Sửa:** thêm mục `Repro Verification` (trước/sau cho A1–A5, A8, status PASS) và lưu đủ ảnh cho các màn/khổ còn thiếu. EN: seed hoặc ghi rõ phần thay thế đã được chấp nhận. Thêm test cho `DetailFeatureList` không ảnh (1 mục → không có class cột; >1 mục → `sm:grid-cols-2 lg:grid-cols-3`).

### [MINOR] m-1 — Mở "Xem thêm" thì đoạn đầu bị lặp
`DetailOverviewIntro.tsx:28,36`: khi đoạn dẫn lấy từ rich text, `<details>` lại dựng cả bài nên đoạn đầu xuất hiện 2 lần (Cho thuê luôn bị). Ảnh `du-an-crown-vi-1440-overview-open.jpg` cho thấy cả khi dùng summary, câu mở đầu cũng gần như lặp lại. Không chặn PASS, nhưng nên bỏ block lead khỏi `RichText` trong phần mở rộng khi lead lấy từ content (chữ vẫn có trong HTML qua `<p>` lead nên SEO không mất).

### [MINOR] m-2 — Field chết
`src/lib/projects/project-detail-view.ts:128,316` `hasOverview` và `src/lib/rentals/rental-view.ts:62,177` `hasDescription` giờ chỉ còn test dùng. Nên xoá cả field lẫn assert trong test, hoặc ghi lý do giữ lại.

### [MINOR] m-3 — Form compact: placeholder thay vai nhãn nhìn thấy
Đã làm đúng quyết định đã chốt: `label` `sr-only` gắn `htmlFor`, `aria-describedby` và lỗi giữ nguyên, icon `aria-hidden`. Hai điểm cần biết:
- Nhãn biến mất khi đã gõ chữ (đánh đổi đã chấp nhận).
- NVDA/JAWS có thể đọc thêm placeholder → "Họ và tên bắt buộc … Họ và tên *" bị lặp.

Nên kiểm độ tương phản `placeholder:text-muted-foreground` ≥ 4.5:1, vì placeholder giờ là nhãn duy nhất người dùng nhìn thấy.

### [MINOR] m-4 — StatCards ≥ xl 3 cột cố định có thể tràn với số ≥ 4 ký tự
`src/components/detail/DetailStatCards.tsx:20`: bỏ sàn `8.5rem` ở xl. Ảnh 1440: mỗi thẻ rộng khoảng 100px, số "227" (`text-h2`, `tabular-nums`) đã gần sát lề. Giá trị như "1.250" có thể tràn ra ngoài thẻ, nhất là ở 1280. Nên kiểm trên trình duyệt với số 4–5 ký tự. Nếu tràn: dùng cỡ chữ `clamp` cho số, hoặc chỉ dùng 3 cột khi khung đủ rộng.

### [MINOR] m-5 — `LeadForm` hàm ~57 dòng (> 50)
`src/components/leads/LeadForm.tsx:50-106`: hàm vốn đã sát ngưỡng, diff thêm vài dòng. Có thể tách `fieldLook` / nút submit ra ngoài.

## Điểm đã kiểm đạt
- `/lien-he`, `/tin-tuc` (`layout` default): `fieldLook` trả `{}`, `className` của `Input` là `undefined`, `label` class không đổi, không có wrapper `div`, nút giữ `w-full sm:w-fit` + "Nhận tư vấn". Markup giống hệt trước, test "mặc định" có cover.
- `<details>`/`summary` native: chữ đầy đủ có trong HTML. Nhãn đổi bằng `hidden`/`group-open:inline` nên tên truy cập đổi đúng; `aria-expanded` native; ẩn marker cả WebKit.
- A1: chữ đầy đủ vẫn nằm trong `dd` (line-clamp chỉ ẩn bằng hình ảnh) nên trình đọc màn hình đọc đủ; có `title`.
- A2: `xl:col-span-3` chỉ khi `n % 3 === 1` (4 → 3 + 1) đúng design; không có sản phẩm → `columns="auto"` rộng hết.
- A5: `outline` ở cả 3 thẻ nổi bật, có test; variant `secondary` toàn cục giữ nguyên.
- `firstParagraphText`: bỏ heading/list/quote, đoạn rỗng → `null`, dữ liệu lạ → `null`; linebreak giữa 2 text node cho kết quả đúng (lỗi chỉ ở ranh giới định dạng — M-2).

## Residual risk
- EN chưa kiểm trên trang thật. Tràn số ở StatCards (m-4) chưa đo được. Không có browser trong phiên review.

## Verdict
**FAIL** — 3 MAJOR (M-1 mất ảnh/nội dung, M-2 đoạn dẫn sai khoảng trắng, M-3 thiếu Repro Verification / bằng chứng kiểm chứng được cho bug task). Trả về builder.
