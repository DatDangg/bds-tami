# feature-detail-aside-no-inner-scroll · phase-1-task-01 — Thẻ tư vấn chi tiết không cuộn riêng + khoảng cách ảnh/thanh mục con cho thuê (BL-031)

- Change doc: `spec/changes/2026-10-20-detail-aside-no-inner-scroll.md` (BACKLOG BL-031) — follow-up BL-027 (046d891, ec762c3), BL-028 (785f190).
- Phụ thuộc: không.
- Trạng thái: `done` — reviewer PASS (r1 NORMAL, r2 FAST); user "làm bl31 đi" (auto proceed).

## Classification / Risk
- Type: **MODIFY** (UI; không đổi schema/API/quyền/dữ liệu/i18n)
- Risk: **MEDIUM** — sửa khung chi tiết dùng chung (`DetailLayout` / `DETAIL_ASIDE_CARD_CLASS`) dùng ở 2 trang.
- Expected review level: **NORMAL** (shared component).
- Blast radius: `/du-an/[slug]`, `/en/projects/[slug]`, `/cho-thue/[slug]`, `/en/for-rent/[slug]` (thẻ phụ ≥ lg; khoảng trên thanh mục con trang cho thuê).
- Doc impact: `SPECIFICATIONS.md` "Giao diện khung chi tiết chung" (thẻ phụ không cuộn riêng; cách dính khi cao hơn viewport) + `.context/design-spec.md` S03/S07 nếu có mô tả max-h/cuộn → spec-publisher bump minor.

## Hiện trạng (đã đọc)
- `src/components/detail/DetailLayout.tsx:9` `DETAIL_ASIDE_CARD_CLASS`: `lg:sticky lg:top-[calc(var(--sticky-top)+4.5rem)] lg:max-h-[calc(100dvh-var(--sticky-top)-5.5rem)] lg:overflow-y-auto` → thẻ cho thuê (giá + liên hệ + form) cao hơn viewport ⇒ thanh cuộn riêng. Dùng ở `ProjectDetail.tsx:101` (LeadFormSlot) và `SaleContactBox.tsx:37`.
- `src/components/rentals/RentalDetail.tsx:143` khối Gallery `mx-auto mt-4 ... px-gutter` không có khoảng dưới → thanh mục con (chưa dính) dính sát mép dưới ảnh; tin rented sau ảnh còn `similarBlock` trong `before`.
- Chi tiết dự án: hero → `Breadcrumb className="py-2"` → thanh mục con ⇒ khoảng hero↔thanh ≈ chiều cao breadcrumb.

## Thiết kế (change-request chốt, auto proceed)
- **D1 — bỏ cuộn riêng:** xoá `lg:max-h-[...]` + `lg:overflow-y-auto` khỏi `DETAIL_ASIDE_CARD_CLASS`.
- **D2 — dính khi cao hơn viewport ("dính theo đáy"):** CSS-only không biết chiều cao của chính thẻ (`top: %` tính theo containing block; `bottom` sticky + thẻ ở đầu aside không giữ thẻ khi cuộn xuống) ⇒ không thể vừa "dính dưới thanh mục con khi vừa" vừa "dính theo đáy khi cao" chỉ bằng CSS. Chọn: `top` = `min(calc(var(--sticky-top)+4.5rem), calc(100dvh - var(--detail-aside-h, 0px) - 1rem))`; một client component nhỏ trong `DetailLayout` (vd `DetailAsideFit`) đo chiều cao thẻ phụ bằng `ResizeObserver` và ghi `--detail-aside-h` lên `<aside>`. Kết quả: vừa viewport → dính dưới thanh mục con như BL-027; cao hơn → thẻ cuộn theo trang tới khi đáy thẻ (checkbox + nút gửi) chạm đáy viewport − 1rem rồi mới dính ⇒ không cắt, không cuộn trong. Trước hydrate / không JS: fallback 0px = hành vi dính trên (nút vẫn tới được khi cuộn hết lưới). Cách này chỉ đổi `top`, không đổi DOM thẻ con (Server Component giữ nguyên).
- **D3 — khoảng ảnh↔thanh mục con (cho thuê):** thêm khoảng dưới cho khối `before` của RentalDetail sau ảnh (và sau `similarBlock` khi rented nếu nó dính sát) bằng token spacing tương đương chiều cao breadcrumb ở chi tiết dự án (đo trên :3000, chọn token gần nhất; ghi số đo). Mọi breakpoint. Không động breadcrumb. Khi thanh đã dính đỉnh: không đổi.
- < lg: thẻ phụ không đổi (lớp `lg:` chỉ áp ≥ lg).

