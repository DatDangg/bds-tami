Agent: reviewer

# Review: feature-public-ui-market-vinhomes · phase-2-task-02 · round 3
> Report do primary lưu (guard chặn reviewer ghi `.context/review-reports/**` trong worktree).

- **Review level:** STRICT
- **Reason:** đổi layout dùng chung mọi trang (`loadShell`, `ShellView`, `PublicShell`), thêm phụ thuộc cache cho mọi trang, ảnh hưởng ISR (round 2 hỏng vì slot `@banner` làm route ● → ƒ).
- **Blast radius:** `load-shell.ts`, `shell-data.ts`, `PublicShell.tsx` → qua `PublicDocument` tới `[locale]/layout.tsx` + `global-not-found.tsx` (mọi route VI/EN + 404). Tag `global:homepage` thành phụ thuộc của mọi trang (lưu global Trang chủ, lưu dịch vụ, gỡ xuất bản dự án/tin BĐS — `src/hooks/homepage/revalidate-homepage.ts:23-27` — làm mới ISR toàn site). Bundle client mọi trang thêm `HomeAnnouncementBar` + `AnnouncementBar`. Phần chỉ trang chủ: `HeroSearch`, `HeroSlider`, `HomeBlocks`, `home-view`, `home-queries`, `load-home`, i18n.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (0 error, 2 warning cũ) |
| `pnpm typecheck` | PASS |
| `pnpm vitest run src/components src/lib src/i18n src/app` | PASS 1720/1720 |
| `pnpm test` (builder) | 266 files / 2807 PASS |
| `pnpm build` (primary, worktree sạch `build-p2t02r3`) | PASS; **bảng route giống hệt bản r1** (không còn ● → ƒ) |
| Trình duyệt (primary, `next start` :3020) | thanh trên cùng 44px, header ngay dưới và dính top 0 khi cuộn; đóng → khoá `tami:announcement-dismissed:vi`, tải lại ẩn trước paint, CLS 0; `/en` vẫn hiện thanh EN; điều hướng client `/` → `/du-an` mất thanh; `/du-an`, `/tin-tuc` không render thanh; 404 `/en/khong-ton-tai`, `/wp-login.php` đủ trang global-not-found; 375 không cuộn ngang |

## STRICT checklist
1. Slot đã gỡ sạch (không còn `src/app/**/@*/**`, không `@banner`; `resolve-missing-page.test.ts` chỉ khác CRLF; `loadAnnouncement` đã xoá) ✅
2. `loadShell` (`load-shell.ts:42-48, 64`) dùng `getHomepage(locale)` cùng entry `unstable_cache` (key `["global","homepage",locale]`, tag `global:homepage`, revalidate 60 — `get-globals.ts:16-28`), bọc `readOrNull` → lỗi thì `announcement: null`, shell vẫn render; trang 404 đi cùng đường, wrapper trả `null` ✅
3. Props: `ShellView.announcement` (`shell-data.ts:76-77`); `PublicShell` render sau `SkipLink`, trước `Header` (`PublicShell.tsx:23`) ✅
4. Pathname: `usePathname` của next-intl (`HomeAnnouncementBar.tsx:13`), `localePrefix: "as-needed"` + `pathnames` (`routing.ts:49-50`) → `/` và `/en` đều `"/"`, `/en/projects` → `/du-an` ✅
5. Hydration: script chỉ ở server + lần hydrate đầu (`AnnouncementBar.tsx:56`), `suppressHydrationWarning` đúng chỗ ✅
6. Revalidation: tag làm mới cả payload đã serialize ở trang khác ✅ (chi phí: MINOR 1)
7. Payload ~200B mỗi trang: chấp nhận (cách khác phá ISR hoặc gây CLS) ✅
8. Test `PublicShell.test.tsx:61-94` (thứ tự, `/en` có, `/du-an` `/cho-thue` `/en/projects` không, `null` không render) ✅
9. Docs DESIGN.md + design-spec §1a khớp round 3 ✅
10. File cấm không đụng; `payload-types.ts` không đổi; `importMap.js` CRLF ✅

## Responsive gate
Không cuộn ngang (primary đo 375); `max-w-container`, token khoảng cách; chữ rem; nút đóng `size-11`, thanh `min-h-11`; reduced motion OK; không `overflow:hidden`.

## Skill gates
aislop skip · oxlint skip (ESLint PASS) · ocr skip · AI-readable OK (0 chỉ báo) · ai-friendly-web N/A · blitzstrike N/A.

## Findings
Không CRITICAL, không MAJOR.
- **[MINOR] 1** `src/components/layout/load-shell.ts:47` + `src/hooks/homepage/revalidate-homepage.ts:25`: mọi trang phụ thuộc `global:homepage` → các thao tác trên làm mới toàn site. Đúng và rẻ ở quy mô hiện tại; nên ghi 1 dòng vào docs. → **Primary đã thêm vào `docs/DESIGN.md` (dòng Announcement Bar).**
- **[MINOR] 2** `load-shell.ts:41-64` chưa có test wiring (`getHomepage` lỗi → `announcement: null`). Rủi ro thấp (thành phần đã test riêng).
- **[MINOR] 3** announcement serialize vào payload RSC mọi trang (~200B) — chấp nhận.

## Residual risk
CWV thật (LCP/CLS) trang chủ có ô tìm kiếm + thanh thông báo chưa đo trên host giống production.

## Verdict: PASS
