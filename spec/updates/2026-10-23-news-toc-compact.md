# Spec Update — 2026-10-23 news-toc-compact

**spec_version:** 1.55.0 → 1.55.1 (PATCH — as-built mục lục gọn màn chi tiết tin tức, UI only)
**Trigger:** feature-update (BL-067, change-request class MODIFY)
**Work item:** `feature/news-toc-compact` phase 1 · T01 NORMAL PASS r1 · commit `6f66ea4`
**Change doc:** `spec/changes/archive/2026-10-23-news-toc-compact.md` · review `.context/review-reports/feature-news-toc-compact-phase-1-task-01-round-1-review.md`

## Requirements
- **SỬA (as-built) — S11 "Tin tức v2" cột trái chi tiết `/tin-tuc/[slug]` + `/en/news/[slug]`:** ≥ lg cột mục lục trái **16rem** (≥ xl **18rem**); mục ≥ 32px, số tròn 24px, cấp 3 thụt thẳng chữ cấp 2; mục lục chiếm phần cao còn lại của cột dính, chỉ tự cuộn (theo mục active) khi bài dài; bản gập < lg không đổi.
- Không đổi API, schema, URL, metadata, JSON-LD, i18n.

## Ảnh hưởng
- Module: `src/components/news/NewsToc.tsx`, `NewsArticleSidebar.tsx`, `src/app/(frontend)/[locale]/tin-tuc/[slug]/page.tsx`, test tương ứng; doc `.context/design-spec.md` S11, `docs/DESIGN.md`.
- Verify: vitest `src/components/news` 8 file / 98 test PASS; typecheck PASS; eslint sạch. Đo thực tế trên dev (primary): bài thật 5 heading → 1440×900 và 1280×800 nav scrollHeight = clientHeight = 333 (không cuộn); giả lập 10 mục 2 dòng ở 1440×900 → 681 > 527 → mục lục tự cuộn (chấp nhận, đúng thiết kế).
- Scope: `spec/test-scope/current.json` v72 (bản cũ v71 → `spec/test-scope/archive/test-scope-1.55.0-71.json`).
