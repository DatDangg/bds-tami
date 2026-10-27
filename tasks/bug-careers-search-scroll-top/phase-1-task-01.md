# bug-careers-search-scroll-top · phase-1-task-01 — Tuyển dụng: bấm "TÌM" không cuộn về đầu trang (BL-089)

- Change doc: `spec/changes/2026-10-27-careers-search-scroll-top.md` (BACKLOG BL-089, QA sheet dòng 11). User duyệt chạy batch BL-088..091 (auto proceed).
- Phụ thuộc: không.
- Trạng thái: `awaiting_review`

## Classification / Risk
- Type: **BUG** (hành vi điều hướng UI; không đổi API/schema/requirement).
- Risk: **LOW** — chỉ `src/components/careers/JobFilters.tsx` (+ test). Form GET, URL giữ tham số.
- Expected review level: **NORMAL** (1 component, có focus/a11y).
- Doc impact: dự kiến `no doc impact` (hành vi đúng như spec mong đợi; nếu design-spec mô tả bộ lọc tuyển dụng thì thêm 1 dòng as-built).

## Repro
- `/tuyen-dung` 1920×1080, khách: cuộn tới ô tìm (scrollY ~523) → nhập "tu van" → bấm TÌM (hoặc Enter) → URL `/tuyen-dung?province=&q=tu+van`, scrollY = 0.
- Expected: kết quả lọc, khu vực tìm/kết quả vẫn trong khung nhìn; focus không mất.

## Root cause (change-request, đọc code — không spawn Explore)
- `src/components/careers/JobFilters.tsx:36` `<Form action={actionPath} …>` (next/form) không truyền `scroll` → mặc định `true` → sau soft navigation Next cuộn về đầu trang. Không phải full reload.
- Rủi ro focus thứ 2: ô `q` có `key={keyword ?? ""}` (dòng ~61) → khi `q` trên URL đổi sau khi tìm, React remount input → nếu người dùng nhấn Enter trong ô, focus rơi về `body` (vi phạm acceptance "focus không bị mất"). Nút TÌM không remount nên bấm nút giữ focus.

## Thiết kế fix
1. `<Form … scroll={false}>` — cùng quy ước các bộ lọc listing khác (`use-listing-filter-nav.ts` `{ scroll: false }`). Không JS: form GET thường (trình duyệt tải trang mới, về đầu — chấp nhận, ghi residual).
2. Focus: bỏ remount theo `key` cho ô `q`; thay bằng client component nhỏ (vd `src/components/careers/JobKeywordInput.tsx` hoặc helper chung nếu đã có) đồng bộ giá trị khi `keyword` từ URL đổi (back / chip) mà KHÔNG remount (ref + effect: nếu `input.value !== keyword` thì gán). Giữ SSR `value`/`defaultValue` để no-JS vẫn có từ khoá. Builder kiểm tra có pattern sẵn trong repo (vd ô tìm listing/news) thì tái sử dụng.
3. Không đụng `ListingHero`, `NewsSortControl`, ChipRow/Pagination — chỉ ghi nhận.

## Files
- `src/components/careers/JobFilters.tsx`, `src/components/careers/JobFilters.test.tsx` (+ file client mới nếu cần).
- KHÔNG đụng file dirty của việc khác: `.claude/settings.json`, `.gitignore`, `package.json`, `pnpm-lock.yaml`, `src/app/(payload)/admin/importMap.js`, `src/collections/*`, `src/fields/ward-in-province.ts`, `tools/*`, `spec/changes/BACKLOG.md`, change doc chưa track trong `spec/changes/`.

