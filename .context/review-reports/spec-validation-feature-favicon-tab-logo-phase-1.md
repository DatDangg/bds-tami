Agent: spec-validator

# Spec validation — feature-favicon-tab-logo (BL-048) · phase-1 · round-1

- Mode: spec validation of spec delta + phase review (implementation present on disk, uncommitted)
- Change doc: `spec/changes/2026-10-21-favicon-tab-logo.md`
- Spec delta: `SPECIFICATIONS.md:136` (F11 SEO, "**Icon tab trình duyệt (BL-048):**") — other SPECIFICATIONS.md hunks = BL-046, out of scope
- Task: `tasks/feature-favicon-tab-logo/phase-1-task-01.md`
- Implementation: `src/app/icon.png` (new), `src/app/apple-icon.png` (new), `scripts/gen-favicon.mjs` (new), `src/payload.config.ts:58-61` (admin.meta.icons +1 entry)

## Verdict: PASS (with 2 warnings)

0 ❌, 0 HIGH conflict, 2 ⚠️ (< 3 threshold).

## Coverage matrix — change doc acceptance ↔ spec ↔ implementation

| # | Requirement (change doc) | Spec (`SPECIFICATIONS.md:136`) | Implementation | Status | Note |
|---|---|---|---|---|---|
| A1 | Public pages vi + en show TAMI logo on tab | "mọi trang public (vi + en, kể cả trang 404/lỗi) … `<link rel="icon">` là logo TAMI" | `src/app/icon.png` (root file convention, covers `(frontend)/[locale]/layout.tsx`, `[locale]/not-found.tsx`, `[locale]/error.tsx`, `global-not-found.tsx`); proxy matcher `src/proxy.ts:48` excludes paths with `.` so `/icon.png` is not locale-rewritten | ✅ | Task verification summary: curl `/`, `/en`, `/khong-ton-tai`, `/en/khong-ton-tai` have icon link; `/icon.png` 200 image/png (builder evidence, not re-run here) |
| A1b | `/admin` shows TAMI logo | "và trang quản trị `/admin`" | `src/payload.config.ts:59` `rel: "icon"` → `/brand/tami-icon-gold.png` (pre-existing, kept) | ✅ | Admin uses untrimmed 256px source, public uses trimmed 64px — both are the spec'd source asset; acceptable |
| A2 | apple-touch-icon for iOS | "`apple-touch-icon` 180×180 nền đặc" | `src/app/apple-icon.png` 180×180, opaque (`removeAlpha()`, bg `#f7f5f4`, `scripts/gen-favicon.mjs:17-21`); admin `src/payload.config.ts:60` `apple-touch-icon` sizes 180x180 → `/apple-icon.png` | ✅ | Visually checked: cream background, gold roof centred, ~14% margin. `#f7f5f4` = `--color-bg` light (`src/app/(frontend)/globals.css:21`) |
| A3 | Readable at 16/32px on light and dark tabs | "đọc rõ ở 16/32px trên tab sáng và tối" | `icon.png` 64×64 transparent, roof trimmed to bbox and fit full width (`gen-favicon.mjs:8-12`) | ⚠️ | See W2 — light-gold glyph on white tab has low contrast; builder self-accepted ("hơi thấp, chấp nhận") |
| N1 | Source `public/brand/tami-icon-gold.png` | "nguồn `public/brand/tami-icon-gold.png`, nền trong suốt" | `gen-favicon.mjs:5` | ✅ | |
| N2 | No contract/schema change | "Không đổi schema/API." | Only static PNGs + `admin.meta.icons`; no migration, no collection/field change (diff of `payload.config.ts` = icons only) | ✅ | `no doc impact` consistent |
| N3 | Icon URL returns 200 | "URL icon trả 200" | builder curl evidence in task | ✅ | not re-run (read-only) |
| — | Spec covers "trang lỗi" | "kể cả trang 404/lỗi" | `src/app/global-error.tsx:48-51` renders own `<head>` with only robots + title — no icon link | ⚠️ | See W1 |

## Cross-doc / conflict check

| Check | Result |
|---|---|
| FR-ADM-19 (`SPECIFICATIONS.md:130`) "không icon" | Refers to sidebar menu items only; favicon unaffected. No conflict. Admin `graphics.Logo/Icon` untouched. |
| F11 SEO (`SPECIFICATIONS.md:135`) | Additive line; no overlap with meta/OG/hreflang/sitemap rules. Placement under SEO acceptable. |
| Design tokens | apple-icon bg uses light `--color-bg` `#f7f5f4`; gold glyph is brand logo (unchanged asset). No token conflict. |
| Proxy/i18n routing | `src/proxy.ts:48` skips `.*\..*` → `/icon.png`, `/apple-icon.png` served directly. OK. |
| Duplicate link on /admin | Task reports file-convention icons are not injected into `(payload)` layout; admin has 1 icon + 1 apple-touch-icon. OK. |
| Backlog | `spec/changes/BACKLOG.md:58` BL-048 still `pending` — expected until close-out. |

## Gaps / warnings

- **W1 [PARTIAL] — global-error page has no favicon.** Spec says "kể cả trang 404/lỗi"; `src/app/global-error.tsx` renders its own `<html><head>` without `<link rel="icon">`, and Next.js file-convention metadata is not applied to `global-error`. `[locale]/error.tsx` is covered (inside layout). Impact: tab icon missing only when root layout itself crashes (rare). Resolve by either (a) adding `<link rel="icon" href="/icon.png" />` to `global-error.tsx` head, or (b) narrowing spec wording to "404 + trang lỗi trong layout". Task: `tasks/feature-favicon-tab-logo/phase-1-task-01.md`.
- **W2 [Residual risk] — light-tab readability.** Acceptance A3 requires clear reading on light tabs; glyph is light gold gradient on transparent background, contrast against white tab is low (estimated < 2:1). This is the brand logo, so spec wording is not contradictory, but A3 is subjective — confirm visually at the human checkpoint (Chrome/Edge light theme, 16px). No code change mandated.

## Out of scope / not verified
- curl/HTTP checks not re-run (read-only validator; relied on task verification summary).
- Other uncommitted hunks in `SPECIFICATIONS.md`, `payload-types.ts`, `importMap.js` etc. belong to BL-046 — ignored.
