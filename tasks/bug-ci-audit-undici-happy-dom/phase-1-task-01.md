# bug-ci-audit-undici-happy-dom · phase-1-task-01 — CI "Audit phụ thuộc" fail: nâng undici + happy-dom qua pnpm.overrides (BL-079)

- Change doc: `spec/changes/2026-10-26-ci-audit-undici-happy-dom.md` (BACKLOG BL-079).
- Phụ thuộc: không.
- Trạng thái: `done` — Reviewer STRICT PASS r1 (`.context/review-reports/bug-ci-audit-undici-happy-dom-phase-1-task-01-round-1-review.md`). Spec: no spec change (giữ 1.59.0), test-scope v80. Doc impact: no doc impact.

## Classification / Risk
- Type: **BUG** (CI gate / dependency security; không đổi requirement, không schema/API/UI).
- Risk: **HIGH** — dependency/security: override transitive `undici` (HTTP client của payload/db-postgres) và `happy-dom` **major 20 → 21** (DOM cho `@lexical/headless` của `@payloadcms/richtext-lexical`, và `vitest` optional env).
- Expected review level: **STRICT** (security/dependency, shared runtime lib, lockfile).
- Blast radius: `package.json` (`pnpm.overrides`), `pnpm-lock.yaml`; runtime gián tiếp: mọi request undici của payload, chuyển đổi HTML/markdown → Lexical headless (seed/import/translation).
- Doc impact: dự kiến `no doc impact` (không đổi contract/schema/behavior tài liệu hoá).

## Repro (trước khi sửa)
- CI run 40298258089 @ 83c8552: `pnpm audit --audit-level high` exit 1 — "2 low | 8 moderate | 2 high".
- GHSA-xjj6-f33q-929c: `undici` 7.29.1 (vá ≥ 7.30.1), đường dẫn `payload@3.91.0 > undici` (+ `@payloadcms/db-postgres` …).
- GHSA-834v-8h66-3h79: `happy-dom` 20.14.6 (vá ≥ 21.0.4), đường dẫn `@payloadcms/richtext-lexical > @lexical/headless > happy-dom`, `vitest > happy-dom`, `@testing-library/jest-dom > vitest > happy-dom`.

## Root cause
Advisory high mới công bố cho hai dependency transitive; lockfile đang khoá bản bị ảnh hưởng. Không phải lỗi code. Quyết định user: nâng cả hai qua `pnpm.overrides` (KHÔNG allowlist).

## Thiết kế fix
1. `package.json` → `pnpm.overrides` thêm `"undici": "<bản vá ≥ 7.30.1, cùng major 7>"` và `"happy-dom": "<bản ≥ 21.0.4>"` (giữ `dompurify` override + `auditConfig.ignoreGhsas` nguyên vẹn, KHÔNG thêm GHSA mới vào ignore). Builder chọn range/pin nhất quán với style hiện có (`dompurify` pin exact) — ghi lý do.
2. `pnpm install` cập nhật lockfile (không đổi dependency khác ngoài cái kéo theo bắt buộc).
3. Kiểm Lexical headless với happy-dom 21: test hiện có quanh Lexical (`src/lib/translation/*`, `detect-manual-en`, …) + smoke test thực sự gọi đường headless của `@payloadcms/richtext-lexical` (vd `convertHTMLToLexical`/`convertMarkdownToLexical` hoặc `@lexical/headless` + DOM của happy-dom) nếu repo dùng; ghi rõ đường nào thực sự dùng happy-dom.

## Files
- `package.json` (chỉ khối `pnpm.overrides`), `pnpm-lock.yaml`.
- KHÔNG đụng source/test khác trừ khi happy-dom 21 làm vỡ → khi đó DỪNG báo (không tự sửa lan, không chuyển allowlist).

## Acceptance
- [ ] `pnpm audit --audit-level high` exit 0; `auditConfig.ignoreGhsas` không thêm mục.
- [ ] `pnpm why undici` / `pnpm why happy-dom` → mọi đường dẫn ≥ 7.30.1 / ≥ 21.0.4.
- [ ] `pnpm typecheck` · `pnpm test` · `pnpm build` PASS; `pnpm lint` theo project-config.
- [ ] Lexical headless vẫn chạy (test/smoke ở bước 3).

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.
- happy-dom 21 làm vỡ typecheck/test/build/headless → DỪNG, báo user kèm lỗi cụ thể; KHÔNG allowlist, KHÔNG hạ yêu cầu.

## Decision log
- 2026-10-26 (change-request): `package.json`/`pnpm-lock.yaml` ở working tree chính đang dirty phần Playwright (`e2e:admin`, `@playwright/test`) của việc khác. Để commit BL-079 sạch: builder làm trong **git worktree sạch từ HEAD 83c8552** (`D:/prj/bds-wt-bl079`, branch tạm `tmp/bl079`) → sinh `package.json` + lockfile chỉ có thay đổi BL-079. Khi commit, nạp 2 blob đó vào index staging bằng `git hash-object -w` + `git update-index --cacheinfo` (không đụng working tree). Sau đó áp cùng overrides vào `package.json` working chính + `pnpm install` để lockfile working chứa cả Playwright lẫn BL-079. Không dùng stash/checkout/reset (tránh mất phần dirty).

- 2026-10-26 (builder, reviewer xác nhận): undici override **có phạm vi** `"payload>undici": "7.30.1"` thay vì `undici` toàn cục — chỉ payload kéo undici 7.x; `jsdom@30.1.3` (dev) dùng undici 8.12.2 (không bị advisory), override toàn cục sẽ hạ jsdom xuống major 7. happy-dom pin exact `21.0.4` (cùng kiểu `dompurify`). Lockfile: `@types/node` của happy-dom/`@types/ws`/`buffer-image-size` gom về `22.20.5` (types only, peer `>=20`/`*`).
- Follow-up: gỡ 2 override khi payload / `@lexical/headless` tự phát hành bản phụ thuộc đã vá; patch kế tiếp phải bump tay.

## Repro Verification
- Overrides: `happy-dom: 21.0.4` (exact pin, như dompurify), `payload>undici: 7.30.1` (selector override: chỉ payload dùng undici 7; override toàn cục sẽ hạ jsdom@30 từ undici 8.12.2 xuống 7).
- `pnpm audit --audit-level high` exit 0 (còn 2 low | 6 moderate); `pnpm why`: undici 7.30.1 (mọi đường payload), 8.12.2 (jsdom, không đổi); happy-dom 21.0.4 mọi đường.
- typecheck exit 0; test 436 files / 4595 tests PASS; lint exit 0; build exit 0.
- Headless: smoke `@lexical/headless` withDOM (happy-dom 21.0.4 Window) HTML->Lexical->HTML OK. Repo không import withDOM trực tiếp; payload convertHTMLToLexical dùng JSDOM truyền vào.
- Status: PASS — Reviewer STRICT PASS r1 (2 MINOR: pin exact cần bump tay; task ghi override toàn cục → đã ghi Decision log).
