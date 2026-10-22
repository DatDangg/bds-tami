# Spec Update — 2026-10-23 seed-english-data

**spec_version:** 1.53.0 → 1.54.0 (MINOR — thêm yêu cầu dữ liệu dev song ngữ; không đổi schema / API / UI)
**Trigger:** feature-update (BL-064, change-request class MODIFY)
**Work item:** `feature/seed-english-data` phase 1 · T01 STRICT FAIL r1 → PASS r2 (commit `4f9809f`) · T02 NORMAL PASS r1 (`4e86e5c`) · T04 NORMAL PASS r1 (`906bd1c`) · T03 NORMAL FAIL r1 (dấu tên riêng) → PASS r2 (`ff00d0b`) · spec-validator phase 1 PASS
**Change doc:** `spec/changes/archive/2026-10-22-seed-english-data.md` (archive khi close-out) · review `.context/review-reports/spec-validation-feature-seed-english-data-phase-1.md`

## Requirements
- **THÊM — F12 "Dữ liệu dev song ngữ (BL-064)":** seed dev có bản EN viết sẵn cố định trong `seed/english/` (không gọi AI lúc seed) cho Dự án (gồm hàng khối mở rộng), Cho thuê, Tin BĐS, Tin tức, Dịch vụ, Tuyển dụng, Danh mục, Chủ đầu tư, alt ảnh, trang pháp lý, global public. Chỉ ghi `locale: en`, `hasEnglish`, `translation.enSource = manual` (job AI không xếp hàng, không đè). Tên riêng giữ dấu; slug EN theo quy tắc hiện có.
- **Cơ chế:** `pnpm seed:english [collection…]`, `pnpm seed:english:export`; chạy cuối `pnpm seed --sample` và `seed-scraped`; idempotent (chạy lại ghi 0, không nhân bản, không đổi `vi`); kiểm trường EN bắt buộc trước khi ghi; chỉ DB dev (staging/prod bị chặn / bỏ qua).
- Không đổi schema, không migration, không đổi API / UI.

## Ảnh hưởng
- Module: `seed/english/**` (engine + data), `scripts/seed-english.ts`, `scripts/seed-english-export.ts`, `seed/index.ts`, `scripts/seed-scraped.ts`, `package.json`, `docs/runbooks/deploy.md`; test `tests/unit/seed-english-{format,guard}.test.ts`, `tests/integration/seed-english{,-pages}.test.ts`.
- Phủ EN trên DB dev (trước → sau): projects 3/61 → 61/61, rentals 0/32 → 32/32, property_posts 0/38 → 38/38, news 0/24 → 24/24, services 0/3 → 3/3, job_postings 3/4 → 4/4, categories 5/16 → 16/16, developers 0/29 → 29/29, pages 0/2 → 2/2, media alt 7/481 → 481/481.
- Test: các route `/en` giờ có dữ liệu trên dev.
- Follow-up: BL-065 (trường không localized floor / distance / address còn tiếng Việt ở `/en`); D12 `newsDetail.contactNote` vi rỗng → câu mặc định i18n.
- Scope: `spec/test-scope/current.json` v70 (bản cũ v69 → `spec/test-scope/archive/test-scope-1.53.0-69.json`).
