# bug-lead-status-history · phase-1-task-01 — Lịch sử chăm sóc lead: dòng "Đổi trạng thái" hiện trạng thái trước → sau

- Change doc: `spec/changes/archive/2026-10-26-lead-status-history.md` (BACKLOG BL-078)
- Evidence: `tests/e2e/admin/inbox.spec.ts` test "20 lead gửi từ form Liên hệ…" :135 (chưa commit — chỉ dùng chạy repro)
- Auto proceed: user 2026-10-28 "dở thì làm nốt đi, rồi làm tiếp mấy cái 73 76 78" → không checkpoint phase plan.

## Root cause (change-request, đã repro dev :3100 trước khi sửa)
- KHÔNG phải test sai selector: test tìm đúng dòng (`.document-fields__main table tbody tr` có "Đổi trạng thái"), dòng có tồn tại.
  Nội dung dòng thực tế: `LD-000956 | Đổi trạng thái | admin@tami.test | 28/10/2026 14:33` — không có trạng thái trước/sau.
- Dữ liệu ĐÚNG: `recordStatusChange` (`src/hooks/leads/status-activity.ts:24-43`) ghi activity `status_change` có `fromStatus`/`toStatus`
  (ERD §4.11). Lỗi nằm ở hiển thị: join "Lịch sử chăm sóc" (`src/collections/Leads.ts:214`) không khai `admin.defaultColumns` nên dùng
  `LeadActivities.admin.defaultColumns = ["lead","type","content","actor","createdAt"]` (`src/collections/LeadActivities.ts:83`) — không có
  `fromStatus`/`toStatus`; `content` chỉ có khi chuyển `lost`. Cột `lead` (mã LD-…) thừa trong trang chính lead đó.
- → Admin không biết đổi từ trạng thái nào sang trạng thái nào (yêu cầu change doc: "có dòng Mới → Đã liên hệ").

## Hướng sửa (builder chọn chi tiết, giữ đơn giản)
- Join `activities` (Leads.ts) khai `admin.defaultColumns` cho bảng lịch sử: bỏ `lead`, thêm thông tin trạng thái trước → sau
  (vd `["type", "content", "fromStatus", "toStatus", "actor", "createdAt"]`, hoặc một cột/cell gộp "Mới → Đã liên hệ" nếu gọn hơn và
  không cần component mới phức tạp). Nhãn trạng thái phải là tiếng Việt (`STATUS_LABELS`).
- Kiểm Payload 3.91 có lưu column preference của join theo user (bảng `payload-preferences`) — nếu preference cũ của admin che mất
  `defaultColumns` mới thì ghi rõ trong report (residual / cách xử lý), KHÔNG xoá preference của user ở DB dùng chung.
- Không đổi schema/DB/access (cột chỉ là admin config). `fromStatus`/`toStatus` vẫn `access: systemOnly` (create/update deny), read theo collection.
- Sale chỉ thấy activity lead được giao — không đổi `readOwnLeadActivities`.
- Unit test chặn hồi quy (vd join `activities` có `admin.defaultColumns` chứa `fromStatus`+`toStatus`, không chứa `lead`).

## Classification / Risk
- Type: **BUG** (hiển thị admin). Không đổi requirement / schema / API contract / dữ liệu.
- Risk: **MEDIUM** — lead (PII) + quyền đọc activity (sale chỉ lead được giao). Reviewer: **STRICT** (lead/PII/access).
- Blast radius: form Lead tab "Lịch sử chăm sóc" (admin + sale).
- Doc impact: dự kiến `no doc impact` (ERD đã ghi from/to; as-built không mô tả cột bảng admin).

## Kèm: CV khách chưa đăng nhập (nghi vấn từ autotest 2026-10-24) — KẾT LUẬN: BÁO NHẦM
- Chạy lại test "20 ứng viên nộp hồ sơ kèm CV…" (`inbox.spec.ts`, context khách `storageState` rỗng từ :299) ở dev :3100, 2026-10-28:
  PASSED; attachment `anon-cv.txt` = `401 application/json 60 bytes` (khách bị chặn); admin tải CV 200 PDF.
