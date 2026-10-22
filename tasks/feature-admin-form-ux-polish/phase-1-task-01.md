# feature-admin-form-ux-polish · phase-1-task-01 — "Dịch lại bằng AI": modal trong admin thay `window.confirm` + chặn hộp thoại trình duyệt

- Change doc: `spec/changes/2026-10-22-admin-form-ux-polish.md` (BACKLOG BL-058, mục 1)
- Spec: FR-ADM-19 (BL-042: nút "Dịch lại bằng AI"; BL-051 A11 khối dịch AI một chỗ), FR-ADM-18
- Status: approved 2026-10-22 · Wave 1 (song song với T02, T03)

## Hiện trạng (change-request đã kiểm)
- `src/components/admin/RetranslateButton.tsx:8` hằng `CONFIRM_MESSAGE`; `:24` `if (!window.confirm(CONFIRM_MESSAGE)) return;` → hộp "localhost:3000 says…" của trình duyệt.
- Soát toàn repo `src/**` (`window.alert|confirm|prompt` và gọi trần `alert(`/`confirm(`/`prompt(`): **chỉ còn 1 chỗ này**. `src/app/(payload)/**` không có.
- Mẫu sẵn trong repo: `src/components/admin/RowActions.tsx:3,127-137` dùng `ConfirmationModal` + `useModal().openModal(slug)` của `@payloadcms/ui` (heading / body / confirmLabel / confirmingLabel / cancelLabel / onConfirm). Mock test sẵn: `RowActions.test.tsx:31`.
- Nút nằm trong khối "Bản dịch tiếng Anh" (cột phải; `src/collections/_shared/content-defaults.ts:151-163` `gatherTranslationBlock`) của collection nội dung + global (Trang chủ…).

## Classification / Risk
- Type: **MODIFY** (UI admin). Không đổi endpoint `POST /api/admin/translations/:target`, quyền (`canRetranslate`), audit `content.retranslate`.
- Risk: **LOW**. Reviewer: **FAST/NORMAL** (component đơn, không shared).

## Yêu cầu thực hiện
1. Thay `window.confirm` bằng `ConfirmationModal` (cùng cách `RowActions`): heading "Dịch lại bằng AI", body = câu hiện tại ("Dịch lại toàn bộ bản tiếng Anh bằng AI? Bản đã sửa tay sẽ bị ghi đè."), nút xác nhận "Dịch lại", đang chạy "Đang gửi…", Huỷ "Huỷ". `modalSlug` duy nhất theo tài liệu (vd `retranslate-<collection|global>-<id>`).
2. **Huỷ / Esc / bấm nền** → không gọi `fetch`. Xác nhận → giữ nguyên luồng gửi + thông báo kết quả (`retranslateMessage`, `role=status|alert`).
3. Nút mở modal giữ `disabled`/`aria-busy` khi đang gửi; không cho gửi 2 lần.
4. Thêm test chặn tái phạm: test quét `src/components/admin/**` + `src/app/(payload)/**` (bỏ `*.test.*`) không còn `window.alert|confirm|prompt` / `alert(`/`confirm(`/`prompt(` trần.
5. Test component `RetranslateButton.test.tsx` (mới): mở modal; Huỷ không gọi fetch; Xác nhận gọi đúng URL + method POST; hiện thông báo 202 / lỗi.

## Acceptance
- [ ] Không còn `window.alert` / `window.confirm` / `window.prompt` trong code admin (test quét PASS).
- [ ] "Dịch lại bằng AI" mở modal trong admin, chữ/màu theo token admin sáng + tối; Huỷ không gọi API; Xác nhận gửi 1 lần.
- [ ] Ảnh 1440 trước (hộp trình duyệt) / sau (modal) — sáng + tối.
- [ ] `pnpm lint` · `pnpm typecheck` · `pnpm test` (project ui/unit) PASS.

## Phạm vi cấm
- KHÔNG sửa: `SPECIFICATIONS.md`, `spec/**`, `.context/progress.json`, `src/lib/translation/admin-ui.ts` (chỉ đọc), `src/components/admin/styles/_forms.scss` (T03), `payload.config.ts`, `importMap.js`. Không migration. KHÔNG commit ngoài worktree task.

