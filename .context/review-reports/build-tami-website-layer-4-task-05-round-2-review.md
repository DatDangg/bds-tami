Agent: reviewer

# Review — build/tami-website · layer-4-task-05 (CD: GHCR + SSH deploy) · round 2

- **Review level:** STRICT
- **Reason:** CD pipeline cho production gồm migration DB, rollback, xử lý secret/token/SSH host key, xoá file trên server (prune release + image) và gate cho production (HIGH_RISK_MIGRATION, ghim digest). Đây là các vùng rủi ro đỏ: DB/migration, destructive, security/token, shared infra.
- **Diff:** working tree so với HEAD `0e4f3f7`. File mới: `.github/workflows/deploy.yml`, `.github/actions/ssh-deploy/action.yml`, `scripts/deploy/{deploy.sh,deploy.test.sh}`, `scripts/deploy/lib/{high-risk-gate,state,release}.sh`, `docs/runbooks/deploy.md`. File sửa: `docs/ARCHITECTURE.md` §6.4, `.context/decisions.md`, `.context/progress.json`, task file.
- **Blast radius:** server dùng chung `/opt/tami` (releases/state/lock), các stack compose `tami` và `tami-staging` (app, jobs, migrate, postgres, redis, seaweedfs), image GHCR `ghcr.io/<repo>`, GitHub Environments `staging`/`production`. Không đụng code app/API/schema. Theo phân tích bên dưới, dữ liệu DB/S3/redis nằm trong named volume nên prune/rollback không làm mất dữ liệu.

## Verify commands + result (reviewer tự chạy)
| Lệnh | Kết quả |
|---|---|
| `docker run --rm -v "$PWD:/repo" -w /repo rhysd/actionlint:1.7.7` | PASS (exit 0) |
| `docker run --rm -v "$PWD:/mnt" -w /mnt koalaman/shellcheck:stable scripts/deploy/*.sh scripts/deploy/lib/*.sh` | PASS (exit 0) |
| `docker run --rm -v "$PWD:/w" -w /w node:22-bookworm bash scripts/deploy/deploy.test.sh` | PASS: "Tất cả test PASS" (Linux, có cả nhóm test symlink) |
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS: 77 file, 827 test |
| `pnpm build` / `pnpm install` | không chạy lại vì diff không đụng TS/deps. Đã đối chiếu với kết quả PASS của builder |
| SHA pin của action (`git ls-remote`) | **skip**: `git ls-remote` không nằm trong danh sách lệnh reviewer được chạy. Bốn cặp SHA↔tag (checkout v4.2.2 `11bd7190…`, setup-buildx v3.10.0 `b5ca5143…`, login v3.4.0 `74a5d142…`, build-push v6.18.0 `26343531…`) khớp với những gì reviewer biết về các tag upstream, nhưng chưa kiểm bằng lệnh. Xem Residual risk |

Container tạm đều chạy với `--rm`, không để lại container nào.

## Xác minh các finding của round 1

### MAJOR-1 (compose chưa duyệt chạy trên production) — ĐÃ ĐÓNG
- `action.yml:76-85`: giải nén vào `mktemp -d "$d/.incoming.XXXXXX"` (cùng thư mục cha), rồi `mv -T` sang `<sha>` **chỉ khi chưa tồn tại**. Nếu tar lỗi thì `set -e` thoát trước `mv`, và trap xoá thư mục tạm. Nếu hai lần upload cùng SHA chạy song song, lần thua có `mv` lỗi nhưng được nhánh `|| [ -d ]` cho qua. Release của SHA hoặc môi trường khác không bị ghi đè. Trong workflow không còn đường nào ghi lại vào một `<sha>` đã có.
- **Race giữa upload và deploy:** mỗi SHA có thư mục riêng, nên upload commit B trong lúc commit A đang giữ flock không thay đổi file mà A đang dùng. Biến `current` chỉ được đổi trong flock (`release.sh:26-34`, cách đổi nguyên tử bằng `ln -sfn` cộng `mv -T`).
- Production chạy đúng compose đã duyệt: job production checkout `head_sha`, upload vào `releases/production/<sha>`, rồi chạy script của chính release đó (`action.yml:104-105`). `check_release_layout` (`release.sh:20-23`) từ chối nếu script nằm sai `releases/<env>/<sha>`. `require_staging_passed` (`release.sh:82`) bắt buộc phải có **đúng cặp** digest và SHA trong `staging.history`. Test: release layout, SHA lệch digest, digest chưa qua staging, digest cũ hơn, `--allow-older` đều PASS.
- **Rollback dùng compose của release trước:** `rollback_to_previous` gọi `restore_release_link` trước, rồi mới `compose up` image cũ (`deploy.sh:233-235`). Test "trả current về release trước rồi mới up image cũ" PASS. Lưu ý về đường dẫn: xem MINOR-1.

