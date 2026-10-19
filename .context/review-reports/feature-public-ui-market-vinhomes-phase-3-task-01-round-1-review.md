Agent: reviewer

> Ghi bởi primary (change-request) — guard chặn reviewer ghi vào worktree. Nội dung nguyên văn từ reviewer.

# Review: feature-public-ui-market-vinhomes · phase-3-task-01 · round 1

## Review level
**STRICT**

## Reason
Đổi bộ lọc + hợp đồng URL query (link chia sẻ, SEO); đụng component dùng chung `PageBanner` (pháp lý, liên hệ, dịch vụ, 404), `RentalCard`, `ListSearchBar` mới (P3-T02 dùng lại), `ui/popover.tsx` mới.

## Blast radius
- Trang danh sách cho thuê: `/cho-thue`, `/en/for-rent`, danh mục (S05), khu vực — băng tìm kiếm, Sheet/Popover lọc, sắp xếp, hàng kết quả, lưới.
- `PageBanner`: size mặc định không đổi (có test); chỉ `size="compact"` khác.
- `RentalCard`: kiểu thẻ trắng mới áp mọi nơi dùng thẻ.
- `url-params.ts`: thêm `secondaryFilterCount`.
- i18n: `page.rentals.resultCount` đổi chữ VI/EN.

## Verify commands + result (trong worktree)
| Command | Result |
|---|---|
| `pnpm lint` | PASS — 0 error; 2 warning cũ ở `tools/task-dashboard/server.mjs` |
| `pnpm typecheck` | PASS |
| `pnpm test src/components/rentals src/components/layout/PageBanner.test.tsx src/components/listing src/lib/search` | PASS 10 files / 118 tests |
| `pnpm test` (full) | primary chạy: 281 files / 2970 tests PASS |
| `pnpm build` | không chạy (builder báo PASS) |

## Requirement coverage
- D1 băng tìm kiếm dùng chung: OK. D2 banner compact `h-60` cố định: OK. D3 lưới 1/2/3/4 cột thẻ trắng bo 20px: OK.
- D4 URL không đổi: OK — golden test `rental-filter-params.test.tsx` (tên/thứ tự param, "Tất cả" = vắng, về trang 1, cặp `priceMin`/`priceMax` khớp chip giá cũ).
- Không JS: OK — form GET thật, `q`/`category` có name, param khác là hidden input; chỉ đổi giá cần JS (đã ghi).
- Lọc cũ (tỉnh, phường, giá tuỳ chọn, diện tích, PN, nội thất, chip đang lọc, Xoá hết, "Xem n tin", `focusSearch`) còn; sắp xếp có vấn đề (MAJOR-2).
- Hydration `useMediaQuery`: `useSyncExternalStore` → server `false`, không mismatch, cùng nút → không CLS.
- `aria-busy` vùng chờ: còn. Thanh lọc dính mobile bỏ: đã ghi as-built design-spec (§2.1, §3.5, S04) + DESIGN.md, khớp change doc.

## Responsive Checklist Gate (375 / 768 / 1280; tính CSS, không trình duyệt)
| Item | Result | Evidence |
|---|---|---|
| Không cuộn ngang | OK | thanh xếp dọc < lg, field `min-w-0`; Popover 26rem chỉ ≥1024 |
| Media query mobile-first | OK | `sm:`/`lg:`/`xl:` |
| Lưới | OK | 1/2/3/4 (D3) |
| Container px cố định | **FAIL** | `RentalSortControl.tsx:16` `w-44` + nhãn → 375px còn ~53px cho giá trị, "Mới nhất"/"Giá giảm dần"/"Price: low to high" bị cắt (MAJOR-1) |
| Font rem/clamp | OK | token |
| Ảnh aspect + sizes | OK | 4:3, sizes theo 4 cột |
| Vùng chạm ≥ 44px | OK | 48px |
| 100vh | OK | `dvh` / `90svh` |
| Reduced motion | OK | không motion mới |
| overflow hidden | OK (residual) | banner compact clamp mô tả 2 dòng, h1 không clamp — tên danh mục EN dài ở 375 có thể bị cắt |

Gate: **FAIL** (sort không đọc được ở 375px).

## Skill gates
aislop/ocr/oxlint: skip (không cấu hình/không cho phép); ESLint 0 error. AI-readable OK (1 chỉ dấu: dòng doc cũ MINOR-1). ai-friendly-web / blitzstrike: N/A.

## Findings
### [MAJOR-1] Sort control không đọc được ở 375px
`src/components/rentals/RentalSortControl.tsx:16` `w-44 shrink-0 flex-row items-center gap-3 sm:w-64` — nhãn ~67px + padding/caret 56px → giá trị bị cắt. Fix: nhãn `sr-only` < sm (hiện từ sm), select theo nội dung (`w-auto min-w-[11rem]` / `flex-1 max-w-64`) hoặc hàng kết quả `flex-wrap`; kiểm 375/768 VI+EN.

### [MAJOR-2] Sắp xếp tách khỏi live draft → giá trị cũ + mất bộ lọc
`RentalSortControl.tsx:14-15` dựng query từ props URL (`filters`), hiện `filters.sort` (trước đây sort nằm trong `useLiveDraft`).
1. Khi server đang render lại, select nhảy về sort cũ.
2. Đổi Loại/Giá/Popover rồi đổi sort trước khi server trả → URL thay bằng URL cũ không có lọc vừa chọn; `useLiveDraft` coi là đổi URL ngoài → reset draft, mất lọc + từ khoá.
3. Từ khoá đang chờ debounce 300ms bắn sau khi đổi sort → ghi đè sort.
Vùng chờ (`PendingRegion.tsx:49`) chỉ làm mờ, không chặn click.
Fix: 1 live draft duy nhất — expose `{ draft, update }` qua context `RentalListNavigation` (hoặc provider client bọc cả thanh + hàng kết quả); sort dùng `value={draft.sort}` + `update({ sort }, "now")`. Test: đổi category khi đang pending rồi đổi sort → `router.replace` cuối có cả `category` và `sort`.

### [MINOR-1] design-spec §3.5 còn dòng cũ mâu thuẫn ("≥ lg: thanh ngang trên lưới … hoặc popover") → đổi thành "≥ lg: lọc phụ trong Popover".
### [MINOR-2] Badge Bộ lọc không đếm giá tuỳ chọn nhưng "Xoá" của Sheet (`RentalFilterSheet.tsx:52` `CLEARED`) xoá `priceMin`/`priceMax` → ghi rõ §3.5 hoặc bỏ giá khỏi `CLEARED`.
### [MINOR-3] Mobile phải cuộn lên đầu để đổi lọc (bỏ thanh dính) — đã ghi docs, khớp change doc; nêu ở checkpoint.
### [NIT-1] `page.rentals.filtersLabel` (`vi.json:290`/`en.json:290`) không còn dùng.
### [NIT-2] Popover không có nút "Đóng" nhìn thấy (`RentalFilterPopover.tsx:25`); Esc/click ngoài + trả focus đã có. Tuỳ chọn.

## Residual risk
- h1 compact banner tên EN dài ở 375 (chưa kiểm trình duyệt).
- RentalCard kiểu mới ở mọi nơi dùng — spot-check 375/1280.
- Không chạy lại full test/build (dựa báo cáo primary/builder).

## Verdict
**FAIL** — MAJOR-1, MAJOR-2 → về builder. Phần còn lại (URL contract, no-JS, banner, lưới, a11y thanh/Popover/Sheet, hydration) tốt.
