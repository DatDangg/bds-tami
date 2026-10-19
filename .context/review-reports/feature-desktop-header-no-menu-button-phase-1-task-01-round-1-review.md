Agent: reviewer

> Ghi bởi primary (change-request): hook guard chặn reviewer Write vào path worktree `.claude/worktrees/...`; nội dung dưới là report nguyên văn của reviewer.

# Review: feature-desktop-header-no-menu-button, phase-1-task-01, round 1

- **Task:** `tasks/feature-desktop-header-no-menu-button/phase-1-task-01.md`
- **Change doc:** `spec/changes/2026-10-19-desktop-header-no-menu-button.md` (BL-019)
- **Diff reviewed:** `src/components/layout/MobileMenu.tsx`, `src/components/layout/Header.tsx` (JSDoc only), `src/components/layout/Header.test.tsx`, `docs/DESIGN.md`, `.context/design-spec.md` §2.1/§2.2.
- **Ignored as instructed:** `src/payload-types.ts` (line endings only).

## Review level: NORMAL
**Reason:**
- Shared layout component on every public page; changes a11y behaviour (focus, scroll lock).
- No schema, API, auth, tenant or data risk.
- HeaderFrame and DesktopNav untouched; class changes only affect the Menu trigger → STRICT not needed.

## Blast radius
- Every public page header (VI/EN). Below xl: Menu trigger as before. At xl and above: trigger hidden, full-screen menu cannot be opened.
- New import: `MobileMenu` uses existing `useMediaQuery` from `@/components/home/use-environment` (already used by `FooterLinkColumn`, unchanged).
- No API, schema or CMS impact. Doc edits made by change-request per change doc.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm vitest run src/components/layout` | PASS, 15 files / 97 tests |
| `pnpm test` (full suite) | Skipped: integration tests need migrated DB + SeaweedFS not set up in this worktree |
| Visual check 1280 / 1024 / 375 | Skipped: no dev server; checked by reasoning from CSS classes |

## Acceptance coverage
1. **≥ xl no Menu button, no hidden focusable element: OK.** Trigger `xl:hidden` (`MobileMenu.tsx:46`) → `display:none`, out of Tab order + a11y tree. Closed dialog renders no portal content. Header: logo, nav, search, VI|EN, CTA (`Header.tsx:47-75`).
2. **< xl unchanged: OK.** Trigger only gained `xl:hidden`; removed xl/2xl label classes had no effect below xl. Dialog content/accordion/contact untouched; `MobileMenu.test.tsx` passes.
3. **Widening to xl closes menu + releases scroll lock: OK.** `if (isDesktop && open) setOpen(false)` (`MobileMenu.tsx:41`) is React's documented "adjust state while rendering" pattern, own state only, terminates after one extra render. Narrowing does not reopen. Lint (react-hooks) passes. SSR/hydration: hook returns `false` on server, `open` starts `false`, hiding via CSS → no mismatch/flash. Test `Header.test.tsx:225-255` checks dialog closes and `data-scroll-locked` removed; restores `matchMedia` in `finally`.
4. **Tab order ≥ xl: OK.** DOM order logo → nav → search → language → CTA; hidden trigger skipped. JSDoc updated.
5. **Single row at 1280px VI/EN: OK by reasoning, not measured.** Previous xl row already held logo (≤ 6rem), nav, search, VI|EN, CTA (≤ 10rem truncate), icon-only trigger (44px + 8px gap). Removing the trigger frees ~52px; no other class changed → strictly more room than the layout measured at 1265px EN (`Header.tsx:48` comment).
6. **Docs: OK.** `docs/DESIGN.md:235-236` and design-spec §2.1 describe < xl and ≥ xl separately; §2.2 marks full-screen menu "Chỉ < xl" + auto-close on resize. Match change doc and code.
7. **Tests: OK.** Trigger `xl:hidden` asserted; new matchMedia-change close test; old test updated.

## Responsive Checklist Gate
| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll 375 / 768 / 1280 | OK (CSS reasoning) | Only removes an element at ≥ xl |
| Mobile-first `min-width` | OK | `xl:hidden`; `XL_QUERY = (min-width: 1280px)` matches Tailwind `xl` |
| Grid / container | N/A | Not touched |
| Font rem / spacing | N/A | Not touched |
| Media | N/A | Not touched |
| Touch target ≥ 44px | OK | Trigger keeps `min-h-11 min-w-11` below xl |
| Mobile nav | OK | Hamburger unchanged < xl; ≥ xl horizontal nav only |
| Table / 100vh / reduced-motion | N/A | Not touched |

## Skill gates
| Gate | Result | Note |
|---|---|---|
| aislop | Skipped | Not in allowed verify commands |
| oxlint (anti-slop) | Skipped | No `.oxlintrc*`; ESLint passed |
| ocr | Skipped | Not installed/allowed |
| AI-readable | OK | Clear names (`XL_QUERY`, `isDesktop`), documented constant, 0 indicators |
| ai-friendly-web | N/A | Header layout only |
| blitzstrike | N/A | Not STRICT |

## Findings
**CRITICAL:** none.
**MAJOR:** none.
**MINOR:**
1. Outdated comment `src/components/layout/Header.tsx:66-68` says the full-screen menu still shows the full CTA label — no longer true at ≥ xl (full text via `title`; SR unaffected). Fix: reword "only below xl". Optional later: loosen CTA `max-w-[10rem]` at xl (~52px freed).
2. Focus after auto-close at ≥ xl: Radix returns focus to the now `display:none` trigger → focus lands on `body`. Edge case (resize with menu open), acceptable. Optional: `onCloseAutoFocus` → logo link.

## Residual risk
- 1280px VI/EN row not measured in a browser (class analysis shows strictly more space).
- Full `pnpm test` integration suite not run (needs DB); change touches no server/DB code.

## Verdict: PASS
