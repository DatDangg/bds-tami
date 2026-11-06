# Runbook: Deploy TAMI (staging → production)

Phạm vi: `.github/workflows/deploy.yml`, `.github/workflows/deploy-production.yml`, `.github/actions/ssh-deploy/action.yml`, `scripts/deploy/deploy.sh` + `scripts/deploy/lib/*.sh`.
Kiến trúc: `docs/ARCHITECTURE.md` §6.4. Quyết định: `.context/decisions.md` Decision 4.

## 1. Luồng

```
push staging → CI (ci.yml) PASS → [workflow_run] Deploy:
  build   : GitHub runner build image, tag = commit SHA, push GHCR, lấy DIGEST
  staging : (tự động, Environment `staging`) SSH → deploy.sh staging  --image <repo>@<digest>
  record-staging-pass : (Environment `production`, chỉ khi staging xanh) SSH → server PRODUCTION → deploy.sh record-staging  --image <repo>@<digest>  (chỉ ghi staging.history)
  (job summary in commit + digest vừa qua staging)

chạy TAY: Actions → Deploy production → Run workflow (nhánh staging) → nhập commit SHA  [deploy-production.yml]
  production: kiểm SHA thuộc nhánh staging → lấy digest của image tag = SHA (không build lại) → SSH → deploy.sh production --image <repo>@<digest>
```

- Chỉ chạy khi CI PASS cho **push vào `staging` của chính repo** (không `main`, không PR, không fork).
- Production nhận đúng digest staging đã chạy (output của job staging); không build lại, không tag `latest`.
  Thêm lớp bảo vệ ở server: `deploy.sh production` chỉ nhận cặp **digest + commit SHA** có trong `/opt/tami/state/staging.history`
  (dòng `<digest> <thời điểm> <sha>` do chính lần deploy staging **thành công** ghi), và **từ chối digest cũ hơn** `production.current`
  (trừ `--allow-older`, chỉ dùng tay, mục 5). Kiểm này chạy **trước khi pull**.
- **Hai server (BL-111, từ khi staging chuyển sang server mới `179.197.242.57`, production giữ `187.52.119.50`)**: Environment `staging` và `production`
  có bộ secret `DEPLOY_HOST`/`DEPLOY_USER`/`DEPLOY_SSH_KEY`/`DEPLOY_SSH_KNOWN_HOSTS` riêng, nên deploy staging **không còn** ghi `staging.history` trên server production.
  Job `record-staging-pass` (`deploy.yml`, `needs: [build, deploy-staging]`, chỉ chạy khi cả hai xanh, cùng điều kiện nguồn như job `build`, `environment: production`)
  SSH vào server production và chạy `deploy.sh record-staging --release-sha <sha> --image <repo>@<digest>` qua action `ssh-deploy` `mode: record-staging`:
  chỉ thêm dòng `<digest> <thời điểm> <sha>` vào `/opt/tami/state/staging.history` dưới khoá `deploy.lock` chung, sau khi kiểm định dạng (image `ghcr.io/…@sha256:<64 hex>`, SHA 40 hex).
  Không pull, không đụng docker/container/release/symlink; `scripts/deploy` đẩy vào thư mục tạm dưới `state/` và xoá ngay. Cặp digest+SHA đã có thì **bỏ qua** (không dòng trùng)
  nên khi staging và production cùng một server (setup cũ) job này vô hại. Cổng thật vẫn là `deploy.sh production` (kiểm cặp digest+SHA + không cũ hơn). Hệ quả: Environment `production`
  phải cho phép nhánh `staging` (nếu có deployment branch policy); job record fail thì production **từ chối** commit đó (đúng hướng an toàn) — chạy lại job `record-staging-pass` (Re-run) là đủ.
  Rủi ro nhỏ: hai run staging liên tiếp có thể ghi history sai thứ tự, khi đó production báo "cũ hơn" và cần `--allow-older` chạy tay (mục 5).
  `environment: production` trên job record tạo một mục deployment "production" trên GitHub ở MỖI lần push staging (không phải release thật). Nếu thêm wait timer / required reviewers / branch policy loại `staging` cho Environment `production` thì job này bị chặn hoặc treo chờ duyệt.
- **Release bất biến theo môi trường + SHA**: mã triển khai (`docker/`, `scripts/deploy/`) được upload vào
  `/opt/tami/releases/<env>/<sha>/` (giải nén sạch vào thư mục tạm rồi `mv -T` nguyên tử; SHA đã có thì giữ nguyên, **không ghi đè**),
  và `deploy.sh` chạy **từ chính release đó** (từ chối nếu script không nằm đúng `releases/<env>/<sha>`). Nhờ vậy production luôn
  dùng compose/config của đúng commit đã duyệt, kể cả khi staging của commit mới hơn upload trong lúc production chờ khoá.
- Thứ tự mỗi môi trường trong `deploy.sh`: khoá → kiểm release → (production: digest+SHA đã qua staging, không cũ hơn)
  → đổi symlink `releases/<env>/current` nguyên tử → `compose config -q` → pull → cổng `HIGH_RISK_MIGRATION`
  → **guard image postgres** (container postgres đang chạy image khác image compose khai ⇒ dừng, chưa đổi gì: chuyển image postgres là việc làm tay có REINDEX,
  `docs/runbooks/postgres-base-image.md` §6; không có container nhưng volume `<project>_postgres-data` đã có ⇒ cũng dừng, trừ khi chạy tay với
  `PG_IMAGE_SWITCH_CONFIRMED=1` sau khi đã kiểm volume; chưa có container lẫn volume (server mới) thì qua)
  → up postgres/redis/seaweedfs → **`payload migrate`** (service `migrate`) → up `app` + `jobs`
  → health `/api/health` + `jobs` chạy ổn định → thành công: ghi state, dọn image + release cũ;
  thất bại (**kể cả `compose up` lỗi**): quay về image + release trước.

## 2. Việc làm một lần trên GitHub

### 2.1 Nhánh mặc định
`workflow_run` chỉ đọc workflow từ **nhánh mặc định**. Đặt nhánh mặc định của repo = `staging`
(Settings → Branches). Nếu để `main`, `deploy.yml` không bao giờ được kích hoạt. `main` vẫn cấm push trực tiếp.

### 2.2 Environment (Settings → Environments)
| Environment | Cấu hình |
|---|---|
| `staging` | Không cần reviewer. Deployment branches: `staging`. |
| `production` | Chỉ chứa secret SSH (2.3). **Không có required reviewers**: repo private gói Free không hỗ trợ (API trả 422, 2026-10-23). |

Cổng duyệt production = **thao tác bấm tay** workflow `Deploy production` (`workflow_dispatch`, chỉ người có quyền write trên repo), vì push `staging` không còn kích hoạt production.
Trên server, `deploy.sh production` vẫn chỉ nhận cặp digest + SHA đã deploy staging thành công và từ chối bản cũ hơn (mục 1). Nâng gói GitHub Pro/Team sau này thì có thể
thêm required reviewers cho Environment `production` làm lớp thứ hai (không cần sửa workflow).

### 2.3 Secret / variable
Tạo **Environment secret** ở cả `staging` và `production` (giá trị có thể giống nhau nếu cùng server, nhưng nên dùng key riêng):

