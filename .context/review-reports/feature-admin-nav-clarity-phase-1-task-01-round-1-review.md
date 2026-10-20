Agent: reviewer

# Review — feature-admin-nav-clarity · phase-1-task-01 · round 1 (BL-041)

- Scope: uncommitted working-tree diff vs HEAD c19b459 (branch `claude/admin-bl039-043`). T01 files only: `src/components/admin/{admin-groups.ts,admin-groups.test.ts,NavAdvancedCollapse.tsx(+test),SiteLink.tsx(+test)}`, `styles/{_surfaces.scss,_controls.scss}`, `src/collections/{LeadActivities.ts,PrivateFiles.ts}`, `src/payload.config.ts`, `src/app/(payload)/admin/importMap.js`, `docs/ARCHITECTURE.md`, FR-ADM-19 "Điều hướng rõ (BL-041)". I ignored progress.json, BACKLOG, the change doc, and the T02 dashboard sentence.
- **Review level: STRICT**
- **Reason:** the change touches navigation shared by every admin screen. `admin.hidden` also changes route visibility for `lead-activities`, which the Lead form's join field depends on, and for `private-files`.
- **Blast radius:**
  - The sidebar and header on every admin view.
  - The Lead form join field "Lịch sử chăm sóc", plus the drawers it opens.
  - The read-only `cv` upload field and the "Tải CV" button in the job-applications form.
  - The dashboard nav-group cards, through `buildNavGroupCards`, which already filters on `visibleEntities` and permissions.
  - Admin preferences (`nav` key), which the `NavAdvancedCollapse` provider writes through Payload's own toggle.
  - No schema, migration, access, API or endpoint changes.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/components/admin src/lib/admin src/collections` | PASS: 36 files, 256 tests |
| `pnpm typecheck` | PASS (tsc --noEmit, 0 errors) |
| `pnpm lint` | PASS: 0 errors, 2 old warnings in `tools/task-dashboard/server.mjs` (outside this task) |
| `git status` on `src/payload-types.ts`, `src/migrations` | no change, so no schema or migration change |

## D1: does `admin.hidden: true` break anything? (checked by reading node_modules, Payload 3.91)
- **List route:** `@payloadcms/next/dist/views/List/index.js:65` returns not-found when the slug is missing from `visibleEntities` and `!overrideEntityVisibility`.
- **Document route:** `views/Document/index.js:208` applies the same check. So the routes `/admin/collections/lead-activities|private-files` now 404 for everyone. This is intended.
- **Drawers still work:**
  - `DocumentDrawer/DrawerContent.js` and `ListDrawer/DrawerContent.js` both default to `overrideEntityVisibility = true`.
  - `views/Document/handleServerFunction.js` and `views/List/handleServerFunction.js` pass that flag through.
- **Join table still works:**
  - `RelationshipTable/index.js` opens rows with `DrawerLink` (`LinkedCellOverride`, l.270) and "Thêm" with `openDrawer` (l.219/247).
  - `AddNewButton.js:47` checks only `permissions.create`.
  - `fields/Join` and `buildTableState` do not check `visibleEntities`.
  - So the Lead form can still list, add and open rows in a drawer. This is confirmed at code level only; it has not been tried in a running app (see Residual risk).
- **Other links to these routes:**
  - Grep finds no internal link to `/admin/collections/lead-activities` or `/admin/collections/private-files`.
  - The dashboard (`dashboard-data.ts:194`) filters on `visibleEntities`, and its recent-docs list leaves out `lead-activities`.
  - `LinkedCell.tsx:34` builds links generically, but it is not used in the join table, which uses DrawerLink.
  - The CV download goes through the separate endpoint `/api/admin/private-files/:id/download`.
- **Access:** unchanged. `hidden` is UI-only. The `ROLES` import that is no longer used was removed correctly.

## Responsive Checklist Gate (diff touches UI; breakpoints 375 / 768 / 1024 / 1280 from the profile)
No browser was available, so I checked with CSS math against `@payloadcms/next/dist/prod/styles.css`. The nav's `--nav-padding-inline-start` is 20px above 1024px, `calc(base*.5)` = 10px at ≤1024px, and `--gutter-h` = 16px at ≤768px. `.nav` has `overflow:hidden` and `.nav__scroll` has `overflow-y:auto`.

| Item | Result | Evidence |
|---|---|---|
| No horizontal scroll | OK | `admin-mobile-overflow.test` PASS. `.tami-admin-site-link` shows only an icon at <768px. The group content indent (10+6+1 = 17px) still fits inside the nav width. |
| Mobile-first / min-width queries | N/A (project convention) | The admin SCSS uses `max-width: 767px` throughout and follows Payload's breakpoints. This predates the task. |
| Grid / containers not fixed px | N/A | No grid in this diff. |
| Typography rem / clamp | N/A (project convention) | The admin uses px, matching Payload, before this task. Sizes 12/14px follow D4. |
| Media | N/A | Only one inline 16px icon. |
| Touch target ≥ 44px | **FAIL** | `.nav-group__toggle` is 14 + 16 + 6 = **36px** tall with no mobile override. `.nav__link` and `.tami-admin-site-link` are 44px. "Nâng cao" is now collapsed by default, so on mobile the user has to tap this toggle to reach its 6 items. See M2. |
| Nav on mobile | OK | Payload's hamburger nav is unchanged. Clicking the toggle while the nav is closed (tabIndex -1) still works. |
| Active state visible at every width | **FAIL** | `inset-inline-start: -37px` assumes a 20px nav padding. At ≤1024px the bar lands at x = 10+17−37 = **−10px**, and at ≤768px at 16+17−37 = **−4px**. Both are outside the scroll container's padding box, so the 3px bar is fully clipped at **375, 768 and 1024**. It only shows above 1024px. See M1. |
| 100vh / reduced-motion / overflow hiding | N/A | The diff adds no animation or viewport height. |

## Skill gates
- **aislop:** skip. The command is not in the reviewer's verify-command allowlist or in `project-config`.
- **oxlint (anti-slop):** skip, oxlint not configured. `pnpm lint` (eslint) has 0 errors and typecheck PASS.
- **ocr:** skip, ocr is not configured or allowed for the reviewer.
- **AI-readable:** OK. One indicator: the comment in `admin-groups.ts:20` says "AdminNavAdvancedCollapse", but the component is named `NavAdvancedCollapse` (m3). Functions are under 50 lines, files are under 300 lines, and ARCHITECTURE.md is updated.
- **ai-friendly-web:** N/A. This is the internal admin.
- **blitzstrike:** skip. No pentest environment, and the change adds no new input surface. SiteLink uses a server-side env URL validated by `z.url()` and `rel="noopener noreferrer"`.

## Findings

### [MAJOR] M1: the active-item bar is clipped at ≤1024px (375 / 768 / 1024)
`src/components/admin/styles/_surfaces.scss:124` sets `inset-inline-start: -37px`, a fixed number. Payload changes `--nav-padding-inline-start` to 10px at ≤1024px and to 16px at ≤768px. The bar then falls outside the scroll container (−10px or −4px) and cannot be seen, which breaks D4 and the Acceptance item "mục đang chọn nổi rõ (nền + vạch nhấn TAMI)". The old −20px value had the same flaw, but this task edits exactly this line.
**Fix:** `inset-inline-start: calc(-1 * var(--nav-padding-inline-start, 20px) - 17px);`. Better still, use a local variable for the 17px indent (margin 10 + padding 6 + border 1) and use it in `.nav-group__content` too, so the two values cannot drift apart. Update the comment on line 122.

### [MAJOR] M2: group toggle touch target is 36px on mobile
`src/components/admin/styles/_surfaces.scss:70` sets the padding to `14px 10px 6px` with line-height 16px, giving a 36px height. The `@media (max-width: 767px)` block raises `.nav__link` to 44px but not `.nav-group__toggle`. With "Nâng cao" collapsed by default, this toggle is now the main way into the group.
**Fix:** inside the `max-width: 767px` block add `.nav-group__toggle { min-height: 44px; align-items: center; }`, or increase the padding at mobile widths.

### [MINOR] m1: the group divider line is decorative and below the 3:1 D4 asks for
`_surfaces.scss:59` uses `border-top: 1px solid var(--admin-border)`, which is #e7e5e4 on #fbfbfa, about 1.2:1 in light mode (dark mode is similar). WCAG does not require contrast for decorative lines, and the 8px gap plus the bold heading already separate the groups. D4 does state "≥ 3:1 vạch/viền", though. Either use `--admin-border-strong` (about 3.4:1) or record in the task that this line is decorative.

### [MINOR] m2: NavAdvancedCollapse depends on Payload's internal DOM
`NavAdvancedCollapse.tsx:19-20` relies on `#nav-group-<label>` and `.nav-group__toggle--open`. Both come from Payload internals (`NavGroup/index.js`), and a Payload upgrade can break them silently: the group would stay open, with no error. Also, the MutationObserver watches only `childList` and not `attributes`. In a rare race, the user closes the group before `getPreference` resolves and reopens it within 5s. If another DOM change happens in that window, the provider can collapse the group the user just opened. **Suggestion:** add a comment noting the dependency on Payload 3.91's DOM, and before clicking, re-check that the preference is still `undefined`, either via `getPreference` again or the cached ref. The approach is acceptable: NavGroup keeps its open/closed state in `useState` set from the initial prop, and the only alternative is a custom Nav, which is heavier. It is SSR-safe (DOM access only inside `useEffect`), its cleanup is correct, and `setPreference` uses `deepMergeSimple`, so it never wipes other groups' preferences.

