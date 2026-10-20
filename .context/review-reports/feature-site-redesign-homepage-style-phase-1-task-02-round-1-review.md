Agent: reviewer

# Review: feature-site-redesign-homepage-style, phase-1-task-02, round 1 (BL-045)

- Worktree: `D:/prj/bds/.claude/worktrees/agent-aa013cc3614d8cae7` (branch `worktree-agent-aa013cc3614d8cae7`, nothing committed yet)
- Review level: **STRICT**
- Reason: the diff changes shared components used by many pages (`ProjectCard`, `RentalCard`, `NewsCard`, `PostCard`, `use-snap-slider`, plus the new `layout/CardSlider` and `layout/card-parts`). The project's rules say that alone requires STRICT.
- Blast radius: home page (Featured Projects, Rentals, News, Offers), `/du-an`, `/cho-thue` and its categories, `/tin-tuc`, `/tin-bds`, and the "related" blocks on detail pages (Dự án khác, Căn tương tự, Tin liên quan). It also touches `src/i18n/messages/{vi,en}.json` (one new key, `page.rentals.card.available`).

## Verify commands and results (run with cwd = worktree)

| Command | Result |
|---|---|
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS: 0 errors, 2 warnings that were already there (`tools/task-dashboard/server.mjs`) |
| `pnpm test` (full suite, run twice) | **FAIL (ELIFECYCLE)**. The log is mostly `revalidatePath` invariant noise and a DB `Failed query` from integration tests. I could not pin down which file failed. It is probably DB contention from T00/T01 running in parallel, but I did not confirm this. See Residual risk. |
| `pnpm vitest run src/components` | 92/93 files, 885/886 tests. One failure in `layout/Header.test.tsx` (MobileMenu focus trap). The diff does not touch that file, so it looks flaky under load. |

## Responsive Checklist Gate (the diff touches UI)

| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK (CSS math) | `CardSlider` uses `-mx-2 px-2` inside `px-gutter` of `max-w-container`, and the section has `overflow-hidden`. The scroll stays inside the `ul`. |
| Mobile-first / grid / container | OK | Slide widths: `w-[82%]` up to `sm`, then `calc((100%-1.5rem)/2)`, then `lg:calc((100%-4.5rem)/4)`. Percentages resolve against the `ul` content box, so this matches `.slider` in the mockup. Card grids are unchanged. |
| Typography rem / tokens | OK | Uses tokens `text-h4`, `text-body`, `text-small`, `text-xsmall`. No new hex or px font sizes. |
| Media | OK | Images use `aspect-[11/10]` with `ResponsiveImage` and `sizes`. `ProjectsSlider` passes its own `IMAGE_SIZES`. |
| Touch target ≥ 44px | OK | Each whole card is one link (`min-h-11`). Dots are `size-11`. `SliderArrow` is 44px from md up. The `CardArrow` (size-9) is decorative and `aria-hidden`. |
| Nav / table | N/A | Not in this diff. |
| 100vh / reduced-motion / overflow-hidden | OK | Image zoom and scroll both have `motion-reduce:*`. No `100vh`. |
| Slider pagination (dots = real positions, BL-038) | **FAIL** | See finding C2. The builder's 1440 screenshot shows 6 dots with 4 cards visible, but only 3 positions can actually be reached. |

## Skill gates

- aislop: skip. Bash is limited to verify commands, so I could not run it.
- oxlint (anti-slop): skip. I could not confirm an oxlint config: Glob timed out and I did not retry, per Tool Loop Guard. `pnpm lint` (eslint) reports 0 errors.
- ocr: skip, ocr not installed / not in the allowed commands.
- AI-readable: OK, 1 indicator (MINOR m3: `CardSlider` in `layout/` imports a hook from `home/`). New functions are under 50 lines and files under 300 lines.
- ai-friendly-web: N/A. Changing a card component does not touch `robots`/`sitemap`/`llms`.
- blitzstrike: N/A. No auth, input or API in this diff.

## Findings

