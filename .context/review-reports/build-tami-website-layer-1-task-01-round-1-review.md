Agent: reviewer

# Review: build-tami-website layer-1-task-01 (CI GitHub Actions + F2/F3 + agentRules), round 1

- **Review level:** NORMAL
- **Reason:** Diff chỉ gồm CI/Dependabot config, `pnpm.auditConfig` và 1 option trong `next.config.ts`. Không đụng code app, auth, schema hay API. Có kiểm thêm option `agentRules` vì nó ghi vào file AGENTS.md (đã đọc source Next, thấy an toàn) nên không cần nâng lên STRICT.
- **Blast radius:** `.github/workflows/ci.yml` (mới), `.github/dependabot.yml` (mới), `package.json` (`pnpm.auditConfig.ignoreGhsas`), `next.config.ts` (`agentRules: false`). Ảnh hưởng runtime: `next dev`/`next build` đọc config. AGENTS.md/CLAUDE.md không đổi (`git status` sạch).

## Verify commands + result (reviewer tự chạy, Windows local)
| Lệnh | Kết quả |
|---|---|
| `pnpm install --frozen-lockfile` | PASS (Done, lockfile khớp) |
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS: 2 file, 5 test |
| `pnpm build` | PASS (exit 0), không cảnh báo invalid config/`agentRules` |
| `pnpm audit --audit-level high` | PASS (exit 0): 2 low, 1 moderate, 1 high **(1 ignored)** |
| actionlint | skip, không có trong verify commands/allowlist |

## Kiểm theo checklist
- **Trigger/concurrency:** `push: [staging]` + `pull_request`. `concurrency` group theo `workflow`+`ref`, có `cancel-in-progress: true`. OK.
- **Permissions:** `contents: read` ở top-level. `checkout` dùng `persist-credentials: false`. OK, đã tối thiểu.
- **Services:** `postgis/postgis:17-3.5` và `redis:7-alpine` đều có health-check. Bước `psql ... -f docker/postgres/init.sql` (ON_ERROR_STOP) tạo `postgis`, `unaccent`, `pg_trgm`, chạy trước lint/test. OK.
- **Env:** đối chiếu với `src/lib/env.ts`: có đủ 16 biến bắt buộc + `DATABASE_URL_TEST`, tất cả là giá trị dummy, không dùng `secrets.*`. `NEXT_PUBLIC_SITE_URL` là URL hợp lệ, budget là `"0"` (nonnegative). F2 OK.
- **Thứ tự bước:** pnpm (lấy version từ `packageManager` pnpm@9.15.0) → setup-node 24 + cache pnpm → install frozen → extension → lint → typecheck → test → build → audit. Đúng AC.
- **Không deploy/push, không đụng `main`:** không có bước nào push/deploy, không trigger `main`. OK.
- **Dependabot:** có `npm` + `github-actions`, cả hai `target-branch: staging`, chạy weekly. OK.
- **auditConfig (F3):** chỉ ignore đúng 1 GHSA `GHSA-vfj7-8cjw-p6xm`. Lý do và ngày xem lại (2026-12-16) ghi ở comment `ci.yml` (package.json không cho comment). Audit không bị tắt toàn bộ. OK.
- **`agentRules: false`:** là option hợp lệ trong Next 16.4.2:
  - Khai trong `config-schema.js:545` (`z.boolean().optional()`) và `config-shared.d.ts:1753`.
  - `start-server.js:406` gọi `syncAgentRulesForDev(dir, agentRules !== false)`. Khi `false`, hàm `removeAgentRulesFiles` chỉ gỡ đoạn `<!-- BEGIN/END:nextjs-agent-rules -->` (`generate-agent-files.js:175-217`). File chỉ bị unlink nếu sau khi gỡ không còn nội dung gì, nên AGENTS.md của template không bị mất.
  - Build không lỗi. OK.

## Skill gates
- aislop: skip, không có trong allowlist verify commands. Diff chỉ là config, không có logic.
- oxlint: skip, oxlint not configured (repo dùng eslint, `pnpm lint` PASS).
- ocr: skip, ocr not installed.
- AI-readable: OK. Có 0 indicator: comment giải thích WHY (agentRules, allowlist, dummy env), không có magic number đáng kể.
- ai-friendly-web: N/A (CI nội bộ).
- blitzstrike: N/A (không phải STRICT).
- Responsive Checklist Gate: N/A, diff không đụng UI.

## Findings
- **[MINOR]** `ci.yml:66,71,73`: actions đang pin theo tag (`@v4`), chưa pin theo commit SHA. Đây là rủi ro supply-chain thấp vì Dependabot github-actions đã bật. Đề xuất pin SHA ở task hardening sau.
- **[MINOR]** Task có yêu cầu "Tests cần viết: actionlint hoặc skip kèm lý do". Reviewer không chạy được actionlint (không nằm trong allowlist). Builder cần ghi `skip` + lý do vào Feature Verification của task file khi close-out.
- **[MINOR]** Ngày xem lại allowlist GHSA chỉ nằm trong comment `ci.yml`. Đề xuất ghi thêm vào task file/error-memory để có người theo dõi.
- Không có CRITICAL hoặc MAJOR.

## Residual risk
- Workflow chưa chạy thật trên GitHub vì chưa push. Một số điểm chỉ suy luận chứ chưa kiểm chứng: psql client có sẵn trên ubuntu-latest, và tag image `postgis/postgis:17-3.5` tồn tại.
- Hiện chưa có test integration nào dùng Postgres/Redis, nên các service container chưa được test thật sự kiểm chứng.

## Verdict
PASS
