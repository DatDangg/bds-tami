# Spec Update — 2026-10-22 admin-form-ux-polish

**spec_version:** 1.47.0 → 1.48.0 (MINOR — sửa hành vi form admin đã chốt ở FR-ADM-19 / BL-042, thêm màn Lịch sử chỉnh sửa tuỳ biến + tab SEO dễ hiểu)
**Trigger:** feature-update (BL-058, change-request class MODIFY — UI admin, không migration)
**Work item:** `feature/admin-form-ux-polish` phase 1, 5 task — T01 `7711bad` (NORMAL PASS r1) · T02 `364e9c7` (STRICT PASS r2) · T03 `00c48ec` (NORMAL PASS r1) · T04 `d767b30` (STRICT PASS r2) · T05 `db437a1` (NORMAL PASS r4)
**Change doc:** `spec/changes/archive/2026-10-22-admin-form-ux-polish.md` · task `tasks/feature-admin-form-ux-polish/phase-1-task-01..05.md`

## Lý do
User 2026-10-22 (3 ảnh màn sửa Tin BĐS / Dự án): hộp thoại `window.confirm` của trình duyệt khi "Dịch lại bằng AI"; Lưu thiếu trường chỉ
có 1 toast gom danh sách lỗi (ô ở tab khác không thấy, không tự chuyển tab); nút "Thêm mới" dính liền ô quan hệ; màn Versions mặc định
Payload chỉ có ngày + UUID; tab SEO chứa nhóm cũng tên "SEO", không nói rõ "để trống = tự lấy". User chốt ở checkpoint: SEO = phương án B,
không cột "Ai sửa" (không migration), bỏ hẳn toast lỗi theo ô.

## Requirements
- **SỬA FR-ADM-19** (câu BL-042 "Form dễ dùng cho người không rành công nghệ"):
  - "lỗi hiện ngay tại ô (khung báo đỏ của Payload)" → lỗi hiện **ngay dưới từng ô** (viền đỏ + câu lỗi tiếng Việt, cả màn hẹp).
  - "nút thêm nhanh cạnh ô quan hệ có chữ/tooltip 'Thêm mới'" → nút **vuông chỉ icon "+"** tách rời ô, tên đọc "Thêm mới: <tên mục>".
- **THÊM FR-ADM-19** khối "Form admin — bỏ hộp thoại trình duyệt, lỗi dưới từng ô, nút '+' tách rời, lịch sử chỉnh sửa dễ đọc, tab SEO dễ hiểu (BL-058)":
  1. Admin không dùng `window.alert` / `confirm` / `prompt` (test quét); xác nhận bằng modal trong admin — "Dịch lại bằng AI": modal, Huỷ không gửi, chống gửi 2 lần.
  2. Lưu lỗi: chữ lỗi dưới từng ô; tab / khối thu gọn chứa ô lỗi có nhãn đếm lỗi (pill sẵn có Payload); tự mở tab / khối thu gọn + cuộn + focus ô lỗi đầu tiên (1 lần mỗi lần Lưu); **bỏ hẳn** toast liệt kê danh sách ô lỗi; lỗi không gắn ô (quyền / mạng / 500 / hook không `path`) vẫn toast; toast thành công giữ; validate server + message API không đổi.
  3. Nút "+" tách rời ô (8px, viền + bo đủ góc), 36px desktop / 44px mobile; chỉ CSS.
  4. Màn Lịch sử chỉnh sửa tuỳ biến (7 collection có versions): mới nhất trước; thời điểm `dd/MM/yyyy HH:mm` giờ VN + "x phút trước"; badge trạng thái bài của phiên bản; "Phiên bản hiện tại"; "N trường đã đổi" (mọi ngôn ngữ, bỏ trường kỹ thuật; bản cũ nhất "Bản cũ nhất"); bấm dòng mở so sánh; **không cột "Ai sửa"**. Màn so sánh giữ view Payload, ẩn `updatedAt`/`createdAt`/`deletedAt`/`translation`/`searchReindexPending`, pill "Bản đã lưu". Quyền đọc versions, `maxPerDoc`, `drafts` không đổi. Gap giữ mặc định: ô "So sánh với", chọn ngôn ngữ, định dạng ngày màn so sánh.
- **THÊM F11** "Tab SEO trong admin (BL-058, phương án B)": không tiêu đề nhóm lặp; câu "để trống = tự lấy từ Tiêu đề / Tóm tắt / Ảnh đại diện"; khung xem trước kết quả Google khớp metadata công khai (tên website, đường dẫn theo ngôn ngữ — `/en` chỉ khi có bản dịch, mô tả theo loại trang, Trang chủ lấy mặc định i18n); đếm ký tự tiêu đề ≤ 60 / mô tả 120–160; "Ẩn khỏi Google" + "Đường dẫn gốc" vào khối thu gọn "Nâng cao"; placeholder tĩnh; giữ `seo.*`; không xem trước chia sẻ (phương án C).
- **XOÁ:** không.
- Không đổi schema / DB / access / API / endpoint; **không migration**.

## Ảnh hưởng
- Module: `src/components/admin/RetranslateButton.tsx` (+ test, `no-browser-dialogs.test.ts`); `FormErrorFocus.tsx` + `form-error-focus.ts` + `styles/_field-errors.scss` (provider `admin.components.providers`, `custom.scss`, `importMap.js`); `styles/_forms.scss` (nút "+", SEO); `VersionHistoryView.tsx` + `styles/_version-history.scss` + `src/lib/admin/version-history.ts`; `src/collections/_shared/content-defaults.ts` (view `edit.versions`, nhãn SEO); `src/fields/seo.ts` + `SeoPreview.tsx` + `SeoLengthCounter.tsx` + `src/lib/admin/seo.ts`; `src/lib/admin/payload-vi-overrides.ts` (pill màn so sánh); `tests/unit/admin-labels.test.ts`.
- Test: form mọi collection / global (Lưu lỗi ở tab đang mở + tab khác + khối thu gọn "Nâng cao", màn tạo mới, drawer), "Dịch lại bằng AI" (Huỷ / Xác nhận / bấm liên tiếp), ô quan hệ có nút "+" (Danh mục, Dự án liên quan, Tin cho thuê liên quan…), Lịch sử chỉnh sửa + so sánh + khôi phục 7 collection (admin + sale), tab SEO 7 collection + Trang chủ (xem trước khớp `<title>` / `<meta description>` trang công khai VI/EN).
- Residual (từ task): phụ thuộc marker `data-testid` toast + class tab/collapsible + `data-field-path` của Payload 3.91 (nâng cấp phải kiểm lại); lỗi không gắn ô mà message có ":" có thể bị ẩn (hiếm); T05 integration + ảnh 1440/390 BLOCKED (Postgres worktree down) — kiểm tay trên staging; Danh mục cũng có khối SEO mới nhưng khung xem trước chưa mô phỏng tiêu đề/đường dẫn/mô tả danh mục (hiện chữ giữ chỗ) — follow-up (spec-validation ⚠️-1).
- Scope: `spec/test-scope/current.json` v62.
