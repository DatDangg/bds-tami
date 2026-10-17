Agent: reviewer

# Review — build/tami-website · layer-4-task-05 · round 1

- **Review level:** STRICT
- **Reason:** Pipeline deploy (staging + production), migration gate, secret (SSH key, GITHUB_TOKEN) và SSH vào server dùng chung với dự án khác. Đây là risk đỏ: security/token, migration, cron/deploy, shared infra.
- **Diff:** working tree so với HEAD `0e4f3f7`. Mới: `.github/workflows/deploy.yml`, `.github/actions/ssh-deploy/action.yml`, `scripts/deploy/deploy.sh`, `scripts/deploy/deploy.test.sh`, `docs/runbooks/deploy.md`. Sửa: `.context/decisions.md` (Decision 4), `docs/ARCHITECTURE.md` §6.4, task file. (`.context/progress.json` và `.context/runs/*` do primary ghi, không review.)
- **Blast radius:** CD GitHub Actions (job build có `packages:write`, image production); server dùng chung `/opt/tami/{repo,state,*.env}`; compose project `tami-staging` và `tami` (app/jobs/migrate/postgres/redis/seaweedfs); DB staging và DB production qua `payload migrate`; image `ghcr.io/<repo>` trên server (prune). Không đổi API, schema hay UI.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `docker run --rm -v "$PWD:/repo" -w /repo rhysd/actionlint:1.7.7 -no-color` | PASS (exit 0, không cảnh báo; composite action không nằm trong phạm vi actionlint). Lần chạy đầu với `-color=never` lỗi cờ do reviewer gõ sai, không phải lỗi repo |
| `docker run --rm -v "$PWD:/mnt" -w /mnt koalaman/shellcheck:stable scripts/deploy/deploy.sh scripts/deploy/deploy.test.sh` | PASS (exit 0) |
| `bash scripts/deploy/deploy.test.sh` | PASS 19/19 |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |
| `pnpm test` | PASS (77 file, 827 test) |
| `pnpm install --frozen-lockfile` / `pnpm build` | không chạy lại (diff không đụng TS/JS hay dependency); dựa vào kết quả builder |

## Responsive Checklist Gate
N/A: diff không đụng UI (route, component, CSS).

## Skill gates
- aislop: skip, lệnh `aislop` không nằm trong danh sách verify command reviewer được phép chạy; diff là YAML, bash và doc, không có TS/JS.
- oxlint (anti-slop): N/A, diff không đụng TS/JS.
- ocr (open-code-review): skip, ocr not installed hoặc không được phép chạy.
- AI-readable: OK. Có 1 indicator: `scripts/deploy/deploy.sh` dài 356 dòng (> 300). Các hàm đều ≤ 50 dòng. Tên rõ ràng, comment giải thích WHY, ARCHITECTURE §6.4, runbook và decision đã cập nhật. Tổng < 3 indicator.
- ai-friendly-web: N/A, task không public-facing.
- blitzstrike: skip, không có môi trường được phép (task không deploy thật, không SSH).

