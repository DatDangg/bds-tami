# bug-project-location-address-dedupe · phase-1-task-01 — Địa chỉ lặp phường/tỉnh (BL-081)

- Change doc: `spec/changes/2026-10-27-project-location-address-dedupe.md` (BACKLOG BL-081, QA bug 6).
- Phụ thuộc: không.
- Trạng thái: `done` — Reviewer NORMAL PASS r2 (`.context/review-reports/bug-project-location-address-dedupe-phase-1-task-01-round-2-review.md`; r1 PASS kèm MINOR đã sửa). Spec: no spec change (1.59.0), test-scope v84. Doc impact: no doc impact.

## Classification / Risk
- Type: **BUG** (hiển thị; không đổi API/schema).
- Risk: **LOW-MEDIUM** — helper hiển thị địa chỉ dùng cho dự án + cho thuê.
- Expected review level: **NORMAL**.
- Doc impact: dự kiến `no doc impact`.

## Repro
- `/du-an/astor-1` "Vị trí dự án": "Lô đất IA25, KĐT Nam Thăng Long (Ciputra), phường Phú Thượng, Hà Nội, Phường Phú Thượng, Hà Nội".

## Root cause
- `src/components/projects/ProjectLocation.tsx:63` — `[address, areaLabel].filter(Boolean).join(", ")` không kiểm; `address` admin nhập đã gồm phường + tỉnh; `areaLabel` dựng ở `src/lib/projects/project-detail-view.ts:306` (`ward.name`, `province.shortName || name`).
- Cùng mẫu: `src/lib/rentals/rental-view.ts:81-84` `addressLine` = `address` (khi `showExactAddress`) + `placeNames(ward, province)` → lặp được khi address có phường/tỉnh.

## Thiết kế fix
- 1 helper thuần: `joinAddress(street, parts[])` — bỏ phần `parts` đã có trong `street`, so sánh sau chuẩn hoá không dấu + không phân biệt hoa thường (`normalizeSearchText` của `src/lib/search/normalize.ts` hoặc tương đương), theo ranh giới từ (không coi "Hà" khớp "Hà Nội"); thiếu phần nào chỉ thêm phần thiếu. Cân nhắc tiền tố "Phường/Xã/P." — tối thiểu khớp tên phường đầy đủ như dữ liệu, ghi rõ giới hạn.
- Áp dụng ở `ProjectLocation` và `rental-view.ts` `addressLine`; kiểm các chỗ khác (tin BĐS `post-view.ts`, `ProjectOverview`, `ProjectDetail.tsx:189`) — chỗ nào chỉ dùng 1 nguồn thì không cần.

## Files
- `src/components/projects/ProjectLocation.tsx`, `src/lib/rentals/rental-view.ts`, helper mới + test.
- KHÔNG đụng file dirty việc khác (`src/collections/*`, `src/fields/ward-in-province.ts`, `package.json`, `pnpm-lock.yaml`, `tools/*`, `.gitignore`, `.claude/settings.json`, importMap.js, BACKLOG.md).

## Acceptance
- [x] address đã chứa phường/tỉnh (không dấu, không phân biệt hoa thường) → không ghép lại; thiếu phần nào thêm phần đó.
- [x] Cùng quy tắc cho cho thuê (và nơi khác nếu lặp).
- [x] Test (ca Astor → "Lô đất IA25, KĐT Nam Thăng Long (Ciputra), phường Phú Thượng, Hà Nội"); typecheck · unit test · eslint · build PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Decision log
- 2026-10-27 (change-request): root cause có file:line → không spawn Explore.

## Repro Verification
- Original repro: `/du-an/astor-1` "Vị trí dự án" với address "Lô đất IA25, KĐT Nam Thăng Long (Ciputra), phường Phú Thượng, Hà Nội" + areaLabel "Phường Phú Thượng, Hà Nội".
- Expected: địa chỉ không lặp phường/tỉnh.
- Actual before fix: `[address, areaLabel].join(", ")` → "...phường Phú Thượng, Hà Nội, Phường Phú Thượng, Hà Nội" (ghép mù; không đổi được hành vi vì không có kiểm tra nào).
- Actual after fix: render `ProjectLocation` ra đúng chuỗi address, một lần (test `project-location-address.test.tsx`); thiếu tỉnh → thêm tỉnh.
- Evidence: unit `src/lib/address/join-address.test.ts` (7 ca: Astor, không dấu/hoa-thường, thiếu tỉnh/phường, rỗng, ranh giới từ "Hà"/"Phường 1", tiền tố P./bỏ tiền tố, giới hạn TP.HCM), `rental-view.test.ts` (+1 ca), `project-location-address.test.tsx` (2 ca). typecheck PASS · vitest unit+ui 3816 PASS · eslint file đổi sạch · build PASS. Chưa kiểm tay /vi/du-an/<slug> (không bắt buộc).
- Status: PASS (chờ reviewer).

## Decision log (builder)
- Helper thuần `src/lib/address/join-address.ts` `joinAddress(street, parts[])`: token hoá bằng `normalizeSearchText` + tách non-alnum, khớp dãy token liền nhau (ranh giới từ); thử cả dạng bỏ tiền tố hành chính (phuong/xa/thi tran/quan/huyen/tinh/thanh pho/tp/p/q/x), trừ khi phần còn lại không có chữ ("Phường 1" giữ nguyên để "1" không khớp "Số 1").
- Áp ở `ProjectLocation` (areaLabel tách theo ",") và `rental-view.ts addressLine`; thêm `du-an/[slug]/page.tsx:140` (address JSON-LD, cùng mẫu lặp).
- Kiểm chỗ khác, không đổi: `post-view.ts` (placeLabel chỉ ward+province, không có address), `ProjectOverview.tsx:50` và `ProjectDetail.tsx:189` dùng `areaLabel ?? address` (một nguồn), `rental-view.ts:217/240` areaLabel chỉ ward+province.
- Giới hạn: không có bảng bí danh nên tên tỉnh khác dạng (shortName "TP.HCM" vs address "Thành phố Hồ Chí Minh") vẫn ghép; ghi trong JSDoc + test.

### Round 2 (sửa MINOR reviewer r1)
- Dạng bỏ tiền tố giờ chỉ coi là đã có khi khớp TRỌN một đoạn address (tách dấu phẩy); dạng đầy đủ vẫn theo ranh giới từ cả chuỗi. `joinAddress("123 Lê Lợi", ["Phường Lê Lợi","Bình Định"])` → "123 Lê Lợi, Phường Lê Lợi, Bình Định"; "P. Lê Lợi" là đoạn riêng thì vẫn bỏ.
- `joinAddress` nhận thêm chuỗi areaLabel (tự tách); bỏ `areaLabel.split(",")` ở ProjectLocation + du-an page. Test +2 ca. typecheck · vitest (address/rentals/projects 147) · eslint · build PASS. Status task không đổi.
