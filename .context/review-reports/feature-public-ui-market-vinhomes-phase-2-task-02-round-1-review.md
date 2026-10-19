Agent: reviewer

# Review: feature-public-ui-market-vinhomes · phase-2-task-02 · round 1 (thanh thông báo + hero + ô tìm kiếm)
> Report do primary lưu (guard chặn reviewer ghi `.context/review-reports/**` trong worktree).

- **Review level:** STRICT
- **Reason:** LCP trang chủ; `<script>` inline trước paint + `suppressHydrationWarning`; đọc/ghi `localStorage`; đổi shape dữ liệu dùng chung (`HomeView`, `HomeDocs`) quyết định hiển thị `/en`; widget a11y mới (tablist).
- **Blast radius:** `HomeBlocks`, `HeroSlider` (prop `children`, `hasAnnouncement`, `overlapsSearch`, nút cuộn); mới `AnnouncementBar`, `HeroSearch`, `src/lib/home/announcement-hash.ts`; `HomeView.announcement/heroSearch`, `HomeDocs.chipProjects` (mọi nơi dựng đã cập nhật); `loadHomeDocs` thêm 1 truy vấn `projects` song song (2 nếu chip chọn tay đều không công khai); `icons.ts` (`ArrowDown`); i18n `page.home.*` 2 ngôn ngữ; design-spec S01; DESIGN.md. Không đổi schema/API/auth; không đụng file cấm.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (0 error; 2 warning cũ) |
| `pnpm typecheck` | PASS |
| `pnpm vitest run src/components src/lib src/i18n src/app` | PASS 173 files, 1707 tests |
| `pnpm build` | primary: PASS ở worktree sạch `build-p2t02` |
| Trình duyệt (primary, `next start` :3020, DB dev bật thanh thông báo + 3 dự án nổi bật) | 1280: thanh thông báo hiện dưới header, ô tìm kiếm đè đáy hero (form `/cho-thue`, `q`), CLS đo = 0; chip "Dự án được quan tâm" hiện khi có dự án `isFeatured` (seed mặc định không có → ẩn đúng) |

## Kiểm trọng tâm
Script inline an toàn (thân cố định, chỉ `JSON.stringify` khoá hằng; hash base36 qua attribute React escape; chữ CMS không vào script) · app không có CSP → script inline được phép · hydration đúng (`useSyncExternalStore` server snapshot `false`, `suppressHydrationWarning` cùng `<section>`) · hash djb2 `text\nhref` · VI/EN: chỉ hiện khi `enabled` + chữ không rỗng, `/en` không fallback VI · link qua `resolveNavLink` (chặn `javascript:`) · form GET chỉ gửi `q` (`src/shared/types/api.ts:131`, `src/lib/search/url-params.ts:61`), `maxLength=100` · tablist đúng role/aria/roving tabindex, mũi tên trái/phải · chip: chỉ published, `/en` chỉ dự án có EN, giữ thứ tự admin, ≤ 6, bỏ trùng, fallback `isFeatured`, server `Promise.all`, không N+1 · cache như Dự án nổi bật (`Projects.ts:111`, ISR 60s) · LCP: slide 1 giữ `fetchpriority=high` · CLS: thanh `absolute` trong hero, card SSR `md:-mt-24` · reduced motion: cuộn `auto` · i18n đủ 2 ngôn ngữ · test có ý nghĩa.

## Responsive gate (tính CSS)
Không cuộn ngang; breakpoint min-width; chạm ≥ 44px (tab `h-11`, chip `h-11`, nút đóng `size-11`, submit `h-12`); hero `100svh`; reduced-motion OK; 640–767px nút cuộn không chồng chấm; ≥ md điều khiển `md:bottom-28` cách card 16px.

## Skill gates
aislop skip · oxlint skip (ESLint PASS) · ocr skip · AI-readable OK (1 chỉ báo: số padding hero `4.5rem`/`md:pb-52`/`md:bottom-28` gắn chiều cao thanh/card không qua token) · ai-friendly-web N/A · blitzstrike skip.

## Findings
- **[MAJOR] 1** Vị trí thanh thông báo lệch kế hoạch/change doc — `src/components/home/HomeBlocks.tsx:35-39`, `AnnouncementBar.tsx:51`. Task ghi "phía trên header", change doc #1 "trên cùng" (mẫu market); code đặt trong hero dưới header nổi (`top-(--header-offset)`), cuộn đi cùng hero, **mất hẳn khi homepage không có slide** dù admin bật. Decision log gọi là "hệ quả chấp nhận" nhưng không có user duyệt; design-spec 1a + DESIGN.md bị viết lại theo vị trí lệch. Sửa: (a) user chấp nhận ở checkpoint, hoặc (b) đưa thanh lên trên header (phần tử trong luồng, cao cố định, script trước paint giữ không CLS khi đã đóng; offset header/hero vẫn đúng).
- **[MINOR] 2** `HeroSlider.tsx:96-101` nút cuộn: đích = đáy hero − chiều cao `.site-header` (80/104px) nhưng card tìm kiếm đè 96px lên hero → tab của card bị header kính che (md lệch 16px trên viewport, lg 8px dưới thanh). Sửa: khi `overlapsSearch`, cuộn tới đỉnh vùng tìm kiếm − header (vd `scroll-mt-(--header-offset)`).
- **[MINOR] 3** `HeroSearch.tsx:180-185` tab Dự án không có ô tìm (do `/du-an` không có tham số từ khoá) — tuỳ chọn: dùng bộ lọc sẵn có (`category`, `province`, `status`) dạng select trong form GET, hoặc ghi gap.
- **[MINOR] 4** `src/lib/home/announcement-hash.ts:2` một khoá `localStorage` cho mọi ngôn ngữ → khách đóng ở `/` rồi `/en` thì `/` hiện lại. Sửa: khoá theo locale hoặc lưu tập hash.
- **[MINOR] 5** `HeroSearch.tsx:134-141` tablist thiếu Home/End.
- **[MINOR] 6** `HeroSearch.tsx:122` chú thích "S01.1c" → "S01.1b".
- **[MINOR] 7** `AnnouncementBar.tsx:78` điều hướng client tới `/` → React 19 dev log "Encountered a script tag…" (script không chạy; hành vi vẫn đúng nhờ `useSyncExternalStore`). Tuỳ chọn: chỉ render script ở server hoặc chú thích.

## Residual risk
CLS/LCP thật chưa đo lab; ẩn trước paint chỉ test jsdom; 375 thông báo dài 3 dòng có thể chạm tiêu đề slide; card 6 chip 2 hàng ở md; thêm CSP sau này cần nonce/hash.

## Verdict: FAIL
Chặn bởi MAJOR 1. Primary chọn (b) — đưa thanh lên trên header đúng change doc; sửa kèm MINOR 2–7 (MINOR 3: thêm select lọc dự án bằng tham số sẵn có).
