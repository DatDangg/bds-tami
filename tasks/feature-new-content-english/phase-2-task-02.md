# feature-new-content-english · phase-2-task-02 — Đưa 3 dự án + 8 tin (vi + EN) lên production (ops, có checkpoint)

- Nguồn: BL-072. Trạng thái: **pending** — user chốt Q2 = (a) 2026-10-23: script nhập chạy được ở prod khi có `IMPORT_CONFIRM` + dry-run mặc định. Phụ thuộc phase-2-task-01 PASS trên staging + deploy prod có image mới. **Mỗi lệnh GHI prod cần user "ok" riêng.**

## Classification / Risk
- Type: **ADDITIVE** (ghi dữ liệu prod). Risk: **HIGH** — DB production; không seed/reset, không clone staging→prod (AGENTS.md Non-negotiables). Chỉ tạo mới bản ghi của bộ dữ liệu, không cập nhật/xoá bản ghi khác.

## Các bước
1. Backup prod (pgBackRest full/diff theo `docs/runbooks/restore.md`, hoặc `pg_dump`), ghi mốc.
2. Chép thư mục ảnh (ngoài repo) vào container/volume tạm; `IMPORT_IMG_DIR=… pnpm payload run scripts/import-content.ts` (dry-run) → ⏸ user ok → `IMPORT_CONFIRM=2026-10-23 … apply` → dry-run lại = `đã có, bỏ qua` toàn bộ.
3. `pnpm english:pack 2026-10-23-real-content` dry-run → ⏸ user ok → `ENGLISH_PACK_CONFIRM=2026-10-23-real-content … apply` → dry-run lại `không đổi`.
4. Kiểm `/vi` + `/en` prod; dọn thư mục ảnh tạm.

## Acceptance
- [ ] Prod có 3 dự án + 8 tin song ngữ, cùng nội dung staging đã duyệt; không đụng bản ghi khác.