### MAJOR-2 (`compose up` lỗi không rollback) — ĐÃ ĐÓNG
- `switch_app_and_jobs` (`deploy.sh:239-241`) nằm trong `if` (`deploy.sh:254`). Nếu `compose up` trả non-zero thì chuỗi `&&` dừng lại và luồng đi vào rollback.
- Rollback gồm: restore link, `up`, health, jobs. Rollback thành công thì `die` với exit **1**. Rollback lỗi, hoặc không có image trước, thì exit **3** (`deploy.sh:263-265`).
- `cleanup` trên trap EXIT gọi `restore_release_link` theo kiểu idempotent cho mọi lần thoát chưa `DEPLOY_OK`, kể cả khi `die` ở bước gate, migrate hoặc pull. Trap không gọi `exit`, nên mã thoát được giữ nguyên. Các test "compose up lỗi → exit 1", "rollback lỗi → exit 3", "jobs không ổn → rollback" đều PASS.

### MINOR-1..6 của round 1 — đã xử lý
Pin action theo SHA. Có cờ `--allow-older`, chỉ dùng khi chạy tay. Luôn `docker rm -f` container tạm (có test). Kiểm jobs ổn định 3 lần, cách 5s, so sánh `RestartCount`. Kiểm `staging.history` **trước** pull (`deploy.sh:246`). Tách `lib/*.sh`, `deploy.sh` còn 284 dòng. Các chỗ `shellcheck disable` đều có comment lý do.

## Đánh giá rủi ro mất dữ liệu (symlink, project, volume)
- Cả hai compose khai báo `name:` tường minh (`docker-compose.prod.yml:16` là `name: tami`, `docker-compose.staging.yml:16` là `name: tami-staging`). Vì vậy **project name không phụ thuộc đường dẫn** compose file hay symlink, và đổi release hay rollback không làm compose coi đây là project khác.
- Dữ liệu `postgres-data`, `redis-data`, `seaweedfs-data` là **named volume** (`:215-218`), tên đầy đủ là `<project>_<vol>`. Volume không bind theo đường dẫn tương đối, nên prune hay xoá release **không chạm dữ liệu**. Ngay cả khi postgres bị tạo lại, volume vẫn được gắn lại. **Không có rủi ro mất dữ liệu.**
- Bind theo đường dẫn tương đối duy nhất là `./postgres/init.sql` (read-only, chỉ chạy lúc khởi tạo DB lần đầu, `:135`). Rủi ro ở đây là về **tính sẵn sàng**, không phải dữ liệu. Chi tiết ở MINOR-1 và MINOR-2.

## Regression đã soát
- **Prune xoá release `current` của môi trường khác?** Không. `prune_old_releases` chỉ duyệt `releases/<env>` của môi trường đang deploy (`release.sh:54`), chỉ xoá tên khớp 40 hex, và luôn giữ release mà `current` của môi trường đó trỏ tới. Symlink `current` và thư mục ẩn `.incoming.*` không bị liệt kê hoặc bị bỏ qua.
- **Parse `staging.history`:** dòng mới có dạng `<digest> <ts> <sha>`; awk so `$1` với `$3`. Dòng theo format cũ không có `$3` sẽ bị coi là chưa qua staging (fail-closed, an toàn). `history_line_of` dùng `grep "^digest "` và chuỗi `sha256:<hex>` không có ký tự regex đặc biệt. Kết quả: OK.
- Mã thoát, trap, việc token đi qua stdin, `StrictHostKeyChecking=yes`, DOCKER_CONFIG tạm: không có regression so với round 1.

## Responsive Checklist Gate
N/A: diff không đụng UI (chỉ CI/CD, shell, docs).