### [CRITICAL] C1: The worktree is based on an old commit; the diff is not built on the current staging
- Evidence: `git log` in the worktree shows HEAD = `3b0a347` (BL-036), but staging is at `9e96cbf`. The worktree is **11 commits behind** staging, including BL-038 `403cf66`, BL-037 `1d10407` and all of BL-044 (`aa5a178`…`b4ffc99`).
- Consequences:
  - The claim "HEAD has no `Heart`, nothing to remove" is wrong for staging. `git grep Heart 9e96cbf` finds `src/components/home/ProjectsSlider.tsx:5,69` and `src/components/icons.ts:20` (the decorative heart from BL-044). The first acceptance criterion ("no heart icon anywhere, grep = 0") has **not actually been done** on the real code.
  - On staging, `ProjectsSlider.tsx`, `use-snap-slider.tsx` (+85 lines from BL-038: `pageCount`, scroll-offset measurement, `scrollByPage`), `FeaturedProjects.tsx` (BL-044 eyebrow/description, "Xem tất cả dự án →"), `icons.ts` and `vi.json` (+51 lines) all differ from the worktree base. Merging will conflict, or worse, silently overwrite BL-038/BL-044.
  - The test changes (`ProjectsSlider.test.tsx`) were written against the old glass/stats version, not the white card + heart test on staging.
- Fix: rebase or rebuild the task on `9e96cbf` (current staging). Remove `Heart` and `data-testid="project-heart"` from staging's `ProjectsSlider`, and remove `Heart` from `icons.ts`. Keep the BL-044 parts of `FeaturedProjects` (eyebrow, description, CTA), the BL-037 `min-h-[2lh]`, and the BL-038 hook. Then retake the screenshots.

### [MAJOR] C2: `CardSlider` / `useSnapSlider` bring back the BL-038 bug (dots do not match real positions)
- `src/components/layout/CardSlider.tsx:836-857`: it renders `count` dots, one per card, and uses `count > 1`. Staging uses `pageCount`, which counts only positions that can actually be scrolled to.
- `src/components/home/use-snap-slider.tsx:19-31` (worktree): `current` comes from IntersectionObserver and is "the first visible card". The builder notes that "the last dot never lights up" and accepts it, but that is exactly the bug BL-038 fixed. The 1440 screenshot (`site-redesign-t02-home-projects-1440.jpg`) shows 6 dots / 4 cards / 3 real positions. Clicking dots 4–6 has no correct effect.
- This contradicts the task's own scope item 5 ("BL-038 dot = real position").
- Fix: after the rebase, have `CardSlider` use the staging hook (`pageCount`, `current`, `scrollToSlide`). Render `pageCount` dots, and show the dots and arrows only when `pageCount > 1`. Drop the IntersectionObserver change. Add a test for "4 visible / 6 cards → 3 dots".

### [MINOR]
- m1: `src/components/rentals/RentalCard.tsx:707-730`: the field order differs from the mockup `data-cards="rent"` (`index.html:657`), which is title → pin → specs → footer (**price** + arrow). The code has title → price → specs → footer (pin + arrow). The task text describes this order, but the acceptance criterion requires "matches data-cards=rent", and the "Deviations from mockup" section does not record it. Either follow the mockup or record the reason.
- m2: `src/components/news/NewsCard.tsx:52,56`: the boxed variant does not reuse `CARD_LINK_CLASS` / `CARD_IMAGE_ZOOM` from `card-parts`. The card shell class string is duplicated (small DRY issue).
- m3: `src/components/layout/CardSlider.tsx:775` imports `useSnapSlider` / `SliderArrow` from `@/components/home/`. A shared `layout` component now depends on a `home` module. Moving the hook to `layout/` would fit better, and this can be done during the rebase.
- m4: The mockup card arrow uses `round gold`, while the code uses `bg-primary-soft` (as the task says). The mockup news card puts the category badge on the image; the code puts an eyebrow below it (this one is recorded). Neither blocks the verdict.

## Residual risk
- The full `pnpm test` run failed and I could not see which file. The builder reported 2325/2325 passing with `pnpm vitest run src`. After the rebase, rerun the full suite in isolation (no parallel worktree using the same DB).
- I had no browser, so the 375/768 checks were done by CSS math only. The screenshots were taken from the stale base and need retaking after the rebase.

## Verdict: FAIL

Must fix before round 2:
1. C1: rebase onto `9e96cbf` and actually remove the heart on staging's code, keeping BL-037/038/044.
2. C2: make the shared slider use `pageCount` (BL-038) and add a test for multiple cards visible at once.
