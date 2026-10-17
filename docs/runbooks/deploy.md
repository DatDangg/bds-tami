# Runbook: Deploy TAMI (staging → production)

Phạm vi: `.github/workflows/deploy.yml`, `.github/actions/ssh-deploy/action.yml`, `scripts/deploy/deploy.sh` + `scripts/deploy/lib/*.sh`.
Kiến trúc: `docs/ARCHITECTURE.md` §6.4. Quyết định: `.context/decisions.md` Decision 4.

## 1. Luồng

```
push staging → CI (ci.yml) PASS → [workflow_run] Deploy:
  build   : GitHub runner build image, tag = commit SHA, push GHCR, lấy DIGEST
  staging : (tự động, Environment `staging`) SSH → deploy.sh staging  --image <repo>@<digest>
  production: (Environment `production`, DỪNG chờ reviewer duyệt) SSH → deploy.sh production --image <repo>@<CÙNG digest>
```

- Chỉ chạy khi CI PASS cho **push vào `staging` của chính repo** (không `main`, không PR, không fork).
- Production nhận đúng digest staging đã chạy (output của job staging); không build lại, không tag `latest`.
  Thêm lớp bảo vệ ở server: `deploy.sh production` chỉ nhận cặp **digest + commit SHA** có trong `/opt/tami/state/staging.history`
  (dòng `<digest> <thời điểm> <sha>` do chính lần deploy staging **thành công** ghi), và **từ chối digest cũ hơn** `production.current`
  (trừ `--allow-older`, chỉ dùng tay, mục 5). Kiểm này chạy **trước khi pull**.
- **Release bất biến theo môi trường + SHA**: mã triển khai (`docker/`, `scripts/deploy/`) được upload vào
  `/opt/tami/releases/<env>/<sha>/` (giải nén sạch vào thư mục tạm rồi `mv -T` nguyên tử; SHA đã có thì giữ nguyên, **không ghi đè**),
  và `deploy.sh` chạy **từ chính release đó** (từ chối nếu script không nằm đúng `releases/<env>/<sha>`). Nhờ vậy production luôn
  dùng compose/config của đúng commit đã duyệt, kể cả khi staging của commit mới hơn upload trong lúc production chờ khoá.
- Thứ tự mỗi môi trường trong `deploy.sh`: khoá → kiểm release → (production: digest+SHA đã qua staging, không cũ hơn)
  → đổi symlink `releases/<env>/current` nguyên tử → `compose config -q` → pull → cổng `HIGH_RISK_MIGRATION`
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
| `production` | **Required reviewers** (ít nhất 1 người có trách nhiệm duyệt), bật *Prevent self-review* nếu đủ người. Deployment branches: `staging`. Tuỳ chọn *Wait timer*. |

Required reviewers là cách duy nhất ép "duyệt tay" cho production; thiếu cấu hình này thì job production chạy tự động. Kiểm tra: lần chạy đầu phải thấy job
`Deploy production` ở trạng thái *Waiting*.

### 2.3 Secret / variable
Tạo **Environment secret** ở cả `staging` và `production` (giá trị có thể giống nhau nếu cùng server, nhưng nên dùng key riêng):

| Tên | Loại | Nội dung |
|---|---|---|
| `DEPLOY_HOST` | secret | IP/hostname server |
| `DEPLOY_USER` | secret | user deploy (không phải root), xem 3.2 |
| `DEPLOY_SSH_KEY` | secret | private key ed25519 chỉ dùng cho deploy (không phải key cá nhân) |
| `DEPLOY_SSH_KNOWN_HOSTS` | secret | dòng known_hosts của server, lấy từ máy tin cậy: `ssh-keyscan -p <port> -t ed25519 <host>` rồi **đối chiếu fingerprint** với server thật trước khi lưu |
| `DEPLOY_SSH_PORT` | variable (tuỳ chọn) | cổng SSH, mặc định 22 (known_hosts phải ghi `[host]:port` nếu khác 22) |

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
**Backup (bắt buộc trước deploy đầu tiên):** compose staging/prod có service `backup` và image postgres tuỳ biến; `BACKUP_ENV_DIR` (trong env file) phải trỏ thư mục
chứa `pgbackrest.env`, `restic.env`, `ssh/` — thiếu thì `compose config` lỗi và `deploy.sh` dừng trước khi đổi gì. Thiết lập và khôi phục: `docs/runbooks/restore.md`.
Env file phải `chmod 600` (script từ chối nếu `others` đọc được). `DATABASE_URL_STAGING` ≠ `DATABASE_URL_PROD`, mật khẩu/khoá riêng từng môi trường (xem `.env.example`).

