Agent: reviewer

# Review: feature-public-ui-market-vinhomes · phase-2-task-01 · round 1 (schema global Homepage)
> Report do primary lưu (guard chặn reviewer ghi `.context/review-reports/**` trong worktree).

- **Review level:** STRICT
- **Reason:** DB schema + migration versioned (có `down` sửa tay); global `homepage` dùng chung (trang chủ public, admin, pipeline dịch); danh sách `TRANSLATABLE_FIELDS` và guard xoá media dùng chung.
- **Blast radius:** bảng `homepage`, `homepage_locales`, `homepage_rels`, `homepage_block_order`, enum `enum_homepage_block_order_block`; FK mới tới `media`, `categories`, `news`. Admin: 3 tab mới + nhóm trong tab Hero. Public: `home-view.ts` chỉ thêm 2 nhánh `return null` (rentals/news chưa render) → trang như cũ. Hook dịch hash thêm lá localized mới (trống thì không có lá). Guard xoá media chặn thêm `ctaBanner.image`. `src/payload-types.ts`. Fixture test thêm collection `News`. Không đổi API ngoài field mới của global.

## Verify commands + result (chỉ DB `tami_wt_bl020`)
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (0 error; 2 warning cũ `tools/task-dashboard/server.mjs`) |
| `pnpm typecheck` | PASS |
| `pnpm payload migrate:status` | `20261019_144259_homepage_market_blocks` Ran = Yes, batch 2 (khớp up → down → up); migration cũ đều Yes |
| `pnpm vitest run src/lib src/globals src/hooks` | PASS 101 files, 1015 tests (gồm `translatable-fields.test.ts`, `home-view.test.ts`) |
| `pnpm vitest run tests/integration/homepage.test.ts` | PASS 27/27 (cảnh báo revalidatePath/job dịch là nhiễu fixture) |
| `pnpm build` | không chạy |

Migration khớp config: migration tạo sau lần sửa cuối `Homepage.ts`; `payload-types.ts` sinh lại sau đó, diff khớp schema; homepage không có bảng versions.

## Migration review
- **up chỉ additive → không HIGH_RISK_MIGRATION:** 2 × `ALTER TYPE … ADD VALUE` (`rentals`, `news`); 7 cột `homepage` nullable/có default; 6 cột `varchar` nullable `homepage_locales`; 2 cột `uuid` nullable `homepage_rels`; 3 FK trên cột mới rỗng (media `ON DELETE SET NULL`, categories/news `ON DELETE CASCADE` chỉ xoá dòng quan hệ); 3 index. Không DROP/đổi type/`SET NOT NULL`/backfill. `ADD COLUMN … DEFAULT` hằng = chỉ metadata (PG 11+).
- **down sửa tay đúng + có tài liệu:** xoá dòng `homepage_block_order` có `block IN ('rentals','news')` **trước** khi dựng lại enum (không thì cast lỗi); xoá dòng `homepage_rels` của 3 path quan hệ mới; dữ liệu mất chỉ là dữ liệu do `up` thêm — chấp nhận cho rollback; ghi ở comment code, Decision log, ERD. Builder chạy up → down → up, giữ 3 slide + 6 dòng blockOrder.
- Residual: nếu tên `path` rels của group khác `rentals.categories`… thì `DELETE` rels không khớp → chỉ để lại dòng rỗng, không làm hỏng rollback.

## Requirements coverage
announcementBar (enabled mặc định false, text localized, link `navLinkField` — test `javascript:` 400) ✅ · heroSearch (chipProjects ≤ 6) ✅ · rentals (categories ≤ 4, `filterOptions` + validate server scope rental, test) ✅ · news (intro, posts ≤ 3) ✅ · ctaBanner `image` (chỉ ảnh), `secondaryLabel`, `secondaryLink` (`ftp://` 400) ✅ · `HOMEPAGE_BLOCKS`/`BLOCK_LABELS`/enum thêm rentals, news; blockOrder 6 khối cũ hợp lệ; trùng → 400 ✅ · danh sách dịch ✅ (VI/EN lưu riêng, không fallback) · `guard-delete.ts` đúng nhưng **chưa test** (MINOR-1) · `home-view.ts` homepage cũ không đổi ✅ · ERD §4.15 chính xác ✅ · file cấm không đụng ✅. `src/app/(payload)/admin/importMap.js` chỉ khác xuống dòng (CRLF) → **loại khỏi commit**.

## Quyết định checkpoint: rentals/news ẩn trên homepage hiện có
`orderedBlocks()` chỉ hiện khối có trong `blockOrder`; `defaultValue` 8 khối chỉ áp bản ghi mới → staging/prod (6 dòng) sẽ **không hiện rentals/news** sau P2-T03/T04 cho tới khi admin thêm ở "Thứ tự khối" — mâu thuẫn acceptance "Trang chủ có đủ các section #1–#11". Không phải lỗi P2-T01. Đề xuất giao P2-T04: (a) ghi bước triển khai/admin + cập nhật `seed/sample/homepage.ts` (an toàn nhất); (b) tự thêm khối mới thiếu lúc render — đổi luật as-built (ERD L9-T01), cần user duyệt. Tránh data migration thêm dòng (bulk transform → HIGH_RISK).

## Responsive gate: N/A (không đổi route/component/CSS)

## Skill gates
aislop skip · oxlint skip (ESLint PASS) · ocr skip · AI-readable OK (1 chỉ báo: độ dài file — MINOR-2) · ai-friendly-web N/A · blitzstrike N/A (rà tay: link qua `navLinkField`, scope category kiểm server, upload chỉ ảnh).

## Findings
Không CRITICAL, không MAJOR.
- **[MINOR-1]** `src/hooks/media/guard-delete.ts:20` guard `ctaBanner.image` chưa test (`tests/integration/homepage.test.ts:322-338` chỉ `backgroundImage`).
- **[MINOR-2]** `src/globals/Homepage.ts` 246 → 336 dòng (> 300) → tách khối mới sang `src/globals/homepage/blocks.ts`.
- **[MINOR-3]** `tests/integration/homepage.test.ts:247` test giới hạn categories dùng id giả → 400 có thể do lý do khác; assert message/path hoặc dùng 5 danh mục thật.
- **[MINOR-4]** `tests/integration/homepage.test.ts:277` tên test "mặc định đủ 8 khối" nhưng không assert default.
- Ghi chú: thông báo lỗi `validateRentalCategories` gây hiểu nhầm khi gửi trùng id (admin UI chặn trùng → chỉ thẩm mỹ).

## Residual risk
Quyết định khối ẩn phải xử lý trước khi đóng phase 2; reviewer không tự chạy lại down/up (dựa bằng chứng builder + migrate:status); job dịch cho field mới kiểm bằng test khớp config, không chạy dịch thật.

## Verdict: PASS
(MINOR-1..4 builder sửa sau review — xem Verification summary task file; importMap.js loại khỏi commit.)
