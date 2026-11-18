Agent: reviewer

# Review — bug-admin-map-gray-tiles · phase-1-task-01 · round 1 (BL-121)

- Task: `tasks/bug-admin-map-gray-tiles/phase-1-task-01.md`
- Change doc: `spec/changes/2026-11-17-admin-map-gray-tiles.md`
- Diff scope: `src/components/media/LazyMap.tsx`, `src/components/media/LazyMap.test.tsx` (uncommitted by design; other dirty files ignored)

## Review level
**STRICT**

## Reason
`LazyMap` is a shared component used in 4 places (ProjectLocation, RentalDetail, PostDetail, OfficeSystem). The fix also adds a new third-party runtime dependency (OpenFreeMap, with no SLA). The rules require STRICT for shared components. The diff itself is small (style constant swap + test assertion).

## Blast radius
- Every public map: project detail, rental detail (approximate circle mode), post detail, office/contact page.
- New external host `tiles.openfreemap.org` (style, TileJSON, .pbf, sprite, glyphs). No CSP in the app or Nginx would block it. Grep finds only one CSP, scoped to `src/endpoints/admin/private-file-download.ts:96`, and it does not apply to the pages.
- No API, schema or props change. The marker, `fitBounds`, Google Maps link, locale and cooperative gestures code is byte-identical (diff touches only lines 15-23 and 73 of the old file).

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/components/media` | PASS — 4 files, 61/61 tests |
| `pnpm typecheck` | PASS (`tsc --noEmit` no output) |
| `pnpm exec eslint src/components/media/LazyMap.tsx src/components/media/LazyMap.test.tsx` | PASS (exit 0, no output) |

## Independent checks
- **MapLibre usage:** `style: string` (URL) is a valid `StyleSpecification | string` input. MapLibre fetches the style JSON, then the TileJSON (`url` source), and builds attribution from `source.attribution`. `attributionControl: { compact: false }` is kept (LazyMap.tsx:72), so the attribution OpenFreeMap requires stays visible. The screenshot confirms the text "OpenFreeMap © OpenMapTiles Data from OpenStreetMap". The hand-written `OSM_ATTRIBUTION` and `OSM_STYLE` were removed cleanly; there are no leftover references (grep `openstreetmap` in src = only the BL-121 comments and the test).
- **Approximate mode:** `map.on("load")` fires only after the remote style and sources are loaded, so `addSource("area")` and `addLayer(area-fill/area-line)` run against a ready style. Layer ids `area-fill` and `area-line` and source `area` do not clash with the Liberty style's ids (Liberty uses `openmaptiles`/`ne2_shaded` sources and named layers such as `water`, `road_*`). The layers are appended on top, which is correct for a translucent circle. Not browser-verified (no local rental with coordinates). This is logged as residual risk in the task, and the unit test still covers the circle.
- **Marker/fitBounds:** untouched (LazyMap.tsx:86-104).
- **Regression test quality:** `expect(options.style).toBe("https://tiles.openfreemap.org/styles/liberty")` plus the negative check that `tile.openstreetmap.org` appears nowhere in the options. The old code passed an object, so `toBe` fails on it. The test therefore guards against a revert to OSM raster. It cannot prove DNS reachability, which is inherent to unit level, and the browser evidence covers that part. The `key|token` regex check is now trivial against a URL string, but it is harmless.
- **Dead code/comments:** none. The new comment explains WHY (DNS block, attribution source) and is not a WHAT comment.
- **ToS notes:** they match OpenFreeMap's published position as I know it: free, no key or registration, commercial use allowed per the FAQ, attribution required, no SLA / AS-IS. I could not re-fetch openfreemap.org/tos from the reviewer sandbox, so the exact wording (Hungarian law, offline download limits) is not independently verified. See Residual risk.
- **Browser evidence:** `.context/review-reports/assets/bl121-p1t01-local-project-map.jpg` shows full vector basemap (roads, water, ward labels), amenity dots, and the OpenFreeMap attribution at the bottom-right. The task file reports 0 requests to openstreetmap.org and style/planet/sprite returned 200.

## Bug repro closure
- Root cause is proven: VNPT DNS returns NXDOMAIN for `*.openstreetmap.org`; the same request via 1.1.1.1 resolves and TCP 443 connects. Alternative causes (CSP, referrer policy) were excluded.
- Repro Verification status: **PASS** (unit test that fails before the fix and passes after, plus a local browser on VNPT DNS with a screenshot). Staging is pending deploy at the user's request. This is acceptable because the root cause is client-side DNS and does not depend on the environment.

## Responsive Checklist Gate
Diff touches a UI component but changes no markup, CSS, class names or layout. Only the map style source changed.
| Item | Result | Evidence |
|---|---|---|
| Layout / no horizontal scroll | N/A | No JSX/className change; wrapper `absolute inset-0` + `aspectRatio` unchanged |
| Typography / spacing | N/A | No change |
| Media (aspect-ratio) | OK | Frame keeps `style={{ aspectRatio }}` (CLS 0); map canvas fills wrapper |
| Touch targets | OK | NavigationControl/attribution are MapLibre defaults, unchanged; Google Maps link keeps `min-h-11` |
| Viewport / reduced motion | OK | `fadeDuration` still honours `prefers-reduced-motion` (LazyMap.tsx:73) |
Not browser-verified at 375/768: only a desktop-width screenshot was provided. The low risk is that the full-width (`compact: false`) attribution string, which is longer than the old OSM line, wraps to 2 lines on 375px. That is cosmetic and not a FAIL, but worth checking on staging.

## Skill gates
- aislop: skip, not run in reviewer sandbox (diff is 2 small hunks, no slop patterns observed manually)
- oxlint (anti-slop): skip, oxlint not configured (no `.oxlintrc.json`); eslint PASS used instead
- ocr (open-code-review): skip, ocr not installed
- AI-readable: OK — constant name `MAP_STYLE_URL` is clear, no magic numbers added, no indirection, comment explains the reason; 0 indicators. ARCHITECTURE.md/design-spec follow-up is recorded in the task (files dirty from other work).
- ai-friendly-web: N/A (no change to public crawl surface)
- blitzstrike: N/A (no auth/input surface; only a third-party read-only asset host added)

## Findings
- **[CRITICAL]** none
- **[MAJOR]** none
- **[MINOR]** Map labels: Liberty uses `name_en`/Latin names, so labels show "Kinh Bac Ward" and "Vo Cuong Ward" instead of the Vietnamese names the old OSM raster showed. This is a visible UX regression for a Vietnamese site. It is already logged as residual and as a follow-up in the task. Suggested follow-up (separate task): after `load`, `setLayoutProperty` each symbol layer's `text-field` to `["coalesce", ["get","name:vi"], ["get","name"]]` for locale `vi`.
- **[MINOR]** No error state if the OpenFreeMap style fails before `load` (no SLA). This is documented in Residual risk with a reasonable justification. Suggested follow-up: listen once for `error` before `load` and check `e.sourceId`/style-level error to set phase `error`.
- **[MINOR]** The doc impact rows are pending: `SPECIFICATIONS.md` line 120 (spec-publisher), `docs/ARCHITECTURE.md:68` and `.context/design-spec.md:206` (follow-up). They must be closed or tracked before close-out so the as-built docs do not keep saying "OpenStreetMap tiles".
- **[MINOR]** Test `LazyMap.test.tsx:122`: the `/key|token/` check on a constant URL string is now a tautology. It is optional to drop it or move it to the full options JSON.

## Residual risk
- OpenFreeMap has no SLA. The public instance sits behind Cloudflare, and the service could end without notice.
- ToS wording was not re-fetched by the reviewer, so the reviewer relies on the builder's 2026-11-18 reading plus known public terms.
- Approximate (circle) mode and 375/768 widths were not browser-verified. Staging is not verified (no deploy, per the user).

## Verdict
**PASS** — no CRITICAL/MAJOR; bug repro status PASS with verifiable evidence (failing-then-passing regression test + browser screenshot showing tiles and required attribution).
