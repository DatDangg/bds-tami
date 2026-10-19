Agent: reviewer

# Review — bug-admin-list-fixes · phase-1-task-03 · round 2

> Ghi bởi primary thay reviewer (hook `guard.mjs` chặn reviewer ghi `.context/review-reports/**` trong worktree). Tóm lược trung thực report reviewer trả về.

- **Review level:** STRICT
- **Reason:** đổi contract `GET /api/admin/leads/export` (thêm `search`), file xuất có PII, audit fail-closed, thứ tự rate limit, hằng tập trường dùng chung.
- **Blast radius:** như round 1 (`export-filters.ts`, `leads-export.ts`, `LeadExportButton.tsx`, `lead-values.ts` + `Leads.admin.listSearchableFields`, audit `lead.export`, `docs/API_SPEC.md` §4). Không schema/migration.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm vitest run src/lib/leads src/components/admin/LeadExportButton.test.tsx` | PASS 7 file / 80 test |
| `pnpm vitest run tests/integration/leads-export.test.ts tests/integration/leads.test.ts` | PASS 2 file / 54 test |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm build` | PASS |

## Checks
1. M1 đóng: client gửi nguyên văn (`if (search)`), server đọc nguyên văn, chỉ chuỗi rỗng = không tìm, độ dài kiểm trên nguyên văn. Integration so file xuất với danh sách (`mergeListSearchAndWhere` + config thật) cho NBSP cuối, tab cuối, chỉ NBSP, NBSP giữa, `_`, `%`, `giảm 100%`, `Mã_giảm`, toàn dấu cách.
2. m1 đóng: > 100 ký tự → nút khoá + "Từ khoá tìm kiếm tối đa 100 ký tự".
3. m2 đóng: `_`/`%` so từng dòng với danh sách.
4. m3 đóng: `LEAD_LIST_SEARCHABLE_FIELDS` `as const`.
5. Check round 1 giữ: không where thô; 401→403→400→429/503→422→audit→stream (400 trước rate limit, không audit); audit chỉ `search: true`; `LeadExportButton.tsx` chỉ đổi logic.
6. API_SPEC khớp code ("nguyên văn, không trim", giới hạn 100 + 400 `details`, khoá ở client, audit chỉ cờ).

## Findings
- [MINOR] m1 `docs/API_SPEC.md`: 2 dòng ngoài scope chỉ khác line ending → **đã sửa** (primary khôi phục line ending gốc; diff còn 1 dòng).
- [MINOR] m2 `leads-export.test.ts:439` case `%';--\` chỉ assert 200 (chấp nhận được vì `_`/`%` đã so dòng). Không sửa.
- [MINOR] m3 token trong block search dùng đúng 10/10 lượt rate limit — thêm case sẽ 429. Không sửa, ghi residual.

## Verdict
✅ PASS

## Residual risk
- Chưa chạy admin UI trên trình duyệt (hành vi không trim xác minh từ mã nguồn Payload + integration với config thật).
- `collectionConfig` giả cho `mergeListSearchAndWhere`; integration test sẽ bắt lệch khi nâng Payload.
