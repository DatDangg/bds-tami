Agent: reviewer

# Review: feature-homepage-redesign, phase-1-task-01, round 2 (BL-044)

- **Review level:** STRICT
- **Reason:** đổi schema global `homepage` kèm migration versioned (enum ADD VALUE, bảng mới, down migration viết tay); view model dùng chung `home-view.ts`; component dùng chung `OptionSelect` (variant mới); form GET/JS gửi sang `/cho-thue` (contract URL); i18n vi/en.
- **Blast radius:** trang chủ `/`, `/en` (hero, ô tìm kiếm, Điểm mạnh); admin global `homepage`; DB `homepage*` (rollback `20261020_103248_homepage_redesign`); `payload-types.ts`; mọi nơi dùng `OptionSelect` (ProjectFilters, JobFilters, tab Dự án). Variant mặc định không đổi; pipeline dịch (`leaves.ts`).

## Verify commands + result

| Lệnh (project-config) | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS: 0 error. Có 2 warning sẵn trong `tools/task-dashboard/server.mjs`, ngoài scope. |
| `pnpm test` | PASS: `Test Files 302 passed (302)`, `Tests 3187 passed (3187)`. Lần này **có chạy integration trên DB thật** (Postgres :5433 + Redis), gồm `tests/integration/homepage-migration.test.ts` (down có dòng `strengths`) và `homepage.test.ts`. Log `revalidateTag ... static generation store missing` là noise sẵn có của hook revalidate khi chạy ngoài Next, không làm fail test. |
| `pnpm build` | **skip**: dev server dùng chung `.next`. Residual risk. |
| `pnpm payload migrate` | không chạy (ngoài quyền). Down migration đã được integration test chạy trên DB tạm. |

## Xác minh finding round 1

| ID | Kết quả | Bằng chứng |
|---|---|---|
| **M1** down migration | **FIXED** | `migrations/20261020_103248_homepage_redesign.ts:55` có `DELETE FROM "homepage_block_order" WHERE "block" = 'strengths';`, chạy trước `SET DATA TYPE text` (`:64`) và trước khi tạo lại enum (`:67`). Test `tests/integration/homepage-migration.test.ts:563-569` insert `strengths` + `about`, chạy `redesign.down`, rồi assert chỉ còn `["about"]`. Sau đó down/up cả 2 migration, khớp 10 bảng / 5 enum. Đã PASS trên DB thật. |
| **M2** "Tùy chọn khác" 1 hàng | **FIXED** | `HeroSearch.tsx` dùng lưới `grid-cols-2 md:grid-cols-5`, chip `w-full min-w-0`, nhãn hàng `md:w-40`. Độ rộng chip không còn phụ thuộc option dài nhất, trước lẫn sau hydrate. Ảnh `assets/homepage-redesign-t01-r2-1440.png`: 5 chip đều nhau trên 1 hàng, khớp mockup. |
| **M3** vùng chạm thanh tiến trình | **FIXED** | Mỗi đoạn `h-11 min-w-11` (44×44). Nhóm có `style.minWidth = count × 2.75rem`, nên min-width luôn thắng `max-w-full` và mỗi đoạn không bao giờ hẹp hơn 44px. Test `HeroSlider.test.tsx:170-175` kiểm 8 slide ra `22rem`. Xem thêm phân tích tràn ngang ở dưới. |
| m1 chip dự án bị cắt chữ | FIXED | `md:flex-wrap md:h-10 md:overflow-hidden`: chip thừa rớt xuống hàng bị ẩn, không bị cắt ngang chữ. Chip có `title` + `truncate`. Hàng tự mở bằng `md:focus-within:h-auto` khi chip ẩn nhận focus. Ảnh 1440 hiện 2 chip trọn vẹn. |
| m2 1 slide ẩn bộ đếm | FIXED | Bộ đếm được bọc trong `{multiple && …}`. Chưa có test riêng cho trường hợp 1 slide (xem n3). |
| m3 bỏ `display:contents` | FIXED | Hàng chip được dựng bằng `renderChips(scope)` ở cả 2 panel, id khác nhau theo scope. Test `HeroSearch.test.tsx:216-218`. |
| m4 `blockOrder` cũ | Dời sang T03 | Task file round 2 ghi rõ "m4: KHÔNG làm data migration ở T01, để T03". Đã ghi nhận. T03 phải xử lý. |
| m5 lệch mockup | Partly fixed (vẫn MINOR) | Đã thêm vạch dọc `border-l border-on-dark/40`. Bộ đếm được đẩy lên đầu cụm. Còn lệch: bộ đếm canh theo mép trái chữ (x≈160 ở 1440), còn mockup đặt sát mép ảnh (≈x 44); hero vẫn `100svh` theo spec F1. Builder ghi "chưa hỏi user", nên dispatcher phải hỏi user ở checkpoint (n1). |
| m6 vòng icon Điểm mạnh | FIXED | `StrengthsBlock.tsx:18` dùng `bg-primary-soft text-accent-text`. Ở ảnh 1440/390 vòng tròn tách rõ khỏi nền, giống mockup. |
| m7 viền chip control | FIXED | `option-select.tsx` `chipClass` dùng `border-input-border`. `ROUND_BUTTON` cũng dùng `border-input-border`. |