| Tên | Loại | Nội dung |
|---|---|---|
| `DEPLOY_HOST` | secret | IP/hostname server |
| `DEPLOY_USER` | secret | user deploy (không phải root), xem 3.2 |
| `DEPLOY_SSH_KEY` | secret | private key ed25519 chỉ dùng cho deploy (không phải key cá nhân) |
| `DEPLOY_SSH_KNOWN_HOSTS` | secret | dòng known_hosts của server, lấy từ máy tin cậy: `ssh-keyscan -p <port> -t ed25519 <host>` rồi **đối chiếu fingerprint** với server thật trước khi lưu |
| `DEPLOY_SSH_PORT` | variable (tuỳ chọn) | cổng SSH, mặc định 22 (known_hosts phải ghi `[host]:port` nếu khác 22) |
| `NEXT_PUBLIC_HOTLINE` | Repository variable (tuỳ chọn) | số hotline nhúng vào bundle lúc build (`global-error`, trang lỗi 500 khi DB hỏng), truyền qua build-arg ở job `build`. Rỗng = không hiện số. Đổi giá trị = build lại image |

Không tạo token pull registry: job dùng `GITHUB_TOKEN` (quyền `packages: read`, hết hạn khi job xong) và truyền qua stdin; `deploy.sh`
login vào `DOCKER_CONFIG` tạm rồi xoá, không đụng `~/.docker/config.json` của dự án khác. Không có secret nào in ra log
(runner tự che secret; script không bật xtrace; token không nằm trong argv).

Giá trị ứng dụng (DB, Redis, S3, SMTP, …) **không** là GitHub secret: nằm trong env file trên server (3.3).

### 2.4 Package GHCR
Image `ghcr.io/<owner>/<repo>` (chữ thường) do workflow tạo lần đầu và tự liên kết với repo. Nếu repo private, giữ package private
(quyền theo repo). Không cần public.

## 3. Chuẩn bị server (một lần)

### 3.1 Thư mục
```
/opt/tami/
  staging.env      # 600, chủ sở hữu = user deploy (mẫu: .env.example, khối "Docker Compose staging/prod")
  prod.env         # 600
  state/           # deploy.sh ghi: <env>.current, <env>.previous, staging.history, deploy.lock
  releases/
    staging/<sha>/     # bất biến, mỗi commit một thư mục (docker/, scripts/deploy/); staging/current -> <sha> đang dùng
    production/<sha>/  # tương tự; production/current -> <sha> đang dùng
```
`sudo install -d -o deploy -g deploy -m 750 /opt/tami /opt/tami/state /opt/tami/releases` (workflow tự tạo `releases/<env>`).
Giữ 5 release mới nhất mỗi môi trường + release `current` (`RELEASES_KEEP`); phần còn lại bị xoá sau mỗi lần deploy thành công.
**Chuyển từ bố cục cũ** (`/opt/tami/repo`, nếu từng dựng tay): không cần giữ; lần deploy đầu theo bố cục mới có thể làm container
`postgres` bị tạo lại một lần vì đường dẫn bind mount `./postgres/init.sql` đổi sang `releases/<env>/current/docker/...`
(dữ liệu nằm trong volume nên không mất; chọn giờ ít người dùng). Sau đó đường dẫn ổn định giữa các lần deploy.
**Backup (bắt buộc trước deploy đầu tiên của PRODUCTION; staging KHÔNG backup, xem 9.5):** compose prod có service `backup` và image postgres tuỳ biến; `BACKUP_ENV_DIR` (trong env file) phải trỏ thư mục
chứa `pgbackrest.env`, `restic.env`, `ssh/` — thiếu thì `compose config` lỗi và `deploy.sh` dừng trước khi đổi gì. Thiết lập và khôi phục: `docs/runbooks/restore.md`.
Env file phải `chmod 600` (script từ chối nếu `others` đọc được). `DATABASE_URL_STAGING` ≠ `DATABASE_URL_PROD`, mật khẩu/khoá riêng từng môi trường (xem `.env.example`).

### 3.2 User deploy
- User riêng (vd `deploy`), thuộc nhóm `docker` (quyền root-tương-đương trên Docker: chỉ dùng key riêng cho CI; không dùng root. Workflow chạy 2 lệnh SSH — upload release (`bash -c` giải nén + `mv -T`) rồi `deploy.sh` — nên chưa khoá `command=` trong `authorized_keys`).
- Cần trên server: `docker` + `docker compose`, `flock`, `curl`, `tar` (đều có sẵn trên Ubuntu 24.04 + Docker 29).
- Mở khoá `authorized_keys` cho public key của `DEPLOY_SSH_KEY`.

### 3.3 Env file
Sao `.env.example` (khối Docker Compose staging/prod) → điền giá trị thật cho từng môi trường. `TAMI_IMAGE` trong file không cần đặt:
`deploy.sh` đặt biến môi trường `TAMI_IMAGE` (thắng `--env-file`). Hệ quả: chạy `docker compose` **tay** trên server (runbook `postgres-base-image.md`, `restore.md`) phải
`export TAMI_IMAGE="$(cat /opt/tami/state/<env>.current)"` trước, kể cả khi chỉ đụng `postgres` — compose interpolate `${TAMI_IMAGE:?}` cho cả file.

`RETENTION_ORPHAN_OBJECT_SCAN` (`off` | `dry-run` | `delete`, mặc định `dry-run`): bước quét object CV mồ côi của job `data-retention` xoá object private không còn dòng `private-files`. Để `dry-run` (chỉ đếm, audit `system.data_retention` ghi `orphanObjectsFound`) cho tới khi xác nhận bucket private chỉ phục vụ đúng DB này (không dùng chung giữa môi trường) và số mồ côi báo cáo hợp lý; khi đó mới đặt `delete` bằng tay trong env file. Dù ở `delete`, quá 100 object hoặc quá 20% số object đã liệt kê thì job không xoá và báo lỗi (`failedSteps`). Không tự bật `delete` cho prod.

### 3.4 Nginx / Cloudflare
Theo `docker/nginx/` và ARCHITECTURE §6 (không thuộc pipeline này). Staging chưa có tên miền: dùng biến thể sslip.io không Cloudflare, xem mục 9. **Cập nhật 2026-11-06 (BL-111): staging nay ở server mới `179-197-242-57.sslip.io`, xem mục 11; mục 9 mô tả staging sslip trên server cũ (dự phòng song song).**
Production chưa dùng Cloudflare (2026-10-23): `tami.genieplatform.cloud` trỏ thẳng về server, biến thể Let's Encrypt, xem mục 10.

## 4. Migration

- `payload migrate` chạy **trước** khi đổi `app`/`jobs`, qua service `migrate` (profile `tools`); app/jobs không tự migrate lúc khởi động.
- **Migration đã chạy KHÔNG rollback được.** Health fail → `deploy.sh` chỉ quay *image* về bản trước; DB giữ schema mới.
  Vì vậy mọi migration phải **backward-compatible với image trước** (expand/contract): lần deploy N chỉ thêm (cột/bảng nullable,
  default), lần N+1 mới bỏ phần cũ sau khi chắc chắn không image nào còn dùng.
- **BL-003:** hàm `down` của các migration Payload đã được làm idempotent (`DROP CONSTRAINT IF EXISTS` vì `DROP TABLE ... CASCADE` đã gỡ sẵn FK `payload_locked_documents_rels_*_fk`; `DROP INDEX IF EXISTS` chỉ để phòng thủ), nên `payload migrate:down` chạy được trọn vòng up/down/up. Chiến lược rollback production vẫn là **fix-forward**; `migrate:down` chỉ dùng cho DB dev/test, không bao giờ chạy trên staging/prod.
- Cấm `db push`, `migrate reset`, seed/reset, clone data staging→prod. `staging_db` ≠ `prod_db`.

