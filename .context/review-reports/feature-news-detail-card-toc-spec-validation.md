Agent: spec-validator

# Spec validation — feature-news-detail-card-toc (BL-033) · pre-plan · round-1

Mode: Spec validation (delta-only, read-only). Code not evaluated (builder working in parallel).

Sources:
- Change doc `spec/changes/2026-10-20-news-detail-card-toc.md` (Acceptance L16-21)
- `SPECIFICATIONS.md` F5 L87 (paragraph "Chi tiết tin tức `/tin-tuc/[slug]` (BL-033 …")
- `.context/design-spec.md` header table L81, S11 L536-543 (blockquote "As-built BL-033"), S16 L602-608
- Task `tasks/feature-news-detail-card-toc/phase-1-task-01.md` (D1-D8)
- `docs/BRD.md` L144 (FR-PUB-08)

## Verdict: PASS

0 missing, 0 HIGH conflicts, 2 LOW notes (below the 3-warning FAIL threshold).

## Coverage matrix

| # | Acceptance (change doc) | Spec delta | Task | Status | Note |
|---|---|---|---|---|---|
| A1 | Background color like the detail pages; article (title, cover image, content, share) in a rounded white card | F5 L87: `DetailLayout`, `--color-primary-subtle`, ONE white card with 28px radius holding category/h1/date/image/content/tags/share; S11 L538 is the same | D1, D3 | OK | Related articles sit outside the card (matches the change doc note) |
| A2 | TOC on the left at ≥ lg, built from H2/H3, sticky, current section highlighted, click scrolls to the heading with header offset | F5: left column sticky at `var(--sticky-top)`, `aria-current`, `scroll-margin`; S11: active rule, `scroll-mt` = `--sticky-top` + 1rem, focus, real `#id` anchors | D2, D5, D6 | OK | See N2 on the header offset |
| A3 | A TOC longer than the viewport still works | F5: height limited to the viewport, scrolls inside its own frame; S11: `max-h`, `overscroll-contain`, active item scrolls into view inside the TOC frame only | D5 | OK | "Decide at build time" item is now decided |
| A4 | No headings → TOC hidden, card not shifted | F5 "không chừa cột trống"; S11 "lưới 1 cột, thẻ trắng không lệch" | D7, D2 | OK | |
| A5 | < lg: TOC does not take a left column | F5/S11: `<details>` collapsed by default, inside the card after the cover image and before the content | D5 | OK | "Decide at build time" item is now decided |
| A6 | Stable `id` (Vietnamese slug), CMS data unchanged, SEO/JSON-LD/URL unchanged, /en works | F5: slug without diacritics, duplicates get `-2`/`-3`, empty slug → `muc-N`, CMS unchanged, URL/metadata/canonical/JSON-LD `Article` unchanged; S11 title covers `/en/news/[slug]` | D4, D8 | OK | |

## Cross-doc consistency

| Check | Result |
|---|---|
| F5 rest (no form on news detail, BL-020 P3) | Consistent: the delta adds no form or contact card |
| S03/S07/S09 shared detail frame + header hidden on scroll (header table L81) | Consistent: the L81 row now lists "tin tức BL-033"; no sub-nav and no right column are stated explicitly |
| S16 legal TOC (≥ xl, 240px, `<details>` < xl, h2 only, `muc-N`) | No conflict: separate page and separate rules. Task D4 keeps `anchorSections`/`muc-N` unchanged. S16 is not modified |
| FR-PUB-08 (BRD L144: list, detail, related articles) | Intent unchanged; the TOC is user-requested UI within the scope of "chi tiết bài" |
| SEO/JSON-LD | Unchanged (F5 + S11 L543 `Article` + task D8) |
| S11 L540 "Như S09 bước 1-3 và 5" | The blockquote says outright that it replaces the layout and keeps the content of each part — no conflict |

## Notes (LOW, non-blocking)

- **N1 [LOW] S11 L543 "Responsive như S09"** is a little stale. S09 now has a sub-nav and a right contact card, while S11 has neither and adds a TOC. The BL-033 blockquote defines the responsive behavior in full, so this is not a real conflict. Suggestion: during doc reconcile, change it to "Responsive theo blockquote BL-033".
- **N2 [LOW] Acceptance A2 says "trừ chiều cao header nổi"** (subtract the floating header's height). The delta offsets only by `--sticky-top` + 1rem, because the header is hidden on detail pages after scrolling (L81). Some states keep the header visible: at the top of the page, when a header link has `:focus-visible`, and before hydration or without JS. In those states the header may cover the heading for a moment. This is the same risk the user already accepted on 2026-10-20 (L81) — record it as residual risk.
- Info: two rules appear only in S11, not in F5: "không trùng id sẵn có của trang" (no clash with existing page ids, e.g. `related-news`) and "ẩn khi in" (hidden when printing). This is acceptable because S11 is the detailed UI spec.

## Gaps

None [MISSING] / [PARTIAL].
