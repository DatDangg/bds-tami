# Image backup cho TAMI (ARCHITECTURE §8). Hai target dùng chung một Dockerfile để pgBackRest trong container postgres
# (archive_command) và trong sidecar `backup` (backup/check) luôn CÙNG phiên bản:
#   target `postgres` : postgis/postgis + pgbackrest  -> service `postgres` (staging/prod)
#   target `backup`   : target postgres + restic + rclone + openssh-client + curl -> service `backup`
# Dựng 1 lần trên server: `docker compose ... build postgres backup`. Tag cố định trong compose; đổi phiên bản = đổi tag
# (deploy.sh không `pull` các image này: chưa có tag thì `compose up` tự build).
# Ghim digest: tag đổi được, nếu upstream rebase tag lên Debian khác thì glibc/collation đổi ngay trên volume cũ. Digest này = image đã kiểm (Debian 11, glibc 2.31, PG 17.5).
# Nâng base = đổi digest + chạy lại docker/backup/test/e2e.sh (có case "chuyển image giữ dữ liệu").
ARG POSTGIS_IMAGE=postgis/postgis:17-3.5@sha256:01a6a70e41e6c4467c8f55f6063555ed72db2d6662cd0d571040d42eadaeb6f6
ARG PGBACKREST_VERSION=2.59.1-1.pgdg11+1

FROM restic/restic:0.17.3 AS restic
FROM rclone/rclone:1.68.2 AS rclone

FROM ${POSTGIS_IMAGE} AS postgres
ARG PGBACKREST_VERSION
# Giữ nguyên base `17-3.5` (Debian 11): đổi base sang Debian khác đổi glibc/collation và có thể làm hỏng index trên volume cũ.
# bullseye-pgdg đã chuyển sang kho lưu trữ nên trỏ lại apt-archive; chỉ cài đúng 1 gói, đúng phiên bản.
# Debian 11 đã hết hạn hỗ trợ: kho Debian cũng chuyển sang archive.debian.org nên trỏ lại (bản trên deb.debian.org rồi sẽ biến mất).
# Assert đầu RUN: base lệch OS/glibc thì FAIL build (không để image lạ chạm vào volume prod). ca-certificates có sẵn trong base, cần cho apt https.
RUN set -eux; \
    grep -qx 'VERSION_CODENAME=bullseye' /etc/os-release; \
    ldd --version | head -n1 | grep -Eq ' 2\.31$'; \
    test -s /etc/ssl/certs/ca-certificates.crt; \
    printf 'deb https://archive.debian.org/debian bullseye main\ndeb https://archive.debian.org/debian-security bullseye-security main\n' > /etc/apt/sources.list; \
    echo "deb [signed-by=/usr/local/share/keyrings/postgres.gpg.asc] https://apt-archive.postgresql.org/pub/repos/apt bullseye-pgdg main 17" \
      > /etc/apt/sources.list.d/pgdg.list; \
    apt-get -o Acquire::Check-Valid-Until=false update; \
    apt-get install -y --no-install-recommends "pgbackrest=${PGBACKREST_VERSION}"; \
    rm -rf /var/lib/apt/lists/*; \
    pgbackrest version

FROM postgres AS backup
# Debian 11 đã hết hạn hỗ trợ: kho security chuyển sang archive.debian.org nên trỏ lại (chỉ cài openssh-client + curl).
# Rủi ro còn lại: sidecar chạy trên OS EOL; lộ trình đổi base ghi ở docs/runbooks/restore.md §9.
RUN set -eux; \
    printf 'deb https://archive.debian.org/debian bullseye main\ndeb https://archive.debian.org/debian-security bullseye-security main\n' > /etc/apt/sources.list; \
    apt-get -o Acquire::Check-Valid-Until=false update; \
    apt-get install -y --no-install-recommends openssh-client curl; \
    rm -rf /var/lib/apt/lists/*; \
    install -d -o postgres -g postgres -m 0700 /var/lib/tami-backup /mirror
COPY --from=restic /usr/bin/restic /usr/local/bin/restic
COPY --from=rclone /usr/local/bin/rclone /usr/local/bin/rclone
RUN restic version && rclone version
USER postgres
