# bug-admin-media-list-columns · phase-1-task-01 — Admin Thư viện ảnh & tệp: bật cột ở "Hiển thị cột" nhưng cột không hiện (BL-099)

- Change doc: `spec/changes/archive/2026-10-28-admin-media-list-columns.md` (BACKLOG BL-099, QA sheet 28/10 dòng 16, Thấp).
- Phụ thuộc: không. Batch BL-095→BL-100 user duyệt "auto proceed".
- Trạng thái: `done` — Reviewer NORMAL PASS r1 (`.context/review-reports/bug-admin-media-list-columns-phase-1-task-01-round-1-review.md`). Spec: no spec change (1.61.0), test-scope v103. Doc impact: no doc impact ngoài comment as-built trong `_media-grid.scss` (A9 không quy định ẩn cột).

## Classification / Risk
- Type: **BUG** (UI admin, CSS list view Media; không đổi schema/API/access/config collection).
- Risk: **LOW–MEDIUM** — chỉ `src/components/admin/styles/_media-grid.scss` (scoped `.collection-list--media:not(:has(.list-drawer__header))`), nhưng là CSS admin dùng chung trên một màn có nhiều chế độ (lưới thẻ, chọn nhiều, drawer chọn ảnh).
- Expected review level: **NORMAL** (reviewer tự chọn).
- Doc impact dự kiến: `SPECIFICATIONS.md` (A9) / `spec/` — để `spec-publisher` quyết định; as-built: comment đầu `_media-grid.scss`.

## Repro
- Admin, `/admin/collections/media?depth=1&columns=["filename","alt","mimeType","uploadedBy","id","caption","updatedAt","createdAt"]&limit=5`, 1920 + 390.
- Playwright Edge (script `C:\Users\datda\AppData\Local\Temp\claude\D--prj-bds\252b8873-425c-4c6a-966c-b60b663a3c53\scratchpad\bl099\shot.mjs <before|after>`, chạy `node <script> <label>` từ `D:\prj\bds`; đăng nhập bằng `DEV_ADMIN_EMAIL/DEV_ADMIN_PASSWORD` trong `.env.local`, không in ra). Ảnh trước: `.context/review-reports/assets/bl099-before-{qa-1920,qa-390,default-1920}.png`.
- Đo DOM trước fix: Payload **có render** đủ `th#heading-{uploadedBy,id,caption,updatedAt,createdAt}` và `td.cell-{uploadedBy,id,caption,updatedAt,createdAt}` kèm dữ liệu đúng (vd `cell-updatedAt` "23/10/2026 16:55", `cell-id` "ID: 87c1…", `cell-uploadedBy` "—" vì ảnh seed không có người tải), nhưng mọi `td` đó có `display: none` (tất cả `th` trừ ô chọn cũng `none`). Thẻ 164×238 giống hệt cấu hình 4 cột mặc định.

## Root cause (change-request, từ code + đo)
- `src/components/admin/styles/_media-grid.scss` (A9, BL-051 GĐ2 — lưới thẻ Thư viện chỉ bằng CSS):
  - quy tắc `tbody tr td:not(.cell-_select, .cell-filename, .cell-alt, .cell-mimeType) { display: none; }` (comment: "mọi ô khác (uploadedBy, cột người dùng thêm...) ẩn khỏi thẻ") → mọi cột bật thêm ở "Hiển thị cột" bị ẩn, kể cả `uploadedBy` vốn nằm trong `defaultColumns`.
  - `thead th { display: none; }` → tiêu đề cột cũng ẩn nên ô không có nhãn.
- Không phải do `admin.disableListColumn` (chỉ đặt cho các cỡ ảnh `imageSizes`) hay access (`uploadedBy` read `isStaff`, admin đọc được — ô có trong DOM), cũng không có list view tuỳ biến (`Media.ts` không khai `admin.components.views`).
- Spec A9 (`SPECIFICATIONS.md` dòng ~204) chỉ quy định thẻ có ảnh + mô tả/tên tệp + loại tệp; **không** quy định ẩn các cột người dùng bật → ẩn là lựa chọn cài đặt, không phải intent. Change doc yêu cầu cột bật phải hiện.

## Thiết kế fix (quyết định của change-request)
- Giữ lưới thẻ A9 (không đổi về bảng, không đổi `defaultColumns`, không đổi schema/config).
- Mọi ô ngoài 4 ô thẻ (`_select`, `filename`, `alt`, `mimeType`) **hiện thành dòng thông tin phụ ở cuối thẻ**: "Nhãn: giá trị", chữ 12px màu muted, xuống dòng được (`overflow-wrap: anywhere` cho UUID dài), không tràn ngang thẻ; đệm trái/phải 12px như các dòng khác; dòng cuối có đệm đáy 12px (thẻ vẫn kết thúc gọn khi không có dòng phụ — giữ nguyên số đo thẻ cấu hình 4 cột: badge loại tệp vẫn bám đáy khi chỉ có 4 ô).
- Nhãn bằng `::before` theo class ô cho các cột Media có thể bật: `uploadedBy` "Người tải lên", `caption` "Chú thích", `createdAt` "Ngày tạo", `updatedAt` "Ngày cập nhật", và các cột upload Payload khác có trong "Hiển thị cột" (builder kiểm danh sách thật trong ô chọn cột: vd `filesize`, `width`, `height`, `url`, `thumbnailURL`, `focalX`, `focalY` … — nhãn đúng chữ tiêu đề cột Payload đang hiện). **`id` KHÔNG thêm nhãn** — Payload DefaultCell đã render "ID: …". Cột lạ không có nhãn vẫn hiện giá trị (không ẩn).
- Dòng phụ nằm dưới lớp phủ liên kết thẻ là chấp nhận được (cả thẻ vẫn bấm mở màn sửa); không thêm tương tác mới.
- Không đổi: drawer chọn ảnh (bảng gốc), collection khác, chọn nhiều/thanh hàng loạt, "Chọn tất cả trên trang".
- Cập nhật comment đầu file / comment quy tắc cho đúng as-built.

