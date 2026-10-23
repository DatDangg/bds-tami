# bug-project-detail-layout-fixes · phase-1-task-01 — Thẻ "Sản phẩm" (Tổng quan dự án) không co chữ dọc ở ≥ xl

- Nguồn: BL-071 · change doc `spec/changes/2026-10-23-project-detail-layout-fixes.md` (Lỗi 1).
- Không đổi schema, không migration. Đổi một quyết định bố cục đã ghi ở design-spec (BL-056) → cần user chọn phương án (xem § Câu hỏi) trước khi builder chạy.
- Trạng thái: **done** — plan duyệt 2026-10-23 (phương án A); NORMAL PASS r1 (`.context/review-reports/bug-project-detail-layout-fixes-phase-1-task-01-round-1-review.md`).

## Classification / Risk
- Type: **BUG** (layout regression do quyết định BL-056 không chịu được tên dài) · severity **medium** (trang công khai, dữ liệu do sale nhập).
- Scope: khối Tổng quan chi tiết Dự án.
- Root cause category: lưới cố định 3 cột trong cột hẹp + `overflow-wrap: break-word`.
- Expected review level: **NORMAL** (component `DetailStatCards` dùng chung nhưng biến thể `columns={3}` chỉ có 1 nơi dùng; không auth/API/schema).
- Blast radius: `src/components/projects/ProjectOverview.tsx`, `src/components/detail/DetailStatCards.tsx` (Cho thuê / Tin BĐS dùng `columns="auto"` — phải giữ nguyên), test `src/components/detail/DetailBlocks.test.tsx` (đang khẳng định `xl:grid-cols-3` / `xl:col-span-3`, sẽ phải đổi theo hành vi mới).
- Doc impact: `.context/design-spec.md:242` (bố cục Tổng quan ≥ xl) + `docs/DESIGN.md:277` (ghi chú BL-056 "Dự án ≥ xl 2 + 3 cột") — as-built, reconcile kèm code.

## Root cause (file:line, đã đo)
1. `src/components/projects/ProjectOverview.tsx:64` — ≥ xl chia Tổng quan thành 2 cột `minmax(0,11fr)_minmax(0,9fr)`, cột phải chứa thẻ Sản phẩm.
2. `src/components/projects/ProjectOverview.tsx:66` — `DetailStatCards columns={3}` → `src/components/detail/DetailStatCards.tsx:20` thêm `xl:grid-cols-3` (ghi đè `auto-fill minmax(8.5rem,1fr)`).
3. Bề rộng thực: container `80rem` (`globals.css:131`) − gutter 2×32px − aside 24rem − khe 40px (`DetailLayout.tsx:42`) ≈ 792px cột trái; thẻ trắng `md:p-8` (`DetailSection.tsx:13`) → ~728px nội dung; cột 9fr ≈ 320px; 3 cột khe 12px → **~99px/thẻ, ~67px cho chữ** sau `p-4`. Container chặn ở 80rem nên **1920px y hệt 1440px**. Comment `DetailStatCards.tsx:28` và design-spec `:242` đã ghi con số này.
4. `DetailStatCards.tsx:31` nhãn `break-words` (`overflow-wrap: break-word`) → từ dài hơn 67px ("Everbloom") bị cắt giữa từ; tên nhiều từ xuống dòng từng chữ; `note` (`formatAreaRange`, `src/lib/projects/project-detail-view.ts:21-25`) có khoảng trắng thường trước "m²" nên "m²" rơi dòng riêng.

## Hướng sửa đề xuất (chờ user chọn — mặc định A)
- **A (đề xuất):** ≥ xl **xếp chồng**: lưới thông tin (`DetailInfoGrid columns={2}`) rộng hết, thẻ Sản phẩm bên dưới rộng hết cột trái (~728px). Bỏ biến thể `columns={3}` (chỉ 1 nơi dùng) và nhánh `xl:text-h2-sm/xl:text-h3` thu nhỏ số; thẻ dùng `auto-fill minmax(~11rem,1fr)` → 3–4 thẻ/hàng ~170–230px, tên ~45 ký tự xuống 2–3 dòng theo từ. Giữ `break-words` làm lưới an toàn cuối.
- **B:** giữ 2 cột 11fr/9fr như design BL-052, thẻ Sản phẩm **1 cột** ở xl (~320px/thẻ). Đọc được nhưng 5–6 loại sản phẩm thì cột phải rất cao, lệch với lưới thông tin.
- Cả hai: "m²" không tách khỏi số (NBSP trong `formatArea`/`formatAreaRange` hoặc `whitespace-nowrap` cho `note`) — builder chọn cách nhỏ nhất, kiểm test hiện có của `formatAreaRange`.
- Token: giữ nguyên `bg-primary-subtle`, `rounded-[16px]`, `text-h2` vàng `text-accent-text`, `text-small`/`text-xsmall` — không thêm màu/hex.