## Kiểm theo yêu cầu (tóm tắt)
- **Trigger / injection:** chỉ có `workflow_run` của `CI` (tên `CI` khớp `.github/workflows/ci.yml:1`), `branches: [staging]`. Job `if` yêu cầu `conclusion==success`, `event==push`, `head_branch==staging`, `head_repository==repo`, nên PR từ fork không chạy được. Trong `run:` không có `${{ }}` nào nhận giá trị người dùng kiểm soát: `head_branch` chỉ dùng trong `if`, commit message không dùng ở đâu, digest đi qua `env` và được kiểm regex. Không có trigger từ `main`. OK.
- **GITHUB_TOKEN scope:** mặc định `contents: read`; chỉ job build có `packages: write`, job deploy có `packages: read`. OK.
- **Secret:** không có `set -x` (`set +x` ở deploy.sh:21). Khoá SSH tạo với mode 600 bằng `install -m 600` rồi ghi, xoá bằng `if: always()`. Dùng `StrictHostKeyChecking=yes` và `known_hosts` lấy từ secret. Token đi qua stdin của ssh, rồi `printf` (builtin) pipe vào `docker login --password-stdin`, nên không nằm trong argv. `DOCKER_CONFIG` tạm nằm trong `TMP_DIR` mode 700, `trap cleanup EXIT` dọn kể cả khi lỗi. OK.
- **deploy.sh:** migrate chạy trước `up app jobs` (dòng 328 trước dòng 329). Health check gọi `127.0.0.1:3011` (staging) và `127.0.0.1:3010` (prod), khớp `ports` của compose. State ghi atomic bằng tmp + `mv`. flock ở `/opt/tami/state/deploy.lock`. Prune lọc theo repo trong `--image` và giữ current/previous của cả 2 môi trường. Hai môi trường tách riêng compose project (`tami-staging` và `tami`), env file và postgres. Gate HIGH_RISK: tên file trong `/app/migrations` khớp `name` trong `migrations/index.ts` (vd `20261016_090115_init`), và Dockerfile:58 copy `/app/migrations`, nên gate chạy đúng. Gate fail-closed khi query lỗi. Production bị chặn và không có cờ bỏ qua. Comment trong `down()` có thể chặn nhầm, chấp nhận được. `--dry-run` không thực thi lệnh nào: chỉ có `printf`, cộng thêm việc đọc file state trong prune. OK.
- **Production dùng đúng digest:** lấy `needs.deploy-staging.outputs.digest` (chỉ được set khi bước deploy staging thành công), và server còn kiểm `staging.history`. Trường hợp duyệt muộn đã ghi trong runbook §7. OK, có MINOR-2.

## Findings

### [MAJOR-1] Thư mục deploy dùng chung cho cả 2 môi trường và cho mọi lần chạy, được upload NGOÀI khoá: production có thể chạy compose/config của một commit chưa được duyệt
- `.github/actions/ssh-deploy/action.yml:63-64` (`tar … | ssh "mkdir -p DIR && tar -xzf - -C DIR"`) ghi đè `/opt/tami/repo` (`deploy.yml:23,115,156`) **trước** khi `deploy.sh` lấy `flock` (deploy.sh:130-133). `deploy.sh` đọc `docker/docker-compose.{staging,prod}.yml` từ `REPO_DIR` mỗi lần gọi `compose` (deploy.sh:32,90,97,108).
- Job `deploy-staging` và `deploy-production` nằm ở 2 concurrency group khác nhau, nên chạy song song được. Kịch bản: production của run B (đã duyệt) upload file của B, rồi chờ lock. Trong lúc đó staging của run C upload file của C, ghi đè `docker/docker-compose.prod.yml`, `docker/postgres/*`, `docker/nginx/*`. Kết quả là production chạy image B với compose của C, tức là config production chưa qua duyệt (vượt Environment gate) và có thể không khớp image (biến env bắt buộc mới, service mới). Ngay cả khi không có race, mỗi lần deploy staging cũng để lại compose prod của commit chưa duyệt trên server, và lần rollback tay theo runbook §5 sẽ dùng file đó. Ngoài ra `tar -x` đè lên thư mục cũ nên file đã xoá trong repo vẫn còn trên server.
- **Fix đề xuất:** upload vào thư mục bất biến theo môi trường + SHA (vd `/opt/tami/releases/<env>/<sha>` với `<sha>` đã validate), extract vào thư mục tạm rồi đổi tên/symlink nguyên tử. Hoặc tối thiểu tách `/opt/tami/<env>/repo` và để bước upload + chạy nằm trong cùng flock (vd gọi `flock /opt/tami/state/deploy.lock` bao cả `tar -x` và `deploy.sh`). Thêm test hoặc ghi chú. Nếu đổi đường dẫn bind mount (`./postgres/init.sql`) thì ghi vào runbook rằng container postgres sẽ bị recreate một lần.

### [MAJOR-2] `compose up -d app jobs` lỗi thì thoát ngay vì `set -e`, KHÔNG rollback
- `scripts/deploy/deploy.sh:329`: `run compose up -d app jobs` nằm ngoài câu điều kiện. Nếu compose trả non-zero sau khi đã stop/recreate container cũ (vd start lỗi do xung đột cổng 3010/3011, lỗi tạo container, dependency unhealthy giữa chừng), script exit 1 mà không qua `rollback_to_previous`. Khi đó app/jobs có thể đang dừng hoặc ở image mới hỏng, trái AC "đổi container lỗi → quay về image trước" và trái runbook §5 (Rollback tự động).
- **Fix đề xuất:** gộp vào nhánh kiểm tra, vd `if run compose up -d app jobs && wait_for_health && jobs_running; then … fi` để mọi lỗi sau khi bắt đầu đổi container đều đi vào rollback. Đồng thời `rollback_to_previous` (deploy.sh:279-280) nên kiểm cả `jobs_running`. Thêm test: stub `compose`/`docker` (hàm bash) trả lỗi ở `up -d app jobs` và assert rollback được gọi.

