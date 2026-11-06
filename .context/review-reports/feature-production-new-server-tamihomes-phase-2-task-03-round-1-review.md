Agent: reviewer

# Review — feature-production-new-server-tamihomes · phase-2-task-03 · round 1 (BL-112)

- Review level: **STRICT**
- Reason: backup/restore production, kho R2 dùng chung bucket với kho của server cũ, runbook khôi phục sự cố (data loss / RTO).
- Blast radius: production `server` (179.197.242.57): tami-postgres (archive_command), tami-backup, kho R2 `tami-prod-backup` (path `/tami-prod-s2` và repo `tami-prod-files-s2` mới; kho cũ `/tami-prod` và `tami-prod-files` của server-old dùng chung bucket); `docs/runbooks/restore.md` (runbook sự cố). Trên cùng host còn các dự án khác (outfit-changer, airoom, supabase, tami-staging), không được đụng tới.

## Verify commands + result
- Diff chỉ là docs (`docs/runbooks/restore.md`, 1 dòng bảng §8) và task file, không có TS/JS → test/lint/typecheck/build: `N/A (docs-only diff)`.
- Kiểm CHỈ ĐỌC trên server (2026-11-06 ~08:17Z):
  - `docker exec tami-backup bash /opt/backup/pg-backup.sh info`: stanza `tami` status ok, aes-256-cbc, **1 full** `20261106-145540F` (83.5MB, repo 8.8MB), WAL min/max `…01`/`…0E`. Env backup: `PGBACKREST_REPO1_PATH=/tami-prod-s2`, bucket `tami-prod-backup`; log `check` ghi `--repo1-path=/tami-prod-s2`. **OK**
  - `restic-backup.sh snapshots`: **1 snapshot** `569520db`, host `tami-production`, tag `tami-files`, `/mirror`, 245.351 MiB; `RESTIC_REPOSITORY` kết thúc bằng `/tami-prod-backup/tami-prod-files-s2`. **OK**
  - `tami_backup.prom`: last_success wal 1793952472 (≈9 phút trước, lúc now=1793953023), pg_full 1793952198, files 1793952210; last_run_ok wal/pg_full/files=1, pg_diff=0 (đúng với Residual của builder). **OK**
  - `pg_stat_archiver`: failed_count **44** (đọc 2 lần, không tăng), last_failed_wal `…01` lúc 07:54:58Z (trước stanza-create 07:55:11Z), last_archived `…0E` lúc 08:12:52Z. **OK**
  - Log tami-backup: `FAIL wal/pg_diff/files` lúc 07:47Z (container mới lên, khi chưa có stanza/repo, đúng như dự kiến), sau đó `OK wal` lúc 07:57Z và 08:07Z. **OK**
  - server-old `tami-backup`: `OK wal` đều 10 phút/lần từ 06:25Z đến 08:15:28Z, không đứt quãng lúc 07:55 đến 08:15Z. Kho cũ không bị ảnh hưởng. **OK**
  - Dọn diễn tập: không còn container, volume hay network nào có tên `drill*`; `/opt/tami/transfer` 0 mục; `/tmp` của tami-backup chỉ còn `pgbackrest` (không còn `/tmp/restored`). **OK**
  - RAM: used 3.6Gi, avail 4.2Gi, swap 1.5/4.0Gi. Mọi container `tami-*` (prod và staging) có `OOMKilled=false` `RestartCount=0`. Disk `/` 43%. **OK**
  - Dự án khác: outfit-changer/airoom/supabase uptime từ 45 phút đến 10 ngày. Các container unhealthy (airoom-b1-api, supabase-storage, supabase-rest) đã chạy 4 đến 10 ngày, có từ trước task này và không liên quan. **OK**
  - `/opt/tami/state/production.current` có trên server (liên quan finding MINOR-1).
- `git ls-files -s docker/backup/pg-restore.sh` → `100644` (không có exec bit); `pg-backup.sh` và `restic-backup.sh` cũng `100644`, nhưng runbook gọi 2 file này bằng `bash …` nên không bị ảnh hưởng.

## Đánh giá evidence diễn tập (acceptance "restore thử PASS")
- **pgBackRest: đủ** cho mục tiêu "restore bản mới nhất". Evidence gồm: volume mới, `archive_mode=off`, mạng riêng; `count(*)` của **toàn bộ 149 bảng** IDENTICAL với DB đang chạy (không chỉ vài bảng chính); 151 relation (149 bảng + 2 view) khớp mục Verify "151"; 7 extension; PostGIS đọc được (21/21 điểm); `pg_is_in_recovery()=f`; WAL failed_count không tăng (tôi đã kiểm độc lập). Phần này chưa chứng minh được: PITR `--target-time` (chưa thử) và so sánh nội dung (mới chỉ so số dòng). Hai điểm này là residual chấp nhận được cho lần diễn tập đầu, không chặn PASS.
- **restic: đủ ở mức chấp nhận.** 1593 = 1593 file, lệch 4096 B do `du -sb` tính cả inode thư mục (giải thích hợp lý), nhưng sha256 mới so **300/1593** file. Đây là residual MINOR: lần sau nên so manifest sha256 của toàn bộ file (`find -type f -exec sha256sum` hai phía rồi `diff`).
- Tôi không tự chạy lại diễn tập vì ngoài quyền chỉ đọc. Kết luận này dựa trên evidence của builder, đối chiếu với trạng thái server mà tôi kiểm được (info, snapshot, dọn dẹp, archiver), và các trạng thái đó nhất quán với evidence.

