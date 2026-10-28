# bug-listing-hero-search-scroll-focus · phase-1-task-01 — Ô tìm `ListingHero`: không cuộn về đầu + giữ focus khi Enter (BL-092)

- Change doc: `spec/changes/2026-10-28-listing-hero-search-scroll-focus.md` (BACKLOG BL-092, follow-up BL-089). User duyệt 2026-10-28 "ghi BL rồi làm luôn đi" (batch follow-up, không checkpoint lại).
- Phụ thuộc: BL-089 (commit 4b1b8e3 — `JobFilters` + `JobKeywordInput`).
- Trạng thái: `done`

## Classification / Risk
- Type: **BUG** (điều hướng UI + focus/a11y; không đổi API/schema/requirement).
- Risk: **MEDIUM** — `ListingHero` là component dùng chung (Dự án, Dự án danh mục, Cho thuê, Tin BĐS, Tin tức + bản `/en`); `JobKeywordInput` chuyển thành dùng chung (careers đổi import).
- Expected review level: **STRICT** (shared component nhiều trang).
- Doc impact: dự kiến `no doc impact` (hành vi mong đợi; không đổi contract).

## Repro (change-request, trước sửa — Playwright Edge, dev `next dev -p 3100`, HEAD 778b89f)
Kịch bản: mở trang, cuộn 150px (ô tìm vẫn trong khung nhìn — hero nằm đầu trang), gõ "ha noi", Enter / bấm "Tìm kiếm".
| Trang | Viewport | Enter: scrollY / activeElement | Nút: scrollY / activeElement |
|---|---|---|---|
| `/du-an` | 1920 | 150 → 0 / BODY | 150 → 0 / BUTTON |
| `/cho-thue` | 1920 | 150 → 0 / BODY | 150 → 0 / BUTTON |
| `/tin-bds` | 1920 | 150 → 0 / BODY | 150 → 0 / BUTTON |
| `/en/projects` | 1920 | 150 → 0 / BODY | 150 → 0 / BUTTON |
| `/du-an`, `/cho-thue`, `/tin-tuc`, `/tin-bds`, `/en/projects` | 390 | 150 → 0 / BODY | 150 → 0 / BUTTON |
- URL đúng `?q=ha+noi`; back về `/du-an` → ô rỗng (hành vi `key` đúng, phải giữ).
- Ảnh: `.context/review-reports/assets/bl092-before-*.png`.

## Root cause (đọc code — không Explore; cùng root cause BL-089)
1. `src/components/listing/ListingHero.tsx:59` `<Form action=… >` (next/form) không truyền `scroll` → mặc định `true` → sau soft navigation Next cuộn về đầu trang.
2. `src/components/listing/ListingHero.tsx:64-65` ô `q` có `key={search.value ?? ""}` → `q` trên URL đổi → React remount input → Enter trong ô làm focus rơi về `body`. (Nút không remount → giữ focus.)

## Thiết kế fix (dùng lại BL-089, không nhân bản)
1. `<Form … scroll={false}>` trong `ListingHero` (một chỗ → mọi trang hưởng).
2. Chuyển `src/components/careers/JobKeywordInput.tsx` thành component dùng chung (vd `git mv` → `src/components/listing/KeywordSearchInput.tsx`, export tên trung tính, giữ nguyên logic `lastKeyword` ref + effect, JSDoc cập nhật). `JobFilters` đổi import; `ListingHero` dùng nó với `keyword={search.value ?? ""}` thay cho `<Input key defaultValue>` (giữ mọi prop/className/aria hiện có). Xoá comment `key` cũ.
   - `ListingHero` vẫn là Server Component; component input là `"use client"` (đã có) → OK.
   - `FocusListingSearch` (`/cho-thue` focus ô qua selector `form[role="search"] input[name="q"]`) phải vẫn chạy — giữ `name="q"` trong form role=search.
3. Không đụng `PageHero`, các `*ListPage`, chip/pagination.

## Files
- `src/components/listing/ListingHero.tsx`, `src/components/careers/JobKeywordInput.tsx` → file chung mới, `src/components/careers/JobFilters.tsx` (import), test: `src/components/listing/` (test mới hoặc bổ sung `listing-layout.test.tsx`), `JobFilters.test.tsx` nếu import/mock đổi.
- CẤM sửa/stage: `.claude/**`, `.gitignore`, `package.json`, `pnpm-lock.yaml`, `src/app/(payload)/admin/importMap.js`, `src/collections/*`, `src/fields/*`, `src/components/admin/WardField*`, `tools/**`, `tests/e2e/admin/`, `playwright.config.ts`, `docs/content-intake/`, `docs/testing/`, `spec/**`, `.context/**` (trừ ảnh repro builder ghi vào `.context/review-reports/assets/bl092-*`).

