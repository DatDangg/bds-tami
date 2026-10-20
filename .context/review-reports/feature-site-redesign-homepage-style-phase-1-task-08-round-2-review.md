Agent: reviewer

# Review — feature-site-redesign-homepage-style · phase-1-task-08 (close-out) · round 2

- **Review level:** STRICT (same as round 1)
- **Reason:** The seed scripts write to the DB: they overwrite the `site-settings` global and publish pages and services. The task also changes a shared query and the `ProjectCardData` DTO, edits the i18n catalogs, and adds a script that downloads from an external site. Round 2 itself touches the seed guard, the publish scope, the fetch hardening, and the shared rental detail components.
- **Blast radius:** Same as round 1. Round 2 adds:
  - `RentalDetails` and `RentalTerms`: row layout and grid breakpoint, used on every rental detail page.
  - `RentalAmenities`: number of columns on mobile.
  - `docs/DESIGN.md` and `docs/API_SPEC.md`: as-built docs.
  - Behaviour of `seed:page-heroes` and `seed:galleries` on any DB they run against.

## Verify commands + result

| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS: 0 errors. The 2 warnings in `tools/task-dashboard/server.mjs` are pre-existing and outside this diff. |
| `pnpm vitest run src` | PASS: 253 files, 2496 tests. That is 2 more tests than round 1; they are the new ConsultBanner tests. |
| `pnpm vitest run tests/integration/projects.test.ts` | PASS: 31/31 (real DB) |
| `pnpm build` | skip. A large `node` process (29108, about 1.2 GB) is listening on :3104, which looks like the dev server on the main checkout. Building would overwrite its `.next`. Residual risk; typecheck and lint pass. |

## Status of round-1 findings

| Finding | Status | Evidence |
|---|---|---|
| **MAJOR-1** seed guard + publishing every draft | **Fixed** | Both scripts now call `checkSeedEnvironment(process.env)` and exit with code 1 when it refuses (`seed-page-heroes.ts:14-18`, `seed-galleries.ts:16-20`). It refuses when `NODE_ENV=production`, when `DATABASE_URL` is missing, or when `DATABASE_URL` equals `DATABASE_URL_STAGING` or `DATABASE_URL_PROD`. `publishLegalPages` now only touches `kind in [privacy, terms]` (`:117-124`). `publishSampleServices` only touches the 3 sample service slugs (`:127-138`). The header comments and JSDoc now match the code. |
| MINOR-1 fetch script | **Fixed** | `AbortSignal.timeout(20s)`. A `content-length` check plus a streamed byte count against an 8 MB cap (`:59-75`). `redirect: "manual"`, so a 3xx gives `!res.ok` and is skipped. `safeUrl` wraps `decodeURI` in try/catch and checks the host (`:49-56`). |
| MINOR-2 untracked mockup assets | **Accepted** | `docs/specs/site-redesign-mockup/` will be committed at close-out (agreed with the primary). |
| MINOR-3 detail view vs mockup | **Fixed** | Rows in "Thông tin chi tiết" and "Điều khoản thuê" are now label on the left, value on the right, in 2 columns from md and 1 column below md. Amenities are 2 columns at 390. Confirmed by the screenshots below. |
| MINOR-4 stale DESIGN.md rows | **Fixed** | The rows for project list, project detail, rental list, rental detail, news, news detail, careers, contact and List Search Bar now start with "As-built BL-045", and the old text is kept as "Trước BL-045". |
| MINOR-5 whitespace edits in API_SPEC | **Fixed** | The diff of `docs/API_SPEC.md` now contains only the added section §3.9 (URL parameters for `/du-an`). The whitespace edits to BR-08 and lead-assign are gone. |
| MINOR-6 ConsultBanner pairing | **Fixed** | 2 new tests: (a) a title with no description gets no default description; (b) an empty title uses both the default title and the default description and ignores a stray admin description. |
| MINOR-7 ESLint ignore of `seed/scraped/` | **Kept** (as agreed) | Harmless. |

## Mockup comparison (rental detail, after the fix)

The screenshots were taken after the source changes: the PNGs are dated 04:29–04:30 and `RentalSpecs`/`RentalTerms`/`RentalAmenities` were edited at 04:24–04:26.

**`site-redesign-t08-detail-rent-1440.png`** (mockup on the left, real page on the right):
- "Thông tin chi tiết": 2 columns, each row with a muted label on the left and a bold, right-aligned value on the right, with a separator line. Matches the mockup `.kv`.
- "Điều khoản thuê": same pattern. The "Dịch vụ bao gồm" chips sit on their own row.
- "Tiện ích": 3 columns. The real page uses framed chips while the mockup uses plain icon + text. A small styling difference; it does not affect layout.
- The facts strip shows 3 items because this dev rental has no direction set. That is data, not code.

