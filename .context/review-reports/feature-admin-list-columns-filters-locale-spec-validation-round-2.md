Agent: spec-validator

# Spec validation (pre-plan) — feature-admin-list-columns-filters-locale (BL-039) — round 2

Round 1: `.context/review-reports/feature-admin-list-columns-filters-locale-spec-validation.md`. Round 2 ghi file riêng vì luật report không cho gộp nhiều vòng vào một file.

**Verdict: ✅ PASS** (0 lỗi chặn, 0 cảnh báo; còn 1 ghi chú chữ nghĩa và 1 gợi ý).

| Gap round 1 | Sửa ở đâu | Status |
|---|---|---|
| G1 vị trí "Lọc nâng cao" | SPECIFICATIONS.md FR-ADM-19: "vị trí nút do thanh công cụ Payload quyết định — chỉ đặt sau hàng chip nếu làm được bằng CSS…; không được thì giữ vị trí" | ✅ khớp T02 D7 |
| G2 `ID`/`deletedAt` | FR-ADM-19: "cột hệ thống `ID` / `Ngày xoá` ẩn nếu Payload cho cấu hình được mà không đổi schema, không được thì giữ và ghi gap" | ✅ khớp T01 D3 |
| G3 `ui` không có Cell + checkbox ảo kỹ thuật | FR-ADM-19 (`ui` không có ô hiển thị / checkbox ảo kỹ thuật bị ẩn; `ui` có ô vẫn chọn được) + T01 D1 L16 (`approveEnglishAction`, `cvDownload`, `searchReindexPending`; không tắt cột `ui` có `Cell`) | ✅ |
| G4 nghĩa `hiddenPaths` | T01 D1 L17: `hiddenPaths` BL-021 = chỉ ẩn bộ lọc; ẩn cột dùng tham số riêng (vd `hiddenColumnPaths`). Spec: "các trường nghiệp vụ ít dùng đã ẩn từ BL-021 (vd địa chỉ) — vẫn chọn được làm cột" | ✅ spec và task khớp nhau |
| G5 chip danh mục / mốc ngày | Spec + T03 D10 L16-17: tối đa 12 chip, không gồm danh mục con, dùng `startOfVietnamDay` | ✅ |
| G6 residual ảnh chụp | T01 mục "Residual đã biết" L28-29 | ✅ |

## Còn lại (không chặn)
- [info] Câu thanh công cụ ở SPECIFICATIONS.md:115 vẫn ghi "hàng tìm kiếm / Hiển thị cột / **Bộ lọc**". Nên đổi thành "Lọc nâng cao" cho một khái niệm một tên (BL-040).
- [gợi ý] T01 D4: thêm assert cho quy tắc G3 — `ui` không có Cell + `searchReindexPending` có `disableListColumn`; `ui` có Cell (cột T04) không bị tắt cột. Thêm assert rằng `hiddenPaths` BL-021 (vd Rentals `address`) chỉ có `disableListFilter`.