## Files (dự kiến)
- `src/components/detail/DetailLayout.tsx` (class + aside dùng component đo)
- `src/components/detail/DetailAsideFit.tsx` (mới, client, nhỏ) — hoặc tên tương đương
- `src/components/rentals/RentalDetail.tsx`
- Test: `src/components/detail/DetailLayout.test.tsx`, `src/components/rentals/rental-detail.test.tsx`

## Acceptance
- [ ] Thẻ tư vấn/liên hệ (dự án + cho thuê) không có `max-h`/`overflow-y-auto` → không thanh cuộn riêng
- [ ] Thẻ vừa viewport: vẫn dính dưới thanh mục con (`--sticky-top + 4.5rem`)
- [ ] Thẻ cao hơn viewport: không bị cắt; cuộn trang tới được checkbox + nút gửi (dính theo đáy)
- [ ] Chi tiết cho thuê: khoảng rõ giữa thư viện ảnh và thanh mục con (token spacing), cả tin rented; thanh đã dính đỉnh không đổi
- [ ] Breadcrumb giữ nguyên; < lg thẻ phụ không đổi
- [ ] `pnpm vitest run src/components/detail src/components/projects src/components/rentals`, `pnpm lint`, `pnpm typecheck` PASS

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Verification summary
- Builder (attempt 1): xoá `max-h`/`overflow-y-auto` khỏi `DETAIL_ASIDE_CARD_CLASS`; `top` = `min(calc(var(--sticky-top)_+_4.5rem),calc(100dvh_-_var(--detail-aside-h,0px)_-_1rem))`; `DetailAsideFit` (client, vỏ `<aside>`) đo thẻ con đầu bằng ResizeObserver → `--detail-aside-h`. RentalDetail: khối ảnh thêm `pb-8` (32px, token spacing).
- Lý do JS (D2): CSS không biết chiều cao chính thẻ sticky (`top: %` theo containing block), nên không thể vừa dính dưới thanh mục con khi vừa viewport vừa dính theo đáy khi cao hơn. JS chỉ ghi 1 biến CSS, DOM thẻ server giữ nguyên.
- Sau review round 1 (change-request sửa MINOR-1/3): bỏ biến `container` thừa trong test; tin rented có tin tương tự → bọc `similarBlock` trong `div.pb-8` (khối nền xám không dính sát thanh mục con), test assert phần tử ngay trước thanh mục con có `pb-8` và chứa tiêu đề tin tương tự.
- `pnpm vitest run src/components/detail src/components/projects src/components/rentals`: 13 file / 166 test PASS. `pnpm typecheck` PASS. `pnpm lint`: 0 error, 2 warning có sẵn (tools/task-dashboard/server.mjs).
- Đo trên dev server :3000 (change-request, Browser JS, 1440x900):
  - `/cho-thue/can-cho-thue-san-van-phong-tang-3-toa-n01-t2-khu-ngoai-giao-doan-quan-bac-tu`: `--detail-aside-h` 842px, computed top 41.9px, sticky, overflow-y visible, max-height none; khi dính card 42→884, nút gửi bottom 859 < 900 → tới được bằng cuộn trang. Khoảng ảnh → thanh mục con 32px.
  - `/du-an/the-crown-dai-hoang-son-bac-ninh`: thẻ 706px → top 88px (= 16 + 4.5rem), dính dưới thanh mục con như BL-027. Khoảng hero → thanh mục con ở dự án 60px (chứa breadcrumb).
- Review round 1 NORMAL PASS (4 MINOR): `.context/review-reports/feature-detail-aside-no-inner-scroll-phase-1-task-01-round-1-review.md`.

## Residual risk
- Thẻ cao hơn (viewport − thanh mục con): khi dính theo đáy, phần đầu thẻ (vd ~28px ở 900px cao, chủ yếu padding) nằm dưới thanh mục con dính — reviewer chấp nhận (MINOR-2), tinh chỉnh nếu cần thành task riêng.
- Chưa hydrate/không JS: `--detail-aside-h` = 0 → dính trên như cũ; thẻ cao hơn viewport chỉ lộ đáy khi cuộn hết lưới.
- Tin rented có tin tương tự chưa đo trực quan trên :3000 (không có dữ liệu rented sẵn); đã có test DOM.
- 768/1280px và bản /en chưa đo riêng (cùng component; < lg lớp `lg:` không áp).
- Khoảng ảnh↔thanh 32px nhỏ hơn 60px ở dự án (60px gồm cả dòng breadcrumb); nếu user muốn bằng hẳn → đổi token.
