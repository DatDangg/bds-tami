Agent: reviewer

# Review — build-tami-website BL-003 (round 1)

- **Review level:** STRICT
- **Reason:** đụng file migration đã apply (ngoại lệ "không sửa migration đã apply" được user duyệt — `.context/progress.json` decision 2026-10-18T00:45). Migration → STRICT bắt buộc, dù diff nhỏ và cơ học.
- **Scope:** diff chưa commit vs HEAD `0f7e5fa`, trừ `.context/progress.json`, `.context/runs/*`, `.claude/launch.json`:
  9 file `migrations/*.ts` (click_events, categories_developers, translation_usage, services_pages, news, provinces_wards, projects, job_postings, redirects) + `docs/runbooks/deploy.md` (1 bullet).
- **Blast radius:** chỉ đường `payload migrate:down` (DB dev/test). Đường `up` (chạy ở staging/prod), file snapshot `.json`, `migrations/index.ts` không đổi → schema sinh ra và bảng `payload_migrations` không bị ảnh hưởng. Không đụng code app/API/UI.

## Kiểm tra

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Mọi hunk nằm trong `down` | OK | `git diff -U6 HEAD`: cả 9 file, hunk header đều `export async function down(...)` hoặc context chứa `DROP TABLE ... CASCADE` sau `down` (translation_usage/redirects: header là `up` nhưng dòng `export async function down` nằm trong context phía trên dòng đổi) |
| Không đổi `up` / `.json` / `index.ts` | OK | `git diff --stat HEAD -- migrations docs` chỉ liệt kê 9 file `.ts` + `deploy.md`; `git status` không có `.json`/`index.ts` |
| Không đổi ngữ nghĩa ngoài `IF EXISTS` | OK | 28 dòng đổi = đúng 1:1 `DROP CONSTRAINT "x"` → `DROP CONSTRAINT IF EXISTS "x"` và `DROP INDEX "x"` → `DROP INDEX IF EXISTS "x"`; tên object, thứ tự lệnh giữ nguyên |
| Root cause hợp lý | OK | `DROP TABLE "<t>" CASCADE` gỡ FK `payload_locked_documents_rels_<t>_fk` (FK tham chiếu bảng bị drop) → lệnh `DROP CONSTRAINT` ngay sau đó lỗi "does not exist". `IF EXISTS` sửa đúng chỗ |
| Migration khác không cần fix | OK | Grep `DROP (CONSTRAINT\|INDEX) "` trong `migrations/` chỉ còn `staff_auth.ts:16` và `globals_translation_group.ts:42-47` — đều trong `down` nhưng drop index trên bảng KHÔNG bị drop trước đó (`staff`, `site_settings`, `header`, `footer`) → object còn tồn tại, không lỗi. Không còn `DROP CONSTRAINT` trần ở file nào |
| Evidence round-trip | Chấp nhận (không tự chạy) | Builder: DB tạm `tami_bl003_check` up 17 → down 17 (0 bảng/enum còn lại) → up 17 → drop DB; dev DB giữ 17 row. Reviewer không được chạy `payload migrate`; đánh giá từ code — nhất quán với root cause |
| Migration safety gate | OK | Không thêm destructive op mới; `up` không đổi nên không cần `HIGH_RISK_MIGRATION`; runbook ghi rõ `migrate:down` cấm trên staging/prod, rollback prod vẫn fix-forward |

## Verify commands + result (từ `.context/project-config.md`)

- `pnpm lint` → exit 0
- `pnpm typecheck` → exit 0
- `pnpm test` → exit 0 — 108 files / 1174 tests passed
- `pnpm build` → skip (diff chỉ đổi chuỗi SQL trong `down` + markdown; typecheck đã phủ TS; không ảnh hưởng bundle)

## Responsive Checklist Gate

N/A — diff không đụng UI.

## Skill gates

- aislop: skip — diff là chuỗi SQL do Payload sinh + 1 bullet doc, không phải code viết tay
- oxlint (anti-slop): skip, oxlint not configured (repo dùng eslint — `pnpm lint` PASS)
- ocr (open-code-review): skip, ocr not installed
- AI-readable: OK — 0 indicator (không hàm mới, không magic number; runbook đã cập nhật)
- ai-friendly-web: N/A — không public-facing
- blitzstrike: N/A — không đụng auth/API/input

## Findings

- **[MINOR]** `docs/runbooks/deploy.md:105` — câu "vì `DROP TABLE ... CASCADE` đã gỡ sẵn các object đó" chỉ đúng với FK constraint. Index `payload_locked_documents_rels_<t>_id_idx` nằm trên cột của `payload_locked_documents_rels` (bảng không bị drop) nên CASCADE không gỡ; `DROP INDEX IF EXISTS` ở đây chỉ là phòng thủ vô hại. Đề xuất (tuỳ chọn): sửa thành "...vì `DROP TABLE ... CASCADE` đã gỡ sẵn FK; `DROP INDEX IF EXISTS` thêm để phòng thủ". Không chặn PASS.
- **[MINOR / residual risk]** Không tự kiểm chứng được round-trip trên DB (không được phép chạy `payload migrate`). Đánh giá dựa trên phân tích code + evidence của builder; rủi ro thấp vì `IF EXISTS` chỉ nới điều kiện, không thể làm `down` đang chạy được thành lỗi.
- Ghi chú: các file migration có cảnh báo git LF→CRLF; không phải thay đổi nội dung, không tính là finding.

## Verdict

**PASS** — không có CRITICAL/MAJOR. Thay đổi đúng như mô tả, chỉ nằm trong `down`, đúng ngoại lệ đã duyệt; verify commands đều PASS.
