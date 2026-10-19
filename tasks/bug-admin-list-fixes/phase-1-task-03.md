# bug-admin-list-fixes · phase-1-task-03 — Xuất Excel khi có từ khoá tìm kiếm (#02)

- Change doc: `spec/changes/2026-10-19-admin-list-fixes.md` (BACKLOG BL-021, T3). Quyết định đã chốt (user 2026-10-19): xuất Excel khi đang tìm kiếm **mở**, file ra đúng tập lead đang thấy trên màn.

## Classification / Risk
- Type: **MODIFY** (đổi hành vi có chủ đích: trước đây nút khoá khi có `search`).
- Risk: **HIGH → STRICT** — API contract `GET /api/admin/leads/export` thêm tham số; export PII (over-export là lỗi nghiêm trọng); audit fail-closed; rate limit.

## Hiện trạng
- `src/components/admin/LeadExportButton.tsx:43`: `query?.search` → khoá nút với `UNSUPPORTED_FILTER_MESSAGE`.
- Client: `leadExportQueryFromWhere` (`src/lib/leads/export-filters.ts`) chuyển `where` (không chứa search — Payload giữ `search` riêng trong `useListQuery().query`) sang query.
- Server: `src/endpoints/admin/leads-export.ts` `parseLeadExportFilters` → `buildLeadExportWhere` → `payload.count/find` (`overrideAccess: false`), audit `lead.export` `meta: { filters, rowCount }`.
- T2 (02a7c6e): `listSearchableFields` Leads = code, fullName, phone, email; hook `beforeOperation` `expandPhoneSearch` (read/count) mở rộng `phone like` bằng `phoneNormalized` → export qua `payload.find/count` tự thừa hưởng.

## Fix (phạm vi)
- Một nguồn tập trường tìm kiếm: hằng export (vd `LEAD_LIST_SEARCHABLE_FIELDS` ở `src/lib/leads/…`) dùng cho cả `Leads.admin.listSearchableFields` và endpoint export.
- Endpoint nhận `search` (trim; rỗng = không tìm; giới hạn độ dài hợp lý, vd ≤ 100 ký tự, vượt → 400 kèm `details`). Server tự dựng điều kiện tìm **đúng cách danh sách dựng** (`mergeListSearchAndWhere` của `payload/shared` hoặc tương đương: `{ or: fields.map(f => ({ [f]: { like: search } })) }` AND với bộ lọc), không nhận where thô từ client.
- Client: `LeadExportButton` không còn khoá khi có `search`; gửi `search` kèm query bộ lọc. Bộ lọc không ánh xạ được vẫn khoá như cũ.
- `UNSUPPORTED_FILTER_MESSAGE`: bỏ ý "Không hỗ trợ ô tìm kiếm"; giữ phần còn lại.
- Audit `lead.export`: `meta.filters` **không** chứa từ khoá (có thể là SĐT/email — giữ bất biến "meta không có dữ liệu khách" của API_SPEC §4); ghi cờ có tìm kiếm (vd `search: true`). Ghi rõ quyết định này trong API_SPEC.
- `docs/API_SPEC.md` §4 (as-built dòng ~202): thêm tham số `search`, quy tắc validate, audit, bỏ "ô tìm kiếm" khỏi danh sách không chuyển được.

## Acceptance
- [ ] Tìm `0956 789 012` (hoặc email, mã, họ tên) + bộ lọc trạng thái → file đúng tập lead danh sách đang thấy (integration: so `payload.find` với where của danh sách dựng bằng `mergeListSearchAndWhere` vs dòng trong file / count).
- [ ] Không có search → hành vi y như cũ (test cũ `leads-export.test.ts` pass).
- [ ] `search` quá dài → 400; sale → 403 như cũ; rate limit/422/audit giữ thứ tự.
- [ ] Bộ lọc không ánh xạ được vẫn khoá nút; thông báo mới không còn nhắc ô tìm kiếm.
- [ ] Audit không chứa từ khoá.
- [ ] `docs/API_SPEC.md` cập nhật.
- [ ] `pnpm test` (unit/ui + integration liên quan) / `pnpm lint` / `pnpm typecheck` PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → escalate `architecture_review_needed`.

## Verification summary
- `pnpm vitest run --project unit --project ui`: 202 files / 1980 tests PASS (thêm test search cho export-filters + LeadExportButton).
- `pnpm vitest run tests/integration/leads-export.test.ts tests/integration/leads.test.ts`: 53 PASS (case mới: SĐT có/không dấu cách, +84, email, mã, họ tên khớp tập `mergeListSearchAndWhere` + `payload.find`; search + lọc trạng thái; search rỗng; không khớp; >100 ký tự → 400 + details, không audit; ký tự đặc biệt; sale 403; audit chỉ có cờ).
- `pnpm lint`, `pnpm typecheck`: PASS.
- Round 1 fix (M1, m1-m3): search nguyên văn không trim ở client + server (khớp danh sách Payload); client khoá khi >100 ký tự; `LEAD_LIST_SEARCHABLE_FIELDS` `as const` (spread khi gán); integration so file vs danh sách cho NBSP/tab cuối, chỉ NBSP, `_`, `%`. Chạy lại: unit+ui, integration leads-export + leads, lint, typecheck PASS.
- Thiết kế: `LEAD_LIST_SEARCHABLE_FIELDS` (lead-values.ts) dùng chung Leads.ts + export; `buildLeadExportWhere` gọi `mergeListSearchAndWhere` của payload/shared; hook `expandPhoneSearch` tự áp. Audit `meta.filters.search: true` (không ghi từ khoá).

## Doc impact / Reconcile
`docs/API_SPEC.md` §4 as-built (leads/export): thêm `search`, validate, audit cờ, bỏ "ô tìm kiếm" khỏi danh sách không chuyển được. Không đổi schema/migration.

## Review
- STRICT FAIL round 1 (M1: trim làm file rộng hơn danh sách) — `.context/review-reports/bug-admin-list-fixes-phase-1-task-03-round-1-review.md`
- STRICT PASS round 2 — `.context/review-reports/bug-admin-list-fixes-phase-1-task-03-round-2-review.md` (MINOR line ending API_SPEC đã sửa)
## Residual risk
- Chưa chạy admin UI trên trình duyệt; hành vi Payload không trim xác minh qua mã nguồn + integration với config thật.
- `mergeListSearchAndWhere` nhận `collectionConfig` giả (chỉ `admin.listSearchableFields`) — nâng Payload cần chạy lại integration.
- Test search của export dùng đúng 10/10 lượt rate limit của 1 token; thêm case cần token riêng.
- Audit không ghi từ khoá (chỉ cờ `search: true`): truy vết chỉ biết có tìm kiếm, không biết từ khoá — quyết định giữ bất biến "meta không có dữ liệu khách".
