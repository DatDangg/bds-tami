# feature-admin-ux-audit-2 · phase-2-task-02 — Thư viện ảnh dạng lưới (A9)

- Nguồn: `spec/changes/2026-10-21-admin-ux-audit-2.md` (BL-051, MODIFY) — giai đoạn 2. Báo cáo `docs/reviews/2026-10-21-admin-ux-audit-2.md` §2.5, §4.5.
- Spec: `SPECIFICATIONS.md` F10, đoạn "Admin gọn — audit lần 2, giai đoạn 2 (BL-051)".
- Plan: GĐ2 = 1 phase / 6 task tuần tự (trùng importMap / payload.config / style admin). Coordinator 2026-10-21: làm cả GĐ2 trong lượt này, không dừng hỏi (user "tự làm tự quyết, đừng hỏi").
- Phụ thuộc: sau P2-T01.

## Classification / Risk
- Type: **MODIFY** (chỉ `admin` / component hiển thị / CSS; không schema/DB/access/API, không migration).
- Risk: **MEDIUM** — CSS/Cell riêng màn danh sách Media; drawer chọn ảnh dùng chung list view.
- Expected review level: **NORMAL**.
- Blast radius: màn danh sách Media, drawer chọn ảnh/tệp trong mọi form.
- Doc impact: spec delta F10 GĐ2; dự kiến không đổi API/ERD.

## Scope
1. Màn danh sách `media` hiện lưới thẻ: ảnh thu nhỏ ≥ 120px giữ tỉ lệ (dùng kích thước ảnh nhỏ sẵn có), mô tả (alt) hoặc tên tệp rút gọn, loại tệp; bấm thẻ mở màn sửa; checkbox chọn nhiều vẫn dùng được. Ưu tiên CSS biến bảng thành lưới, giới hạn đúng màn danh sách Media (selector theo slug); chỉnh `defaultColumns` Media nếu cần. Chỉ thay view list Media bằng component riêng nếu CSS không đạt — ghi lý do.
2. Tìm / chip / lọc (admin) / phân trang / Thùng rác vẫn chạy. Drawer chọn ảnh trong form (ảnh bìa, `gallery`) chọn được ảnh, không vỡ.
3. Test cấu hình/style nếu thêm.
4. **Carry-over MINOR review P2-T01** (`src/lib/admin/row-actions.ts`, `src/components/admin/RowActions.tsx`): Xoá = (admin hoặc tác giả) **và** `permissions.update` (server PATCH deletedAt kiểm update + delete; vẫn không xét quyền delete cấp danh sách); 404 từ server khi xoá/nhân bản → báo như không có quyền; `encodeURIComponent(locale)` khi mở bản sao; cập nhật test.

