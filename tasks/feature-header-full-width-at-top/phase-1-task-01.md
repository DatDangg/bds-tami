# feature-header-full-width-at-top · phase-1-task-01 — Header: đầu trang phẳng full-width, cuộn mới thành thanh nổi (BL-025)

- Change doc: `spec/changes/2026-10-20-header-full-width-at-top.md` (BACKLOG BL-025)
- Thiết kế gốc: BL-020 P1-T02 `ab3f95a` (header luôn là thanh nổi bo tròn). User duyệt hướng 2026-10-20; phạm vi 1 task, coi như đã qua checkpoint phase plan.

## Classification / Risk
- Type: **MODIFY** (đổi behavior header công khai, design-spec §2.1)
- Risk: **MEDIUM** — component layout dùng chung mọi trang công khai (shared component), có JS mới (scroll state), ràng buộc CLS + `--header-offset` mà hero / ProjectSubNav / scroll-margin / aside dính dựa vào.
- Expected review level: **STRICT** (shared component dùng mọi trang công khai) · Blast radius: mọi route `(frontend)`, hero trang chủ, chi tiết dự án (thanh mục con dính), mọi đích neo.
- Doc impact: `.context/design-spec.md` §2.1 (intent đã được user duyệt qua change doc → cập nhật) · SPECIFICATIONS.md (nếu có mô tả header) qua spec delta.

## Thiết kế (quyết định change-request)
- **D1 — chiều cao `<header>` cố định = `--header-offset`** (80px < lg, 104px ≥ lg) ở CẢ HAI trạng thái ⇒ `--header-offset` không đổi, không CLS, hero `-mt-(--header-offset)`, ProjectSubNav `top`, `scroll-margin-top`, aside dính, `HeroSlider` đo `.site-header` đều giữ nguyên.
  - **Đầu trang (phẳng):** `<header>` không đệm (`p-0`); thanh `.site-header-bar` lấp đầy header (cao 80/104px, full-width, `max-width: 100%`), góc vuông (`rounded-none`), không shadow; hàng nội dung (h-16 / lg:h-18) căn giữa dọc trong thanh. Nền kính mờ sáng giữ nguyên (user chốt: không biến thể trong suốt).
  - **Đã cuộn (nổi):** như hiện tại — `<header>` đệm 8px (< lg) / 16px (≥ lg), thanh cao 64/72px, `max-w-[84rem]`, `rounded-pill`, `shadow-md`, căn giữa.
  - Lý do không chọn "thanh 64/72 sát mép + khe trong suốt bên dưới": để lộ dải ảnh hero/nền 16/32px dưới thanh phẳng, nhìn như lỗi; còn bỏ hẳn khe thì `--header-offset` phải đổi theo trạng thái → nội dung trang không hero nhảy khi cuộn (CLS).
- **D2 — trạng thái cuộn:** client component nhỏ (vd `HeaderFrame` thành `"use client"`, children vẫn là server content được truyền vào) đặt `data-scrolled` trên `<header>` khi `window.scrollY > 0` (ngưỡng nhỏ, vd > 4px tránh rung do bounce iOS). Listener `scroll` **passive** + gom bằng `requestAnimationFrame`, chỉ `setState` khi giá trị đổi; đọc trạng thái ngay khi mount (trang khôi phục vị trí cuộn / mở neo `#...`). Không cần IntersectionObserver. Header cao cố định nên không có vòng phản hồi (đổi trạng thái không đổi scrollY).
- **D3 — SSR mặc định = phẳng** (không có `data-scrolled`). Trang mở giữa chừng (reload khi đã cuộn) thấy phẳng → nổi một lần sau hydrate; chấp nhận (không CLS vì chiều cao không đổi).
- **D4 — chuyển đổi:** transition padding của `<header>` + `max-width`, `height`, `border-radius`, `box-shadow` của thanh, `--duration-base` (hoặc token sẵn có tương đương), ease-out; `motion-reduce:transition-none`. Không transition `background`/`backdrop-filter` (không đổi).
- **D5 — tương phản:** nền thanh không đổi (kính sáng / đặc khi không có backdrop-filter hoặc `prefers-reduced-transparency`) ⇒ tỷ lệ AA hiện có giữ nguyên ở cả hai trạng thái; `contrast.test.ts` không phải đổi.

