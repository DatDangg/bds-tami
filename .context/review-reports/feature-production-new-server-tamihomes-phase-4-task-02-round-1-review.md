Agent: reviewer

# Review — feature-production-new-server-tamihomes · phase-4-task-02 · round 1 (BL-112)

- **Review level:** NORMAL
- **Reason:** Task spec chỉ định NORMAL. Không đổi code app/schema/API/auth. Thao tác server chỉ là dừng container + gỡ symlink vhost, không xoá dữ liệu. Data loss là mức risk đỏ duy nhất có thể có; reviewer đã tự kiểm chỉ-đọc trên server, volume và `/opt/tami` còn đủ, nên không cần nâng lên STRICT.
- **Blast radius:** server cũ 187.52.119.50 (container `tami*`, Nginx `sites-enabled`, cert `tami.genieplatform.cloud`); URL công khai `tami.genieplatform.cloud` (301), `tamihomes.vn`, `187-52-119-50.sslip.io` (đã ngừng); docs as-built (`docs/runbooks/deploy.md`, `docs/runbooks/restore.md`, `docs/ARCHITECTURE.md` §6 qua `arch-bl112.diff`), `.context/project-config.md`, `.context/decisions.md`, `SPECIFICATIONS.md`, `spec/CHANGELOG.md`, `spec/updates/…`, `spec/test-scope/current.json` (template test dùng `productionBaseUrl`).

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| Verify app (test/lint/typecheck/build) | skip, không đổi code app (chỉ docs/spec/hạ tầng) |
| `ssh server-old` (chỉ đọc): `docker ps -a … \| grep tami` | 13 container `tami*` đều `Exited` (postgres/redis/seaweedfs/backup/staging-* exit 0, 5 phút trước lúc review; `tami-app`/`tami-jobs` dừng từ 2 ngày trước, khớp P3). Không còn container nào đang chạy |
| `docker volume ls \| grep tami` | đủ 9 volume: `tami_{backup-mirror,backup-state,postgres-data,postgres-socket,redis-data,seaweedfs-data}`, `tami-staging_{postgres-data,redis-data,seaweedfs-data}`, khớp §12.1c |
| `docker inspect … RestartPolicy` | cả 13 container = `no` |
| `ls -l /etc/nginx/sites-enabled \| grep tami` | còn `tami-prod-direct-http.conf`, `tami-prod-genieplatform-redirect.conf`, `tami-staging-sslip-http.conf`; `tami-staging-sslip.conf` đã gỡ |
| `ls sites-available \| grep tami` | còn `tami-staging-sslip.conf`, `tami-prod-direct.conf` (đường rollback còn) |
| `ls -ld /opt/tami /opt/tami/*` | `/opt/tami` còn nguyên (`prod.env`, `staging.env`, `backup/`, `releases/`, `state/`…) |
| `curl -sI https://tami.genieplatform.cloud/du-an` | 301 → `https://tamihomes.vn/du-an` (giữ path) |
| `curl -sI https://tamihomes.vn/` | 200, HSTS `max-age=31536000` |
| `curl -sI https://www.tamihomes.vn/` | 301 → `https://tamihomes.vn/` |
| `curl -sI http://tami.genieplatform.cloud/` | 301 → https (cổng 80 còn hoạt động) |
| JSON parse `spec/test-scope/current.json` + `archive/test-scope-1.63.0-117.json` | hợp lệ; current: specVersion 1.63.1, scopeVersion 118, `productionBaseUrl` = `https://tamihomes.vn`; archive: 1.63.0 / 117 |
| `node scripts/sync-claude.mjs --check` | `✓ .claude/ khớp nguồn`, exit 0 |
| `certbot renew --dry-run` | không chạy lại (lệnh certbot nằm ngoài quyền reviewer); lấy theo evidence của builder, xem Residual risk |

## Kiểm theo trọng tâm
- **Docs có khớp thực tế server:** OK. Danh sách container, 9 volume, restart policy, các vhost giữ/gỡ và hành vi 301 trong §12.1c, Decision 13, project-config và ARCHITECTURE §6 đều khớp kết quả kiểm trực tiếp. `mem_limit 1g` + `shared_buffers=256MB` của postgres prod khớp `docker/docker-compose.prod.yml:156-186`.
- **Lộ secret:** OK. Diff chỉ có IP, hostname, tên biến, path kho R2 và fingerprint host key (thông tin công khai). Không có giá trị env, mật khẩu hay token.
- **Hạ cấp intent docs:** OK. `SPECIFICATIONS.md` chỉ thêm bullet as-built BL-112 và chuyển câu BL-111 thành lịch sử. Các bullet intent ("Cloudflare phía trước", CI/CD, backup) giữ nguyên.
- **Dữ liệu cũ còn đủ:** OK (volume + `/opt/tami` + file vhost trong `sites-available`).
- **Đường rollback (§12.2 "Sau P4.T02"):** OK về logic: bật lại restart policy, start theo thứ tự hạ tầng → app, trả symlink `tami-prod-direct.conf` (file còn trên server). Có một điểm mơ hồ, ghi ở MINOR-3.
- **Cross-ref:** OK. `deploy.md` §3 và §12.1 bước 1 (P2.T01, dòng 421-423), §12.1c, §11.1, Decision 12/13, `restore.md` → §12.1c, ARCHITECTURE → §11/§12 đều trỏ đúng.
- **Phạm vi ARCHITECTURE:** chỉ review hunk §6 trong `arch-bl112.diff` như được giao. Các hunk đều thuộc §6.1/6.2/6.3/ngoại lệ môi trường.