### HIGH_RISK_MIGRATION
Migration phá dữ liệu hoặc không tương thích ngược (`DROP TABLE/COLUMN`, đổi type, `SET NOT NULL`, `UNIQUE/FK` trên dữ liệu cũ, enum phá hoại,
bulk transform/backfill) **phải** được tác giả đánh dấu bằng một dòng comment trong file `migrations/<tên>.ts`, ví dụ:

```ts
// HIGH_RISK_MIGRATION: DROP COLUMN listings.old_field (đã backfill sang new_field ở migration 20261020_…)
```
(Chấp nhận `// …`, `/* …`, ` * …`, `-- …` trong SQL; chỉ dòng comment có `HIGH_RISK_MIGRATION` ngay đầu nội dung, không tính chuỗi/ghi chú giữa dòng.)
Đây là quy ước thủ công: Builder gắn khi tạo migration, Reviewer kiểm tra; script không tự đoán từ SQL.

`deploy.sh` so tên migration trong image (`/app/migrations`) với bảng `payload_migrations` của DB đích để tìm migration **chưa apply**:
- **staging**: chỉ cảnh báo trong log, vẫn chạy (đây là nơi kiểm thử).
- **production**: có migration chưa apply mang dấu → **dừng sau khi pull, trước khi up/migrate/đổi container nào**, exit 1, không có cờ bỏ qua.
- Không đọc được DB để biết đã apply gì → dừng (fail-closed). Postgres chưa chạy / chưa có bảng → coi như chưa apply gì.
- **DB đích trống → không chặn** (2026-10-23, lần deploy production đầu bị chặn vì mọi migration đều "chưa apply"): chưa có container postgres **và** chưa có volume
  `<project>_postgres-data`, hoặc postgres chạy nhưng chưa có bảng `payload_migrations`. Không có dữ liệu thì không có gì để DROP/backfill làm mất; log ghi
  `DB production TRỐNG ... không chặn` kèm danh sách. Không container nhưng **volume còn** ⇒ vẫn coi là có dữ liệu và chặn như thường. Test: `deploy.test.sh` (`test_target_db_empty`).

Quy trình khi bị chặn:
1. Báo cáo ghi rõ thao tác phá huỷ, bảng/cột, tương thích dữ liệu, backfill, kế hoạch rollback, kết quả verify trên staging (AGENTS.md).
2. Ưu tiên tách migration thành các bước backward-compatible (bỏ dấu khi mỗi bước an toàn) rồi deploy lại.
3. Nếu bắt buộc: người có quyền **backup DB production** (xem ARCHITECTURE §8), thông báo cửa sổ bảo trì, chạy tay trên server
   (mục 5) sau khi xoá dấu bằng commit mới có reviewer duyệt; pipeline không tự làm việc này.

## 5. Deploy / rollback tay trên server

Dry-run (không thực thi gì, kể cả khi chạy trên máy dev):
```bash
bash /opt/tami/releases/staging/<sha>/scripts/deploy/deploy.sh staging --release-sha <sha> \
  --image ghcr.io/<owner>/<repo>@sha256:<digest> --dry-run
```

Deploy tay (cần token pull; ví dụ PAT `read:packages`, **không** nhập token vào dòng lệnh):
```bash
read -rs TOKEN && printf '%s\n' "$TOKEN" | bash /opt/tami/releases/production/<sha>/scripts/deploy/deploy.sh production \
  --release-sha <sha> --image ghcr.io/<owner>/<repo>@sha256:<digest> --registry-user <github-user> --registry-token-stdin; unset TOKEN
```
`<sha>` = commit đã build ra `<digest>` (cột 3 của `staging.history`). Release phải nằm đúng `releases/<env>/<sha>`; thiếu thì copy từ
môi trường kia: `cp -a /opt/tami/releases/staging/<sha> /opt/tami/releases/production/<sha>`.
Image đã có sẵn trên server thì bỏ `--registry-user/--registry-token-stdin` (script vẫn `docker pull`, thất bại nếu cần quyền).

**Rollback tự động**: health `/api/health` thất bại (30 lần × 5s mặc định, chỉnh `HEALTH_RETRIES/HEALTH_INTERVAL/HEALTH_TIMEOUT`) hoặc
`jobs` không `running`/có restart trong `JOBS_STABLE_CHECKS` lần kiểm (mặc định 3 × 5s), hoặc chính `compose up -d app jobs` trả lỗi
→ `deploy.sh` trả `current` về release trước, đưa `app` + `jobs` về image ghi trong `/opt/tami/state/<env>.current` (lúc đó là bản trước),
kiểm lại health + jobs, rồi exit **1** (job GitHub đỏ). Nếu **rollback cũng lỗi** → exit **3** + thông báo
`deploy thất bại VÀ rollback cũng thất bại`: môi trường có thể đang hỏng, làm tay theo phần dưới. State chỉ cập nhật khi thành công.

**Rollback tay** (image trước nằm ở `/opt/tami/state/<env>.previous`, được giữ khi dọn):
```bash
img="$(cat /opt/tami/state/<env>.previous)"; sha="$(grep "^${img#*@} " /opt/tami/state/staging.history | tail -1 | cut -d' ' -f3)"
bash /opt/tami/releases/<env>/$sha/scripts/deploy/deploy.sh <env> --release-sha "$sha" --image "$img" [--allow-older]
```
Với production, cặp digest + SHA phải có trong `staging.history`, và vì image trước **cũ hơn** `production.current` nên phải thêm
**`--allow-older`** (cờ chỉ dùng tay cho rollback có chủ đích; workflow không bao giờ truyền cờ này, nên duyệt nhầm một run cũ bị server từ chối). Nhớ: DB không lùi theo; nếu migration của bản lỗi
không tương thích ngược thì rollback image có thể lỗi → khôi phục từ backup (ARCHITECTURE §8).

**Rollback không có image trước** (deploy đầu tiên fail): script báo `không có image trước`; app giữ ở image lỗi. Gỡ tay `docker compose ... stop app jobs`, sửa, deploy lại.

**Guard postgres chặn vì volume có sẵn mà không có container** (`không có container … nhưng volume … đã có dữ liệu`): container postgres bị `down`/`rm` ngoài quy trình. Kiểm volume theo
`postgres-base-image.md` §6 (dữ liệu đã REINDEX theo glibc của image compose khai, hoặc volume do chính image đó tạo) rồi chạy tay với biến xác nhận — chỉ tay, workflow không bao giờ đặt:
```bash
PG_IMAGE_SWITCH_CONFIRMED=1 bash /opt/tami/releases/<env>/<sha>/scripts/deploy/deploy.sh <env> --release-sha <sha> --image ghcr.io/<owner>/<repo>@sha256:<digest build từ <sha>>
```

Khoá: 1 `flock` chung (`/opt/tami/state/deploy.lock`) cho cả hai môi trường, chờ tối đa 300s (`LOCK_WAIT_SECONDS`), sau đó báo lỗi.
`jobs` luôn 1 bản (container_name cố định).

## 6. Dọn dẹp
- `deploy.sh` xoá image `ghcr.io/<repo>@sha256:*` cũ, **giữ** current + previous của staging và production. Không đụng image dự án khác.
- **Không** chạy `docker image prune`/`docker builder prune` toàn cục: server dùng chung và image build trên GitHub nên không có build cache TAMI trên server.
  (ARCHITECTURE §6.4 mục 7 chỉ áp dụng nếu sau này build trên server.)
