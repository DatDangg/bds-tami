# bug-admin-misc-needs-repro · phase-1-task-03 — Toast "Fetching user failed: Failed to fetch" khi chuyển trang nhanh (#16)

- Change doc: `spec/changes/2026-10-19-admin-misc-needs-repro.md` (BACKLOG BL-023, bug #16)

## Classification / Risk
- Type: **BUG** (UX — lỗi giả) · Severity: **low–medium** (toast đỏ gây hoang mang, không mất dữ liệu)
- Root cause category: điều hướng toàn trang (link `<a href>` thường trong admin) + Payload `AuthProvider` toast mọi lỗi fetch
- Risk: **MEDIUM** — chạm provider admin (mọi màn) + dashboard; không đổi auth/session/token logic, không đổi schema/API.
- Expected review level: **STRICT** (provider dùng chung + gần auth/session) · Blast radius: dashboard `/admin`, banner dịch lỗi, toast admin toàn cục.
- Doc impact: dự kiến `no doc impact` · Decision impact: không.

## Repro / evidence (2026-10-20, dev, Chrome)
- Toast phát ra từ `node_modules/@payloadcms/ui/dist/providers/Auth/index.js:376-377` (Payload 3.91.0) — `fetchFullUserResult` bắt **mọi** lỗi của `GET /api/staff/me` và `toast.error(\`Fetching user failed: ${e.message}\`)`. `fetchFullUser` chạy khi `AuthProvider` **mount** (`fetchUserOnMount`, dòng ~389-395) và khi đồng bộ phiên giữa tab (`reconcileSession`).
- `"Failed to fetch"` = `TypeError` lỗi mạng (không phải `AbortError`). Đo: fetch còn treo khi trang điều hướng toàn trang (`location.href = …`) bị reject `TypeError: Failed to fetch` **trên trang cũ**, ngay trước `pagehide` (log: `nav@308 | beforeunload@308 | ERR Failed to fetch@708 | pagehide@708`).
- Dashboard admin dùng `<a href>` thường cho link nội bộ → **mỗi click tải lại toàn bộ admin** (AuthProvider mount lại → `/api/staff/me` + ~15 request của `TranslationFailedBanner`, `payload-preferences`… ở mount): `src/components/admin/dashboard/DashboardHeader.tsx:33`, `NavGroupCards.tsx:18`, `RecentLists.tsx:28,37,66`, `StatCards.tsx:31`, `src/components/admin/TranslationFailedBanner.tsx:77`. Bấm tiếp trong lúc trang mới còn đang mount → các request mount (gồm `/me`) bị huỷ → Payload toast.
- Điều hướng client (sidebar Payload `Link`): 3 vòng Cho thuê → Lead → Dashboard cách 300ms — **không** toast, `AuthProvider` không mount lại (kiểm bằng MutationObserver `[data-sonner-toast]`).
- `SessionKeepAlive` (`src/components/admin/SessionKeepAlive.tsx`) **không** phải nguồn: nó gọi `refreshCookieAsync` (POST `refresh-token`, tối đa 1 lần/15 phút) — lỗi của nhánh đó có chữ "Refreshing token failed", không phải "Fetching user failed".
- Giới hạn evidence: chưa chụp được khung hình toast trong automation (thời điểm reject trùng lúc commit trang mới); cơ chế (nguồn toast + reject khi điều hướng toàn trang + link `<a>` gây điều hướng toàn trang) đã chứng minh.

## Fix (phạm vi) — quyết định agent (user ủy quyền 2026-10-20)
1. **Bỏ điều hướng toàn trang trong admin**: các link nội bộ admin ở dashboard + `TranslationFailedBanner` đổi `<a href>` → `next/link` `Link` (`prefetch={false}` như `LinkedCell.tsx`). Giữ nguyên class/markup/a11y. Không đổi `CvDownloadButton` (tải file, có `download`).
2. **Chặn toast giả lúc trang đang rời đi** (cho các điều hướng toàn trang còn lại: F5, back/forward không bfcache, gõ URL): provider client nhỏ (đăng ký ở `admin.components.providers` cạnh `SessionKeepAlive`, hoặc gộp vào file riêng `src/components/admin/…`) — khi `beforeunload` (không bị `preventDefault`) gắn `data-…` lên `<html>`; CSS ẩn `.payload-toast-container` khi có cờ; gỡ cờ ở `pageshow` và khi người dùng tương tác lại (`pointerdown`/`keydown`) → nếu điều hướng bị huỷ (vd. phản hồi tải file) toast thật vẫn hiện lại. Lỗi mạng thật khi **không** điều hướng (offline, server chết) **vẫn** toast như cũ.
- Không patch `node_modules`/patch-package, không bắt/nuốt lỗi trong `SessionKeepAlive`.
- Test: unit cho provider (beforeunload → cờ; pageshow/tương tác → gỡ; `defaultPrevented` → không gắn) + test component dashboard/banner render `Link` (href đúng) — fail trước, pass sau.

## Acceptance
- [x] Bấm nhanh Dashboard → thẻ Cho thuê → Lead (dashboard) không tải lại toàn trang (AuthProvider không mount lại) và không có toast "Fetching user failed".
- [x] Đang điều hướng toàn trang (F5/back) → toast của trang cũ không hiện. (unit test + cơ chế)
- [x] Lỗi mạng thật không do điều hướng vẫn hiện toast (cờ chỉ bật sau `beforeunload`).
- [x] `pnpm test`, `pnpm lint`, `pnpm typecheck` PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Verification summary
- Link nội bộ dashboard (Header/NavGroupCards/RecentLists/StatCards) + TranslationFailedBanner đổi `<a>` → `next/link` `prefetch={false}`; mọi href đều nội bộ `/admin/...`. Test DashboardParts vẫn assert href đúng (pass).
- Provider mới `NavigationToastGuard` (+ `_navigation-guard.scss`, đăng ký `admin.components.providers`, importMap). beforeunload đặt `html[data-admin-navigating-away]`; `setTimeout(0)` đọc `event.defaultPrevented` để gỡ cờ khi hộp thoại bị huỷ; pageshow/pointerdown/keydown gỡ cờ. Test fail trước (module chưa có) → 9 test pass sau.
- `pnpm test`/`lint`/`typecheck`: pass (1 lần chạy full có 1 fail thoáng qua ở admin-mobile-overflow.test.ts của builder khác, chạy lại pass).

## Repro Verification
Status: PASS. (a) /admin: MutationObserver `[data-sonner-toast]` + window marker; click stat card `a.tami-dash-stat` (→ /admin/collections/leads?where…status=new), 400ms later click `a[href=/admin/collections/leads]`, 400ms later history.back(): window marker kept (no full-page reload → AuthProvider not remounted, no new mount `/api/staff/me`), 0 toasts. (b) Before fix the same dashboard links were `<a href>` and each click was a full reload (network log: new `GET /api/staff/me` + ~15 mount requests per click). (c) Guard: dispatch `beforeunload` → `<html data-admin-navigating-away="true">`; `pointerdown` → attribute removed. (d) Sidebar client nav 3 rapid cycles Cho thuê→Lead→Dashboard (300ms): 0 toasts. Limitation: F5 while `/me` pending not reproducible deterministically in automation (rejection coincides with document commit); covered by guard unit tests.

Attempt 2 (review round 1): thêm gỡ cờ ở `focus` (mailto:/tel:; không dùng timer/visibilitychange — lý do trong comment), test thứ tự listener (preventDefault đăng ký sau), test `DashboardLinks.test.tsx` mock `next/link` assert link dashboard dùng Link.

## Doc impact / Reconcile
- no doc impact — không đổi API/schema/auth; điều hướng dashboard đổi sang client-side (hành vi người dùng thấy không đổi, chỉ không tải lại toàn trang).

## Review
- Round 1 STRICT FAIL — `.context/review-reports/bug-admin-misc-needs-repro-phase-1-task-03-round-1-review.md` (MAJOR thiếu Repro Verification; MINOR cờ kẹt khi mailto/tel; MINOR test thứ tự defaultPrevented).
- Round 2 STRICT PASS — `.context/review-reports/bug-admin-misc-needs-repro-phase-1-task-03-round-2-review.md` (đã xử lý hết; MINOR mới: banner chưa có test mock Link; `pnpm test` 277 file / 2890 test PASS).

## Residual risk
- F5/back khi `/me` còn treo chưa có evidence trình duyệt (chỉ unit test + cơ chế CSS).
- Chọn "Rời trang" trong hộp thoại chưa lưu của Payload: toast giả có thể chớp lên (như trước fix).
- Gõ URL ở thanh địa chỉ: nếu trình duyệt trả focus về trang cũ trước khi commit, cờ có thể bị gỡ sớm.
- Firefox có thể bỏ bfcache cho trang admin do listener `beforeunload` (ảnh hưởng thấp).
- Điều hướng dashboard bằng `next/link` không hiện thanh tiến trình route của Payload (giống `LinkedCell`).
- Không chụp được khung hình toast gốc trong automation; cơ chế nguồn toast đã chứng minh.