### [MINOR] m3: comment uses the wrong component name
`src/components/admin/admin-groups.ts:20` says "AdminNavAdvancedCollapse"; it should be `NavAdvancedCollapse`.

## Other checks
- **Tests:** they cover real behaviour. `admin-groups` checks that "Nâng cao" is last with all 6 items. NavAdvancedCollapse covers 4 cases: no preference, nav rendered late, preference present, and an error. SiteLink checks href, target, rel, aria-label and the svg's aria-hidden. Gap: no test pins `hidden === true` for `lead-activities` and `private-files`, so a regression would go unnoticed (this is a suggestion, not a blocker).
- **importMap:** both entries follow the generator's format (hashed import plus key `/components/admin/<X>#<X>`), and the keys match the paths in `payload.config.ts`.
- **SiteLink:** it is a server component with no `"use client"`, and `getEnv()` reads `NEXT_PUBLIC_SITE_URL` (validated by `z.url()`) on the server. Nothing is hardcoded. It has an accessible name, and the icon is marked `aria-hidden`.
- **Surgical diff:** every line traces back to D1–D5. The `ROLES` import was removed because the change made it unused.

## Residual risk
- D1 has not been tested at runtime, specifically listing, adding and opening rows in the Lead form's join field drawers. The code evidence is solid, but someone should click through it once in a running admin before release.
- Real contrast, and how far the active bar sits from the edge after M1 is fixed, still need a person to look at 1440 and 375 in light and dark mode.
- The provider may show the "Nâng cao" group open for a moment before collapsing it on the first visit. The builder already noted this.

## Verdict: FAIL
There are 2 MAJOR findings: M1 (the active bar is hidden at 375, 768 and 1024) and M2 (the group toggle touch target is 36px). Both fail items in the Responsive Checklist Gate. D1, NavAdvancedCollapse, SiteLink, the tests, the importMap and the absence of schema changes are all OK. Fix M1 and M2, and preferably m1 and m3, then run review round 2.
