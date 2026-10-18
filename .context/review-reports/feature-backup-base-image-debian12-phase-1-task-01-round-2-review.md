Agent: reviewer

# Review — feature-backup-base-image-debian12 · phase-1-task-01 · round 2

- **Review level:** STRICT
- **Reason:** đổi base OS Postgres (glibc 2.31 → 2.36) trên volume có dữ liệu (collation/index), guard trong `deploy.sh` dùng chung staging/prod (logic mới: volume không container), runbook thao tác DB prod gồm cả rollback.
- **Blast radius:** `docker/backup/Dockerfile` (3 target → postgres dev/staging/prod + sidecar backup), `docker/backup/postgis/*` (initdb volume mới), compose dev/staging/prod, `scripts/deploy/deploy.sh` (mọi deploy staging/prod), `docs/runbooks/postgres-base-image.md` / `deploy.md` / `restore.md`, `docker/backup/test/e2e.sh`, `spec/test-scope/current.json` (bàn giao template test).

## Verify commands + kết quả

| Lệnh | Kết quả |
|---|---|
| `bash scripts/deploy/deploy.test.sh` | PASS, EXIT=0, "Tất cả test PASS". Nhóm "guard postgres" có 10 test: không container + không volume → qua; tên volume theo `name:` của compose config; có volume → die; `PG_IMAGE_SWITCH_CONFIRMED=1` → qua; `=0` → die; dry-run không gọi docker |
| `docker build -q --target postgis -t tami-bk-review-postgis docker/backup` (cache) | PASS. Trong image: `10_postgis.sh -rw-r--r--`, `update-postgis.sh -rwxr-xr-x`, glibc 2.36, bookworm |
| `docker run` volume mới `tami-bk-review-vol` + `init.sql` → `01-extensions.sql`, `--restart unless-stopped` (giống compose) | `restarts=0 running=true`. DB `postgres,tami,template0,template1,template_postgis`. Extension tami: `fuzzystrmatch,pg_trgm,plpgsql,postgis,postgis_tiger_geocoder,postgis_topology,unaccent`. Đã dọn: 0 container và 0 volume `tami-bk-review*`, gỡ tag image tạm. Không đụng `tami-postgres`/`tami-dev_*` |
| Log e2e round 2 (`…/scratchpad/e2e-bl002-r2.log`) | `E2E PASS` (dòng 407). `[init]` 6 assert ok (restart=0, mode script, DB list và extension tami/template_postgis = image gốc, datcollversion 2.36). `[switch]` amcheck 142 index trên 4 DB. Không có dòng FAIL. Log không có `EXIT=` (builder đã ghi chú tiến trình treo sau PASS). Bước archive_timeout thật đã PASS ở log round 1 |
| e2e đầy đủ | Không chạy lại. Log khớp code, và tự kiểm volume mới ở trên cho kết quả giống |
| pnpm lint/typecheck/test/build | skip, không có code app TS/JS trong diff |

## Responsive Checklist Gate
N/A: diff không đụng UI.

## Skill gates
- aislop: N/A, không có code app.
- oxlint (anti-slop): N/A, không đụng TS/JS.
- ocr: skip, ocr chưa cài.
- AI-readable: OK. Tên hàm rõ (`guard_postgres_volume_without_container`, `postgres_volume_name`, `switch_amcheck_all_databases`), comment nói lý do, runbook/ARCHITECTURE đã cập nhật. Có 1 indicator nhỏ (`image_switch_test` dài), dưới ngưỡng.
- ai-friendly-web: N/A.
- blitzstrike: N/A.

## Trạng thái finding round 1