## Skill gates
| Gate | Kết quả |
|---|---|
| aislop | skip: `aislop` không nằm trong lệnh reviewer được phép chạy, và diff không có code TS/JS |
| oxlint (anti-slop) | N/A: diff không đụng TS/JS. Bash/YAML được kiểm bằng shellcheck và actionlint, cả hai PASS |
| ocr (open-code-review) | skip, ocr not installed / không trong lệnh được phép |
| AI-readable | OK: tên hàm rõ nghĩa (`activate_release`, `restore_release_link`, `require_staging_passed`…), hàm đều dưới 50 dòng, indirection không quá 2 bước, hằng số đặt tên qua env (`HEALTH_RETRIES`, `RELEASES_KEEP`…), comment nói WHY. ARCHITECTURE §6.4 và runbook đã cập nhật. `deploy.test.sh` 302 dòng, hơi vượt 300 nhưng là file test, ghi nhận và không tính indicator. Tổng 0 indicator |
| ai-friendly-web | N/A: không phải thay đổi web public |
| blitzstrike | skip: không có môi trường được phép (cấm deploy/SSH thật) |

## Findings

**[CRITICAL]**: không có.

**[MAJOR]**: không có.

**[MINOR-1] Rollback đặt compose file theo đường dẫn thật thay vì qua symlink `current`.** `scripts/deploy/lib/release.sh:48`
`restore_release_link` gán `COMPOSE_FILE="${PREVIOUS_RELEASE:-$REPO_DIR}/docker/$COMPOSE_NAME"`, trong khi `activate_release` (`:33`) dùng `$link/docker/...`. Nếu Compose không resolve symlink, bind source của postgres sẽ khác nhau giữa lúc deploy (`current/docker/postgres/init.sql`) và lúc rollback (`<prev>/docker/...`). Khi đó `compose up -d app jobs` sẽ tạo lại cả dependency postgres (deps cũng recreate khi config diverged), tức là DB khởi động lại đúng lúc đang rollback, và lần deploy sau lại tạo lại thêm lần nữa. Điều này cũng trái với comment thiết kế "bind mount ổn định".
Fix: khi `PREVIOUS_RELEASE` khác rỗng thì đặt `COMPOSE_FILE="$link/docker/$COMPOSE_NAME"`, và thêm 1 assert trong `deploy.test.sh`.

**[MINOR-2] Chưa xác minh được Compose có resolve symlink cho bind `./postgres/init.sql` hay không.** `docker/docker-compose.{prod,staging}.yml:135`, `release.sh:8-9`
compose-go có thể EvalSymlinks đường dẫn bind. Nếu đúng vậy:
- (a) postgres bị tạo lại ở mỗi lần đổi release, gây vài giây mất DB cho app cũ trước bước migrate. Runbook §7 đã ghi nhận điều này.
- (b) Nếu một deploy fail **sau** `up postgres` nhưng **trước** khi switch, postgres vẫn bind vào release không phải `current`. Khi release đó bị prune sau ≥5 lần deploy, postgres sẽ không restart được, ví dụ sau khi reboot host, vì bind source mất. Xác suất thấp.

Đề xuất, có thể làm ở layer-6-task-01 khi chạy thật: bỏ hẳn sự phụ thuộc vào đường dẫn release cho init.sql. Ví dụ copy vào đường dẫn ổn định `$TAMI_ROOT/<env>/postgres-init.sql` trong flock, hoặc dùng `configs:` với `content:`. Không có rủi ro mất dữ liệu (named volume).

**[MINOR-3] Release đang chờ khoá có thể bị prune.** `release.sh:52-66`
Nếu có hơn 5 release mới hơn được deploy trong lúc một lần chạy tay đang chờ flock, `compose config` sẽ fail và lần chạy đó dừng (fail-safe, cleanup restore). Trong pipeline gần như không xảy ra vì concurrency được chia theo môi trường. Chỉ ghi nhận, không cần sửa.

**[MINOR-4, ngoài scope]** `.github/workflows/ci.yml` vẫn dùng tag `@v4` thay vì SHA. Không nằm trong diff, đề xuất tách thành task riêng (Dependabot đã có).

## Residual risk
- SHA pin của 4 action chưa được kiểm bằng `git ls-remote` (không có quyền). Chỉ khớp theo hiểu biết của reviewer, nên kiểm bằng lệnh ở bước DevOps.
- Hành vi Compose với symlink (MINOR-2), luồng SSH/upload thật và rollback thật chưa chạy trên server. Phần này đã được dời sang layer-6-task-01, đúng như ghi trong runbook §7.
- Required reviewers của GitHub Environment `production` phải được cấu hình tay trên GitHub (runbook 2.2).

## Verdict
**PASS**: không còn CRITICAL hoặc MAJOR. MAJOR-1 và MAJOR-2 của round 1 đã đóng, có test và lint xác minh độc lập. Nên sửa MINOR-1 (1 dòng) trước khi chạy thật ở layer-6-task-01 nếu thuận tiện.
