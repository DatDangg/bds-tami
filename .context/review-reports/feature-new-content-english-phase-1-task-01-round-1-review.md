Agent: reviewer

# Review — feature-new-content-english · phase-1-task-01 · round 1 (BL-072)

- **Review level:** STRICT
- **Reason:** scripts ghi DB staging/prod bằng Local API `overrideAccess`; ghi hàng loạt; sửa engine dùng chung `seed/english/apply.ts` / `media.ts` (BL-064); upload file (media).
- **Blast radius:** `seed/english/{apply,media}.ts` (đường `pnpm seed:english` BL-064), mới `seed/english/{pack,pack-plan}.ts`, `scripts/apply-english-pack.ts`, `scripts/import-content.ts`, `seed/content/**`, `package.json` (2 script mới), `.gitignore`, `eslint.config.mjs` (ignores). Dữ liệu: collections projects/news/categories/developers/media + globals, locale `en` (gói) / `vi` (nhập, chỉ tạo mới). Không đổi schema/API/UI/migration.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS (exit 0, sạch cả repo) |
| `pnpm test` | PASS — 436 files / 4587 tests, exit 0; integration `english-pack.test.ts`, `import-content.test.ts`, `seed-english.test.ts` (BL-064, không sửa) chạy trên DB tạm |
| `git diff --no-index` dữ liệu | `seed/content/2026-10-23/projects-data.mjs` == `.import-tmp/projects-data.mjs`; `news/*.md` == `docs/content-intake/news` == `.import-tmp/news`; `news-covers.json` == bản gốc. Tên `products[].type` trong data khớp 3/3 dự án với `fix-data.ts` NAMES (Grep dòng 50–56, 142–147, 226–231) |

Không chạy gì ghi DB dev/staging/prod.

## Responsive Checklist Gate
N/A — diff task không đụng UI (route/component/CSS). Thay đổi `src/components/**` trong working tree thuộc BL-071, ngoài scope.

## Skill gates
- aislop: skip — không nằm trong verify commands được allow cho reviewer (Bash chỉ verify + git).
- oxlint (anti-slop): skip — không xác minh được config (Glob timeout); `pnpm lint` (eslint) + `pnpm typecheck` PASS, không error mới.
- ocr (open-code-review): skip, ocr không trong lệnh được allow.
- AI-readable: OK — 0–1 indicator (file `seed/content/import.ts` 301 dòng, vượt ngưỡng 300 đúng 1 dòng); tên rõ, hàm ≤ 50 dòng, comment nêu WHY, README/runbook đã cập nhật.
- ai-friendly-web: N/A (công cụ nội bộ).
- blitzstrike: N/A (không có bề mặt API/auth công khai; script CLI).

## Kiểm theo focus
1. **Safety gates — OK.** Confirm kiểm 2 lớp: trong script TRƯỚC `getPayload` (`scripts/apply-english-pack.ts:16-20`, `scripts/import-content.ts:19-30`) và trong engine (`seed/english/pack.ts:97-99`, `seed/content/import.ts:296-297`). So sánh `===` chính xác → chuỗi rỗng, khoảng trắng thừa, khác hoa/thường đều bị từ chối; tên gói qua `PACK_NAME_PATTERN` (không rỗng, chặn `..`, `/`). Dry-run gói EN: `applyToCollectionDoc` return trước mọi `update` (`apply.ts:117`), global return trước `updateGlobal`, media không gọi `update` khi `dryRun` (`media.ts:96`); test spy `payload.update` không bị gọi + `updatedAt` không đổi. Dry-run nhập: mọi `create` gated bởi `pass.dry`; `apply` chạy dry-run trước, còn lỗi → trả về chưa ghi (`import.ts:299`, test dòng 115-124). `describeDatabaseTarget` chỉ in hostname/port/pathname (không user/pass/query).
2. **Pack policy — OK.** Chỉ khoá trong gói; `classifyKeyMatches` ≥2 → skip không ghi bản nào (collection + media); `protectExisting` kiểm xung đột trước khi ghi, bỏ cả bản ghi; media `decideMediaAlt` cùng quy tắc; chỉ ghi `locale: "en"`; `translationMeta` → `enSource: "manual"`; `WRITE_CONTEXT` chặn job dịch (test spy `jobs.queue` không gọi); rerun → `unchanged`, không `update`.
3. **BL-064 regression — OK.** `runSeedEnglish`/`applyCollection`/`applyMediaAlts` không đổi; tham số mới mặc định `{}`/`false` → nhánh cũ y nguyên; `seed-english.test.ts` không sửa, PASS.
4. **Import script — OK.** Parity field-by-field với `.import-tmp/import-content.ts` (projects data, floor plans chỉ ảnh, documents PDF → `documents`, ảnh → `floorPlans`, locationMedia, amenitiesImage, dedupe media theo alt, `trash: true` khi tìm). Bỏ chặn `APP_ENV=production` thay bằng confirm đúng Q2(a). `resolveImagePath` bỏ tiền tố `img/` → `IMPORT_IMG_DIR=.import-tmp/img` dùng được. Docker: `.dockerignore` chỉ loại `docs` (gốc) nên `seed/content/**` (kể cả `.md`) vào image qua `COPY /app/seed` (Dockerfile:77), `scripts/` qua dòng 74 — đúng lý do chọn nguồn tin trong `seed/content/`.
5. **Test quality — OK.** Integration gói EN phủ đủ danh sách acceptance (dry-run không ghi, thiếu/sai confirm, ghi đúng 1 bản + vi không đổi + bản ngoài gói không đổi, trùng khoá, EN biên tập viên + overwrite, rerun idempotent, media). Integration nhập phủ dry-run/confirm/apply/rerun cho dự án. Residual "đường tạo tin chưa integration test" chấp nhận được: logic tin giống bản gốc đã chạy trên staging, kiểm thuần bằng unit, runbook bắt buộc dry-run + rerun.
6. **eslint ignores — OK.** Hẹp (2 thư mục gitignore/git-exclude, không chứa code app), có comment lý do.
7. **Docs — OK.** Tên lệnh/env (`english:pack`, `content:import`, `ENGLISH_PACK_CONFIRM`, `IMPORT_CONFIRM`, `IMPORT_IMG_DIR`, `IMPORT_STATUS`) khớp code; quy trình D7 đủ 5 bước.

