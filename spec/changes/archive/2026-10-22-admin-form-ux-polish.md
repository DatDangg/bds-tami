---
id: admin-form-ux-polish
type: modify
status: done
created: 2026-10-22
---

# Admin: bỏ hộp thoại trình duyệt, lỗi hiện tại từng ô, nút "+" tách rời, lịch sử chỉnh sửa dễ đọc, làm rõ tab SEO (BL-058)

## Yêu cầu
User 2026-10-22 (kèm 3 ảnh chụp màn sửa Tin BĐS / Dự án trong admin):

1. **Thông báo đang là `alert`/`confirm` của trình duyệt.** Bấm "Dịch lại bằng AI" hiện hộp "localhost:3000 says…"
   (`src/components/admin/RetranslateButton.tsx:24` gọi `window.confirm`). Đổi sang hộp xác nhận trong giao diện admin
   (modal của Payload / component dùng chung), đúng màu chữ admin. Soát toàn bộ `src/components/admin/**` và
   `src/app/(payload)/**` còn chỗ nào dùng `window.alert` / `window.confirm` / `window.prompt` thì đổi luôn.
2. **Lỗi nhập liệu báo theo cụm.** Bấm Lưu khi thiếu trường → chỉ hiện 1 thông báo gom
   "Các trường sau chưa hợp lệ (6): Nội dung → Tiêu đề, … Nâng cao → Đường dẫn trang". Muốn lỗi hiện **ngay dưới từng ô**
   (viền đỏ + chữ lỗi), tab có ô lỗi được đánh dấu (chấm/số lỗi trên nhãn tab), tự chuyển tới tab + cuộn tới ô lỗi đầu tiên.
   Thông báo gom có thể giữ ở dạng ngắn ("Còn 6 ô chưa hợp lệ") hoặc bỏ — không liệt kê cả danh sách nữa.
3. **Ô chọn và nút "Thêm mới" dính liền** (ảnh 3: "Dự án liên quan", "Tin cho thuê liên quan"; ảnh 1: "Danh mục").
   Tách nút ra khỏi ô (có khoảng cách, viền riêng), và **bỏ chữ "Thêm mới", chỉ để nút vuông dấu "+"** (có `aria-label` /
   tooltip "Thêm mới"). Áp dụng cho mọi ô quan hệ có nút tạo mới trong admin.
4. **Lịch sử chỉnh sửa (Versions) khó xem.** Làm lại màn lịch sử phiên bản cho dễ đọc: danh sách theo thời gian, rõ ai sửa,
   lúc nào, trạng thái (nháp/xuất bản/tự lưu), và khi so sánh chỉ nổi bật trường đã đổi với nhãn tiếng Việt.
   Builder chụp màn hiện tại trước khi sửa để đối chiếu.
5. **Tab SEO — cần làm rõ với user trước khi sửa.** User hỏi "mục SEO là sao, tưởng thiết kế đúng SEO rồi".
   Hiện trạng (`src/fields/seo.ts` + `src/collections/_shared/content-defaults.ts:166-177`): SEO đã đúng — trang công khai tự
   sinh title/description/ảnh chia sẻ từ Tiêu đề / Tóm tắt / Ảnh đại diện; tab SEO chỉ là **ghi đè tuỳ chọn**
   (meta title, meta description, ảnh chia sẻ, ẩn khỏi Google, canonical). Điểm có thể gây khó hiểu: tab "SEO" chứa nhóm
   cũng tên "SEO" (tiêu đề lặp), không ghi rõ "để trống = tự lấy từ nội dung", không có xem trước kết quả Google / đếm ký tự.
   Đề xuất (chờ user chốt): bỏ tiêu đề nhóm lặp, thêm dòng giải thích "để trống là tự lấy", placeholder hiện giá trị sẽ dùng,
   khung xem trước kết quả Google + đếm ký tự, gom "Ẩn khỏi Google" + "canonical" vào mục "Nâng cao".

## Bối cảnh / tái hiện
- Màn/route/role: admin (`/admin/collections/*/<id>`), role admin/editor; thấy rõ ở Tin BĐS, Dự án, Cho thuê, Tin tức.
- Bước tái hiện: (1) mở 1 bài → khối "Bản dịch tiếng Anh" → "Dịch lại bằng AI"; (2) xoá Tiêu đề + vài ô bắt buộc → Lưu;
  (3) tab có ô "Dự án liên quan" / "Tin cho thuê liên quan"; (4) menu ⋮ → lịch sử phiên bản; (5) tab SEO.