| Finding | Trạng thái | Bằng chứng |
|---|---|---|
| MAJOR-1 `10_postgis.sh` bit x | **Đã đóng** | `Dockerfile:58-60` `COPY --chmod=0644` / `--chmod=0755` + `RUN test ! -x … && test -x …`. Tự build + init volume mới: đủ DB/extension, restarts=0. e2e `fresh_volume_init_test` (`e2e.sh:551`) so với kỳ vọng lấy từ image gốc. Assert không nới lỏng: nếu `SW_EXPECT_*` rỗng thì `expect_eq` fail. `set -euo pipefail` bật nên `\|\| fail` sau pipeline amcheck có hiệu lực |
| MAJOR-2 runbook `current` + `TAMI_IMAGE` | **Đóng một phần** | Staging đúng: `R=/opt/tami/releases/$ENV/$SHA`, `export TAMI_IMAGE` từ `state/$ENV.current` (file ghi full ref, khớp `lib/state.sh:18`), §3.8 chạy lại `deploy.sh` với `${TAMI_IMAGE%@*}@$DIGEST`. `staging.history` cột 1 là `sha256:…` nên ghép ref đúng. Có cảnh báo không `up` compose cũ. **Còn lỗi ở đường production, xem MAJOR-A** |
| MINOR-1 test-scope changed.files | Đã đóng | `current.json:22-33` có đúng `docker/backup/postgis/*`, `pgbackrest-env.example`, `postgres-base-image.md`. Còn lệch hành vi, xem MINOR-B |
| MINOR-2 guard volume | Đã đóng | `deploy.sh:262-292`. Project đọc từ dòng `^name: ` của `compose config`. Compose staging/prod đều khai `name:` top-level (`tami-staging`/`tami`). `name:` của network thụt lề nên regex không bắt. Khoá volume `postgres-data` không có `name:` riêng, nên volume là `<project>_postgres-data`. Các `die` đều chạy ở shell cha, không nằm trong `$(…)`, nên `trap cleanup EXIT` trả `current` về release cũ như cũ. Guard vẫn đặt trước `compose up -d <base>` (`:312`) |
| MINOR-3 REINDEX catalog + amcheck mọi DB | Đã đóng | runbook §3.5 trích docs PG17 và có query (5). §3.6 lặp mọi DB `datallowconn`, lọc `indisvalid/indisready/relpersistence`. e2e assert `SW_CATALOG_INDEX_NON_C = 0` |
| MINOR-4 globals | Đã đóng | §3.1 `pg_dumpall --globals-only`. §5 nạp globals trước `pg_restore` |
| MINOR-5 ghim ca-certificates/typo | Đã đóng | `Dockerfile:34-37` ghi lý do. Typo đã sửa |
| MINOR-6 CI `postgis/postgis:17-3.5` | Chấp nhận làm residual | DB CI dùng rồi bỏ, acceptance chỉ nói `docker/`. **Nhưng chưa có dòng trong `spec/changes/BACKLOG.md`** (grep `ci.yml` ra 0). change-request cần ghi backlog trước close-out để không mất dấu |

## Findings mới (round 2)

### [MAJOR-A] Runbook production: đường dẫn env/compose sai ở §2 và §5 (rollback), không chạy được nguyên văn
`deploy.sh:108,116` và `deploy.md:75-76` dùng env file `staging.env` / **`prod.env`** và compose `docker-compose.staging.yml` / **`docker-compose.prod.yml`**. Runbook với `ENV=production` lại dùng:
- `docs/runbooks/postgres-base-image.md:52`: `grep … /opt/tami/$ENV.env` thành `/opt/tami/production.env`, file không tồn tại. grep báo lỗi, và `U`/`DB` **lặng lẽ** về mặc định `tami`, nên giá trị `POSTGRES_USER`/`POSTGRES_DB` thật của prod bị bỏ qua.
- `docs/runbooks/postgres-base-image.md:207` (rollback §5, chỗ "duy nhất" dùng compose cũ): `docker compose --env-file /opt/tami/$ENV.env -f …/docker/docker-compose.$ENV.yml` thành `production.env` + `docker-compose.production.yml`, **cả hai sai**. Lệnh lỗi ngay. Vì `$C stop postgres` ở dòng 206 đã chạy trước, operator đứng giữa cửa sổ bảo trì prod với postgres **đã dừng**, rollback không chạy được nguyên văn.

