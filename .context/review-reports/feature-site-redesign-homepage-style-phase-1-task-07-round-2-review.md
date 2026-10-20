Agent: reviewer

# Review: feature-site-redesign-homepage-style · phase-1-task-07 · round 2

- Worktree: `D:/prj/bds/.claude/worktrees/agent-aab0e1eb8a43611c8` (branch `worktree-agent-aab0e1eb8a43611c8`, base ffc31b8, changes not committed). `src/payload-types.ts` and `importMap.js` were ignored.
- Task: `tasks/feature-site-redesign-homepage-style/phase-1-task-07.md`. Round 1: `...-task-07-round-1-review.md` (FAIL: MAJOR-1, MINOR-1/2/3).

## Review level: STRICT
**Reason:** same as round 1. The diff wraps the apply-CV form and the contact lead form in new shells. It also touches the expired-posting flow (noindex/JSON-LD), the shared component `StrengthsBlock` (new prop), shared `JobCard`, shared `PageBannerKey`, `icons.ts`, and vi/en i18n. On top of that, this work has to merge onto staging, which has moved ahead (T04 + T06).

## Blast radius
`/tuyen-dung`, `/tuyen-dung/[slug]`, `/lien-he`, `/chinh-sach-bao-mat`, `/dieu-khoan-su-dung`, `/dich-vu/[slug]` (+ `/en`). Shared code:
- `StrengthsBlock` gets an optional `label` prop that defaults to the old `page.home.strengths.region`. The homepage is unaffected, and the home tests still pass.
- `JobCard`, `PageBannerKey` and `icons.ts` (+EnvelopeSimple) are unchanged since round 1.

There is no change to the API, schema, the lead/apply route, `generateMetadata` or the JSON-LD.

## Verify commands + result (run in the worktree)
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (tsc --noEmit, no errors) |
| `pnpm lint` | PASS: 0 errors. The 2 old warnings in `tools/task-dashboard/server.mjs` are outside the diff |
| `pnpm vitest run src` | PASS: 2446/2446 tests |
| Integration apply/lead | skip. The form logic and route are not in the diff (same reason as round 1) |

## Round 1 findings, checked one by one
| Finding | Status | Evidence |
|---|---|---|
| MAJOR-1: double gutter on the perks strip | **FIXED** | `JobListPage.tsx` ~171–178: only `SectionHeading` sits inside `div.mx-auto.max-w-container.px-gutter`; `StrengthsBlock` is now a sibling outside that frame, so it uses only its own `ul.max-w-container.px-gutter`. The left edges of the heading and the perk list line up (same max-w-container + px-gutter). The new test (`JobListPage.test.tsx`, "có careersPerks…") mocks perks with ≥ 2 items and asserts: list has `max-w-container px-gutter`, the region's parent does NOT have `px-gutter`, and the heading frame has `max-w-container px-gutter`. This is a regression guard with real data. |
| MINOR-1: aria-label of the perks region | **FIXED** | `StrengthsBlock` takes `label?: string` (`label ?? t("region")`); JobListPage passes `t("perksRegion")`. The test finds `region` by the name "Môi trường làm việc". |
| MINOR-2: dead i18n keys | **FIXED** | `services.ctaTitle/ctaDescription` were removed (vi + en). Every new key is used: `perksRegion` (JobListPage:177), `careerDetail.sectionLabel` (JobDetail:150), `applyCta` (JobCard:55), `services.eyebrow/detailTitle/adviceTitle` (dich-vu page:133,149), `contact.office*` (lien-he:91). vi and en have the same set of keys. |
| MINOR-3: ChipRow duplicates CategoryListTemplate | Deferred (accepted in round 1) | Suggest a follow-up task to export a shared `CategoryChipRow` once T03/T06 are stable. Not blocking. |

## Merge risk with staging (ffc31b8..staging = T04 + T06)
- **DetailLayout:** staging adds `sectionStyle?: "single" | "cards"` with default `"single"`. That branch keeps the exact old DOM/class (`rounded-[28px] bg-surface p-5 md:p-8 xl:p-10`). T07 (JobDetail, service page) does not pass `sectionStyle` → **no behaviour change**. `DetailSection` gets an optional `eyebrow` and a `group-data-[section-style=cards]` variant that only applies under `cards`. No impact on T07.
- **vi/en.json:** staging's hunks are at lines ≤ ~546 (home/projects/news); T07's hunks are at ≥ 658 (careers, careerDetail, services, contact, legal). They do not overlap textually, so there is a low chance of a conflict. Re-check that the JSON is valid after the merge.
- **icons.ts, StrengthsBlock, careers/legal/contact, dich-vu/lien-he/tuyen-dung pages, page-banner.ts:** staging does not touch these (`git diff ffc31b8 staging --stat` on these paths is empty) → no conflict.
- After merging into the integration branch, run typecheck + vitest again (standard dispatcher step).

## Responsive Checklist Gate (375 / 768 / 1280, CSS math + tests)
| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | The perks strip no longer has the double gutter. Chips use `overflow-x-auto` + a mask below sm. JobCard is 1 column below md |
| Mobile-first / grid has no fixed columns | OK | StrengthsBlock `grid-cols-1 md:2 lg:4`; contact `lg:grid-cols-[1fr_1.2fr]`; legal `lg:grid-cols-[15rem_minmax(0,1fr)]` |
| Container has no fixed px | OK (was FAIL in round 1) | Exactly one `max-w-container px-gutter` layer for each of the heading and the perk list; covered by a test |
| Typography rem/tokens | OK | text-h*/small tokens |
| Media | OK | PageHero/ResponsiveImage reused; map `aspectRatio` |
| Touch ≥ 44px | OK | `min-h-11` on chips/links |
| Nav / table | N/A | No nav changes; RichText table already has a wrapper |
| 100vh / reduced-motion / overflow-hidden | OK | No new animation; dvh lives in the existing DETAIL_ASIDE_CARD_CLASS |

## Skill gates
- aislop: skip, aislop not installed.
- oxlint (anti-slop): skip, oxlint not configured. ESLint 0 errors.
- ocr: skip, ocr not installed.
- AI-readable: OK, fewer than 3 indicators (the dead keys are gone; only the ChipRow duplication remains, already deferred).
- ai-friendly-web: N/A (no change to robots/sitemap/llms).
- blitzstrike: skip, not installed and no new input/auth surface.

## Findings
- No new CRITICAL or MAJOR.
- [MINOR-3] (carried over) ChipRow duplicates the chip markup in `CategoryListTemplate.tsx`. Suggest a follow-up task.
- [INFO] The breadcrumb overlay overlapping the eyebrow at 390 belongs to T03 and is not counted. The light strip before the footer on the 1440 screenshot probably comes from ConsultBanner/layout (T01/T08).

## Residual risk
- The perks strip was not viewed in a browser (dev DB has no `careersPerks` data until T08 seeds it); the alignment is confirmed by CSS math plus a class-structure test.
- Legal/Service pages are still judged from code and tests only (no data).
- vi/en.json after merge: low chance of a conflict, but the JSON must be re-checked during the integration merge.

## Verdict: PASS