## Acceptance (bắt buộc)
- [ ] Không còn `window.alert` / `window.confirm` / `window.prompt` trong code admin; "Dịch lại bằng AI" dùng modal trong admin, Huỷ không gọi API.
- [ ] Lưu thiếu trường: mỗi ô lỗi có chữ lỗi ngay dưới ô; nhãn tab chứa ô lỗi được đánh dấu; tự mở tab + cuộn tới ô lỗi đầu tiên; không còn toast liệt kê cả danh sách.
- [ ] Nút tạo mới cạnh ô quan hệ tách rời ô (khoảng cách rõ), chỉ còn icon "+" có `aria-label`; không vỡ ở màn hẹp.
- [ ] Màn lịch sử phiên bản dễ đọc hơn (ảnh trước/sau trong review report).
- [ ] Tab SEO sửa theo phương án user chốt (hỏi ở checkpoint đầu, không tự chọn).
- [ ] Test + typecheck + lint + build PASS; ảnh chụp 1440 trước/sau cho từng mục.

## Ghi chú
- Chỉ đổi giao diện admin, không đổi schema dữ liệu → dự kiến không migration (nếu gom field SEO chỉ đổi vị trí hiển thị,
  giữ nguyên đường dẫn dữ liệu `seo.*`).
- Có thể tách task theo mục 1–5; mục 5 phụ thuộc user trả lời.

## Phân tích change-request (2026-10-22)

- **Classify:** MODIFY (UI admin; sửa hành vi đã chốt ở FR-ADM-19 / BL-042). Không đổi API / access / dữ liệu.
  Migration: **không**, trừ khi user chọn hiện "Ai sửa" ở lịch sử phiên bản (xem Câu hỏi Q2) — khi đó thêm 1 trường
  ẩn `updatedBy` (SAFE_ADDITIVE, bảng chính + bảng `_v` của 7 collection có versions).
- Payload 3.91.0 (`@payloadcms/ui`, `@payloadcms/next`). Worktree chưa có `node_modules` (đọc tham chiếu ở repo gốc).
- Tasks: `tasks/feature-admin-form-ux-polish/phase-1-task-01..05.md`. Thứ tự: wave 1 = T01 ∥ T02 ∥ T03; wave 2 = T04 (sau T02,
  cùng `importMap.js` / `payload.config.ts` / `custom.scss`); wave 3 = T05 (sau khi user chốt phương án SEO).

### Spec delta (as-built — đã áp vào `SPECIFICATIONS.md` 1.48.0: FR-ADM-19 khối "Form admin … (BL-058)" + F11 "Tab SEO trong admin (BL-058)"; spec-publisher 2026-10-22)
1. Mới: admin **không dùng hộp thoại của trình duyệt** (`alert` / `confirm` / `prompt`; có test quét code admin); xác nhận thao tác dùng
   modal trong admin (`ConfirmationModal` Payload) — "Dịch lại bằng AI": modal xác nhận, Huỷ không gửi yêu cầu, chống gửi 2 lần. (T01 `7711bad`)
2. Thay câu BL-042 "lỗi hiện ngay tại ô (khung báo đỏ của Payload)" → lỗi nhập liệu hiện **ngay dưới từng ô** (viền đỏ + chữ lỗi
   tiếng Việt, cả màn hẹp); nhãn tab / khối thu gọn chứa ô lỗi có nhãn đếm lỗi (pill sẵn có của Payload, hiện với lỗi server); Lưu lỗi
   **tự mở tab / khối thu gọn + cuộn + focus ô lỗi đầu tiên**; **bỏ hẳn** toast liệt kê danh sách ô lỗi (lỗi không gắn ô vẫn có toast,
   toast thành công giữ). Validate server / message API không đổi. (T02 `364e9c7`)
3. Thay câu BL-042 "nút thêm nhanh cạnh ô quan hệ có chữ/tooltip 'Thêm mới'" → nút **vuông chỉ icon "+"** tách rời ô (cách 8px,
   viền + bo đủ góc), tên đọc "Thêm mới: <tên mục>", 36px desktop / 44px mobile; chỉ CSS. (T03 `00c48ec`)
4. Mới: màn **Lịch sử chỉnh sửa** tuỳ biến cho 7 collection có versions — theo thời gian (giờ VN + "x phút trước"), trạng thái bài của
   phiên bản, nhãn "Phiên bản hiện tại", số trường đã đổi (mọi ngôn ngữ), bấm dòng mở so sánh; màn so sánh ẩn trường kỹ thuật, nhãn
   "Bản đã lưu"; **không** cột "Ai sửa" (user chốt Q2), không migration. (T04 `d767b30`)
5. Tab SEO (phương án B, user chốt Q1): bỏ tiêu đề nhóm lặp; câu "để trống = tự lấy từ Tiêu đề / Tóm tắt / Ảnh đại diện"; khung xem
   trước kết quả Google khớp metadata trang công khai (tên website, đường dẫn theo ngôn ngữ — `/en` chỉ khi có bản dịch, mô tả theo loại
   trang, Trang chủ lấy tiêu đề/mô tả mặc định của trang chủ); đếm ký tự (tiêu đề ≤ 60, mô tả 120–160); "Ẩn khỏi Google" + "Đường dẫn
   gốc" gom vào khối thu gọn "Nâng cao"; giữ `seo.*`, không migration. Không làm xem trước chia sẻ (phương án C). (T05 `db437a1`)
