Agent: reviewer

# Review — feature-site-redesign-homepage-style · phase-1-task-07 · round 1

- Worktree: `D:/prj/bds/.claude/worktrees/agent-aab0e1eb8a43611c8` (branch `worktree-agent-aab0e1eb8a43611c8`, HEAD = ffc31b8 staging base, confirmed; changes uncommitted, no untracked files). `src/payload-types.ts` ignored (EOL only).
- Task: `tasks/feature-site-redesign-homepage-style/phase-1-task-07.md`

## Review level: STRICT

**Reason:** the diff wraps the apply form (CV upload, BL-005) and the contact lead form in new shells. It also touches the JobPosting JSON-LD and noindex flow for expired postings, swaps the shared `CategoryListTemplate` on `/tuyen-dung` for a page-specific layout, extends the shared type `PageBannerKey`, and changes the default of the shared `JobCard`. The form logic (`ApplyForm`, `CvPicker`, `LeadForm`, route handler) is NOT in the diff, so the security risk is low.

## Blast radius

`/tuyen-dung`, `/tuyen-dung/[slug]` (live and expired), `/lien-he`, `/chinh-sach-bao-mat`, `/dieu-khoan-su-dung`, `/dich-vu/[slug]` (+ `/en`). Shared code touched: `JobCard` (default `headingLevel` h2→h3; only JobListPage and JobDetail use it, both pass the level explicitly), `PageBannerKey` (+`"default"`, only a type), `icons.ts` (+EnvelopeSimple), i18n `page.careers|careerDetail|services|contact|legal`. Unchanged: API, schema, the lead/apply route, `generateMetadata` (noindex) and `buildJobPostingJsonLd`.

## Verify commands + result (run inside the worktree)

| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS — 0 errors, 2 old warnings in `tools/task-dashboard/server.mjs` (outside the diff) |
| `pnpm vitest run src` | PASS — 248 files / 2446 tests |
| Integration careers/apply, contact lead | skip. The diff does not touch `ApplyForm`/`CvPicker`/`LeadForm`/the API route, only the wrapping shell (same props: `jobPostingId`, `listPath`, `turnstileSiteKey`, `hotline`; `LeadForm source="contact"`). Skipped to avoid running on the shared DB. |

## Behaviour checks

- Apply form: `ApplyForm` props unchanged; `#apply-form` id kept; `ProjectStickyCta targetId=apply-form` kept below lg. Fallback email/hotline kept. The sticky right-column card goes through `DetailAsideFit` (measures `--detail-aside-h`), so the tall form is not clipped: OK. The 1440 screenshot shows the full form, submit button included.
- Expired posting: `Breadcrumb jsonLd={!view.expired}` kept, JSON-LD stays in page.tsx (not in the diff), no form or sticky bar, notice strip plus other-positions block: OK.
- One h1 (PageHero) on every page; heading levels h1→h2→h3 are consistent (JobCard h3 under the "Cơ hội nghề nghiệp" h2; NoJobsPanel h2→h3): OK.
- Nested links: JobCard's "Ứng tuyển" button is a `span aria-hidden` inside a single link, and a test asserts no `a`/`button` inside it: OK.
- No new hex values (only tokens). Section headings use `SectionHeading` (`items-start text-left`), none centred: OK.
- i18n: new keys exist in both vi and en: OK.
- Service page: no new LeadForm added; the CTA goes to `/lien-he?service=<slug>` (encodeURIComponent): OK. `loadHotline` try/catch protects `next build` when the DB is down: OK.

## Responsive Checklist Gate (375 / 768 / 1280, checked by CSS math plus builder screenshots)

| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | Builder measured scrollWidth = 390. Chips use `overflow-x-auto` + mask below sm; JobCard is a single column below md, `minmax(0,1fr)_auto` from md |
| Mobile-first / grid has no fixed columns | OK | `lg:grid-cols-[1fr_1.2fr]` (contact), `lg:grid-cols-[15rem_minmax(0,1fr)]` (legal); 1 column below lg |
| Container has no fixed px | **FAIL** | Careers perks strip: see MAJOR-1 (double gutter, misaligned with the heading and list, narrower on 375) |
| Typography rem/tokens | OK | text-h2/h3/h4/small tokens |
| Media | OK | PageHero/ResponsiveImage reused; map `aspectRatio="16/7"` |
| Touch ≥ 44px | OK | links/chips/tel use `min-h-11`; Button lg |
| Nav / table | N/A | no nav changes; RichText table already has a wrapper |
| 100vh / reduced-motion / overflow-hidden hiding bugs | OK | `100dvh` in DETAIL_ASIDE_CARD_CLASS (existing); no new animation |

