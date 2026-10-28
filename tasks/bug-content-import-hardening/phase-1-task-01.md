# bug-content-import-hardening · phase-1-task-01 — `content:import`: không vượt 1 GB khi nhập ~90 ảnh, dry-run có `LỖI` thì exit ≠ 0, thông báo/runbook không bảo `pnpm seed` khi thiếu danh mục dự án

- Change doc: `spec/changes/2026-10-23-content-import-hardening.md` (BACKLOG BL-073). Gộp 3 lỗi một task (cùng script + runbook).
- Evidence gốc: `tasks/feature-new-content-english/phase-2-task-02.md` § Verification summary (prod 2026-10-23: EXIT 137, anon-rss ~847 MB sau ~56/90 ảnh).
- Auto proceed: user 2026-10-28 "dở thì làm nốt đi, rồi làm tiếp mấy cái 73 76 78" → không checkpoint phase plan.

## Root cause (change-request, đo/đọc code TRƯỚC khi sửa)

### (1) RAM — KHÔNG phải buffer JS bị script giữ; là glibc malloc giữ/phân mảnh bộ nhớ native của libvips (sharp)
Đo trên DB riêng `tami_bl073_probe` (local, migrate + seed nền + 1 admin + 2 danh mục project; bucket SeaweedFS riêng `bl073-*`), bộ ảnh thật
`.import-tmp/img` (83 file, 185 MB) + `seed/content/2026-10-23`, `content:import apply` trên DB trống. Linux = container `node:22-bookworm-slim`
(glibc, giống `docker/Dockerfile`), `--memory=1g --memory-swap=1g`, node_modules prod Linux, `NODE_ENV=production`. Sampler preload ghi
`process.memoryUsage()` main thread mỗi 250 ms.

| Lần chạy (Linux 1 GB) | peak RSS | maxRSS | cgroup memory.peak | heapUsed peak | arrayBuffers peak |
|---|---|---|---|---|---|
| baseline #1 | 908 MB | 921 MB | 875 MB | 88 MB | 45 MB |
| baseline #2 | 921 MB | 927 MB | 881 MB | 88 MB | 59 MB |
| `sharp.cache(false)` | 946 MB | 959 MB | 914 MB | 89 MB | 70 MB |
| `MALLOC_ARENA_MAX=2` | 630 MB | 647 MB | 602 MB | 88 MB | 48 MB |
| `MALLOC_MMAP_THRESHOLD_=131072` | 613 MB | 618 MB | 573 MB | 88 MB | 45 MB |
| cả hai env trên | **546 MB** | 549 MB | 504 MB | 90 MB | 66 MB |

(Windows native cùng bộ: peak RSS 655 MB, không tăng dần — allocator khác, không tái hiện.)

- Timeline RSS baseline tăng đơn điệu theo số ảnh: 207 → 572 → 664 → 747 → 763 → 810 → 846 MB (9 s → 54 s), trong khi heapUsed phẳng ~76–88 MB
  và arrayBuffers dao động ≤ 70 MB rồi về ~0. → Script **không** giữ Buffer ảnh: `readFile(local)` ở `seed/content/import.ts` `mediaIdFor`
  (~dòng 99) chỉ sống trong 1 lần `payload.create`, rồi được GC (arrayBuffers về 0 giữa các ảnh).
- Phần tăng nằm NGOÀI V8 heap/ArrayBuffer: bộ nhớ native của libvips khi Payload tạo 4 cỡ ảnh (`src/collections/Media.ts` `imageSizes`
  thumb/card/large/og, WEBP) — giải nén ảnh gốc 1–6 MB thành pixel buffer hàng chục–trăm MB, chạy trên thread libuv. glibc malloc: sau khi
  free khối lớn, ngưỡng mmap động tăng → các khối lớn sau cấp từ arena (mỗi thread một arena) → bộ nhớ đã free không trả về OS / phân mảnh,
  RSS chỉ tăng. `sharp.concurrency()` đã = 1 (sharp 0.35.5 tự hạ trên glibc), `sharp.cache` 50 MB không phải nguyên nhân (tắt cache không giảm).
