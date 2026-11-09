Agent: spec-validator

# Phase review: feature-homepage-partners-block, phase 1 (BL-107, FR-PUB-17), round 1

- Mode: **Phase review** (phase 1 ended; task 01 reviewer STRICT r3 PASS).
- Requirement source: `SPECIFICATIONS.md:152` § F1 "Đối tác (FR-PUB-17, BL-107 ...)" (working tree; delta validated r2 PASS, `.context/review-reports/spec-validation-feature-homepage-partners-block-round-2.md`).
- Task: `tasks/feature-homepage-partners-block/phase-1-task-01.md` (attempt 4).
- Review: `.context/review-reports/feature-homepage-partners-block-phase-1-task-01-round-3-review.md` (STRICT, PASS; typecheck, eslint and vitest PASS, 53 files / 459 tests).
- Method: Read/Grep of the code and tests. I did not re-run verify commands. I rely on the reviewer r3 results for those.

## Verdict: PASS (code coverage complete). Two close-out gaps are non-blocking but must be handled before commit (see Gaps)

Every point in the spec delta has code evidence, and most also have test evidence. What remains is real-browser verification (excluded from this scope by the request), doc reconcile of design-spec S01 / DESIGN.md, and a few small residuals already recorded.

## Coverage matrix

| # | Requirement (SPECIFICATIONS.md:152) | Code evidence | Test evidence | Status |
|---|---|---|---|---|
| 1 | `partners` block now has a UI (previously skipped) | `home-view.ts:25` `RENDERED_BLOCKS` includes `partners`; `home-view.ts:359-360` `toBlock` → `toPartnersBlock`; `HomeBlocks.tsx:33-34` renders `PartnersMarquee` | `HomeBlocks.test.tsx:351-372`; `home-view.test.ts:503-510` | ✅ |
| 2 | Source: `developers.showAsPartner = true`, sorted by `sortOrder` then name, max 24 | `home-queries.ts:24` `HOME_PARTNERS_MAX = 24`; `:121-126` `where showAsPartner`, `sort ["sortOrder","name"]`, `limit`. `findPublicList` clamps limit to `MAX_PAGE_SIZE = 50` (`pagination.ts:5,31`), so 24 is not cut. View keeps the query order (`home-view-partners.ts:33-40`) | `home-queries.test.ts:278-290`; `home-view.test.ts:503-507` (order kept) | ✅ |
| 3 | Position and on/off follow `blockOrder` / `partners.enabled` like other blocks | `load-home.ts:70` `visibleBlockKeys`; `home-queries.ts:208` only queries when visible | `home-view.test.ts:77-80, 512-517`; `home-queries.test.ts:273-276` | ✅ |
| 4 | Each item: logo (optimized image, uniform frame, aspect ratio kept) plus name; no logo → name only | `PartnersMarquee.tsx:9-10,26-34` fixed `h-12 w-24` frame, `ResponsiveImage fit="contain" sizes="96px"`; `home-view-partners.ts:37` `toPublicImage(renderableImage(...))` | `home-view.test.ts:519-523` (no logo / id-only logo → null; empty name → item dropped); `PartnersMarquee.test.tsx:83-94` | ✅ |
| 5 | Kept from S01: centered heading, grayscale + dimmed logo, color on hover/focus | `SectionHeading.tsx:18` (`items-center text-center`); `PartnersMarquee.tsx:27` `opacity-70 grayscale` + `group-hover/item` / `group-focus-within/item` | `PartnersMarquee.test.tsx:91-92` | ✅ |
| 6 | Items with a valid `website` link to a new tab with `rel="noopener noreferrer"` | `PartnersMarquee.tsx:59-63`; `home-view-partners.ts:27-31` `safeWebsite` (http(s) only, trim) | `PartnersMarquee.test.tsx:35-42`; `home-view.test.ts:533-544` (`javascript:` and non-URL values → null) | ✅ |
| 7 | Auto-scrolling horizontal strip (marquee) | `globals.css:141-148` keyframes `partners-marquee` translateX(-50%); `PartnersMarqueeShell.tsx:42-43` `animate-partners-marquee` + inline duration (`PartnersMarquee.tsx:84`) | `PartnersMarquee.test.tsx:47, 75-81` | ✅ (seamless look: browser-only) |
| 8 | Pause on hover or keyboard focus inside the strip | `PartnersMarqueeShell.tsx:43` `group-hover/partners:[animation-play-state:paused]`, `group-focus-within/partners:[...paused]`, `group-has-[:focus-visible]/partners:animate-none`; `:37` mask off on focus-visible | `PartnersMarquee.test.tsx:44-59` (class contract) | ✅ (real behavior: browser-only) |
| 9 | Visible Pause/Play button (like the hero, for touch screens, WCAG 2.2.2) | `PartnersMarqueeShell.tsx:25-34` 44px button (`size-11`), Pause/Play icons, label changes with state, outside `group/partners` | `PartnersMarquee.test.tsx:61-73` | ✅ |
| 10 | `prefers-reduced-motion: reduce`: no animation, static strip that wraps, no button, all items readable | `PartnersMarqueeShell.tsx:25` `motion-reduce:hidden` (button), `:43` `motion-reduce:animate-none`; `PartnersMarquee.tsx:53-54` original list `motion-reduce:flex-wrap`, duplicate `motion-reduce:hidden`; `:32` `motion-reduce:whitespace-normal` | `PartnersMarquee.test.tsx:44-59, 61-64, 118-131` | ✅ |
| 11 | ≤ 4 partners: no animation, static centered row | `PartnersMarquee.tsx:15,83,91-92` `PARTNERS_STATIC_MAX = 4`, `static` mode `justify-center flex-wrap`, no shell | `PartnersMarquee.test.tsx:106-116, 133-136` (exactly 5 → animates) | ✅ |
| 12 | Duplicate copy `aria-hidden` + `inert`; screen reader and Tab reach each partner once | `PartnersMarquee.tsx:49`; logo is `decorative` (alt="") so the name is not read twice (`:28`) | `PartnersMarquee.test.tsx:20-33, 54` (1 list, 1 link, 1 button, no `[tabindex]`) | ✅ |
| 13 | No partners → whole block hidden | `home-view-partners.ts:39` empty → `null` | `home-view.test.ts:51, 512-513`; `HomeBlocks.test.tsx:362` | ✅ |
| 14 | Heading `partners.title` (localized); empty → i18n default "Đối tác" / "Partners"; block not hidden for a missing title | `home-view.ts:22` `TITLE_OPTIONAL_BLOCKS` includes `partners`; `PartnersMarquee.tsx:89`; `vi.json:1061-1066`, `en.json:1061-1066` (`defaultTitle`, `region`, `pause`, `play`) | `home-view.test.ts:79, 525-531`; `PartnersMarquee.test.tsx:96-103`; `HomeBlocks.test.tsx:368-372` | ✅ |
| 15 | `/en` per BR-07: only partners with an EN version, no VI fallback | `home-queries.ts:117-122` `findPublicList(..., locale)` (`publicWhere` filters by locale, `public-queries.ts:79-81`); no `fallbackLocale` | `home-queries.test.ts:278-283` (locale `en` goes through `findPublicList`); `home-view.test.ts:546-550` | ✅ (the `publicWhere` EN filter comes from shared code, not a BL-107 test) |
| 16 | Saving or deleting a developer that is or was a partner refreshes `/` and `/en`; ISR is the safety net | `hooks/developers/revalidate-developer.ts:12-25` (afterChange when `doc` or `previousDoc` has `showAsPartner`; afterDelete); wired in `Developers.ts:20,39` | `revalidate-developer.test.ts:10-37` | ✅ |
| 17 | Responsive 390 / 768 / 1440, no horizontal page overflow | Static and reduced-motion wrap (`PartnersMarquee.tsx:52-53,58`, `min-w-0 [overflow-wrap:anywhere]`); running strip clipped by `overflow-hidden` (`PartnersMarqueeShell.tsx:37`) | `PartnersMarquee.test.tsx:118-131` (class contract only) | ⚠️ PARTIAL: no real browser measurement (excluded from this request) |
| 18 | No schema change (no migration), no API / permission change | `Developers.ts` only adds `hooks` (`:39`); fields `logo/website/showAsPartner/sortOrder` already existed; no new migration files in the task | — | ✅ |