## Acceptance
- [ ] Media list: lưới thẻ có thumbnail lớn + alt/tên dễ đọc; tìm/lọc/chọn/phân trang/Thùng rác vẫn chạy.
- [ ] Drawer chọn ảnh ở form Cho thuê/Tin tức chọn được ảnh, không vỡ bố cục.
- [ ] Không đổi schema (`src/payload-types.ts` không đổi trừ khi regen bắt buộc; không migration), access, API.
- [ ] Sáng/tối, 375px + 1280px không tràn ngang; vùng bấm ≥ 44px; không phá GĐ1 (e83a86b, b7f762c, d641351) và BL-050 (827ea1c).
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` PASS; `pnpm generate:importmap` nếu thêm component.

## Verify
- Lệnh từ `.context/project-config.md`; trình duyệt dev server `tami-dev` (`.claude/launch.json`); tài khoản test `@example.test`, xoá theo id sau khi kiểm, không ghi mật khẩu ra chat/commit.

## Quyết định
- **CSS thuần, không thay view List** (đạt acceptance nên không cần component view riêng): `src/components/admin/styles/_media-grid.scss` (+1 `@use` ở `custom.scss`). Phạm vi `.collection-list--media:not(:has(.list-drawer__header))` → chỉ trang danh sách Media; drawer chọn ảnh (`.list-drawer__header`) giữ bảng gốc nên chọn đơn/nhiều (ảnh bìa, `gallery`) không bị đụng.
- Cơ chế: `tbody` = CSS grid `repeat(auto-fill, minmax(150px, 1fr))` (2 cột ở 375px, ~7 cột ở 1280px); mỗi `tr` = thẻ flex dọc. Ô tên tệp dùng `display: contents` để ảnh và tên tệp thành con trực tiếp của thẻ rồi sắp bằng `order`: ảnh (thumb 400px, khung 4:3, `object-fit: contain` giữ tỉ lệ; Payload ép `.thumbnail--size-small` 100px/max-height 100px/min-height 100% nên phải gỡ) → mô tả (alt, tối đa 2 dòng) → tên tệp rút gọn (ellipsis) → loại tệp. Cả thẻ bấm được → màn sửa bằng `a::after` phủ thẻ (viền focus vẽ trên lớp phủ). Checkbox chọn nhiều góc trái trên, ô 44×44 (input phủ kín), nổi z-index 2 trên lớp phủ; thẻ được chọn viền màu nhấn (`:has(input:checked)`). `thead` chỉ giữ ô "Chọn tất cả trên trang" (nhãn bằng `::after`); các cột khác ẩn, cột "Người tải lên" ẩn trong lưới.
- Loại tệp dễ đọc: thêm `MediaTypeCell` (+ `mediaTypeLabel`: `image/webp` → "Ảnh · WEBP", PDF → "PDF", `video/mp4` → "Video · MP4") gắn vào trường `mimeType` của Media qua `admin.components.Cell` (không đổi tên/kiểu trường nên không đổi schema; `importMap` đã tái sinh). Dùng cả ở bảng drawer.
- Carry-over P2-T01 (scope 4): `rowActionVisibility.trash = (admin | tác giả) && permissions.update`; `failureMessage` coi 404 như 401/403 (server giấu dòng không đủ quyền); `encodeURIComponent(locale)` khi mở bản sao; cập nhật 3 test (hiện nút, 404 khi nhân bản, bỏ literal `delete`).

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Verification summary (Builder)
- Files: `src/components/admin/styles/_media-grid.scss` (mới), `src/app/(payload)/custom.scss` (+1 `@use`), `src/collections/Media.ts` (Cell cho `mimeType`), `src/components/admin/MediaTypeCell.tsx` (+ test), `src/lib/admin/media-type-label.ts` (+ test), `src/components/admin/media-grid-style.test.ts` (mới: 4 test CSS nguồn + 1 test cấu hình Media), `src/app/(payload)/admin/importMap.js` (`generate:importmap`), carry-over: `src/lib/admin/row-actions.ts`, `src/components/admin/RowActions.tsx` (+ 2 file test).
- `pnpm typecheck` PASS (sau khi sửa 1 lỗi kiểu trong test của chính mình) · `pnpm lint` PASS (0 error, 2 warning cũ ở tools/task-dashboard) · `pnpm test` PASS 359 file / 3620 test (chạy full trước lần sửa test cuối; sau đó chạy lại 2 file đụng tới: PASS). Không đổi `payload-types.ts`, không migration, access/API không đổi.

### Bằng chứng trình duyệt (dev server :3000, admin `@example.test` tạo tạm bằng script, đã xoá theo id; script tạm đã xoá)
- 1280px tối: lưới 7 cột/hàng (10 thẻ/trang), mỗi thẻ ảnh giữ tỉ lệ + alt + tên tệp rút gọn + chip "Ảnh · WEBP"; `scrollWidth` ≤ viewport. Chọn 2 thẻ → thanh chọn hàng loạt nổi đáy ("Đã chọn 2 — Chọn tất cả (481) — Chỉnh sửa / Xóa"), thẻ chọn viền nhấn, ô chọn-tất-cả ở trạng thái lưng chừng. Bấm vào thẻ → mở `/admin/collections/media/<id>`.
- Tìm "Mê Linh" → 18 kết quả, lưới + phân trang còn đúng.
- 375px sáng: 2 cột (thẻ 172px), `scrollWidth = innerWidth = 375`, ô chọn 44×44, thanh chọn đáy hiện, chữ tên/alt đọc được.
- Drawer chọn ảnh: Cho thuê tab Hình ảnh (gallery, nhiều ảnh) — vẫn là bảng, tick 2 ảnh → "Chọn 2" → drawer đóng, 2 ảnh vào thư viện của form; Tin tức tab Hình ảnh (ảnh bìa, chọn 1) — bảng 10 dòng, bấm tên tệp → chọn được, drawer đóng, xem trước hiện.
- Dọn: 1 tài khoản test xoá (id đã xoá), file tạm xoá.

## Residual risk
- Mất sắp xếp theo cột trong lưới (thead ẩn; chỉ còn chọn-tất-cả); mặc định vẫn mới nhất trước, có tìm/lọc nâng cao. Muốn sort lại cần bảng gốc hoặc thanh sắp xếp riêng (view tuỳ biến).
- Media không bật Thùng rác (xoá thật, chặn nếu đang dùng ở Trang chủ) nên "Thùng rác" không áp dụng cho màn này; bulk "Xóa" kiểm tới thanh chọn nhưng KHÔNG bấm xoá thật (dữ liệu dev).
- Chưa kiểm thẻ PDF/video (dev chỉ có ảnh): ô ảnh giữ khung 4:3 với biểu tượng tệp mặc định của Payload; alt trống thì chỉ còn tên tệp + loại.
- Dark 375px và sáng 1280px không chụp riêng (dùng cùng token `--admin-*`); đã kiểm tối 1280 và sáng 375.
- Lưới không áp trong drawer (cố ý) nên chọn ảnh trong form vẫn là bảng.

## Payload 3.91 gaps
- Không có slot đổi kiểu hiển thị (bảng ↔ lưới) của list view; lưới làm bằng CSS trên selector nội bộ (`.table`, `td.cell-filename .file .thumbnail`, `.collection-list--media`) — có thể vỡ khi nâng Payload. `.thumbnail--size-small` bị ép 100px/min-height 100% nên phải gỡ bằng CSS không layer.

## Review
- Round 1: `.context/review-reports/feature-admin-ux-audit-2-phase-2-task-02-round-1-review.md` — **NORMAL (STRICT cho carry-over quyền), PASS**. MINOR: (1) link thẻ `display: contents` có thể bị bỏ qua khi Tab → chuyển P2-T03; (2) cột bật thêm hiện trong thẻ không nhãn → ẩn mọi ô trừ `_select`/`filename`/`alt`/`mimeType` → chuyển P2-T03; (3) nhãn "Chọn tất cả trên trang" sinh bằng CSS → chuyển P2-T03 (aria-label thật nếu được); (4) nhãn loại tệp dài bị cắt (chấp nhận).

## Verification summary (close-out)
- Acceptance: **PASS** (Media không có Thùng rác — mục đó N/A). Reviewer **PASS r1**. `pnpm typecheck` PASS · `pnpm lint` 0 error · `pnpm test` 359 files / 3620 PASS.

## Doc impact
- Spec delta F10 GĐ2. Không đổi API/ERD.