## Acceptance
- [ ] Enter / nút: scrollY giữ nguyên (không về 0) trên `/du-an`, `/cho-thue`, `/tin-tuc`, `/tin-bds`, `/en/projects` (+ 1 trang `/du-an/danh-muc/<slug>` nếu có dữ liệu), Edge 1920 + 390.
- [ ] Enter: `document.activeElement` = ô `q`; nút: focus ở nút.
- [ ] URL giữ `q` + preservedParams; back/chip "Tìm nhanh" đổi `q` → ô nạp lại; SSR vẫn có `<form method GET action>` + `input name=q` + giá trị (no-JS).
- [ ] Test: khoá `scroll={false}` trên form ListingHero + không remount input khi `value` đổi (FAIL trước / PASS sau). Test BL-089 của JobFilters vẫn PASS.
- [ ] `pnpm typecheck` · `pnpm lint` (toàn repo) · vitest unit liên quan · `pnpm build` PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Decision log
- 2026-10-28 (change-request): repro xác nhận cả 2 lỗi trên mọi trang đo; root cause có `file:line` → không Explore. Chọn chuyển `JobKeywordInput` thành dùng chung thay vì copy.

## Repro Verification
- Original repro: mở trang danh sách, cuộn 150px, gõ "ha noi", Enter / bấm "Tìm kiếm" (Edge 1920 + 390, dev :3100).
- Expected: scrollY giữ 150; Enter → activeElement INPUT[name=q]; nút → BUTTON; back → ô rỗng.
- Actual before fix: scrollY 150 → 0; Enter → BODY (bảng ở mục Repro phía trên).
- Actual after fix (builder, attempt 1): scrollY 150 → 150 ở mọi trang/viewport đo; Enter → INPUT[name=q]; nút → BUTTON; back về trang gốc → ô rỗng; URL `?q=ha+noi` đúng.
| Trang | 1920 | 390 |
|---|---|---|
| `/du-an` | 150/150, INPUT, BUTTON | 150/150, INPUT, BUTTON |
| `/du-an/danh-muc/can-ho-chung-cu` | idem | idem |
| `/cho-thue` | idem | idem |
| `/tin-tuc` | idem | idem |
| `/tin-bds` | idem | idem |
| `/en/projects` | idem | idem |
| `/en/news` | idem | idem |
- `/cho-thue?q=` (header `searchHrefFor`): sau load activeElement = INPUT[name=q] (FocusListingSearch còn chạy).
- Ghi chú đo: `/tin-tuc` + `/en/news` 1920 timeout `networkidle` sau điều hướng (trang có request nền, không liên quan fix) → đo lại bằng `waitForLoadState("load")`, kết quả như bảng.
- Test: `src/components/listing/ListingHero.search.test.tsx` (mới, 2 test) — trên code cũ FAIL cả 2 ("expected undefined to be false"; input bị remount), sau fix PASS.
- Verify: `pnpm typecheck` OK · `pnpm lint` toàn repo exit 0 · vitest listing/careers/rentals/news/posts/projects 36 file, 466 test PASS (+ 2 mới sau đó, listing+careers 11 file 131 PASS) · `pnpm build` OK.
- Status: PASS (chờ reviewer).
- Residual risk: nhân đôi tiêu đề "Từ khoá" không đổi; ảnh before/after `bl092-after-*.png` có thể đã ghi vào .context/review-reports/assets (script repro).

## Decision log (builder)
- 2026-10-28: `git mv` JobKeywordInput → `src/components/listing/KeywordSearchInput.tsx` (đổi tên export, logic giữ nguyên); `JobFilters` + `ListingHero` dùng chung; `ListingHero` Form `scroll={false}`, bỏ `key` + `defaultValue`. Test mới tách file riêng (mock next/form) vì listing-layout.test dùng Form thật.

## Close-out (change-request)
- r1 STRICT PASS, 2 MINOR — change-request sửa trước commit: MINOR-1 comment `scroll={false}` chuyển lên cạnh `<Form>`; MINOR-2 test dùng `import type { ReactNode }` thay `React.ReactNode`. Sau sửa: eslint listing+careers, `pnpm typecheck`, vitest listing+careers 11 file / 131 test, `pnpm lint` toàn repo exit 0.
- `pnpm build` PASS theo builder (trước 2 sửa MINOR — chỉ comment + type import).
- Spec: no spec change (giữ 1.61.0); test-scope v94 (v93 archive). Doc impact: no doc impact.
- Residual: no-JS form GET vẫn tải trang mới về đầu (chấp nhận, như BL-089); reviewer không tự đo 768px và `/tin-tuc`, `/en/*`, `/du-an/danh-muc/*` (builder đã đo 1920+390, cùng component). `/tin-tuc`, `/en/news` 1920 không đạt `networkidle` sau tìm (request nền) — đo theo `load`.
