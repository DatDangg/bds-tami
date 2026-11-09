# bug-search-area-still-fails · phase-1-task-01 — Tìm "ba đình" ở Cho thuê ra tin ngoài khu vực (BL-110, QA 22 "Vẫn lỗi")

- Change doc: `spec/changes/2026-11-05-search-area-still-fails.md` (BACKLOG BL-110) — mục "Quyết định (user 2026-11-05)".
- Phụ thuộc: không.
- Trạng thái: `done` — NORMAL PASS round 1 (`.context/review-reports/bug-search-area-still-fails-phase-1-task-01-round-1-review.md`); MINOR: reindex staging/prod sau deploy (`pnpm reindex:rentals-search`) là bước vận hành bắt buộc

## Classification / Risk
- Type: **BUG** (đổi nguồn dựng `searchText`; không đổi schema/API shape).
- Severity: medium (kết quả tìm kiếm sai).
- Risk: **MEDIUM** — đổi dữ liệu dẫn xuất `rentals.searchText` của MỌI tin (cần reindex); hook phường đổi tên kích hoạt reindex; ảnh hưởng tìm theo tên cũ (người dùng gõ tên quận cũ sẽ không còn ra — đây là quyết định user).
- Expected review level: NORMAL (STRICT nếu chạm job/bulk update ngoài phạm vi dưới).
- Doc impact dự kiến: `docs/ERD.md` §4.2 bảng wards (dòng `legacyNames` "dùng cho tìm kiếm"), §4.2 ghi chú "Đổi tên tỉnh, tên phường hoặc `legacyNames` → dựng lại searchText", §6 (`rentals.searchText` sinh từ … `legacyNames[].name` …; danh sách trigger reindex). `docs/ERD.md` đang bẩn ngoài scope → builder vẫn sửa các câu đó trong working tree và **liệt kê chính xác old→new** trong mục Doc impact (change-request sẽ stage riêng phần này).

## Root cause (đã chứng minh — user chốt 2026-11-05)
`readWardNames` / `buildForLocale` (`src/hooks/rentals/build-search-text.ts:49-60`, gộp ở dòng ~73) đưa `ward.legacyNames[].name` vào `searchText`; tên cũ có đuôi ", Quận Ba Đình" (vd phường Hồng Hà ← "Phường Phúc Xá, Quận Ba Đình") → mọi tin Hồng Hà khớp "ba đình".

## Thiết kế fix (quyết định user — chỉ theo tên mới)
1. `build-search-text.ts`: bỏ hẳn `legacyNames` khỏi chuỗi tìm kiếm — chỉ giữ tên phường hiện hành (+ tỉnh, dự án… như cũ). Đọc ward chỉ `select: { name: true }`.
2. `src/hooks/wards/reindex-rentals.ts`: nguồn so sánh `wardSearchSource` bỏ `legacyNames` → đổi tên cũ KHÔNG còn kích hoạt reindex (chỉ đổi `name`). Cập nhật comment.
3. `src/collections/Wards.ts`: comment đầu file + `admin.description` của `legacyNames` bỏ "để tìm kiếm"/"dùng cho tìm kiếm" (vd "Tên đơn vị cũ trước 01/07/2025, chỉ để tra cứu — không dùng cho tìm kiếm."). Description không sinh migration.
4. Reindex: dữ liệu hiện có giữ `searchText` cũ tới khi dựng lại → chạy `pnpm reindex:rentals-search` trên DB dev local để xác minh (nếu DB dev chạy được); staging/prod là bước vận hành sau deploy — builder ghi rõ lệnh + chỗ chạy vào mục "Residual risk"/"Vận hành sau deploy" (không tự chạy trên staging/prod). Kiểm script reindex dùng chung `buildForLocale` (không có bản sao logic cũ).
5. Tìm mọi chỗ khác còn ghép `legacyNames` vào text tìm kiếm (`grep -rn legacyNames src`) — chỉ sửa chỗ thuộc search; seed/import giữ nguyên.

## Files
- Sửa: `src/hooks/rentals/build-search-text.ts`, `src/hooks/wards/reindex-rentals.ts`, `src/collections/Wards.ts`, test liên quan (vd `build-search-text.test.ts`, test reindex wards, test integration search nếu có — builder tìm), `docs/ERD.md` (chỉ các câu liệt kê ở trên).
- KHÔNG đụng: `src/payload-types.ts`, migration, `src/i18n/messages/*`, file bẩn ngoài scope (`src/jobs/**` đang bẩn — nếu job reindex nằm trong `src/jobs/` và CẦN sửa → DỪNG báo lại, không sửa).