- Bằng chứng nhân quả: chỉ đổi allocator (env glibc, không đổi code) → peak 921 → 546 MB, timeline phẳng (mmap: 356–517 MB suốt lần chạy).
  Prod: `tami-app` 1 GB chứa cả `next start` → script 847 MB + Next ⇒ OOM-kill.

### (2) Dry-run có `LỖI` vẫn exit 0
- Script đặt `process.exitCode = 1` (`scripts/import-content.ts:50`), nhưng `payload run` gọi `process.exit(0)` vô điều kiện sau khi import script
  xong (`node_modules/payload/dist/bin/index.js:68`, payload 3.91.0) → ghi đè exitCode.
- Repro (DB probe, `IMPORT_IMG_DIR` = thư mục rỗng): in `[media] LỖI: …manifest.json…`, `Tổng: 0 sẽ tạo, 1 đã có, 1 lỗi`, **EXIT=0**.
- Cùng root cause, cùng runbook: `scripts/apply-english-pack.ts:31,34` (`english:pack`, runbook ghi "exit 1 khi có dòng bỏ qua") và
  `scripts/seed-english.ts:20` (dev) dùng `process.exitCode` dưới `payload run` → cũng luôn exit 0. Gộp sửa (1 dòng mỗi file).

### (3) Thông báo + runbook bảo `pnpm seed` khi thiếu danh mục `project`
- `seed/content/import.ts` `importProject`: `thiếu danh mục dự án "…": chạy pnpm seed trước`. Nhưng `pnpm seed` (nền) KHÔNG tạo danh mục
  `project` (`seed/categories.ts`: "`project` và `job` do admin tự thêm"); chỉ `seed --sample` tạo, và bị chặn ở production. Runbook
  `docs/runbooks/english-pack.md` bước 2 cũng ghi "Production DB trống cần đã chạy `pnpm seed` (tỉnh, danh mục)".
- Danh mục bộ 2026-10-23 cần: "Căn hộ chung cư", "Nhà phố, biệt thự" (`seed/content/2026-10-23/projects-data.mjs`). EN do gói ghi
  (`seed/english/packs/2026-10-23-real-content/categories.json`: Apartments / Townhouses and villas; gói còn "Pháp lý & Quy hoạch" →
  Legal & Planning, danh mục tin do script tự tạo). Prod 2026-10-23 còn tạo thêm "Khu đô thị"/"Urban areas", "Nghỉ dưỡng"/"Resorts" cho khớp
  staging — gói KHÔNG phủ, admin nhập EN tay nếu tạo.

## Hướng sửa (builder chọn chi tiết, giữ đơn giản)
1. **RAM (tự động, chỉ trong script, không đổi Dockerfile/package.json):** `scripts/import-content.ts` thành launcher mỏng: trên Linux glibc
   (`process.platform === "linux"` + `process.report.getReport().header.glibcVersionRuntime`) mà env chưa đặt `MALLOC_ARENA_MAX` →
   `spawnSync(process.execPath, [<payload bin = process.argv[1]>, "run", <chính file này>, ...tham số], { stdio: "inherit", env: { ...process.env,
   MALLOC_ARENA_MAX: "2", MALLOC_MMAP_THRESHOLD_: "131072" } })` rồi `process.exit(status ?? 1)` (signal → ≠ 0). Env đã có (hoặc không phải
   glibc) → chạy thẳng. Kiểm tham số/confirm/thư mục ảnh vẫn TRƯỚC khi mở DB (parent fail nhanh được). **Parent không được import
   `payload.config`/`payload` engine** (import tĩnh ESM bị hoist → dùng `await import()` sau nhánh re-exec), để RSS parent thấp (~120 MB do
   `payload run` đã nạp) — tổng cgroup = parent + child. Không vòng lặp re-exec (child có env).
   Tôn trọng env người vận hành đã đặt (không ghi đè). Comment ngắn lý do (số đo) ở launcher.
