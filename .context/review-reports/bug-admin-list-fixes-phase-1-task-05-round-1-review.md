Agent: reviewer

# Review — bug-admin-list-fixes · phase-1-task-05 · round 1

> Ghi bởi primary thay reviewer (hook `guard.mjs` chặn reviewer ghi `.context/review-reports/**` trong worktree). Tóm lược trung thực report reviewer trả về.

- **Review level:** STRICT
- **Reason:** #14 thêm cột ảo `assigneeName` trên `leads`, afterRead tra `staff` bằng `overrideAccess` (quyền/PII); override chuỗi i18n chung `general:noLabel` ảnh hưởng mọi danh sách admin.
- **Blast radius:** shape `leads` thêm `assigneeName` (REST, Local API, admin list); afterRead leads chạy cả ở export, hook lead-activity, job nhắc, anonymize; mọi cell danh sách nhận `noLabel` mới; định dạng ngày mọi cell ngày admin; cell giá rentals/projects/property-posts; `payload-types.ts` + `importMap.js` sinh lại.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm vitest run src/components/admin src/lib` | PASS 106 file / 1048 test |
| `pnpm vitest run tests/integration/{leads,lead-assign,leads-export,rentals,projects,property-posts}.test.ts` | PASS 6 file / 160 test |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm build` | PASS |

## Checks
1. Root cause #14 đúng: `@payloadcms/ui` 3.91 `Table/DefaultCell/fields/Relationship/index.js` render `general:loading` khi `document === null` → tên chỉ có sau fetch client (task file ghi sai dòng 109 → thực tế 158).
2. `assigneeName`: đọc theo `isAssignedOrAdmin` (anon/sale khác không đọc được), create/update `denyAll`, chỉ `fullName`; export dùng `select: LEAD_SELECT` nên file không đổi; độc lập `assigneeInactive`; ảo, anonymize không ghi; tối đa 1 `findByID`/sale/request (cache `req.context`).
3. `VndCell` chỉ đổi Cell, field vẫn `number` → sort/filter theo số; null/""/không phải số → `—`, `0` → `0 ₫`.
4. `noLabel` chỉ dùng ở cell bảng (`DefaultCell/index.js:127`, Relationship `:179`); form/drawer dùng `general:untitled`/`loading` → không ảnh hưởng.
5. `dateFormat` áp qua `Date/index.js:39`; date picker form giữ `displayFormat` riêng.
6. Test: VndCell, AssigneeCell (tên, `—`, fallback, badge), integration `assigneeName` admin/sale/chưa giao.

## Findings
- [MINOR-1] task file ghi `Relationship/index.js:109`, đúng là `:158` → **đã sửa**.
- [MINOR-2] `dateFormat` có `HH:mm` → trường `dayOnly` không khai `displayFormat` (JobPostings.deadline, Rentals.availableFrom, PropertyPosts.startAt/endAt, Pages.effectiveDate, ClickStatsDaily.date) hiện giờ (vd 19:00) trong danh sách. Không phải regression (mặc định Payload cũng có giờ). Đề xuất task riêng thêm `displayFormat: "dd/MM/yyyy"`.
- [MINOR-3] tra staff không gộp lô; chạy ở mọi lần đọc lead có người phụ trách. Chấp nhận được.
- [MINOR-4] test `not.toContain(saleA.email)` gần như hiển nhiên; thiếu test ghi `assigneeName` bị bỏ qua.

## Verdict
✅ PASS

## Residual risk
- `noLabel` = `—` cho mọi cell danh sách (chủ đích).
- Reviewer không có trình duyệt; primary kiểm dev :3021: rentals hiện `18.000.000 ₫`, ô trống `—`; cột quan hệ mặc định khác (Danh mục, Người tạo) vẫn nháy `—` → "Đang tải..." → tên khi dev server chậm (hành vi Payload, ngoài #14 — #14 chỉ sửa cột Sale phụ trách).