- Lần FAIL 2026-10-24 do context khách thừa hưởng cookie admin (test sai, đã sửa :299). `PrivateFiles.access.read = isAdmin` đúng. Không tạo BL-095.

## Acceptance
- [x] Tab "Lịch sử chăm sóc" dòng đổi trạng thái hiện trạng thái trước và sau bằng nhãn Việt (Mới → Đã liên hệ).
- [x] e2e test 20 Lead PASS ở local (change-request chạy, dev :3100).
- [x] Unit test cấu hình cột lịch sử.
- [x] `pnpm lint` (toàn repo) · `pnpm typecheck` · `pnpm test` PASS; `generate:types` không đổi `payload-types.ts`.

## Phạm vi cấm
- KHÔNG sửa: `SPECIFICATIONS.md`, `spec/**`, `.context/**`, file dirty không thuộc task (`.claude/**`, `tools/**`, `package.json`, `pnpm-lock.yaml`,
  `.gitignore`, `playwright.config.ts`, `tests/e2e/admin/**`, `docs/content-intake/`, `docs/testing/`, `test-results/**`).
- KHÔNG commit (change-request commit).

## Verification Plan
- `pnpm lint` · `pnpm typecheck` · `pnpm test` (`.context/project-config.md`)
- e2e: `E2E_BASE_URL=http://localhost:3100 npx playwright test --project=admin-content tests/e2e/admin/inbox.spec.ts -g "lead gửi từ form"` (dev :3100 đang chạy).
- Report: `.context/review-reports/bug-lead-status-history-phase-1-task-01-round-<R>-review.md`

## Verification summary (change-request, 2026-10-28)
- Repro TRƯỚC (dev :3100): e2e test 20 Lead FAILED tại :135 — dòng lịch sử `LD-000956 | Đổi trạng thái | admin@tami.test | 28/10/2026 14:33`. Bug app (hiển thị), không phải test sai selector.
- Builder (attempt 1): `src/collections/Leads.ts` join `activities` + `admin.defaultColumns: ["type","fromStatus","toStatus","content","actor","createdAt"]` (bỏ `lead`); test mới `tests/unit/lead-activities-join-columns.test.ts`.
- SAU: e2e test 20 Lead PASS (3/3 kể cả setup) ở :3100. Dev server đã tắt.
- `pnpm lint` toàn repo exit 0 · `pnpm typecheck` exit 0 · `pnpm test` 456 files / 4808 tests PASS (reviewer) · `generate:types` không đổi `payload-types.ts`.
- Reviewer STRICT r1 PASS — `.context/review-reports/bug-lead-status-history-phase-1-task-01-round-1-review.md`; MINOR-2 (unit test chỉ kiểm tên cột) sửa trước commit: thêm case mọi cột là field có thật của lead-activities (cũng phủ MINOR-3). MINOR-1 (e2e :135 chỉ kiểm "Đã liên hệ", chưa kiểm "Mới") → đề xuất sửa test (file `tests/e2e/admin/**` ngoài phạm vi commit): `toContainText(/Mới[\s\S]*Đã liên hệ/)`.
- Column preference: `RelationshipTable` gửi cột của field khi nạp, không bị preference cũ che (reviewer đọc code @payloadcms/ui); không xoá dữ liệu preference.
- CV khách chưa đăng nhập: BÁO NHẦM (anon 401 / admin 200 PDF) — không tạo BL-095.
- Doc impact: no doc impact (ERD §4.11 đã ghi from/to; as-built không mô tả cột bảng admin); no spec change (1.61.0); test-scope v98 (v97 archive).
- Residual: chưa chụp bảng với tài khoản sale (access không đổi, reviewer kiểm code); staging chưa kiểm (sau deploy).
