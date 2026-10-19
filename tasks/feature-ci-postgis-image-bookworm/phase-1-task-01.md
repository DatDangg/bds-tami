# feature-ci-postgis-image-bookworm · phase-1-task-01 — CI test DB dùng cùng image Postgres với dev/staging/prod (bookworm, PG 17.11, PostGIS 3.5.2)

- Change doc: `spec/changes/archive/2026-10-19-ci-postgis-image-bookworm.md` (BACKLOG BL-014)
- Nguồn: review BL-002 MINOR-6 (`.context/review-reports/feature-backup-base-image-debian12-phase-1-task-01-round-2-review.md`); task BL-002 decision 10
- Spec: không đổi requirement (NFR-10 "CI/CD" giữ nguyên ngữ nghĩa) — xem "Spec impact"

## Hiện trạng (change-request đã kiểm)
- `.github/workflows/ci.yml:20-33`: job `verify` khai `services.postgres.image: postgis/postgis:17-3.5` (Debian 11 bullseye EOL, glibc 2.31, PG 17.5, PostGIS 3.5.2), env `POSTGRES_USER=tami`, `POSTGRES_PASSWORD=ci_only_password`, `POSTGRES_DB=tami_test`, port `5432:5432`, health `pg_isready -U tami -d tami_test`.
- Các bước sau dùng `psql "$DATABASE_URL_TEST"` (psql có sẵn trên ubuntu-latest) chạy `docker/postgres/init.sql`, tạo DB `tami_migrate`, `pnpm payload migrate`, `pnpm test`.
- dev/staging dùng image tự dựng `tami-postgis:17-3.5-bookworm` = `docker/backup/Dockerfile` target `postgis` (build context `docker/backup`, base `postgres:17.11-bookworm@sha256:3645570c…`, PostGIS `3.5.2+dfsg-1.pgdg120+1` từ apt-archive, assert bookworm + glibc 2.36, `COPY --chmod` cần BuildKit). Prod dùng target `postgres` (= postgis + pgbackrest).
- GitHub `services:` chỉ nhận image có sẵn trên registry — không build được trước khi job chạy.
- Đã có tiền lệ chạy container phụ bằng `docker run` trong cùng job (SeaweedFS, `ci.yml` bước "Khởi động SeaweedFS S3").

## Classification / Risk
- Type: **MODIFY** (hạ tầng CI). Không đổi code app, schema, migration, dữ liệu/DB thật (DB CI dùng rồi bỏ).
- Risk: **LOW–MEDIUM** — chỉ ảnh hưởng pipeline CI (CI đỏ chặn deploy staging qua `workflow_run`). Reviewer: **NORMAL** (không có risk đỏ: không auth/schema/data/API).

## Spec impact
- Không đổi requirement: SPECIFICATIONS.md §Hạ tầng (BL-002) đã quy định image Postgres môi trường; CI chỉ là công cụ kiểm. ⇒ **không bump `spec_version`** (giữ 1.10.0), không `spec/updates/`, không dòng CHANGELOG. Vẫn sinh `spec/test-scope/current.json` (scopeVersion 10 → 11) để template test biết vùng vừa đổi.

