Agent: reviewer

# Review — feature-staging-new-server-nginx-tamihomes · phase-2-task-01 · round 1 (BL-111)

- Task: `tasks/feature-staging-new-server-nginx-tamihomes/phase-2-task-01.md`
- Scope: ops on shared server `server` (root@179.197.242.57). No repo source diff (evidence only).
- Date: 2026-11-06 (server clock ~04:03 UTC)

## Review level
**STRICT**

## Reason
The task touched a shared production-class host (supabase / airoom / outfit-changer / nextlevel and others): package install, swap, new system user with docker group (root-equivalent), SSH authorized_keys, and an nginx listener on 0.0.0.0:80. Risk areas: security/SSH access, other tenants on the host, infrastructure. The task file also sets STRICT.

## Blast radius
- Host-wide: `/etc/fstab`, `/swapfile`, `/etc/sysctl.d/99-tami-swap.conf` (vm.swappiness, global), apt package set, nginx on :80 (IPv4 + IPv6), certbot.timer.
- Access: new user `deploy` in group `docker`, which is effectively root on the host. Access is through key `tami-ci-deploy-staging`.
- Other tenants: containers and services sharing docker/dbus/ssh. Checked below: none were restarted.
- Repo: `docker/nginx/tami-staging-tamihomes-http.conf` (installed copy), `docs/runbooks/deploy.md` §11.

## Verify commands + result
All server commands were read-only, sent over `ssh server '...'`. Nothing was installed, restarted or edited on the server.

| Check | Command | Result |
|---|---|---|
| Swap 4G active | `swapon --show`, `free -h` | `/swapfile file 4G` (56M used); Swap 4.0Gi. OK |
| Swapfile perms | `ls -l /swapfile` | `-rw------- root root 4294967296`. OK |
| fstab line + backup | `grep swap /etc/fstab`; `diff fstab.bak.tami-20261106 fstab` | Only diff: `> /swapfile none swap sw 0 0`. Backup exists (197 B vs 224 B). OK |
| swappiness | `cat /etc/sysctl.d/99-tami-swap.conf`; `sysctl vm.swappiness` | `vm.swappiness=10` / live `10`. OK |
| Packages | `dpkg -l nginx nginx-common certbot apache2-utils` | `ii` nginx 1.28.3-2ubuntu1.12, certbot 4.0.0-4, apache2-utils 2.4.66-2ubuntu2.6. OK |
| No upgrade / no `apt upgrade` | `tail /var/log/apt/history.log`; grep Commandline/Upgrade | 2026-11-06 03:59:46 has one entry, `apt-get install -y --no-upgrade --no-install-recommends nginx certbot apache2-utils`, with **Install only (13 pkgs), no `Upgrade:` line**. Earlier `Upgrade:` entries all come from `/usr/bin/unattended-upgrade` on 11-04/11-05 and predate the task. No `apt upgrade`/`dist-upgrade` Commandline. OK |
| No reboot | `uptime -s` / `uptime` | Boot 2026-10-17 14:37:59, up 19 days. (`last` is not installed on the host, so `uptime` was used instead.) OK |
| sshd untouched | `stat /etc/ssh/sshd_config`; `ls -la sshd_config.d` | sshd_config mtime 2026-10-12; drop-ins dated 09-21 / 10-12 / 10-27. None from today. OK |
| root password | `passwd -S root` | Last change 2026-10-12. Unchanged. OK |
| ufw | `ufw status` | `inactive`. OK |
| deploy user | `id deploy` | uid=1000 gid=1000 groups deploy,users,docker. OK |
| ~deploy/.ssh perms | `stat` | `.ssh` drwx------ deploy:deploy; `authorized_keys` -rw------- deploy:deploy. OK |
| authorized_keys | `wc -l`; `ssh-keygen -lf` | 1 line, `ssh-ed25519 … tami-ci-deploy-staging`, `SHA256:InvLfBwXHxo29/g9guq3heRPuB06nwC8QMvLgvC/gs0`. OK |
| /opt/tami | `stat`, `ls -la /opt/tami` | /opt/tami, state, releases all drwxr-x--- deploy:deploy. `/opt/tami/backup` does not exist. OK |
| /var/www/certbot | `stat`; `find -mindepth 1` | drwxr-xr-x root:root, **empty** (ACME test file was removed). OK |
| sites-enabled | `ls -la /etc/nginx/sites-enabled` | `default` -> sites-available/default; `tami-staging-tamihomes-http.conf` -> sites-available/…. Nothing else. OK |
| Installed conf == repo | server `sha256sum` vs `git show HEAD:docker/nginx/tami-staging-tamihomes-http.conf \| sha256sum` | Both `ec71329ec50dcf0e516fa0d75e44eb41f910d371f52a3f8fe9f32106e2a97c1e`. LF-exact match with committed 940ab50c. OK |
| nginx -t | `nginx -t` | syntax ok / test successful; `active`; nginx + certbot.timer `enabled`. OK |
| Listeners | `ss -ltnp \| grep :80\|:443` | nginx on 0.0.0.0:80 and [::]:80 only; **nothing on 443**. OK |
| Other tenants | `docker ps --format '{{.Names}} {{.Status}}'` | 15 containers, uptimes 25h / 4d / 8d / 10d, the same as the builder's before-snapshot. `unhealthy` (airoom-b1-api, supabase-storage, supabase-rest) was already there before. No restart. OK |
| Core services not restarted | `systemctl show -p ActiveEnterTimestamp` | dbus, systemd-logind, networkd-dispatcher, unattended-upgrades, containerd, docker all from 2026-10-17 boot. ssh from 2026-11-04 06:42, an unattended-upgrade restart that predates the task. OK |
| curl IP (dev) | `curl -sI http://179.197.242.57/` | `HTTP/1.1 200 OK`, `Server: nginx/1.28.3 (Ubuntu)`. OK |
| curl Host staging (dev) | `curl -sI -H 'Host: staging.tamihomes.vn' http://179.197.242.57/` | `301 Moved Permanently`, `Location: https://staging.tamihomes.vn/`. OK |
| 443 (dev) | `curl -s -w '%{http_code}' https://179.197.242.57/` | `000` (not listening, as expected before phase 3). OK |
| CI key on dev | `ls -l ~/.ssh/tami_ci_deploy{,.pub}`; `ssh-keygen -lf ~/.ssh/tami_ci_deploy.pub` | Both exist (419 B / 104 B). Fingerprint `SHA256:InvLfBwX…gs0 tami-ci-deploy-staging (ED25519)` **matches** the server authorized_keys entry. Private key was not printed. OK |
| Repo verify commands (test/lint/build) | — | skip: no repo source change in this task (ops-only, evidence in the task file). |