## Acceptance (từ change doc)
- [x] Tên dài ~45 ký tự (vd "The Elton – Liền kề, song lập The Royal (CT07)") không cắt giữa từ, không dọc từng chữ ở 1440px và 1920px.
- [x] Số lượng + diện tích không vỡ dòng ("m²" đi cùng số).
- [x] 375px / 768px vẫn như cũ (2 cột auto-fill ở 375px). — 375px giữ 2 cột; 768px nay 3 thẻ/hàng (~206px, trước ~4) — thay đổi có chủ đích theo phương án A, ghi ở design-spec.
- [x] Cho thuê / Tin BĐS (`columns="auto"`) không đổi.

## Scope
1. Sửa theo phương án được duyệt.
2. Test (vitest, TDD — fail trước, pass sau): cập nhật `DetailBlocks.test.tsx` (bỏ khẳng định `xl:grid-cols-3`/`col-span-3` nếu chọn A); test `ProjectOverview`/`project-detail.test.tsx` khẳng định bố cục ≥ xl mới (class lưới); test "m²" không tách dòng nếu đổi formatter.
3. Doc reconcile: `.context/design-spec.md:242`, `docs/DESIGN.md:277` (as-built). Không sửa intent docs.

## Verification plan
- `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` (`.context/project-config.md`).
- Trình duyệt (dev local, light theme), viewport **375 / 768 / 1440 / 1920**, trên: **The Windsor Collection**, **Maison Privée**, **Astor 1** (dữ liệu thật staging — chạy local trỏ DB staging chỉ đọc, hoặc mở staging sau deploy) + **1 dự án mẫu** seed có tên sản phẩm dài ~45 ký tự (dựng tạm hoặc dùng seed sẵn có; không ghi dữ liệu vào staging).
- Ảnh chụp lưu `.context/review-reports/assets/bl071-p1t01-<project>-<vw>.png`.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Repro Verification

| Mục | Expected | Actual before fix | Actual after fix | Evidence | Status |
|---|---|---|---|---|---|
| Thẻ Sản phẩm ≥ xl, tên ~45 ký tự | Đọc được, không cắt giữa từ | ~99px/thẻ, chữ dọc, "Everbloo / m" | 1440 & 1920: 3 thẻ/hàng, 235px/thẻ, tên 45 ký tự 2 dòng, "Everbloom" 1 dòng, không overflow | Đo bằng JS trên Astor 1 (DB dev, tạm đổi tên/đếm, đã khôi phục) | PASS |
| "m²" trong dòng diện tích | Cùng dòng với số | Rơi dòng riêng | NBSP trước "m²"; mọi note 1 dòng ở 375/768/1440/1920 | Đo JS + test `formatAreaRange` | PASS |
| 375 / 768 | Như cũ (375: 2 cột) | — | 375: 2 cột 145.5px (tên dài 4 dòng theo từ); 768: 3 cột 206px; không h-scroll | Đo JS | PASS |
| Dự án không sản phẩm (MIK Vũ Yên) | Lưới thông tin rộng hết | — | dl 728px, 3 cột auto, không thẻ Sản phẩm | Đo JS | PASS |

## Verification summary
- Phương án A (user duyệt 2026-10-23). TDD: 5 test fail trước fix (DetailBlocks, project-detail ×2, project-detail-view) → pass sau.
- `pnpm typecheck` PASS · `pnpm test` 436 file / 4587 test PASS · eslint các file scope sạch · `pnpm build` KHÔNG chạy (tránh phá `.next` của dev server port 3000) → residual.
- Ảnh chụp không lưu được (pane không xuất file); ghi số đo thay thế. Chưa kiểm The Windsor / Maison Privée riêng (cùng cấu trúc, dữ liệu 6–7 loại).

## Doc impact
- `.context/design-spec.md` (bố cục Tổng quan) + `docs/DESIGN.md` (ghi chú BL-056) — reconcile as-built BL-071. Không đổi API/schema.
