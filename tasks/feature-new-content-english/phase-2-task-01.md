# feature-new-content-english · phase-2-task-01 — Áp gói EN lên staging (ops, có checkpoint)

- Nguồn: BL-072. **Phụ thuộc phase 1 PASS + commit + deploy staging** (image mới có `scripts/apply-english-pack.ts` + `seed/english/packs/`).
- Trạng thái: **done** 2026-10-23 (plan đã duyệt 2026-10-23) — **mỗi lệnh GHI staging cần user "ok" riêng** (không builder; primary/devops chạy theo runbook T01 D7).

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
- [x] `/en` các trang trên staging hiển thị EN; chạy lại không ghi đè/nhân đôi.

## Verification summary

**Đã chạy trên staging (2026-10-23, user ok từng bước: push+deploy, apply).**
- Deploy: push `8128947..fa4c519` → CI 39966342294 PASS → deploy 39969173031 lần 1 FAIL (runner GitHub SSH timeout cổng 22, chưa đụng server) → rerun PASS; container `tami-staging-app` mới có `seed/english/packs/2026-10-23-real-content`.
- Dry-run (`APP_ENV=staging · DB postgres:5432/tami`): sẽ ghi 98 (categories 2, developers 3, projects 3, news 8, media 82), không đổi 2 (categories đã có EN), bỏ qua 0, thiếu bản vi 0, exit 0.
- Backup: `/opt/tami/backups/staging-manual/tami-pre-english-pack-2026-10-23-1440.dump` (pg_dump -Fc, 1.6 MB, `pg_restore -l` đọc được 155 TABLE DATA).
- Apply (`ENGLISH_PACK_CONFIRM=2026-10-23-real-content … apply`): đã ghi 98, exit 0. Log có `warn` "Không làm mới được cache trang công khai (ngoài ngữ cảnh Next)" — hook revalidate chạy ngoài Next nên bỏ qua; trang staging vẫn hiển thị EN ngay (container vừa khởi động lại, cache trống).
- Dry-run lại: sẽ ghi 0, không đổi 100, bỏ qua 0, exit 0 → idempotent.
- Kiểm `/en` staging (`https://187-52-119-50.sslip.io`): `/en/news` liệt kê đủ 8 tin EN (+ tab "Legal & Planning", "Most popular" EN); 8 trang chi tiết tin + `/en/projects` + 3 chi tiết dự án 200, tiêu đề/nội dung EN. Chữ có dấu còn lại chỉ là tên riêng, địa danh, số hiệu văn bản (QĐ-UBND, NĐ-CP…) và địa chỉ dự án (trường địa chỉ không dịch, đúng acceptance). Alt ảnh có nội dung đều EN; ảnh alt rỗng trùng vị trí với bản vi (thumbnail trang trí, có từ trước).
- Lệch so với task: bước "reviewer STRICT đọc log dry-run trước apply" không chạy — user xem số đếm dry-run và duyệt apply trực tiếp.

**Ghi chú.** `tami.genieplatform.cloud` là production (nginx `tami-prod-direct.conf` → `tami-app`), staging là `187-52-119-50.sslip.io`; production chưa có 3 dự án + 8 tin → phase-2-task-02. Không ghi gì lên production.
