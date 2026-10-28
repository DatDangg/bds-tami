Agent: reviewer

# Review — bug-content-import-hardening · phase-1-task-01 · round 1

- Task: `tasks/bug-content-import-hardening/phase-1-task-01.md` · Change doc: `spec/changes/2026-10-23-content-import-hardening.md` (BL-073)
- Review level: **STRICT**
- Reason: script ghi DB + upload S3 chạy được trên production; spawn child process với env; đổi hành vi exit code của 3 script vận hành.
- Blast radius: `pnpm content:import` (launcher re-exec + exit code + thông báo), `pnpm english:pack`, `pnpm seed:english` (exit code), `seed/content/import-plan.ts` (2 helper thuần mới), `seed/content/import.ts` (2 chuỗi thông báo lỗi), runbook `docs/runbooks/english-pack.md` bước 2. Không đổi schema/API/app runtime/Dockerfile/package.json.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` (toàn repo) | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm vitest run tests/unit/import-content-plan.test.ts tests/integration/import-content.test.ts` | 2 files, 25/25 PASS (DATABASE_URL_TEST có → integration chạy thật, gồm test spawn `payload run`) |
| `pnpm test` toàn bộ | không chạy lại (builder báo exit 0; diff chỉ đụng script/seed/test import, lint+typecheck+test liên quan PASS) |
| Chạy script trên DB probe | không chạy (ngoài quyền verify command); dựa vào evidence Linux 1 GB của change-request trong task file § Verification summary |

## Đối chiếu trọng tâm
1. **Launcher re-exec** (`scripts/import-content.ts:30-38`)
   - Điều kiện: `mallocTuningEnv` = linux + có `glibcVersionRuntime` + `MALLOC_ARENA_MAX === undefined` → OK; musl/Windows/macOS chạy thẳng. Unit test phủ cả 4 nhánh + giữ `MALLOC_MMAP_THRESHOLD_` của người vận hành.
   - Không vòng lặp: child nhận `MALLOC_ARENA_MAX=2` → `mallocTuningEnv` trả null. OK.
   - Args: `payload run` đã cắt `run` + script path khỏi argv (`node_modules/payload/dist/bin/index.js:85-89`) → `process.argv[1]` = payload `bin.js`, `process.argv.slice(2)` = `apply` vị trí. Child argv `[bin.js, "run", <abs script>, ...]` đúng. OK.
   - Kiểm tham số/IMPORT_IMG_DIR/IMPORT_STATUS/IMPORT_CONFIRM ở dòng 14-28 chạy TRƯỚC nhánh re-exec → parent fail nhanh, child kiểm lại (vô hại). OK.
   - Parent không mở DB: không import tĩnh `payload`/config; `process.exit` ngay sau `spawnSync`, trước `await import(...)`/`getPayload`. Không có rủi ro ghi DB 2 lần. OK.
   - stdio `inherit`, `spawnSync` không maxBuffer/timeout → log không bị cắt. OK.
   - Exit: `child.status ?? 1` → signal/spawn error → 1 (≠ 0). Đúng yêu cầu, xem MINOR-1 về thông tin chẩn đoán.
2. **Exit code tường minh**: cả 3 script `process.exit(exitCode)` sau `finally { payload.destroy() }`; nhánh exception trong `import-content.ts` / `apply-english-pack.ts` → 1. `seed-english.ts` không có `catch` nhưng exception lan ra `payload run` → `console.error` + `process.exit(1)` (index.js:92-95) → vẫn ≠ 0. Flush: stdout pipe/file đồng bộ trên Linux (môi trường chạy thật `docker exec`), hành vi tương đương `process.exit(0)` sẵn có của `payload run` → không làm xấu hơn. OK.
3. **Giữ hành vi**: dry-run mặc định, `apply` cần `IMPORT_CONFIRM`, idempotent — test cũ PASS. Test mới: unit `importExitCode`/`mallocTuningEnv` + integration spawn script thật với thư mục ảnh rỗng → expect status 1; trước fix `payload run` trả 0 → test sẽ FAIL ⇒ có chặn hồi quy (xem MINOR-2 về độ chặt).
4. **Thông báo/runbook**: không còn `pnpm seed` cho danh mục/tỉnh trong `seed/content/import.ts`, runbook bước 2 bỏ câu "cần đã chạy `pnpm seed` (tỉnh, danh mục)". Tên VI khớp `seed/content/2026-10-23/projects-data.mjs:14,105,202` ("Căn hộ chung cư", "Nhà phố, biệt thự"); EN khớp `seed/english/packs/2026-10-23-real-content/categories.json` (Apartments / Townhouses and villas); 2 danh mục tuỳ chọn ghi rõ gói không phủ. `seed/content/README.md` không nói khác → no change cần. OK (xem MINOR-3 về con số RAM).
5. **Surgical**: mọi dòng trace về 3 lỗi của task; comment nêu lý do (WHY) + số đo, không WHAT thừa. `import-content.ts` ~75 dòng, `import-plan.ts` ~111 dòng.

