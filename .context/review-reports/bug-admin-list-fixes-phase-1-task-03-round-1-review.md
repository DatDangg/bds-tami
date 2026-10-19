Agent: reviewer

# Review — bug-admin-list-fixes · phase-1-task-03 · round 1

> Ghi bởi primary thay reviewer (hook `guard.mjs` chặn reviewer ghi `.context/review-reports/**` trong worktree). Tóm lược trung thực report reviewer trả về.

- **Review level:** STRICT
- **Reason:** API contract `GET /api/admin/leads/export` thêm `search`; file xuất chứa PII (xuất thừa = lỗi nghiêm trọng); audit fail-closed + rate limit giữ thứ tự; hằng dùng chung danh sách/endpoint.
- **Blast radius:** `export-filters.ts` (server + client), `leads-export.ts`, `LeadExportButton.tsx`, `lead-values.ts` + `Leads.admin.listSearchableFields`, audit `lead.export`, `docs/API_SPEC.md` §4. Không schema/migration.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm vitest run src/lib/leads src/components/admin/LeadExportButton.test.tsx` | PASS 7 file / 77 test |
| `pnpm vitest run tests/integration/leads-export.test.ts tests/integration/leads.test.ts` | PASS 2 file / 53 test |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm build` | PASS (client bundle import `payload/shared` OK) |

## Checks
1. Tập lead: server dùng chính `mergeListSearchAndWhere` + cùng `LEAD_LIST_SEARCHABLE_FIELDS`; hook `expandPhoneSearch` áp cho count/find; `%`/`_` cùng hành vi danh sách. **Sai** ở ca khoảng trắng không phải U+0020 (M1).
2. Server không nhận where thô; thứ tự 401→403→400→429/503→422→audit→stream giữ nguyên. OK.
3. Audit chỉ ghi `search: true`. OK.
4. Build OK. 5. API_SPEC khớp (trừ chữ "trim"). 6. `LeadExportButton.tsx` chỉ đổi logic. OK.

## Findings
- **[MAJOR] M1** `export-filters.ts` (client `search?.trim()`, server `read()` trim): danh sách Payload không trim (`@payloadcms/next/dist/views/List/index.js:123`), drizzle chỉ tách U+0020 (`@payloadcms/drizzle/dist/queries/parseParams.js:220`), còn `trim()` xoá cả tab/NBSP → từ khoá có NBSP cuối hoặc chỉ NBSP: danh sách lọc hẹp, export rộng hơn (đến toàn bộ lead). Fix: gửi/đọc nguyên văn, rỗng = không tìm, kiểm độ dài trên giá trị nguyên văn; test NBSP/tab; bỏ "trim" trong API_SPEC.
- [MINOR] m1 `LeadExportButton.tsx`: từ khoá > 100 ký tự → server 400, thông báo chung chung; nên khoá ở client kèm lý do.
- [MINOR] m2 `tests/integration/leads-export.test.ts:397`: case ký tự đặc biệt chỉ assert 200, chưa so tập dòng với danh sách.
- [MINOR] m3 `lead-values.ts`: `LEAD_LIST_SEARCHABLE_FIELDS` mutable; nên readonly/freeze.

## Verdict
❌ FAIL (M1). Yêu cầu builder: M1 bắt buộc; m1–m3 cùng vòng.

## Residual risk
- Chưa chạy admin UI trên trình duyệt; hành vi `SearchFilter` xác minh qua mã nguồn `@payloadcms/ui` 3.91.0.
- `collectionConfig` giả (`as unknown as SanitizedCollectionConfig`) sẽ lệch nếu Payload đọc thêm field config — integration test so với config thật sẽ bắt.