2. **Exit code:** sau `payload.destroy()` gọi `process.exit(code)` tường minh (0 khi không lỗi, 1 khi có `LỖI`/exception). Hàm thuần nhỏ
   (vd `importExitCode(report)` trong `import-plan.ts`) nếu cần cho test. Áp cùng cách cho `scripts/apply-english-pack.ts` + `scripts/seed-english.ts`.
3. **Thông báo:** danh mục dự án thiếu → chỉ cách tạo trong `/admin` (Danh mục, phạm vi Dự án, tên đúng như dữ liệu) + trỏ
   `docs/runbooks/english-pack.md`; KHÔNG nhắc `pnpm seed`. Tỉnh `ha-noi` thiếu → không bảo `pnpm seed` chung chung; trỏ bước nạp địa giới
   lúc khởi tạo môi trường (`docs/runbooks/deploy.md`). Không thêm script ghi DB prod mới.
4. **Doc reconcile:** `docs/runbooks/english-pack.md` bước 2 — thêm bước "Danh mục dự án" trước dry-run: bảng danh mục cần (VI → EN, EN do gói
   ghi ở bước 3), danh mục tuỳ chọn khớp staging + EN nhập tay; bỏ câu "cần đã chạy `pnpm seed` (tỉnh, danh mục)"; ghi script tự đặt env
   malloc trên Linux (đo 1 GB: ~546 MB, trước ~921 MB) nên không cần nâng RAM container; exit code ≠ 0 nay đúng. `seed/content/README.md`
   cập nhật nếu nói khác.

## Classification / Risk
- Type: **BUG** (tooling vận hành). Không đổi requirement / schema / API / dữ liệu app. Không đổi hành vi upload của app.
- Risk: **MEDIUM** — script ghi DB + upload S3 chạy được trên production; process spawn + env. Reviewer: **STRICT** (DB + upload + prod tooling).
- Blast radius: `pnpm content:import`, `pnpm english:pack`, `pnpm seed:english` (exit code), runbook english-pack.
- Doc impact: `docs/runbooks/english-pack.md` (+ `seed/content/README.md` nếu cần). Không đổi as-built API/ERD.

## Giữ nguyên (test hiện có phải PASS)
- Mặc định dry-run; `apply` cần `IMPORT_CONFIRM=2026-10-23`; `apply` dry-run trước, còn lỗi thì không ghi; chạy lại idempotent
  (`tests/integration/import-content.test.ts`, `tests/unit/import-content-plan.test.ts`).

## Acceptance
- [x] Root cause RAM ghi rõ (trên) + đo lại SAU sửa trên Linux 1 GB, DB trống, bộ 2026-10-23 qua `pnpm content:import apply` thật (launcher
      re-exec): không bị kill, cgroup memory.peak (parent + child) ghi số.
- [x] Dry-run có ≥ 1 `LỖI` → exit ≠ 0; không lỗi → exit 0. Có test (unit cho helper + kiểm hành vi exit thật nếu khả thi).
- [x] Thông báo thiếu danh mục `project` không còn "pnpm seed"; runbook có bước tạo danh mục dự án cho prod kèm tên EN.
- [x] `pnpm lint` (toàn repo) · `pnpm typecheck` · `pnpm test` PASS.

## Phạm vi cấm
- KHÔNG sửa: `package.json`, `pnpm-lock.yaml`, `docker/**`, `SPECIFICATIONS.md`, `spec/**`, `.context/**`, file dirty không thuộc task
  (`.claude/**`, `tools/**`, `.gitignore`, `playwright.config.ts`, `tests/e2e/admin/**`, `docs/content-intake/`, `docs/testing/`,
  `docs/specs/vibe-studio-live-roles.md`, `template-feedback*.md`). Cần đổi `package.json` → DỪNG báo lại.