## Quyết định thiết kế (change-request, auto proceed)
1. **Build target `postgis` ngay trong job** từ `docker/backup/Dockerfile` (cùng Dockerfile + cùng digest base + cùng bản PostGIS với dev/staging/prod) rồi chạy bằng `docker run` — **không** publish GHCR (cần `packages: write` + secret/permission + vòng đời image riêng; quá tầm cho DB test dùng rồi bỏ; CI hiện chỉ `contents: read`).
2. Bỏ service `postgres` khỏi `services:`; giữ service `redis` nguyên.
3. Bước mới **trước** "Tạo extension Postgres" (có thể trước `pnpm install` để chạy song song không cần — giữ tuần tự, đặt sau checkout): `docker build --target postgis -t tami-postgis:ci docker/backup` (BuildKit mặc định trên ubuntu-latest Docker). Cân nhắc cache: chấp nhận build không cache (apt ~1–2 phút) — **không** thêm action bên thứ ba mới chỉ để cache; nếu builder thấy cần cache thì chỉ dùng action đã ghim SHA và ghi lý do.
4. `docker run -d --name tami-ci-postgres -p 127.0.0.1:5432:5432 -e POSTGRES_USER=tami -e POSTGRES_PASSWORD=ci_only_password -e POSTGRES_DB=tami_test tami-postgis:ci` + vòng chờ sẵn sàng có giới hạn (vd `pg_isready` qua `docker exec` + `psql` từ host `select 1`, tối đa ~60×2s) rồi kiểm lại một lần ngoài vòng (fail rõ ràng như mẫu SeaweedFS). Lưu ý: entrypoint official khởi động server tạm khi initdb rồi restart — chờ phải chịu được giai đoạn đó (kiểm bằng kết nối TCP từ host, không chỉ socket trong container).
5. Bước kiểm phiên bản (fail-fast, tránh trôi về image khác): `select version()` chứa `PostgreSQL 17.11`, `postgis_lib_version()` = `3.5.2` (sau khi init.sql tạo extension), glibc/OS trong container `bookworm` / `2.36` (vd `docker exec … grep VERSION_CODENAME /etc/os-release`, `ldd --version`). Không lặp hằng số phiên bản ở quá nhiều chỗ — có thể đọc từ ARG Dockerfile hoặc chỉ assert theo Dockerfile (Dockerfile đã assert bookworm/glibc lúc build ⇒ CI chỉ cần in + assert PG/PostGIS).
6. Bước `if: failure()` in `docker logs --tail 200 tami-ci-postgres` (như SeaweedFS).
7. Comment trong `ci.yml` giải thích vì sao không dùng `services:` (cần cùng image tự dựng với môi trường thật, `services` không build được).
8. Doc reconcile: chỗ nào trong `docs/` nói CI dùng `postgis/postgis` → cập nhật (as-built). `.context/decisions.md` là lịch sử — không sửa. `docs/runbooks/postgres-base-image.md` nếu có nói CI còn bullseye → cập nhật.

## Acceptance
- [x] `ci.yml` không còn `postgis/postgis` / image bullseye; DB test CI = image build từ `docker/backup/Dockerfile` target `postgis` (PG 17.11, PostGIS 3.5.2, bookworm glibc 2.36) — builder verified (grep + mô phỏng)
- [x] Mọi bước sau (init.sql, migrate `tami_migrate` + `tami_test`, test, build) dùng DB đó qua `127.0.0.1:5432` không đổi env — env job giữ nguyên, container bind `127.0.0.1:5432`
- [x] YAML hợp lệ (actionlint nếu có, hoặc parse YAML) ; action mới (nếu có) ghim SHA — js-yaml parse PASS; không thêm action mới
- [x] Mô phỏng cục bộ các bước tương đương PASS: build target postgis → docker run cùng tham số (port khác nếu 5432 bận) → vòng chờ → init.sql → kiểm phiên bản → `payload migrate` trên DB trống (nếu khả thi trên máy dev) ; dọn container/image tạm — xem Verification summary
- [x] Không đụng container/volume dev (`tami-postgres`, `tami-postgres-data`) và không đổi DB thật — cổng tạm 55432, container/image tạm đã xoá

