# feature-production-new-server-tamihomes · phase-3-task-01 — Cắt chuyển: khoá ghi → dump cuối → restore → đối chiếu → tên miền cũ 301 (BL-112)

- Phụ thuộc: phase-2-task-03 PASS. **User chọn giờ** (đề xuất: ngay sau khi P2 xong, giờ ít người — traffic hiện rất thấp, chưa có lead).
- Trạng thái: `pending` — plan duyệt 2026-11-06T07:45Z. Một `[XÁC NHẬN]` cho cả chuỗi (các lệnh đã diễn tập ở P2.T02).

## Classification / Risk
- Risk: **HIGH** — `HIGH_RISK_DATA`: thay toàn bộ DB/object của prod mới (chỉ chứa bản thử) bằng bản cuối. Review: **STRICT**.

## Downtime ước tính
- `tami.genieplatform.cloud`: ~20–30 phút (khoá ghi tới khi bật 301). `tamihomes.vn`: ~10–15 phút (lúc restore, Nginx trả 502).
- Dữ liệu nhỏ (DB 166 MB, file ~250 MB) nên dump/restore/chép mỗi bước vài phút.
- User **không sửa nội dung trong /admin** từ lúc bắt đầu tới khi báo xong.

## Việc
1. Server cũ — khoá ghi: `docker stop tami-app tami-jobs` (không `down`, không `-v`). Site cũ tạm lỗi 502.
2. Dump cuối `pg_dump -Fc` + chép 2 bucket prod → server mới (`/opt/tami/transfer`).
3. Server mới: `docker stop tami-app tami-jobs tami-backup`; DROP + CREATE database `tami` trong cùng cluster (giữ system-id ⇒ stanza backup vẫn hợp lệ) rồi `pg_restore`; xoá object cũ + chép object mới vào 2 bucket.
4. Đếm đối chiếu cũ ↔ mới: số bảng, `count(*)` toàn bộ bảng `public` (script so 2 danh sách), số object + byte mỗi bucket. Lệch → DỪNG, không bật 301.
5. Server mới: `FLUSHALL` redis prod + `$C up -d --force-recreate app jobs backup` (bỏ cache dữ liệu thử); health 200.
6. Server cũ: thay `sites-enabled/tami-prod-direct.conf` bằng `tami-prod-genieplatform-redirect.conf` (giữ bản sao), `nginx -t`, reload. Cổng 80 + cert cũ giữ nguyên.
7. `pg-backup.sh full` + `restic backup` ngay sau restore (P3.T02 kiểm).

## Verify
- Đếm khớp 100% (ghi bảng so sánh vào Evidence).
- `curl -sI https://tami.genieplatform.cloud/du-an/x` → 301 `https://tamihomes.vn/du-an/x`.
- Đăng nhập admin trên tamihomes.vn được (cùng `PAYLOAD_SECRET`; cookie cũ thuộc domain cũ nên phải đăng nhập lại — bình thường).

## Rollback (trong lúc prod cũ chưa bị dừng hẳn — P4.T02)
- Server cũ: trả `tami-prod-direct.conf`, reload nginx, `docker start tami-app tami-jobs` → `tami.genieplatform.cloud` chạy lại như trước (dữ liệu cũ nguyên vẹn).
- Dữ liệu nhập trên tamihomes.vn sau cắt chuyển sẽ **không** có ở bản cũ (chép ngược tay nếu cần).
- `tamihomes.vn`: gỡ symlink 443 hoặc để nguyên; DNS không cần đổi.

## Retry / Escalation
Lệch số liệu / restore lỗi → rollback ngay, không thử lại trong cùng cửa sổ. 3 attempt fail → `architecture_review_needed`.
