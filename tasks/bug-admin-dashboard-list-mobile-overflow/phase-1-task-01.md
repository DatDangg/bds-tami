# bug-admin-dashboard-list-mobile-overflow · phase-1-task-01 — Admin 375px: Tổng quan + danh sách "cuộn ngang" (BL-024)

- Change doc: `spec/changes/2026-10-20-admin-dashboard-list-mobile-overflow.md` (BACKLOG BL-024, tách từ BL-023 #10)
- Quyết định agent (user ủy quyền 2026-10-20): auto proceed, không checkpoint.

## Classification / Risk
- Type: **BUG** (responsive) · Severity: **low** (sau đo lại: không có cuộn ngang toàn trang thật; còn 1 lỗi cắt nút ở thanh chọn hàng loạt)
- Root cause category: CSS Payload 3.91 mặc định (thanh `.collection-list__list-selection`) + phương pháp đo (transition bị đóng băng ở trang không render)
- Risk: **LOW** — 1 rule CSS admin cho phần tử chỉ hiện ở ≤768px (Payload chỉ render khi `smallBreak`); không đổi schema/API.
- Expected review level: **NORMAL** (style admin dùng chung cho mọi danh sách) · Blast radius: thanh chọn hàng loạt ở mọi màn danh sách admin ≤768px.
- Doc impact: dự kiến `no doc impact` · Decision impact: có (ghi bên dưới).

## Repro (2026-10-20, Chrome dev, viewport 375×812 emulate + iframe 375px, dữ liệu dev)
Đo `documentElement.scrollWidth` trên 14 màn (`/admin`, rentals, leads, projects, news, property-posts, media, lead-activities, services, account, …):

| Trạng thái | `/admin` | rentals | leads | projects | news | property-posts | media | account |
|---|---|---|---|---|---|---|---|---|
| Ngay khi đo (transition `grid-template-columns` của `.template-default` đang `running`, `currentTime 0`) | 506 | 576 | 604 | 562 | 563 | 587 | 561 | 555 |
| Sau khi transition chạy xong (`getAnimations().finish()`) | **375** | **375** | **375** | **375** | **375** | **375** | **375** | **375** |

- Con số 506/576 trong change doc khớp chính xác trạng thái transition bị đóng băng.
- Bảng danh sách: luôn nằm trong `.table` (`overflow-x:auto`, cw 375 / sw 685–1165) → cuộn trong khung, không làm cả trang cuộn. Thanh chip lọc nhanh (BL-022) `.quick-filter-chips__scroller` `overflow-x:auto` → cuộn nội bộ.
- Sau khi transition xong, **phần tử thật sự vượt viewport (không bị cha cắt)** ở mọi danh sách có bảng: chỉ `.collection-list__list-selection-actions` (right = 391). Khi chọn hàng: nút **"Xóa"** ở l=347 r=391 → **bị cắt 16px** ở mép phải 375px.

## Root cause (có evidence)
1. **506/576 không phải lỗi layout ổn định** — Payload `@media(max-width:1440px)`: trước hydrate `.template-default{grid-template-columns:1fr auto}` (nav `display:none`, wrap nằm cột 1 = 375px); sau hydrate `.template-default--nav-hydrated{grid-template-columns:0 auto}`; `.template-default--nav-animate{transition:grid-template-columns var(--nav-trans-time)}` (0.15s). Ở trang **không render khung hình** (pane trình duyệt ẩn / iframe nền), style không được tính giữa 2 lần đổi class nên khi tính lại, transition 375px→0 bắt đầu và **đứng yên ở `currentTime 0`** → cột 1 vẫn 375px, `.template-default__wrap` (`min-width:100%` ≤768) bị đẩy sang phải → scrollWidth = 375 + bề rộng nội dung tràn. Trên trang hiển thị thật, transition hoàn tất trong 150ms (iframe hiển thị: `--nav-hydrated` ở 969ms, gtc `0px 360px`, không có trạng thái 576). Ngoài ra Payload đặt `body{overflow-x:hidden}` (lan ra viewport) nên người dùng không vuốt ngang được trong lúc đó.
2. **Lỗi thật**: `node_modules/@payloadcms/ui/dist/styles.css` — `.collection-list__list-selection{position:fixed;bottom:0;padding:16px 0;width:100%}` không đặt `left` → `left` tĩnh = lề gutter (16px ở ≤768) + `width:100%` (= viewport) → thanh lệch phải đúng 1 gutter, nút cuối ("Xóa") bị cắt. Phần tử `fixed` nên không tăng scrollWidth (vì vậy không thấy qua `scrollWidth`) nhưng nội dung bị cắt khỏi màn.

## Fix (phạm vi)
- `src/components/admin/styles/_lists.scss` (ngoài `@layer`, thắng `@layer payload-default`): 
  `.collection-list__list-selection { left: 0; right: 0; width: auto; padding-inline: var(--gutter-h); }`
  → nền thanh full-bleed, nội dung nằm trong gutter, không vượt viewport.
- **Không** đụng `html`/`body`/`.template-default` overflow; **không** đổi transition nav của Payload.
- Test: thêm vào `src/components/admin/admin-mobile-overflow.test.ts` (test tĩnh đọc SCSS như BL-023) khẳng định rule trên; giữ test cấm `overflow-x:hidden` trên html/body, mở rộng cho `_lists.scss`.

## Acceptance
- [ ] Sau khi transition xong, `documentElement.scrollWidth == 375` ở `/admin` + danh sách rentals/leads/projects/news/property-posts/media/lead-activities/services ở 375px; bảng cuộn trong `.table`, chip cuộn trong scroller.
- [ ] Thanh chọn hàng loạt (chọn ≥1 hàng ở rentals/leads 375px): mọi nút trong viewport (right ≤ 375 − gutter), nền phủ đủ ngang.
- [ ] Không thêm `overflow-x: hidden` toàn cục; desktop không đổi (thanh chỉ render ≤768px).
- [ ] `pnpm test`, `pnpm lint`, `pnpm typecheck` PASS.

## Quyết định agent (user ủy quyền 2026-10-20)
- D1: Không "sửa" con số 506/576 bằng CSS — đó là transition bị đóng băng khi đo ở trang không render; sửa nó (vd tắt transition nav) sẽ đổi hành vi Payload mà không có lợi cho người dùng thật. Ghi phương pháp đo đúng: đo khi trang đang hiển thị hoặc gọi `document.getAnimations().forEach(a => a.finish())` trước khi đo.
- D2: Sửa thanh chọn hàng loạt (lỗi tràn thật duy nhất tìm được ở danh sách 375px) trong cùng task — cùng lớp lỗi "tràn ngang 375px trên danh sách".
- D3: Không sửa `--nav-width: 100vw` (Payload gốc, TAMI khai lại giống hệt): ở cửa sổ hẹp có thanh cuộn cổ điển (desktop) nav đóng rộng 100vw > clientWidth 15px; điện thoại dùng thanh cuộn overlay nên không gặp, và `body{overflow-x:hidden}` chặn vuốt ngang → ghi residual.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Verification summary
- TDD: test mới ở `admin-mobile-overflow.test.ts` FAIL trước khi sửa SCSS (rule rỗng), PASS sau.
- Fix: `_lists.scss` — `.collection-list__list-selection { left:0; right:0; width:auto; padding-inline:var(--gutter-h) }` + lồng `.list-selection { flex-wrap: wrap; row-gap: 4px }`. Phần `flex-wrap` PHÁT HIỆN THÊM khi đo trình duyệt: rentals (32 bản ghi, nhiều trang) có nút "Chọn tất cả (32)" làm hàng flex nowrap rộng hơn 343px → "Xóa" vẫn right = 390 dù nền đã phủ đủ; cho xuống dòng là cùng lớp lỗi, cùng rule.
- `pnpm test`: 289 files / 3057 tests PASS · `pnpm lint`: 0 error, 2 warning cũ ở `tools/task-dashboard/server.mjs` (không liên quan) · `pnpm typecheck`: PASS.
- Trình duyệt 375×812 (đã `getAnimations().finish()` trước khi đo, chọn bằng checkbox thead `#select-all`):
  - rentals: thanh left 0 / right 375; nút "Chọn tất cả (32)" 114–243, "Chỉnh sửa" 24–113, "Xóa" 130–175 (xuống 2 dòng); max right mọi phần tử con = 359 (trước fix: "Xóa" 346–390); scrollWidth 375.
  - leads: thanh 0–375; "Chỉnh sửa" 109–198, "Xóa" 215–260; max right 359; scrollWidth 375.
  - `/admin`: scrollWidth 375. Đã bỏ chọn sau khi đo; viewport reset desktop.

## Doc impact / Reconcile
- `no doc impact` — chỉ CSS admin; FR-ADM-19 (responsive admin) đã bao phủ; không đổi contract/schema/behavior tài liệu hoá.

## Review
- NORMAL PASS round 1 — `.context/review-reports/bug-admin-dashboard-list-mobile-overflow-phase-1-task-01-round-1-review.md` (xác nhận root cause + D1 qua CSS Payload/`Nav/context.js`; 2 MINOR: thanh cao hơn khi xuống dòng che thêm đáy danh sách — hành vi che có sẵn của Payload; test tĩnh chỉ kiểm CSS). Reviewer không có công cụ trình duyệt.
- Repro Verification (change-request, Chrome dev 375×812, sau `getAnimations().finish()`): **PASS** — rentals thanh 0–375, "Chọn tất cả (32)" 114–243 / "Chỉnh sửa" 24–113 / "Xóa" 130–175, scrollWidth 375; leads thanh 0–375, max right 359, scrollWidth 375.

## Residual risk
- Thanh chọn hàng loạt fixed che đáy danh sách (cao 86–134px khi chọn, do xuống dòng) — hành vi che có sẵn của Payload; chưa thêm padding đáy (đề xuất task riêng nếu cần).
- `--nav-width: 100vw` (Payload): ở cửa sổ hẹp có thanh cuộn cổ điển (desktop) nav đóng rộng hơn clientWidth ~15px; điện thoại dùng thanh cuộn overlay nên không gặp; `body{overflow-x:hidden}` chặn vuốt ngang (D3).
- Trang tải ở tab nền: khi tab hiện lại có thể thấy transition nav 150ms (hành vi Payload, D1).
- Test chỉ là test tĩnh CSS; kiểm Chrome emulate, chưa thử Safari iOS/thiết bị thật; 768px chưa kiểm riêng.
- Đo `scrollWidth` ở trình duyệt không render (pane ẩn/iframe nền) cho số sai 506–604px — phải `document.getAnimations().forEach(a => a.finish())` trước khi đo.