## Findings
- **[MINOR]** `docs/runbooks/english-pack.md:46` — Rollback "xoá mềm bản ghi mới trong admin" nhưng `first()` của script nhập tìm với `trash: true` (`seed/content/import.ts:74`) → bản đã xoá mềm vẫn tính "đã có, bỏ qua", chạy lại sẽ KHÔNG tạo lại; media xoá mềm cũng bị dùng lại theo alt. Fix: ghi rõ trong runbook (muốn nhập lại phải xoá hẳn khỏi thùng rác hoặc restore dump).
- **[MINOR]** `docs/runbooks/english-pack.md:18` — `$U`, `$DB`, `$OUT` không được định nghĩa (chỉ `$APP`, `$PG` ở dòng 12). Fix: thêm 1 dòng giá trị/ nguồn (`POSTGRES_USER`/`POSTGRES_DB` trong env compose).
- **[MINOR]** `seed/content/import.ts` — 301 dòng, vượt quy ước ≤300 đúng 1 dòng. Fix: tách `projectData` hoặc phần news sang file riêng khi T02/T03 đụng tới.
- **[MINOR]** `seed/content/import.ts:238-241` — kiểm ảnh bìa/`[CẦN KIỂM TRA]` chạy TRƯỚC kiểm "đã có": tin đã có trên DB nhưng thiếu cover trong `news-covers.json` vẫn bị báo LỖI và chặn `apply` (bản gốc kiểm cover sau `exists`). Không ảnh hưởng bộ dữ liệu hiện tại (đủ 8 cover). Fix tuỳ chọn: chỉ kiểm cover khi sẽ tạo.
- **[MINOR]** `.dockerignore` — không loại `.import-tmp/` (184 MB) → build image từ máy dev có thư mục này sẽ gửi build context lớn (không vào runner image). CI checkout không có nên không ảnh hưởng deploy. Fix tuỳ chọn: thêm `.import-tmp`.
- **[MINOR]** `tests/integration/english-pack.test.ts:222-245` — media chỉ test nhánh `apply`; dry-run media (không `update`) và alt trùng ≥2 media chỉ được phủ ở unit (`classifyKeyMatches`). Fix tuỳ chọn: thêm 1 assert dry-run media.

Không có CRITICAL/MAJOR.

## Residual risk
- Đường tạo tin (news + danh mục tin + ảnh bìa) chưa chạy end-to-end trong test (config test không có `news`) — runbook bắt buộc dry-run + rerun trên staging trước prod.
- `apply` nhập không atomic: lỗi giữa chừng (S3/validate) để lại media/chủ đầu tư đã tạo; rerun idempotent nên phục hồi được (runbook đã ghi).
- Hook revalidate/side effect của collection thật trong `payload run` trên container staging/prod chưa kiểm (test dùng fixture config) — giống BL-064.
- aislop/oxlint/ocr không chạy được trong quyền reviewer.

## Verdict
✅ PASS (STRICT) — chỉ MINOR; đề xuất builder xử lý 2 MINOR về runbook khi close-out hoặc ở T02.
