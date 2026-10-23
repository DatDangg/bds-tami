# feature-new-content-english · phase-2-task-01 — Áp gói EN lên staging (ops, có checkpoint)

- Nguồn: BL-072. **Phụ thuộc phase 1 PASS + commit + deploy staging** (image mới có `scripts/apply-english-pack.ts` + `seed/english/packs/`).
- Trạng thái: **pending** (plan đã duyệt 2026-10-23) — **mỗi lệnh GHI staging cần user "ok" riêng** (không builder; primary/devops chạy theo runbook T01 D7).

## Classification / Risk
- Type: **ADDITIVE** (ghi dữ liệu staging, locale `en`). Risk: **HIGH** — staging không có backup tự động; nội dung thật đã nhập tay.
- Review: reviewer STRICT đọc log dry-run trước khi apply (chỉ đọc).

## Các bước
1. `docker exec tami-staging-app pnpm english:pack 2026-10-23-real-content` (dry-run, chỉ đọc) → log: 3 dự án + 3 chủ đầu tư + danh mục + 8 tin `sẽ ghi`, 0 `bỏ qua`/`lệch`. Lệch (vi staging khác vi dev) → dừng, sửa gói ở phase 1, không ghi.
2. Backup: `pg_dump` DB staging ra file trên host (ghi đường dẫn + kích thước).
3. ⏸ user "ok" → `docker exec -e ENGLISH_PACK_CONFIRM=2026-10-23-real-content tami-staging-app pnpm english:pack 2026-10-23-real-content apply`.
4. Dry-run lại → 100% `không đổi`.
5. Kiểm `/en` staging: `/en`, `/en/projects` + 3 chi tiết, `/en/news` + 8 tin — EN, không lẫn tiếng Việt (ngoài tên riêng/địa chỉ), ảnh có alt EN.
6. Ghi evidence (log, số đếm) vào Verification summary.

## Acceptance
- [ ] `/en` các trang trên staging hiển thị EN; chạy lại không ghi đè/nhân đôi.
