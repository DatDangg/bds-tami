Agent: reviewer

# Review — bug-admin-list-fixes · phase-1-task-02 · round 1

> Ghi bởi primary thay reviewer (hook `guard.mjs` chặn reviewer ghi `.context/review-reports/**` trong worktree). Tóm lược trung thực report reviewer trả về.

- **Review level:** STRICT
- **Reason:** tìm kiếm theo PII lead (SĐT/email) + địa chỉ chính xác tin thuê; hook `beforeOperation` mới trên Leads chạy cho mọi read/count kể cả REST.

## Blast radius
- Danh sách Leads admin: tìm theo mã, họ tên, SĐT, email.
- Mọi `find`/`findByID`/`count` của Leads qua `expandPhoneSearch`; chỉ đổi `where` có nhóm `or` chứa `{ phone: { like: <SĐT hợp lệ> } }`. Caller nội bộ (export `buildLeadExportWhere`, anonymize, create-or-merge, lead-assign, dashboard) không có pattern đó → không ảnh hưởng.
- Danh sách Rentals admin: `listSearchableFields` code/title/address — chỉ config admin, không đổi API/access.
- Export `/api/admin/leads/export`: hành vi không đổi; client vẫn khoá khi có tìm kiếm (để T3).

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/lib/leads/phone-search.test.ts` | PASS 8/8 |
| `pnpm vitest run tests/integration/leads.test.ts tests/integration/rentals.test.ts tests/integration/leads-export.test.ts tests/integration/lead-assign.test.ts` | PASS 4 file, 99/99 (DB thật) |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |

## Checks
1. Sale không dò được lead không được giao: `buildBeforeOperation` chạy trước access (`payload/dist/collections/operations/find.js:28`), where mở rộng vẫn AND `isAssignedOrAdmin`. Test: saleA tìm SĐT nhiều dạng/email của lead saleB hoặc lead chưa giao → `[]`. OK.
1b. `address` giữ `readExactAddress`; where từ khách bị từ chối như cũ. OK.
2. Hook chỉ `read`/`count`, không có `where` thì giữ nguyên, duyệt and/or lồng, không mutate input. OK.
3. `like` (db-postgres): không phân biệt hoa thường, chuỗi con, tách từ không cần thứ tự — có integration evidence. OK.
4. Test dùng `mergeListSearchAndWhere` (`payload/shared`) = đúng where của admin list. OK.

## Findings
- [MINOR-1] `phone-search.ts:6` JSDoc nói "và export" khi export chưa dùng (T3). → **đã sửa** (bỏ cụm này).
- [MINOR-2] chỉ mở rộng khoá `and`/`or` chữ thường; REST gửi `OR` không được mở rộng (chỉ ít kết quả hơn, admin UI luôn gửi chữ thường). Không sửa.
- [MINOR-3] chưa có integration test đường `count`. Không sửa.
- [MINOR-4] tìm một phần SĐT (6 số cuối) không khớp SĐT lưu có dấu cách — ngoài acceptance, residual risk.

## Verdict
✅ PASS

## Residual risk
- MINOR-2/3/4 như trên; `src/payload-types.ts` M chỉ do CRLF — không commit.