- Cache build GitHub Actions (`type=gha`) do GitHub tự dọn theo hạn mức repo.

## 7. Giới hạn đã biết
- Hai lần bấm `Deploy production` liền nhau xếp hàng trong nhóm `tami-deploy-production` (`cancel-in-progress: false` giữ deploy đang chạy).
- Bấm production cho commit cũ hơn commit staging mới nhất vẫn deploy được (nếu còn trong `staging.history` và không cũ hơn `production.current`) (được phép vì còn trong `staging.history`); DB staging khi đó có thể đã
  migrate xa hơn production — migration production chạy theo thứ tự tên, không bỏ sót.
- Action đã pin theo commit SHA đầy đủ (comment ghi version, SHA tra bằng `git ls-remote ... refs/tags/<tag>`); Dependabot đề xuất cập nhật.
- Rollback tự động cũng đọc compose qua `releases/<env>/current` (đã trả về release trước) nên đường dẫn bind mount không đổi giữa deploy và rollback (có assert trong `deploy.test.sh`).
- Compose đọc qua symlink `releases/<env>/current`; nếu Docker Compose resolve symlink thành đường dẫn thật khi tính bind mount thì
  postgres bị tạo lại ở mỗi lần đổi release (vài giây, dữ liệu nằm trong volume). Kiểm ở lần chạy thật đầu tiên (layer-6-task-01).
- Chưa chạy trên server thật: lần chạy đầu ở layer-6-task-01.

## 8. Source map trình duyệt → GlitchTip (tuỳ chọn)
Mục đích: stack lỗi trình duyệt trên GlitchTip hiện đúng file/dòng nguồn thay vì mã minify.
- Bật bằng cấu hình CI, không đổi code: GitHub **secret** `GLITCHTIP_AUTH_TOKEN` (token quyền `project:write`, tạo ở GlitchTip > Profile > Auth Tokens)
  và GitHub **vars** `GLITCHTIP_URL` (gốc GlitchTip, vd `https://glitchtip.example.com`), `GLITCHTIP_ORG`, `GLITCHTIP_PROJECT` (cùng project với `GLITCHTIP_PUBLIC_DSN`).
  `deploy.yml` truyền secret vào build qua Docker secret mount (`glitchtip_auth_token`, không vào layer/history) và vars qua build-arg.
- Không đặt secret: `pnpm build` KHÔNG sinh source map (`next.config.ts` → `shouldEmitBrowserSourceMaps`), script upload chỉ in "bỏ qua". Build bình thường.
- Có secret: `next build` sinh source map trình duyệt → `scripts/upload-sourcemaps.mjs` chạy `sentry-cli sourcemaps inject` (gắn debug ID vào `.js` + `.map`)
  rồi `sourcemaps upload` (url-prefix `~/_next/static`) → **luôn xoá `.map`** khỏi `.next/static` (kể cả khi upload lỗi), và `Dockerfile` xoá thêm lần nữa.
  Image cuối không chứa `.map`, `/_next/static/**/*.map` trả 404.
- Có token mà thiếu `GLITCHTIP_URL/ORG/PROJECT` → script ném lỗi, build dừng (không âm thầm bỏ qua).
- Lần đầu sau khi bật, kiểm: gây một lỗi JS thử trên staging, mở event trong GlitchTip, stack phải hiện đường dẫn nguồn (`src/...`). Nếu GlitchTip phiên bản cũ
  không hỗ trợ debug ID (artifact bundle) thì stack vẫn minify: nâng GlitchTip hoặc chuyển sang upload theo release (`--release`). Chưa kiểm được với server thật.
- Chạy tay (sau `GLITCHTIP_AUTH_TOKEN=... GLITCHTIP_URL=... GLITCHTIP_ORG=... GLITCHTIP_PROJECT=... pnpm build`): `node scripts/upload-sourcemaps.mjs`.

## 9. Staging trên sslip.io (không Cloudflare)

> **Server cũ, dự phòng (BL-111, 2026-11-06):** staging chính đã chuyển sang `179-197-242-57.sslip.io` trên server mới (mục 11). Mục này giữ làm mô tả staging sslip trên 187.52.119.50, chạy song song tới khi user tắt.

Quyết định của user (2026-10-18): chưa có tên miền và chưa dùng Cloudflare. Staging = `https://187-52-119-50.sslip.io` (IP server 187.52.119.50),
HTTPS bằng Let's Encrypt trên Nginx host, bảo vệ bằng HTTP basic auth + `X-Robots-Tag: noindex` + robots `Disallow` (app trả khi `APP_ENV=staging`), không CDN.
Đây là **ngoại lệ tạm thời của staging**. Production cũng chưa Cloudflare từ 2026-10-23: xem mục 10.
Biến thể Cloudflare của staging (`docker/nginx/tami-staging.conf`) giữ nguyên để dùng khi có tên miền.

> **Mọi bước dưới đây chạm server thật hoặc GitHub: chỉ làm sau khi user xác nhận trong chat từng bước (đánh dấu `[XÁC NHẬN]`).**
> Không bật firewall (đang tắt, ảnh hưởng dự án khác); chỉ báo cáo. Không sửa file site Nginx khác, không `docker system prune`.

### 9.1 Khác biệt so với staging/prod sau Cloudflare
| Hạng mục | Staging sslip.io | Sau Cloudflare |
|---|---|---|
| Nginx | `docker/nginx/tami-staging-sslip-http.conf` (cổng 80: ACME + 301) + `tami-staging-sslip.conf` (443) | `tami-staging.conf` / `tami.conf` + `tami-cloudflare-ips.conf` |
| Chứng chỉ | Let's Encrypt (certbot webroot) tại `/etc/letsencrypt/live/187-52-119-50.sslip.io/` | Origin cert Cloudflare |
| IP khách | `TRUST_CF_CONNECTING_IP=false`, `TRUST_X_REAL_IP=true`: Nginx ghi đè `X-Real-IP` = `$remote_addr`, app chỉ bind `127.0.0.1:3011` | `TRUST_CF_CONNECTING_IP=true`, `TRUST_X_REAL_IP=false` |
| Chặn công khai | basic auth + noindex | Cloudflare Access hoặc basic auth + noindex |
| Cache ảnh `/api/media/file/` | Nginx ghi đè `private, no-store` | staging: như vậy; prod: header của app, Cloudflare cache theo rule |

Các mục "Cache Rule Cloudflare", "SSL Full Strict", "Authenticated Origin Pulls" **không áp dụng** cho staging này.

### 9.2 Việc làm trên server (thứ tự)
Đã kiểm trên repo: `nginx -t` của hai file conf PASS trên **nginx 1.24** (`nginx:1.24-alpine`, cert giả, kèm một vhost giả `listen [::]:443 ssl ipv6only=on;` để chứng minh không xung đột listen); `deploy.test.sh` PASS; `docker compose config` staging PASS khi KHÔNG đặt `BACKUP_ENV_DIR`; migration chạy trọn trên DB PostGIS trống.
Nginx host dùng chung (nginx 1.24, đã đọc `nginx -T`): chưa site nào dùng `http2` trên 443, chỉ `default_server` ở cổng 80, nên conf TAMI KHÔNG đặt `http2` (tham số này thuộc socket ở nginx < 1.25.1, sẽ đổi hành vi của mọi site khác) và KHÔNG đặt `default_server`. Không bật `tami.conf` / `tami-staging.conf` (có `http2`) trên host này.

