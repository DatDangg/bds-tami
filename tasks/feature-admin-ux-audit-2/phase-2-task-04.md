# feature-admin-ux-audit-2 · phase-2-task-04 — Ô "Liên kết" chọn trang bằng dropdown (A10)

- Nguồn: `spec/changes/2026-10-21-admin-ux-audit-2.md` (BL-051, MODIFY) — giai đoạn 2. Báo cáo `docs/reviews/2026-10-21-admin-ux-audit-2.md` §2.6.2.
- Spec: `SPECIFICATIONS.md` F10, đoạn "Admin gọn — audit lần 2, giai đoạn 2 (BL-051)".
- Plan: GĐ2 = 1 phase / 6 task tuần tự (trùng importMap / payload.config / style admin). Coordinator 2026-10-21: làm cả GĐ2 trong lượt này, không dừng hỏi (user "tự làm tự quyết, đừng hỏi").
- Phụ thuộc: sau P2-T03.

## Classification / Risk
- Type: **MODIFY** (chỉ `admin` / component hiển thị / CSS; không schema/DB/access/API, không migration).
- Risk: **MEDIUM** — field dùng chung Header/Footer/Trang chủ; giá trị lưu phải giữ định dạng.
- Expected review level: **NORMAL**.
- Blast radius: `src/fields/nav-link.ts` (Header, Footer, nút Trang chủ), `src/lib/content/nav-link.ts`.
- Doc impact: spec delta F10 GĐ2; dự kiến không đổi API/ERD.

## Scope
1. Custom Field component (client) cho `navLinkField`: ô chọn trang theo nhãn tiếng Việt (`PAGE_LINK_KEY_MEANINGS`) + "Địa chỉ khác (https://…)" mở ô nhập URL; giá trị ghi vào field text y như cũ (mã trang hoặc URL); `validateNavLink` giữ nguyên; giá trị cũ hiển thị đúng lựa chọn; ô không bắt buộc cho phép để trống. Ô chọn cùng style admin (BL-015). Bỏ mô tả "Mã trang có sẵn: …" (thay mô tả ngắn tiếng Việt).
2. Không đổi kiểu field (vẫn `text`), không migration, không đổi `resolveNavLink`.
3. Test component (chọn trang → mã; địa chỉ khác → URL; giá trị cũ hiển thị đúng; xoá).