## Responsive Checklist Gate
N/A: diff không đụng UI (route/component/CSS).

## Skill gates
- aislop: N/A, không có code thay đổi (chỉ docs/spec/JSON).
- oxlint (anti-slop): N/A, diff không đụng TS/JS.
- ocr (open-code-review): N/A, không có code.
- AI-readable: OK. Có 1 indicator nhẹ: con số tổng RAM bị cũ (MINOR-1). Dưới ngưỡng 3.
- ai-friendly-web: N/A, task hạ tầng, không đổi bề mặt web public. Ghi chú thêm: robots/sitemap/canonical của `tamihomes.vn` đã kiểm ở P3.T02.
- blitzstrike: N/A, task không phải STRICT.

## Findings
**[CRITICAL]** không có.
**[MAJOR]** không có.

**[MINOR-1]** `docs/ARCHITECTURE.md` §6.2, hunk dòng "Tổng trần `mem_limit` as-built" trong `arch-bl112.diff`: con số prod đã giảm từ ≈ 4,2GB xuống ≈ 3,1GB nhưng tổng vẫn ghi "≈ 7,5GB". Tính lại: 3,1 + 2,3 + 1 ≈ **6,4GB**.
Cách sửa: đổi "≈ 7,5GB" thành "≈ 6,4GB" (cả trong working tree và bản diff sẽ commit).

**[MINOR-2]** Trường trigger ghi không thống nhất: `spec/updates/2026-11-09-production-new-server-tamihomes.md:4` ghi `feature-update`, còn `spec/test-scope/current.json` ghi `"trigger": "change-request"`.
Cách sửa: chọn một giá trị theo quy ước của `.agent/spec-publish.md` và dùng cho cả hai file.

**[MINOR-3]** `docs/runbooks/restore.md` (khối As-built) nói kho cũ `/tami-prod`, `tami-prod-files` là "**không ghi vào**". Nhưng rollback trong `docs/runbooks/deploy.md` §12.2 "Sau P4.T02" có bước `docker start tami-postgres … tami-backup` trên server cũ. Postgres cũ đang bật `archive_mode`, sidecar backup dùng `$BK` cũ, nên khi chạy lại sẽ tiếp tục ghi WAL/backup vào kho cũ. Hành vi này đúng khi rollback, nhưng hai câu đang mâu thuẫn trên chữ.
Cách sửa: thêm vào restore.md cụm "(trừ khi rollback theo deploy.md §12.2 — stack cũ chạy lại sẽ ghi tiếp vào kho cũ)".

**[MINOR-4]** Đoạn "Ngoại lệ production" trong ARCHITECTURE §6 (`arch-bl112.diff`) vẫn giữ câu "Production DB khởi đầu trống (không clone dữ liệu staging), nội dung nhập lại qua admin". Câu này đúng với lần dựng prod năm 2026-10-23. Còn prod trên server mới được chuyển bằng dump prod cũ (đối chiếu 100%), không bắt đầu trống, nên đọc lướt dễ hiểu sai.
Cách sửa: thêm "(lần dựng 2026-10-23; BL-112 chuyển nguyên dữ liệu prod cũ sang server mới)".

Ngoài scope, đề xuất task riêng: ARCHITECTURE §6.2 tính "backup 256m" vào tổng trần staging dù staging không có service backup (đã có từ trước, không thuộc diff này).

## Residual risk
- Reviewer không chạy lại `certbot renew --dry-run` vì nằm ngoài quyền chỉ-đọc. Kết quả PASS lấy theo evidence của builder. Cấu hình sau khi gỡ vhost có hỗ trợ kết quả này: site cổng 80 `tami-staging-sslip-http.conf` + `tami-prod-direct-http.conf` vẫn bật, và `http://tami.genieplatform.cloud/` vẫn phản hồi.
- `https://187-52-119-50.sslip.io` giờ rơi vào site 443 mặc định của dự án khác. Hệ quả này đã được ghi lại và chấp nhận (§12.1c, Decision 13).
- Kho R2 cũ còn hay không thì không kiểm được bằng lệnh của reviewer. Diff không có bước xoá nào.

## Verdict
✅ **PASS**: không có CRITICAL/MAJOR. Trạng thái server khớp docs, dữ liệu cũ còn nguyên, đường rollback dùng được, test-scope hợp lệ với `productionBaseUrl` = `https://tamihomes.vn`, sync-claude không lệch. Nên sửa 4 MINOR trước khi commit (không bắt buộc).
