# Runbook — nhập nội dung thật + gói EN (BL-072)

Hai công cụ ghi dữ liệu nội dung **lên staging/production** từ repo, mặc định **dry-run**, ghi thật chỉ khi có biến xác nhận:

| Việc | Lệnh | Mặc định | Ghi thật khi |
|---|---|---|---|
| Nhập 3 dự án + 8 tin (chỉ `vi`, chỉ tạo mới) | `pnpm content:import [apply]` | dry-run | `apply` + `IMPORT_CONFIRM=2026-10-23` |
| Ghi EN viết sẵn cho đúng các bản ghi trong gói | `pnpm english:pack <gói> [apply] [overwrite]` | dry-run | `apply` + `ENGLISH_PACK_CONFIRM=<gói>` |

Khác `pnpm seed:english` (BL-064): lệnh đó **chỉ DB dev** (ghi đè EN của biên tập viên, quét cả DB) và vẫn bị chặn ở staging/prod. Gói EN chỉ ghi bản ghi có khoá trong gói, mỗi khoá phải khớp đúng 1 bản ghi `vi`, không ghi đè EN đã có khác gói (trừ `overwrite`), không bao giờ ghi `vi`, không xếp job dịch AI. Định dạng gói: `seed/english/README.md` § "Gói EN (staging/prod)". Dữ liệu nhập: `seed/content/README.md`.

Cả hai in `APP_ENV` + `host:port/tên-db` (không in mật khẩu) trước khi chạy: **đọc dòng đó, đúng môi trường mới tiếp**. Script chạy trong container app (`scripts/` + `seed/` nằm trong image, `docker/Dockerfile`); dưới đây `$APP` = `tami-staging-app` (staging) hoặc `tami-app` (production), `$PG` = `tami-staging-postgres` / `tami-postgres`.

## Quy trình bắt buộc (staging và production)

1. **Backup trước khi ghi.** Staging không có pgBackRest (deploy.md §9.5) nên tự dump; production dùng thêm bản full pgBackRest (`docker exec tami-backup bash /opt/backup/pg-backup.sh full`) nếu đã bật.
   ```bash
   # $U/$DB = user và tên DB Postgres của môi trường (POSTGRES_USER / POSTGRES_DB trong env của $PG); $OUT = thư mục NGOÀI volume DB trên server, vd /var/backups/tami
   docker exec $PG pg_dump -U $U -Fc $DB > "$OUT/$DB-pre-content-$(date +%F-%H%M).dump"
   ```
   Chỉ bảng liên quan cũng được, nhưng dump cả DB đơn giản hơn và restore được hết (`docs/runbooks/restore.md`).
2. **Nhập nội dung (nếu DB chưa có dự án/tin)** — ảnh (184 MB) không nằm trong repo:
   ```bash
   docker cp <thư-mục-ảnh-trên-server>/. $APP:/tmp/import-img      # chứa manifest.json + ảnh
   docker exec -e IMPORT_IMG_DIR=/tmp/import-img $APP pnpm content:import          # dry-run
   ```
   Đọc từng dòng: `sẽ tạo` / `đã có, bỏ qua`; dòng `LỖI` (thiếu file ảnh, thiếu ảnh bìa, còn `[CẦN KIỂM TRA]`, thiếu danh mục/tỉnh/admin) → sửa rồi chạy lại, exit code ≠ 0 khi còn lỗi. Production DB trống cần đã chạy `pnpm seed` (tỉnh, danh mục) và có tài khoản admin.
   **Hỏi người duyệt (user) "ok" sau dry-run**, rồi:
   ```bash
   docker exec -e IMPORT_IMG_DIR=/tmp/import-img -e IMPORT_CONFIRM=2026-10-23 $APP pnpm content:import apply
   docker exec -e IMPORT_IMG_DIR=/tmp/import-img $APP pnpm content:import          # chạy lại: mọi dòng "đã có, bỏ qua"
   ```
   `apply` tự dry-run trước và dừng (chưa ghi gì) nếu còn lỗi. Lỗi giữa chừng khi ghi (mạng/S3) → chạy lại `apply` được (bản đã tạo bị bỏ qua), hoặc restore dump.
3. **Gói EN** (sau khi có bản `vi` và gói đã được commit + deploy):
   ```bash
   docker exec $APP pnpm english:pack <gói>                                   # dry-run
   docker exec -e ENGLISH_PACK_CONFIRM=<gói> $APP pnpm english:pack <gói> apply
   docker exec $APP pnpm english:pack <gói>                                   # chạy lại: phải toàn "không đổi", exit 0
   ```
   Dry-run in mỗi bản ghi `sẽ ghi` / `không đổi` / `bỏ qua: <lý do>` / `thiếu bản vi`; exit 1 khi có dòng `bỏ qua` hoặc `thiếu bản vi`. Lý do thường gặp: `khoá trùng N+ bản ghi` (hai bản ghi cùng tiêu đề → sửa tiêu đề hoặc bỏ khỏi gói; script không ghi bản nào; riêng `categories` cùng tên ở nhiều scope được áp cho từng bản, mỗi bản một dòng `<tên> [<scope>]`), `EN đã có, khác gói` (biên tập viên đã nhập EN → giữ nguyên; chỉ thêm `overwrite` khi người duyệt đồng ý ghi đè), `thiếu trường EN bắt buộc`, `số ô chữ lệch` (bản `vi` đã sửa sau khi viết gói).
4. **Kiểm tra bằng mắt:** `/vi` và `/en` của dự án, tin, danh sách; alt ảnh EN (trang chi tiết).

## Rollback

- `vi` không bao giờ bị gói EN ghi; script nhập chỉ tạo mới, không sửa/xoá bản có sẵn.
- Gói EN sai: sửa lại tệp gói, deploy, chạy `english:pack <gói> apply overwrite` (ghi đè EN theo gói) hoặc sửa tay trong admin. EN của bản ghi mới có thể xoá tay trong admin.
- Nhập sai/nửa vời: restore dump ở bước 1 (`docs/runbooks/restore.md`), hoặc xoá bản ghi mới trong admin. **Lưu ý:** script nhập tìm bản có sẵn kể cả bản đã xoá mềm (thùng rác), nên bản xoá mềm vẫn được tính là "đã có, bỏ qua" và chạy lại sẽ KHÔNG tạo lại. Muốn nhập lại: khôi phục bản đó từ thùng rác trong admin (nếu chỉ cần lấy lại), hoặc xoá hẳn (xoá vĩnh viễn trong thùng rác) rồi chạy lại, hoặc restore dump.

## Việc KHÔNG làm

- Không chạy `db push`, `migrate reset`, seed/reset; không clone dữ liệu staging → production (AGENTS.md).
- Không đặt sẵn `IMPORT_CONFIRM` / `ENGLISH_PACK_CONFIRM` trong `.env`: chỉ gõ trên dòng lệnh `apply`, sau dry-run.