## Verification Plan
- `pnpm lint` · `pnpm typecheck` · `pnpm test` (từ `.context/project-config.md`). Integration fail do môi trường DB worktree → ghi rõ, không chặn (UI only).
- Kiểm trình duyệt 1440: 1 bài Tin BĐS + Trang chủ (global) → mở/Huỷ/Xác nhận; DevTools Network xác nhận Huỷ không có request.
- Ảnh: `.context/review-reports/feature-admin-form-ux-polish/screens/t01-{before,after}-1440-{light,dark}.png`.
- Report: `.context/review-reports/feature-admin-form-ux-polish-phase-1-task-01-round-<R>-review.md`.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Decision log
- (change-request) Dùng `ConfirmationModal` của Payload (đã dùng ở `RowActions`) thay vì tự viết modal — đúng màu/token admin, có focus trap + Esc.

## Decision log (builder)
- `RetranslateButton`: nút chỉ gọi `openModal(slug)`; `ConfirmationModal` (heading "Dịch lại bằng AI", body = câu cũ, "Dịch lại" / "Đang gửi…" / "Huỷ") gọi `retranslate()` khi xác nhận. Huỷ/Esc/nền không chạm `fetch` (hàm chỉ chạy qua `onConfirm`). `modalSlug` = `retranslate-<collection>-<id>` hoặc `retranslate-global-<slug>`. `closeModal` trong `finally` như mẫu RowActions; thêm `if (busy) return` chống gửi 2 lần.
- Test quét: `src/components/admin/no-browser-dialogs.test.ts` (project unit) quét `src/components/admin/**` + `src/app/(payload)/**` (bỏ `*.test.*`), regex bắt `window./globalThis.` + `alert|confirm|prompt(` và gọi trần; có test tự kiểm regex.
- Test component: `src/components/admin/RetranslateButton.test.tsx` (mock `@payloadcms/ui`): mở modal không gọi `window.confirm`/fetch, Huỷ không request, xác nhận POST đúng URL 1 lần + 202, 403/lỗi mạng `role=alert`, global, ẩn khi chưa lưu.

## Verification summary (builder)
- `pnpm lint`: 0 error (2 warning cũ ở tools/task-dashboard/server.mjs, ngoài phạm vi). `pnpm typecheck`: PASS.
- `vitest --project unit --project ui`: 336 file / 3255 test PASS (với `--maxWorkers=4`). Test mới: 80 test PASS.
- `pnpm test` đầy đủ (kèm integration, 3 worktree chạy song song): 71 file fail do môi trường (integration DB / timeout vì tải), ui/unit lần đầu cũng có 5 test timeout (LeadForm...) nhưng PASS khi chạy lại riêng và khi giảm worker -> không liên quan thay đổi.
- Kiểm trình duyệt/ảnh: CHƯA chụp (không chạy dev server do máy quá tải bởi 3 builder song song; hộp `window.confirm` gốc cũng không chụp được bằng screenshot trang). Ảnh `t01-*` không có.

## Residual
- Thiếu ảnh 1440 trước/sau sáng+tối và kiểm Network bằng trình duyệt thật; modal dùng `ConfirmationModal` của Payload (token admin sẵn) nên rủi ro thấp, reviewer/dispatcher nên bổ sung ảnh nếu cần.

## Browser check (builder, bổ sung theo yêu cầu dispatcher)
- Dev server 3101 (worktree task-01), đăng nhập admin dev, mở Tin BĐS `572a4d0b-…` đã lưu, viewport 1440x900. Nút "Dịch lại bằng AI" mở modal Payload: heading "Dịch lại bằng AI", câu cảnh báo ghi đè, nút "Huỷ" + "Dịch lại"; chữ/màu theo token admin ở cả sáng và tối (tối bật bằng `data-theme="dark"`).
- Ảnh: `.context/review-reports/feature-admin-form-ux-polish/screens/t01-after-1440-light.jpg`, `t01-after-1440-dark.jpg` (khung chụp 800x600 của pane, viewport emulate 1440). Ảnh "trước" = N/A (hộp thoại native).
- Bấm Huỷ: modal đóng; `read_network_requests` lọc "translations" = không có request; `performance` resource entries tới `/api/admin/translations` = 0. KHÔNG bấm xác nhận.
- Dev server 3101 đã tắt.
