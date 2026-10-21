# feature-admin-ux-audit-2 · phase-2-task-05 — Dịch AI một chỗ: "Có bản tiếng Anh" + tóm tắt dịch + "Dịch lại bằng AI" cùng khối cột phải (A11)

- Nguồn: `spec/changes/2026-10-21-admin-ux-audit-2.md` (BL-051, MODIFY) — giai đoạn 2. Báo cáo `docs/reviews/2026-10-21-admin-ux-audit-2.md` §2.3.6.
- Spec: `SPECIFICATIONS.md` F10, đoạn "Admin gọn — audit lần 2, giai đoạn 2 (BL-051)".
- Plan: GĐ2 = 1 phase / 6 task tuần tự (trùng importMap / payload.config / style admin). Coordinator 2026-10-21: làm cả GĐ2 trong lượt này, không dừng hỏi (user "tự làm tự quyết, đừng hỏi").
- Phụ thuộc: sau P2-T04.

## Classification / Risk
- Type: **MODIFY** (chỉ `admin` / component hiển thị / CSS; không schema/DB/access/API, không migration).
- Risk: **MEDIUM** — field dùng chung mọi collection nội dung; không được đổi đường dẫn dữ liệu `hasEnglish` / `translation.*`.
- Expected review level: **NORMAL**.
- Blast radius: `src/fields/translation.ts`, `src/collections/_shared/content-defaults.ts`, `src/lib/admin/form-layout.ts`, các collection nội dung, `TranslationSummary` / `RetranslateButton`.
- Doc impact: spec delta F10 GĐ2; dự kiến không đổi API/ERD.

## Scope
1. Ở mọi collection dùng helper bản dịch chung (`content-defaults.ts` — nội dung + Danh mục + Chủ đầu tư…): "Có bản tiếng Anh" (đang sidebar, **chỉ đọc — giữ chỉ đọc**), nút "Duyệt bản tiếng Anh" của Trang pháp lý (`Pages.ts`), dòng tóm tắt + nút "Dịch lại bằng AI" (đang tab "Bản dịch") về **cùng một khối** ở cột phải (vd trường `ui` ngay dưới checkbox hiển thị tóm tắt + nút, hoặc dời group bằng vị trí không đổi path), bỏ tab "Bản dịch" riêng ở collection nội dung. Chỉ dời vị trí hiển thị: tab không tên → đường dẫn `translation.*` giữ; nếu phải đổi path thì không làm, ghi gap. Quyền/readOnly/ẩn trường hệ thống (BL-042) giữ.
2. Global (Trang chủ, Cấu hình chung…) giữ khối bản dịch như cũ (A14 xử lý Trang chủ).
3. Test layout (`form-layout.test.ts` / `form-friendly*.test.ts`) cập nhật đúng vị trí mới; test quét nhãn vẫn xanh.

4. **Carry-over MINOR review P2-T04** (`src/components/admin/NavLinkField.tsx`): chỉ dùng trạng thái "Địa chỉ khác" đã chọn khi giá trị đang rỗng (`otherChosen && !currentValue`) để giá trị đổi từ ngoài (reset/khôi phục version) hiện đúng lựa chọn; tách khối ô URL thành component con; thêm test cho đổi giá trị từ ngoài.