### 3.2 User deploy
- User riêng (vd `deploy`), thuộc nhóm `docker` (quyền root-tương-đương trên Docker: chỉ dùng key riêng cho CI; không dùng root. Workflow chạy 2 lệnh SSH — upload release (`bash -c` giải nén + `mv -T`) rồi `deploy.sh` — nên chưa khoá `command=` trong `authorized_keys`).
- Cần trên server: `docker` + `docker compose`, `flock`, `curl`, `tar` (đều có sẵn trên Ubuntu 24.04 + Docker 29).
- Mở khoá `authorized_keys` cho public key của `DEPLOY_SSH_KEY`.

### 3.3 Env file
Sao `.env.example` (khối Docker Compose staging/prod) → điền giá trị thật cho từng môi trường. `TAMI_IMAGE` trong file không cần đặt:
`deploy.sh` đặt biến môi trường `TAMI_IMAGE` (thắng `--env-file`).

### 3.4 Nginx / Cloudflare
Theo `docker/nginx/` và ARCHITECTURE §6 (không thuộc pipeline này).

## 4. Migration

- `payload migrate` chạy **trước** khi đổi `app`/`jobs`, qua service `migrate` (profile `tools`); app/jobs không tự migrate lúc khởi động.
- **Migration đã chạy KHÔNG rollback được.** Health fail → `deploy.sh` chỉ quay *image* về bản trước; DB giữ schema mới.
  Vì vậy mọi migration phải **backward-compatible với image trước** (expand/contract): lần deploy N chỉ thêm (cột/bảng nullable,
  default), lần N+1 mới bỏ phần cũ sau khi chắc chắn không image nào còn dùng.
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
- Không đọc được DB để biết đã apply gì → dừng (fail-closed). Postgres chưa chạy / chưa có bảng (deploy đầu) → coi như chưa apply gì.

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

Khoá: 1 `flock` chung (`/opt/tami/state/deploy.lock`) cho cả hai môi trường, chờ tối đa 300s (`LOCK_WAIT_SECONDS`), sau đó báo lỗi.
`jobs` luôn 1 bản (container_name cố định).

## 6. Dọn dẹp
- `deploy.sh` xoá image `ghcr.io/<repo>@sha256:*` cũ, **giữ** current + previous của staging và production. Không đụng image dự án khác.
- **Không** chạy `docker image prune`/`docker builder prune` toàn cục: server dùng chung và image build trên GitHub nên không có build cache TAMI trên server.
  (ARCHITECTURE §6.4 mục 7 chỉ áp dụng nếu sau này build trên server.)
- Cache build GitHub Actions (`type=gha`) do GitHub tự dọn theo hạn mức repo.

## 7. Giới hạn đã biết
- Job production đang *Waiting* chiếm nhóm `tami-deploy-production`; lần chạy mới hơn cùng đợi, GitHub huỷ bản chờ cũ hơn
  (`cancel-in-progress: false` giữ deploy đang chạy). Duyệt production bản mới nhất, từ chối bản cũ.
- Duyệt production sau khi staging đã deploy commit mới hơn vẫn deploy digest cũ (được phép vì còn trong `staging.history`); DB staging khi đó có thể đã
  migrate xa hơn production — migration production chạy theo thứ tự tên, không bỏ sót.
- Action đã pin theo commit SHA đầy đủ (comment ghi version, SHA tra bằng `git ls-remote ... refs/tags/<tag>`); Dependabot đề xuất cập nhật.
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
