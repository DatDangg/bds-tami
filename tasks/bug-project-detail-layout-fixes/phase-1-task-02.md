# bug-project-detail-layout-fixes · phase-1-task-02 — Ảnh khối "Tiện ích" giữ tỉ lệ 4:3, không kéo cao theo danh sách

- Nguồn: BL-071 · change doc `spec/changes/2026-10-23-project-detail-layout-fixes.md` (Lỗi 2).
- Không đổi schema, không migration, không đổi requirement (as-built PATCH).
- Trạng thái: **done** — NORMAL PASS r1 (`.context/review-reports/bug-project-detail-layout-fixes-phase-1-task-02-round-1-review.md`), commit `b3f1f10`.

## Classification / Risk
- Type: **BUG** · severity **medium** (ảnh bị crop/kéo dọc ở mọi dự án có ảnh khối Tiện ích nhưng tiện ích không có ảnh riêng).
- Scope: nhánh có `image` của `DetailFeatureList` (nơi dùng duy nhất: `src/components/projects/ProjectAmenities.tsx:73-78`).
- Root cause category: CSS — `height: 100%` trên grid item vô hiệu hoá `aspect-ratio`.
- Expected review level: **NORMAL** (component trong `components/detail/` nhưng chỉ 1 nơi truyền `image`; KHÔNG sửa `ResponsiveImage` dùng chung).
- Blast radius: `src/components/detail/DetailFeatureList.tsx` + test.
- Doc impact: dự kiến `no doc impact` (builder Grep `docs/DESIGN.md` / `.context/design-spec.md` câu mô tả ảnh Tiện ích; nếu có ghi "sticky" thì thêm 1 dòng as-built).

## Root cause (file:line)
- `src/components/media/ResponsiveImage.tsx:80` — wrapper ảnh luôn có `size-full` (`width:100%; height:100%`) + `style={{ aspectRatio }}`.
- `src/components/detail/DetailFeatureList.tsx:39-40` — wrapper đó là **grid item trực tiếp** của lưới `@md/detail:grid-cols-2 @md/detail:items-start`. Với grid item, `height: 100%` phân giải theo chiều cao grid area (= chiều cao hàng = chiều cao danh sách bên phải, đã xác định sau khi tính track) → khi cả width và height đều khác `auto`, `aspect-ratio: 4/3` bị bỏ qua; `items-start` không cứu vì height là giá trị tường minh. 10–12 tiện ích (hoặc bấm "Khám phá tất cả tiện ích") → ảnh cao bằng danh sách, `object-cover` crop dọc.

## Hướng sửa đề xuất
- Bọc `ResponsiveImage` trong một `div` (grid item mới, chiều cao `auto`) → `height:100%` của wrapper ảnh phân giải về `auto` → `aspect-ratio: 4/3` có hiệu lực, ảnh luôn 4:3 bất kể số mục.
- Thêm dính khi danh sách dài: `div` bọc dùng `@md/detail:sticky` với `top` theo biến đang có của khung chi tiết (`--sticky-top` + chiều cao tab, giống công thức `DETAIL_ASIDE_STICKY_CLASS` `src/components/detail/DetailLayout.tsx:11`, vd `top-[calc(var(--sticky-top)_+_4.5rem)]`). Builder kiểm không có tổ tiên `overflow:hidden` chặn sticky trong thẻ `DetailSection`; chặn thì bỏ sticky, chỉ giữ 4:3 (acceptance chỉ bắt buộc tỉ lệ cố định).
- **Không** đổi `ResponsiveImage` (dùng rất nhiều nơi; đổi `size-full` có blast radius lớn).
- Token: giữ `rounded-[20px]`, `sizes` hiện có.

## Acceptance (từ change doc)
- [x] Ảnh khối Tiện ích giữ tỉ lệ 4:3 bất kể 3 hay 12 mục, kể cả sau khi bấm "Khám phá tất cả tiện ích".
- [x] < md: ảnh trên, danh sách dưới như cũ. Khi không có `image`: danh sách 2–3 cột như cũ.