Dòng 50-51 thì đặt đúng `prod.env` / `docker-compose.prod.yml`, nên đây là chỗ sót khi sửa MAJOR-2. Lỗi cùng loại "lệnh runbook không chạy được trên prod".
**Cách fix:** trong khối §2 đặt luôn `ENVF=/opt/tami/staging.env; CF=docker-compose.staging.yml` (prod: `ENVF=/opt/tami/prod.env; CF=docker-compose.prod.yml`), rồi dùng `$ENVF`/`$CF` ở `C=`, dòng 52 và dòng 207. Nên thêm `test -f "$ENVF" || echo SAI` để lệnh không lặng lẽ rơi về giá trị mặc định.

### [MINOR-B] `spec/test-scope/current.json:53` mô tả hành vi guard cũ
Dòng này vẫn ghi "lần đầu (chưa có container) cho chạy". Hành vi mới là: không container **và** không volume thì qua; có volume thì die, trừ khi `PG_IMAGE_SWITCH_CONFIRMED=1`. Template test sẽ sinh case sai. **Fix:** spec-publisher cập nhật mô tả (kèm `spec/updates/2026-10-19-backup-base-image-debian12.md` nếu có câu tương tự).

### [MINOR-C] `guard_postgres_volume_without_container` coi mọi lỗi `docker volume inspect` là "không có volume"
`scripts/deploy/deploy.sh:288`: `docker volume inspect … > /dev/null 2>&1 || return 0`. Nếu daemon lỗi hoặc quyền socket sai, guard cho qua. Rủi ro thấp vì `compose up` ngay sau cũng sẽ lỗi. Có thể phân biệt bằng `docker volume ls -q --filter name=^${volume}$`, hoặc kiểm `docker info` trước. Không chặn PASS.

## Các điểm đã kiểm, đạt
- deploy.sh: luồng `die` → `cleanup` không đổi. Dry-run không gọi docker. `compose()` truyền `TAMI_IMAGE="$ACTIVE_IMAGE"` nên `compose config` trong guard không lỗi interpolation. Container dừng (không chạy) vẫn `inspect` được nên đi nhánh so image, đúng.
- Runbook staging: lệnh §2/§3/§3.8 khớp cấu trúc release thật (`releases/<env>/<sha>`, `state/<env>.current`, `staging.history` = `<digest> <time> <sha>`, cú pháp `deploy.sh <env> --release-sha --image`). Ghi chú postgres bị tạo lại lần 2 khi bind mount đổi sang `current/` là đúng thực tế.
- e2e: không assert nào bị nới lỏng. Phần bỏ `docker logs | grep 'collation version'` được thay bằng đếm cảnh báo trước/sau (`warn_before > 0`, `warn_after = 0`), chặt hơn.

## Residual risk
- Chưa chạy trên staging/prod thật. Thời gian REINDEX và lượng WAL sinh ra ở prod (`archive_mode=on`) chưa đo.
- Không chạy lại e2e đầy đủ. Dựa vào log round 2 và lần tự kiểm volume mới.
- CI vẫn dùng image bullseye (MINOR-6), chưa có backlog.

## Verdict
**❌ FAIL**: MAJOR-1 đã đóng, nhưng MAJOR-2 mới đóng một phần. Còn MAJOR-A: §2 dòng 52 và §5 dòng 207 của runbook dùng `/opt/tami/$ENV.env` và `docker-compose.$ENV.yml`, sai với production (`prod.env`, `docker-compose.prod.yml`), làm hỏng lệnh rollback prod khi postgres đã dừng. Fix chỉ là sửa doc vài dòng. Nên sửa luôn MINOR-B, và ghi MINOR-6 vào BACKLOG.