## Acceptance
- [x] Bấm TÌM / Enter: kết quả cập nhật, scrollY giữ nguyên (không về 0), khu vực tìm/kết quả trong khung nhìn (Playwright 1920×1080 + 390).
- [x] URL giữ `?q=…&province=…` (và `category` nếu có); no-JS form GET vẫn tìm được (SSR có `<form action method GET>` + input name).
- [x] Focus: bấm nút → focus vẫn ở nút; Enter trong ô → focus vẫn ở ô `q` (document.activeElement) sau khi URL đổi.
- [x] Back / chip đổi `q` → ô nạp lại giá trị mới (hành vi cũ của `key` giữ được).
- [x] Test: unit khoá `scroll={false}` (hoặc mock next/form kiểm prop) + đồng bộ ô khi `keyword` đổi không remount. FAIL trước / PASS sau.
- [x] `pnpm typecheck` · `pnpm test` · eslint file đổi · `pnpm build` PASS. Dev server `http://localhost:3000` nếu đang chạy thì KHÔNG dừng.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Decision log
- 2026-10-27 (change-request): root cause có `file:line` từ change doc — không Explore. Ghi nhận form tương tự: `ListingHero` (`<Form>` trong hero đầu trang → cuộn về 0 gần như không đổi vị trí, nhưng cũng là `scroll` mặc định), `NewsSortControl` (có JS điều hướng bằng `useListingFilterNav` `scroll:false`; `<Form>` chỉ dùng no-JS) — không sửa trong task này.
- 2026-10-27 (builder): `<Form scroll={false}>` + client `JobKeywordInput.tsx` (ref + effect gán `input.value = keyword` khi khác, giữ `defaultValue` cho SSR/no-JS; không có pattern dùng chung sẵn trong repo — WardField/RangeSliderFacet là controlled, không hợp). Bỏ `key` khỏi ô `q`. Không đụng ListingHero/NewsSortControl.
- Môi trường: cổng 3000 trên máy là dự án khác (Thiệp Mời) → tự start Docker Desktop + `tami-postgres` (compose dev) và `next dev -p 3100`, đã dừng dev server của mình sau khi đo (Docker/postgres để chạy).

## Repro Verification
- Original repro: `/tuyen-dung` (Playwright Edge), cuộn rồi nhập "tu van", bấm TÌM / Enter.
- Expected: scrollY giữ nguyên; Enter giữ focus ở ô q; back nạp lại ô.
- Actual before fix (code HEAD): 1920: scrollY 207 → 0 (cả nút lẫn Enter); Enter: activeElement = BODY (mất focus); 390: 1252 → 0, Enter → BODY. URL `/tuyen-dung?province=&q=tu+van`.
- Actual after fix: 1920: 207 → 207; 390: 1252 → 1252; nút: focus ở BUTTON; Enter: activeElement = #job-filter-q. Back về `/tuyen-dung` → ô q rỗng (nạp lại đúng). URL giữ `province=&q=`.
- Evidence: ảnh `.context/review-reports/assets/bl089-{before,after}-{1920,390}.png`; test `JobFilters.test.tsx` (2 test mới FAIL trên code HEAD, PASS sau fix: scroll=false + cùng node input/focus khi keyword đổi).
- Status: PASS

## Close-out (change-request)
- r1 NORMAL PASS, 3 MINOR. MINOR-1 (effect chạy lúc mount ghi đè chữ gõ trước hydrate) — change-request sửa trước commit: `lastKeyword` ref, chỉ gán khi keyword URL thật sự đổi; vitest src/components/careers 50/50 + eslint 3 file + typecheck PASS lại. MINOR-2 (q chuẩn hoá có thể gán lại ô đang focus, focus không mất) — chấp nhận. MINOR-3: `pnpm build` PASS theo report builder attempt 1 (trước sửa MINOR-1; sửa chỉ là logic hook, typecheck PASS).
- `pnpm test`: 84 FAIL chỉ ở `tests/integration/*` (ECONNREFUSED Redis/S3 không chạy — môi trường, reviewer xác minh); unit PASS.
- Form tương tự: `ListingHero` cùng root cause (thiếu `scroll={false}` — form ở hero đầu trang nên gần như không nhảy; ô có `key={search.value}` → Enter mất focus, lỗi a11y thật) → đề xuất change riêng (có thể đưa JobKeywordInput thành dùng chung). `NewsSortControl` không cùng root cause (JS dùng useListingFilterNav scroll:false; Form chỉ no-JS).
- Residual: no-JS form GET vẫn tải trang mới và về đầu (chấp nhận); dữ liệu seed chỉ 3 job nên đo scrollY 207 (1920) thay vì ~523.
