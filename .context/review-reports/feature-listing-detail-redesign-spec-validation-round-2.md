Agent: spec-validator

# Spec validation (pre-plan): feature-listing-detail-redesign (BL-052), round 2

- Mode: Spec validation, kiểm lại các finding của round 1 (`.context/review-reports/feature-listing-detail-redesign-spec-validation.md`).
- Nguồn đã đọc lại:
  - `SPECIFICATIONS.md` L38–51 (khối BL-052).
  - `spec/updates/2026-10-21-listing-detail-redesign.md` L37–43 (mục "Làm rõ sau spec-validation pre-plan r1").
  - `tasks/feature-listing-detail-redesign/*.md`: Grep "Quy ước song song" có trong đủ 16/16 file. Đã Read P1-T04 L12–31 và P3-T02 L16–27. Grep các điểm sửa ở P1-T02, P1-T05, P1-T06, P2-T01, P2-T02, P3-T06.

## Verdict: PASS

Cả 3 MAJOR đã đóng. 12/13 MINOR đã đóng. F14 (mục form ứng tuyển thuộc BL-054) để ngoài BL-052 là đúng phạm vi. Ba điểm còn lại chỉ là lệch câu chữ hoặc cách đánh số, xem mục 2. Không chặn việc chạy wave 1A.

## 1. Đối chiếu từng finding round 1

| R1 | Mức | Kết quả | Bằng chứng |
|---|---|---|---|
| F1 Giá dự án lệch Quyết định 6 | MAJOR | **Đóng** | Spec L42: "Giá … — Quyết định 6: giá thấp nhất > 0 trong `priceTable[].priceFrom`; … → dùng `priceFromVnd` …". P1-T04 L15 khớp. |
| F2 Xung đột file i18n giữa task song song | MAJOR | **Đóng** | 16/16 task có mục "Quy ước song song": mỗi task một namespace riêng, thêm vào cuối file, không format lại. Primary gộp khi merge. |
| F3 Thẻ mới đổi giao diện trang chủ | MAJOR | **Đóng** | Spec L43: "trang chủ giữ biến thể thẻ hiện tại … cùng quy tắc cho thẻ Cho thuê và thẻ Tin BĐS / voucher". P1-T04 L20, P2-T01 L18, P3-T02 L18 đều có biến thể `listing` và giữ thẻ trang chủ. |
| F4 Trang khu vực chưa có route | MINOR | Đóng | Spec L38/L45 ghi "route khu vực chưa có trang — ngoài phạm vi"; P2-T02 L12. |
| F5 `?category=` từ trang chủ | MINOR | Đóng | Spec L45; P2-T02 L17 và P1-T05 L18, có test. |
| F6 Task cùng wave chồng file phụ | MINOR | Đóng | P1-T04 L20: "`SimilarProjects` thuộc P1-T06". P3-T02 L18: "`RelatedPosts` thuộc P3-T04 (không sửa ở đây)". Thêm luật "không sửa file task cùng wave". |
| F7 Dọn component cũ | MINOR | Đóng | P3-T06 L16 giữ `DetailLayout` (dich-vu, careers), `Pagination`, `PageHero`. P1-T02 L24: `Pagination` không đổi mặc định, cần kiểu khác thì thêm biến thể. |
| F8 JSON-LD FAQ danh sách | MINOR | Đóng | Spec L39: "chỉ phát ở trang sạch". P1-T02 L25 dùng cờ `emitJsonLd`. |
| F9 Địa chỉ Tin BĐS có công khai không | MINOR | Đóng | Spec L47: `address` và `location` là công khai. |
| F10 Trường hợp biên thẻ voucher | MINOR | Đóng | Spec L48 và P3-T02 L18: thẻ voucher chỉ khi có ưu đãi **và** không có `priceVnd` lẫn `areaM2`; tin bán kèm ưu đãi dùng thẻ BĐS + badge ưu đãi. |
| F11 Rủi ro p95 khi đếm | MINOR | Đóng | Spec L39: cho phép lọc + đếm trong bộ nhớ có trần (ghi trần, log khi chạm). P3-T02 L16. Số đo thực tế vẫn là residual risk. |
| F12 Khoảng / bước thanh trượt | MINOR | Đóng | Spec L45: Cho thuê 0–100+ triệu bước 1, 0–300+ m² bước 5. Spec L48: Tin BĐS 0–50+ tỷ bước 1, 0–500+ m² bước 10. |
| F13 Vị trí "Xem tất cả N ảnh" | MINOR | Đóng | Spec L44 chọn thumbnail đầu "như design" (lệch chữ "ảnh cuối" của change doc). Đã ghi ở changelog nên reviewer không bắt nhầm. |
| F14 Form ứng tuyển thuộc BL-054 | MINOR | Ngoài phạm vi (chấp nhận) | Không xử lý ở BL-052. Đề xuất primary chép mục này vào change doc BL-054 khi chạy BL-054. |
| F15 `scale.handoverTime` + cờ dải Điểm mạnh | MINOR | Đóng | Spec L44; P1-T06 L15. Cờ theo màn, áp cho cả danh sách lẫn chi tiết. |
| F16 Ô tích cho lựa chọn đơn | MINOR | Đóng | Spec L45: "danh sách chọn một — kiểu radio". |

## 2. Ghi chú còn lại (MINOR, không chặn)

### N1 — Số F trong changelog lệch số trong report round 1
`spec/updates/…` L41–43 đánh số lại: F9 = voucher + địa chỉ, F10 = p95, F11 = slider, F12 = thumbnail, F13 = BL-054, F14 = handoverTime, F15 = radio. Report round 1 dùng F9 = địa chỉ, F10 = voucher, F11 = p95, F12 = slider, F13 = thumbnail, F14 = BL-054, F15 = handoverTime, F16 = radio. Nội dung đã phủ đủ, chỉ ảnh hưởng truy vết. Nên sửa số hoặc ghi "số theo report r1" khi close-out.

### N2 — Câu chữ trong task còn sót
- P1-T04 acceptance L26 vẫn ghi "Trang chủ … vẫn render (thẻ mới)", mâu thuẫn với scope L20 (trang chủ giữ thẻ cũ). Nên đổi thành "trang chủ giữ thẻ cũ".
- P1-T04 L12 vẫn liệt kê `project-listings` trong blast radius.
- Tiêu đề P2-T02 vẫn ghi "(+ danh mục, khu vực)".

Đều là câu chữ, builder sẽ theo phần Scope.

### N3 — Chưa có task nào cập nhật thẻ trong "Tin liên quan" của chi tiết dự án sau P2/P3
Spec L43 nói thẻ mới dùng cho cả "thẻ trong trang chi tiết". `ProjectListings.tsx` (P1-T06) dùng `RentalCard` / `PostCard`, nhưng biến thể `listing` của hai thẻ này chỉ có sau P2-T01 và P3-T02. Không task nào ghi việc chuyển `ProjectListings` sang biến thể mới. Đề xuất primary đưa việc này vào danh sách MINOR gom ở P3-T06.

## Residual risk
- Chưa đo p95 thật. Chưa có code mới nên không chạy verify command.
