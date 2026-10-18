Agent: reviewer

# Review — build/tami-website · layer-9-task-03 · round 1

- Review level: **STRICT**
- Reason: RBAC endpoint admin + BOLA, side effect email (PII) / audit / activity trong transaction, sửa helper dùng chung `asSystemActivity` (mọi activity hệ thống), đổi helper test integration dùng chung.
- Blast radius: `src/hooks/leads/on-assignment-change.ts` (mới), `src/endpoints/admin/lead-assign.ts` (mới), `src/hooks/leads/lead-activity-hooks.ts` (`asSystemActivity`/`isSystemActivity` — dùng bởi status-activity + guard activity tay), `src/collections/Leads.ts` (hooks), `src/payload.config.ts` (endpoints), bảng `lead_activities`, `audit_logs`, `payload_jobs`; mọi đường đổi `assignedTo` (endpoint, form/REST admin, tự giao BR-12 ở endpoint công khai tạo lead); tests `tests/integration/leads.test.ts`, `lead-assign.test.ts`; docs API_SPEC §4, ERD, PERMISSION.

## Verify commands + result (theo `.context/project-config.md`)
| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` (toàn bộ) | PASS — 179 files / 1940 tests, 0 skipped (integration DB chạy thật, không skip) |
| `pnpm build` | PASS (exit 0) |

## Responsive Checklist Gate
N/A — diff không đụng UI (route/component/CSS).

## Skill gates
- aislop: skip, `aislop` not installed.
- oxlint (anti-slop): skip, oxlint not configured (repo dùng eslint, PASS).
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK — tên rõ, hàm < 50 dòng, file < 300 dòng, không magic number đáng kể (`MAX_BODY_CHARS` có tên), comment giải thích WHY, docs as-built cập nhật. 0 indicator.
- ai-friendly-web: N/A (endpoint admin nội bộ).
- blitzstrike: skip, không có môi trường/tool được phép.

## Kiểm đặc biệt
- **Thứ tự lỗi vs PERMISSION §5**: §5 (line 110-113) quy định authenticate 401 → authorize role 403 → checkOwnership 404. Endpoint chỉ admin nên 403 cho non-admin trước mọi tra cứu là đúng thứ tự và **không lộ** sự tồn tại lead (sale với id thật hay id lạ đều 403 — test line 159-160). Luật "404 thay 403" áp cho bước ownership, không áp ở đây. Nhất quán với tiền lệ `private-file-download`. OK.
- **BOLA**: endpoint admin-only, lead lấy theo id bằng `overrideAccess` sau khi đã xác nhận admin; update lại chạy `overrideAccess:false` với user admin. Không có đường cho sale. OK.
- **Idempotent**: hook so `from`/`to` thật (kể cả create); PATCH lưu lại không đổi `assignedTo`, PATCH status, endpoint giao trùng → không sinh gì (test 141-153, 180-201). Update lồng (`touchLeadLastActivity` cập nhật lead trong cùng req) → `from===to` → no-op. OK.
- **Bộ đếm `asSystemActivity`**: tăng/giảm trong try/finally, đúng với Promise.all, lỗi giữa chừng, lồng (4 unit + bulk 3 lead integration). Nguy cơ note tay song song bị coi là hệ thống: chỉ xảy ra nếu activity do người dùng nhập được tạo **trên cùng `req`** trong lúc đếm > 0; activity tay đi qua REST/admin là request riêng → hiện không khả thi. Residual cho code tương lai.
- **Email cùng transaction**: `jobs.queue({ req })` ghi `payload_jobs` trong transaction của lần lưu lead; không có `autoRun` (`src/jobs/index.ts:12`), worker riêng chỉ thấy job sau commit → rollback thì không gửi. OK.
- **PII**: audit chỉ id + `code` (test kiểm không chứa phone); log endpoint chỉ `errorName`; job input chứa `fullName` + `phone` đúng theo schema template BR-13 (có từ L1-T07). OK — nhưng xem MAJOR-1 về người nhận.
- **Helper test `db.updateOne`**: chỉ bỏ hook ở fixture của `leads.test.ts`; đường hook thật (create có `assignedTo`, PATCH, endpoint, bỏ giao) được phủ ở `lead-assign.test.ts`; assertion 1→2 ở leads.test chạy hook thật. Không che lỗi. OK.
- **Form admin gán cho sale bị khoá/admin**: KHÔNG chấp nhận được như residual — xem MAJOR-1.

## Findings

### [MAJOR-1] Form/REST admin giao được cho sale bị khoá / admin → email PII khách gửi tới tài khoản đã khoá
- `src/collections/Leads.ts:102` — field `assignedTo` không có `filterOptions`/`validate` (chỉ `access: isAdmin`).
- `src/hooks/leads/on-assignment-change.ts:35-37` — `queueAssignedEmail` chỉ kiểm `staff?.email`, không kiểm `active`/`role`.
- Endpoint chặn đúng (`lead-assign.ts:44-47`), nhưng đường form/REST admin (AC "Admin đổi trong form admin cho kết quả giống hệt endpoint") thì không: dropdown liệt kê mọi staff, admin chọn nhầm nhân viên đã nghỉ (bị khoá) → hook xếp job gửi họ tên + SĐT khách tới email của người đã nghỉ (allowlist email chỉ lọc theo môi trường, prod không chặn), lead lại "được giao" cho người không đăng nhập được → lead mồ côi. Hai đường cho kết quả khác nhau, trái AC.
- Fix đề xuất: đặt luật ở một chỗ dùng chung cho mọi đường — thêm `validate` (và `filterOptions: { role: { equals: 'sale' }, active: { equals: true } }` cho UI) trên `assignedTo` từ chối staff không phải sale `active` khi giá trị **đổi**; đồng thời `queueAssignedEmail` bỏ qua khi `staff.active !== true` (phòng thủ). Thêm test integration: PATCH `assignedTo = lockedSale.id` / `admin.id` → 400, snapshot không đổi.

### [MINOR-1] Giao trùng người vẫn ghi lead
- `src/endpoints/admin/lead-assign.ts:49-58` — `changed:false` vẫn gọi `payload.update` (bump `updatedAt`, chạy toàn bộ hook). Đề xuất: `if (!changed) return ok({...lead})` không update.

### [MINOR-2] Lead đã xoá mềm sửa qua form admin vẫn gửi email giao
- `src/hooks/leads/on-assignment-change.ts:79` — điều kiện chỉ `!doc.anonymizedAt`. Admin sửa `assignedTo` của lead trong thùng rác (`guardTrashedEdit` cho admin) → sale nhận email cho lead đã xoá. Đề xuất thêm `&& !doc.deletedAt`.

### [MINOR-3] Bảng PERMISSION hỏng cột
- `docs/PERMISSION.md:92` — dòng có 4 ô (`... BR-12 | (as-built L9-T03: ...)`) trong bảng 3 cột; ghi chú as-built rơi ra ngoài cột. Đề xuất gộp ghi chú vào ô thứ 3.

### [MINOR-4] Residual — race giao đồng thời
- Hai admin gọi assign cùng lúc trên lead chưa giao → cả hai transaction có thể đọc `from=null` → 2 activity "from null". Chấp nhận (tần suất rất thấp), ghi residual.

## Residual risk
- `isSystemActivity` có phạm vi cả `req`: code tương lai tạo activity theo dữ liệu người dùng trong cùng request đang có activity hệ thống sẽ lọt guard.
- Không chạy app/manual; xác minh qua test + đọc code.

## Verdict
❌ **FAIL** — còn 1 MAJOR (MAJOR-1). Builder sửa MAJOR-1 (+ nên xử lý MINOR-1..3), rồi review round 2.
