# feature-new-content-english · phase-2-task-02 — Đưa 3 dự án + 8 tin (vi + EN) lên production (ops, có checkpoint)

- Nguồn: BL-072. Trạng thái: **done** 2026-10-23 — user chốt Q2 = (a) 2026-10-23: script nhập chạy được ở prod khi có `IMPORT_CONFIRM` + dry-run mặc định. Phụ thuộc phase-2-task-01 PASS trên staging + deploy prod có image mới. **Mỗi lệnh GHI prod cần user "ok" riêng.**

## Classification / Risk
- Type: **ADDITIVE** (ghi dữ liệu prod). Risk: **HIGH** — DB production; không seed/reset, không clone staging→prod (AGENTS.md Non-negotiables). Chỉ tạo mới bản ghi của bộ dữ liệu, không cập nhật/xoá bản ghi khác.

## Các bước
1. Backup prod (pgBackRest full/diff theo `docs/runbooks/restore.md`, hoặc `pg_dump`), ghi mốc.
2. Chép thư mục ảnh (ngoài repo) vào container/volume tạm; `IMPORT_IMG_DIR=… pnpm payload run scripts/import-content.ts` (dry-run) → ⏸ user ok → `IMPORT_CONFIRM=2026-10-23 … apply` → dry-run lại = `đã có, bỏ qua` toàn bộ.
3. `pnpm english:pack 2026-10-23-real-content` dry-run → ⏸ user ok → `ENGLISH_PACK_CONFIRM=2026-10-23-real-content … apply` → dry-run lại `không đổi`.
4. Kiểm `/vi` + `/en` prod; dọn thư mục ảnh tạm.

## Acceptance
- [x] Prod có 3 dự án + 8 tin song ngữ, cùng nội dung staging đã duyệt; không đụng bản ghi khác.

## Verification summary

**Đã chạy trên production (2026-10-23, user ok từng bước: deploy+backup+dry-run, tạo danh mục, nhập, ghi EN, dọn dẹp).**
- Deploy: `deploy-production.yml` run 39972700485, SHA `fa4c519` (đã qua staging, digest `240ceb22` = staging) PASS. Không migration (`8128947..fa4c519` chỉ `Staff.ts` admin.condition).
- Backup: `pg_dump` `/opt/tami/backups/production-manual/tami-pre-content-2026-10-23-1450.dump` (1.0 MB, 155 TABLE DATA) + pgBackRest full `20261023-215037F` (74.2 MB, R2).
- Ảnh: `.import-tmp/img` (184 MB, 83 file) → server → `tami-app:/tmp/import-img`.
- Dry-run `content:import` lần 1: 3 dự án LỖI thiếu danh mục `project` (prod không chạy seed mẫu; `seed/categories.ts`: project do admin tự thêm; cấm seed prod). User yêu cầu tạo thay: script one-off (dry-run → apply, không commit) tạo 4 danh mục project: "Căn hộ chung cư", "Nhà phố, biệt thự" (vi; EN do gói ghi), "Khu đô thị"/"Urban areas", "Nghỉ dưỡng"/"Resorts" (vi + en, `hasEnglish`) — như staging. Chạy lại → 4 đã có.
- Dry-run lần 2: 16 sẽ tạo, 90 ảnh/tệp tải lên, 0 lỗi.
- Apply: tạm `tami-seaweedfs` 768m. Lần 1 **EXIT 137** — tiến trình script `node` trong `tami-app` bị kernel OOM-kill (cgroup 1 GB, anon-rss ~847 MB) sau khi tạo 3 CĐT + maison-privee + 56 media; web app vẫn healthy. Tạm `tami-app` 2g → apply lần 2: 12 đã tạo, 4 đã có, 0 lỗi, exit 0. Dry-run lại: 0 sẽ tạo, 16 đã có. Khớp staging: rels dự án 14/15/15, 8 tin, 82 media. Trả `tami-app` 1g/swap 2g, `tami-seaweedfs` 256m/swap 512m — seaweedfs bị kill khi hạ (đang ~263 MB) và tự restart (`unless-stopped`), healthy sau ~20s; `/api/media` 82/82 file 200.
- `english:pack` dry-run: sẽ ghi 100 (categories 4, developers 3, projects 3, news 8, media 82), bỏ qua 0, thiếu bản vi 0 → apply: đã ghi 100, exit 0 (62 warn revalidate ngoài Next) → dry-run lại: không đổi 100.
- Kiểm `https://tami.genieplatform.cloud`: `/en`, `/en/news`, `/en/projects` + 3 chi tiết dự án + 8 chi tiết tin đều 200, EN (chữ có dấu chỉ còn tên riêng/số hiệu văn bản/địa chỉ), không cache cũ; `/tin-tuc`, `/du-an` vi đủ tin/dự án.
- Dọn: xoá `/opt/tami/import/2026-10-23-img`, `tami-app:/tmp/import-img`, script one-off. Giữ 2 file `pg_dump` trong `/opt/tami/backups/*-manual/`.

**Residual / follow-up.**
- `content:import` dry-run trả exit 0 khi có dòng LỖI (runbook ghi ≠ 0); apply vẫn tự chặn khi còn lỗi.
- `content:import` giữ nhiều ảnh trong bộ nhớ → vượt 1 GB của `tami-app` với ~90 ảnh; lần nhập lớn sau cần tạm nâng RAM hoặc sửa script giải phóng buffer.
- SeaweedFS 256 MB (BL-070) sát mức dùng thực (~263 MB sau nhập): hạ giới hạn khi đang cao làm restart.
- Runbook `english-pack.md` chưa nói prod thiếu danh mục `project` (chỉ nhắc `pnpm seed`, mà seed bị cấm ở prod).
