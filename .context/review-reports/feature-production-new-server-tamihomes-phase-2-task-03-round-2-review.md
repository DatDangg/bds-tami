Agent: reviewer

# Review — feature-production-new-server-tamihomes · phase-2-task-03 · round 2 (BL-112)

- Review level: **STRICT**
- Reason: backup/restore production; runbook khôi phục sự cố (data loss / RTO); kho R2 dùng chung bucket với server cũ. Giữ level của round 1.
- Blast radius: `docs/runbooks/restore.md` (§3.1, §3.2, §8) và task file. Diff round 2 không đụng source, image hay trạng thái server. Server production (`server`, 179.197.242.57) đã kiểm ở round 1; round này chỉ đọc lại heartbeat.

## Verify commands + result
- Diff chỉ là docs và task file (không có TS/JS) → test/lint/typecheck/build: `N/A (docs-only diff)`.
- `git diff docs/runbooks/restore.md tasks/.../phase-2-task-03.md`: 3 hunk trong restore.md (dòng 97, dòng 116, dòng bảng §8) và các mục Decision log / Evidence / Round 2 trong task file. Thay đổi chưa commit khác trong working tree (.github/, scripts/deploy, deploy.md, src/…) là của việc khác, **ngoài scope**.
- Grep `pg-restore\.sh` trong toàn repo (trừ `.context/`): các lệnh gọi script trong docs chỉ có ở `restore.md:97` và `restore.md:116`, cả hai đều đã là `bash ./pg-restore.sh`. `restore.md:87` chỉ nêu tên công cụ; `restore.md:220` là dòng §8 ghi lại lỗi; `e2e.sh:191` gọi bằng `bash`. Không còn chỗ nào trong `docs/` gọi `./pg-restore.sh` trực tiếp.
- Grep thêm kiểu `./<x>.sh` không có `bash` đứng trước trong `restore.md`: không có kết quả.
- Server, chỉ đọc (`ssh server "docker exec tami-backup cat …/tami_backup.prom"`, now=1793953427): `last_run_ok` wal, pg_full, **pg_diff** và files đều bằng **1**. `pg_diff` last_success = 1793953084, tức khoảng 08:18Z. Lần retry 30 phút sau `FAIL pg_diff` 07:47Z đã thành công; điều này xác nhận nhận định ở MINOR-3 của round 1. wal last_success = 1793953074, cách lúc đọc khoảng 6 phút. **OK**

## Đối chiếu finding round 1
- **MAJOR-1: ĐÃ SỬA.** Cả §3.1 (`:97`) và §3.2 (`:116`) đã đổi thành `bash ./pg-restore.sh`. Dòng §8 ghi lại lỗi lần gọi đầu (rc=126, file không có bit exec) và cách gọi đúng. Builder chọn phương án (a), không đổi mode file, nên không đụng source. Không còn chỗ gọi hỏng nào khác.
- **MINOR-1: ĐÃ SỬA.** Decision log giờ ghi đúng: `$C exec` dùng được nếu export `TAMI_IMAGE` theo restore.md:10; builder dùng `docker exec` vì cho kết quả tương đương.
- **MINOR-2: ĐÃ GHI** vào Residual ở mục Round 2 (sha256 mới so 300/1593 file). Vẫn là residual, không chặn.
- **MINOR-3: ĐÃ GHI** ở mục Round 2 rằng `pg_diff` có thể tự retry. Tôi đã kiểm: hiện `pg_diff`=1. Câu "chưa có `.success` cho tới đêm nay" trong Decision log cũ nay đã lỗi thời (xem MINOR-A).

## Responsive Checklist Gate
N/A: diff không đụng UI.

## Skill gates
- aislop: N/A (diff không có code)
- oxlint (anti-slop): N/A (không có TS/JS)
- ocr (open-code-review): N/A (không có code)
- AI-readable: OK (2 dòng lệnh và 1 dòng bảng trong docs; không có indicator)
- ai-friendly-web: N/A (task hạ tầng nội bộ)
- blitzstrike: N/A (không có bề mặt auth/API/input)

## Findings

### [MINOR-A] Residual `pg_diff` trong Decision log đã lỗi thời (task file, dòng Residual của Decision log)
- Câu "Heartbeat `pg_diff` chưa có `.success` cho tới đêm nay" không còn đúng: heartbeat cho thấy `pg_diff` OK lúc khoảng 08:18Z (1793953084). Fix khi close-out: thêm 1 dòng ghi `pg_diff` đã về 1 lúc khoảng 08:18Z (retry). Không chặn PASS.

Không có CRITICAL hoặc MAJOR.

## Residual risk
- Chưa diễn tập PITR `--target-time`; chưa so nội dung dòng, mới chỉ so `count(*)`.
- restic mới so sha256 trên mẫu 300/1593 file; lần diễn tập sau nên so manifest của toàn bộ file.
- RTO khoảng 4 phút 20 giây với DB 83,5MB; DB lớn hơn sẽ chậm hơn do R2 round-trip nhiều file nhỏ.
- Bucket `tami-prod-backup` dùng chung với kho của server cũ (tách bằng path `-s2`); cần kế hoạch xử lý kho cũ khi tắt server cũ (ngoài scope).
- `docker/backup/pg-restore.sh` vẫn mode `100644`. Runbook đã đúng, nhưng nếu tài liệu nào sau này gọi `./pg-restore.sh` thì sẽ lỗi lại. Tuỳ chọn: tạo task riêng để `chmod +x` trong git.

## Verdict: PASS
MAJOR-1 đã sửa ở mọi chỗ gọi `pg-restore.sh` trong docs. MINOR-1 đã sửa; MINOR-2 và MINOR-3 đã ghi vào residual. Heartbeat production cho thấy cả 4 loại backup có `last_run_ok`=1. Chỉ còn MINOR-A, cập nhật lúc close-out.
