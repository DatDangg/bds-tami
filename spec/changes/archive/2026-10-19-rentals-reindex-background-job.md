---
id: rentals-reindex-background-job
type: feature
status: done
created: 2026-10-19
backlog: BL-006
---

# Reindex `rentals.searchText` > 500 tin chạy nền bằng Payload Jobs + cảnh báo admin

## Yêu cầu
MODIFY (review L8-T03 MINOR-2). Đổi tên tỉnh/phường/dự án có > 500 tin cho thuê → hook hiện bỏ qua reindex, chỉ log lệnh `pnpm reindex:rentals-search` (`src/lib/search/reindex-in-hook.ts`). Chuyển thành Payload Jobs task chạy nền (cần migration thêm giá trị enum task) + cảnh báo trên admin.

## Acceptance (bắt buộc)
- [ ] > 500 tin bị ảnh hưởng → xếp 1 job reindex (task mới) thay vì bỏ qua; ≤ 500 giữ reindex đồng bộ như cũ
- [ ] Job xử lý theo lô, idempotent, chạy lại an toàn; lỗi được log + retry theo cấu hình Jobs
- [ ] Migration versioned thêm giá trị enum task (không destructive; nếu rủi ro → gắn HIGH_RISK_MIGRATION và dừng hỏi)
- [ ] Admin thấy cảnh báo khi reindex được xếp chạy nền
- [ ] Test hook + task; `pnpm test`/lint/typecheck/build PASS

## Ghi chú
Migration safety theo AGENTS.md. Không chạy migrate trên staging/prod.