## Kiểm residual của builder: 8 slide ở 375/390 có làm trang cuộn ngang không?

Schema giới hạn số slide: `HERO_SLIDES_MAX = 8` (`src/globals/Homepage.ts:23`). `--spacing-gutter: clamp(1rem, 0.6rem + 1.7vw, 2rem)` cho ra 16px ở cả 375 và 390.

- 8 slide thì nhóm thanh rộng `22rem` = 352px. Cụm bên phải (caption + nút cuộn) là `hidden sm:flex`, nên dưới 640px cụm trái chiếm toàn bộ vùng nội dung.
- **375:** vùng nội dung 343px. Nhóm 352px tràn 9px vào gutter phải, mép phải ở x = 16+352 = 368, vẫn ≤ 375 nên **vẫn thấy được, không bị cắt**.
- **390:** vùng nội dung 358px ≥ 352px, vừa khít, không tràn.
- Cụm đáy là con `absolute` của `<section … overflow-hidden>` (`HeroSlider.tsx:143`, overflow có sẵn từ BL-020 để cắt các slide, không phải thêm vào để che lỗi). Vì vậy **document không thể overflow-x**, kể cả ở width hẹp hơn.
- `overflow-x-auto` trên nhóm không bao giờ có tác dụng: inline min-width làm nhóm luôn rộng đúng bằng 8×44px, nên không có cuộn bên trong. Câu "cuộn ngang" trong residual của builder không đúng với CSS hiện tại. Thực tế là nhóm thanh tràn 9px vào gutter ở 375.
- **Kết luận: không có horizontal scroll ở 375/390 với mọi số slide hợp lệ (1–8), nên gate không FAIL.** Ở width < 368px (360/320, không thuộc mốc bắt buộc), đoạn cuối bị `overflow-hidden` của section cắt mất một phần. Xem n2.

## Responsive Checklist Gate (diff đụng UI)

Không có browser. Kiểm bằng CSS math cộng ảnh r2 (1440, 390 qua iframe).

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | Ở trên: 375/390 với 1–8 slide không tràn document. Ô tìm kiếm `w-full max-w-4xl`; chip dự án < md nằm trong `overflow-x-auto`; lưới "Tùy chọn khác" `grid-cols-2 min-w-0`. Ảnh 390 không thấy tràn. |
| Mobile-first `min-width` | OK | Chỉ dùng prefix `sm:/md:/lg:`. |
| Grid auto-fit/minmax | OK (theo spec task) | Lưới chip `grid-cols-2 md:grid-cols-5` và Điểm mạnh `1/2/4` là số cột mà task §5/§6/Acceptance quy định ("Tùy chọn khác" 2 cột ở 390). Item có `min-w-0`. |
| Container không fixed px | OK | `max-w-container`, `max-w-4xl`, `w-full`. `w-40/sm:w-56` của nhóm thanh là bề rộng mong muốn, có `max-w-full`. |
| Font-size rem / token | OK | Chỉ dùng token `text-small/eyebrow/display/lead/h4`. |
| Heading fluid | OK | Token `text-display`/`text-h4`. |
| Media | N/A | Không có ảnh mới trong render T01. |
| Touch target ≥ 44×44 | OK | Đoạn thanh `h-11 min-w-11`. Chip/OptionSelect `h-11` < md (`md:h-10` chỉ áp dụng desktop). Nút tròn `size-11 md:size-10`. Dừng/Phát `size-11`. |
| Nav mobile | N/A | Header không đổi. |
| Table | N/A | |
| `100vh` | OK | Hero vẫn `h-svh`. |
| prefers-reduced-motion | OK | `motion-reduce:transition-none` trên vạch, caret, nội dung slide. |
| Không che lỗi bằng overflow:hidden | OK | Chip dự án dùng `overflow-hidden` + wrap, kèm nút mở và `focus-within`, nên không còn cắt chữ. `overflow-hidden` của section hero có sẵn từ trước, chỉ ảnh hưởng width < 368px (n2). |

## Skill gates

