Agent: reviewer

# Review — bug-listing-hero-search-scroll-focus · phase-1-task-01 · round 1 (BL-092)

- **Review level:** STRICT
- **Reason:** `ListingHero` là component dùng chung (Dự án, Dự án danh mục, Cho thuê, Tin BĐS, Tin tức + `/en`); `JobKeywordInput` chuyển thành component dùng chung `KeywordSearchInput` (careers đổi import). Thay đổi điều hướng/focus trên nhiều trang public.
- **Blast radius:** `src/components/listing/ListingHero.tsx` → `ProjectListPage`, `RentalListPage` (+ `FocusListingSearch`), `PostListPage`, `NewsListPage` (cả trang danh mục); `src/components/listing/KeywordSearchInput.tsx` (rename từ `careers/JobKeywordInput.tsx`) → `JobFilters` (`/tuyen-dung`). Không đụng API/schema/auth/data.

## Diff đã soát
- `ListingHero.tsx`: `<Form … scroll={false}>`; `<Input key defaultValue>` → `<KeywordSearchInput keyword={search.value ?? ""}>`, giữ `name="q"`, `type="search"`, `maxLength`, `autoComplete`, `aria-label`, `placeholder`, `className`.
- `JobKeywordInput.tsx` → `listing/KeywordSearchInput.tsx` (git mv, similarity 83%): chỉ đổi tên interface/export; logic `lastKeyword` ref + effect giữ nguyên (không nhân bản logic BL-089).
- `JobFilters.tsx`: đổi import.
- Mới `ListingHero.search.test.tsx` (2 test).

## Kiểm theo yêu cầu
- **Root cause ↔ fix:** khớp 2 nguyên nhân trong task (next/form `scroll` mặc định true; `key` theo `q` remount input). OK.
- **RSC boundary:** `ListingHero` (Server Component) render `KeywordSearchInput` (`"use client"`), mọi prop truyền qua đều serializable (string/number). OK.
- **No-JS / SSR:** `KeywordSearchInput` render `<Input defaultValue={keyword}>` → HTML SSR có `value`; form vẫn `next/form` (GET, `action`). `listing-layout.test.tsx` (giá trị "vin", preservedParams) vẫn PASS. OK.
- **preservedParams:** dòng hidden input không đổi. OK.
- **Chip / back nạp lại ô:** effect đổi `input.value` khi `keyword` đổi; browser cross-check back `/du-an?q=ha+noi` → `/du-an`: `backInputValue: ""`. OK.
- **FocusListingSearch:** selector `form[role="search"] input[name="q"]` vẫn khớp (role/name giữ). Builder evidence `/cho-thue?q=` focus INPUT. OK.
- **Import cũ:** Grep `JobKeywordInput` trong repo (trừ node_modules/.next/.context/tasks/spec) → 0 kết quả. OK.
- **Test FAIL-trước/PASS-sau:** phân tích code: code cũ không truyền `scroll` → `formProps.last.scroll` undefined → test 1 FAIL; `key` đổi → node mới → `expect(after).toBe(input)` FAIL. Test có ý nghĩa, khớp evidence builder. PASS sau fix (tự chạy).

## Verify commands + result (reviewer tự chạy)
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | exit 0 |
| `pnpm lint` (toàn repo) | exit 0 |
| `pnpm exec vitest run src/components/listing src/components/careers src/components/rentals src/components/news src/components/posts src/components/projects` | 36 files / 466 tests PASS |
| `pnpm exec vitest run src/components/listing/ListingHero.search.test.tsx src/components/careers` | 4 files / 52 tests PASS (gồm test mới + test BL-089 JobFilters) |
| `pnpm build` | không chạy lại (builder báo PASS; diff không đổi config/route, typecheck+lint PASS) |
| Browser repro (`repro.mjs review`, Edge, dev :3100) | `/du-an`, `/cho-thue`, `/tin-bds` × 1920 & 390: scrollY 150→150; Enter → `INPUT[name=q]`; nút → `BUTTON`; URL `?q=ha+noi`; back `/du-an` → ô rỗng |

Ghi chú: lần chạy repro đầu `/du-an` lỗi URL do Git Bash chuyển path `/du-an` → `C:/Program Files/Git/du-an` (lỗi môi trường shell, không phải app); chạy lại với `MSYS_NO_PATHCONV=1` → PASS.

## Repro Verification (bug task)
- Original repro status trong task: `PASS`, có bảng before/after 7 trang × 2 viewport + test unit FAIL-trước/PASS-sau.
- Reviewer kiểm chứng độc lập 3/7 trang × 2 viewport bằng script → khớp. **Repro closure: verified.**

## Responsive Checklist Gate
Diff đụng component UI nhưng **không đổi markup layout/CSS** (className giữ nguyên, chỉ đổi component render input + prop `scroll`).
- Layout (horizontal scroll, mobile-first, grid): N/A — không đổi CSS; repro 390/1920 không lỗi điều hướng.
- Typography/Spacing: N/A — không đổi.
- Media: N/A — không đổi.
- Touch/Interaction: OK — ô `h-12` (48px) và nút không đổi; focus giữ sau Enter (cải thiện a11y).
- Viewport/A11y: OK — không thêm `100vh`/`overflow:hidden`; focus không còn rơi về `body`.
- Residual: chưa đo 768 bằng browser (CSS không đổi nên rủi ro thấp).

## Skill gates
- aislop: skip, aislop not installed.
- oxlint (anti-slop): skip, oxlint not configured (không có `.oxlintrc.json`); ESLint toàn repo exit 0.
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK — tên rõ (`KeywordSearchInput`), hàm < 15 dòng, không magic number mới, comment nêu WHY; 0 indicator.
- ai-friendly-web: N/A — không đổi route/robots/sitemap.
- blitzstrike: N/A — không có input/auth/API mới (ô `q` giữ `maxLength=100`, server validate như cũ).

## Findings
- **[MINOR-1]** `src/components/listing/ListingHero.tsx:63` — comment đặt trên `KeywordSearchInput` nhưng nói về `scroll={false}` của `<Form>` (dòng 59). Đề xuất (không chặn): tách phần `scroll={false}` thành comment gần `<Form>` hoặc giữ nguyên.
- **[MINOR-2]** `src/components/listing/ListingHero.search.test.tsx:12` — dùng kiểu `React.ReactNode` không import `React` (dựa vào global namespace của `@types/react`); typecheck PASS nên không lỗi, chỉ là style. Không chặn.

Không có CRITICAL/MAJOR.

## Residual risk
- 768px và `/tin-tuc`, `/en/*`, `/du-an/danh-muc/*` không được reviewer đo lại bằng browser (dựa vào evidence builder + logic dùng chung một component).
- Trường hợp server chuẩn hoá `q` (trim) → ô bị ghi đè bằng giá trị đã chuẩn hoá: hành vi chấp nhận được, giống `/tuyen-dung` (BL-089).

## Verdict
**PASS**
