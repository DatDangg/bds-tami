Agent: reviewer

> Saved by dispatcher (change-request): reviewer's Write was blocked by guard.mjs (worktree path). Content from reviewer hand-back.

# Review — BL-058 feature-admin-form-ux-polish · phase-1-task-03 · round 1

- **Review level:** NORMAL
- **Reason:** shared admin CSS only (add-new button block in `_forms.scss`) + 1 style test; no auth/API/schema/data/React change. Button appears on every relationship field with create permission → not FAST.
- **Blast radius:** every `.relationship-add-new__add-button` without `--unstyled` (single-collection `DocumentDrawerToggler` with `.doc-drawer__toggler`, multi-collection Popup `Button.btn`); `.popup__trigger-wrap` only under `.relationship-add-new`; `--unstyled` untouched; public site unaffected.

## Verify commands + result (task worktree)
| Command | Result |
|---|---|
| `pnpm lint` | PASS (0 error; 2 old warnings outside scope) |
| `pnpm typecheck` | PASS |
| `pnpm vitest run --project unit --project ui --maxWorkers=2` | PASS 3178/3178 |
Integration and dev server not run (instruction).

## Requirements
1. "Thêm mới" text removed: OK (`::after` gone; before shows text, after icon only).
2. 8px gap + 4 rounded corners: OK — `_forms.scss:94-120` `margin-left: 8px`, `border-radius: var(--admin-radius-s)`, border `--admin-border-strong`; Payload's `margin-left:-1px`/left radius 0 are in `@layer payload-default` (`AddNewRelation/index.scss:3-43`), unlayered rule wins without `!important`; both branches matched; `--unstyled` excluded via `:not()`.
3. Same height as select: OK — `.rs__control{min-height:36px}` (`_controls.scss:137`), button 36x36; < 768px 44x44 (`_forms.scss:137-144`).
4. Accessible name: OK — Payload provides `aria-label` "Thêm mới: <tên>" (`index.js:203-227`, `fields:addNewLabel`); builder confirmed via CDP accessibility tree on 6 buttons.
5. hasMany + `.popup__trigger-wrap{height:auto}`: OK — scoped `.relationship-add-new .popup__trigger-wrap` (`_forms.scss:86-92`); fixed-height button stays at top.
6. Contrast (manual): border light `#8f8984`/`#fff` ≈ 3.4:1; dark `#6e6862`/`#1a1918` ≈ 3.2:1; focus light `#8c6733` ≈ 5.1:1; dark `#e0bf89` > 9:1 — all ≥ 3:1.
7. Test: `src/components/admin/relationship-add-new-style.test.ts` (3 tests) locks no "Thêm mới", 8px/radius/min-height 36px, `.doc-drawer__toggler` selector, no left-radius overrides, mobile 44px, no `!important`.
8. Forbidden scope: OK (only `_forms.scss` block + new test; `src/payload-types.ts` EOL only).

## Screenshots (`.context/review-reports/feature-admin-form-ux-polish/screens/`)
- `t03-before-1440-light-property-posts-tab1.png` — button glued to field with "Thêm mới" text.
- `t03-after-1440-light-property-posts-tab0.png` — Danh mục: square "+" separated, 4 corners, same height.
- `t03-after-1440-dark-projects-tab1.png` — Chủ đầu tư in dark, border visible, even gap.
- `t03-after-390-light-property-posts-tab1.png` — Dự án liên quan / Tin cho thuê liên quan on one row, no overflow.
(+ remaining before/after/390 sets for projects/property-posts tab0/tab1.)

## Responsive Checklist Gate
No horizontal scroll OK (390, scrollWidth 390) · touch target ≥ 44px OK · no overflow masking · grid/media/nav/vh/motion N/A · 768/1280 desktop 36px by CSS math (no screenshot).

## Skill gates
aislop skip (manual: no slop) · oxlint skip (eslint 0 error) · ocr skip · AI-readable OK · ai-friendly-web N/A · blitzstrike N/A.

## Findings
- CRITICAL: none. MAJOR: none.
- [MINOR-1] `_forms.scss:95`, `:139` — second selector `….doc-drawer__toggler` redundant (unlayered rule wins regardless of specificity; decision log "để thắng đúng đặc hiệu" inaccurate; `.doc-drawer__toggler` is the single-collection branch, not Popup). Non-blocking.
- [MINOR-2] `relationship-add-new-style.test.ts:26` — `height:\s*44px` also matches `min-height: 44px`; use `(?<!-)height:\s*44px`. Non-blocking.
- [MINOR-3] No visual evidence for Popup multi-collection branch (no such field in admin today), hasMany with add button, hover tooltip (possible clip at right column edge), 768/1280 screenshots. Non-blocking.

## Residual risk
Popup branch may keep `.btn`/`formInput` hover/focus box-shadow (not overridden, unverified); tooltip clipping at column edge unverified.

## Verdict: PASS
