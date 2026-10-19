Agent: reviewer

# Review: feature-public-ui-market-vinhomes · phase-2-task-04 · round 2
> Report do primary lưu (guard chặn reviewer ghi `.context/review-reports/**` trong worktree).

- **Review level:** STRICT
- **Reason:** lớp truy vấn dùng chung mọi khối trang chủ (`HOME_PROJECT_FIELDS` — nguyên nhân hồi quy P2-T03), đổi luật hiện khối (`visibleBlockKeys`), `NewsCard` dùng chung (S10, danh sách tin), hook revalidate Rentals/News, docs hệ thiết kế (tokens §0).
- **Blast radius:** `src/lib/home/{home-queries,home-view,home-view-listings,load-home}.ts`; `src/components/home/{ProjectsSlider,HomeBlocks,HomeRentals,RentalsTabs,HomeNews}.tsx`; `src/components/news/NewsCard.tsx` (prop tuỳ chọn); i18n `page.home.{rentals,news}.defaultTitle`; `.context/design-spec.md`, `skills/react-nodejs/design-tokens.md` §0, `docs/DESIGN.md`. Hook/collection không đổi từ round 1.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (0 error, 2 warning cũ) |
| `pnpm typecheck` | PASS |
| `pnpm vitest run src/components src/lib src/i18n src/app src/hooks` | PASS 189 files, 1856 tests |
| `pnpm vitest run tests/integration/homepage.test.ts` (`tami_wt_bl020`) | PASS 27 tests |
| **Primary:** build sạch `build-p2t04r2` | PASS, bảng route không đổi |
| **Primary:** runtime `next start` + DB seed-scraped | `/` có h2 "Thuê nhà ở & kinh doanh" (4 tab: can-ho-chung-cu, can-ho-dich-vu, studio, van-phong) + "Tin tức" (3 bài); log server **0** `MISSING_MESSAGE` (round 1: 36) |

## Đóng finding round 1
| Finding | Trạng thái | Bằng chứng |
|---|---|---|
| MAJOR-R1 `t(undefined)` ở ProjectsSlider | Closed | `home-queries.ts:26` select thêm `salesStatus`, `scale`; `home-view.ts:210` `?? null`; `ProjectsSlider.tsx:85` ẩn badge khi null; `home-queries.test.ts:59-64` assert đúng `HOME_PROJECT_FIELDS` thật; `ProjectsSlider.test.tsx:95` case null |
| MAJOR-R2 khối ẩn khi thiếu tiêu đề | Closed | `home-view.ts:21,159` `TITLE_OPTIONAL_BLOCKS` = rentals, news (khối khác giữ luật cũ); `RentalsTabs.tsx:56`, `HomeNews.tsx:23` dùng `defaultTitle`; khớp schema (chỉ CTA có validator tiêu đề); `/en` không lộ chữ VI |
| MAJOR-1 khối tối thứ 2 | Closed | `design-spec.md:236,239,298,676`, `design-tokens.md:24`: "≤ 2 section nội dung tối (CTA + Tin tức)" |
| MINOR-1 tách `home-view.ts` | Closed | 296 dòng + `home-view-listings.ts` 64 dòng, import một chiều |
| MINOR-2 ranh giới với footer | Closed | `HomeNews.tsx:19` `border-b border-dark-border` |
| MINOR-3 `NewsCard` `sizes` | Closed | `NewsCard.tsx:18,36,51` `sizes ?? IMAGE_SIZES[variant]` |
| MINOR-4 thăm dò fallback | Closed | `home-queries.ts:162-165` lô 4, dừng khi đủ 4 tab; test 4 vs 7 lần gọi |
| MINOR-5 chú thích | Closed | `HomeNews.tsx:12` |
| MINOR-6 tín hiệu tab | Closed | `RentalsTabs.tsx:92`; tab chọn nền `bg-dark` ≈ 17:1; viền tab không chọn trang trí (nhãn chữ xác định control) |

Rà các `select` khác trong `src/lib/home/*` (chip dự án, ưu đãi, dịch vụ, tin tức, danh mục cho thuê): không còn thiếu field kiểu R1.

## Responsive gate (tính CSS)
Không cuộn ngang; min-width; grid `minmax(0,…)`; chữ token; `sizes`/aspect đúng; chạm 44px; reduced-motion. Chưa kiểm: vuốt thật, 3 cột tin ở 640–767px, nhãn tab dài ở 375px.

## Skill gates
aislop skip · oxlint skip (ESLint 0 error) · ocr skip · AI-readable OK (0 chỉ báo) · ai-friendly-web N/A · blitzstrike N/A.

## Findings (đều MINOR)
- **[MINOR-N1]** `tasks/feature-public-ui-market-vinhomes/phase-2-task-04.md:28,35` còn ghi luật cũ "tiêu đề bắt buộc, `/en` thiếu tiêu đề thì ẩn" (dòng 35 sẽ vào spec/updates). → **Primary đã sửa** + ghi diễn giải `SPECIFICATIONS.md:174` cho checkpoint.
- **[MINOR-N2]** `docs/DESIGN.md:62,283` chưa liệt kê khối Tin tức trong section tối. → **Primary đã sửa.**
- **[MINOR-N3]** seed `seed/sample/homepage.ts:87` thứ tự `… rentals, news, partners, ctaBanner` → khi `partners` chưa render, Tin tức (tối) sát CTA (tối), chỉ có viền `#2a2a2a`. → Primary ghi chấp nhận trong task file (admin đổi được thứ tự).
- **[MINOR-N4]** lớp lỗi R1 có thể quay lại (test view dựng doc bằng tay) → tuỳ chọn: kiểu view input `Pick<Project, keyof typeof HOME_PROJECT_FIELDS | "id">`.

## Residual risk
`/en` `visibleCategory` cần `hasEnglish` của danh mục tin khi `select: {category: true}` (cùng đường với danh sách tin hiện có, chưa kiểm lại); responsive chưa kiểm trình duyệt đủ mốc.

## Verdict: PASS
