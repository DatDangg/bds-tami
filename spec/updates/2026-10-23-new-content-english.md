# Spec Update — 2026-10-23 new-content-english

**spec_version:** 1.56.2 → 1.57.0 (MINOR — thêm yêu cầu/tooling nhập nội dung thật + gói EN cho staging/prod; không đổi schema / API / UI)
**Trigger:** feature-update (BL-072, change-request class ADDITIVE)
**Work item:** `feature/new-content-english` phase 1 (T01 công cụ, T02 EN 3 dự án + chủ đầu tư, T03 EN 8 tin). Phase 2 (áp staging/prod) **chưa chạy** — việc vận hành, cần user ok từng lần ghi.
**Change doc:** `spec/changes/2026-10-23-new-content-english.md` · tasks `tasks/feature-new-content-english/phase-1-task-0{1,2,3}.md`

## Requirements
- **THÊM — F12 "Nội dung thật + gói EN cho staging/prod (BL-072)":** bullet mới ngay sau bullet BL-064 trong `SPECIFICATIONS.md` (F12).
  - `pnpm content:import` (`scripts/import-content.ts`, dữ liệu `seed/content/<đợt>/`, ảnh ngoài repo qua `IMPORT_IMG_DIR`): chỉ tạo mới bản `vi`; bản đã có (kể cả thùng rác) bỏ qua.
  - `pnpm english:pack <gói>` (`scripts/apply-english-pack.ts`, `seed/english/pack*.ts`, gói `seed/english/packs/<gói>/`): chỉ bản ghi có trong gói, mỗi khoá khớp đúng 1 bản ghi, không đè EN đã có khác gói (trừ `overwrite`), alt ảnh theo danh sách tường minh, chỉ ghi `en`, `enSource = manual`, không xếp job AI, bật `hasEnglish` khi đủ trường bắt buộc, idempotent.
  - Cả hai lệnh mặc định dry-run; ghi thật cần `apply` + env xác nhận khớp tên đợt/gói (`IMPORT_CONFIRM`, `ENGLISH_PACK_CONFIRM`); runbook `docs/runbooks/english-pack.md`.
  - Giá/số/tên riêng giữ như bản vi; văn bản dự thảo ghi rõ "draft".
- **Không đổi:** `pnpm seed:english` (BL-064) vẫn chỉ DB dev; không schema, không migration.

## Ảnh hưởng
- Module: `scripts/import-content.ts`, `scripts/apply-english-pack.ts`, `seed/content/**`, `seed/english/{pack,pack-plan,apply,media}.ts`, `seed/english/README.md`, gói `seed/english/packs/2026-10-23-real-content/*.json`, `docs/runbooks/english-pack.md`, `package.json`, `.gitignore`, `.dockerignore`, `eslint.config.mjs`.
- Dữ liệu (sau khi áp): `/en` của 3 dự án (Maison Privée, Astor 1, The Windsor Collection) và 8 tin tức thật hiển thị tiếng Anh, alt ảnh EN.
- Rủi ro: **high** — công cụ ghi DB staging/prod (an toàn nhờ dry-run mặc định + confirm env + backup theo runbook).
- Lưu ý: phase 2 (áp staging/prod) chưa thực hiện nên trên staging/prod `/en` của các bản ghi này chỉ hiện tiếng Anh sau phase 2.
- Scope: `spec/test-scope/current.json` v76 (bản cũ v75 → `spec/test-scope/archive/test-scope-1.56.2-75.json`).