### [MINOR-1] Action pin theo tag version, chưa pin SHA
- `.github/workflows/deploy.yml:43,52,54,64,99,138`. Job build có `packages: write` và chạy action bên thứ ba (`docker/*`), và chính job này tạo image chạy ở production. Tag có thể bị dời. Reviewer không xác minh được các tag `v4.2.2`, `v3.10.0`, `v3.4.0`, `v6.18.0` có tồn tại hay không vì lệnh mạng (`git ls-remote`) nằm ngoài quyền. Theo hiểu biết của reviewer thì cả 4 là bản phát hành có thật, nhưng chưa kiểm chứng. Đã ghi trong runbook §7 và Decision 4.
- **Fix đề xuất:** pin full commit SHA (kèm comment `# vX.Y.Z`) bằng `pinact`/Dependabot trước lần chạy thật ở layer-6-task-01. Có thể làm như follow-up có tracking.

### [MINOR-2] Không có chặn phía server khi production nhận digest CŨ hơn `production.current`
- `scripts/deploy/deploy.sh:234-242` chỉ kiểm digest có trong `staging.history`. Duyệt muộn một run cũ, hoặc rollback tay sai, có thể hạ production xuống code cũ chạy trên schema mới. Runbook §7 dựa vào việc GitHub huỷ bản chờ cũ. Đề xuất in cảnh báo hoặc yêu cầu cờ xác nhận khi vị trí của digest trong `staging.history` đứng trước digest của `production.current`.

### [MINOR-3] Container tạm có thể bị bỏ sót
- `scripts/deploy/deploy.sh:227-229`: nếu `docker cp` lỗi thì `set -e` thoát trước `docker rm "$cid"`. Đề xuất: `docker cp … || { docker rm "$cid" >/dev/null; die …; }`, hoặc ghi cid để `cleanup` xoá.

### [MINOR-4] `jobs_running` chỉ kiểm 1 lần ngay sau health
- `scripts/deploy/deploy.sh:267-270`: với `restart: unless-stopped`, một container đang crash-loop vẫn có thể ở trạng thái `running` đúng thời điểm kiểm. Đề xuất kiểm `RestartCount` không tăng sau vài giây, hoặc kiểm 2 lần cách nhau.

### [MINOR-5] Production pull image trước khi kiểm `staging.history`
- `scripts/deploy/deploy.sh:322-324`: nên gọi `require_staging_passed` trước `pull_image` để không kéo về image chưa qua staging. Rủi ro thấp vì image đó không được chạy.

### [MINOR-6] `scripts/deploy/deploy.sh` dài 356 dòng (> 300)
- Có thể tách phần gate HIGH_RISK (`list_applied_migrations`, `find_high_risk_pending`, `check_high_risk_gate`) ra `scripts/deploy/lib/high-risk-gate.sh` và source vào. Không chặn.

## Residual risk
- Chưa chạy thật trên server: behavior của compose khi recreate container, `psql` qua `docker exec` (auth local) và đăng nhập GHCR bằng `GITHUB_TOKEN` (package phải liên kết repo) chỉ kiểm được bằng đọc code. Lần chạy thật dự kiến ở layer-6-task-01.
- Chưa xác minh tag action có tồn tại (MINOR-1).
- Chưa xác minh cách GitHub xử lý concurrency khi job đang chờ duyệt Environment (runbook §7 mô tả là bản chờ cũ bị huỷ).

## Verdict
**FAIL**: còn 2 MAJOR (MAJOR-1: race/ghi đè thư mục deploy dùng chung ngoài khoá; MAJOR-2: lỗi `up -d app jobs` không rollback). MINOR-1..6 nên xử lý cùng vòng sửa hoặc tạo follow-up có tracking.
