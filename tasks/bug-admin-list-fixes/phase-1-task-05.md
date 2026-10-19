# bug-admin-list-fixes · phase-1-task-05 — hiển thị cột danh sách admin (#09 #13 #14 #15)

- Change doc: `spec/changes/2026-10-19-admin-list-fixes.md` (BACKLOG BL-021, T5). Quyết định đã chốt: giá `110.000.000 ₫`; ô trống `—`.

## Classification / Risk
- Type: **MODIFY** (định dạng hiển thị) + **BUG** (#14 "Đang tải..." mỗi dòng ở cột Sale phụ trách).
- Risk: **MEDIUM → NORMAL** (chỉ hiển thị admin; không đổi dữ liệu/API). Nâng STRICT nếu sửa #14 đụng access của `staff`.

## Hiện trạng
- Cột tiền: `rentals.priceMonthlyVnd` (`Rentals.ts:170`), `projects.priceFromVnd/priceToVnd` (`Projects.ts:157`), `property-posts.priceVnd` (`PropertyPosts.ts:79`) — Payload hiện số thô `18000000`.
- Ô trống: Payload i18n `general:noLabel` = `<Không có {{label}}>` (`@payloadcms/translations` vi). Config `src/payload.config.ts:91` `i18n: { supportedLanguages: { vi }, fallbackLanguage: "vi" }`.
- Cột Sale phụ trách (Leads `assignedTo`, Cell `src/components/admin/AssigneeCell.tsx` bọc `DefaultCell` → relationship cell của Payload nạp doc client-side) → "Đang tải..." mỗi dòng. **Cần repro + root cause trước khi sửa** (gợi ý kiểm: tài khoản sale có đọc được `staff` không, depth của list, cách RelationshipCell của Payload 3.91 nạp).
- Ngày giờ: `admin.dateFormat` chưa khai → định dạng mặc định Payload.

## Fix (phạm vi)
- Cột VNĐ dạng `110.000.000 ₫` (dấu chấm nghìn, ` ₫`), ô trống `—`; sort/filter vẫn theo số (chỉ đổi Cell). Một hàm format dùng chung + 1 Cell component dùng lại.
- Ô trống `—` thay `<Không có …>` cho mọi cột (cách hẹp nhất: override chuỗi i18n `general.noLabel` của vi qua `i18n.translations`, hoặc tương đương — ghi lý do). Không đổi các chuỗi khác.
- #14: sau root cause, Sale phụ trách hiện tên ngay (không "Đang tải..." mỗi dòng) cho admin và sale; không mở rộng quyền đọc staff ngoài cần thiết (chỉ tên hiển thị).
- `admin.dateFormat: "dd/MM/yyyy HH:mm"` (config admin chung).

## Acceptance
- [ ] `18000000` → `18.000.000 ₫`; null → `—`; sort theo giá vẫn đúng số.
- [ ] `<Không có …>` không còn xuất hiện ở danh sách (ô trống `—`).
- [ ] Cột Sale phụ trách hiện tên, không "Đang tải..." (root cause ghi trong task file).
- [ ] Ngày giờ admin `dd/MM/yyyy HH:mm`.
- [ ] Test unit/ui (format + Cell) ; `pnpm test` / `pnpm lint` / `pnpm typecheck` PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → escalate `architecture_review_needed`.

## Root cause #14 ("Đang tải..." ở cột Sale phụ trách)
- Repro (dev :3021, admin, 1 lead gán sale): ngay sau khi vào `/admin/collections/leads` ô hiện "Đang tải..." rồi mới ra email sale; access/RBAC không phải nguyên nhân (admin đọc được `staff`; sale chỉ đọc được hồ sơ của chính mình và chỉ thấy lead của mình nên chỉ cần đọc chính mình; doc không đọc được sẽ thành "Untitled - ID", không phải "Đang tải").
- Root cause: list view nạp `assignedTo` ở depth 0 (chỉ id). `RelationshipCell` của `@payloadcms/ui` 3.91 (`dist/elements/Table/DefaultCell/fields/Relationship/index.js:158` — `document === null && t("general:loading")`) chỉ nạp tên bằng request client-side sau khi dòng đã vẽ: `IntersectionObserver` → `getRelationships` đặt doc = `null` → `RelationshipProvider` (`dist/elements/Table/RelationshipProvider/index.js`, `useDebounce(documents, 100)` rồi `GET /api/staff?where[id][in]=…`) → mới điền. Mỗi dòng nháy "Đang tải..." suốt debounce 100ms + round trip (kéo dài khi mạng chậm/compile dev), còn bị gửi trùng request. Ngoài ra nhãn hiện là email (`useAsTitle: "email"`), không phải họ tên.
- Fix: cột ảo `assigneeName` (`Leads.ts`, hook afterRead `computeAssigneeName` ở `src/hooks/leads/status-activity.ts`) trả sẵn `fullName` của sale trong dữ liệu dòng; `AssigneeCell` hiện tên đó (không request client). Không mở quyền đọc `staff`: tra cứu `overrideAccess` phía server, chỉ trả họ tên (không email/SĐT), cache theo `req.context` (1 query/sale/request); field `create/update: denyAll`, ẩn khỏi form/cột/bộ lọc. Không migration (virtual).

## Cách làm các việc còn lại
- Tiền: `src/components/admin/VndCell.tsx` (dùng `formatVnd(…, "vi")` của `src/lib/format.ts`; không phải số → `—`) gắn `admin.components.Cell` cho `rentals.priceMonthlyVnd`, `projects.priceFromVnd/priceToVnd` (helper `vndNumber`), `property-posts.priceVnd`; chỉ đổi Cell nên sort/filter theo số không đổi.
- Ô trống: `payload.config.ts` `i18n.translations.vi.general.noLabel = "—"` (ghi đè đúng 1 khoá thay vì sửa từng Cell; cell mặc định của mọi cột dùng chuỗi này).
- Ngày giờ: `admin.dateFormat: "dd/MM/yyyy HH:mm"`.

## Verification summary
- `pnpm vitest run --project unit --project ui`: 205 files / 2000 tests PASS (thêm `VndCell.test.tsx`, `AssigneeCell.test.tsx`).
- Integration `leads, lead-assign, leads-export, rentals, projects, property-posts`: PASS (thêm 1 test `assigneeName` trong `leads.test.ts`: admin + sale đều thấy tên, null khi chưa giao, không lộ email).
- `pnpm lint` PASS · `pnpm typecheck` PASS · `pnpm generate:types` (thêm `assigneeName`) + `generate:importmap` (VndCell) đã chạy.
- Thủ công :3021: Leads hiện `Bld Sale` + ngày `19/10/2026 17:47`; Rentals `18.000.000 ₫`, ô trống `—`. Dữ liệu test (lead + 2 staff) đã xoá.

## Doc impact / Reconcile
- no doc impact: chỉ hiển thị admin (Cell, i18n, dateFormat); `assigneeName` là trường ảo chỉ đọc, không vào export/API_SPEC public, không schema/migration.
## Review
- STRICT PASS round 1 — `.context/review-reports/bug-admin-list-fixes-phase-1-task-05-round-1-review.md`; MINOR-1 đã sửa.
- Primary kiểm dev :3021: `18.000.000 ₫`, ô trống `—`.
## Residual risk
- Trường `dayOnly` không khai `displayFormat` hiện kèm giờ trong danh sách (vd `19:00`) do `dateFormat` có `HH:mm` — đề xuất task riêng.
- Cột quan hệ mặc định khác (Danh mục, Người tạo…) vẫn nháy "Đang tải..." khi nạp chậm (hành vi Payload); chỉ cột Sale phụ trách được sửa.
- `assigneeName`: 1 truy vấn staff/sale/request, không gộp lô; chưa có test ghi `assigneeName` bị bỏ qua (create/update `denyAll`).
- `noLabel` = `—` áp mọi cell danh sách admin.
