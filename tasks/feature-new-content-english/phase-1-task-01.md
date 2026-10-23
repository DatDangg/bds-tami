# feature-new-content-english · phase-1-task-01 — Đưa script nhập nội dung vào repo + đường ghi "gói EN" có kiểm soát (`english pack`) chạy được trên staging/prod

- Nguồn: BL-072 · change doc `spec/changes/2026-10-23-new-content-english.md`. Spec delta (dự kiến, chưa publish): `SPECIFICATIONS.md` F12 bullet mới "Gói EN cho nội dung thật (BL-072…)" ngay dưới bullet BL-064.
- Trạng thái: **in_progress** — user duyệt plan 2026-10-23 (nguyên văn: "ok BL-072: Q1 commit script nhập vào repo, Q2 (a) cho prod có confirm + dry-run, duyệt plan").
- T02, T03 chỉ thêm file dữ liệu dùng bộ máy của task này → định dạng gói + lệnh phải ổn định, có tài liệu.

## Classification / Risk
- Type: **ADDITIVE** (công cụ dữ liệu; không đổi schema / API / UI / migration).
- Risk: **HIGH** — script ghi DB **staging/prod** bằng Local API `overrideAccess`; rủi ro ghi đè EN biên tập viên, ghi nhầm bản ghi trùng tiêu đề, ghi nửa vời, chạm prod.
- Expected review level: **STRICT** (data write staging/prod, bulk update, shared engine `seed/english/apply.ts`).

## Hiện trạng (change-request đã đọc)
- `.import-tmp/import-content.ts` (untracked, 221 dòng): nhập 3 dự án + 8 tin, chỉ `locale: "vi"`, idempotent theo slug/alt (bỏ qua bản đã có, không cập nhật), chặn `APP_ENV=production`. Dữ liệu: `.import-tmp/projects-data.mjs`, `.import-tmp/news/*.md` (= y hệt `docs/content-intake/news/*.md`), `.import-tmp/img/` (184 MB, `manifest.json`), `news-covers.json`. Script phụ: `fix-data.ts` (đổi tên `products[].type` sau nhập + tuỳ chọn xoá mềm tin mẫu), `feature-real.ts` (bật nổi bật), `del-news.ts`, `prep.cjs`, `test-md.ts` — đang gây 8 lỗi `pnpm lint` có sẵn.
- `seed/english/` (BL-064): `runSeedEnglish` áp **toàn bộ** `data/*.json` theo khoá tiêu đề vi, ghi đè EN hiện có khi khác, `applyMediaAlts` quét **mọi** media; `englishSeedBlockReason` chặn `APP_ENV=staging` + bỏ `ALLOW_STAGING_SEED` vì lý do "ghi đè EN của biên tập viên". → KHÔNG được mở `seed:english` cho staging/prod.
- Image app chép `scripts/` + `seed/` vào `/app` (`docker/Dockerfile` dòng 74, 77) → script/gói commit trong repo chạy được bằng `docker exec <app> pnpm payload run …` sau deploy.
- Staging/prod tắt dịch AI (`TRANSLATION_MONTHLY_BUDGET_USD=0`) → EN của 11 bản ghi hiện trống. Staging **không có backup** (runbook deploy §dòng 303).
- DB dev đã có 3 dự án + tin (vi, `has_english = f`).

