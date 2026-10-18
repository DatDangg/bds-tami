Agent: reviewer

# Review: build-tami-website layer-6-task-01 (deps fix) round 1

- **Review level:** FAST
- **Reason:** Small diff: one package moved from devDependencies to dependencies, the matching lockfile importer move, and one new read-only unit test. No change to app logic, API, schema or auth. Builder ran a real Docker image smoke test (migrate, seed, health, jobs).
- **Blast radius:** Production image `prod-deps` stage (it now installs `@aws-sdk/client-s3` and its transitive deps, so the image gets bigger). `src/endpoints/admin/private-file-download.ts` can now resolve at runtime. CI unit suite (new guard test). No code paths changed.

## Verify commands + result
- `pnpm vitest run tests/unit/runtime-dependencies.test.ts` → 1 file, 1 test PASS (742ms)
- `pnpm install --frozen-lockfile` → Done, lockfile consistent with package.json
- lint/typecheck/full suite: builder evidence (unit+ui 1114 PASS); integration suite is being run by primary separately (not re-run here)

## Diff check
- package.json: same exact pin `3.1152.0`, moved alphabetically into `dependencies`. OK.
- pnpm-lock.yaml: only the importer entry moved (3+/3-). The `packages:`/`snapshots:` sections stay the same because the resolved version did not change. Frozen install confirms the lockfile is consistent. OK.

## Guard test analysis (`tests/unit/runtime-dependencies.test.ts`)
- `import x from` / `import {..} from` (multi-line too, because the negated char class spans newlines) → covered.
- `export ... from` → covered. Side-effect `import "x"` → covered. Dynamic `import("x")` → covered (string literal only).
- Scoped packages and subpaths: `packageNameOf` gives `@scope/name` and `pkg/sub` → `pkg`. OK.
- Builtins: `node:` prefix plus `builtinModules` (includes `fs/promises` etc.). OK.
- Aliases `@/` and `@payload-config` skipped. OK.
- `require(` is not matched. I grepped runtime roots and found no `require(`/`createRequire`, so there is no gap today (see MINOR-1).
- `import type` is counted as a runtime import. This is a false positive in the safe direction: it could force a types-only package into deps, but it can never miss a runtime import. Today all type imports come from runtime deps (`payload`, `next`), so the test passes (see MINOR-2).
- `src/components/media/test-utils.tsx` is excluded by `(^|/)test-utils\.tsx?$`. It is only imported by `*.test.tsx` files, so the exclusion is justified.
- Determinism: the test is a pure filesystem scan with no network/time/env dependency, so it is not flaky. `.cjs/.mts/.jsx` are not scanned. The only such file is `scripts/upload-sourcemaps.d.mts`, a declaration file. OK.
- `scripts/upload-sourcemaps.mjs` exclusion: build-stage only (Sentry CLI). Justified.

## Responsive Checklist Gate
N/A — no UI in the diff.

## Skill gates
- aislop: skip, FAST scope with one test file and a manifest move (not run)
- oxlint (anti-slop): builder lint pass; no new oxlint config scope. Not re-run, so skip
- ocr: skip, ocr not installed
- AI-readable: OK — names are clear, constants are named, comments explain WHY, the function is under 50 lines. 0 indicators
- ai-friendly-web: N/A (not public-facing)
- blitzstrike: N/A (FAST)

## Findings
- [MINOR-1] tests/unit/runtime-dependencies.test.ts:17 — `require("x")` and `import(\`x\`)` (template literal) are not matched. No usage today. Optional fix: add `|\brequire\(\s*["']([^"']+)["']\s*\)`.
- [MINOR-2] tests/unit/runtime-dependencies.test.ts:17 — `import type`/`export type` lines count as runtime imports. This is stricter than needed: a future types-only import from a devDep (e.g. `@types/*`-only or a dev tool's types) would fail the test. Optional fix: skip a match when the statement starts with `import type`/`export type`.

No CRITICAL or MAJOR findings.

## Verdict
PASS (with integration suite pending confirmation by primary, as noted)
