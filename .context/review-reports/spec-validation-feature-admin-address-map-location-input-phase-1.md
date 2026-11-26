Agent: spec-validator

# Phase review: feature/admin-address-map-location-input, phase 1, round 1 (BL-131, MODIFY)

- Mode: Phase review (built correctly and completely vs spec delta + change doc acceptance)
- Spec: `SPECIFICATIONS.md:218` (spec 1.65.0), `docs/ERD.md:37`, `spec/updates/2026-11-26-admin-address-map-location-input.md`, `spec/test-scope/current.json` (scopeVersion 130)
- Change doc: `spec/changes/2026-11-26-admin-address-map-location-input.md` (Acceptance lines 47-53)
- Tasks: T01 (32f86155, NORMAL PASS r1), T02 (6a1ebe15, STRICT PASS r1), T03 (uncommitted, STRICT FAIL r1, then PASS r2: `.context/review-reports/feature-admin-address-map-location-input-phase-1-task-03-round-2-review.md`)

## Verdict

**PASS (COMPLETE, with 2 accepted residuals carried as gates).** Every functional requirement in the spec delta is implemented and covered by unit tests. No MISSING items. There are 2 PARTIAL items. Both are verification steps that the environment blocked (no browser test account, no staging/prod DB access), not missing implementation. They are accepted as residuals only on the conditions listed under Gaps.

## Coverage matrix

| # | Requirement | Source | Implementation / evidence | Status |
|---|---|---|---|---|
| 1 | Tin BĐS: Địa chỉ + Toạ độ sit right under the Tỉnh/thành · Phường/xã row in the "Thông tin tin đăng" tab, outside "Thông số bất động sản" | change doc:14-18, 48; SPEC:218 (1) | `src/collections/PropertyPosts.ts:126-131` (province/ward row, then `addressField`, `locationField`); `specsSection` :64-80 no longer contains them | OK |
| 2 | Data paths unchanged (`address`, `location` at root level), no migration | change doc:18, 48, 56; SPEC:218 | The collapsible has no name, so the fields stay at root level. The T02 commit diff only changes field config. Commits show `Migration: none` | OK |
| 3 | All 6 point fields use one shared field | change doc:20-23, 49; SPEC:218 (2); ERD:37 | `mapLocationField` used at Projects.ts:209, PropertyPosts.ts:84, Rentals.ts:202, projects/market-blocks.ts:129, SiteSettings.ts:93 (`name: "mapLocation"`), site-settings/contact-offices.ts:22. No raw `type: "point"` is left in `src/` outside the helper (Grep). Test "quét đủ 6 ô point" at `src/fields/map-location.test.ts:102` | OK |
| 4 | Empty is valid | change doc:25; SPEC:218 | `map-location.ts:43-48` (blank returns null, so no check); test :11-19 | OK |
| 5 | Inside VN box (lat 7–24, lng 101.5–118, includes Hoàng Sa / Trường Sa) is valid | SPEC:218; ERD:37 | `map-location.ts:9-10, 50-52`; test :25-36 (HCM, HN, Phú Quốc, Hoàng Sa, Trường Sa, edges) | OK |
| 6 | Swapped lng/lat gives "Có vẻ bạn nhập ngược kinh độ và vĩ độ." | change doc:27; SPEC:218 | `map-location.ts:12, 33, 55-57` (runs before the default `point` validator so the message is right); test :42-45 | OK |
| 7 | Outside VN gives "Toạ độ không nằm ở Việt Nam, kiểm tra lại." | change doc:28; SPEC:218 | `map-location.ts:13, 36`; test :47-55 | OK |
| 8 | Validation runs on the server (API/seed/job) | change doc:49; ERD:37 | Field-level `validate: validateMapLocation` (`map-location.ts:67`) is a Payload server validate, so it also applies to Local API and REST | OK |
| 9 | Keep each place's own `access` (Rentals `readExactAddress`) and description | change doc:29; SPEC:218 | `map-location.ts:59-70`; usages pass the same description/access as before (T02 diff); tests :72, :111 | OK |
| 10 | DB scan for out-of-range coordinates before enabling | change doc:30, 50 | `tasks/.../phase-1-task-02.md:24-49`: dev, 6 tables, 551 coordinates, 0 bad. Staging/prod **not scanned** | PARTIAL (see G2) |
| 11 | Paste box accepts a number pair (with/without spaces, negative numbers) | change doc:34; SPEC:218 (3) | `map-location-parse.ts:4-5, 39-40`; test `map-location-parse.test.ts:5-15` | OK |
| 12 | Full links: `/@lat,lng`, `?q=`/`query=`/`ll=`, `!3d!4d` (pin location wins) | change doc:35; SPEC:218 | `map-location-parse.ts:7-9, 41-45`; test :27-48 (including priority of `!3d!4d` over `@`, and `%2C`) | OK |
| 13 | Fill on paste / Enter / blur, not on each keystroke | SPEC:218 | `MapLocationField.tsx:69-78, 93-108`; component tests :95-116 | OK |
| 14 | Short link `maps.app.goo.gl` / `goo.gl/maps` shows the "dán cặp số" hint, no network call | change doc:38; SPEC:218 | `map-location-parse.ts:10, 38`; `MapLocationField.tsx:37`; tests parse :51-54, component :73 | OK |
| 15 | Reversed pasted pair gives a hint and is not auto-swapped; unreadable input gives a message | SPEC:218 | `map-location-parse.ts:16-18`; `MapLocationField.tsx:38-39`; tests parse :17, :56; component :80 | OK |
| 16 | Vĩ độ shown before Kinh độ; data still GeoJSON `[lng, lat]` | change doc:36; SPEC:218; ERD:37 | `MapLocationField.tsx:120-159` (latitude edits index 1, longitude index 0), `:75` `setValue([lng, lat])`; tests :30, :61, :118, :167-179 (trailing zeros not swallowed, which was the r1 CRITICAL) | OK |
| 17 | "Xem trên Google Maps" link opens the right point | change doc:37; SPEC:218 | `MapLocationField.tsx:21-26, 163-167` (`?q=lat,lng`, `_blank`, `noopener noreferrer`); test :45, :132 | OK |
| 18 | Custom field is wired up through importMap | T03 design | `importMap.js:45, 140`; `map-location.ts:69` | OK |
| 19 | Unit tests: parser (pair, link forms, whitespace, negatives, garbage) + validator (empty / VN / swapped / outside VN) | change doc:52 | The three test files above; T03 r2 verify: vitest 112 files / 1032 tests PASS, typecheck PASS, eslint PASS | OK |
| 20 | Real admin check (Tin BĐS + Cho thuê) at 1440 & 390, light/dark | change doc:53 | Not done (no test account outside `.env.local`). Only covered by compiled SCSS and CSS reasoning (T03 r2 Responsive gate) | PARTIAL (see G1) |
| 21 | Public map still shows correctly with old data | change doc:53; SPEC:218 (`isValidLocation` unchanged) | Data type and paths unchanged, `isValidLocation` untouched (spec/updates:10), dev scan 0 bad. Reasoned, not checked in a browser | OK (by reasoning, covered by the G1 residual) |
| 22 | No change to `point` type, GIST, or Rentals rounding | change doc:56-57 | T02 diff only touches field config; `LazyMap.tsx` not in the diff | OK |
| 23 | Doc impact: ERD coordinate rule + SPEC as-built + spec publish | change doc:58 | ERD:37, SPEC:218, spec/updates, test-scope v130 all present and consistent with each other | OK |
| 24 | Doc impact: `docs/DESIGN.md` (admin form) | change doc:58; T03 task:12 | No BL-131 entry. `DESIGN.md` does not document admin form layout anywhere (no BL-130 / Phường/xã entries either) | Note (see N1) |

