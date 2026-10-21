Agent: reviewer

# Review: bug-site-url-build-inlined, phase-1-task-01, round 1 (BL-053)

- **Review level:** STRICT
- **Reason:** `getSiteUrl()` is shared SEO config used by every public page (canonical, hreflang, OG, JSON-LD, sitemap, robots, Breadcrumb). The change also touches the Docker build pipeline. Bug task.
- **Blast radius:** `src/lib/seo/site-url.ts`, which is imported by 11 files: the `[locale]` layout, 7 detail/list pages, `robots.ts`, `Breadcrumb.tsx` and `load-home.ts`, plus indirect callers through `lib/seo/*`. Also the `docker/Dockerfile` builder stage and the new `scripts/check-build-placeholder.mjs`. No schema, API, auth or data changes.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/lib/seo` | PASS: 8 files, 75 tests |
| `pnpm typecheck` (`tsc --noEmit`) | PASS: no output |
| `pnpm lint` | PASS: 0 errors, 2 warnings that already existed in `tools/task-dashboard/server.mjs` (not part of this diff) |
| `grep -rl build-placeholder.invalid .next/server .next/static` (`.next` built 2026-10-21 20:19) | empty |
| Look at the compiled site-url code in `.next/server/chunks/ssr/*.js` | `function(){var e=process.env;if("phase-production-build"===e.NEXT_PHASE)return;let r=e.NEXT_PUBLIC_SITE_URL?.trim();...`: the value is read at runtime and is not folded into a string literal |
| `zod` 4.x `z.url().safeParse('http://build-placeholder.invalid')` | `true`, so the build-time env validation still passes |

## Checks
- **Root cause addressed: OK.** The old code was `const SITE_URL_KEY="NEXT_PUBLIC_SITE_URL"; process.env[SITE_URL_KEY]`, and Next folded it to the build value. The new code passes the whole `process.env` object into `parseSiteUrl(env)`, which then reads `env.NEXT_PUBLIC_SITE_URL`. The compiled bundle shows the minifier inlined the function but kept `var e=process.env; e.NEXT_PUBLIC_SITE_URL`. The define/replace step had already run, so the value is not baked in. This is the same pattern `getEnv()` uses, and that pattern already works on staging.
- **Behavior preserved: OK.**
  - `NEXT_PHASE=phase-production-build` returns `undefined`.
  - Empty, invalid or non-http(s) values return `undefined`.
  - Otherwise it returns `url.origin`, with no trailing `/`.
  - The existing tests pass, plus 2 new `parseSiteUrl` cases (it reads from the object passed in, not from `process.env`; and the missing/ftp/build-phase cases).
- **Guard script: OK.**
  - It scans `.next/server` and `.next/static`, which the Dockerfile reaches from `WORKDIR /app`. `COPY . .` copies `scripts/`, and `.dockerignore` does not exclude it.
  - It exits 1 when the placeholder is found and 0 otherwise.
  - It only matches the very specific token `build-placeholder.invalid`. A Grep of `src/` and `docs/` found no other occurrence, so false positives are unlikely.
  - `.map` files are excluded by the extension filter, so the source maps (which contain comments) cannot cause hits.
  - It runs right after `pnpm build` and before `upload-sourcemaps` and the `.map` deletion. The order is correct.
- **Dockerfile placeholder: OK.** `http://build-placeholder.invalid` passes `z.url()`. The comment explains the new mechanism and the guard.
- **Audit of other env reads: OK.** Every other read of `NEXT_PUBLIC_SITE_URL` goes through `getEnv()`, which passes the whole object: `leads.ts`, `job-applications.ts`, `remind-unassigned-leads.ts`, `translate-content-failure.ts`, `on-assignment-change.ts`, `SiteLink`, `DocumentNavSlot` and `RowActionsCell`. The compiled chunks confirm this (`(0,x.y)().NEXT_PUBLIC_SITE_URL`). `process.env[APP_ENV_KEY]` is not `NEXT_PUBLIC_*`, so it is never folded. In `INTERNAL_APP_URL||"http://localhost:3000"` the localhost string is a runtime fallback for development, not a folded value.
- **Doc impact:** none found. No doc mentions "khoá động" / `SITE_URL_KEY`. The JSDoc and the Dockerfile comment were updated to the correct mechanism.
- **Surgical diff: OK.** Every changed line traces back to BL-053.

## Bug repro closure
- The task file's Repro Verification is `PASS`. It records:
  - Before the fix: 3 chunks containing `let e="http://build-placeholder.invalid".trim();`.
  - After the fix: grep is empty and the guard exits 0.
  - Guard run on the old bundle: exit 1.
- I independently confirmed the after-fix state on the existing `.next`: no placeholder, and the compiled read path is the runtime one. That is enough evidence for the root cause, which is a build-time inlining mechanism.

## Responsive Checklist Gate
N/A: no UI in the diff.

## Skill gates
- aislop: skip, `aislop` not installed.
- oxlint (anti-slop): skip, oxlint not configured. ESLint `pnpm lint` shows 0 errors.
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK. Names are clear (`parseSiteUrl`, `findPlaceholderFiles`), functions are under 50 lines, there is no deep indirection, and the comments explain why rather than what. 0 indicators.
- ai-friendly-web: N/A. robots, sitemap and llms are not changed, only the base URL feeding them.
- blitzstrike: N/A. No auth, input or API surface.

## Findings
- **[MINOR]** `scripts/check-build-placeholder.mjs:23-27`: the `try/catch` returns `[]` for any error, not just a missing directory. If a read error occurs (for example a permission or encoding problem), the guard reports "OK" without checking anything.
  - Suggested fix: only swallow `ENOENT`, and rethrow other errors.
- **[MINOR]** `scripts/check-build-placeholder.mjs`: the exported `findPlaceholderFiles` has no unit test. The task said "nếu hợp lý" (if reasonable), and the builder showed exit 1 / exit 0 manually.
  - Suggested fix: add a small vitest using a temp dir fixture (one file with a hit, one `.map` with a hit that should be ignored, one clean file).
- **[MINOR]** Observation: the fix depends on Next/SWC not doing constant propagation through `var e=process.env; e.X`. That holds for the current Next version (confirmed in the bundle). The Docker guard covers this risk if Next is upgraded later, so no action is needed.

## Residual risk
- `next start` was not run at runtime (outside the reviewer's permissions). The bundle evidence plus the existing `getEnv()` pattern working on staging make the risk low. Confirm canonical and `/sitemap.xml` on staging after redeploy.
- I could not tell whether the local `.next` (20:19) was built with `NEXT_PUBLIC_SITE_URL=http://build-placeholder.invalid`. The compiled code shape (`e.NEXT_PUBLIC_SITE_URL` read from the env object) proves the fix no matter which value was used at build time.

## Verdict
PASS. There are no CRITICAL or MAJOR findings, the bug repro status is PASS with evidence that can be checked, and the verify commands pass.