## Acceptance
- [ ] Menu đầu trang / Chân trang / nút Trang chủ: chọn trang theo tên tiếng Việt; "Địa chỉ khác" nhập URL; lưu đúng định dạng cũ; dữ liệu cũ hiển thị đúng; website render link như trước.
- [ ] Không đổi schema (`src/payload-types.ts` chỉ được đổi chú thích sinh từ mô tả; không migration), access, API.
- [ ] Sáng/tối, 375px + 1280px không tràn ngang; vùng bấm ≥ 44px; không phá GĐ1 (e83a86b, b7f762c, d641351) và BL-050 (827ea1c).
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` PASS; `pnpm generate:importmap` nếu thêm component.

## Verify
- Lệnh từ `.context/project-config.md`; trình duyệt dev server `tami-dev` (`.claude/launch.json`); tài khoản test `@example.test`, xoá theo id sau khi kiểm, không ghi mật khẩu ra chat/commit.

## Quyết định
- Cơ chế: custom Field client `NavLinkField` (`src/components/admin/NavLinkField.tsx`, khai qua `admin.components.Field` trong `navLinkField`) dùng `useField` + `SelectInput` của Payload (react-select, cùng kiểu ô lọc "Trạng thái dịch" nên theo style BL-015 sẵn) + ô `<input>` URL hiện khi chọn "Địa chỉ khác (https://…)". Field vẫn `type: "text"`, `validate: validateNavLink`, hook trim giữ nguyên → giá trị lưu là mã trang hoặc URL như cũ, không migration, `resolveNavLink` không đổi.
- Lựa chọn suy từ giá trị lưu (`navLinkChoice`): mã trang → chính mã; URL/giá trị lạ → "Địa chỉ khác" (không mất dữ liệu cũ); trống → chưa chọn. State cục bộ `otherChosen` giữ ô URL mở khi vừa chọn "Địa chỉ khác" mà ô còn trống. Đổi từ mã trang sang "Địa chỉ khác" xoá mã cũ để khỏi ghi mã trang vào ô URL.
- Ô không bắt buộc: `isClearable` → bấm xoá ghi `""` (giống ô text cũ; `resolveNavLink` coi "" là không có link). Ô bắt buộc: không có nút xoá.
- `PAGE_LINK_KEY_MEANINGS` chuyển từ `src/fields/nav-link.ts` sang `src/lib/content/nav-link.ts` (export) để component client dùng mà không kéo cấu hình Payload. Mô tả "Mã trang có sẵn: …" thay bằng câu ngắn tiếng Việt; `payload-types.ts` chỉ đổi chú thích.
- Style: khối `.tami-nav-link` ở `_controls.scss` (ô chọn cao ≥ 44px, ô URL min-height 44px).

## Verification summary (Builder)
- `pnpm typecheck`: PASS (tsc không lỗi). `pnpm lint`: 0 errors, 2 warnings có sẵn ở `tools/task-dashboard/server.mjs` (ngoài scope).
- `pnpm test` (toàn bộ, trước chỉnh nhãn dấu *): 360 files / 3630 tests PASS. Sau chỉnh nhãn chạy lại `NavLinkField.test.tsx` + `nav-link.test.ts`: 2 files / 16 tests PASS.
- Test mới `src/components/admin/NavLinkField.test.tsx` (SelectInput mock như `TranslationStatusFilter.test.tsx`): map lựa chọn từ giá trị lưu; map option/null/mã lạ; liệt kê trang tiếng Việt + "Địa chỉ khác"; chọn trang → ghi mã, không hiện ô URL; giá trị cũ mã trang hiển thị đúng; giá trị cũ URL → "Địa chỉ khác" + URL trong ô; mã trang → "Địa chỉ khác" mở ô trống rồi ghi URL gõ; xoá (không bắt buộc) ghi "", bắt buộc không có nút xoá.
- `pnpm generate:importmap`: thêm `NavLinkField` vào `importMap.js`. `pnpm generate:types`: `payload-types.ts` chỉ đổi 9 dòng chú thích mô tả (diff kiểm).

## Browser evidence (tami-dev đã chạy sẵn ở cổng 3000, tài khoản `@example.test` đã xoá theo id)
- Header (1280, sáng): 7 mục menu hiện đúng tên trang (Trang chủ, Dự án, Cho thuê, Tin bất động sản…), nhãn "Liên kết *" cùng dòng, mô tả mới. Nút nổi bật (tuỳ chọn): chọn "Địa chỉ khác" → ô nhập https://, nhập URL, Lưu → API trả `ctaButton.link = "https://example.com/tami-test"`; tải lại → hiển thị "Địa chỉ khác" + URL; bấm xoá → ô URL ẩn, Lưu → `""`. Khôi phục `ctaButton.link = null` qua API; navItems giống nguyên bản (id/link/label). Website `/` vẫn render link `/lien-he` đúng.
- Footer (375, tối): ô chọn cao 50px, không tràn ngang (scrollWidth 375), tương phản ổn. Trang chủ (1280): 3 ô "Liên kết của nút" hiển thị Cho thuê/Cho thuê/Liên hệ (nhãn override giữ). Không lưu gì ở Footer/Trang chủ.
- Ghi chú: Payload chỉ dựng field dưới màn hình khi cuộn tới nên đếm DOM phải cuộn hết trang.

## Residual risk / gaps
- URL ở nút Header chỉ hiện trên website khi có "Chữ trên nút" (hành vi cũ); đã kiểm giá trị lưu + `resolveNavLink` (có test sẵn), không kiểm thêm render public của URL ngoài.
- Xoá ô không bắt buộc ghi `""` thay vì `null` (giống ô text cũ).
- Chưa kiểm sáng/tối cho Footer 1280 và Header 375 bằng ảnh; chung một CSS/component với các ca đã kiểm.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Review
- Round 1: `.context/review-reports/feature-admin-ux-audit-2-phase-2-task-04-round-1-review.md` — **NORMAL, PASS**. MINOR: (1) `otherChosen` chỉ khởi tạo lúc mount → giá trị đổi từ ngoài (reset/khôi phục version) hiện sai lựa chọn → chuyển P2-T05; (2) hàm dài ~62 dòng → tách ô URL (chuyển P2-T05); (3) test mock SelectInput.

## Verification summary (close-out)
- Acceptance: **PASS**. Reviewer **PASS r1**. `pnpm typecheck` PASS · `pnpm lint` 0 error · `pnpm test` 3630/3630 PASS. `payload-types.ts` chỉ đổi chú thích.

## Doc impact
- Spec delta F10 GĐ2. Không đổi API/ERD (ERD §4.15 định dạng giá trị liên kết giữ nguyên).