## Verification Plan
- `actionlint .github/workflows/ci.yml` (nếu có; không có → `npx --yes actionlint`? KHÔNG tải tool lạ — dùng parse YAML bằng node/`js-yaml` có sẵn trong node_modules, hoặc python yaml nếu có) + `git diff` review.
- Chạy lại script các bước mới trong Git Bash: `docker build --target postgis -t tami-postgis:ci-local docker/backup`, `docker run` cổng tạm (vd 127.0.0.1:55432), vòng chờ, `psql`/`docker exec psql` chạy `docker/postgres/init.sql`, assert phiên bản, tạo DB `tami_migrate` + `pnpm payload migrate` với `DATABASE_URL` trỏ cổng tạm (nếu env bắt buộc thiếu → dùng bộ env dummy giống ci.yml). Dọn container sau.
- Không áp dụng pnpm lint/typecheck/test/build toàn bộ (không đổi code app) — ghi `skip, no app code changed`.
- Report: `.context/review-reports/feature-ci-postgis-image-bookworm-phase-1-task-01-round-<R>-review.md`

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Decision log
- (change-request) Xem "Quyết định thiết kế" 1–8.
- (builder, attempt 1) Bước build+run đặt ngay sau `actions/checkout` (trước pnpm setup) theo quyết định 3 — tuần tự, không song song; tag `tami-postgis:ci`, container `tami-ci-postgres`, port `127.0.0.1:5432` nên env `DATABASE_URL*` của job giữ nguyên.
- (builder) Vòng chờ sẵn sàng = `psql "$DATABASE_URL_TEST" -Atc 'select 1'` từ host (TCP), tối đa 60×2s, rồi kiểm lại 1 lần ngoài vòng với `ON_ERROR_STOP` (mẫu SeaweedFS). Không dùng `pg_isready` trong container vì server tạm của initdb chỉ nghe socket — `pg_isready` qua socket báo OK sớm, TCP từ host mới là tín hiệu đúng (quyết định 4).
- (builder) Assert phiên bản (quyết định 5): đọc `17.11` / `3.5.2` **từ ARG của `docker/backup/Dockerfile` bằng `sed`** thay vì lặp hằng số trong ci.yml; `test -n` cả hai giá trị để regex gãy (đổi format ARG) thì bước fail chứ không so sánh rỗng-rỗng. Chỉ in (không assert lại) `VERSION_CODENAME`/`ldd` vì Dockerfile đã assert bookworm/glibc 2.36 lúc build. Bước đặt sau "Tạo extension Postgres" vì `postgis_lib_version()` cần extension (image đã tạo postgis trong `tami_test` qua `10_postgis.sh`, init.sql chỉ `IF NOT EXISTS`).
- (builder) Log khi lỗi: bước riêng `Log Postgres khi lỗi` (`if: failure()`, `|| true`) đặt trước bước log SeaweedFS — `failure()` chạy khi bất kỳ bước trước fail nên lỗi ở build/run/migrate/test đều được in.
- (builder) Không thêm action bên thứ ba (không cache build) — build apt ~1–2 phút chấp nhận được, CI vẫn `contents: read`.
- (builder) Doc reconcile (quyết định 8): grep `docs/`, `README.md`, `docs/ARCHITECTURE.md`, `docs/runbooks/*` — **không** có chỗ nào nói CI dùng `postgis/postgis`/bullseye (các hit `postgis/postgis` là về volume cũ dev/staging/prod, e2e, migration contrib — vẫn đúng). ⇒ `no doc impact`. `.context/decisions.md` không sửa.
- (builder) Không ghi `.context/runs/**` theo yêu cầu của primary (primary giữ Run Journal).

## Verification summary (builder, attempt 1, 2026-10-19)

Không chạy được GitHub Actions thật → kiểm YAML + mô phỏng cục bộ (Git Bash, Docker 29.8.1) trên container/cổng tạm, không đụng `tami-postgres` (port 5433) / volume `tami-dev_tami-postgres-data` / DB thật.

