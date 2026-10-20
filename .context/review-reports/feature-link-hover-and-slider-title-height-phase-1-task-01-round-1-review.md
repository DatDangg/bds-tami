Agent: reviewer

# Review — feature-link-hover-and-slider-title-height · phase-1-task-01 · round 1 (BL-037)

- Review level: **STRICT** (light scope)
- Reason: diff touches shared UI primitives (`Button` variant `ghost`, `Breadcrumb` `LINK_CLASS`), which counts as "shared component" under AGENTS.md reviewer rules. Changes are class-only (no logic/API/schema), so depth was kept proportional.
- Blast radius: Breadcrumb on CategoryListTemplate, lien-he, RentalListPage, dich-vu/[slug], LegalPage (all light pages, no `className`/on-dark override); ghost Button in FeaturedProjects ("Xem tất cả", `bg-bg-alt`) and EmptyState ("Nhận tư vấn", page bg); NewsHomeBody "Xem thêm"; category link on tin-tuc/[slug] and PostDetail; JobDetail expired box link; ProjectsSlider h3.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/components src/app` | PASS — 972/972 tests (includes 2 new BL-037 tests) |
| `pnpm typecheck` | PASS (tsc --noEmit, no output) |
| `pnpm lint` | PASS — 0 errors, 2 pre-existing warnings in `tools/task-dashboard/server.mjs` (outside diff) |

## Acceptance check
| Criterion | Result | Evidence |
|---|---|---|
| Breadcrumb hover: no underline, `accent-text`; focus visible | OK | `Breadcrumb.tsx:17` → `transition-colors hover:text-accent-text`; global `:focus-visible` outline at `globals.css:353` still applies |
| Ghost / NewsHomeBody / category links / JobDetail: no underline on hover, colors as in the task table | OK | `button.tsx:21`, `NewsHomeBody.tsx:21`, `tin-tuc/[slug]/page.tsx:144`, `PostDetail.tsx:46`, `JobDetail.tsx:75` |
| Dark block uses the light variant | OK | `.theme-dark-block` remaps `--color-accent-text` → `--color-on-dark-accent` (#e0bf89) at `globals.css:228`; `--color-text` → on-dark |
| RichText links unchanged | OK | `RichText.tsx` not in the diff |
| Slider h3 reserves 2 lines | OK | `ProjectsSlider.tsx:91` `line-clamp-2 min-h-[2lh]`; test asserts both classes |

## Contrast verification (recomputed by reviewer, WCAG relative luminance)
- #8C6733 (L≈0.155) on #FBF1E0 (L≈0.888) = **4.57:1**. Builder's claim is correct and meets AA 4.5.
- #8C6733 on #FAF8F6 (bg-alt, FeaturedProjects) ≈ 4.83:1; on #F7F5F4 (bg) ≈ 4.7:1; on white ≈ 5.1:1. All pass AA.
- Links that were already accent now hover to `--color-text` #141414: high contrast.

## Ghost consumers
- FeaturedProjects: `bg-bg-alt` with text-text → hover accent 4.83:1. OK.
- EmptyState: page bg → hover accent ≥4.7:1. OK. Ghost has no underline at rest, but it is uppercase pill button styling and the color change is enough of a hover signal.
- The Button base already has `transition-colors duration-(--duration-fast)` (`button.tsx:8`), so dropping `underline-offset-4` is clean.

## `min-h-[2lh]`
- Tailwind v4.3 (`package.json:65`) arbitrary value emits `min-height: 2lh`. That is valid CSS.
- The `lh` unit works in Chrome/Edge 109+, Safari 16.4+ and Firefox 120+. In older browsers the declaration is dropped, which only loses the 2-line reservation. That is graceful degradation.
- `lh` resolves against the h3's own computed line-height (`text-h3`), so 2lh = exactly two clamped lines. It works with `-webkit-box` + `overflow:hidden` from `line-clamp-2`.
- The glass panel is anchored to the bottom (`absolute bottom-3`) and grows upward by at most one extra line. The h3 has no fixed px height.

## Responsive Checklist Gate (diff touches UI; CSS reasoning, no browser)
| Item | Result | Evidence |
|---|---|---|
| Layout / no horizontal scroll | OK | Only color/underline classes plus a min-height in the vertical axis; nothing affects width at 375/768/1280 |
| Mobile-first / no fixed px container | OK / N/A | No new media queries or containers |
| Typography rem / fluid heading | N/A | Font sizes unchanged (`text-h3` token) |
| Spacing scale | OK | `2lh` is relative to the type scale, not px |
| Media | N/A | No image changes |
| Touch target ≥44px | OK | Links keep `min-h-11`; ghost Button keeps size md 44px |
| Nav/table mobile | N/A | No changes |
| 100vh / reduced-motion | OK | No vh. `transition-colors` uses the token duration, and `prefers-reduced-motion` is handled globally (existing). Color-only transition, no motion |
| No overflow:hidden masking | OK | `overflow:hidden` comes from the existing line-clamp, not introduced to hide overflow |

## Skill gates
- aislop: skip. The command is not in the reviewer's allowed verify commands (class-only diff, low slop surface).
- oxlint (anti-slop): skip, oxlint not configured. `pnpm lint` (eslint) shows 0 errors.
- open-code-review (ocr): skip, ocr not installed / not in allowed commands.
- AI-readable: OK. No new functions, names or indirection; 0 indicators.
- ai-friendly-web: N/A (styling change only, no routes/robots/sitemap impact).
- blitzstrike: N/A (no auth/input/API surface).

## Findings
- [MINOR] `src/components/careers/JobDetail.tsx:75`: the rest color comes from the box's `text-warning` (#8A5A0A) and the hover color is accent #8C6733. The two are almost the same, so the hover signal is effectively just the underline disappearing. That still satisfies the request (no underline on hover), but if a stronger cue is wanted, use `hover:text-text`. No change required.
- [MINOR] Residual (already listed by the builder): slider cards with no location/stats still render a shorter glass panel. That is out of scope.
- [MINOR] Out of scope, suggest a separate task: Footer, TableOfContents, NewsToc, LanguageSwitcher and not-found still use `hover:underline`. The task explicitly excludes them, so this is not counted.

No CRITICAL or MAJOR findings.

## Residual risk
- No browser verification was done at 375/768/1280. The responsive gate result comes from CSS reasoning only.
- Doc impact (`.context/design-spec.md` hover rule plus S01 slider title) is deferred to spec-publisher per the task.

## Verdict: ✅ PASS
