Agent: reviewer

# Review — feature-post-detail-unified-layout phase-1 task-01 — round 2 (BL-032)

- **Review level:** FAST
- **Reason:** Delta review only. The change since round 1 (NORMAL PASS) touches one prop-spread in `PostListPage.tsx` plus one test. It does not touch shared, API, auth or schema code. Builder and change-request already ran the scoped suite and it passed.
- **Blast radius:** The empty state of the `/tin-bds` list page and its category pages (`PostListPage` → `EmptyState` `backHref`). `EmptyState` itself is unchanged.

## Verify commands + result
- `pnpm vitest run src/components/posts src/lib/posts` → 6 files / 47 tests PASS
- `pnpm typecheck` (`tsc --noEmit`) → 0 errors. The conditional spread `{...(context ? { backHref: listPath } : {})}` is valid under `exactOptionalPropertyTypes`, because `backHref?: string` is either omitted or set to a string, never `undefined`.

## Delta check (MINOR-1 from round 1)
- `src/components/posts/PostListPage.tsx:70`: `backHref` is passed only when `context` is set (inside a category). On `/tin-bds` itself the link back to the same page is gone. **Fixed.**
- `src/components/posts/PostListPage.test.tsx:85-98`: the root-list test asserts there is no "Về danh sách" link. The category test asserts the link points to `/tin-bds`. Both cases are covered.

## Responsive Checklist Gate
N/A. The delta only changes whether one link renders. There is no CSS or layout change. The round 1 result still stands.

## Skill gates
- aislop: N/A (FAST delta, 1 line of logic)
- oxlint/anti-slop: lint was run by change-request with 0 errors; the reviewer did not rerun it (FAST delta)
- ocr: skip, ocr not installed
- AI-readable: OK (0 new indicators)
- ai-friendly-web: N/A (no change to the public surface)
- blitzstrike: N/A (not a STRICT task)

## Findings
- No new findings.
- MINOR-2/3/4 from round 1 are deferred and accepted as residual risk (per change-request).

## Verdict
✅ PASS