**Nguyên tắc host dùng chung:** không cài/nâng cấp/restart nginx, certbot hay docker; chỉ `nginx -t` rồi `systemctl reload nginx` (không restart), không sửa file site khác.

1. `[XÁC NHẬN]` Kiểm tra (chỉ đọc): `nginx -v` (>= 1.18), `docker version`, `docker compose version`, `ss -ltnp | grep -E ':(80|443|3011)\b'`
   (3011 phải trống; 80/443 do Nginx host đang dùng là bình thường), `ufw status` / `iptables -S` (chỉ báo cáo, **không bật**), `df -h /`.
   Cổng 80 phải tới được từ Internet (Let's Encrypt HTTP-01).
   Chỉ đọc thêm: `certbot --version`; `ls /etc/letsencrypt/renewal-hooks/deploy/`; `sudo nginx -T 2>/dev/null | grep -nE 'listen .*(443|http2)|default_server|server_name'` (không site nào khác dùng `server_name 187-52-119-50.sslip.io`; ghi lại các dòng `listen [::]:443` và `ipv6only` hiện có);
   `ip -6 addr show scope global` (host có IPv6 không). Nếu đã có site nghe `[::]:443` thì `listen [::]:443 ssl;` của TAMI vào chung socket đó (không `ipv6only`/`default_server`, không đổi vhost mặc định IPv6);
   nếu **chưa** site nào nghe `[::]:443` thì xoá dòng `listen [::]:443` (và `listen [::]:80` nếu cổng 80 IPv6 cũng chưa ai dùng) trong file trước khi cài, để TAMI không thành vhost mặc định ngầm của IPv6.
2. `[XÁC NHẬN]` User + thư mục (mục 3.1/3.2): user `deploy` thuộc nhóm `docker`; `sudo install -d -o deploy -g deploy -m 750 /opt/tami /opt/tami/state /opt/tami/releases`;
   thêm public key của `DEPLOY_SSH_KEY` vào `~deploy/.ssh/authorized_keys`.
   **Không cài/nâng cấp nginx hay certbot** (đã có: nginx 1.24, certbot 2.9; chỉ kiểm phiên bản ở bước 1). Chỉ khi thiếu `htpasswd` (`command -v htpasswd`): `sudo apt-get install -y --no-upgrade apache2-utils`.
   Không bao giờ restart nginx; chỉ `nginx -t` PASS rồi `systemctl reload nginx`.
3. `[XÁC NHẬN]` Env file `/opt/tami/staging.env` (`chmod 600`, chủ `deploy`; **không commit, không dán giá trị vào chat/log**). Chỉ liệt kê TÊN biến (giá trị sinh bằng `openssl rand -hex …` hoặc lấy từ dịch vụ ngoài):
   `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `DATABASE_URL_STAGING` (host `postgres`), `REDIS_PASSWORD`, `PAYLOAD_SECRET`,
   `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET_PUBLIC` (`tami-staging-public`), `S3_BUCKET_PRIVATE` (`tami-staging-private`),
   `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_PORT`, `EMAIL_FROM_ADDRESS`,
   `EMAIL_ALLOWLIST` (email nội bộ, bắt buộc ở staging), `TRANSLATION_MODEL`, `TRANSLATION_MONTHLY_BUDGET_USD=0` (tắt dịch AI ở staging; compose mặc định 0), **không cần** `ANTHROPIC_API_KEY` (để trống/bỏ),
   `NEXT_PUBLIC_SITE_URL=https://187-52-119-50.sslip.io` (không dấu `/` cuối), và tuỳ chọn `METRICS_TOKEN`, `GLITCHTIP_DSN`, `GLITCHTIP_PUBLIC_DSN`.
   Không đặt `APP_ENV` (compose staging ép `staging`), không đặt `TRUST_*` (mặc định compose đúng cho sslip), **không đặt `BACKUP_ENV_DIR`** (staging không backup, xem 9.5). `DATABASE_URL_STAGING` ≠ `DATABASE_URL_PROD`.
   Kiểm: `grep -E '^(TRUST_|BACKUP_|APP_ENV)' /opt/tami/staging.env` phải rỗng (nếu sao nguyên khối `.env.example` thì có dòng `TRUST_X_REAL_IP=false` làm mọi khách chung một bucket rate limit; dòng nào có thì xoá).
4. `[XÁC NHẬN]` Basic auth: `sudo htpasswd -c /etc/nginx/tami-staging.htpasswd <user>` (nhập mật khẩu tại dấu nhắc, không đặt trên dòng lệnh);
   `sudo chown root:www-data /etc/nginx/tami-staging.htpasswd && sudo chmod 640 /etc/nginx/tami-staging.htpasswd`.
5. `[XÁC NHẬN]` Site cổng 80 (chưa có chứng chỉ): copy `docker/nginx/tami-staging-sslip-http.conf` → `/etc/nginx/sites-available/`, symlink vào `sites-enabled/`,
   `ls -ld /var/www/certbot` trước: nếu đã có (site khác dùng) thì GIỮ NGUYÊN mode/owner, chỉ khi thiếu mới `sudo mkdir -p /var/www/certbot`; `sudo nginx -t` PASS rồi mới `sudo systemctl reload nginx`.
6. `[XÁC NHẬN]` Chứng chỉ (user cung cấp email + đồng ý điều khoản Let's Encrypt):
   `sudo certbot certonly --webroot -w /var/www/certbot -d 187-52-119-50.sslip.io --email <email> --agree-tos --no-eff-email --deploy-hook "nginx -t && systemctl reload nginx"`.
   Hook gắn riêng cho chứng chỉ này (lưu trong `/etc/letsencrypt/renewal/187-52-119-50.sslip.io.conf`); **không** tạo file trong `/etc/letsencrypt/renewal-hooks/deploy/` (chạy cho mọi chứng chỉ của host). Gia hạn bằng timer của certbot đang có; thử `sudo certbot renew --dry-run --cert-name 187-52-119-50.sslip.io`.
   Rủi ro: `sslip.io` là domain chung nên có thể dính giới hạn cấp chứng chỉ của Let's Encrypt; nếu bị từ chối, báo user (phương án: chứng chỉ tự ký + `curl -k`, hoặc đợi tên miền thật).
7. `[XÁC NHẬN]` Site cổng 443: copy `docker/nginx/tami-staging-sslip.conf` → `sites-available/`, symlink, `sudo nginx -t` PASS rồi `sudo systemctl reload nginx`.
   Không bật cùng `tami-staging.conf` (biến thể Cloudflare) cho cùng server_name/upstream.
8. `[XÁC NHẬN]` GitHub. Environment `staging`: secret `DEPLOY_HOST` (187.52.119.50), `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_SSH_KNOWN_HOSTS` (đối chiếu fingerprint); variable `DEPLOY_SSH_PORT` (nếu khác 22).
   **Repository variables** (job `build` không gắn Environment nên không đọc được var của Environment): `NEXT_PUBLIC_HOTLINE`; tuỳ chọn `GLITCHTIP_URL/ORG/PROJECT` + secret `GLITCHTIP_AUTH_TOKEN`.
   Environment `production`: secret SSH (mục 2.2–2.3; không có reviewers ở gói Free). Nhánh mặc định = `staging` (mục 2.1). Gói GHCR cho phép repo pull (mục 2.4).
9. `[XÁC NHẬN]` Lần deploy đầu: push lên `staging` → CI → Deploy. Lần đầu **không có image trước nên không thử rollback tự động** (G24). Theo dõi log `deploy.sh`;
   migration chạy toàn bộ trên DB trống (kiểm danh sách migration trước; cấm `db push`/reset).
   Kiểm: `curl -sI https://187-52-119-50.sslip.io/` → 401; có `-u` → 200 + `X-Robots-Tag`; `/robots.txt` có `Disallow: /`; trên server `curl -s http://127.0.0.1:3011/api/health` → 200.
   Bind mount postgres: sau lần deploy thứ hai, `docker inspect tami-staging-postgres --format '{{.Id}} {{.State.StartedAt}}'` không đổi và `--format '{{json .Mounts}}'` có `Source` chứa `/releases/staging/current/`.
   Nếu Compose resolve symlink (postgres bị tạo lại mỗi deploy) thì chuyển các bind `./postgres/init.sql` sang đường dẫn cố định (L4-T05 MINOR-2).
10. `[XÁC NHẬN]` Seed (trong container app, **chỉ staging**, idempotent): `docker exec tami-staging-app pnpm seed` (34 tỉnh/thành, danh mục, trang pháp lý nháp), sau đó
    `docker exec tami-staging-app pnpm seed --sample` (menu/footer, dịch vụ, tin, dự án, tuyển dụng, cho thuê mẫu; bị chặn khi `APP_ENV=production`; bước cuối "dữ liệu tiếng Anh viết sẵn" (`seed/english/`) chỉ chạy trên DB dev nên ở staging tự bỏ qua với log "bỏ qua: không phải DB dev"; xem `seed/english/README.md`).
    Trước khi **xuất bản** Chính sách bảo mật: vào admin điền `site-settings.siteName` (bản vi); thiếu thì xuất bản trả lỗi 400 nêu rõ. Email chỉ tới `EMAIL_ALLOWLIST`.
11. `[XÁC NHẬN]` Smoke test rate limit theo IP: gửi form ứng tuyển/liên hệ từ 2 IP khác nhau → mỗi IP một bucket (không cùng 429). Cột đầu log `/var/log/nginx/tami-staging.access.log` là IP thật.
12. `[XÁC NHẬN]` Diễn tập rollback (cần ít nhất một release staging đã deploy thành công trước đó): deploy một **image lỗi thật** — commit có chủ đích làm
    `/api/health` lỗi đi qua CI/CD, sau đó revert bằng commit mới. Commit đó phải qua được CI (chỉ hỏng lúc chạy, không test nào bắt) và **không** kèm migration
    (migration đã chạy không rollback được). **Không** làm hỏng `staging.env` hay đặt biến môi trường hỏng cho `deploy.sh`:
    `rollback_to_previous` dùng chung `ENV_FILE` và môi trường tiến trình nên rollback cũng hỏng (exit 3, staging chết).
    Kỳ vọng exit 1, `current` quay về release trước, app về image trước, health 200; lưu log làm evidence. Không chạy trên production.
    Trạng thái 2026-10-18: hoãn tới lần deploy staging thật kế tiếp (trước M5); tạm dựa vào `scripts/deploy/deploy.test.sh` (kịch bản rollback) đã PASS.
13. Evidence: ảnh chụp `/`, `/du-an`, `/tin-tuc`, `/dich-vu`, `/tuyen-dung`, `/lien-he` (bản đồ vẽ tile, console không lỗi "Worker failed to load"); trang lỗi gốc có số hotline.

### 9.3 Cờ tin IP khách theo môi trường
`TRUST_CF_CONNECTING_IP` / `TRUST_X_REAL_IP`: production `true`/`false` (ép trong `docker-compose.prod.yml`); staging sslip `false`/`true` (mặc định `docker-compose.staging.yml`);
staging sau Cloudflare `true`/`false` (đặt trong env file). Không bật cả hai (khi đó chỉ `CF-Connecting-IP` được xét).
`X-Real-IP` chỉ được tin khi (a) Nginx cùng host ghi đè nó bằng `$remote_addr` và (b) app chỉ nghe `127.0.0.1:3011`. Đổi một trong hai điều kiện (vd publish cổng ra `0.0.0.0`) thì phải tắt `TRUST_X_REAL_IP`.

### 9.4 Giá trị phải hỏi user (không tự chọn)
Email Let's Encrypt, tên/mật khẩu basic auth, `EMAIL_ALLOWLIST`, `NEXT_PUBLIC_HOTLINE`. Đã chốt (user, 2026-10-18): staging không backup, không alert tới M3 (G10), dịch AI tắt (`TRANSLATION_MONTHLY_BUDGET_USD=0`, không cần `ANTHROPIC_API_KEY`).

### 9.5 Backup/giám sát/dịch AI trên staging (quyết định user 2026-10-18)
- **Không backup:** `docker-compose.staging.yml` dùng image `tami-postgis:17-3.5-bookworm` (Dockerfile `docker/backup` target `postgis` = `postgres:17.11-bookworm` + PostGIS 3.5.2, không pgbackrest; build trên server
  `$C build postgres`, chưa có tag thì `compose up` tự build), `archive_mode=off`, không có dịch vụ `backup`, không đọc `BACKUP_ENV_DIR`. Volume staging hiện có do `postgis/postgis:17-3.5` (bullseye) tạo:
  chuyển sang image bookworm theo `docs/runbooks/postgres-base-image.md` (deploy bị guard chặn cho tới khi làm xong). `deploy.sh` chỉ `up` dịch vụ `backup` khi compose của môi trường có khai báo (prod có, staging không). Dữ liệu staging là dữ liệu mẫu: mất thì chạy lại migrate + seed. Prod giữ nguyên cấu hình backup. Muốn bật lại cho staging: chép khối `postgres`/`backup` và volume từ `docker-compose.prod.yml`.
- **Không alert tới M3:** không tạo rule/Uptime Kuma cho staging; xem log bằng `docker logs`.
- **Dịch AI tắt:** `TRANSLATION_MONTHLY_BUDGET_USD=0`, không cần `ANTHROPIC_API_KEY` (`src/lib/env.ts` chấp nhận khoá rỗng; test `env.test.ts`).

## 10. Production không Cloudflare (tami.genieplatform.cloud)

Quyết định user 2026-10-23: production lên trước Cloudflare, tại `https://tami.genieplatform.cloud` (DNS A thẳng về 187.52.119.50). Tên miền này gắn tạm cho staging
từ 2026-10-21; nay **chỉ production** dùng, staging còn `https://187-52-119-50.sslip.io`. Production DB khởi đầu **trống** (không clone dữ liệu staging, AGENTS.md),
nội dung nhập lại qua admin.

> Mọi bước chạm server/GitHub: chỉ làm sau khi user xác nhận trong chat từng bước `[XÁC NHẬN]`. Nguyên tắc host dùng chung ở 9.2 giữ nguyên
> (không cài/restart nginx/certbot/docker; chỉ `nginx -t` rồi `systemctl reload nginx`; không sửa site khác).

| Hạng mục | Production không Cloudflare |
|---|---|
| Nginx | `docker/nginx/tami-prod-direct-http.conf` (80: ACME + 301) + `tami-prod-direct.conf` (443 → `127.0.0.1:3010`), không `http2`, không `default_server`, không `noindex` |
| Chứng chỉ | Let's Encrypt `--cert-name tami.genieplatform.cloud` (đã cấp 2026-10-21, SAN gồm cả sslip) **dùng chung** với staging; gia hạn webroot cần cả hai site cổng 80 phục vụ `/.well-known/acme-challenge/` |
| IP khách | `prod.env`: `TRUST_CF_CONNECTING_IP=false`, `TRUST_X_REAL_IP=true` — compose prod **bắt buộc khai** (thiếu thì `compose config` lỗi, `deploy.sh` dừng trước khi đổi gì) |
| Cache ảnh | giữ header của app (`public, immutable`), không CDN |
| Thiếu so với Cloudflare | cache CDN, WAF/DDoS, lớp xác thực thứ 2 cho `/admin` (Cloudflare Access) |

### 10.1 Thứ tự
1. `[XÁC NHẬN]` GitHub Environment `production` (gói Free: không có required reviewers, production chỉ chạy khi bấm tay `Deploy production`): thêm secret `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_SSH_KNOWN_HOSTS` (mục 2.2–2.3).
2. `[XÁC NHẬN]` Kiểm (chỉ đọc): `ss -ltnp | grep ':3010'` trống, `df -h /`, `docker ps --format '{{.Names}}' | grep '^tami-'` (chỉ thấy `tami-staging-*`).
3. `[XÁC NHẬN]` `/opt/tami/prod.env` (`chmod 600`, chủ `deploy`; giá trị sinh trên server, không dán vào chat/log). Tên biến như 9.2 bước 3 nhưng giá trị RIÊNG production, cộng:
   `DATABASE_URL_PROD` (host `postgres`), `S3_BUCKET_PUBLIC=tami-prod-public`, `S3_BUCKET_PRIVATE=tami-prod-private`, `NEXT_PUBLIC_SITE_URL=https://tami.genieplatform.cloud`,
   `TRUST_CF_CONNECTING_IP=false`, `TRUST_X_REAL_IP=true`, `BACKUP_ENV_DIR=/opt/tami/backup/production`; không đặt `APP_ENV` (compose ép `production`), không `EMAIL_ALLOWLIST`.
   Turnstile: site key phải cho phép hostname `tami.genieplatform.cloud`.
4. `[XÁC NHẬN]` Backup: `docs/runbooks/restore.md` §2 bước 1 với `E=production` (kho ngoài server, mật khẩu mã hoá cất bản sao ngoài server).
5. `[XÁC NHẬN]` Deploy: push `staging` → staging tự deploy (summary in commit) → Actions → **Deploy production** → Run workflow → nhập commit đó. Lần đầu: migrate trên DB trống, không có image trước để rollback (G24).
   Sau đó restore.md §2 bước 4–5 (stanza-create, check, restic init, full đầu tiên), rồi `docker exec tami-app pnpm seed` (chỉ phần nền; `--sample` bị chặn ở production).
   Admin đầu tiên: user tự tạo ở `/admin`. Trên server: `curl -s http://127.0.0.1:3010/api/health` → 200.
6. `[XÁC NHẬN]` Chuyển tên miền (một lần reload, chọn giờ ít người dùng):
   copy `tami-staging-sslip{,-http}.conf` mới (server_name chỉ còn sslip) đè bản trong `sites-available/`, copy `tami-prod-direct{,-http}.conf` vào `sites-available/` + symlink `sites-enabled/`,
   `sudo nginx -t` PASS rồi `sudo systemctl reload nginx`. Không bật `tami.conf` (Cloudflare, có `http2`).
   Rollback: gỡ symlink `tami-prod-direct*`, chép lại hai file staging cũ (giữ bản sao trước khi đè), `nginx -t` + reload.
7. Kiểm: `curl -sI https://tami.genieplatform.cloud/` → 200, **không** có `X-Robots-Tag`; `/robots.txt` không `Disallow: /`; `curl -sI https://187-52-119-50.sslip.io/` → có `X-Robots-Tag: noindex`;
   `sudo certbot renew --dry-run --cert-name tami.genieplatform.cloud` PASS; gửi form liên hệ thử, log `/var/log/nginx/tami.access.log` cột đầu là IP thật.

## 11. Staging trên server mới (179.197.242.57, `179-197-242-57.sslip.io`)

Quyết định user 2026-11-06 (BL-111, decisions.md Decision 12): staging chuyển sang server mới, Nginx host + Let's Encrypt, không Cloudflare/Tunnel, **không basic auth** (công khai + `noindex`). Hostname staging là sslip.io (`tamihomes.vn` dành cho production = BL-112, chưa làm).
Staging sslip trên server cũ 187.52.119.50 (mục 9) chạy song song làm dự phòng tới khi user tắt.
Production vẫn ở server cũ 187.52.119.50 (`tami.genieplatform.cloud`, mục 10);  cổng staging.history giữa 2 server: xem §1 (job record-staging-pass, BL-111 phase-1-task-02).

> Mọi bước chạm server thật: chỉ làm sau khi user xác nhận (`[XÁC NHẬN]`). Server dùng chung với dự án khác.

### 11.1 Bố cục server và nguyên tắc host dùng chung
- SSH alias `server` (`179.197.242.57`, Hostinger, Ubuntu 26.04, 2 vCPU, 7.7 GB RAM, SSD 96 GB, Docker 29.9 / Compose 5.6). Chi tiết ARCHITECTURE §6.1.
- Dự án khác (supabase, airoom, babyai, ai-rid, nextlevel-dashboard...) ra Internet bằng cloudflared quick tunnel. **Ngoại lệ:** `outfitai.genieplatform.cloud` (outfit-changer) có site Nginx + cert Let's Encrypt riêng trên host này (bật 04:21Z, cert 04:27Z ngày 2026-11-06, trước khi TAMI thêm reject). Vì vậy Nginx 443 và certbot là **dùng chung** với outfitai, không phải chỉ TAMI. Tác động: (1) `tami-default-reject.conf` là default_server 443 toàn host nên client không SNI / truy cập bằng IP trần tới outfitai bị từ chối handshake (client có SNI đúng tên vẫn vào bình thường); (2) cert TAMI được cấp dưới ACME account có sẵn của certbot outfitai nên `--register-unsafely-without-email` không có tác dụng (không có email liên hệ); (3) hook gia hạn toàn cục cũng chạy khi outfitai gia hạn (chỉ graceful reload, vô hại). **Báo chủ outfitai** về 3 điểm này; không sửa site/cert của họ.
- **Cấm:** bật ufw, `apt upgrade`/`dist-upgrade`, reboot, sửa sshd / mật khẩu root, đụng container hoặc thư mục dự án khác, `docker system prune`.
- **Được:** nginx + certbot do TAMI cài nên TAMI được `nginx -t` + `systemctl reload nginx`. Thư mục `/opt/tami/` (env file, `releases/`), container `tami-staging-*`, app chỉ bind `127.0.0.1:3011`.
- Known hosts / fingerprint host ED25519: `SHA256:5uzqgi5o4/BsMUm9/Fy39nXoMNQP/x1MvzYtJKXIs94`. `DEPLOY_SSH_KNOWN_HOSTS` lấy bằng `ssh-keyscan -t ed25519 179.197.242.57` rồi đối chiếu fingerprint này (`ssh-keygen -lf -`).
- DNS: không cần bản ghi nào, sslip.io tự phân giải `179-197-242-57.sslip.io` → `179.197.242.57` (kiểm `dig +short 179-197-242-57.sslip.io`).

### 11.2 Cài nginx + certbot (không nâng cấp gói khác)

1. `[XÁC NHẬN]` Swap 4 GB (phase-2-task-01), Docker đã có sẵn.
   Trước bước 2 phải mô phỏng: `sudo apt-get install -s --no-upgrade --no-install-recommends nginx certbot apache2-utils | grep '^Inst'`. `--no-upgrade` không bảo vệ thư viện dùng chung của gói phụ thuộc mới: nếu có dòng `Inst <gói> [<phiên bản cũ>]` của gói ĐÃ cài (tức bị nâng cấp) thì DỪNG và hỏi user; chỉ gói mới (không có `[...]`) mới được tiếp tục.
2. `[XÁC NHẬN]` `sudo NEEDRESTART_MODE=l DEBIAN_FRONTEND=noninteractive apt-get install -y --no-upgrade --no-install-recommends nginx certbot apache2-utils` (`NEEDRESTART_MODE=l` chỉ liệt kê, không tự restart dịch vụ khác; `apache2-utils` = `htpasswd`, để sẵn nếu sau này bật lại basic auth). Thực tế 2026-11-06: 13 gói mới, 0 gói nâng cấp; nginx 1.28.3, certbot 4.0.0; needrestart chỉ liệt kê dbus, networkd-dispatcher, systemd-logind, unattended-upgrades (do unattended-upgrades 04–05/11, không do TAMI) — không restart, chờ chủ server reboot có kế hoạch. Kiểm `nginx -v` (1.28.x), `certbot --version` (4.0.x), `systemctl is-active nginx`.
3. `sudo install -d -o root -g root -m 755 /var/www/certbot`.
4. Không firewall: chỉ báo nếu cổng 80/443 từ ngoài không tới được (nhà cung cấp có thể chặn ở tầng khác).
5. `[XÁC NHẬN]` User `deploy` cho CI (phase-2-task-01): trên máy dev tạo khoá riêng cho CI `ssh-keygen -t ed25519 -f ~/.ssh/tami_ci_deploy -N ""` (private key chỉ vào secret `DEPLOY_SSH_KEY`, không vào chat/log). Trên server:
   `sudo adduser --disabled-password --gecos "" deploy`; `sudo usermod -aG docker deploy`; `sudo install -d -o deploy -g deploy -m 700 /home/deploy/.ssh`;
   ghi nội dung `~/.ssh/tami_ci_deploy.pub` (khoá công khai) vào `/home/deploy/.ssh/authorized_keys` (`chown deploy:deploy`, `chmod 600`). Không sửa sshd_config, không đặt mật khẩu.

### 11.3 Dựng stack (thứ tự)
1. `[XÁC NHẬN]` `/opt/tami/` như mục 3.1; `/opt/tami/staging.env` (`chmod 600`, chủ `deploy`) theo 9.2 bước 3 nhưng `NEXT_PUBLIC_SITE_URL=https://179-197-242-57.sslip.io`; không đặt `TRUST_*`, `APP_ENV`, `BACKUP_ENV_DIR`. `DATABASE_URL_STAGING` ≠ `DATABASE_URL_PROD`.
2. `[XÁC NHẬN]` Site cổng 80: copy `docker/nginx/tami-staging-sslip-179-http.conf` → `/etc/nginx/sites-available/`, symlink `sites-enabled/`, `sudo nginx -t` PASS rồi `sudo systemctl reload nginx`.
3. `[XÁC NHẬN]` Cấp chứng chỉ (user đã đồng ý điều khoản Let's Encrypt, không email):
   `sudo certbot certonly --webroot -w /var/www/certbot -d 179-197-242-57.sslip.io --agree-tos --register-unsafely-without-email --non-interactive`.
   Gia hạn: `certbot.timer` (systemd) + hook dùng chung `/etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh` (root, 755; nội dung `#!/bin/sh` rồi `nginx -t && systemctl reload nginx`; hook toàn cục: cũng chạy khi cert outfitai gia hạn, chỉ graceful reload, vô hại; xem 11.1). Cert ở `/etc/letsencrypt/live/179-197-242-57.sslip.io/{fullchain,privkey}.pem`. Kiểm `sudo certbot renew --dry-run --cert-name 179-197-242-57.sslip.io --no-random-sleep-on-renew` PASS (KHÔNG chạy `renew --dry-run` trần: chạm cả cert của outfitai; thiếu cờ sleep thì chờ ngẫu nhiên ~6 phút khi không có tty) và `systemctl is-enabled certbot.timer`.
4. `[XÁC NHẬN]` Site cổng 443: copy `tami-staging-sslip-179.conf` + `tami-default-reject.conf` → `sites-available/`, symlink, `sudo nginx -t` PASS rồi `sudo systemctl reload nginx`.
   `tami-default-reject.conf` (default_server 443, `ssl_reject_handshake`) chỉ cài trên host mới này, **không** cài lên server cũ. Cổng 80 giữ site `default` của gói nginx.
5. Dữ liệu: chuyển postgres + SeaweedFS từ staging cũ sang (phase-2-task-02; ~147 MB + ~457 MB), không clone dữ liệu giữa staging và production.
6. GitHub Environment `staging`: `DEPLOY_HOST=179.197.242.57`, `DEPLOY_USER=deploy`, `DEPLOY_SSH_KEY`, `DEPLOY_SSH_KNOWN_HOSTS` như 11.1 (phase-2-task-03); deploy lần đầu theo mục 1.
   Thực tế 2026-11-06: Deploy run 42163804119 (commit `55e52730`) xanh cả 3 job; guard postgres qua (container dựng sẵn ở bước 5, không tạo lại), migrate xong, health OK; `staging.history` server cũ có dòng mới (job `record-staging-pass`). Dump tạm `/opt/tami/transfer` đã xoá sau review PASS.
7. Smoke trước khi có Nginx/cert: tunnel `ssh -N -L 13011:127.0.0.1:3011 server` + `curl -H 'Host: 179-197-242-57.sslip.io' http://127.0.0.1:13011/...`. Đóng tunnel bằng **PID của chính tiến trình ssh đó** (không `taskkill /IM ssh.exe` / `pkill ssh` — làm rơi mọi phiên SSH khác, kể cả tới production). Qua tunnel không có Nginx nên app log cảnh báo "không xác định IP khách / chung 1 bucket rate limit" — bình thường, phải hết khi đi qua Nginx 443 (11.4).

### 11.4 Smoke
- `curl -sI http://179-197-242-57.sslip.io/` → 301 sang https; `curl -sI https://179-197-242-57.sslip.io/` → 200 + `X-Robots-Tag: noindex, nofollow, noarchive` + HSTS `max-age=86400`.
- `/robots.txt` có `Disallow: /`; `/api/metrics` và `/api/internal/x` → 404; trên server `curl -s http://127.0.0.1:3011/api/health` → 200.
- `curl -sk --resolve x.invalid:443:179.197.242.57 https://x.invalid/` (hostname lạ) → lỗi TLS handshake (không phải trang staging).
- Gửi form liên hệ thử: cột đầu `/var/log/nginx/tami-staging.access.log` là IP thật; 2 IP khác nhau → 2 bucket rate limit.
- Rollback cấu hình nginx: gỡ symlink `tami-staging-sslip-179*` + `tami-default-reject.conf`, `nginx -t` + reload. Staging sslip cũ vẫn phục vụ.