## Scope
1. Sửa `DetailFeatureList.tsx` theo hướng trên (+ cập nhật JSDoc dòng 27-30).
2. Test (vitest, TDD): ảnh có `image` được bọc trong phần tử riêng (không phải grid item trực tiếp mang `size-full`), wrapper ảnh giữ `aspect-ratio: 4 / 3`; nhánh không ảnh không đổi. (jsdom không tính layout → kiểm cấu trúc DOM/class; tỉ lệ thật kiểm ở trình duyệt.)
3. Không sửa intent docs.

## Verification plan
- `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build`.
- Trình duyệt light theme, viewport **375 / 768 / 1440 / 1920**: đo `getBoundingClientRect()` ảnh (width/height ≈ 1.333) trước và sau khi bấm "Khám phá tất cả tiện ích", trên **The Windsor Collection**, **Maison Privée**, **Astor 1** + **1 dự án mẫu** có ≥ 10 tiện ích không ảnh riêng + ảnh khối. Dự án nào có ảnh riêng từng tiện ích (nhánh slider) → ghi "N/A — nhánh slider".
- Ảnh chụp `.context/review-reports/assets/bl071-p1t02-<project>-<vw>[-expanded].png`.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Repro Verification

Dữ liệu: dự án **Astor 1** ở **DB dev local (127.0.0.1:5433)**, tạm gán `amenitiesImage` (12 tiện ích, không ảnh riêng) rồi **đã hoàn lại null**. Không đụng DB staging/prod. Đo bằng `getBoundingClientRect()` trên dev server hiện có (HMR đọc code đã sửa).

| Mục | Expected | Actual before fix | Actual after fix | Evidence | Status |
|---|---|---|---|---|---|
| Tỉ lệ ảnh khối Tiện ích, 12 mục, 1440 (danh sách 924px khi mở hết) | 4:3 (± 1px) | 352×980 (0.359) — tái hiện bằng `display:contents` trên div bọc (= ảnh là grid item trực tiếp như code cũ) | 352×264 (1.333) | đo trình duyệt | PASS |
| Thu gọn (5 mục, danh sách 378px), 1440 | 4:3 | cao theo danh sách (cơ chế cũ) | 352×264 (1.333) | đo trình duyệt | PASS |
| Sau "Khám phá tất cả tiện ích" | vẫn 4:3 | kéo cao 980 | 1440: 352×264 · 1920: 352×264 · 768: 310×232 (đều 1.333) | đo trình duyệt | PASS |
| 375 | ảnh trên, danh sách dưới, không h-scroll | — | 303×227 (1.333), ảnh trên danh sách, `position: static`, không cuộn ngang | đo trình duyệt | PASS |
| Sticky ≥ md | ảnh dính dưới thanh mục con | — | cuộn 300px qua khối: ảnh giữ top 88px (= `--sticky-top` + 4.5rem) | đo trình duyệt | PASS |

Status: **PASS**.

## Verification summary
- TDD: test mới `BL-071` trong `src/components/detail/DetailLists.test.tsx` FAIL trước fix (ảnh là grid item trực tiếp), PASS sau fix (9/9 trong file).
- `pnpm typecheck` PASS · eslint riêng 2 file scope sạch · `pnpm test` PASS 4533/4533.
- `pnpm lint` toàn repo: không chạy (lỗi có sẵn ngoài scope ở `.import-tmp/`, `.local-seed/`); đã chạy eslint riêng file scope.
- `pnpm build`: KHÔNG chạy — dev server của phiên khác đang chiếm cổng 3000 và dùng chung thư mục `.next`; build sẽ ghi đè và làm hỏng nó. Thay đổi chỉ là 1 `div` + class Tailwind, typecheck PASS. Residual thấp.
- Tổ tiên (`DetailSection`, `DetailLayout` cards) không có `overflow` chặn sticky → giữ sticky; xác nhận bằng đo.
- Residual: không lưu ảnh chụp vào `.context/review-reports/assets/` (công cụ trình duyệt không xuất file; chứng cứ là số đo). Chỉ kiểm Astor 1 (Windsor / Maison Privée không có ở DB dev; các dự án dev khác không có ảnh khối).

## Doc impact
- `.context/design-spec.md` dòng 245 (Tiện ích nổi bật): thêm 1 câu as-built BL-071. `docs/DESIGN.md`: Grep không có mô tả ở cấp này → no doc impact.
