# Image Postgres/backup cho TAMI (ARCHITECTURE §8). Ba target dùng chung một Dockerfile để PostGIS/pgBackRest trong container postgres
# (archive_command) và trong sidecar `backup` (backup/check) luôn CÙNG phiên bản:
#   target `postgis`  : postgres:17.11-bookworm (official, Debian 12) + PostGIS 3.5.2 + script initdb/update như image postgis/postgis gốc
#                       -> service `postgres` ở dev + staging (không backup)
#   target `postgres` : target postgis + pgbackrest -> service `postgres` ở prod
#   target `backup`   : target postgres + restic + rclone + openssh-client + curl -> service `backup` (prod)
# Dựng 1 lần trên server: `docker compose ... build postgres backup` (prod) / `build postgres` (staging). Tag cố định trong compose;
# đổi phiên bản = ĐỔI TAG (deploy.sh không `pull` các image này: cùng tag thì image cũ trên server vẫn được dùng; chưa có tag thì `compose up` tự build).
#
# Vì sao tự dựng target `postgis` thay vì FROM postgis/postgis: Docker Hub không có postgis/postgis 17-3.5 trên bookworm (17-3.5 vẫn là bullseye EOL,
# 17-3.6 đã lên trixie = PostGIS 3.6 + glibc 2.41 cùng lúc). Giữ đúng PostGIS 3.5.2 đang chạy thì không cần `ALTER EXTENSION postgis UPDATE`.
# Ghim digest base: tag đổi được, upstream rebase tag lên Debian khác thì glibc/collation đổi ngay trên volume cũ. Digest này = image đã kiểm
# (Debian 12 bookworm, glibc 2.36, PG 17.11). Đổi glibc = đổi collation en_US.utf8 => index btree trên text của volume cũ phải REINDEX:
# chuyển image cho môi trường đã có dữ liệu theo docs/runbooks/postgres-base-image.md, không bao giờ chỉ đổi tag rồi `compose up`.
# Nâng base lần sau = đổi digest + assert + chạy lại docker/backup/test/e2e.sh (case "chuyển image" dựng volume bằng image cũ rồi bật bằng image mới).
ARG POSTGRES_IMAGE=postgres:17.11-bookworm@sha256:3645570cccdfa447589da9f57dd740faa29b30938e861289a5574b6ca6b03826
# PostGIS 3.5.2 (= bản đang chạy trên volume dev/staging/prod) + pgbackrest 2.59.1: kho pgdg bookworm hiện hành chỉ còn bản mới nhất,
# bản ghim nằm ở apt-archive.postgresql.org (bookworm-pgdg-archive) nên không biến mất khi upstream lên bản mới.
ARG POSTGIS_VERSION=3.5.2+dfsg-1.pgdg120+1
ARG PGBACKREST_VERSION=2.59.1-1.pgdg12+1

FROM restic/restic:0.17.3 AS restic
FROM rclone/rclone:1.68.2 AS rclone

FROM ${POSTGRES_IMAGE} AS postgis
ARG POSTGIS_VERSION
# ENV như image postgis/postgis gốc (update-postgis.sh đọc POSTGIS_VERSION, cắt phần sau dấu +).
ENV POSTGIS_MAJOR=3
ENV POSTGIS_VERSION=${POSTGIS_VERSION}
# Assert đầu RUN: base lệch OS/glibc thì FAIL build (không để image lạ chạm vào volume prod).
# Image postgres official KHÔNG có ca-certificates (postgis/postgis thì có): cài từ kho Debian 12 của base trước, vì kho archive pgdg là https.
# ca-certificates (và openssh-client/curl ở target backup) KHÔNG ghim version có chủ đích: kho Debian stable/security chỉ giữ ĐÚNG bản hiện hành
# (bản cũ bị gỡ ở mỗi point release, vd 20230311+deb12u1 -> 20250419~deb12u1), ghim thì build gãy ngay lần Debian vá tiếp; đây là gói bảo mật
# không ảnh hưởng dữ liệu (khác PostGIS/pgbackrest: ghim từ kho archive để giữ đúng bản đang chạy trên volume).
# Base đã có /etc/apt/sources.list.d/pgdg.list (apt.postgresql.org bookworm-pgdg) + key /usr/local/share/keyrings/postgres.gpg.asc (dùng chung cho archive).
RUN set -eux; \
    grep -qx 'VERSION_CODENAME=bookworm' /etc/os-release; \
    ldd --version | head -n1 | grep -Eq ' 2\.36$'; \
    apt-get update; \
    apt-get install -y --no-install-recommends ca-certificates; \
    echo "deb [signed-by=/usr/local/share/keyrings/postgres.gpg.asc] https://apt-archive.postgresql.org/pub/repos/apt bookworm-pgdg-archive main" \
      > /etc/apt/sources.list.d/pgdg-archive.list; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
      "postgresql-17-postgis-3=${POSTGIS_VERSION}" \
      "postgresql-17-postgis-3-scripts=${POSTGIS_VERSION}"; \
    rm -rf /var/lib/apt/lists/*
# Script khởi tạo volume mới (template_postgis + extension) và nâng extension: vendor từ postgis/docker-postgis (MIT), xem đầu mỗi file.
# Compose mount docker/postgres/init.sql vào 01-extensions.sql: chạy TRƯỚC 10_postgis.sh, cùng CREATE EXTENSION IF NOT EXISTS nên không xung đột.
# Mode đặt tường minh (--chmod, BuildKit), không phụ thuộc mode file trong build context (Windows/git filemode): 10_postgis.sh phải KHÔNG có bit x
# để docker-entrypoint.sh `source` nó (script dùng mảng "${psql[@]}" của entrypoint; có bit x thì entrypoint chạy như tiến trình riêng -> psql rỗng,
# initdb dừng giữa chừng, volume mới thiếu template_postgis/topology/tiger) — y như image postgis/postgis gốc (644). update-postgis.sh là lệnh (755).
COPY --chmod=0644 postgis/10_postgis.sh /docker-entrypoint-initdb.d/10_postgis.sh
COPY --chmod=0755 postgis/update-postgis.sh /usr/local/bin/update-postgis.sh
RUN test ! -x /docker-entrypoint-initdb.d/10_postgis.sh && test -x /usr/local/bin/update-postgis.sh

FROM postgis AS postgres
ARG PGBACKREST_VERSION
# Chỉ cài đúng 1 gói, đúng phiên bản (kho archive đã khai ở target postgis).
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends "pgbackrest=${PGBACKREST_VERSION}"; \
    rm -rf /var/lib/apt/lists/*; \
    pgbackrest version

FROM postgres AS backup
# openssh-client (restic SFTP, ssh-keyscan) + curl (heartbeat URL) từ kho Debian 12 thường của base (bookworm còn hỗ trợ tới 06/2028).
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends openssh-client curl; \
    rm -rf /var/lib/apt/lists/*; \
    install -d -o postgres -g postgres -m 0700 /var/lib/tami-backup /mirror
COPY --from=restic /usr/bin/restic /usr/local/bin/restic
COPY --from=rclone /usr/local/bin/rclone /usr/local/bin/rclone
RUN restic version && rclone version
USER postgres
