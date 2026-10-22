Agent: reviewer

> Saved by dispatcher (change-request): reviewer's Write was blocked by guard.mjs (path resolved against main repo root, worktree path). Content verbatim from reviewer hand-back.

# Review — feature-admin-form-ux-polish · phase-1-task-01 · round 1 (BL-058)

- **Review level:** NORMAL
- **Reason:** 1 admin client component (`RetranslateButton`) + 2 new tests; no change to endpoint, permission (`canRetranslate`), audit, schema, shared hook/service. Reuses Payload `ConfirmationModal` (same as `RowActions`). NORMAL instead of FAST because the guard test scans the whole admin tree.
- **Blast radius:** `src/components/admin/RetranslateButton.tsx` ("Dịch lại bằng AI" in translation block of content collections + globals); new `src/components/admin/no-browser-dialogs.test.ts` (scans `src/components/admin/**` + `src/app/(payload)/**`). No API/data/style change.
- **Scope:** only those 3 files. No forbidden paths, no migration, nothing committed.

## Verify commands + result (task worktree)

| Command | Result |
|---|---|
| `pnpm lint` | 0 errors; 2 old warnings in `tools/task-dashboard/server.mjs` (outside diff) |
| `pnpm typecheck` | PASS |
| `pnpm vitest run --project unit --project ui --maxWorkers=2` | 336 files / 3255 tests PASS (698s) |
| 2 new test files | 2 files / 80 tests PASS |
| Integration / dev server | Skipped: shared Postgres in crash recovery (dispatcher instruction) |

## Focus points
- Huỷ / Esc / backdrop do not call fetch: OK — button only `openModal(modalSlug)` (`RetranslateButton.tsx:42`); fetch only via `onConfirm`; Payload `ConfirmationModal` (`node_modules/@payloadcms/ui/dist/elements/ConfirmationModal/index.js`): Huỷ only closes, `closeOnBlur: false`, Esc closes without `onConfirm`.
- No double submit: OK — Payload modal ignores second confirm while pending; `if (busy) return` (`:26`); open button `disabled={busy}` + `aria-busy` (`:42`).
- modalSlug unique: OK — `retranslate-<collection>-<id>` / `retranslate-global-<slug>` (`:22`).
- Modal closes on error: OK — `closeModal` in `finally` (`:36`).
- Vietnamese text: OK, asserted (`RetranslateButton.test.tsx:49`).
- Hook order: OK — `useModal()` before early `return null`.
- Scan test scope: OK — both folders, skips `.test.`, ts/tsx/js/jsx, asserts > 20 files scanned, case-sensitive, ignores `x.confirm(`/`onConfirm(`; self-check of regex.

## Responsive Checklist Gate
No CSS/layout change (Payload built-in modal). Touch target OK (`minHeight: 44`; modal `size="large"`); focus trap + Esc by Payload; `role=status|alert` unchanged. Browser checks at 375/768/1280/1440 not possible at review time (see residual).

## Skill gates
aislop skipped (not in verify allowlist; manual: no slop) · oxlint skipped (eslint 0 errors) · ocr skipped · AI-readable OK · ai-friendly-web N/A · blitzstrike N/A.

## Findings
No CRITICAL / MAJOR.
- [MINOR] `no-browser-dialogs.test.ts:17` — misses `window["confirm"](`, `self.confirm(`, `top.alert(`, aliased calls; may flag `confirm(` in comments/strings (safe side). Optional: extend pattern.
- [MINOR] `RetranslateButton.test.tsx:52-57` — mocked modal has no Huỷ button, so cancel/Esc not exercised; no test for second confirm while pending. Covered by Payload source; non-blocking.
- [MINOR] `RetranslateButton.tsx:36` — `closeModal` in `finally` duplicates Payload's own close; harmless, matches `RowActions`.

## Screenshots / Residual risk
- Not done at review time: 1440 "after" screenshots (light + dark) and DevTools Network check (dev server blocked by Postgres recovery). Dispatcher adds screenshots before close-out.
- "Before" screenshot: native browser dialog cannot be captured by page screenshot → N/A.
- Modal light/dark colours come from Payload built-in CSS (not visually checked by reviewer).

## Verdict
**PASS** — conditional on adding the "after" modal screenshots (light + dark) before close-out.
