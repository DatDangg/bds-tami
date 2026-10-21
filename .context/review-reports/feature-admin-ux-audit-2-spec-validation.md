Agent: spec-validator

# Spec validation (pre-plan) — feature-admin-ux-audit-2 (BL-051, MODIFY), giai đoạn 1 — round-1

- Mode: Spec validation (trước khi chạy task)
- Inputs: `spec/changes/2026-10-21-admin-ux-audit-2.md`; `docs/reviews/2026-10-21-admin-ux-audit-2.md` §2.1–2.3, §4.3; `SPECIFICATIONS.md:130` (FR-ADM-19) + `SPECIFICATIONS.md:132` (đoạn BL-051); `tasks/feature-admin-ux-audit-2/phase-1-task-01..03.md`.
- Evidence code (read-only): `src/collections/Categories.ts:31` (categories create = isAdmin); `node_modules/@payloadcms/ui/dist/fields/Upload/Input.js:559,571` (`upload__createNewToggler` dùng chung `t('general:createNew')`).

## Verdict: ❌ FAIL (3 ⚠️ MEDIUM — chạm ngưỡng "≥3 ⚠️"; không có ❌ thiếu requirement, không có conflict HIGH)

Cả 3 lỗi đều sửa được bằng 1–2 câu trong spec delta (hoặc ghi quyết định vào change doc); không cần thiết kế lại task.

## Ma trận coverage (GĐ1)

| Req | Change doc | Spec delta (SPEC:132) | Task | Status | Note |
|---|---|---|---|---|---|
| A1 ẩn API | bảng A1 | (A1) mọi collection + global, `hideAPIURL`, REST/GraphQL không đổi | T01 §1 + test quét config, có plugin `redirects` | ✅ | |
| A2 tắt inline create | A1 bảng A2 + acceptance "không chặn chọn giá trị có sẵn; admin tạo ở màn riêng" | (A2) provinces/wards/staff **+ categories**; vẫn chọn/tìm được; màn riêng | T01 §2 + acceptance + test quét | ⚠️ | Có thêm `categories` ngoài change doc — xem F1 |
| A3 "Tải lên" | bảng A3 | (A3) chữ + tên đọc; "Tạo mới" chỗ khác không đổi | T01 §3 (a/b/c) | ⚠️ | Cách b) mâu thuẫn quy tắc "ghi đè ở MỘT nơi" — xem F2 |
| A4 Tạo mới nút chính | bảng A4; acceptance sáng/tối 375+1280 | (A4) | T02 §1 + acceptance | ✅ | |
| A5 Xuất Excel tách chip | bảng A5 | (A5) quyền/endpoint/tham số giữ nguyên; thay câu cũ | T02 §2 | ✅ | Câu cũ gộp "Trạng thái dịch" — xem F4 |
| A7 Lưu dính + Quay lại + Xem trên website | bảng A7 | (A7) + gap 3.91 | T03 Bước 0 + §1–3 | ✅ | Báo cáo vẽ thanh dưới, delta chọn dính đỉnh — đều đạt "luôn thấy" (F6, info) |
| A13 Cột/Lọc chỉ admin, tách khỏi ô tìm | Q1 | (A13) chỉ admin, ẩn hẳn với sale, không phải ranh giới quyền, mặc định ẩn; khung tìm chỉ kính lúp + chữ; 2 nút phụ bên phải; giữ BL-039 | T02 §3 + test provider + acceptance sale/admin | ⚠️ | Đụng câu BL-039 "còn lại lọc qua Lọc nâng cao" — xem F3 |
| Ràng buộc: không schema/access/API/migration | acceptance 1 | câu cuối đoạn BL-051 | T01–T03 Classification | ✅ | Khớp ràng buộc chung FR-ADM-19 |
| Test hiện có xanh; ghi gap 3.91 | acceptance cuối | có | mọi task | ✅ | |
| GĐ2 ngoài scope | Q2 | câu cuối liệt kê GĐ2 | không task nào đụng | ✅ | A14 đã nêu đúng ("gom tab Trang chủ") |

## Findings

**F1 — ⚠️ MEDIUM — A2 thêm `categories` vượt ngoài change doc/quyết định user** (câu hỏi (5))
- Change doc bảng A2 chỉ ghi "Tỉnh/thành, Phường/xã, Người tạo / Sale phụ trách"; acceptance "admin vẫn tạo Tỉnh/Phường/Nhân viên ở màn riêng". Báo cáo §2.3.4 / §4.3 chỉ nêu `province`, `ward`, `author`. Không chỗ nào nói Danh mục.
- Spec delta (`SPECIFICATIONS.md:132`) và T01 (Quyết định) tự thêm `categories`. Như vậy là **thêm requirement vào intent doc** mà user chưa duyệt. Lý do nêu ra thì hợp lý (danh mục cha–con theo loại, dễ tạo trùng).
- Không mâu thuẫn trực tiếp với acceptance (không chặn chọn giá trị có sẵn; admin vẫn tạo ở màn riêng). Thực tế chỉ admin bị ảnh hưởng vì `categories` create = `isAdmin` (`src/collections/Categories.ts:31`), sale vốn đã không có nút inline.
- Cách sửa: hoặc ghi rõ vào mục "Quyết định của user" của change doc rằng đây là quyết định của agent theo chế độ auto-proceed (cần user ratify ở checkpoint GĐ1), hoặc bỏ `categories` khỏi delta + T01.