**`site-redesign-t08-detail-rent-390.png` / `-390-real.png`:**
- "Thông tin chi tiết" is 1 column with label left and value right. Matches the mockup.
- Amenities are 2 columns. Matches the mockup.
- Short labels such as "Phòng gym" wrap to 2 lines inside the chip. This is acceptable; there is no overflow.
- Section order matches the mockup, and there is no horizontal overflow.
- The "NHẬN TƯ VẤN" bar sitting on top of the facts strip is the fixed mobile CTA bar captured in a full-page screenshot. It is a capture artifact, not a layout bug; it was already present in round 1.

## Responsive Checklist Gate (round-2 diff touches UI: RentalSpecs, RentalTerms, RentalAmenities)

| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll at 390 / 1440 | OK | Screenshots at 390 and 1440 show no overflow. Each row has `min-w-0` and `justify-between gap-4`; `RentalDetails` values use `break-words`. |
| 768 | Not observed (no browser). CSS math: OK at 768 | `md:grid-cols-2` gives 2 columns at ≥768, and each column (about 300px or more) fits label + value. |
| Mobile-first | OK | Base is 1 column and `md:` adds columns. Amenities: `grid-cols-2` → `md:grid-cols-3`. |
| Grid at 640–767 | OK, with the note in MINOR-N1 | No overflow, but the `RentalTerms` layout is inconsistent in this band (see MINOR-N1). |
| Touch target | N/A | No new interactive element. |
| Typography rem / fluid | N/A | Unchanged (`text-small`, token classes). |
| Media / 100vh / reduced-motion / overflow hidden | N/A | No change. |

## Skill gates

| Gate | Result | Evidence |
|---|---|---|
| aislop | skip | Not in the allowed verify command list. |
| oxlint (anti-slop) | skip | oxlint not configured; eslint passes with 0 errors. |
| ocr | skip | ocr not installed. |
| AI-readable | OK (fewer than 3 indicators) | The JSDoc and code of the seed scripts now agree. Magic numbers in the fetch script are now named constants (`FETCH_TIMEOUT_MS`, `MAX_DOWNLOAD_BYTES`). Remaining: 1 small item (hard-coded slugs, MINOR-N2). |
| ai-friendly-web | N/A | No change to robots/sitemap/llms. |
| blitzstrike | skip | Not installed. |

## New findings (round 2)

### [MINOR-N1] `RentalTerms`: the services cell still uses `sm:col-span-2`, but the grid changed to `md:grid-cols-2`

`src/components/rentals/RentalTerms.tsx:39` has `<div className="flex flex-col gap-2 sm:col-span-2">`, while the `dl` on `:30` was changed this round to `grid … md:grid-cols-2` (it used to be `sm:grid-cols-2`).

Effect between 640 and 767 px, when the rental has `services`:
- The item spanning 2 columns makes the grid create 2 implicit `auto` columns.
- The term rows then flow into 2 columns of unequal width, sized by their content.
- `RentalDetails` right above stays at 1 column, so the two blocks look different in this band.
- There is no overflow, and 390 and 1440 are not affected.

**Fix:** change `sm:col-span-2` to `md:col-span-2`.

### [MINOR-N2] `SAMPLE_SERVICE_SLUGS` is hard-coded and depends on slugs generated from titles

`scripts/seed-page-heroes.ts:127` repeats the slugs. They are generated automatically from the titles in `seed/sample/services.ts:8-10`, and the slugs themselves do not appear anywhere in that seed. If the slug generation changes, publishing silently does nothing. It is safe, because nothing outside the sample services is touched.

**Fix (optional):** query by `title in SAMPLE_SERVICES.map(s => s.title)`, importing `SAMPLE_SERVICES` from `seed/sample/services`, so there is a single source of truth.

### Notes (not counted)

- `fetch-scraped-extra.mjs:85`: if `sharp()` gets bytes that pass the magic-byte check but are not a valid image, it throws and the dev script stops. Acceptable for a dev script; it could be wrapped in try/continue.
- `scripts/seed-sample-services.ts:7` still uses only the `APP_ENV` guard. This is pre-existing and outside T08's diff; suggest a separate task to switch it to `checkSeedEnvironment`.

## Residual risk

- `pnpm build` was not re-run because the dev server is holding `.next`. Typecheck and lint pass.
- The 640–767 band and 768 were checked with CSS math only, not in a browser.
- The other views not opened in round 1 (article, careers, legal, news, posts, services, list-rent and others) were not reopened. Round 2 did not change them.
- No `.dockerignore` for `seed/`. Unchanged since round 1 (low risk).

## Verdict: PASS

No CRITICAL or MAJOR findings remain. MAJOR-1 and MINOR-1, 3, 4, 5 and 6 are fixed; MINOR-2 and MINOR-7 are accepted.

Recommended but not blocking: fix MINOR-N1 (one class) before the close-out commit. MINOR-N2 is optional.
