Agent: reviewer

# Review: feature-homepage-partners-block, phase-1-task-01, round 1 (BL-107, FR-PUB-17, attempt 2)

- Review level: **STRICT**
- Reason: new revalidate hook on the `developers` collection (cache/ISR of the shared homepage), shared view model `src/lib/home/home-view.ts` + `HomeDocs` contract, public query, a11y of an auto-moving animation (WCAG 2.2.2 / 2.4.7).
- Blast radius: homepage `/vi`, `/en` (view model, `loadHomeDocs`, `load-home` fallback docs, `HomeBlocks`); every write to `developers` (admin, seed, scripts, translate job) now runs the afterChange/afterDelete hook; `globals.css` `@theme static` (new keyframes + one theme var); i18n `page.home.partners.*`.
- Scope reviewed: only the files listed in the task (working tree has ~255 other dirty files, out of scope).

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS (tsc --noEmit, no output) |
| `npx eslint` on the changed files (PartnersMarquee*, home-view-partners, hooks/developers, home-view, home-queries, load-home, HomeBlocks, Developers.ts) | PASS (no output) |
| `pnpm vitest run src/lib/home src/components/home src/i18n src/hooks src/collections` | PASS, 53 files / 458 tests |
| Browser screenshots 390/768/1440, CLS | not run (no dev server/DB in reviewer permissions). Verified with CSS math instead. Gaps are listed under Residual risk. |

## What checks out
- BR-07 `/en`: `loadPartners` goes through `findPublicList` → `publicWhere("developers","en")` adds `hasEnglish = true` plus the soft-delete filter. There is no VI fallback, and a test covers it.
- Safe website links: `safeWebsite` trims the value and accepts only `http:`/`https:` through `new URL` (`isHttpUrl`), so `javascript:` is rejected. Links use `target="_blank" rel="noopener noreferrer"`.
- Each partner is read once: the duplicate `ul` has `aria-hidden` + `inert`, logos are `decorative` (alt=""), and the name is the accessible name. The test confirms 1 list, 1 link and 1 button.
- Pause/Play button: 44px (`size-11`), the label changes with state, it is hidden under `motion-reduce` and for ≤ 4 partners, and it sits outside `group/partners`.
- Seamless loop with 5–6 items at 1440 (N1): each copy is `min-w-[100vw] shrink-0 justify-around` with no gap between copies. The two copies have equal width L ≥ 100vw ≥ visible width, the track is `w-max` = 2L, and `translateX(-50%)` = L. The visible window is always covered, and the join spacing (half + half from `justify-around`) equals the spacing between items. OK.
- No CLS from the strip: the logo frame is a fixed `h-12 w-24`, motion uses `transform`, images are lazy. In running mode, page-level horizontal overflow is clipped by the `overflow-hidden` wrapper.
- Hook: it runs only when `doc.showAsPartner || previousDoc.showAsPartner` (afterChange) or `doc.showAsPartner` (afterDelete). Outside a Next context, `revalidateWithNext` catches the error and logs `warn`, so seed/script/Local API do not throw.
- Public query: `select` limits fields to name/logo/website/sortOrder, `limit` 24 (under `MAX_PAGE_SIZE` 50), and it runs only when `partners` is visible.
- RSC/client boundary: only `PartnersMarqueeShell` is a client component (button state). Lists are rendered on the server and passed as `children`.
- Title is centered (`SectionHeading` uses `text-center`). An empty title falls back to the i18n default. The block is hidden when there are no items.
- Files ≤ 300 lines, functions ≤ 50 lines.

## Findings

### [MAJOR] 1. The loop duration is always 40s: the per-element `--partners-marquee-duration` has no effect
- `src/app/(frontend)/globals.css:142` (inside `@theme static`, line 9): `--animate-partners-marquee: partners-marquee var(--partners-marquee-duration, 40s) linear infinite;`. This is declared on `:root`. Per the CSS Custom Properties spec, a custom property's computed value already has `var()` substituted where it is declared. At `:root`, `--partners-marquee-duration` is undefined, so the value resolves to `40s`, and descendants inherit that fixed string. The inline style `--partners-marquee-duration` in `PartnersMarqueeShell.tsx:30` never re-resolves it.
- Effect: the duration does not follow the item count. 5 partners at 1440 (copy ≈ 1440px) move at about 36px/s. 24 partners (copy ≈ 24 × ~290px ≈ 7000px) move at about 175px/s, which is too fast to read and contradicts `SECONDS_PER_ITEM`/`MIN_LOOP_SECONDS` (`PartnersMarquee.tsx:11-13`).
- The test `PartnersMarquee.test.tsx:72-78` only checks the inline variable, so it passes while the real behavior is wrong (false confidence).
- Fix: set the duration on the element itself, for example class `[animation-duration:var(--partners-marquee-duration)]` after `animate-partners-marquee`, or `style={{ animationDuration: \`${loopSeconds}s\` }}`. Alternatively move the theme var into `@theme inline` so Tailwind inlines it into the utility. Update the test to check the property that actually takes effect.

