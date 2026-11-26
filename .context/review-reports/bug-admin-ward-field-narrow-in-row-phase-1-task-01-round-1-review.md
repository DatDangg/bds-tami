Agent: reviewer

# Review — bug-admin-ward-field-narrow-in-row · phase-1-task-01 · round 1 (BL-130)

- Review level: **NORMAL**
- Reason: a single client admin component shared by 3 collection forms, with a one-prop change (`style`) and tests. It does not touch auth, schema, API, tenant, or data. Fast is not allowed because the component is shared.
- Blast radius: `src/components/admin/WardField.tsx`. It is the Phường/xã field in Admin forms for Cho thuê (`src/collections/Rentals.ts:186`), Dự án (`Projects.ts:203`) and Tin BĐS (`PropertyPosts.ts:122`). In all 3 forms it sits in `formRow(province, ward)`, and `formRow` (`src/lib/admin/form-layout.ts:19`) does not set `admin.width`. Only the layout of that field changes. No data, API or contract is affected.

## Root cause — independently checked
- `node_modules/@payloadcms/ui/dist/fields/mergeFieldStyles.js:1-12`: with no `admin.width` it returns `flex: '1 1 auto'`. With a width it returns `--field-width`. `admin.style` is merged in. Confirmed.
- `node_modules/@payloadcms/ui/dist/fields/Row/index.scss:12-31`: children of `.row__fields` get `flex: 0 1 var(--field-width)` / `calc(var(--field-width) - …)`. If the child has neither an inline `flex` nor `--field-width`, flex-grow is 0 and the field shrinks to its content width. Below mid-break the row uses `display:block; width:100% !important`. Confirmed.
- The default Relationship field (`node_modules/@payloadcms/ui/dist/fields/Relationship/index.js:62,158`) uses `useMemo(() => mergeFieldStyles(field), [field])` → `style: styles` and passes it to `RelationshipInput`. The fix copies this pattern exactly, so the ward field now gets the same style as the default province field. The root cause is proven.

## Specific checks
- **`@payloadcms/ui/shared` in a "use client" component:** `dist/exports/shared/index.js` exports `mergeFieldStyles`. Its imports are only `react/jsx-runtime`, `payload/shared`, `qs-esm`, `date-fns` and `@payloadcms/translations`. None is server-only (no node:fs/db), and the client barrel `@payloadcms/ui` already depends on all of them. Safe for the client bundle.
- **Memo:** deps `[field]` match Payload's default field. `field` is a stable client-config prop, so there is no extra re-render. OK.
- **Regressions:** `filterOptions` (memo on `provinceId`), the reset-on-province-change `useEffect`, `memoizedValidate` and `handleChange` are unchanged (diff +3/-1). OK.
- **Tests:** 2 new tests render `WardField` with a `RelationshipInput` mock that captures props, and use the real `mergeFieldStyles`. They compare against literal values (`{ flex: "1 1 auto" }`, `{ "--field-width": "50%" }`) rather than recomputing via `mergeFieldStyles`, so they are not tautological. With the old code (`style={undefined}`) both FAIL. The 3 old helper tests are kept.

## Verify commands + result
- `pnpm vitest run src/components/admin` → **469 passed (469)**.
- `pnpm typecheck` (`tsc --noEmit`) → clean, no errors.
- `npx eslint src/components/admin/WardField.tsx src/components/admin/WardField.test.tsx` → no output (clean).

## Responsive Checklist Gate
The diff touches admin UI layout (Payload admin, not public UI). It only adds an inline style matching the default Payload field; there is no new CSS of our own.
- Layout / no horizontal scroll: **OK (CSS math)**. ≥ mid-break: both fields `flex: 1 1 auto` → they share the row. 375/768 (< mid-break): Row CSS forces `width:100% !important` per field. The ward dropdown stretches with the control, which removes the narrow menu that caused horizontal scrolling.
- Mobile-first / grid auto-fit / container px: **N/A** (uses Payload Row CSS, no new CSS).
- Typography/Spacing: **N/A** (unchanged).
- Media: **N/A**.
- Touch target / nav / table: **N/A** (Payload react-select control is unchanged).
- Viewport 100vh / reduced-motion / overflow hidden: **N/A** (none added).
- Not checked in a browser (Docker/DB down) → see Residual risk.

## Skill gates
- aislop: skip — the change is one prop + one memo line copying the Payload pattern; reviewed by hand, no slop indicators.
- oxlint (anti-slop): skip, oxlint not configured (no `.oxlintrc*`). ESLint is clean.
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: **OK** — clear naming (`fieldStyle`), the comment explains WHY (Row shrinks the field), no magic numbers, no new indirection, file 99 lines, component under 50 logical lines apart from JSX props (unchanged by this task). 0 indicators.
- ai-friendly-web: **N/A** (internal admin).
- blitzstrike: **N/A** (not STRICT, not sensitive).

## Findings
- [MINOR] `src/components/admin/WardField.test.tsx:18` — `relationshipInputProps.current = undefined as Record<string, unknown> | undefined;` and the cast on line 21 are redundant (the type is already declared in `vi.hoisted`). Cosmetic only, does not block.
- [MINOR] Residual (not a defect): Repro Verification says `PASS (unit); trực quan chưa verify`. The unit evidence is verifiable and proves the prop now matches the default field, and the Row CSS behaviour is confirmed from Payload source. The remaining risk is the actual dropdown width at runtime. Recommend the user or QA quickly look at one form (Cho thuê) at 1440 and 390.

No CRITICAL/MAJOR.

## Residual risk
- No screenshots `bl130-*`. The visual result is inferred from the Payload CSS and the component code. This is acceptable because the fix exactly copies the default Relationship field's behaviour (same function, same memo, same prop), and the neighbouring province field in the same row is already rendered correctly this way.

## Verdict
✅ **PASS**
