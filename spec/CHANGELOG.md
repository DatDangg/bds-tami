# Spec Changelog

> Mỗi lần đổi `SPECIFICATIONS.md` → thêm 1 dòng. Version scheme: `docs/SPEC_VERSIONING.md`.

| Version | Ngày | Loại | Thay đổi | Scope sinh |
|---|---|---|---|---|
| 1.0.0 | (ngày tạo) | — | Spec khởi tạo | — |
| 1.1.0 | 2026-10-16 | MINOR | Song ngữ Việt – Anh (F12, FR-PUB-18/19, FR-ADM-17, BR-07, BR-17) + chốt giao diện theo phong cách vinhomes.vn. Delta: `spec/updates/2026-10-16-song-ngu-va-giao-dien-vinhomes.md` | — (chưa có code) |
| 1.2.0 | 2026-10-16 | MINOR | AI (Claude API) tự dịch bản tiếng Anh, tự lên web, sửa tay được; trang pháp lý admin duyệt (FR-ADM-17/18, BR-08, NFR-09). Delta: `spec/updates/2026-10-16-ai-tu-dich-tieng-anh.md` | — (chưa có code) |
| 1.2.1 | 2026-10-16 | PATCH | Làm rõ sau spec validation round 1: thêm mục NFR, định nghĩa `pages`, quyền Sale (Dịch vụ + pháp lý chỉ admin), nút tìm kiếm → `/cho-thue?q=`, ưu tiên Must/Should/Could, quy tắc biên, câu hỏi mở. Delta: `spec/updates/2026-10-16-lam-ro-spec-validation-r1.md` | — (chưa có code) |
| 1.2.2 | 2026-10-16 | PATCH | Chốt bước design: hero video tuỳ chọn, bỏ dải lối tắt, thêm banner CTA + `services.coverImage`, noindex tin đã thuê / tuyển dụng quá hạn, banner cookie + GA4 sau đồng ý (Q7). Delta: `spec/updates/2026-10-16-chot-design.md` | — (chưa có code) |
| 1.3.0 | 2026-10-19 | MINOR | BR-08/F12: trang pháp lý EN đã duyệt bị sửa tay nội dung EN → mất duyệt, ẩn `/en` tới khi admin duyệt lại; lưu không đổi nội dung EN thì giữ duyệt (BL-013). Delta: `spec/updates/2026-10-19-legal-en-edit-requires-reapproval.md` | scope v2 |
| 1.4.0 | 2026-10-19 | MINOR | Khung trang (design-spec §2.1/§2.2/§2.4): header ≥ xl một hàng, logo từ `site-settings.logo`/`logoDark` + nút CTA từ `header.ctaButton` (ẩn khi thiếu nhãn locale/link, BR-07), menu toàn màn hình accordion menu con, footer < md accordion cột link (BL-001). Delta: `spec/updates/2026-10-19-header-footer-design-debt.md` | scope v3 |
