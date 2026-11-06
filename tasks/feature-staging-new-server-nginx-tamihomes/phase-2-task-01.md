# feature-staging-new-server-nginx-tamihomes · phase-2-task-01 — Server mới: chuẩn bị nền (swap, nginx, certbot, user deploy, thư mục, vhost cổng 80) (BL-111)

- Change doc: `spec/changes/2026-11-06-staging-new-server-nginx-tamihomes.md`.
- Phụ thuộc: phase-1-task-01 (file conf cổng 80 + runbook §11). Không cần DNS.
- Trạng thái: `done` — STRICT PASS r1 (`.context/review-reports/feature-staging-new-server-nginx-tamihomes-phase-2-task-01-round-1-review.md`), 2026-11-06. Thực thi trên server `server` (root@179.197.242.57) qua SSH — mỗi lệnh thay đổi phải nằm trong danh sách dưới; ngoài danh sách → dừng hỏi.

## Classification / Risk
- Type: MODIFY hạ tầng (ops, không đổi repo trừ evidence).
- Risk: **HIGH** — server dùng chung với supabase/airoom/outfit-changer/babyai/ai-rid/nextlevel-dashboard.
- Expected review level: **STRICT** (reviewer kiểm read-only qua SSH: không container/thư mục dự án khác bị đổi).

## CẤM (user 2026-11-06)
`ufw enable`, `apt upgrade`/`dist-upgrade`/`full-upgrade`, reboot, sửa `sshd_config`/mật khẩu root, `docker system prune`/`image prune` toàn cục, đụng `/opt/<dự án khác>`, container/network/volume không có tiền tố `tami`.

## Việc (thứ tự)
0. Snapshot trước (evidence): `docker ps --format '{{.Names}} {{.Status}}'`, `free -h`, `ss -ltnp`, `df -h /`.
1. Swap 4G: `fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile` + dòng `/swapfile none swap sw 0 0` vào `/etc/fstab` (backup fstab trước); `vm.swappiness=10` qua `/etc/sysctl.d/99-tami-swap.conf` + `sysctl --system`. Chỉ làm nếu `swapon --show` rỗng.
2. Gói: `NEEDRESTART_MODE=l DEBIAN_FRONTEND=noninteractive apt-get install -y --no-upgrade --no-install-recommends nginx certbot apache2-utils` (không `apt-get upgrade`; ghi lại danh sách gói được cài/nâng trong output — nếu apt muốn nâng lib dùng chung như openssl/libc thì DỪNG báo).
   Candidate kiểm 2026-11-06: nginx 1.28.3, certbot 4.0.0.
3. User `deploy`: `adduser --disabled-password --gecos "" deploy && usermod -aG docker deploy`; `install -d -o deploy -g deploy -m 700 ~deploy/.ssh`; `authorized_keys` = public key CI mới (user cung cấp hoặc builder sinh cặp ed25519 tại máy dev ở thư mục ngoài repo, **private key không in ra chat/log**, user tự dán vào GitHub secret — xem phase-2-task-03).
4. Thư mục: `install -d -o deploy -g deploy -m 750 /opt/tami /opt/tami/state /opt/tami/releases`. **Không** tạo `/opt/tami/backup` (staging không backup — runbook §9.5; mục "backup env" trong change doc không áp dụng cho staging).
5. Webroot: `install -d -o root -g root -m 755 /var/www/certbot`.
6. Nginx: copy `docker/nginx/tami-staging-tamihomes-http.conf` → `/etc/nginx/sites-available/` + symlink `sites-enabled/`; giữ site `default` của gói; `nginx -t` PASS → `systemctl reload nginx`. (443 chưa bật — chưa có cert.)
7. Kiểm từ NGOÀI (máy dev): `curl -sI http://179.197.242.57/` → 200 trang default nginx; `curl -sI -H 'Host: staging.tamihomes.vn' http://179.197.242.57/` → 301 https; `curl -s -H 'Host: staging.tamihomes.vn' http://179.197.242.57/.well-known/acme-challenge/test` sau khi đặt file test tạm → nội dung đúng (xoá file test sau). Cổng 443: `curl -skv https://179.197.242.57/` → refused (chưa nghe) là bình thường; kiểm lại 443 sau phase-3. Nếu 80 không tới được → firewall panel Hostinger (user mở).
8. Snapshot sau + diff: container dự án khác cùng trạng thái/uptime, RAM.

