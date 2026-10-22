Agent: reviewer

> Saved by dispatcher (change-request): reviewer's Write was blocked by guard.mjs (worktree path). Content from reviewer hand-back.

# Review: feature-admin-form-ux-polish · phase-1-task-04 · round 2 (BL-058)

- **Review level:** STRICT
- **Reason:** custom `edit.versions` view for 7 collections via shared `withContentDefaults`; reads versions through `readVersions` (`overrideAccess: false`); this round switches to `locale: "all"`; shared i18n strings; global CSS in compare view.
- **Blast radius:** `src/collections/_shared/content-defaults.ts` (Projects, Rentals, PropertyPosts, News, JobPostings, Services, Pages); `src/components/admin/VersionHistoryView.tsx`; `src/lib/admin/version-history.ts`; `src/components/admin/styles/_version-history.scss` (global `.render-field-diffs__field[data-field-path=…]`); `src/lib/admin/payload-vi-overrides.ts`; `custom.scss`; `importMap.js`. No migration / field / endpoint; `maxPerDoc`/`drafts` unchanged; `src/payload-types.ts` EOL only.

## Verify commands + result (task-04 worktree)
| Command | Result |
|---|---|
| `pnpm lint` | PASS (0 errors; 2 old warnings outside task) |
| `pnpm typecheck` | PASS |
| `pnpm vitest run --project unit --project ui --maxWorkers=2` | PASS full suite 340 files / 3292 tests (460.9 s) |
| `pnpm build` | PASS |
| integration / dev server | not run (instruction) |

## Screenshots (`.context/review-reports/feature-admin-form-ux-polish/screens/`)
- `t04-after-1440-light-list.png`, `t04-after-1440-dark-list.png`: VN time + "x phút trước", status badge (Đã xuất bản / Ẩn), "Phiên bản hiện tại" first row, "N trường đã đổi", "Bản cũ nhất"; 14:09 row "3 trường đã đổi" for first EN creation (consistent with `locale: "all"`).
- `t04-after-390-light-list.png`: stacked cards, no horizontal overflow.
- Before/diff screenshots unchanged since r1.

## STRICT checks
### MAJOR-1 — CLOSED
- `VersionHistoryView.tsx:52` `locale: "all"` → localized fields `{ vi, en }`; `status` from `statusField()` (`src/fields/status.ts:18-28`) not localized → string, badge correct.
- `dropEmpty` (`version-history.ts:13-22,33`) does not hide real deletions: `"abc"`→`null` counted; `{vi:"x"}`→`{vi:null}` counted; `{vi:"x",en:"y"}`→`{vi:null,en:"y"}` counted; clearing a group counted; `""`, `false`, `0` not dropped. Only `null`/`undefined`/`{}` collapsed (all "no value").
- `[]` ↔ `null` counts as 1 (small overcount, never hides). Dates are strings with postgresAdapter (`src/payload.config.ts:1,94`).
- Access with locale all unchanged (`overrideAccess: false`, `user`, `req`; field `access.read` applies; view only with `docPermissions.readVersions`); `computeSearchReindexPending` cached per request (`search-reindex-pending.ts:7-29`) → no N+1.
- Perf: 1 query, `depth: 0`, ≤ 20 versions; locale all adds one join.
- Tests: `{vi,en}` only EN changed → 1; `{vi}` ≈ `{vi,en:null}` → 0.
### MINOR-1 — CLOSED: `_version-history.scss:30-60` `li` relative + `.version-history__time::after { inset: 0 }`; covers only non-interactive `StatusBadge`; one focusable link per row; text not selectable (acceptable).
### MINOR-2 — CLOSED: `loadVersionRows` (`:45-59`), view ~45 lines (`:66-110`), `type VersionRowProps` (`:15-22`).
### MINOR-3 — CLOSED: `formatAdminURL({ adminRoute, path })` (`:99`) matches payload 3.91.0 `formatAdminURL.d.ts`; relative path, Next `<Link>` adds basePath; handles `routes.admin === "/"`.
### MINOR-4 — CLOSED: `:72` typed guard for select `status` via `flattenedFields`; all 7 collections use `statusField()`.
### No regression on r1 OK items
Access path unchanged; view only when `versions !== false`, own `edit.versions` kept (`content-defaults.ts:184-189,219`, 3 tests green); sort `-updatedAt`, `index === 0` current; VN time via `Intl`; CSS hidden fields = `VERSION_HIDDEN_FIELDS`; i18n overrides in place; `edit.version` not forked (restore works); forbidden scope respected.

## Responsive Checklist Gate
No horizontal scroll OK (390 screenshot; ≤ 768 `1fr auto`; desktop ≈ 44rem) · `max-width: 768px` per admin convention · `minmax`/`fr`, badge `11rem` · rem only · touch target `min-height: 44px` + whole-row overlay · card layout ≤ 768 · no vh/motion/overflow masking · media/nav N/A.

## Skill gates
aislop skip · oxlint skip (eslint 0 errors) · ocr skip · AI-readable OK · ai-friendly-web N/A · blitzstrike N/A.

## Findings
No CRITICAL / MAJOR.
- [MINOR-A] `src/lib/admin/version-history.test.ts:24-28` — no regression test for clearing a value (`{metaDescription:{vi:null}}` vs `{vi:"x"}` → 1; group case).
- [MINOR-B] `_version-history.scss:35-37` — focus ring only on time cell; suggest `.version-history__row:focus-within`.
- [MINOR-C] `VersionHistoryView.tsx:87` — header `li aria-hidden` inside `ul` → some screen readers count N+1; move header out of `ul`.
- [MINOR-D] `version-history.ts:15-18` — `""`↔`null`, `[]`↔`null` count as changes (overcount ≤ 1, never hides).

## Residual risk
Not browser-checked: Rentals, News, JobPostings, Services, Pages; sale opening a post they cannot read (code reading only). Compare-view hiding depends on Payload 3.91 `data-field-path`. Payload default `readVersions` (any logged-in user) pre-existing, out of scope — suggest separate task.

## Verdict: PASS
MAJOR-1 and MINOR-1..4 closed; lint, typecheck, full unit+ui (340 / 3292), build PASS. MINOR-A..D non-blocking.