| Lệnh | Kết quả |
|---|---|
| `node` + `js-yaml@4.3.2` (có sẵn trong `node_modules/.pnpm`) parse `ci.yml`: services, thứ tự steps, grep `postgis/postgis`/`bullseye` | PASS — services = `[redis]`; steps: checkout → Build+khởi động Postgres → pnpm/node → install → Tạo extension → Kiểm phiên bản → Migrate trống → Migrate tami_test → SeaweedFS → … → Test → Log Postgres → Log SeaweedFS → Build → Audit; `postgis/postgis`: không còn; `bullseye`: không có |
| `actionlint` | skip — không cài sẵn trên máy, không tải tool mới |
| `docker build --target postgis -t tami-postgis:ci-local docker/backup` | PASS (layer cache từ build BL-002 — CI sẽ build không cache) |
| `docker run -d --name tami-ci-postgres-local -p 127.0.0.1:55432:5432 -e POSTGRES_USER=tami -e POSTGRES_PASSWORD=ci_only_password -e POSTGRES_DB=tami_test tami-postgis:ci-local` + vòng chờ như ci.yml | PASS — sẵn sàng sau 6s (3 vòng). Host không có `psql` nên chờ bằng `docker exec psql -h 127.0.0.1` (TCP trong container; server tạm initdb không nghe TCP nên tương đương host check) |
| `psql -f docker/postgres/init.sql` trên `tami_test` | PASS (`postgis` already exists — image đã tạo; `unaccent`, `pg_trgm` tạo mới) |
| Bước "Kiểm phiên bản DB test khớp Dockerfile" (y hệt script ci.yml) | PASS — `VERSION_CODENAME=bookworm`, `ldd (Debian GLIBC 2.36-9+deb12u14) 2.36`, `postgres=17.11 (Dockerfile 17.11) postgis=3.5.2 (Dockerfile 3.5.2)` |
| `CREATE DATABASE tami_migrate` + init.sql + `pnpm payload migrate` với bộ env dummy giống ci.yml, `DATABASE_URL` trỏ `127.0.0.1:55432/tami_migrate` | PASS — exit 0, `Done.`; `payload_migrations` = 28 dòng, 103 bảng `public` trên DB tạm (chứng minh chạy đúng cổng 55432, không phải dev 5433) |
| Dọn: `docker rm -f tami-ci-postgres-local`, `docker rmi tami-postgis:ci-local` | PASS — `tami-postgres` vẫn `Up (healthy)`, volume còn nguyên |
| `pnpm lint` / `typecheck` / `test` / `build` | skip, no app code changed (chỉ đổi `.github/workflows/ci.yml`) |
| `npx oxlint` | N/A — không đụng TS/JS |

**Residual risk:** (1) chưa chạy trên runner GitHub thật — build không cache trên ubuntu-latest cần mạng tới `apt-archive.postgresql.org` (đã là điều kiện của build dev/staging/prod); thời gian job tăng ~1–2 phút, còn trong `timeout-minutes: 20`. (2) Vòng chờ trong CI dùng `psql` trên host ubuntu-latest (có sẵn, đã dùng ở các bước cũ); mô phỏng cục bộ dùng psql trong container qua TCP. (3) `-p 127.0.0.1:5432` trên runner: runner ubuntu-latest không chạy Postgres sẵn nghe 5432 (trước đây service cũng bind 5432) — giữ nguyên.

## Review
- Round 1 — **NORMAL PASS** (`.context/review-reports/feature-ci-postgis-image-bookworm-phase-1-task-01-round-1-review.md`): 0 CRITICAL/MAJOR. MINOR-1 (`ci.yml` dòng `test -n … && test -n …` không dừng bước khi ARG rỗng → job vẫn fail ở bước so sánh nhưng thông báo "PostgreSQL lệch Dockerfile" gây hiểu nhầm) — chấp nhận, không đổi hành vi pass/fail. MINOR-2 (build không cache, phụ thuộc mạng) — chủ đích (quyết định 3).

## Close-out (change-request)
- Doc impact: **no doc impact** (reviewer grep xác nhận). Không đổi requirement ⇒ spec giữ 1.10.0; `spec/test-scope/current.json` scopeVersion 11.
- Progress: `.context/progress.json` features[] `ci-postgis-image-bookworm` done. BACKLOG BL-014 done; change doc archive.
- Residual risk: **CI thật chưa chạy — cần push để xác nhận** (build không cache, vòng chờ, log bookworm/2.36/17.11/3.5.2, `pnpm test` xanh trên PG 17.11). MINOR-1 còn mở (cosmetic).
