Agent: reviewer

# Review — build/tami-website layer-6-task-08 (Tuyển dụng S12/S13) — round 1

- **Review level:** STRICT
- **Reason:** Task file says NORMAL, but the diff touches red-risk areas: a schema migration (`ALTER TYPE ... ADD VALUE` on the `payload_jobs` enums), a cron/background job, shared components (Breadcrumb, LeadFormSlot, ProjectStickyCta), a shared field factory (`scopedCategoryField`, used by every content collection), the shared JSON-LD builder, the shared 404 proxy rule table, and a public endpoint's deadline logic (job-applications).
- **Scope:** uncommitted diff vs HEAD `e810c62`. Excluded: `.claude/launch.json`, `.context/progress.json`, `.context/runs/*`.
- **Blast radius:** `/[locale]/tuyen-dung` + `/[locale]/tuyen-dung/[slug]` (new). `POST /api/public/job-applications` (deadline helper moved to `src/lib/careers/deadline.ts`). Every page that uses `Breadcrumb` / `LeadFormSlot` / `ProjectStickyCta` (new props are optional and default to the old behaviour). Every collection that uses `scopedCategoryField` (default `required = true` is unchanged; only `job-postings` passes `required: false`). `buildJobPostingJsonLd` (its only consumer is this task). `MISSING_PAGE_RULES` (proxy). Payload jobs config + DB enums `enum_payload_jobs_task_slug` / `enum_payload_jobs_log_task_slug`. Sample seed (`--sample` only; production is blocked at `seed/index.ts:95`).

## Verify commands + result (commands from `.context/project-config.md`, run by the reviewer)