### [MAJOR] 2. Overflow at 390 in static mode (≤ 4 partners) and reduced-motion mode when a partner name is long
- `PartnersMarquee.tsx:31`: the name has `whitespace-nowrap`; `:54` `li` has `shrink-0` + `px-6`; `:27` logo is `w-24 shrink-0` + `gap-3`.
- At 390: the inner width is about 390 − 2×gutter ≈ 350px. Subtract li padding 48, logo 96 and gap 12, and about 190px is left for the name, roughly 22 characters of 16px semibold Vietnamese. `nameField()` has no `maxLength`, and real developer names often run longer, for example "Công ty CP Tập đoàn Đất Xanh" at 28 characters.
- Static mode (`:48`): there is no clip wrapper, and `src/app/(frontend)` has no `overflow-x` clip on body (grep found none), so the page scrolls horizontally. This violates the spec "không tràn ngang trang" (no horizontal page overflow).
- Reduced-motion mode: the `overflow-hidden` wrapper (`PartnersMarqueeShell.tsx:27`) cuts the name off, which hides the bug with overflow:hidden and breaks "vẫn đọc được hết" (everything must stay readable).
- Fix: keep `whitespace-nowrap` only for the running loop. For static and `motion-reduce`, let names wrap: `li` with `max-w-full min-w-0`, the name with `min-w-0 break-words` or `whitespace-normal`, for example `motion-reduce:whitespace-normal` and no nowrap in static mode. Add a test or class assertion for long names.

### [MAJOR] 3. Keyboard focus can land on a partner link that is off screen (WCAG 2.4.7 / 2.4.11)
- `PartnersMarqueeShell.tsx:31`: on `focus-within` the strip only pauses (`animation-play-state: paused`) at its current offset. Mid-cycle (offset −x with 0 < x ≤ L), the first items of the original list are translated off the left edge. What the user sees in their place is the duplicate copy, which is `inert`.
- Pressing Tab moves focus to the original link, which is off screen to the left (overflow-hidden cannot scroll to a negative offset). Its focus ring is invisible, and the visible copy with the same name gets no focus.
- The task requires "focus pause" so keyboard users can stop the strip and operate it. In practice, sighted keyboard users lose track of focus.
- Fix (pick one): on `focus-within`, reset the strip to its origin (`group-focus-within/partners:animate-none` → transform 0, so every original link is in the copy starting at 0 and can be brought into view by scrolling the overflow container). Or call `scrollIntoView({ inline: "nearest" })` / reset the offset in the shell `onFocus`. Add a test or document the residual.

### [MINOR] 4. Replacing or editing a logo in `media` does not revalidate the homepage
- `src/hooks/developers/revalidate-developer.ts` handles only `developers`. If an admin swaps the media file or the alt text without saving the developer, the update waits for ISR (60s). Acceptable as a safety net; record it in Doc impact/residual.

### [MINOR] 5. `select.sortOrder` is not used by `PartnerDoc`
- `src/lib/home/home-queries.ts:127`: sorting happens in the database, so selecting `sortOrder` is unnecessary. Either remove it or keep it and add a comment.

## Responsive Checklist Gate (diff touches UI; widths 375/390, 768, 1280/1440)
| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | **FAIL** | Finding 2: static/reduced-motion with long names overflows at 390. Running mode is clipped by the `overflow-hidden` wrapper (OK). |
| Mobile-first, no fixed px container | OK | `max-w-container px-gutter`; `sm:px-8` uses min-width. |
| Grid auto-fit/minmax | N/A | flex-wrap, not a grid. |
| Font-size in rem, fluid heading | OK | `text-base`; heading via shared `SectionHeading`. |
| Media max-width/aspect-ratio | OK | fixed 96×48 frame, `fit="contain"`, `sizes="96px"`, lazy. |
| Touch target ≥ 44px | OK | button `size-11` (44px). Partner links are 48px tall (logo frame), name-only links are about 24px high but wide. Acceptable for an inline link list. |
| Nav/table | N/A | |
| 100vh | OK | not used (`100vw` only as a width floor inside the clip wrapper). |
| prefers-reduced-motion | OK | `motion-reduce:animate-none`, duplicate hidden, button hidden, wrap. Combines with the readability issue in Finding 2. |
| Hiding bugs with overflow:hidden | **FAIL** | Finding 2 (reduced-motion cuts long names). |
| Seamless loop 5–6 items at 1440 (N1) | OK (CSS math) | see "What checks out". |

## Skill gates
- aislop: skip, not in the reviewer's allowed verify commands. Also, `--changes` on a working tree with ~255 out-of-scope dirty files would not isolate this task.
- oxlint (anti-slop): skip, oxlint not configured (no `.oxlintrc*`). eslint on the changed files is clean.
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK. Clear names, short functions, constants named (`SECONDS_PER_ITEM`, `MIN_LOOP_SECONDS`, `PARTNERS_STATIC_MAX`, `HOME_PARTNERS_MAX`), comments explain WHY. Doc impact is proposed in the task (`docs/**` dirty). Fewer than 3 indicators.
- ai-friendly-web: N/A, this is a homepage block and does not touch robots/sitemap/llms.
- blitzstrike: skip. No pentest environment; the link href is validated statically (http(s) only).

## Residual risk
- 390/768/1440 not checked visually, and CLS not measured with a browser. The conclusions above are CSS math.
- Mid-loop behavior after focus-driven scrolling of the overflow container (`scrollLeft` remains after blur) was not verified in a browser.

## Verdict: FAIL
3 MAJOR findings (1 animation duration ignored + false-confidence test, 2 overflow/clipping at 390 in static/reduced-motion, 3 focus on off-screen link). The Responsive gate has FAIL items. Return to builder.