## Skill gates

- aislop: skip, aislop not installed.
- oxlint (anti-slop): skip, oxlint not configured (no oxlint config in the repo). ESLint 0 errors.
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK, fewer than 3 indicators. Names are clear; no new function is over 50 lines except the existing page/component render functions (`JobListPage`, `JobDetail`) at about 75 JSX lines. Indicators: ChipRow duplication (MINOR-3), dead i18n keys (MINOR-2).
- ai-friendly-web: N/A (no change to robots/sitemap/llms).
- blitzstrike: skip, not installed and no permitted environment (no new input/auth surface).

## Findings

### [MAJOR-1] The "Vì sao chọn TAMI" perks strip is indented one extra gutter, out of line with its own SectionHeading and with the job list (layout defect, not verified in a browser)
- `src/components/careers/JobListPage.tsx` ~170–175: `<div className="mx-auto w-full max-w-container px-gutter pt-section-tight">` wraps `SectionHeading` + `<StrengthsBlock …/>`. `StrengthsBlock` (`src/components/home/StrengthsBlock.tsx:13`) already has its own `ul.mx-auto.w-full.max-w-container.px-gutter`, so the gutter is applied twice. Result: the perk items start one `gutter` to the right of the heading "Môi trường làm việc" and of the job cards below. On 375 the strip loses an extra 2×gutter of width. It is a full-width `section.bg-bg` inside the padded div.
- The builder did not see it because the dev DB has no `careersPerks` ("chưa thấy ảnh"). The test only checks that the heading exists, not the alignment. T08 seeds this data, so it will show up on the real page.
- Fix: put only `SectionHeading` inside the container div (`mx-auto max-w-container px-gutter pt-section-tight`) and render `StrengthsBlock` as a sibling outside it (it carries its own container). Alternatively, give StrengthsBlock an option to drop the container. Add a test or a screenshot with perks present (mock data) to confirm the left edge matches.

### [MINOR-1] The perks region uses the homepage's aria-label
- `StrengthsBlock` takes its `aria-label` from `page.home.strengths.region`, while `page.careers.perksRegion` was added (`src/i18n/messages/vi.json:662`, `en.json:662`) but is never used. The region is mislabelled in the careers context. Fix: add an optional `label` prop to `StrengthsBlock` (default = the home key) and pass `t("perksRegion")`, or remove the dead key.

### [MINOR-2] Dead i18n keys
- `page.legal.sectionLabel` and `page.careers.perksRegion` were added but are unused. `page.services.ctaTitle`/`ctaDescription` are no longer used (the builder noted this). Remove them or leave a note for T08 to clean up.

### [MINOR-3] ChipRow copies CategoryListTemplate's chip markup and classes
- `JobListPage.tsx` ~76 `ChipRow` copies `CHIP_SCROLL_CLASS` and the chip classes from `src/components/templates/CategoryListTemplate.tsx:62-111` verbatim, so the two can drift apart. This is understandable because T03/T06 own the template in parallel. Suggest a follow-up task to export a shared `CategoryChipRow` from the template.

### [INFO]
- JobCard: "Ứng tuyển" goes to the detail page, not `#apply-form` as Scope §1 says. This is a deviation the builder documented (whole card is one link per BL-034, no nested link). Acceptable.
- Careers 1440 screenshot: there is a light background strip of about 50px between ConsultBanner and the footer. It probably comes from the shared layout/ConsultBanner (T01), outside this diff. Suggest checking in T01/T08.
- Breadcrumb overlay overlapping the eyebrow at 390 → belongs to T03 (as agreed).

## Residual risk
- Legal/Service pages not viewed in a browser (no data); judged from code and tests.
- The perks strip was not viewed in a browser (no data); MAJOR-1 comes from CSS math.

## Verdict: FAIL

1 MAJOR (MAJOR-1) plus a FAIL item in the Responsive Gate. Fix MAJOR-1 (and ideally MINOR-1/2 at the same time), then rerun review round 2.
