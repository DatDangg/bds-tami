# Spec Update — 2026-11-26 admin-ward-field-narrow-in-row

**spec_version:** 1.64.7 -> 1.64.8 (PATCH — as-built bug-fix BL-130)
**Trigger:** bug-fix (BL-130, `bug-admin-ward-field-narrow-in-row`)
**Requirements:** LÀM RÕ F10 trong SPECIFICATIONS.md (tìm "BL-130", ngay sau đoạn "Admin gọn cho người không rành kỹ thuật — audit lần 2, giai đoạn 1"): ô Phường/xã (`WardField`) trong form admin Cho thuê / Dự án / Tin BĐS dùng `mergeFieldStyles(field)` như ô quan hệ mặc định của Payload, nên hàng Tỉnh/thành · Phường/xã chia đều bề rộng (≥ điểm gãy giữa; dưới đó mỗi ô 100%), dropdown đủ rộng, tên phường 1 dòng, không thanh cuộn ngang. Lọc theo tỉnh, bỏ chọn khi đổi tỉnh, validate phường thuộc tỉnh không đổi.
**Ảnh hưởng:** `src/components/admin/WardField.tsx` (style = mergeFieldStyles(field), trước đó undefined), `src/components/admin/WardField.test.tsx`. Không API shape/schema/quyền/migration.
**Evidence:** `.context/review-reports/bug-admin-ward-field-narrow-in-row-phase-1-task-01-round-1-review.md` (NORMAL PASS r1). Chưa kiểm tra trực quan trên trình duyệt (DB/Docker tắt) — test nên bao phủ 1440/390.
**Scope sinh:** spec/test-scope/current.json (scopeVersion 129, risk low)
