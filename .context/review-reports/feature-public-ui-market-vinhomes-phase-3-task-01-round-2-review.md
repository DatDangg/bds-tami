Agent: reviewer

> Ghi bởi primary (change-request) — guard chặn reviewer ghi vào worktree. Nội dung theo báo cáo reviewer.

# Review: feature-public-ui-market-vinhomes · phase-3-task-01 · round 2

## Review level
**STRICT**

## Reason
Đổi hợp đồng URL query của bộ lọc; component dùng chung (`PageBanner`, `RentalCard`, `ListSearchBar` mới, `ui/popover.tsx` mới); round 2 refactor state client (draft lọc chuyển vào context `RentalListNavigationProvider`).

## Blast radius
- Trang cho thuê `/cho-thue`, `/en/for-rent`, danh mục (S05): thanh tìm kiếm, Sheet/Popover, sắp xếp, hàng kết quả, lưới.
- Dùng chung: `PageBanner` (chỉ `compact` khác), `RentalCard`, `url-params.ts` (`secondaryFilterCount`, `PRICE_HINT_RANGES`), i18n `page.rentals.*`.
- Context: provider nhận `filters`, sở hữu `useLiveDraft`; consumer render lại theo provider (bỏ `useMemo`) — chấp nhận ở quy mô này.

## Verify commands + result (worktree `D:/prj/bds/.claude/worktrees/bl020-p3p5`)
| Command | Result |
|---|---|
| `pnpm lint` | PASS — 0 error, 2 warning cũ `tools/task-dashboard/server.mjs` |
| `pnpm typecheck` | PASS |
| `pnpm test src/components/rentals src/components/listing src/lib/search src/components/layout` | PASS 25 files / 224 tests (noise jsdom "Not implemented: navigation…", không fail) |
| `pnpm test` (full), `pnpm build` | builder: 281 files / 2973 tests PASS, build PASS |

## Đóng finding round 1
| Finding | Status | Evidence |
|---|---|---|
| MAJOR-1 sort 375px | Resolved | `RentalSortControl.tsx:12` nhãn `max-sm:sr-only`, wrapper `min-w-0 flex-1 … sm:flex-none`, select `w-full min-w-[11rem] sm:w-56`; 375 còn ~200px cho select; ≥768 nhãn hiện, select 224px; ẩn khi 0 kết quả |
| MAJOR-2 sort tách draft | Resolved | `RentalListNavigation.tsx:288-289` một `useLiveDraft` trong provider; sort `update({sort},"now")` gồm lọc chờ + từ khoá chưa debounce, xoá timer; test `RentalFilters.test.tsx:223-244` |
| MINOR-1 docs | Resolved | design-spec §3.5 "≥ lg: lọc phụ trong Popover (có nút Đóng)" |
| MINOR-2 badge vs Xoá | Resolved | `url-params.ts:417-438` `PRICE_HINT_RANGES` nguồn duy nhất (`FilterFields.tsx:29`); giá tuỳ chọn không khớp gợi ý đếm 1; test `RentalFilters.test.tsx:159`; `CLEARED` giữ `q`, `category` |
| NIT-1 key thừa | Resolved | bỏ `page.rentals.filtersLabel` VI/EN |
| NIT-2 nút Đóng | Resolved | `RentalFilterPopover.tsx:25` `PopoverClose` 44px, aria-label, focus ring |

## Kiểm hồi quy refactor
- URL → draft khi điều hướng ngoài (gỡ chip, Xoá, back/forward): còn (test `:182`, giữ chữ đang gõ `:191`).
- Provider bọc cả thanh và kết quả (`RentalListPage.tsx:317`).
- Hydration: draft khởi tạo từ `filters` cả server/client; `useMediaQuery` server `false` → Sheet trước, Popover sau cùng nút, không CLS; SSR test `:135`.
- Nút tìm/Enter: `submit()` xoá debounce, commit draft (test `:81`, `:92`).

## Responsive Checklist Gate (375/768/1280, tính CSS)
Không cuộn ngang OK · mobile-first OK · lưới 1/2/3/4 OK · container px cố định OK (`w-44` đã bỏ) · font token OK · ảnh 4:3 + sizes OK · vùng chạm ≥ 44px OK · không 100vh OK · reduced motion OK · overflow OK (residual h1 EN dài). **Gate: PASS**

## Skill gates
aislop/oxlint/ocr: skip (không cấu hình). AI-readable OK. ai-friendly-web / blitzstrike: N/A.

## Findings
### [MINOR-1] Sheet mobile vẫn khởi tạo từ `filters` URL, không từ draft chung
`RentalFilterSheet.tsx:52` `setDraft(draftOf(filters))`; `RentalFilters.tsx:193` truyền `filters` + `sort={draft.sort}`. Đổi Loại/Giá trên thanh rồi mở Sheet bấm "Xem n tin" trước khi server trả → mất lựa chọn vừa chọn / từ khoá chờ debounce; timer có thể ghi đè URL của Sheet. Cửa sổ thời gian nhỏ, hành vi cũ với `q` → không chặn. Gợi ý: seed Sheet từ draft context + áp qua `commit`/`update` chung hoặc xoá timer trước điều hướng.
### [NIT-1] Context value object mới mỗi render (`RentalListNavigation.tsx:289`) — thêm `useMemo` khi nhiều consumer.

## Residual risk
- h1 tên danh mục EN dài trên banner compact 375px chưa kiểm trình duyệt.
- RentalCard kiểu mới ở mọi nơi — spot-check 375/1280.
- Full test/build không chạy lại bởi reviewer.

## Verdict
**PASS** — MAJOR-1/MAJOR-2 + MINOR/NIT round 1 đã sửa; không lỗi CRITICAL/MAJOR mới; responsive gate PASS. MINOR-1/NIT-1 chuyển sang P3-T02.