## Quyết định (change-request, user đã duyệt 2026-10-23: Q1 = commit script nhập, Q2 = (a))
- D1 **Gói EN** = thư mục `seed/english/packs/<tên-gói>/` cùng định dạng `data/*.json` của BL-064 (khoá = tiêu đề/tên vi; `media.json` = `{alt vi: alt en}`). Gói đầu: `2026-10-23-real-content`. Gói KHÔNG nằm trong `seed/english/data/` → `pnpm seed:english` không đụng tới, BL-064 giữ nguyên "chỉ DB dev".
- D2 Lệnh mới `pnpm english:pack <tên-gói> [apply] [overwrite]` (`payload run scripts/apply-english-pack.ts`, tham số vị trí):
  - Mặc định **dry-run**: chỉ đọc, in kế hoạch từng bản ghi (`sẽ ghi` / `không đổi` / `bỏ qua: <lý do>`), exit 1 khi có lỗi/lệch. Không ghi gì.
  - `apply` chỉ chạy khi env `ENGLISH_PACK_CONFIRM=<tên-gói>` khớp tên gói (chống chạy nhầm gói/nhầm môi trường); in `APP_ENV` + host DB (che mật khẩu) trước khi ghi.
  - Cho chạy dev / staging / production (khác `seed:english`); production KHÔNG có cờ riêng ngoài confirm, nhưng runbook bắt buộc backup + dry-run trước (D7).