## Files
- `src/components/admin/styles/_media-grid.scss`, `src/components/admin/media-grid-style.test.ts` (test BL-099).
- KHÔNG đụng file dirty ngoài batch: `.claude/settings.json`, `.gitignore`, `package.json`, `pnpm-lock.yaml`, `tools/agent-live.mjs`, `tools/vibe-studio/src/live-state.ts`, `.claude/hooks/live-studio.mjs`, `.context/review-reports/assets/bl054-*`, `spec/changes/*`.

## Acceptance
- [x] URL QA ở 1920 và 390: ô Người tải lên / ID / Chú thích / Ngày cập nhật / Ngày tạo **hiện** trong mỗi thẻ (display ≠ none) với dữ liệu đúng + nhãn (ID dạng "ID: …"); thẻ không tràn ngang, trang không cuộn ngang.
- [x] Bỏ cột ở "Hiển thị cột" (về 4 cột mặc định `filename, alt, mimeType, uploadedBy` → chỉ còn dòng "Người tải lên") → cột đã tắt biến mất; lựa chọn cột lưu theo preferences Payload như collection khác (không đổi cơ chế).
- [x] Không ảnh hưởng: drawer chọn ảnh trong form (bảng gốc), list view collection khác (selector vẫn scoped `.collection-list--media`), chọn nhiều 44px.
- [x] Ảnh Playwright trước/sau `.context/review-reports/assets/bl099-{before,after}-{qa-1920,qa-390,default-1920}.png`.
- [x] Test BL-099 trong `media-grid-style.test.ts` (FAIL trước / PASS sau) + `pnpm typecheck` · `pnpm lint` · `pnpm test` PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Decision log
- 2026-10-29 (change-request): root cause từ code + đo Playwright (không spawn Explore). Chọn hiện cột thêm thành dòng phụ trong thẻ (giữ A9) thay vì chuyển về bảng — spec A9 không quy định ẩn, đổi `defaultColumns`/chuyển bảng sẽ phá lưới mặc định (uploadedBy nằm trong cột mặc định).
- 2026-10-29 (builder): bỏ quy tắc `display:none` cho ô phụ → dòng meta 12px muted cuối thẻ + nhãn ::before cho uploadedBy/caption/createdAt/updatedAt; sửa `code span` để UUID ID xuống dòng. Chỉ `_media-grid.scss` + test. Nhãn và giá trị nằm 2 dòng (giá trị là phần tử block của Payload) — chấp nhận.

## Repro Verification
- **Original repro**: URL QA ở trên, Admin, 1920.
- **Expected**: cột bật hiện trong thẻ, không vỡ bố cục.
- **Actual before fix**: 5 ô có dữ liệu trong DOM nhưng `display: none` do `_media-grid.scss`.
- **Actual after fix**: 5 ô (Người tải lên, ID, Chú thích, Ngày cập nhật, Ngày tạo) `display: block` trong mỗi thẻ, dữ liệu đúng (vd "23/10/2026 16:55", "ID: 87c13abc-…"), nhãn ::before "Người tải lên: " / "Chú thích: " / "Ngày cập nhật: " / "Ngày tạo: "; ID không nhãn (Payload đã có "ID: "). Thẻ 1920 164×458, 390 179×470, không cuộn ngang (hScroll=false). 4 cột mặc định: thẻ 164×282, chỉ thêm dòng "Người tải lên" (uploadedBy nằm trong 4 cột mặc định nên giờ hiện). Ô chọn cột Payload chỉ cung cấp 8 cột (Tên tệp, Mô tả ảnh, Loại tệp, Người tải lên, ID, Chú thích, Ngày cập nhật, Ngày tạo) → không cần nhãn thêm. UUID ID tự xuống dòng (Payload đặt inline `white-space:nowrap` trên <code> → ghi đè ở span con).
- **Evidence**: test BL-099 (3 case) FAIL trước fix (3 failed | 5 passed) → PASS sau (8/8); ảnh `.context/review-reports/assets/bl099-after-{qa-1920,qa-390,default-1920,drawer-1920}.png`; drawer chọn ảnh trong form Tin tức → "Chọn từ thư viện": bảng gốc (table/table-cell), không đổi. `pnpm typecheck`, `pnpm lint` sạch; `pnpm test` 4819 passed. Preference cột admin đã trả về 4 cột mặc định (filename, alt, mimeType, uploadedBy).
- **Status**: PASS — Reviewer NORMAL PASS r1

## Close-out (change-request)
- r1 NORMAL PASS, 2 MINOR chấp nhận (không chặn): (1) đệm đáy 12px gắn với ô cuối theo thứ tự DOM — nếu admin kéo cột phụ lên trên "Loại tệp" ở "Hiển thị cột" thì dòng cuối thẻ sát mép (thẩm mỹ); (2) regex test đầu tiên của BL-099 hơi rộng (case thứ hai đã khoá đúng hồi quy).
- Ngoài scope (có từ trước, ảnh before-qa-390): ở 390 thẻ cột phải chạm mép màn.
- Spec: no spec change (1.61.0); test-scope v103 (v102 archive). Doc impact: no doc impact (chỉ comment as-built trong SCSS).