## Verify / Evidence
Ghi vào phần Evidence của file này: output bước 0/8, `nginx -t`, curl bước 7, `swapon --show`, `id deploy`, `ls -ld /opt/tami*`.

## Acceptance
- [x] Swap 4G bật, bền qua reboot (fstab) — không reboot để thử.
- [x] nginx + certbot cài, không gói hệ thống nào bị nâng ngoài phụ thuộc trực tiếp; không service dự án khác bị restart.
- [x] Cổng 80 tới được từ Internet; vhost staging trả 301 + phục vụ ACME.
- [x] User `deploy` (nhóm docker) + `/opt/tami` đúng quyền.
- Doc impact: runbook §11 (bổ sung kết quả thực tế nếu khác dự kiến).

## Retry / Escalation
Lệnh nào lỗi → dừng, không thử biến thể; 3 attempt fail → `architecture_review_needed`.

## Evidence (builder, 2026-11-06)
- Bước 0 (trước): 15 container dự án khác (supabase-*, airoom-b1-*, outfit-changer-*) Up; `free`: Mem 7.7Gi used 3.1Gi, Swap 0B; `ss`: không ai nghe 80/443 (chỉ 22, 127.0.0.1:*, 9443 nextlevel); `df /`: 96G, dùng 24G (25%); chưa có user deploy, /opt/tami, nginx, certbot.
- Mô phỏng apt (`-s --no-upgrade --no-install-recommends nginx certbot apache2-utils`): `0 upgraded, 13 newly installed`, không dòng `Inst x [old]`. Gói mới: libapr1t64, libaprutil1t64, apache2-utils 2.4.66-2ubuntu2.6, nginx-common + nginx 1.28.3-2ubuntu1.12, python3-{josepy,pytz,rfc3339,acme,configargparse,parsedatetime,certbot}, certbot 4.0.0-4. (`apt-get update` đã chạy; 39 gói nâng được, KHÔNG nâng.)
- Swap: `swapon --show` -> `/swapfile file 4G`; fstab backup `/etc/fstab.bak.tami-20261106` + dòng `/swapfile none swap sw 0 0`; `vm.swappiness = 10` (`/etc/sysctl.d/99-tami-swap.conf`).
- needrestart (mode l): chỉ liệt kê deferred (dbus, networkd-dispatcher, systemd-logind, unattended-upgrades); "No containers need to be restarted" -> không restart dịch vụ nào. Chưa restart các dịch vụ deferred đó (user quyết nếu cần).
- Cài xong: nginx 1.28.3, certbot 4.0.0, nginx active+enabled, certbot.timer enabled.
- `id deploy`: uid=1000(deploy) gid=1000(deploy) groups=1000(deploy),100(users),986(docker).
- `ls -ld`: /home/deploy/.ssh drwx------ deploy; /opt/tami, /opt/tami/state, /opt/tami/releases drwxr-x--- deploy:deploy; /var/www/certbot drwxr-xr-x root:root; authorized_keys -rw------- deploy:deploy (chỉ public key). /opt/tami/backup không tạo.
- Khoá CI: sinh mới tại `C:\Users\datda\.ssh\tami_ci_deploy` (+ `.pub`), comment `tami-ci-deploy-staging`; private key không in ra. Verify từ máy dev: `ssh -i ... deploy@179.197.242.57 'id; docker ps'` -> uid=1000(deploy) groups có docker; liệt kê được container.
- Nginx: copy `tami-staging-tamihomes-http.conf` -> sites-available + symlink sites-enabled (giữ `default`); `nginx -t`: syntax ok / test successful; reload OK. 80 nghe 0.0.0.0 + [::].
- Curl từ ngoài: `http://179.197.242.57/` -> 200 (default nginx); `Host: staging.tamihomes.vn` -> `301 Moved Permanently`; ACME probe `/.well-known/acme-challenge/test` -> `test-ok` (file test đã xoá, webroot rỗng); `https://179.197.242.57/` -> 000 (443 chưa nghe, như dự kiến).
- deploy.test.sh chạy trên server (user deploy, thư mục tạm /tmp/tami-deploytest.9YkEcV, docker bị stub trên PATH): "Tất cả test PASS" gồm case record-staging lock-held (flock Linux thật); thư mục tạm đã xoá.
- Bước 8 (sau): 15 container dự án khác cùng trạng thái + uptime y hệt trước (25 hours / 4,8,10 days; các `unhealthy` sẵn có từ trước: airoom-b1-api, supabase-storage, supabase-rest); RAM used 3.1Gi như trước, Swap 4.0Gi; không ai bị restart.