## Responsive Checklist Gate
N/A: no UI in diff (ops task, server config only).

## Skill gates
- aislop: N/A, no code diff.
- oxlint (anti-slop): N/A, no TS/JS diff.
- ocr (open-code-review): N/A, no code diff (ocr not required).
- AI-readable: OK. No code. The task Evidence is specific and verifiable.
- ai-friendly-web: N/A. The staging host is intentionally `noindex` and not public-facing for crawlers.
- blitzstrike: skip, no authorized pentest environment / not applicable to host-prep ops. Exposure surface was checked manually: only :80 is open, the default site plus a 301 vhost.

## needrestart deferred services — risk assessment
dbus, networkd-dispatcher, systemd-logind and unattended-upgrades were listed as deferred under `NEEDRESTART_MODE=l`. The task's apt run installed only new packages and upgraded no shared library. So the stale-library state comes from the **pre-existing** unattended-upgrades of 2026-11-04 (libpcre2-8-0, bind9-libs, apt/libapt-pkg). This task did not cause it.
`/var/run/reboot-required` (mtime 2026-11-04 06:43, pkgs `linux-image-7.0.0-42-generic`, `linux-base`) is also pre-existing.
- Risk: low. These services keep running on the old mapped libraries. The main exposure is unpatched libpcre2 inside those daemons until the next reboot.
- Restarting `dbus` live is risky: it can break logind/docker interaction. Do not do it ad hoc. The right fix is a planned host reboot, coordinated with the other tenants. That is the server owner's decision and is outside BL-111 scope.

## Findings
- **[MINOR] Runbook drift**: `docs/runbooks/deploy.md:374-375` (§11.2 steps 1–2). The documented simulate/install commands are `apt-get install [-s] --no-upgrade nginx certbot`. The command actually run (and specified in the task) added `--no-install-recommends` and `apache2-utils`. The task's Acceptance says "Doc impact: runbook §11 (bổ sung kết quả thực tế nếu khác dự kiến)", but `docs/runbooks/deploy.md` is not modified in the working tree. Fix: update §11.2 to the exact command plus the result (13 new pkgs, 0 upgraded). Also explain why `apache2-utils` is there even though §11 says "không basic auth", or drop it from future runs.
- **[MINOR] Status line stale**: `tasks/feature-staging-new-server-nginx-tamihomes/phase-2-task-01.md:5` still says `Trạng thái: pending` and the Acceptance boxes (lines 31–34) are unchecked, although the Evidence shows they are met. Fix at close-out.
- **[MINOR] Residual, confirm with user**: `/root/.ssh/authorized_keys` mtime is 2026-11-06 03:22:51 UTC. That is today, about 37 min before the task's apt run, and it is not in the task's allowed command list. It is most likely the user's own SSH-alias setup, but it was not recorded in the task Evidence. Fix: confirm in the task Evidence that this was not changed by the builder (sshd_config and the root password are confirmed untouched).
- **[MINOR] Residual, dev key ACL**: Git Bash shows `~/.ssh/tami_ci_deploy` as `-rw-r--r--`. On Windows the real protection is the NTFS ACL, which the allowed commands cannot check. Fix: user runs `icacls %USERPROFILE%\.ssh\tami_ci_deploy` and confirms only the owner has access, and deletes or archives the local copy after putting it in the GitHub secret (phase-2-task-03).

No CRITICAL or MAJOR findings. All Acceptance items were independently verified:
- swap is active and set in fstab, with no reboot;
- only new packages were installed and nothing was upgraded;
- no tenant service or container was restarted;
- port 80 is reachable, the vhost returns 301, and the ACME webroot is in place and empty;
- user `deploy`, the docker group and `/opt/tami` permissions are correct;
- the installed conf is byte-identical to HEAD.

## Residual risk
- The ACME serving path was not re-probed by the reviewer, because that needs a test file written on the server. The builder's evidence (`test-ok`) and the empty webroot together are accepted.
- The `deploy` user being in group docker gives root on a shared host. This was intended by design (runbook §11.2), and the key is CI-only. The private key must stay out of logs.
- The pending kernel reboot and the stale libraries in deferred services predate this task (see the assessment above).

## Verdict
**PASS**
