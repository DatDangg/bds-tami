# feature-project-detail-blocks · phase-1-task-01 — Bản đồ `LazyMap` cao 0px + nền "… tương tự" vàng nhạt

- Nguồn: BL-060 · change doc `spec/changes/2026-10-22-project-detail-blocks.md` (mục 1 + 2).
- Nhánh/worktree: `claude/bl058-project-detail-blocks-5971d4`; DB `tami_bl058` (`.env.local` worktree); dev server cổng **3058** (không dùng 3000 — đang là checkout chính).
- Không schema, không migration.

## Classification / Risk
- Type: **BUG** (mục 1) + **MODIFY** UI nhỏ (mục 2), gộp vì cùng là component dùng chung của khung chi tiết, không schema.
- Risk: **MEDIUM** — `LazyMap` dùng ở Dự án / Cho thuê / Tin BĐS / Liên hệ; `SimilarCarousel` dùng ở 3 màn chi tiết.
- Expected review level: **STRICT** (component dùng chung).
- Blast radius: `src/components/media/LazyMap.tsx` (+ test), `src/components/detail/SimilarCarousel.tsx` (+ test nếu có), doc as-built.

## Root cause (đã có `file:line` — không spawn Explore)
- `src/components/media/LazyMap.tsx:202` `<div ref={mapRef} className="absolute inset-0" />` là **chính container** đưa cho `new maplibre.Map({ container })`. MapLibre thêm class `maplibregl-map` lên container; `maplibre-gl.css` (`.maplibregl-map { position: relative; overflow: hidden }`) được import động trong `mountMap` → chèn **sau** CSS Tailwind, cùng độ đặc hiệu 1 class → thắng `.absolute` → container `position: relative` không có height → canvas cao 0px (đo trên trình duyệt: tile OSM 200, 9 marker, nhưng khung xám).

## Quyết định
1. Container MapLibre KHÔNG được tự định vị bằng class có thể bị CSS MapLibre đè. Cách khuyến nghị: giữ wrapper `absolute inset-0` (không bị MapLibre gắn class) và đặt container map bên trong `h-full w-full` (`.maplibregl-map` `position: relative` lúc đó vô hại); hoặc định vị bằng inline style. Builder chọn cách đơn giản nhất, ghi lý do trong comment 1 dòng.
2. Test vitest chống tái phát: container được truyền cho `Map` nằm trong khung và có class/kích thước phủ khung không phụ thuộc `position` của chính nó (vd assert container có `h-full w-full` và cha có `absolute inset-0`), hoặc tương đương.
3. Kiểm mọi nơi dùng `LazyMap` (`ProjectLocation`, `RentalDetail`, `PostDetail`, `/lien-he/page.tsx`): không nơi nào phụ thuộc cấu trúc DOM cũ.
4. `SimilarCarousel`: `bg-surface` → `bg-primary-subtle` (token `--color-primary-subtle` #F8F3EB, design-tokens). Link "Xem tất cả" `text-accent-text` trên nền này 4.63:1 (AA). Thẻ bên trong giữ nền trắng (thẻ tự có nền?) — builder kiểm thẻ `ProjectCard`/`RentalCard`/`PostCard` có nền `surface` riêng; nếu thẻ trong suốt thì thêm không cần thiết, ghi nhận.
   Mũi tên tròn `bg-surface` giữ nguyên. Cập nhật docstring "dải nền trắng".

## Scope
1. Sửa theo § Quyết định.
2. Test vitest (LazyMap, SimilarCarousel nếu có test).
3. Doc as-built: `.context/design-spec.md` (dòng mô tả dải "… tương tự" nếu có), `docs/DESIGN.md` nếu có mô tả nền. Không sửa intent docs.
4. Kiểm trình duyệt (cổng 3058): bản đồ phủ khung ở chi tiết Dự án + 1 Cho thuê/Tin BĐS có toạ độ + `/lien-he` (nếu có bản đồ); đo `getBoundingClientRect().height` của `.maplibregl-canvas` > 0 = chiều cao khung.

## Acceptance
- [x] Bản đồ phủ kín khung (canvas cao = khung) ở mọi nơi dùng `LazyMap`; test chống tái phát.
- [x] Dải "… tương tự" nền `bg-primary-subtle` ở 3 màn chi tiết, không hex.
- [x] `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` PASS.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Repro Verification
| Mục | Expected | Actual before fix | Actual after fix | Evidence | Status |
|---|---|---|---|---|---|
| Bản đồ | canvas cao = khung | canvas 0px (container `.maplibregl-map` position relative, không height) | /du-an/the-crown-dai-hoang-son-bac-ninh 1440: `.maplibregl-canvas` 519px = khung 519.5px, `.maplibregl-map` vẫn relative nhưng nằm trong wrapper absolute inset-0; 35 tile OSM + marker hiện. /lien-he: không có bản đồ (không cấu hình toạ độ văn phòng). Cho thuê / Tin BĐS: DB không có tin published có toạ độ (2 tin cho thuê có toạ độ là draft) → chỉ kiểm vitest (cùng component) | `du-an-crown-vi-1440-map-after-fix.jpg` | PASS |
| Nền tương tự | `bg-primary-subtle` | `bg-surface` | computed rgb(248,243,235) = #F8F3EB, thẻ trắng nổi trên nền | `du-an-crown-vi-1440-similar-bg.jpg` | PASS |

## Verification summary
- Attempt: 2 (r1 STRICT FAIL: MAJOR-1 DESIGN.md sửa nhầm đoạn lịch sử BL-045 + MINOR comment/docstring/không band dính nền) · r2 STRICT PASS.
- Review: `.context/review-reports/feature-project-detail-blocks-phase-1-task-01-round-1-review.md` (FAIL), `.context/review-reports/feature-project-detail-blocks-phase-1-task-01-round-2-review.md` (PASS). Primary lưu report (hook guard chặn reviewer Write trong worktree).
- Verify: `pnpm typecheck` PASS · `pnpm lint` 0 lỗi (2 warning cũ tools/task-dashboard) · `pnpm build` PASS · `pnpm test` full (primary): 382/387 file, 3850/3906 test PASS; fail = 4 file integration (access, jobs-email, media-upload, session-refresh — hook timeout 10s) + Header focus-trap timeout 5s. Chạy lại riêng: Header PASS; 4 file integration fail vì container `tami-postgres` crash lần 2 (04:26 UTC, backend exit code 2 lúc checkpoint CREATE/DROP DATABASE của test) → recovery mode. Không liên quan diff (chỉ UI/doc). File test liên quan diff 28 file / 295 test PASS (reviewer r2).
- Kết quả: `LazyMap` wrapper `absolute inset-0` + container `h-full w-full`; `SimilarCarousel` `bg-primary-subtle` + `border-t border-border`.
- Doc impact: `docs/DESIGN.md` as-built 3 hàng chi tiết. Không API/schema/migration.
- Residual: bản đồ Cho thuê / Tin BĐS / Liên hệ chưa kiểm trình duyệt (DB dev không có tin published có toạ độ; /lien-he chưa cấu hình toạ độ văn phòng); integration test cần chạy lại khi Postgres ổn định.
