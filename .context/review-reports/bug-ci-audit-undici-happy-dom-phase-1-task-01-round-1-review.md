Agent: reviewer

# Review — bug-ci-audit-undici-happy-dom · phase-1-task-01 · round 1 (BL-079)

- Worktree reviewed: `D:/prj/bds-wt-bl079` (base HEAD 83c8552, uncommitted). The diff covers only `package.json` and `pnpm-lock.yaml`. `src/payload-types.ts` has CRLF-only changes and is ignored, as instructed.
- Review level: **STRICT**
- Reason: dependency/security change. It touches the lockfile, adds an override for a transitive HTTP client (`undici`, used by payload at runtime), and makes a major bump of `happy-dom` (20 → 21), which is the DOM for `@lexical/headless` in the richtext-lexical runtime.
- Blast radius: `package.json` (`pnpm.overrides` only) and `pnpm-lock.yaml`. Indirect runtime effects: payload's undici-based fetches (db-postgres, next, ui, graphql, email, redirects, all through `payload` peer), the Lexical headless DOM path (`@payloadcms/richtext-lexical > @lexical/headless > happy-dom`), and the optional vitest environment. No source, schema, API or UI changes.

## Verify commands + result (re-run by reviewer in D:/prj/bds-wt-bl079)

| Command | Result |
|---|---|
| `git diff package.json` | Only adds `"happy-dom": "21.0.4"` and `"payload>undici": "7.30.1"` to `pnpm.overrides`. `dompurify` and `auditConfig.ignoreGhsas` are unchanged, with **no new GHSA** |
| `pnpm audit --audit-level high` | **exit 0**: "8 vulnerabilities found, 2 low / 6 moderate", 0 high/critical |
| `pnpm why undici` | Every `payload` path resolves to **7.30.1**. The only other consumer is `jsdom 30.1.3 → undici 8.12.2` (dev, unchanged, not flagged by audit) |
| `pnpm why happy-dom` | Every path resolves to **21.0.4**: `@lexical/headless` (prod) and `vitest` / `jest-dom > vitest` (peer, dev) |
| `ls node_modules/.pnpm` | Only `happy-dom@21.0.4`, `undici@7.30.1` and `undici@8.12.2` are installed. No stale 20.x or 7.29.x copies |
| Lockfile grep | `undici@` entries: 7.30.1 and 8.12.2 only. The only `undici:` consumers are payload (7.30.1) and jsdom (8.12.2). `happy-dom@` entry: 21.0.4 only |
| `pnpm install --frozen-lockfile --offline` | **exit 0**. The lockfile is accepted, and the local pnpm 9.15.0 matches `packageManager` (CI uses `pnpm/action-setup` with that field). No package files changed |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | **4595/4595 passed**, exit 0 (matches builder's 436 files / 4595) |
| `pnpm lint` | exit 0 |
| Smoke `scratchpad/smoke.mjs` (read first: it only imports from the worktree's node_modules and has no side effects) | exit 0. happy-dom 21.0.4 `Window` → `withDOM` → `$generateNodesFromDOM` / `$generateHtmlFromNodes` round-trips HTML ↔ Lexical correctly, including the Vietnamese text and bold formatting |
| `pnpm build` | **Not re-run** by reviewer. I accepted the builder's PASS as credible: the change is lockfile-only, a patch bump of undici within 7.x, and happy-dom is used only in the server-side headless path. Residual risk noted below |

### Lockfile churn analysis
- All hunks trace back to the two overrides. The only extra change is a peer-hash rewrite of the vitest/jest-dom snapshot keys (`happy-dom@20.14.6` → `21.0.4`), plus the vitest `peerDependencies.happy-dom: '*'` being rewritten to `21.0.4`. pnpm does this rewrite whenever an override is present, so it is expected.
- `@types/node` 26.6.5 → 22.20.5 under `happy-dom`, `@types/ws` and `buffer-image-size`:
  - happy-dom 21 declares `@types/node: >=20.0.0`, and `@types/ws` declares `*`. When those snapshots were re-resolved, pnpm deduped them onto the root's `@types/node ^22.20.5`.
  - This is types-only (no runtime code) and arguably better, because it matches the root types and CI's Node major.
  - `@types/node@26.6.5` is still in the lockfile for other consumers, so nothing was removed unexpectedly.
  - Typecheck passes. **Acceptable, no side effects.**
- No other packages were added, removed or bumped.

### Scoped `payload>undici` vs global `undici`
- **Sufficient.** The lockfile has only two undici consumers: `payload` (now 7.30.1) and `jsdom@30` (8.12.2, a separate major line that audit does not flag).
- A global `undici: 7.30.1` override would downgrade jsdom across a major version, so the builder's deviation from the task design ("undici" global) is justified and recorded in Repro Verification.
- Residual risk: a future dependency that pulls in a vulnerable undici 7.x through a non-payload parent would not be covered. The CI audit gate would still catch it.

### Exact pin `happy-dom: 21.0.4`
- Consistent with the existing `dompurify` exact-pin style. It also replaces the vitest peer range.
- Trade-off: future 21.x security patches will need a manual bump (see MINOR-1).

## Responsive Checklist Gate
N/A: the diff does not touch UI (only `package.json` and the lockfile).

## Skill gates
- aislop: N/A. No source code changed (manifest and lockfile only).
- oxlint (anti-slop): skipped, because no TS/JS source is in the diff. `pnpm lint` (eslint) exit 0.
- ocr (open-code-review): skipped. There is no source code to review, and I did not invoke `ocr`.
- AI-readable: OK. 0 indicators, since there are no code changes.
- ai-friendly-web: N/A. Not a public-facing web change.
- blitzstrike: N/A. This is a dependency bump verified by `pnpm audit`, with no new attack surface.

## Bug repro closure
- Original repro: CI `pnpm audit --audit-level high` exit 1, caused by 2 high advisories: GHSA-xjj6-f33q-929c (undici 7.29.1) and GHSA-834v-8h66-3h79 (happy-dom 20.14.6).
- After the fix, the reviewer independently re-ran the same command in the worktree: exit 0 with 0 high. Both vulnerable versions are gone from the lockfile and node_modules.
- Builder's Repro Verification status is `PASS`, and the evidence is verifiable and has been verified.

## Findings
- [CRITICAL] none
- [MAJOR] none
- [MINOR-1] `package.json` overrides: the exact pins (`happy-dom: 21.0.4`, `payload>undici: 7.30.1`) mean future patch advisories need a manual bump, and the overrides can outlive the point where payload/lexical ship fixed versions themselves. Suggested fix (optional, not blocking): add a note to the task file Decision log / BACKLOG to remove these overrides when `payload` ships undici ≥ 7.30.1 and `@lexical/headless` ships happy-dom ≥ 21.0.4. Alternatively use `^21.0.4` / `^7.30.1`. The exact pin is defensible for consistency with `dompurify`.
- [MINOR-2] The task file's "Thiết kế fix" step 1 still describes a global `"undici"` override, while the implementation uses `payload>undici`. The deviation is documented in Repro Verification. Suggestion for close-out: add the rationale to the Decision log so it is traceable.

## Residual risk
- `pnpm build` was not re-run by the reviewer. I relied on the builder's reported exit 0.
- No repo code calls `withDOM` directly (payload's `convertHTMLToLexical` takes JSDOM as an argument). The happy-dom 21 runtime path was covered only by the smoke test, not by an end-to-end payload seed/import run.

## Verdict
✅ **PASS**