## Gaps

- **[PARTIAL] Doc reconcile not done (as-built / design doc):** `.context/design-spec.md:276` still says "**chưa có giao diện**" (no UI yet), `:334` says "chưa dựng giao diện" (UI not built), and `:336` says "Không marquee" (no marquee) plus a logo-only 2/3/4/6-column grid (`:359-362`). This contradicts the spec delta, which explicitly says "Thay thiết kế khối 6 ... của design-spec S01" (replace the S01 block 6 design). `docs/DESIGN.md:322` does not describe the Partners block or the developers revalidate hook. The task deferred this to "Doc impact" because `docs/**` is dirty. Close-out must reconcile it (design-spec S01 block 6 + responsive table, DESIGN.md homepage, revalidate map) before commit, or record it in the gap register. Related task: phase-1-task-01 § Doc impact.
- **[PARTIAL] Real-browser verification (excluded per request, listed for completeness):** 390/768/1440, CLS, a seamless loop with 5-6 items at 1440, mouse click vs keyboard focus (`:focus-visible`), and no `bl107-*.png` captures. Task acceptance `phase-1-task-01.md:21,54,57`.
- **Accepted residuals (not spec gaps):** (a) changing a logo or alt in `media` does not revalidate the homepage, so ISR 60s applies. The spec only requires refresh on developer save/delete, so this is not a violation. (b) Reviewer r3 MINOR-1: `onBlur` resets `scrollLeft` when the window blurs (`PartnersMarqueeShell.tsx:15-18`). (c) The `/en` EN filter relies on shared `publicWhere`, and no BL-107 test hits the DB.

## Notes
- No requirement is MISSING. Requirements 1-16 and 18 have code evidence, and all except 18 also have unit tests.
- Report file name follows the path the caller gave (no `-round-<R>` suffix). This is round 1 of the phase review.