## Findings
- **[MINOR-1]** `scripts/import-content.ts:37` — `process.exit(child.status ?? 1)` im lặng khi child bị signal (vd OOM SIGKILL) hoặc spawn lỗi (`child.error`). Trước đây shell thấy EXIT 137; nay người vận hành chỉ thấy exit 1, không có dòng nào nói "bị kill". Đề xuất: nếu `child.signal` hoặc `child.error` thì `console.error` 1 dòng (`tiến trình con dừng bởi ${child.signal}` / `child.error.message`) trước khi exit. Không chặn PASS (exit vẫn ≠ 0, apply idempotent nên chạy lại an toàn).
- **[MINOR-2]** `tests/integration/import-content.test.ts:160-170` — chỉ assert `status === 1`. Exit 1 cũng xảy ra khi script lỗi vì lý do khác (transpile lỗi, `getPayload` với `src/payload.config` lỗi kết nối/schema, `payload run` catch) → test có thể PASS sai lý do. Đề xuất thêm `expect(run.stdout).toContain("LỖI")` và `toMatch(/1 lỗi/)` (hoặc dòng `Tổng:`) để chứng minh exit 1 đến từ báo cáo dry-run.
- **[MINOR-3]** `docs/runbooks/english-pack.md` bước 2 — ghi "~921 MB → ~546 MB" (số của thí nghiệm env đặt tay) và "không cần nâng RAM container". Số đo SAU sửa qua launcher thật là child 542 MB + parent ⇒ cgroup **603 MB**, đo ở container riêng KHÔNG có `next start`; prod `tami-app` chia 1 GB với Next. Đề xuất ghi số thật (cgroup ~603 MB gồm cả process cha) và nhắc kiểm `docker stats tami-app` còn ≥ ~700 MB trống trước `apply` thay vì khẳng định tuyệt đối.
- **[MINOR-4]** `scripts/apply-english-pack.ts:8`, `scripts/seed-english.ts:7` — import `importExitCode` từ `seed/content/import-plan` (module của content import) chỉ để lấy `problems > 0 ? 1 : 0`; coupling chéo module + tên "import" lệch ngữ cảnh gói EN. Chấp nhận được; nếu muốn sạch thì đặt helper ở chỗ dùng chung (vd `seed/exit-code.ts`). Không bắt buộc.
- **[MINOR-5]** `scripts/import-content.ts:34` — child không nhận `process.execArgv` (vd người vận hành chạy `node --max-old-space-size=… node_modules/payload/bin.js run …`). `NODE_OPTIONS` vẫn truyền qua env nên đường `pnpm content:import` không ảnh hưởng. Đề xuất `[...process.execArgv, process.argv[1]!, …]` nếu muốn trọn vẹn.

Không có CRITICAL / MAJOR.

## Responsive Checklist Gate
N/A — diff không đụng UI (script CLI, seed, test, runbook).

## Skill gates
- aislop: skip, `aislop` chưa cài (command not found).
- oxlint (anti-slop): skip, oxlint not configured (không có `.oxlintrc.json`/`oxlint.json`); eslint toàn repo exit 0.
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK — tên rõ (`mallocTuningEnv`, `importExitCode`), hàm ngắn, magic number `2`/`131072` có JSDoc lý do + số đo, comment WHY; 0 indicator đáng kể.
- ai-friendly-web: N/A (tooling nội bộ, không public-facing).
- blitzstrike: skip — không có input public/auth; script CLI do người vận hành chạy, không môi trường pentest.

## Residual risk
- Hiệu quả RAM chỉ kiểm qua evidence của change-request (Linux 1 GB, DB probe), reviewer không tự đo; chưa đo khi chung cgroup với `next start` ở prod.
- Không quan sát được stdout của test spawn (captured) → không tự xác nhận exit 1 đến từ dòng `LỖI` (MINOR-2); evidence Linux của change-request có in `[media] LỖI … manifest.json`, `1 lỗi`, EXIT=1.
- Orphan: nếu chỉ process cha bị SIGTERM riêng lẻ (không phải cả process group), child có thể tiếp tục ghi; apply idempotent nên hệ quả thấp.

## Verdict
✅ **PASS** — không CRITICAL/MAJOR; 5 MINOR khuyến nghị (MINOR-1, MINOR-2, MINOR-3 nên sửa trước commit nếu chi phí thấp).