- KHÔNG chạy `db push` / migrate reset / seed trên staging/prod; chỉ local. KHÔNG đụng DB dev `tami` để đo (dùng `tami_bl073_probe`).
- KHÔNG commit (change-request commit).

## Verification Plan
- `pnpm lint` · `pnpm typecheck` · `pnpm test` (`.context/project-config.md`).
- Đo RAM (change-request chạy lại sau builder): scratchpad `reset-probe.sh` + `run-linux.sh` (container 1 GB, mount repo ro).
- Exit code: `IMPORT_IMG_DIR=<thư mục rỗng> node node_modules/payload/bin.js run scripts/import-content.ts` trên DB probe → exit 1.
- Report: `.context/review-reports/bug-content-import-hardening-phase-1-task-01-round-<R>-review.md`

## Verification summary (change-request, 2026-10-28)
- Builder attempt 1: launcher `scripts/import-content.ts` (re-exec Linux glibc với `MALLOC_ARENA_MAX=2` + `MALLOC_MMAP_THRESHOLD_=131072`, import nặng
  bằng `await import()`), `process.exit(code)` tường minh ở `import-content.ts` / `apply-english-pack.ts` / `seed-english.ts`, helper thuần
  `importExitCode` + `mallocTuningEnv` (`seed/content/import-plan.ts`), thông báo thiếu danh mục/tỉnh (`seed/content/import.ts`), runbook bước 2.
- RAM SAU (Linux `node:22-bookworm-slim`, `--memory=1g --memory-swap=1g`, DB `tami_bl073_probe` trống, bộ 2026-10-23 thật, `content:import apply`
  qua launcher, không đặt env tay): `Tổng: 16 đã tạo, 0 lỗi`, EXIT 0; child peak RSS **542 MB** (maxRSS 567), parent 125 MB, cgroup
  memory.peak (parent + child) **603 MB**, oom_kill 0. TRƯỚC: process 908–921 MB, cgroup 875–881 MB.
- Exit code SAU (Linux, launcher): dry-run `IMPORT_IMG_DIR` rỗng → `LỖI … manifest.json`, `1 lỗi`, **EXIT=1**; dry-run đủ ảnh trên DB đã nhập →
  `0 sẽ tạo, 16 đã có, 0 lỗi`, EXIT=0 (idempotent). Windows: EXIT=1 (builder).
- Builder: `pnpm lint` PASS · `pnpm typecheck` PASS · `pnpm test` exit 0 · unit + integration import 25 PASS.
- Reviewer STRICT r1 **PASS** — `.context/review-reports/bug-content-import-hardening-phase-1-task-01-round-1-review.md`. MINOR sửa trước commit
  (change-request): MINOR-1 launcher in tín hiệu/lỗi spawn của child (vd `SIGKILL` → "có thể bị OOM-kill") trước exit 1; MINOR-2 integration test
  kiểm thêm stdout có `LỖI` + `Tổng: … N lỗi`; MINOR-3 runbook ghi số đo qua launcher (~603 MB cả cha + con, container chỉ chạy script) + kiểm
  `docker stats` còn trống ≥ ~650 MB vì `$APP` chạy chung `next start`; MINOR-4 `apply-english-pack.ts` / `seed-english.ts` tự tính exit code, không
  import helper của content-import. MINOR-5 (child không nhận `process.execArgv`) giữ nguyên: `NODE_OPTIONS` đi qua env, `pnpm content:import` không dùng execArgv.
- Sau sửa MINOR: `pnpm lint` toàn repo exit 0 · `pnpm typecheck` exit 0 · import unit + integration 25/25 PASS (integration chạy thật với `DATABASE_URL_TEST`).
- Close-out: no spec change (1.61.0) / test-scope v99 (v98 archive); progress bug done; BACKLOG BL-073 done + archive change doc.
- Residual: chưa đo khi chung cgroup với `next start` trên prod (runbook có bước kiểm `docker stats`); SIGTERM chỉ gửi parent có thể để child chạy tiếp
  (apply idempotent, chạy lại được).
