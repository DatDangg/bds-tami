# feature-header-scroll-transition-smooth · phase-1-task-01 — Header: chuyển phẳng ↔ thanh nổi mượt hơn (BL-026)

- Change doc: `spec/changes/2026-10-20-header-scroll-transition-smooth.md` (BACKLOG BL-026)
- Nền: BL-025 `f5ed892` (`src/components/layout/HeaderFrame.tsx`). User duyệt hướng 2026-10-20, yêu cầu chạy luôn → coi như đã qua checkpoint phase plan. 1 task.

## Classification / Risk
- Type: **MODIFY** (thuần thẩm mỹ: thời lượng/đường cong/bán kính bo của transition; không đổi behavior, trạng thái, ngưỡng, chiều cao)
- Risk: **LOW** — chỉ đổi chuỗi class Tailwind trong 1 component layout dùng chung; không đổi JS, DOM, chiều cao `<header>`, nền/tương phản.
- Expected review level: **NORMAL** (shared component nhưng chỉ đổi class transition/radius) · Blast radius: header mọi route `(frontend)` (hình dạng lúc chuyển + bán kính bo khi nổi).
- Doc impact: `.context/design-spec.md` §2.1 (dòng Biến thể: thời lượng/đường cong/radius) — change-request cập nhật ở close-out.

## Thiết kế (quyết định change-request)
- **D1 — bán kính thật:** thanh nổi bo `2rem` (32px, = nửa chiều cao 64px < lg) / `lg: 2.25rem` (36px, = nửa 72px) thay cho `rounded-pill` (9999px). Nội suy 0 → 32/36px đều nên góc bo dần, không giữ tròn rồi bật vuông. Hình dạng khi nổi y hệt viên thuốc hiện tại (radius = nửa chiều cao).
- **D2 — nhịp:** mọi thuộc tính (padding header; max-width, border-radius, box-shadow thanh) cùng `--duration-slow` (450ms, token sẵn có) + `--ease-standard` (`cubic-bezier(0.2,0,0,1)`, token sẵn có — tăng tốc êm đầu, giảm tốc dài cuối, không "vọt" như `--ease-out` 0.16,1,0.3,1). Không thêm token/thư viện.
- **D3 — giữ nguyên:** `motion-reduce:transition-none` (cả 2 phần tử), `h-(--header-offset)`, `p-0` ↔ `px-2 py-2` / `lg:px-4 lg:py-4`, `max-w-full` ↔ `max-w-[84rem]`, shadow-none ↔ shadow-md, khung nội dung 84rem (logo/nút không nhảy ngang), JS scroll + ngưỡng 4px.
- **D4 — thuộc tính animate:** giữ tập hiện có (padding, max-width, border-radius, box-shadow). padding/max-width là layout nhưng bị giới hạn trong `<header>` cao cố định (sticky, không đẩy nội dung) → không CLS; không thêm transition background/backdrop-filter (nền không đổi).

## Acceptance
- [x] Cuộn xuống / về đầu: góc bo đổi dần 0 ↔ 32/36px (không còn 9999px), hình dạng liền mạch ở 375 / 768 / 1280 / 1920px
- [x] Chiều cao `.site-header` 80/104px không đổi; logo/nút không nhảy ngang
- [x] `prefers-reduced-motion`: `transition-none` trên header + thanh
- [x] Mọi thuộc tính cùng duration + easing
- [x] `HeaderFrame.test.tsx` / `Header.test.tsx` cập nhật theo class mới
- [x] `pnpm test` (layout), `pnpm lint`, `pnpm typecheck` PASS

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Verification summary
- `HeaderFrame.tsx`: header + `.site-header-bar` đổi `duration-(--duration-base) ease-out` → `duration-(--duration-slow) ease-standard`; thanh nổi `group-data-[scrolled]:rounded-pill` → `group-data-[scrolled]:rounded-[2rem] lg:group-data-[scrolled]:rounded-[2.25rem]`; JSDoc + lý do radius. Giữ `motion-reduce:transition-none`, mọi class khác.
- Test cập nhật: `HeaderFrame.test.tsx` (radius mới, không còn `rounded-pill`, test mới cùng duration/easing + motion-reduce), `Header.test.tsx` (radius mới).
- `pnpm vitest run src/components/layout`: 16 files / 113 tests PASS. `pnpm lint`: 0 error (2 warning cũ ở tools/task-dashboard/server.mjs, ngoài scope). `pnpm typecheck`: PASS.
- CSS dev server (cổng 3000) có sinh `.ease-standard`, `.duration-(--duration-slow)`, `.group-data-[scrolled]:rounded-[2rem]`, `.lg:group-data-[scrolled]:rounded-[2.25rem]`. Chưa kiểm bằng mắt chuyển động thực tế.

## Doc impact / Reconcile
- `.context/design-spec.md` §2.1 dòng Biến thể: radius thật 32/36px (thay `--radius-pill`), transition `--duration-slow` 450ms + `--ease-standard` cùng nhịp (BL-026).
- `SPECIFICATIONS.md` không đổi ("chuyển đổi mượt, tức thì khi prefers-reduced-motion" vẫn đúng) → spec giữ **1.22.0**, không `spec/updates/`/CHANGELOG; test-scope **v28** (`spec/test-scope/current.json`, v27 → `spec/test-scope/archive/test-scope-1.22.0-27.json`).
- Không đổi API/schema/ERD/DESIGN.md → no doc impact ở đó.

## Review
- Round 1 NORMAL PASS (1 MINOR: chuỗi `group-data-[scrolled]:rounded-pill` trong negative assert ở `HeaderFrame.test.tsx:51` khiến Tailwind quét sinh 1 rule CSS chết — vô hại, để task riêng nếu cần) — `.context/review-reports/feature-header-scroll-transition-smooth-phase-1-task-01-round-1-review.md`.

## Residual risk
- Chưa xem chuyển động bằng mắt ở 375/768/1280/1920 (builder/reviewer chỉ kiểm CSS sinh ra + tính toán) — primary kiểm trình duyệt sau commit.
- 1 rule CSS chết `group-data-[scrolled]:rounded-pill` do chuỗi trong test (MINOR reviewer).
- padding/max-width vẫn là thuộc tính layout (giới hạn trong `<header>` cao cố định, không CLS) — cuộn nhanh quanh ngưỡng 4px đảo chiều transition giữa chừng (CSS tự nối từ giá trị hiện tại).
- `max-w-[84rem]` vẫn lặp 2 chỗ (từ BL-025).
