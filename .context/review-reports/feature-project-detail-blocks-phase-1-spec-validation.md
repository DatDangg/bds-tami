# Spec validation — feature-project-detail-blocks · phase 1 · round 1

- Agent: spec-validator · Mode: **Phase review** (after T01 PASS r2, T02 PASS r1, STRICT)
- Change: BL-060 `project-detail-blocks` (MODIFY) · spec 1.49.0 / scope v64
- Worktree: `D:\prj\bds\.claude\worktrees\bl058-project-detail-blocks-5971d4` (mid-merge of `staging`, all staged; read-only inspection, no git write)
- Sources: `spec/changes/archive/2026-10-22-project-detail-blocks.md`, `tasks/feature-project-detail-blocks/phase-1-task-0{1,2}.md`, `SPECIFICATIONS.md:61`, `spec/updates/2026-10-22-project-detail-blocks.md`, `docs/ERD.md:223-225,252`, `docs/DESIGN.md:240,242,244`, `spec/test-scope/current.json`, `spec/CHANGELOG.md` (1.47.1 → 1.48.0 → 1.49.0), `migrations/20261022_110146_project_detail_blocks.ts` + `migrations/index.ts`, `git diff 1272255 HEAD -- src`.

## Verdict: ✅ COMPLETE (PASS)

All 6 acceptance items of the change doc are implemented, test-covered (vitest + browser evidence in task files), and the published spec/ERD/DESIGN/test-scope match the code (field names, migration name `20261022_110146_project_detail_blocks`, behavior). No stale "BL-058" reference points at this change; no conflict with staging BL-054 / BL-058 spec content after merge. Zero ❌, zero HIGH conflict, 1 ⚠️ (doc-only, non-blocking).

## Coverage matrix

| # | Requirement (change doc § Acceptance) | Implementation | Test | Spec/doc as-built | Status |
|---|---|---|---|---|---|
| 1 | Map fills aspect frame everywhere `LazyMap` is used, regardless of MapLibre CSS order; regression test | `src/components/media/LazyMap.tsx:204-207` — wrapper `absolute inset-0` + container `h-full w-full` (fix intact after staging merge) | `src/components/media/LazyMap.test.tsx:237-245` | `SPECIFICATIONS.md:61 (1)`, spec update, test-scope `BL-060 (1)` | ✅ |
| 2 | "… tương tự" band `bg-primary-subtle` (no hex) on 3 detail screens; AA contrast | `src/components/detail/SimilarCarousel.tsx:28`; shared by `ProjectDetail`, `SimilarRentals`, `RelatedPosts` | `project-detail.test.tsx`, `PostDetail.test.tsx`; browser computed rgb(248,243,235) (T01 Repro) | `SPECIFICATIONS.md:61 (2)`, `docs/DESIGN.md:240/242/244`, test-scope `BL-060 (2)` | ✅ |
| 3 | `amenities[].image` optional upload; migration versioned SAFE_ADDITIVE | `src/collections/Projects.ts`; migration only nullable `ADD COLUMN` + 4 FK `ON DELETE set null` + 5 index + rename of 1 duplicate index, `down` symmetric; `migrations/index.ts` registers `110146` after BL-054's two migrations | `project-detail-view.test.ts` "ảnh từng tiện ích (BL-060)"; integration `projects.test.ts` 36/36 (T02 review) | `docs/ERD.md:223,252`, spec update § Migration, test-scope `migration` | ✅ |
| 4 | ≥1 amenity with image → card slider; image-less items still shown; 0 images → old style | `ProjectAmenities.tsx:46-79` two modes via `hasImages` | `project-detail-blocks.test.tsx:15-34`; browser 1440/390 (T02 Repro) | `SPECIFICATIONS.md:61 (4)`, consistent with BL-056 (5) | ✅ |
| 5 | Location block: optional image + video URL + optional title; media card beside map + distances; facade video; no data → old layout | `Projects.ts` group `locationMedia`; `project-detail-view.ts` `toLocationMedia`; `ProjectLocation.tsx` spans; `ProjectLocationMedia.tsx`; `leaves.ts` `TRANSLATABLE_FIELDS.projects` | `project-detail-view.test.ts` "locationMedia (BL-060)"; `project-detail-blocks.test.tsx:36-75` | `SPECIFICATIONS.md:61 (3)(5)`, `docs/ERD.md:225,252`, test-scope `BL-060 (3)(5)` | ✅ |
| 6 | VI/EN; 1440 + 390 no horizontal overflow; typecheck · lint · test · build PASS | i18n `vi.json` / `en.json` | T01/T02 Verification + Repro; post-merge verify run by primary | spec update § Ảnh hưởng, test-scope `verification` | ✅ |

## Renumbering check (BL-058 → BL-060)

- Every `BL-060` reference is this change; every remaining `BL-058` reference is admin-form-ux-polish — legitimate.
- `spec/**`: `BL-058` appears only in admin-form-ux-polish artifacts or explicit "gốc BL-058 → đổi mã" notes. Branch `claude/bl058-…` and DB `tami_bl058` intentionally kept.
- Informational: commit subjects of `6ccfc29`, `0cfd396`, `725be17` carry `(BL-058)`; `043d7fa` documents the renumbering.

## Cross-doc conflict check (after staging merge)

- `SPECIFICATIONS.md`: BL-060 paragraph (line 61) in the BL-052 block, defers to BL-056 (5) for no-image amenities mode — consistent. BL-058 / BL-054 content untouched.
- `spec/CHANGELOG.md`: 1.47.1/v62 → 1.48.0/v63 → 1.49.0/v64 — monotonic.
- `migrations/index.ts`: BL-054 `022857`, `031905` then BL-060 `110146`; tables disjoint. Git rename-detection `043747.json → 022857….json` is only similarity, not a real move.
- `LazyMap.tsx` post-merge: BL-054 multi-office changes merged around the fix; fix intact.

## Gaps

- No `[MISSING]`.
- `[PARTIAL]` ⚠️ (doc-only, non-blocking): `docs/DESIGN.md:240` "Chi tiết dự án" row records only the `SimilarCarousel` background for BL-060; Vị trí 3-part grid and Tiện ích 2-mode are documented in `SPECIFICATIONS.md:61`, `docs/ERD.md:252`, `.context/design-spec.md:243` and the spec update. Optional clause at a later doc reconcile.

## Open items carried (not blocking)

- MINOR M-1..M-4 from T02 r1 review — listed in spec update, test-scope `riskNote`, change doc close-out.

## Residual risk

- Map on Cho thuê / Tin BĐS / Liên hệ only vitest-verified; `_projects_v` drafts with new fields not UI-checked; DB `tami` + staging not yet migrated.

## FAIL triggers

- ❌ count: 0 · HIGH conflict: 0 · ⚠️ count: 1 → **PASS**.

> Post-merge verify (primary, 2026-10-22): typecheck/lint/build PASS; test 416/418 file PASS, `access` + `media-upload` integration timed out in `beforeAll` under full-suite load → re-run alone 45/45 PASS.