- D3 **Phạm vi hẹp**: chỉ bản ghi có khoá trong gói; mỗi khoá phải khớp **đúng 1** bản ghi chưa xoá mềm (0 → `thiếu bản vi`; ≥ 2 → `bỏ qua: khoá trùng N bản ghi`, không ghi bản nào; **ngoại lệ (fix round 3, change-request): nhóm `categories` ≥ 2 bản (nhiều scope) → áp cho từng bản, mỗi bản một dòng + kiểm không-ghi-đè riêng**). Media: chỉ alt có trong `media.json` của gói (không quét alt theo mẫu toàn DB).
- D4 **Không ghi đè EN đang có**: lá EN hiện tại không rỗng và khác dữ liệu gói → bỏ cả bản ghi + cảnh báo `EN đã có, khác gói` (trừ khi `overwrite`). EN trống hoặc đã bằng gói → ghi/không đổi bình thường. Media alt EN đang có khác gói → bỏ qua (trừ `overwrite`).
- D5 Dùng lại engine BL-064 (`resolveEntry`, `planWrite`/`applyToCollectionDoc`, `translationMeta` → `enSource: manual`, `context.translationJob`, bật `hasEnglish` khi đủ trường bắt buộc, slug EN do hook sinh). Tách hàm cần thiết trong `seed/english/apply.ts`/`media.ts` thành tham số (vd `planOnly`, `docs` lọc sẵn) — KHÔNG đổi hành vi `pnpm seed:english` (test BL-064 hiện có phải PASS nguyên).
- D6 **Script nhập vào repo**: chuyển `.import-tmp/import-content.ts` → `scripts/import-content.ts`; dữ liệu chữ → `seed/content/2026-10-23/` (`projects-data.mjs`, `news/*.md` — hoặc trỏ thẳng `docs/content-intake/news/`, chọn 1 nguồn, không giữ 2 bản), gộp bước đổi tên sản phẩm của `fix-data.ts` vào dữ liệu nguồn (để vi trên DB mới = vi trên staging). Ảnh (184 MB) **không commit**: `IMPORT_IMG_DIR` trỏ thư mục ảnh + `manifest.json` (đường dẫn tương đối). **Q2 = (a):** script nhập theo cùng chế độ với gói EN — mặc định **dry-run** (chỉ đọc, in kế hoạch: dự án/tin/chủ đầu tư/danh mục/media `sẽ tạo` / `đã có, bỏ qua`, kiểm đủ ảnh trong `IMPORT_IMG_DIR` + manifest, kiểm đủ ảnh bìa, không `[CẦN KIỂM TRA]`); ghi thật chỉ khi tham số vị trí `apply` + env `IMPORT_CONFIRM=<tên bộ dữ liệu, vd 2026-10-23>` khớp; cho chạy dev/staging/**production** (bỏ chặn `APP_ENV=production` cứng, thay bằng confirm); in `APP_ENV` + host DB (che mật khẩu) trước khi ghi. Vẫn chỉ tạo mới, không cập nhật/xoá bản ghi đã có, ghi `vi`. Script phụ một lần (`del-news`, `prep`, `test-md`, `feature-real`, phần xoá tin mẫu của `fix-data`) không commit; `.import-tmp/` thêm vào `.gitignore` → `pnpm lint` sạch lại.
- Test bổ sung cho script nhập (Q2): dry-run không ghi DB; `apply` thiếu/sai `IMPORT_CONFIRM` → từ chối, exit 1; chạy lại sau apply → mọi bản ghi `đã có, bỏ qua`. Hàm quyết định (confirm, kế hoạch) tách thuần để unit test; phần ghi thật kiểm bằng DB tạm nếu khả thi, không thì ghi residual.
- D7 Runbook `docs/runbooks/english-pack.md` (hoặc mục trong `docs/runbooks/deploy.md`): staging/prod = (1) `pg_dump` bảng liên quan hoặc toàn DB trước khi ghi, (2) dry-run, đọc log, (3) `ENGLISH_PACK_CONFIRM=… pnpm english:pack <gói> apply`, (4) chạy lại dry-run → phải `không đổi` 100%, (5) kiểm `/en`. Rollback: EN bản ghi mới có thể xoá bằng tay trong admin hoặc restore dump; `vi` không bao giờ bị ghi.

## Scope
1. `seed/english/pack.ts` (hoặc tương đương): đọc gói, lọc khoá, dry-run/apply, chính sách D3/D4; `scripts/apply-english-pack.ts`; `package.json` script `english:pack`.
2. Refactor tối thiểu `seed/english/apply.ts` / `media.ts` để tái dùng (D5).
3. `scripts/import-content.ts` + dữ liệu chữ theo D6; `.gitignore` thêm `.import-tmp/`.
4. Test (vitest, TDD): unit cho chính sách D3/D4 (hàm thuần quyết định ghi/bỏ qua); integration (DB tạm, như `tests/integration/seed-english.test.ts`): dry-run không ghi gì; apply ghi đúng 1 bản ghi; khoá trùng 2 bản ghi → không ghi; EN biên tập viên khác gói → giữ nguyên; `overwrite` → ghi; chạy lại → `không đổi`; thiếu confirm → từ chối; bản `vi` không đổi.
5. Doc: `seed/english/README.md` mục "Gói EN (staging/prod)", runbook D7.
6. Verify: `pnpm typecheck` · `pnpm lint` · `pnpm test`. Không đổi app → không bắt buộc `pnpm build` (ghi lý do).
7. CẤM chạy bất kỳ lệnh nào ghi DB staging/prod. Chỉ DB dev / DB tạm của test.
8. **KHÔNG commit / stage.** Không đụng `src/components/projects/*`, `src/components/detail/*` (BL-071 song song), `spec/**`, `.context/progress.json`, `.context/runs/**`, `.claude/*`.
9. Ghi `## Verification summary` cuối file; report mở đầu `Agent: builder`.

## Acceptance
- [ ] `pnpm english:pack <gói>` dry-run không ghi DB; `apply` cần confirm khớp tên gói.
- [ ] Chỉ ghi locale `en` của bản ghi trong gói; khoá trùng / EN đã có khác gói → bỏ qua có log; chạy lại idempotent.
- [ ] `pnpm seed:english` + test BL-064 không đổi hành vi.
- [ ] Script nhập chạy lại được trên DB mới từ repo + thư mục ảnh ngoài repo (`IMPORT_IMG_DIR`); dry-run mặc định không ghi; `apply` cần `IMPORT_CONFIRM` khớp (kể cả production); `pnpm lint` sạch.
- [ ] typecheck + lint + test PASS.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Verification summary

**Đã làm (chưa commit/stage, theo yêu cầu).**
- Gói EN: `seed/english/pack-plan.ts` (quyết định thuần), `seed/english/pack.ts` (`runEnglishPack`), `scripts/apply-english-pack.ts`, `package.json` → `english:pack`. Engine BL-064 tái dùng: `apply.ts` thêm `WriteOptions {dryRun, protectExisting}` (mặc định `{}` = hành vi cũ), export `applyToCollectionDoc`/`applyToGlobal`; `planWrite` thêm tham số `protectExisting` (kiểm xung đột TRƯỚC khi ghi); `media.ts` thêm `applyExplicitMediaAlts` (chỉ alt trong gói). `runSeedEnglish`/`applyCollection`/`applyMediaAlts` không đổi.
- Nhập nội dung: `scripts/import-content.ts` (+ `package.json` → `content:import`), engine `seed/content/import.ts`, phần thuần `seed/content/import-plan.ts`, dữ liệu `seed/content/2026-10-23/{projects-data.mjs,news/*.md,news-covers.json}`, `seed/content/README.md`. `.import-tmp/` thêm vào `.gitignore` (và `.import-tmp/`, `.local-seed/` vào `ignores` của `eslint.config.mjs`, vì eslint không đọc .gitignore).
- Doc: `seed/english/README.md` mục "Gói EN (staging/prod)" + bản đồ code; `docs/runbooks/english-pack.md` (D7 + quy trình nhập).
- Test mới: `tests/unit/english-pack-plan.test.ts` (26), `tests/unit/import-content-plan.test.ts` (14), `tests/integration/english-pack.test.ts` (8, DB tạm), `tests/integration/import-content.test.ts` (5, DB tạm).

**Quyết định ở chỗ task để mở.**
- Tin: **một nguồn** = `seed/content/2026-10-23/news/` (copy từ `.import-tmp/news`, không sửa `.import-tmp/`). Không trỏ `docs/content-intake/news` vì `.dockerignore` loại `docs/` khỏi image (docker exec sẽ không thấy). `docs/content-intake/` là thư mục chưa track, để nguyên (không xoá file của user).
- `news-covers.json` nằm trong repo cạnh dữ liệu (`seed/content/2026-10-23/`, nhỏ, chữ); `IMPORT_IMG_DIR` = thư mục ảnh chứa `manifest.json`; đường dẫn trong manifest/covers tính từ đó, tiền tố `img/` cũ được bỏ qua → `IMPORT_IMG_DIR=.import-tmp/img` dùng trực tiếp.
- Đổi tên `products[].type` của `fix-data.ts`: kiểm bằng node, `projects-data.mjs` hiện đã chứa đúng các tên rút gọn (3/3 dự án khớp) → không cần sửa thêm.
- Dataset name = `2026-10-23` (`IMPORT_CONFIRM`), cố định trong code (`CONTENT_DATASET`).
- `apply` của import chạy dry-run trước, còn lỗi thì dừng, chưa ghi gì (chống ghi nửa vời do thiếu ảnh). Gói EN: bản ghi lỗi/trùng/xung đột bị bỏ riêng từng bản (exit 1), bản khác vẫn ghi (theo D3/D4).
- Gói EN kiểm tên gói `^[A-Za-z0-9][A-Za-z0-9._-]*$` (chặn path traversal), tên tệp nhóm lạ → lỗi. Không tạo thư mục `seed/english/packs/` rỗng (T02/T03 sẽ thêm tệp dữ liệu).
- Không ghi `.context/runs/*.builder.md` (cấm đụng `.context/runs/**` trong yêu cầu giao việc); tóm tắt nằm ở đây.

**Lệnh + kết quả.**
- `pnpm typecheck` PASS · `pnpm lint` PASS (sạch cả repo; trước đó 11 lỗi từ `.import-tmp/` và `.local-seed/`) · `pnpm test` PASS 436 files / 4587 tests (gồm `seed-english.test.ts` BL-064 chạy nguyên, không sửa). Không chạy `pnpm build` (không đổi app/UI/route; chỉ script + seed + test + doc).
- Dev DB (127.0.0.1:5433/tami), chỉ đọc: `IMPORT_IMG_DIR=.import-tmp/img pnpm content:import` → 3 chủ đầu tư + 3 dự án + danh mục + 8 tin đều "đã có, bỏ qua", 0 lỗi, exit 0. Kiểm riêng bằng node: 90 tham chiếu ảnh (manifest + 8 ảnh bìa) đều có file. `english:pack` với gói tạm (đã xoá) → dry-run in `bỏ qua: thiếu trường EN bắt buộc` + `thiếu bản vi`, exit 1; `apply` không confirm → "apply cần ENGLISH_PACK_CONFIRM=…", exit 1, trước khi mở DB. Không chạy gì lên staging/prod; không ghi DB dev.

**Residual risk.**
- Đường tạo **tin** (news + danh mục tin + ảnh bìa) của script nhập không có test tích hợp (config test không có collection `news`); được che bởi unit (`checkNewsEntry`, frontmatter, markdown) và dry-run thật trên dev (nhánh "đã có"). Nhánh "sẽ tạo/ghi" của tin chưa chạy end-to-end, chỉ code từ bản `.import-tmp` đã dùng trên staging. Nên dry-run trên staging/DB sạch trước prod (runbook đã bắt buộc).
- Dry-run của gói EN không mô phỏng hậu kiểm slug EN do hook sinh (như BL-064); thiếu slug sẽ hiện ở lần `apply` như một dòng bỏ qua.
- `docker cp` ảnh vào container và chạy `payload run` trong container production chưa kiểm thực tế (không được chạm staging/prod).
- Lint: `eslint.config.mjs` thêm `ignores` cho `.local-seed/` (thư mục git-exclude của máy dev, ngoài scope nhưng làm `pnpm lint` đỏ).

### Fix round 1 → 2
Reviewer round 1 PASS, 6 MINOR:
1. Runbook Rollback: nêu rõ importer tìm cả bản xoá mềm (`trash: true` giữ nguyên) nên bản trong thùng rác vẫn "đã có, bỏ qua"; cách nhập lại = khôi phục từ thùng rác / xoá vĩnh viễn / restore dump.
2. Runbook bước backup: giải thích `$U`/`$DB`/`$OUT`.
3. `seed/content/import.ts` 301 → 252 dòng: tách `projectData`/`newsData` sang `seed/content/import-data.ts` (hàm thuần, không đổi hành vi).
4. Tin: kiểm tồn tại theo slug TRƯỚC khi kiểm ảnh bìa/`[CẦN KIỂM TRA]` (`checkNewsEntry` nhận `alreadyExists` → không lỗi) nên tin đã có không chặn apply; thêm unit test.
5. `.dockerignore` thêm `.import-tmp`, `.local-seed`.
6. Integration: media dry-run không gọi `payload.update`, alt EN giữ trống.
Verify: xem lệnh chạy lại bên dưới.
Rerun: `pnpm typecheck` PASS · `pnpm lint` PASS · `pnpm test` PASS 436 files / 4588 tests.

### Fix round 2 → 3
T02 phát hiện danh mục "Căn hộ chung cư" có ở 2 scope (project + rental) nên luật đúng-1-bản luôn bỏ qua. Quyết định change-request: chỉ nhóm `categories` áp mục gói cho mọi bản khớp (`allowsMultipleMatches`, `classifyKeyMatches(count, allowMultiple)` → `multiple` trong `seed/english/pack-plan.ts`; `pack.ts` lặp từng bản, dòng `<tên> [<scope>]`, tra tối đa 50 bản). Nhóm khác giữ luật đúng-1. Mỗi bản vẫn qua no-overwrite riêng. Test: unit (categories ≥2 → multiple; projects ≥2 → duplicate), integration (2 scope: bản có EN khác bị bỏ, bản kia ghi; `overwrite` ghi cả hai). Doc: README § Gói EN, runbook.
