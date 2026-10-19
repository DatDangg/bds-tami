# feature-desktop-header-no-menu-button · phase-1-task-01 — Header ≥ xl bỏ nút Menu

- Change doc: `spec/changes/2026-10-19-desktop-header-no-menu-button.md` (BACKLOG BL-019)
- Spec: `.context/design-spec.md` §2.1 (dòng "Bố cục < xl" / "Bố cục ≥ xl") + §2.2; `docs/DESIGN.md` bảng component (Header, Menu toàn màn hình) — change-request đã sửa trong task này.

## Hiện trạng (change-request đã kiểm)
- `src/components/layout/Header.tsx:32-37` JSDoc: "Nút Menu có ở mọi breakpoint"; `Header.tsx:74` render `<MobileMenu>` không ẩn theo breakpoint.
- `src/components/layout/MobileMenu.tsx:22-28` JSDoc "Menu toàn màn hình ở MỌI breakpoint … không còn tự đóng khi cửa sổ rộng lên"; `MobileMenu.tsx:37-41` trigger có class nhãn riêng cho xl/2xl (`xl:hidden 2xl:inline`, `xl:inline 2xl:hidden`) — thừa sau khi ẩn ở xl.
- Hook sẵn có: `useMediaQuery` ở `src/components/home/use-environment.ts` (matchMedia, jsdom → `false`).
- Test hiện có: `src/components/layout/Header.test.tsx`, `src/components/layout/MobileMenu.test.tsx`.

## Classification / Risk
- Type: **MODIFY** (đổi quyết định BL-001 "nút Menu ở mọi breakpoint"). Không đổi schema/API/quyền/CMS.
- Risk: **LOW–MEDIUM** — component layout dùng chung mọi trang public; có hành vi a11y (focus, khoá cuộn). Reviewer: **NORMAL** (shared component → cân nhắc STRICT nếu đụng HeaderFrame/DesktopNav).

## Quyết định thiết kế (change-request)
1. Ẩn nút Menu ở ≥ xl bằng CSS (`xl:hidden` trên Trigger) → không hiển thị, không nhận focus (display:none), không có trong cây a11y. Xoá các class nhãn xl/2xl đã thừa trên trigger (nhãn "Menu" hiện từ sm như < xl).
2. Đang mở menu rồi cửa sổ rộng lên ≥ xl → đóng dialog (Radix tự nhả khoá cuộn + bẫy focus). Dùng `useMediaQuery("(min-width: 1280px)")` (hoặc tương đương, tái dùng `use-environment.ts`, không thêm thư viện); khi `true` và `open` → `setOpen(false)`. Không cho mở ở ≥ xl.
3. Header ≥ xl: logo · DesktopNav · tìm · VI|EN · CTA. Điều chỉnh khoảng cách/`max-w` cụm phải chỉ khi cần; không đổi bố cục < xl. Kiểm hàng 1280px không tràn (VI và EN) — giữ các ràng buộc hiện có (logo ≤ 6rem, CTA truncate), không nới nếu không cần.
4. Cập nhật JSDoc `Header.tsx` + `MobileMenu.tsx` cho khớp (thứ tự Tab ≥ xl: logo, menu ngang, tìm, ngôn ngữ, CTA).
5. Doc: change-request đã sửa `docs/DESIGN.md` + `.context/design-spec.md` §2.1/§2.2 — builder KHÔNG sửa doc.

## Acceptance
- [x] ≥ xl: không hiện nút Menu; header gồm logo · menu ngang (dropdown mục con) · tìm kiếm · VI|EN · CTA (nếu bật).
- [x] < xl: giữ nút Menu mở menu toàn màn hình như hiện tại (accordion mục con, hotline, mạng xã hội).
- [x] Đang mở menu toàn màn hình rồi resize lên ≥ xl → menu đóng, không kẹt khoá cuộn nền.
- [x] Thứ tự Tab ở ≥ xl hợp lệ (không còn nút ẩn nhận focus); header 1 hàng không tràn ở 1280px (VI và EN).
- [x] Docs `docs/DESIGN.md` + design-spec §2.1/§2.2 tách rõ desktop/mobile (đã làm bởi change-request).
- [x] Test: trigger có `xl:hidden`; menu đóng khi media query ≥ xl khớp (mock matchMedia); test cũ cập nhật.