| Gate | Kết quả |
|---|---|
| aislop | skip: aislop chưa cài (như round 1) |
| oxlint (anti-slop) | skip: chưa cấu hình oxlint. ESLint 0 error |
| open-code-review (ocr) | skip: ocr chưa cài |
| AI-readable | OK. Tên rõ (`renderChips`, `chipClass`, `twoDigits`, `ROW_LABEL`, `ROUND_BUTTON`); comment nêu lý do (WHY). Có 1 indicator: thân component `HeroSearch`/`HeroSlider` > 50 dòng (pattern có sẵn). Dưới mức 3, không FAIL. |
| ai-friendly-web | N/A: không đổi robots/sitemap/llms. |
| blitzstrike | skip: không có môi trường được phép. Input vẫn qua whitelist (`isOneOf`, `PRICE_HINT_RANGES`, `AREA_HINT_RANGES`) như round 1. |
| no-raw-colors / contrast | OK: nằm trong `pnpm test` và PASS. Không có hex mới. |

## Regression do round 2

- `OptionSelect` variant mặc định: `variantClass` là `undefined`, nên class cũ của ProjectFilters/JobFilters vẫn giữ. Test toàn repo PASS.
- Tab Dự án: hàng chip giờ nằm trong panel Dự án (sau form). Trước đây nó nằm chung bên ngoài panel. Hành vi tương đương; panel ẩn có `hidden`, nên không bị trùng trong cây a11y.
- Không thấy regression chức năng. Toàn bộ integration homepage PASS trên DB thật.

## Findings

### [CRITICAL]
Không có.

### [MAJOR]
Không có.

### [MINOR]
- **n1 (m5 còn mở)**: lệch mockup chưa hỏi user. `src/components/home/HeroSlider.tsx:378-392`: bộ đếm canh theo mép chữ (`lg:px-20`), còn mockup đặt sát mép trái ảnh; hero `100svh` cao hơn mockup (~750px). Change doc yêu cầu "ghi lý do **và hỏi user trước**". Đề xuất: dispatcher đưa hai điểm lệch này vào human checkpoint của T01. Không phải lỗi code.
- **n2**: `HeroSlider.tsx:395`. Với 8 slide, ở width < 368px (vd 360, 320) đoạn cuối bị `overflow-hidden` của section cắt mất một phần (360 mất 8px, 320 mất ~48px, tức gần trọn 1 đoạn). Ngoài ra `overflow-x-auto` trên nhóm là code chết vì inline `minWidth` làm nhóm luôn rộng đúng bằng nội dung. Đề xuất: bỏ inline `minWidth`, để nhóm `w-full max-w-full` (hoặc `w-40 sm:w-56 max-w-full`) giữ `overflow-x-auto`; đoạn `min-w-11` sẽ cuộn bên trong nhóm thay vì bị section cắt. Hoặc giữ nguyên và ghi residual (không thuộc mốc 375/768/1280 bắt buộc).
- **n3**: test thiếu cho m2. `HeroSlider.test.tsx` chưa assert "1 slide thì không có bộ đếm" (chỉ có `01 / 03`, `03 / 03`). Đề xuất: thêm 1 assert `querySelector(".tabular-nums")` là null khi `slides.length === 1`.
- **n4**: thứ tự focus khác thứ tự nhìn. `HeroSlider.tsx:382` Dừng/Phát dùng `order-3`: trên màn nó nằm sau thanh tiến trình, nhưng tab vào nó trước (theo WAI-ARIA carousel). Builder chấp nhận có chủ ý và đã comment. Chỉ ghi nhận (WCAG 2.4.3 vẫn chấp nhận được vì thứ tự vẫn hợp lý).
- **n5**: `StrengthsBlock.tsx:17` key `${icon}-${title}` có thể trùng nếu admin nhập 2 mục giống hệt nhau. Nên dùng `id` của row nếu view có (từ round 1, không chặn).

## Residual risk
- `pnpm build` chưa chạy (dev server dùng chung `.next`).
- 768/1024 chỉ kiểm bằng CSS math. Ảnh 390 chụp qua iframe. Không có ảnh 375 hoặc ảnh 8 slide; kết luận ở trên dựa vào CSS math.
- m4 (`blockOrder` cũ trên staging/prod không có `strengths`) phải được T03 đóng. Nếu T03 bỏ sót, trang thật sẽ không hiện Điểm mạnh.
- Lệch mockup n1 cần user xác nhận.

## Verdict: PASS

M1–M3 đã sửa đúng và có bằng chứng kiểm chứng được: integration test migration PASS trên DB thật, ảnh 1440 sau hydrate, CSS math cho touch target. m1/m2/m3/m6/m7 đã sửa; m4 dời T03 có ghi chú; m5 còn phần cần user xác nhận. Không có CRITICAL/MAJOR. Responsive gate không có mục FAIL; 8 slide không làm trang cuộn ngang ở 375/390. Toàn bộ `pnpm typecheck` / `pnpm lint` / `pnpm test` (302/302 files, 3187/3187 tests) PASS.
