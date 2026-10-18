# Spec Update — 2026-10-19 rentals-reindex-background-job

**spec_version:** 1.7.0 → 1.8.0 (MINOR — đổi hành vi: đổi tên tỉnh/phường/dự án có > 500 tin cho thuê không còn bỏ qua reindex mà xếp job nền + cảnh báo admin; không đổi API công khai)

**Trigger:** feature-update (Change Request MODIFY, BL-006) — change doc `spec/changes/2026-10-19-rentals-reindex-background-job.md`, task `tasks/feature-rentals-reindex-background-job/phase-1-task-01.md`

**Nguồn:** review L8-T03 MINOR-2 — hook đổi tên tỉnh/phường/dự án với > 500 tin bị ảnh hưởng chỉ log lệnh `pnpm reindex:rentals-search` và bỏ qua reindex (`src/lib/search/reindex-in-hook.ts`) → tìm kiếm không dấu theo tên mới không khớp cho tới khi có người chạy tay.

**Requirements:**
- SỬA **Quy tắc biên (edge cases)** trong `SPECIFICATIONS.md` — thêm bullet "Đổi tên tỉnh / phường (tên, tên cũ) / dự án": `searchText` của các tin cho thuê thuộc phạm vi được dựng lại; ≤ 500 tin → đồng bộ trong lần lưu (như cũ); > 500 tin → xếp 1 job nền Payload Jobs `reindex-rentals-search` (theo lô, idempotent, retry theo cấu hình Jobs) + form admin của bản ghi hiện cảnh báo "đang dựng lại chỉ mục tìm kiếm ở chế độ nền" tới khi job xong. Lệnh tay `pnpm reindex:rentals-search` giữ để chạy bù toàn bộ.
- Liên quan (không đổi chữ): **F3 / FR-PUB-04** (tìm theo từ khoá không dấu `/cho-thue?q=`), **LGL-01** (lưu tên cũ để tìm kiếm), **F10** (quản trị danh mục địa danh/dự án).

**Code dự kiến (builder chốt):**
- `src/lib/search/reindex-in-hook.ts` (> 500 → queue job thay vì bỏ qua)
- `src/jobs/reindex-rentals-search.ts` (mới — task Payload Jobs theo lô, idempotent)
- `src/jobs/index.ts` (đăng ký task)
- Hook reindex-rentals của collection provinces / wards / projects
- Component cảnh báo trên form admin tỉnh/phường/dự án
- `migrations/<mới>` (thêm giá trị enum task của Payload Jobs — versioned, phải inspect; destructive → `HIGH_RISK_MIGRATION`)

**Schema/API:** API công khai không đổi. Schema: thêm giá trị enum task cho bảng jobs của Payload (migration mới).

**Ảnh hưởng:**
- Tìm kiếm cho thuê `/cho-thue?q=` sau khi đổi tên tỉnh/phường/dự án (cả nhánh ≤ 500 và > 500).
- Admin: form tỉnh/phường/dự án (lưu + cảnh báo).
- Jobs runner Payload (task mới, retry, chạy lại an toàn).

**Scope sinh:** `spec/test-scope/current.json` scopeVersion 8
