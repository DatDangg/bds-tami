# Spec Update — 2026-10-19 admin-list-fixes (T1–T5; T6 còn mở)

**spec_version:** 1.14.0 → 1.15.0 (MINOR — mở rộng hành vi danh sách admin: tìm kiếm, xuất Excel khi tìm kiếm, trường lọc, định dạng hiển thị; REST đọc không `locale` → `vi`. Không đổi schema/DB, không migration, không đổi quyền)

**Trigger:** bug-fix + feature-update (Change Request BUG + MODIFY, BL-021) — change doc `spec/changes/2026-10-19-admin-list-fixes.md` (**giữ nguyên chỗ, chưa archive** — T6 chưa làm), task `tasks/bug-admin-list-fixes/phase-1-task-01..05.md`

**Nguồn:** user báo loạt lỗi màn danh sách admin (bug #01 #02 #03 #04 #06 #07 #09 #13 #14 #15). Quyết định user 2026-10-19: xuất Excel khi đang tìm kiếm **mở**; tìm Lead theo SĐT + Email; tìm tin thuê theo địa chỉ mở cho mọi tài khoản nội bộ; giá `110.000.000 ₫`; ô trống `—`.

## Đã làm (T1–T5)

| Task | Loại | Commit | Nội dung | Review |
|---|---|---|---|---|
| T1 (#01) | BUG | `044512c` | Đổi "Trạng thái dịch" không còn xoá bộ lọc khác: `withTranslationFilter` tách where dạng WhereBuilder `{ or: [{ and }] }` thành nhánh, thay điều kiện dịch trong từng nhánh (chỉ điều kiện lá `translation.*`); `currentTranslationFilter` nhận mục ở mọi dạng | NORMAL PASS r1 |
| T2 (#03 #04) | MODIFY | `adccd72` | Leads tìm thêm SĐT + email (hook `beforeOperation` `expandPhoneSearch` mở rộng `phone like` bằng `phoneNormalized` E.164; vẫn AND quyền sale); Rentals `listSearchableFields` = mã, tiêu đề, địa chỉ | STRICT PASS r1 |
| T3 (#02) | MODIFY | `05e5767` | `GET /api/admin/leads/export` nhận `search` (nguyên văn, ≤ 100 ký tự, quá → 400); server dựng điều kiện bằng `mergeListSearchAndWhere` trên `LEAD_LIST_SEARCHABLE_FIELDS`; nút không còn khoá khi có từ khoá; audit chỉ ghi cờ `filters.search: true` | STRICT FAIL r1 → PASS r2 |
| T4 (#06 #07) | MODIFY + BUG | `6a654ee` | "Thêm bộ lọc" 5 collection chỉ còn trường nghiệp vụ (`disableListFilter`); REST đọc collection nội dung không `?locale` → `vi` (hook `defaultReadLocale`) nên bộ lọc "Thuộc dự án" hiện tên sau khi tải lại; `fallback` vẫn tắt (BR-07) | STRICT PASS r1 |
| T5 (#09 #13 #14 #15) | MODIFY + BUG | `739b12a` | `VndCell` (`110.000.000 ₫`, sort/filter theo số), i18n `general.noLabel` = `—`, cột ảo `assigneeName` (chỉ `fullName`, tra server-side, không mở quyền đọc `staff`) thay "Đang tải...", `admin.dateFormat` `dd/MM/yyyy HH:mm` | STRICT PASS r1 |

## Còn mở

- **T6 (#08)** — Xuất Excel + Lọc dịch nằm cùng hàng thanh công cụ danh sách (desktop + mobile). Làm sau BL-016 (đã xong). **Cập nhật:** T6 xong (`c69f6e5`, NORMAL PASS) → phát hành 1.15.1 / scope v18, delta `spec/updates/2026-10-19-admin-list-fixes-toolbar.md`; change doc đã archive `spec/changes/archive/2026-10-19-admin-list-fixes.md`.

## Requirements

- SỬA **F9 (xuất Excel lead)**: xuất đúng bộ lọc **kể cả khi có từ khoá ô tìm kiếm** — file ra đúng tập lead đang thấy; từ khoá ≤ 100 ký tự; audit không ghi từ khoá (PII), chỉ cờ.
- THÊM **FR-ADM-19 / Danh sách admin**: tìm Lead theo mã/họ tên/SĐT mọi dạng/email (sale vẫn chỉ lead được giao); tìm Tin cho thuê theo mã/tiêu đề/địa chỉ; "Thêm bộ lọc" chỉ trường nghiệp vụ; bộ lọc quan hệ giữ tên sau tải lại; cột VNĐ `110.000.000 ₫`; ô trống `—`; Sale phụ trách hiện họ tên ngay; ngày giờ `dd/MM/yyyy HH:mm`.
- LÀM RÕ **F12 / FR-ADM-18**: chọn/đổi/bỏ mục dịch giữ mọi bộ lọc khác (kể cả nhiều nhánh "hoặc") — intent sẵn có, code nay khớp (BUG #01).
- THÊM **F12 / Ngôn ngữ**: REST đọc collection nội dung không `locale` → `vi`; `en`/`all` giữ nguyên, không fallback.

**Schema / Access:** không đổi schema/DB, không migration (`assigneeName` là trường ảo chỉ đọc, `create/update: denyAll`). Quyền không mở rộng (tra tên sale bằng `overrideAccess` phía server, chỉ trả `fullName`).
**API:** `GET /api/admin/leads/export` thêm tham số `search`; REST đọc không `locale` của collection `withContentDefaults` trả bản `vi` thay vì `null` — `docs/API_SPEC.md` đã reconcile (as-built, commit `05e5767`, `6a654ee`).

**Ảnh hưởng:**
- Admin: danh sách Leads, Cho thuê, Dự án, Đăng tin BĐS, Tin tức (tìm kiếm, bộ lọc, cột); mọi danh sách có lọc "Trạng thái dịch"; ngày giờ toàn admin; ô trống toàn admin.
- API: export lead; REST đọc nội dung không `locale` (client gọi REST không gửi locale nay nhận `vi`).
- Retest: sale không dò được lead người khác bằng SĐT; export không search y như cũ (rate limit/422/audit/thứ tự lỗi); `locale=en`/`all`; Media (ngoài `withContentDefaults`) vẫn `null` khi không locale.

**Residual:** trường `dayOnly` không khai `displayFormat` hiện kèm giờ; cột quan hệ khác vẫn có thể nháy "Đang tải..."; `id` / "Đã Xoá Lúc" còn trong menu lọc; tìm không dấu trong bộ lọc quan hệ chưa làm; tìm một phần SĐT có dấu cách chưa khớp; REST `OR`/`AND` chữ hoa không mở rộng SĐT; đường `count` của hook SĐT chưa có integration test riêng.

**Scope sinh:** `spec/test-scope/current.json` scopeVersion 17