Cross-doc consistency: SPEC:218, ERD:37, spec/updates and test-scope all agree on the ranges (7–24 / 101.5–118), both messages, the 6 fields and `[lng, lat]`. "Thông số bất động sản" appears only in SPEC:218, so there is no stale text that contradicts it. The change doc's rough ranges (~8–24, ~102–110) were left for the builder to settle with a margin, and the settled values are recorded in SPEC/ERD. No conflict.

## Gaps

- **G1 [PARTIAL]**: change doc Acceptance line 53 / T03 Acceptance line 28. The admin form (Tin BĐS + Cho thuê) has not been checked in a real browser at 1440/390 in light and dark mode. Blocked by environment: there is no test login outside `.env.local`.
  - Classification: **accepted residual, does not block the phase.** The behavior is locked by jsdom tests (field order, paste, number input) and the SCSS compiles.
  - Condition: leave this acceptance box unchecked (or mark it residual) in the change doc. Do a manual QA pass on staging when an account is available, covering Tin BĐS, Cho thuê, and the array fields (Tiện ích xung quanh, Văn phòng), plus the server error showing under the number inputs. Keep it in test-scope for QA.
- **G2 [PARTIAL]**: change doc lines 30/50, "quét DB (dev/staging) … trước khi bật". Only dev was scanned (551 coordinates, 0 bad). Staging/prod were not scanned.
  - Classification: **accepted residual for the phase, but a HARD pre-deploy gate.** The code has not been enabled on staging/prod yet, so "trước khi bật" still holds if the scan runs before deploy. Risk: a bad record would make the translation job, sync hook or backfill fail validation when they update that record (ERD:37, T02 MINOR 1).
  - Condition: before deploying to staging (and again before promoting to prod), run the same read-only SELECT from T02 "DB scan" on that environment and report the list (or "không có") to the user.

## Notes (not gaps)

- **N1**: The change doc expected a `docs/DESIGN.md` update, but DESIGN.md does not describe admin form layout. Recording `no doc impact (DESIGN.md has no admin form section)` at close-out is enough. This is not a gap.
- **N2**: Close-out for T03 is still open. The task file says `Trạng thái: pending` and `Reviewer verdict: _` (`phase-1-task-03.md:5, 39`), the change is uncommitted, and the change doc acceptance boxes are all unchecked. Close-out, progress, and commit need to finish before the phase closes.
- **N3**: The 4 MINOR findings from T03 r2 (paste replaces the partly typed text, JSX indentation, double cast, transient `""` while typing "10.") do not affect spec coverage.

## Summary

- MISSING: 0
- PARTIAL: 2 (G1 browser QA, G2 staging/prod scan). Both are environment-blocked verifications, accepted as residuals with the conditions above.
- Spec / ERD / update / test-scope: consistent with each other and with the code.