**F2 — ⚠️ MEDIUM — A3 đụng quy tắc FR-ADM-19 (BL-040) "Chữ mặc định của Payload được ghi đè ở MỘT nơi (`i18n.translations.vi`, có test khoá chuỗi…)"** (`SPECIFICATIONS.md:130`)
- Đã xác nhận: nút upload dùng chung khoá `general:createNew` với nút "Tạo mới" ở danh sách (`Input.js:571`), nên không thể ghi đè chỉ qua `i18n.translations.vi`.
- T01 §3b (provider + MutationObserver đổi chữ trên DOM) sẽ thành **nơi ghi đè thứ hai**. Đoạn BL-051 không tuyên bố thay câu này, nên spec tự mâu thuẫn và reviewer sẽ phải chọn một trong hai.
- Cách sửa: thêm vào (A3) của delta một ngoại lệ có giới hạn, vd "ngoại lệ duy nhất cho nút của khung upload vì Payload dùng chung khoá; chuỗi 'Tải lên' khai cùng file overrides/có test". Hoặc buộc T01 dùng phương án giữ chuỗi trong `payload-vi-overrides.ts`, còn component chỉ áp chuỗi đó.

**F3 — ⚠️ MEDIUM — A13 làm sale mất đường lọc danh mục thứ 13 trở đi** (`SPECIFICATIONS.md:130`, chip BL-039)
- Câu BL-039 vẫn còn hiệu lực: Tin tức/Tin BĐS "Danh mục (… tối đa 12 chip, **còn lại lọc qua "Lọc nâng cao"**)". Câu này không nằm trong phần delta tuyên bố thay thế.
- Theo A13, sale không còn "Lọc nâng cao", nên với sale câu này không còn đúng. Theo FR-ADM-19, sale có nội dung riêng ("bản nháp của mình, tin đang đăng"). Tương tự, câu Lead "bộ lọc 'Sale phụ trách' tay được giữ" giờ chỉ áp cho admin.
- Q1 của user ("sale chỉ cần chip lọc nhanh") ngầm chấp nhận điều này, nhưng spec chưa ghi.
- Cách sửa: thêm vào (A13) "với sale, lọc ngoài chip chỉ qua ô tìm; danh mục ngoài 12 chip chỉ admin lọc được qua Lọc nâng cao". Hoặc mở rộng phạm vi "thay câu cũ" cho câu này.

**F4 — LOW — Phạm vi thay thế câu "Thanh công cụ danh sách" chưa rõ**
- Câu cũ (`SPECIFICATIONS.md:130`) gộp "Xuất Excel" (Lead) và ô "Trạng thái dịch" ("ngay dưới hàng tìm kiếm / Hiển thị cột / Lọc nâng cao, cùng một hàng", "lọc ra 0 kết quả vẫn thấy ô lọc dịch").
- Delta chỉ nói thay "hàng Xuất Excel", nên vị trí ô "Trạng thái dịch" sau A13 (đặc biệt với sale, khi hàng không còn Cột/Lọc) chưa được định nghĩa lại.
- Cách sửa: thêm 1 mệnh đề "ô Trạng thái dịch giữ ở hàng dưới hàng tìm kiếm như cũ" và "Xuất Excel vẫn thấy khi 0 kết quả" nếu cần. T02 nên có 1 acceptance cho trường hợp 0 kết quả.

**F5 — LOW — Nhãn nút A13 mơ hồ**
- Delta vừa gọi tên "Hiển thị cột"/"Lọc nâng cao" vừa gọi "Cột"/"Lọc".
- Chữ nút "Lọc nâng cao" là nhãn đã khoá ở BL-039/BL-040 (có test khoá chuỗi). T02 không nói rõ chữ hiển thị.
- Cách sửa: chốt chữ hiển thị (giữ "Hiển thị cột"/"Lọc nâng cao", hoặc đổi và cập nhật test khoá chuỗi).

**F6 — INFO — A7 vị trí thanh Lưu**
- Báo cáo §3 vẽ thanh đáy (bottom bar); delta chọn "dính đỉnh vùng nội dung". Change doc chỉ yêu cầu "luôn thấy khi cuộn", nên cả hai đều đạt. Không coi là conflict.

## Kiểm theo câu hỏi của primary
1. Delta có đủ mọi mục GĐ1 không: có. A13 đúng Q1 (chỉ admin, ẩn hẳn với sale, tách khỏi khung tìm, giữ BL-039). A2 có câu không chặn chọn giá trị có sẵn. Ngoại lệ: F1.
2. Conflict với FR-ADM-19 còn lại: F2 (BL-040 "MỘT nơi"), F3 (BL-039 danh mục > 12 chip qua Lọc nâng cao), F4/F5 (LOW). Không thấy conflict với BL-042 (nút thêm nhanh "Thêm mới" vẫn áp cho ô quan hệ khác) hay BL-050 (T02/T03 có acceptance không phá).
3. Ràng buộc (không đổi schema/access/API/migration): nhất quán giữa change doc, delta, 3 task và ràng buộc chung FR-ADM-19. A13 nêu rõ không phải ranh giới quyền.
4. Task phủ acceptance GĐ1 và kiểm thử được: có. Có test quét config (A1/A2), unit cho provider role (A13), unit cho URL/điều kiện "Xem trên website" (A7), kiểm trình duyệt sáng/tối 375/1280, ghi gap 3.91.
5. `categories` trong A2: vượt ngoài change doc, không mâu thuẫn acceptance (F1).

## Residual risk
- Chưa xác minh `admin.allowCreate`, `hideAPIURL`, slot `beforeDocumentControls` trong Payload 3.91 types. T01/T03 đã giao builder kiểm.
- Quyền sale với Tin tức/Tin BĐS suy ra từ text FR-ADM-19 (dashboard sale); chưa đọc `content-defaults` access.