## Acceptance
- [ ] `searchText` của tin thuộc phường có tên cũ "…, Quận Ba Đình" (vd Hồng Hà) KHÔNG còn chứa "ba dinh"; tin thuộc phường Ba Đình hiện hành vẫn chứa.
- [ ] Tìm `q=ba đình` (unit/integration theo test hiện có của BL-103) không ra tin chỉ khớp qua tên cũ.
- [ ] Đổi `legacyNames` của phường không kích hoạt reindex; đổi `name` vẫn kích hoạt.
- [ ] Test hồi quy fail trước / pass sau.
- [ ] ERD + Wards.ts mô tả khớp hành vi mới.
- [ ] `pnpm typecheck`, `pnpm lint`, vitest `src/hooks/rentals src/hooks/wards src/lib/search` (+ integration nếu DB có) PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Repro Verification
- Original repro: `/cho-thue?q=ba+đình` ra tin phường Hồng Hà (không thuộc Ba Đình) vì tên cũ "Phường Phúc Xá, Quận Ba Đình".
- Expected: tin phường Hồng Hà (tên cũ "Phường Phúc Xá, Quận Ba Đình") không ra khi tìm "ba đình"; tin phường Ba Đình hiện hành vẫn ra.
- Actual before fix: `searchText` gồm `legacyNames[].name` → chứa "phuc xa, quan ba dinh" → khớp "ba dinh". Test mới fail 4/4 trên code HEAD (xác nhận bằng cách trả tạm 2 file nguồn về HEAD, rồi khôi phục).
- Actual after fix: `buildForLocale` chỉ ghép tên phường hiện hành; test mới PASS; đổi chỉ `legacyNames` không kích hoạt reindex, đổi `name` vẫn kích hoạt.
- Evidence: `src/hooks/rentals/build-search-text.test.ts` (3 test, mock `findByID`), `src/hooks/wards/reindex-rentals.test.ts` (test mới "chỉ đổi tên cũ"); `pnpm vitest run src/hooks/rentals src/hooks/wards src/lib/search` = 9 file / 101 test PASS; `pnpm typecheck` sạch; eslint file đổi sạch. Script `reindex-rental-search-text.ts` và hook `refreshOtherLocaleSearchText` đều dùng chung `buildForLocale` (không có bản sao logic cũ); `grep legacyNames src` chỉ còn Wards.ts (định nghĩa field) + 2 file đã sửa + test.
- Status: PASS (mức unit; chưa chạy integration/DB dev, chưa reindex dữ liệu thật).

## Residual risk
- `searchText` của tin hiện có vẫn chứa tên cũ cho tới khi dựng lại. **Vận hành sau deploy** (chạy trên server staging rồi prod, theo runbook deploy; KHÔNG chạy trong task này): `pnpm reindex:rentals-search` (= `payload run scripts/reindex-rental-search-text.ts`). Chưa chạy trên DB dev local.
- Hệ quả đã được user chốt: gõ tên quận/phường cũ (vd "phuc xa") không còn ra tin của phường mới.
- Dữ liệu mẫu CT-000019/020/048 ngoài scope.
- Không migration; `admin.description` không sinh migration.

## Doc impact
`docs/ERD.md` (Edit chính xác 4 câu, không reformat):
1. §4.2 dòng wards `legacyNames`: "...; dùng cho tìm kiếm (LGL-01). Bảng `wards_legacy_names`" → "...; chỉ để tra cứu, không dùng cho tìm kiếm (LGL-01, BL-110). Bảng `wards_legacy_names`".
2. §4.2 ghi chú: "- Đổi tên tỉnh, tên phường hoặc `legacyNames` → dựng lại" → "- Đổi tên tỉnh hoặc tên phường (không gồm `legacyNames`) → dựng lại".
3. §6 `rentals.searchText`: "+ tên phường + `legacyNames[].name` của phường + tên tỉnh" → "+ tên phường (không gồm `legacyNames`, BL-110) + tên tỉnh".
4. §6 trigger reindex: "tên/`legacyNames` của `wards`" → "tên của `wards` (không gồm `legacyNames`)".

**Close-out (change-request):** `docs/ERD.md` KHÔNG nằm trong commit BL-110 — working tree ERD đang có bản viết lại ngoài scope (khác cấu trúc HEAD), 4 câu trên đã sửa trong working tree và sẽ đi cùng commit của việc viết lại ERD.
