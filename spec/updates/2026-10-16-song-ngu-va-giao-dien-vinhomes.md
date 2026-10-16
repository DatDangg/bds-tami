# Spec Update — 2026-10-16 song-ngu-va-giao-dien-vinhomes

**spec_version:** 1.0.0 → 1.1.0 (MINOR — thêm tính năng, chưa có code)
**BRD:** v1.3 → v1.4

**Requirements:**
- THÊM: FR-PUB-18 website công khai song ngữ Việt – Anh (giao diện + toàn bộ nội dung)
- THÊM: FR-PUB-19 nút chuyển ngôn ngữ VI / EN, chuyển sang trang tương ứng
- THÊM: FR-ADM-17 nhập bản tiếng Anh trong admin + cờ `hasEnglish`
- THÊM: BR-07 bản EN chỉ hiện nội dung `hasEnglish = true`, không fallback sang tiếng Việt
- THÊM: BR-17 lead / hồ sơ lưu `locale` khách dùng; email nội bộ luôn tiếng Việt
- THÊM: BRD §2.1 bảng URL VI (không tiền tố) ↔ EN (`/en/...`)
- SỬA: FR-PUB-15 SEO thêm `hreflang`, `<html lang>`, sitemap cả hai bản
- SỬA: BR-05 slug theo từng ngôn ngữ, redirect 301 theo ngôn ngữ
- SỬA: A5 "chỉ tiếng Việt" → chốt song ngữ, admin chỉ tiếng Việt
- SỬA: ngoài phạm vi — bỏ "đa ngôn ngữ", thay bằng "ngôn ngữ thứ 3+, dịch máy, admin tiếng Anh"
- THÊM (SPECIFICATIONS): F12 Song ngữ; stack thêm Payload `localization` + `next-intl`
- GIAO DIỆN: chốt bố cục & phong cách theo vinhomes.vn (`docs/DESIGN.md`: Design References, Typography EB Garamond + Montserrat, Border Radius, Screen Inventory, Component Library, Design Style). Bảng màu & logo giữ nguyên

**Docs đã cập nhật:** `docs/BRD.md`, `SPECIFICATIONS.md`, `BRIEF.md`, `docs/DESIGN.md`, `docs/ERD.md` (§1.1, `locale` ở `leads` / `job-applications`, index `_locales`, `searchText` theo ngôn ngữ), `docs/API_SPEC.md` (tham số `locale`), `docs/ARCHITECTURE.md` (D6, `src/i18n`, middleware, cache), `docs/PERMISSION.md`, `docs/INDEX.md`

**Ảnh hưởng:** toàn bộ route website công khai (`src/app/(frontend)/[locale]`), mọi collection nội dung (trường localized + `hasEnglish`), SEO/sitemap, form lead/ứng tuyển, SearchService
**Scope sinh:** chưa sinh — dự án chưa có code; `spec/test-scope/current.json` sẽ sinh khi hết initial build (trigger `initial-build`)

**Câu hỏi còn mở:** BRD Q5 — ai dịch nội dung tiếng Anh; chính sách bảo mật / điều khoản bản EN có cần luật sư duyệt