## Acceptance
- [ ] Chưa cuộn: header full-width, góc vuông, không shadow/khe lề (thanh lấp đầy `<header>`), ở 375 / 768 / 1280px, trang có hero (`/`) và không hero (vd `/cho-thue`, `/du-an/<slug>`).
- [ ] Cuộn xuống: thanh nổi bo tròn như trước (lề 8/16, max 84rem, pill, shadow-md); cuộn về đầu → phẳng lại.
- [ ] `.site-header` cao 80px (< lg) / 104px (≥ lg) ở cả hai trạng thái; `--header-offset` không đổi; không CLS.
- [ ] AA giữ nguyên; `prefers-reduced-transparency` vẫn nền đặc; `prefers-reduced-motion` đổi tức thì.
- [ ] Vùng ngoài thanh khi nổi vẫn `pointer-events: none`; thanh nhận chuột ở cả hai trạng thái.
- [ ] Test `HeaderFrame.test.tsx` (SSR/mặc định phẳng, cuộn → `data-scrolled` + lớp nổi, cuộn về 0 → phẳng, listener passive + gỡ khi unmount), `Header.test.tsx` cập nhật nếu đang khẳng định `rounded-pill` vô điều kiện.
- [ ] Design-spec §2.1 cập nhật (change-request làm ở close-out).
- [ ] `pnpm test`, `pnpm lint`, `pnpm typecheck` PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Verification summary
- Triển khai: `HeaderFrame` thành client component; `data-scrolled` trên `<header>` khi `scrollY > 4`; scroll listener passive + rAF, đọc ngay khi mount, gỡ khi unmount. `<header>` `h-(--header-offset)` cố định; thanh luôn `h-full` (flat 80/104, nổi = 80-16 / 104-32 = 64/72); style nổi bằng `group-data-[scrolled]:` (max-w-[84rem], rounded-pill, shadow-md) + `data-[scrolled]:px/py`. Transition padding + max-width/border-radius/box-shadow, `--duration-base`, `motion-reduce:transition-none`. Không đụng rule nền/kính/reduced-transparency.
- Test: `HeaderFrame.test.tsx` (phẳng mặc định, cuộn/ngưỡng/về 0, đọc khi mount, passive + gỡ), `Header.test.tsx` cập nhật. Layout + contrast + home: 26 file / 237 test PASS. `pnpm lint` 0 error (2 warning sẵn có ở tools/task-dashboard), `pnpm typecheck` PASS.
- `pnpm test` đầy đủ: 53 file FAIL đều là `tests/integration/*` do Postgres 127.0.0.1:5433 / Redis không chạy (ECONNREFUSED), không liên quan; không có file ui/unit nào fail.
- Round 1 MINOR (nhảy ngang ~288px ở 1920px): chỉ NỀN thanh full-width ở đầu trang; `{children}` bọc trong khung `mx-auto w-full max-w-[84rem]` (flex items-center, h-full) nên nội dung cùng bề rộng ở cả 2 trạng thái. Test HeaderFrame/Header khẳng định khung 84rem.
- Kiểm trình duyệt 375/768/1280: CHƯA làm (dev server cổng 3000 không chạy, DB tắt) — residual: cần đo `.site-header` 80/104px và bounding thanh trước/sau cuộn.

## Doc impact / Reconcile
- Intent (qua change request, user duyệt 2026-10-20): `SPECIFICATIONS.md` Overview "Khung trang" (1.21.0 → 1.22.0), `.context/design-spec.md` §2.1 (Biến thể, Trang không có hero, Cao / lề).
- Không đổi API/schema/ERD; `docs/DESIGN.md` không mô tả hình dạng header → no doc impact ở đó.
- Spec publish: `spec/updates/2026-10-20-header-full-width-at-top.md`, `spec/CHANGELOG.md` 1.22.0, `spec/test-scope/current.json` scope v27 (v26 → archive).

## Review
- Round 1 STRICT PASS (2 MINOR: nội dung nhảy ngang ~288px ở 1920px khi cuộn; test chỉ kiểm class) — `.context/review-reports/feature-header-full-width-at-top-phase-1-task-01-round-1-review.md`.
- MINOR #1 đã sửa (nội dung trong khung `max-w-[84rem]` ở cả hai trạng thái, chỉ nền tràn viền).
- Round 2 NORMAL PASS (MINOR: `max-w-[84rem]` lặp 2 chỗ phải giữ bằng nhau) — `.context/review-reports/feature-header-full-width-at-top-phase-1-task-01-round-2-review.md`.

## Residual risk
- Chưa kiểm trình duyệt thật (dev server + Postgres/Redis tắt): chưa đo `.site-header` 80/104px, thanh trước/sau cuộn ở 375/768/1280/1920, độ mượt transition max-width, bounce iOS. Test chỉ kiểm chuỗi class (Tailwind v4 data-variant).
- `max-w-[84rem]` lặp ở thanh (khi nổi) và khung nội dung — đổi một chỗ phải đổi chỗ kia.
- Tải lại giữa trang: SSR phẳng → nổi sau hydrate (không CLS, chiều cao cố định).
- Ở 1280px nội dung vẫn lệch 16px mỗi bên khi chuyển trạng thái (thanh nổi = viewport − 32px).
- `pnpm test` đầy đủ: tests/integration/* fail do DB/Redis tắt (không liên quan); unit/ui PASS.
- Spec-validator không chạy riêng (phạm vi 1 task, delta spec 1 đoạn).