## Acceptance
- [ ] Form Dự án/Cho thuê/Tin tức…: công tắc + tóm tắt + nút Dịch lại cùng một khối cột phải; không còn tab "Bản dịch"; dịch lại vẫn chạy; `hasEnglish`/`translation.*` không đổi đường dẫn.
- [ ] Không đổi schema (`src/payload-types.ts` không đổi trừ khi regen bắt buộc; không migration), access, API.
- [ ] Sáng/tối, 375px + 1280px không tràn ngang; vùng bấm ≥ 44px; không phá GĐ1 (e83a86b, b7f762c, d641351) và BL-050 (827ea1c).
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` PASS; `pnpm generate:importmap` nếu thêm component.

## Verify
- Lệnh từ `.context/project-config.md`; trình duyệt dev server `tami-dev` (`.claude/launch.json`); tài khoản test `@example.test`, xoá theo id sau khi kiểm, không ghi mật khẩu ra chat/commit.

## Quyết định
- Cơ chế: `gatherTranslationBlock` (`content-defaults.ts`) gom `hasEnglish` + nhóm `translation` + 2 trường `ui` (`translationSummary`, `retranslateAction`) + `translationActions` của collection vào MỘT collapsible KHÔNG tên "Bản dịch tiếng Anh" (`position: "sidebar"`, mở sẵn), đứng đúng chỗ `hasEnglish` từng ở (sau "Nâng cao"). Tab "Bản dịch" bị bỏ khỏi `placeSharedFields`. Collapsible không tên nên `hasEnglish` / `translation.*` giữ nguyên đường dẫn (không migration; không đổi access/readOnly).
- Nhóm `translation` của collection nội dung: `translationGroup(false)` => `admin.hidden: true` và không chứa `ui` (dữ liệu giữ). Đã kiểm trên trình duyệt: form state của nhóm ẩn vẫn có `translation.*` (Rentals đặt tạm `status=failed` hiện "dịch lỗi — không dịch được…", đã trả về `none`). Global (Header/Footer/Homepage/SiteSettings) vẫn dùng `translationGroup()` mặc định = khối cũ, không đổi.
- Chuyển 2 `ui` ra ngoài nhóm an toàn vì `TranslationSummary` / `RetranslateButton` đọc `translation.*` và `author` theo đường dẫn tuyệt đối.
- Nút "Duyệt bản tiếng Anh" của Trang pháp lý: chuyển từ `fields` của `Pages.ts` sang option mới `translationActions` để nằm trong cùng khối (dưới nút Dịch lại).
- Không phải rơi vào phương án dự phòng (không đổi path nào).
- Carry-over `NavLinkField`: `choice = otherChosen && !currentValue ? OTHER : navLinkChoice(currentValue)`; ô URL tách thành `NavLinkUrlInput`.
- Ghi chú: `src/payload-types.ts` do `generate:types` đổi THỨ TỰ thành viên interface (thêm/di chuyển trường dùng chung); kiểm bằng so sánh tập dòng đã sắp xếp: hoàn toàn là hoán vị, kiểu giữ nguyên, không trường mới/xoá.

## Verification summary (Builder)
- `pnpm typecheck` PASS · `pnpm lint` 0 error (2 warning cũ ở tools/task-dashboard/server.mjs, không liên quan) · `pnpm test`: Test Files 360 passed (360), Tests 3634 passed (3634) (lần chạy đầu: 3 test fail do sửa bố cục, đã sửa test; media-upload hook timeout S3 rồi qua ở lần chạy sau — hạ tầng, không liên quan).
- `pnpm generate:importmap`: không có import mới. `pnpm generate:types`: chỉ hoán vị thứ tự thành viên (xem Quyết định).
- Test đã thêm/sửa (có trong diff): `form-layout.test.ts` (tab SEO không còn "Bản dịch"; khối cột phải; omit cả hai thì không khối), `form-friendly.test.ts` (nhóm ẩn không chứa ui; `translationBlockFields` thứ tự; global vẫn đủ), `content-defaults.test.ts` (tìm khối "Nâng cao" theo nhãn), `tests/integration/retranslate.test.ts` (tìm `hasEnglish` qua `flattenedFields`), `NavLinkField.test.tsx` (đổi giá trị từ ngoài + sửa mô phỏng `useField`).
- Yêu cầu gọi API dịch lại: chưa gọi AI thật; tráo `fetch` ở trình duyệt: bấm nút → `POST /api/admin/translations/rentals/<id>` + thông báo "Đã gửi yêu cầu dịch lại…". Component `RetranslateButton` không đổi (đã có test cũ).

## Browser evidence (tami-dev cổng 3000; tài khoản `@example.test` đã xoá theo id, còn 0)
- Dự án 1280 sáng: sidebar có khối "Bản dịch tiếng Anh" (checkbox chỉ đọc + mô tả + "Bản tiếng Anh: chưa dịch" + "Dịch lại bằng AI"); tab: Nội dung / Thông tin dự án / Bảng giá & thông tin thêm / Hình ảnh / SEO (không "Bản dịch"); thanh Lưu dính (A7) còn.
- Cho thuê 375 sáng/tối kiểm qua tin nhắn + nút cao 44px; Tin tức 375 tối: khối trong cột phải, tab Nội dung/Hình ảnh/SEO, scrollWidth 375. Trang pháp lý 375 tối: cùng khối có thêm "Duyệt bản tiếng Anh" + mô tả chờ duyệt. Danh mục 1024: khối ở sidebar, không tab, không tràn.
- Ghi chú: Payload chỉ dựng field khi cuộn thật tới nên phải cuộn bằng chuột.

## Residual risk / gaps
- Chỉ kiểm bằng mắt: Cho thuê 375 sáng, Projects 375, Developers/Services chưa mở form (cùng helper). Chưa bấm dịch lại thật (tốn AI).
- `payload-types.ts` đổi thứ tự thành viên (vô hại về kiểu) — lần regen sau sẽ ổn định.
- Khối mở sẵn (`initCollapsed: false`) → người dùng vẫn gập được.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Review
- Round 1: `.context/review-reports/feature-admin-ux-audit-2-phase-2-task-05-round-1-review.md` — **STRICT, PASS**. `payload-types.ts` chỉ đổi thứ tự thành viên (sorted diff = HEAD), giữ bản regen. MINOR (chuyển P2-T06): (1) bỏ wrapper thừa `translationBlockFields`; (2) cờ `withActions` gánh 2 nghĩa → tách `translationDataGroup()`/options; (3) JSDoc `TranslationSummary.tsx` còn nói vị trí cũ; (4) chưa chạy `migrate:create` để chứng minh không có diff schema.

## Verification summary (close-out)
- Acceptance: **PASS**. Reviewer **PASS r1**. `pnpm typecheck` PASS · `pnpm lint` 0 error · `pnpm test` 360 files / 3634 PASS.

## Doc impact
- Spec delta F10 GĐ2. Không đổi API/ERD (đường dẫn `hasEnglish`/`translation.*` giữ).
