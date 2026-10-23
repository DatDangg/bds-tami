Agent: reviewer

# Review — bug-project-detail-layout-fixes · phase-1-task-02 · round-1 (BL-071)

- **Review level:** NORMAL
- **Reason:** Đây là sửa CSS/DOM trong một component `components/detail/` có đúng một nơi truyền `image` (`ProjectAmenities.tsx:73`). Task không đụng `ResponsiveImage` (dùng chung), API, auth, schema hay tenant. Root cause đã rõ và có `file:line`.
- **Blast radius:** `src/components/detail/DetailFeatureList.tsx`, chỉ ở nhánh có `image`, nơi dùng duy nhất là khối Tiện ích trên chi tiết Dự án khi không mục nào có ảnh riêng. Nhánh không ảnh vẫn ra đúng DOM như trước (`ul` là con thứ hai, class giữ nguyên). `ResponsiveImage` không đổi. Diff `.context/design-spec.md` chỉ có một câu as-built ở dòng 245.

## Root cause — xác nhận
- `src/components/media/ResponsiveImage.tsx:80`: wrapper có `relative size-full overflow-hidden` + `style={{aspectRatio}}`. Đúng như task mô tả.
- Code cũ đặt wrapper này làm grid item trực tiếp. `height:100%` phân giải theo grid area (hàng cao bằng danh sách), nên `aspect-ratio` bị bỏ qua. Fix bọc wrapper trong một `div` (grid item mới có `height:auto`). Khi đó `height:100%` của wrapper phân giải về `auto` và `aspect-ratio` có hiệu lực. Fix chặn đúng nguyên nhân, không vá triệu chứng.

## Sticky
- Fix dùng `@md/detail:sticky @md/detail:top-[calc(var(--sticky-top)_+_4.5rem)]`. Biến `--sticky-top` + 4.5rem có sẵn và cùng công thức với `DETAIL_ASIDE_STICKY_CLASS` (`DetailLayout.tsx:11`) và `scroll-mt` của `DetailSection`.
- Tổ tiên không có overflow chặn sticky: `DetailSection.tsx:40` không có overflow, cột `@container/detail` (`DetailLayout.tsx:60`) không có overflow. `overflow-hidden` ở `ProjectAmenities.tsx:19` thuộc thẻ slider, không phải tổ tiên của `DetailFeatureList`. Grid có `items-start` nên div sticky trượt được trong grid. Builder đo top = 88px.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (tsc --noEmit, không lỗi) |
| `pnpm vitest run src/components/detail` | PASS — 9 files / 70 tests |
| `pnpm build` | Không chạy (theo chỉ thị: dev server khác giữ `.next`). Rủi ro thấp: diff chỉ thêm 1 `div` + class arbitrary Tailwind, cú pháp giống class đang build được ở `DetailLayout.tsx:11` (`calc(var(--sticky-top)_+_4.5rem)`), typecheck PASS. Ghi là residual. |

## Test — có ý nghĩa không
Test `BL-071` (`DetailLists.test.tsx:36-47`): code cũ có `gridItem` = wrapper ảnh mang `style aspect-ratio`, nên `expect(gridItem).not.toBe(ratioBox)` FAIL trước fix. Sau fix test PASS. Test cũng kiểm `aspect-ratio` 4/3, class sticky, không có `size-full`/`h-full` trên grid item, và `ul` không nằm trong div bọc. Test BL-056 hiện có vẫn phủ nhánh không ảnh. jsdom không tính layout, phần tỉ lệ thật dựa vào số đo trình duyệt trong Repro Verification.

## Repro Verification (bug task)
Status **PASS**. Có số đo `getBoundingClientRect` trước và sau fix: trước 352×980 (0.359), sau 352×264 (1.333), kèm 768 / 1440 / 1920 / 375 và cả lúc thu gọn lẫn mở hết. Sticky đo top 88px. Số "before" có được bằng cách cho div bọc `display:contents`, tức tương đương ảnh làm grid item trực tiếp. Đây là mô phỏng hợp lệ của code cũ. Kết hợp với test FAIL-trước/PASS-sau, chứng cứ đủ để kiểm chứng.

## Responsive Checklist Gate (chỉ phần thay đổi trong diff)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang | OK | Ở 375: 303×227, không cuộn ngang (số đo của builder). Không thêm bề rộng cố định. |
| Mobile-first `min-width` | OK | Sticky chỉ bật từ `@md/detail:` (container query min-width). Dưới md div bọc `position: static`. |
| Grid `auto-fit`/`minmax` | N/A | Grid hiện có không đổi (`@md:grid-cols-2`). |
| Container không cố định px | OK | Không thêm width. |
| Font rem / heading clamp / spacing | N/A | Diff không đổi chữ hay spacing. |
| Ảnh `max-width`/`aspect-ratio`/`sizes` | OK | `aspectRatio="4 / 3"` giờ có hiệu lực; `sizes` giữ nguyên. |
| Touch target ≥ 44px / nav / table | N/A | Không có phần tử tương tác mới. |
| `100vh` | N/A | Không dùng. |
| `prefers-reduced-motion` | N/A | Không có animation. |
| Không che lỗi bằng `overflow:hidden` | OK | Không thêm overflow. |
| 375: ảnh trên danh sách | OK | Thứ tự DOM ảnh → danh sách, 1 cột dưới md. |

## Skill gates
- aislop: skip, aislop not installed
- oxlint (anti-slop): skip, oxlint not configured (repo không có file cấu hình oxlint). Builder đã chạy eslint trên 2 file scope, sạch.
- ocr (open-code-review): skip, ocr not installed
- AI-readable: OK. Chỉ có 0–1 indicator (JSDoc dài, xem MINOR). Không có tên mơ hồ, không có magic number mới (4.5rem là hằng chung của khung chi tiết), hàm vẫn ngắn.
- ai-friendly-web: N/A (sửa layout, không đụng crawler/sitemap)
- blitzstrike: N/A (không phải STRICT, không có bề mặt bảo mật)

## Doc / comment
- JSDoc và câu as-built trong design-spec đúng sự thật: nêu đúng cơ chế `size-full`, grid item, `height:100%` đè `aspect-ratio`, và sticky ≥ md. Không sửa intent docs.
- Design tokens: giữ `rounded-[20px]` và `sizes` như cũ, không thêm màu/token mới.

## Findings
- **[CRITICAL]** không có.
- **[MAJOR]** không có.
- **[MINOR]** `DetailFeatureList.tsx:41`: `top` cố định `--sticky-top + 4.5rem` (88px theo công thức ≥ lg). Container `@md/detail` có thể khớp ở viewport < lg, nơi thanh mục con thấp hơn khoảng 8px (`DetailSubNav.tsx:13`), nên ảnh dính lệch vài px dưới thanh. Cách tính này giống `scroll-mt` hiện có, không hỏng layout. Không cần sửa trong task này.
- **[MINOR]** `DetailFeatureList.tsx:29`: một dòng JSDoc rất dài, gộp nhiều ý. Có thể tách dòng cho dễ đọc. Không bắt buộc.
- **[MINOR / residual]** Chưa chạy `pnpm build`. Repro chỉ đo trên Astor 1 (DB dev, gán tạm rồi đã hoàn null). Không có ảnh chụp trong `assets/`. Chứng cứ là số đo đã ghi trong task file.

## Verdict
**PASS** — không có CRITICAL hay MAJOR. Repro Verification `PASS` có số đo kiểm chứng được, và test hồi quy FAIL trước fix, PASS sau fix.
