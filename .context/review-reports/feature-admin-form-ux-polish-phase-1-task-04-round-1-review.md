Agent: reviewer

> Saved by dispatcher (change-request): reviewer's Write was blocked by guard.mjs (worktree path). Content from reviewer hand-back.

# Review: feature-admin-form-ux-polish · phase-1-task-04 · round 1 (BL-058)

- **Review level:** STRICT
- **Reason:** replaces Payload `edit.versions` view for 7 collections via shared `withContentDefaults`, goes through `readVersions`, changes shared i18n strings (`version:previouslyPublished` / `currentlyPublished`), adds global CSS for the compare view.
- **Blast radius:** `src/collections/_shared/content-defaults.ts` (Projects, Rentals, PropertyPosts, News, JobPostings, Services, Pages); new `src/components/admin/VersionHistoryView.tsx`, `src/lib/admin/version-history.ts`; `src/lib/admin/payload-vi-overrides.ts` (compare pill labels via Payload `getVersionLabel`); `custom.scss` + `_version-history.scss` (global `.render-field-diffs__field[data-field-path=…]`); `importMap.js`. No migration / field / endpoint; `maxPerDoc`/`drafts` unchanged.

## Verify commands + result (task-04 worktree)
| Command | Result |
|---|---|
| `pnpm lint` | PASS (0 error; 2 old warnings outside scope) |
| `pnpm typecheck` | PASS |
| `pnpm vitest run --project unit --project ui --maxWorkers=2` | PASS full suite 340 files / 3290 tests (577.8 s) |
| `pnpm build` | PASS |
| integration / dev server | not run (instruction) |

## Screenshots (`.context/review-reports/feature-admin-form-ux-polish/screens/`)
- Viewed `t04-before-1440-light-list.png`: original table with updated date + UUID, page size 10.
- Present, not opened: `t04-before-1440-dark-list.png`, `t04-before-1440-{light,dark}-diff.png`, `t04-after-1440-dark-diff.png`.
- Viewed `t04-after-1440-{light,dark}-list.png`: VN time + "x phút trước", status badge, "Phiên bản hiện tại" on first row, "N trường đã đổi" / "Bản cũ nhất" (nav collapsed).
- Viewed `t04-after-1440-light-diff.png`: pill "Bản đã lưu", "Chỉ trường đã đổi" on by default, Restore present, no `updatedAt`.
- Viewed `t04-after-390-light-list.png`: stacked cards, no horizontal overflow.
- Note: builder test data only has manual VI edits (each "1 trường đã đổi"); no translation-job versions → screenshots cannot reveal MAJOR-1.

## STRICT checks
- Access OK: `findVersions` with `overrideAccess: false`, `user: req.user`, `req` (`VersionHistoryView.tsx:43-53`) — same path as original view (`@payloadcms/next/dist/views/Versions/index.js:62-75`); Payload runs `executeAccess(access.readVersions)` (`payload/dist/collections/operations/findVersions.js:41`) and renders view only with `docPermissions.readVersions`. No custom `readVersions` in repo → behaviour unchanged.
- Locale: original passes `locale: req.locale`; new view relies on `createLocalReq` (`payload/dist/utilities/createLocalReq.js:70`) — equivalent. Real issue is counting (MAJOR-1).
- Only collections with versions; does not override own `edit.versions` (`??`); 3 new tests. OK.
- Pagination/perf OK: 1 query, `depth: 0`, `limit: 100` vs `maxPerDoc` 20, no N+1.
- "Phiên bản hiện tại" OK: sort `-updatedAt`, `index === 0` (drafts false).
- VN time OK (`Intl` `Asia/Ho_Chi_Minh`, tested). XSS OK (JSX only).
- CSS hidden fields match skip list (`updatedAt, createdAt, deletedAt, translation, searchReindexPending`; TS also skips `id`, `_status`); `data-field-path` exists in 3.91 (`RenderVersionFieldsToDiff.js:57,73`).
- `previouslyPublished`/`currentlyPublished` used only at `views/Version/index.js:276` and `VersionPillLabel/getVersionLabel.js:39` (non-draft branch); no drafts in repo → safe.
- Restore OK (`edit.version` not forked). Forbidden scope OK (`payload-types.ts` EOL only).

## Responsive Checklist Gate
No horizontal scroll OK (390 screenshot; CSS math: row min ≈ 585px; 1280 nav open 885px; 769–1024 ≥ 689px; ≤ 768 card layout `1fr auto`) · `max-width: 768px` per repo convention · grid `minmax`/`fr` (badge col 11rem) · rem except `min-height: 44px` touch target · no table on mobile · no vh/motion/overflow masking · AA via existing tokens.

## Skill gates
aislop skip · oxlint skip (eslint 0 error) · ocr skip · AI-readable OK (1 indicator: function > 50 lines) · ai-friendly-web N/A · blitzstrike N/A.

## Findings

### [MAJOR-1] "N trường đã đổi" only compares the viewed locale → translation-job versions show "Không đổi trường nào"
- Where: `src/components/admin/VersionHistoryView.tsx:43-53` (`findVersions` without `locale` → snapshot only `vi`); counting in `countChangedFields` (`src/lib/admin/version-history.ts`).
- Evidence: translation job writes EN via `payload.update({ locale: "en", … })` (`src/jobs/translate-content-save.ts:17,22,35`; `translate-content-context.ts:47`) → each VI edit produces 1–3 extra versions where only EN fields + `translation` (excluded) change, maybe `hasEnglish`. List says "Không đổi trường nào"/undercounts while the compare view (default "Ngôn ngữ: vi, en") shows real changes → contradiction. Task named "localized fields" as focus.
- Fix: `locale: "all"` in `findVersions` (localized fields become `{ vi, en }`, `isDeepStrictEqual` counts correctly; re-check `version.status` stays a string); unit test: `{ vi, en }` snapshot with only `en` changed → 1. Otherwise relabel so it does not claim falsely + decision log.

### [MINOR-1] Only the time cell is clickable, not the whole row — `VersionHistoryView.tsx:19-22`. Suggest stretched link (`::after` over `li`) or decision log.
### [MINOR-2] Function/props too long — `VersionHistoryView` ~56 lines (`:37-93`); `VersionRowItem` props on one line (`:14`). Suggest `loadVersionRows` + `type VersionRowProps`.
### [MINOR-3] Link built by string concat instead of `formatAdminURL` (basePath) — `href` in `VersionHistoryView.tsx`. No basePath today.
### [MINOR-4] `status` only looked up at top level — `VersionHistoryView.tsx:55`. Correct for Tin BĐS / Dự án (screenshots); other 5 collections unverified.

## Residual risk
Not browser-verified: other 5 collections, sale opening a post they cannot read, dark-diff screenshot. Access conclusion from code reading (same path as original view). `data-field-path` depends on Payload 3.91. Payload default `readVersions` = logged-in only — pre-existing, out of scope; suggest separate task.

## Verdict: FAIL
1 MAJOR (MAJOR-1). Fix + test, then round 2.
