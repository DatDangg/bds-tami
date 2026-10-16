# Spec Update — 2026-10-16 ai-tu-dich-tieng-anh

**spec_version:** 1.1.0 → 1.2.0 (MINOR — thêm tính năng, chưa có code)
**BRD:** v1.4 → v1.5

**Requirements:**
- SỬA: FR-ADM-17 "nhân viên nhập bản tiếng Anh" → **AI (Claude API) tự dịch** khi xuất bản / sửa bản tiếng Việt, bản EN lên web ≤ 10 phút
- THÊM: FR-ADM-18 sửa tay bản EN, nút "Dịch lại bằng AI", lọc theo trạng thái dịch
- THÊM: BR-08 quy tắc dịch tự động (chỉ dịch trường đã đổi, không dịch đè bản sửa tay, trang pháp lý admin duyệt, giữ tên riêng, bảng thuật ngữ, chỉ gửi nội dung công khai)
- SỬA: BR-07 cờ `hasEnglish` do hệ thống tự bật
- SỬA: NFR-09 thêm ngoại lệ trả phí Claude API, có hạn mức tháng
- SỬA: A5, Q5 (đã trả lời một phần); THÊM Q6 hạn mức chi phí
- SỬA: ngoài phạm vi — bỏ "dịch máy tự động", thêm "dịch Anh → Việt, dịch dữ liệu khách gửi"

**Docs đã cập nhật:** `docs/BRD.md`, `SPECIFICATIONS.md` (F12, stack, API, collection), `BRIEF.md`, `docs/ERD.md` (group `translation`, `translation-usage`, `site-settings.translationGlossary`, audit action), `docs/ARCHITECTURE.md` (D7, job `translate-content`, `lib/translation`, bảo mật, env), `docs/API_SPEC.md` (§5 sự kiện, §5.1 endpoint dịch lại), `docs/PERMISSION.md`, `docs/INDEX.md`

**Ảnh hưởng:** Payload Jobs (job mới), hook `afterChange` mọi collection nội dung + globals, admin UI (nút dịch lại, cột trạng thái dịch), dashboard, env/secret mới
**Scope sinh:** chưa sinh — dự án chưa có code

**Câu hỏi còn mở:** Q5 bản EN trang pháp lý có cần luật sư duyệt; Q6 hạn mức chi phí Claude API / tháng