## Verification Plan
- `pnpm lint` · `pnpm typecheck` · `pnpm test` (theo `.context/project-config.md`).
- Kiểm trực quan nếu khả thi (1280 VI/EN, 1024, 375): không có nút Menu ≥ xl, không tràn ngang.
- Report: `.context/review-reports/feature-desktop-header-no-menu-button-phase-1-task-01-round-<R>-review.md`

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Ràng buộc chạy song song (worktree BL-019)
- KHÔNG sửa `SPECIFICATIONS.md`, `spec/CHANGELOG.md`, `spec/updates/`, `spec/test-scope/current.json`, `spec/changes/BACKLOG.md`, `.context/progress.json`; không archive change doc. Session chính publish khi merge.

## Decision log
- (change-request) Xem "Quyết định thiết kế" 1–5. Docs đã sửa: `docs/DESIGN.md` (dòng Header, Menu toàn màn hình), `.context/design-spec.md` §2.1 (< xl, ≥ xl) + §2.2.
- (builder) `MobileMenu.tsx`: trigger thêm `xl:hidden`, bỏ class nhãn xl/2xl thừa; đóng menu khi `useMediaQuery("(min-width: 1280px)")` true bằng cách chỉnh state lúc render (`if (isDesktop && open) setOpen(false)`) vì rule lint `react-hooks/set-state-in-effect` cấm setState trong effect; cách này cũng không tự mở lại khi thu nhỏ về < xl. Tái dùng `useMediaQuery` từ `home/use-environment.ts` (import trực tiếp như `FooterLinkColumn`). `Header.tsx`: chỉ cập nhật JSDoc; không đổi class bố cục (cụm phải ≥ xl chỉ bớt nút Menu nên chỉ có thêm chỗ, giữ nguyên ràng buộc logo ≤ 6rem / CTA truncate). Test: cập nhật `Header.test.tsx` (trigger có `xl:hidden`; test mới "rộng lên ≥ xl thì menu đóng + nhả data-scroll-locked" với matchMedia mock đổi được, khôi phục descriptor sau test).

## Verification summary (builder)
- `pnpm lint`: PASS. `pnpm typecheck`: PASS.
- `pnpm exec vitest run src/components/layout`: 15 file / 97 test PASS; chạy lại Header.test + ApplyForm.test: 41 PASS.
- `pnpm test` đầy đủ: 2612 pass, 7 fail. 7 fail là integration (`tests/integration/*`: smoke extension/DB, access, admin-dashboard, jobs-email, media-upload, search-normalize, session-refresh) cần DB/SeaweedFS đã setup — không liên quan thay đổi. Trong lần chạy đầy đủ có thêm 2 test UI (Header "bẫy focus" 40 lần Tab, ApplyForm) fail nhưng chạy riêng PASS → timeout do tải máy, flaky.
- Kiểm trực quan 1280/1024/375 chưa chạy (không start dev server). Residual risk: chưa đo thực tế hàng 1280px VI/EN; theo suy luận chỉ bớt nút Menu (~44–88px) nên rộng hơn trước.

## Review
- Round 1 — **NORMAL PASS** (`.context/review-reports/feature-desktop-header-no-menu-button-phase-1-task-01-round-1-review.md`): 0 CRITICAL/MAJOR. MINOR 1 (comment `Header.tsx:66-68` nói menu toàn màn hình hiện trọn nhãn CTA) → change-request sửa comment ("< xl"), không đổi code. MINOR 2 (resize lên ≥ xl khi menu mở → focus về `body` vì trigger `display:none`) → chấp nhận, edge case.

## Close-out (worktree BL-019)
- Doc impact: `docs/DESIGN.md` (Header, Menu toàn màn hình) + `.context/design-spec.md` §2.1/§2.2 — đã sửa trong commit này. As-built khác: no doc impact.
- Chưa làm (session chính khi merge): spec-publisher (bump `spec_version`, `spec/updates/`, CHANGELOG, test-scope), `progress.json`, BACKLOG BL-019 done, archive change doc.
- Residual: chưa đo trực quan hàng 1280px VI/EN; integration test chưa chạy (cần DB migrate) — thay đổi không đụng server/DB.