## Responsive Checklist Gate
N/A — diff không đụng UI.

## Skill gates
- aislop: N/A (diff không có code)
- oxlint (anti-slop): N/A (không có TS/JS)
- ocr (open-code-review): N/A (không có code)
- AI-readable: OK (1 dòng bảng docs; không có indicator)
- ai-friendly-web: N/A (task nội bộ hạ tầng)
- blitzstrike: N/A (không có bề mặt auth/API/input)

## Findings

### [MAJOR-1] Runbook khôi phục có lệnh hỏng mà diễn tập đã phát hiện nhưng chưa sửa — `docs/runbooks/restore.md:97` và `:116`
- Cả §3.1 (diễn tập) và **§3.2 (sự cố thật, khôi phục tại chỗ)** đều ghi `./pg-restore.sh …`. Trong git, file `docker/backup/pg-restore.sh` có mode `100644`, nên lệnh trả `Permission denied` rc=126; builder đã gặp đúng lỗi này ở lần chạy đầu (Decision log). Test `docker/backup/test/e2e.sh:191` gọi bằng `bash …pg-restore.sh` nên test che mất lỗi.
- Dòng §8 mới thêm ghi diễn tập PASS, và Decision log nói "không có chỗ nào cần sửa thêm". Như vậy runbook đang được xác nhận là đã diễn tập trong khi bước cốt lõi của nó không chạy được nguyên văn. Mục đích của diễn tập là bắt đúng loại lỗi này. Khi có sự cố thật (đang áp lực RTO), người vận hành sẽ vấp ở bước khôi phục.
- Fix (chọn 1, nên làm cả 2):
  - (a) Sửa `restore.md:97` và `:116` thành `bash ./pg-restore.sh …`. Cách này đúng trong mọi trường hợp vì release được checkout từ git, không giữ mode tuỳ ý.
  - (b) `git update-index --chmod=+x docker/backup/pg-restore.sh`. Cách này đụng source nên cần ghi rõ trong task.
  - Đồng thời thêm 1 dòng vào cột kết quả §8 hoặc vào §9 ghi rằng lần diễn tập đầu đã phát hiện và sửa lỗi này.

### [MINOR-1] Decision log ghi sai lý do không dùng được `$C` — task file dòng 28
- `restore.md:10` đã có sẵn `export TAMI_IMAGE="$(cat /opt/tami/state/$E.current)"` trong phần "Quy ước dòng lệnh"; `deploy.md:112-114` cũng ghi như vậy. Trên server, file `/opt/tami/state/production.current` có tồn tại. Vậy `$C exec …` chạy được nếu làm đúng quy ước; lỗi builder gặp là do bỏ qua dòng 10, không phải do runbook thiếu.
- **Không cần** sửa §12 hay restore.md về chuyện này. `docker exec tami-backup …` cho kết quả tương đương nên evidence vẫn hợp lệ. Fix: sửa câu trong Decision log cho đúng (ví dụ: "không export TAMI_IMAGE theo restore.md:10 nên dùng docker exec, tương đương"). Tuỳ chọn: thêm 1 dòng ghi chú cạnh dòng 11 rằng có thể dùng `docker exec tami-backup bash /opt/backup/…` thay `$C exec backup …`.

### [MINOR-2] Kiểm toàn vẹn restic chỉ trên mẫu 300/1593 file
- Task file dòng 42 và dòng §8 viết "sha256 300 file khớp". Lần diễn tập sau nên so manifest sha256 của toàn bộ file. Không chặn PASS.

### [MINOR-3] Residual `pg_diff=0`: phát biểu "chưa có .success cho tới đêm nay" có thể không chính xác
- Theo restore.md §1, job fail sẽ tự thử lại sau 30 phút. `FAIL pg_diff` lúc 07:47Z nên lần thử lại sẽ rơi vào khoảng 08:17Z, khi đã có full, nên có thể chạy diff và về 1 sớm hơn 02:00. Lúc kiểm (08:17:30Z) log chưa có dòng này. Không phải lỗi; chỉ cần ghi lại cho đúng sau khi xem log lần thử lại, hoặc để task sau kiểm heartbeat `pg_diff`.

## Residual risk
- Chưa thử PITR `--target-time`; chưa so nội dung dòng (chỉ so `count(*)`).
- RTO đo được với DB 83.5MB khoảng 4 phút 20 giây; với DB lớn hơn sẽ chậm do R2 round-trip nhiều file nhỏ (builder đã ghi lại).
- Bucket `tami-prod-backup` dùng chung với kho của server cũ: hiện tách được nhờ path `-s2`. Khi tắt server cũ cần có kế hoạch dọn hoặc giữ kho cũ (ngoài scope task này).

## Verdict: FAIL
Lý do duy nhất là MAJOR-1, fix chỉ 1 đến 2 dòng docs. Phần backup production và evidence diễn tập đạt acceptance về mặt kỹ thuật: info 1 full ở `/tami-prod-s2`, 1 snapshot `tami-prod-files-s2`, WAL không tăng lỗi, kho cũ vẫn OK wal, dọn sạch, không OOM, không đụng dự án khác. Sau khi sửa `restore.md:97/116` (và tuỳ chọn MINOR-1/2/3), chạy lại reviewer ở round 2 sẽ PASS.