| Command | Result |
|---|---|
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0 |
| `pnpm test` | exit 0 — 141 files, **1530 tests passed** (same as the builder's numbers) |
| `pnpm build` | exit 0 — `/[locale]/tuyen-dung` and `/[locale]/tuyen-dung/[slug]` built, with the same render-mode markers as `/du-an` and `/tin-tuc` (precedent) |
| `pnpm payload migrate` | not run (the profile says it is not auto-allowed; deploy only) |

The reviewer did not start the app (outside allowed commands). The runtime checks in the builder's evidence (headers on `next start`, ISR HIT, curl of the 404 with content, 375/768/1280) were cross-checked only against code and tests. See Residual risk.

## Acceptance criteria and follow-ups

| Item | Result | Evidence |
|---|---|---|
| AC1: list filters `deadline ≥ today (VN time)` | OK | `job-queries.ts:72` `deadline >= startOfVietnamDay(now)`. Integration tests: "tin hết hạn không ở danh sách…" and "biên nửa đêm giờ VN: 16:59 UTC… 17:00 UTC" |
| AC2: expired detail shows banner, hides form, `noindex`, no JSON-LD | OK | `JobDetail.tsx:65-77,101,123-148`, `[slug]/page.tsx:78,118-126`, `Breadcrumb jsonLd={!view.expired}`. Test "không JSON-LD nào (kể cả breadcrumb)" |
| AC3: open post has JobPosting (min/max salary, `validThrough`, `inLanguage`) + `ApplyFormSlot` | OK | `job-json-ld.ts`, `json-ld.ts:464-495`, `ApplyFormSlot.tsx` (`id="apply-form"`) |
| AC4: `close-job-postings` only revalidates and does not change `status` | OK | `close-job-postings.ts:29-59` (read-only find + `revalidate`). Integration test: "không đổi status/deadline" |
| L5-T04: list filters by deadline; expired detail opens with "Hết hạn" + `noindex, follow` (DESIGN.md:305) | OK | `forceNoindex: isPastDeadline(...)`. Test "noindex, follow theo nội dung (production)" |
| G25: `category` optional | OK | `JobPostings.ts:61`, `scoped-category.ts:18-21`. The field config has no `required` attribute, so the DB column stays nullable and no migration is needed. ERD §4.10 updated. Integration test for G25 (wrong scope still blocked) |
| L6-T09: shared helper + real picker value | OK | `src/lib/careers/deadline.ts`, used by the endpoint, the list query, card/detail labels, `validThrough`, the seed and the job. Picker value `12:00Z` documented. Test "hạn do API đặt ở giờ khác 12:00Z" |
| L6-T03: 404 with server-rendered content | OK (code + unit test) | `resolve-missing-page.ts:34` + test that `/tuyen-dung` and `/en/careers` (list) are NOT matched. An expired post still exists, so it is correctly not rewritten |
| SPEC F6 / DESIGN.md:305 / design-spec S12, S13 | OK | Row cards (`ul` > link), province select + category chips in URL params, ≤3-day warning badge, empty panel + `mailto`, 8/4 sticky layout ≥ lg, `dl` 2 cols < lg, mobile sticky Apply bar hidden while the form is in view, other-position suggestions on expired detail |

## Timezone correctness (`startOfVietnamDay` / `isPastDeadline`)

- VN is fixed at UTC+7 (no DST), so the offset arithmetic is exact.
- `isPastDeadline(d, now)` ⟺ `vnDate(d) < vnDate(now)` ⟺ `d < 00:00 VN today` ⟺ `!(d >= startOfVietnamDay(now))`. The list query and the label/endpoint are exact complements, including at the boundary (16:59:59Z vs 17:00Z, both tested).
- Values that are not 12:00Z are read by their VN calendar day. Example: `2026-10-16T17:00Z` is 00:00 VN on the 17th, so the deadline is the 17th. The old endpoint sliced the UTC date and would have said the 16th.
- `formatDate` uses `TIME_ZONE` (VN), so the displayed date matches the computed day.
- `validThrough` = `YYYY-MM-DDT23:59:59+07:00`, which is correct.
- Endpoint behaviour is unchanged for every value the admin picker can produce (12:00Z). It differs only for (a) API/seed values whose UTC date differs from the VN date (now correct by VN day) and (b) unparsable strings (now treated as closed, which is fail-safe). Accepted as an intentional fix, documented in API_SPEC §3.2.

## Migration safety

- `up`: two `ALTER TYPE ... ADD VALUE 'close-job-postings'`. Not destructive, so **not HIGH_RISK_MIGRATION**. The Payload Postgres migration runs inside a transaction. `ADD VALUE` is allowed inside a transaction block since PostgreSQL 12, provided the new value is not used in the same transaction (it is not). The stack is `postgres:16-alpine` (`.devops/templates/docker-vps.md:58`), so this is safe.
- `down`: Payload-generated "text → recreate enum → cast back". It fails if any `payload_jobs` / `payload_jobs_log` row still has `task_slug = 'close-job-postings'`. The schedule keeps a queued next-run row, so a real rollback would hit this. See [MINOR] M1.
- The task file says "Không đụng schema (không tạo migration)", but registering a new task necessarily changes the enum. The deviation is justified but must be recorded in the task file (M2).

## Rulings on builder decisions

1. **`close-job-postings` revalidate has no effect outside Next — KEEP.** The AC and ARCH §5.4 require the job, and they require that it only revalidates. Correctness does not depend on it: detail pages compute expiry at render (`revalidate = 60`) and the list is `force-dynamic` + CDN `s-maxage=60`. ARCH §5.4 documents the limitation honestly. Do not add a cross-process revalidate endpoint in this task (that would be over-engineering). Revisit when `expire-offers` (BR-06) needs real cache busting from the `jobs` process. Recorded as follow-up M3, not blocking.
2. **Cron in UTC (`0 10 17 * * *` = 00:10 VN) — ACCEPT.** Payload 3.91 `schedule` has no timezone option, and the `jobs` container runs in UTC. The coupling to `TZ` is documented in code (`close-job-postings.ts:61-64`) and in ARCH §5.4, and a unit test pins the expression. The query window `[yesterday 00:00 VN, today 00:00 VN)` is correct, and a retry later the same day is still correct.
3. **Expired detail drops ALL JSON-LD, including BreadcrumbList — ACCEPT.** SPEC F6 literally says "bỏ JSON-LD" with no qualifier. DESIGN.md:305 names JobPosting specifically, but dropping more does not contradict it, and the page is `noindex` anyway. The visual breadcrumb is still rendered. `Breadcrumb jsonLd` defaults to `true`, so other pages are unaffected.

## Shared component / no-regression check

- `Breadcrumb` `jsonLd = true` default, `LeadFormSlot` `id = "lead-form"` default, `ProjectStickyCta({ targetId = LEAD_FORM_DOM_ID, label } = {})`: existing callers render the same output. The `[targetId]` effect dependency is correct.
- `scopedCategoryField(scope, { required = true } = {})`: other collections behave the same.
- `buildJobPostingJsonLd`: the `location` type changed from string to object. Its only consumer is new code, so typecheck passes.
- `firstValue` is now exported (reused, not duplicated). `findLocalizedSlugs` union widened.

## Security

- Query params: `firstValue` caps length. Category is resolved via `findPublicBySlug` with `scope: job`, and province via an in-memory list, so no raw input reaches `where` unvalidated. Payload parametrizes queries.
- Every public read goes through `findPublicList` / `findPublicBySlug` (`publicWhere`: published, not trashed, `hasEnglish` for `/en`).
- The job's `overrideAccess` read selects only `slug`.
- JSON-LD description HTML is built from escaped plain text (`escapeHtml`), and `JsonLd` escapes `</script>` (existing test).
- `mailto:`/`tel:` values come from admin-managed `site-settings`.
- No new mass-assignment surface. The seed is blocked in production.

## Responsive Checklist Gate (UI diff: new careers components + 3 shared props)

Breakpoints from the profile: 375/640/768/1024/1280/1536. No browser was run by the reviewer; verification is by CSS math and code.

| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | JobCard md grid `minmax(0,1fr)_9rem_9rem_8rem_1.25rem` + 4×1rem gaps + `px-6` ≈ 548px. At 768 (container ≈ 720px) the title column is ≈ 170px and can shrink to 0 (no min-content blowout). At lg, 12/11/10rem gives ≈ 660px fixed vs a ≈ 976px container. `dd` has `break-words` and `min-w-0`. RichText root already uses `overflow-wrap:anywhere` |
| Mobile-first `min-width` | OK | Only `sm:`/`md:`/`lg:` prefixes. Base = 375 stacked layout per S12 table |
| Grid `auto-fit`/`minmax`, no fixed containers | OK (justified) | Fixed tracks on JobCard are an intentional table-like alignment required by S12 at 768 ("hàng 1 dòng… thẳng cột"). The flexible title track uses `minmax(0,1fr)`. Containers use `max-w-container`/`max-w-text` tokens, not fixed px |
| Font `rem`, fluid headings | OK | Token classes `text-h1/h2/h3/small/body` (existing fluid `clamp()` tokens). No px font sizes added |
| Media | N/A | No images/video in the diff |
| Touch ≥ 44×44 | OK | Card link `min-h-11`, chips/links `min-h-11`, select `h-12`, sticky CTA `size="lg"` in an `h-16` bar, banner/empty-panel links `min-h-11` |
| Mobile nav / table wrapper | N/A | No nav change; tables only inside RichText (existing scroll region) |
| No bare `100vh`; reduced motion | OK | No vh units. No new animation (only hover underline). Sticky bar is unchanged from the S03 precedent |
| No `overflow:hidden` hiding bugs | OK | None added |

## Skill gates

| Gate | Result |
|---|---|
| aislop | skip, `aislop` not installed (`command -v aislop` → none). Manual slop scan: no dead code, no generic names, no duplicated helpers (deadline logic centralised, `firstValue` reused) |
| oxlint (anti-slop) | skip, oxlint not configured (no `.oxlintrc.json`). ESLint `pnpm lint` exit 0 and `tsc` exit 0 instead |
| ocr (open-code-review) | skip, ocr not installed |
| AI-readable | OK — 1 indicator (long component bodies: `JobDetail` ≈ 115 lines, `JobListPage` ≈ 75 lines, the same pattern as existing page components). Names are explicit, magic numbers are named constants (`DEADLINE_WARNING_DAYS`, `MAX_EXPIRED_PER_RUN`, `META_DESCRIPTION_LENGTH`, `PICKER_TIME_OFFSET_MS`), comments explain why, and ARCH/ERD/API_SPEC were updated. Fewer than 3 indicators, so no FAIL |
| ai-friendly-web | N/A for this task (public pages, but `llms.txt`/`robots.txt`/sitemap belong to layer-8 SEO tasks; `robots.txt` route exists; no AI crawler blocking was added) |
| blitzstrike | skip, not installed / no permitted environment. Inputs here are read-only GET params and were reviewed manually above |
| ponytail / karpathy (surgical diff) | OK — every changed line traces to an AC, a follow-up, or G25. The migration is a necessary consequence of registering the task |

## Findings

**[CRITICAL]** none.

**[MAJOR]** none.

**[MINOR]**
- **M1** `migrations/20261017_175237_close_job_postings_task.ts:9-18`: `down` casts `task_slug` back to the old enum and will error if queued or logged rows with `close-job-postings` exist (the scheduler always keeps a queued next run). Fix: delete `payload_jobs` / `payload_jobs_log` rows with that slug before the type swap, or document that rollback requires that cleanup. Not destructive in `up`, so it does not need the HIGH_RISK tag.
- **M2** `tasks/tami-website/layer-6-task-08.md:54-55`: the "Migration" section still says no migration. At close-out, update it to name the migration and why it is needed (task registration adds an enum value; additive only; PG ≥ 12 allows it in a transaction).
- **M3** (follow-up, not blocking) `src/jobs/close-job-postings.ts:22-28`: the job is effectively a no-op in the separate `jobs` process. When BR-06 `expire-offers` lands, decide on one cross-process revalidation path (for example, an internal authenticated revalidate endpoint) and reuse it here.
- **M4** `src/components/careers/JobDetail.tsx:56`: `pb-16 lg:pb-0` reserves sticky-bar space even on expired posts, which have no sticky bar, leaving 64px of extra bottom padding on mobile. Fix: `className={view.expired ? undefined : "pb-16 lg:pb-0"}`.
- **M5** `seed/sample/job-postings.ts` `completeLegacyDraft`: matches by Vietnamese title only, so on dev/staging a real draft that happens to share a sample title would be auto-published by `--sample`. Acceptable for sample data; optionally also match `author` = seed admin.
- **M6** `src/app/(frontend)/[locale]/tuyen-dung/[slug]/page.tsx:78` vs `:106`: `generateMetadata` and the page each call `new Date()`. Within the same render this can disagree only within milliseconds of midnight. Optional: compute `now` once inside the `cache`d `loadJob`.

## Residual risk

- Runtime checks were not re-run by the reviewer: response headers, ISR HIT, the proxy 404 HTML and real 375/768/1280 screenshots. They rely on the builder's evidence plus code and tests.
- ISR + CDN stale-while-revalidate: just after VN midnight, a cached detail page can still show the open state (form slot, JobPosting with a just-passed `validThrough`) for up to about 60 s + CDN SWR. The endpoint independently rejects applications, so there is no data-integrity impact.

## Verdict

**PASS** — no CRITICAL or MAJOR findings. Typecheck, lint, 1530 tests and build all pass when re-run by the reviewer. All four ACs and every listed follow-up are covered and tested. The MINOR items can be handled at close-out (M2) or as follow-ups.
