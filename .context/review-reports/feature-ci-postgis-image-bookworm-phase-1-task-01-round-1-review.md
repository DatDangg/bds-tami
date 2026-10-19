Agent: reviewer

# Review — feature-ci-postgis-image-bookworm · phase-1-task-01 · round 1

- Review level: **NORMAL**
- Reason: chỉ đổi hạ tầng CI (`.github/workflows/ci.yml`) cho DB test dùng-rồi-bỏ. Không đụng auth/RBAC, schema/migration, dữ liệu thật, API contract hay code app. CI là cổng chặn deploy staging (`workflow_run`), nên mức FAST không đủ.
- Blast radius: job `verify` trong `.github/workflows/ci.yml` (CI đỏ thì deploy staging bị chặn qua `workflow_run` trong `deploy.yml`). Không ảnh hưởng runtime app, dev/staging/prod DB, `deploy.yml`, compose.

## Verify commands + result

| Lệnh | Kết quả |
|---|---|
| `git diff -- .github/workflows/ci.yml` | Đã review: bỏ `services.postgres` (postgis/postgis:17-3.5), thêm bước build + `docker run` + vòng chờ, bước kiểm phiên bản, bước log khi lỗi |
| Grep `.github/` tìm `postgis/postgis` hoặc `bullseye` | Không còn chỗ nào. `ci_only_password`/`127.0.0.1:5432` đồng nhất giữa `docker run` và env job |
| `sed -nE` (đúng regex trong ci.yml) chạy trên `docker/backup/Dockerfile` | `17.11` và `3.5.2`, không có ký tự thừa (đã kiểm bằng `od -c`) → regex khớp ARG hiện tại (`Dockerfile:16`, `:19`) |
| `git ls-files docker/backup` + `git status -- docker/` | Mọi file build context target `postgis` cần (`postgis/10_postgis.sh`, `postgis/update-postgis.sh`, `Dockerfile`) đều đã tracked và không bẩn, nên CI checkout có đủ |
| `bash -ec 'a=""; b=x; test -n "$a" && test -n "$b"; echo continued'` | In ra `continued` → xác nhận MINOR-1 bên dưới |
| Grep `docs/`, `README.md`, `SPECIFICATIONS.md`, `.context/project-config.md` tìm chỗ nói CI dùng image `postgis/postgis` | Không có. Các chỗ nhắc `postgis/postgis` (runbooks restore/postgres-base-image/deploy) nói về volume cũ, e2e hoặc thông báo của deploy guard, không nói về CI → xác nhận **no doc impact** |
| `pnpm lint` / `typecheck` / `test` / `build` | skip: không đổi code app (chỉ YAML CI) |
| Chạy lại mô phỏng docker | Không chạy lại. Chấp nhận evidence của builder (build + run cổng 55432 + init.sql + kiểm phiên bản + `payload migrate` 28 migration, có dọn dẹp) vì nhất quán với diff, và dừng ở đây để tránh đụng Docker dev |

## Điểm soát theo yêu cầu

- **Job env ở bước sớm:** `env:` cấp job áp cho mọi step kể cả step đầu, nên `$DATABASE_URL_TEST` dùng được ở bước build/run đặt trước pnpm/node. Bước này không phụ thuộc pnpm/node. OK.
- **Shell mặc định:** khi không khai `shell:`, GitHub chạy `bash -e {0}` (**không** có `pipefail`; `pipefail` chỉ có khi khai `shell: bash`). Không có pipe nào cần pipefail (pipe `ldd | head` nằm trong `docker exec sh -c` và chỉ để in). Vòng chờ `psql … && break` không bị `-e` cắt ngang. OK, ngoại trừ MINOR-1.
- **Vòng chờ initdb:** entrypoint official chạy server tạm với `listen_addresses=''` (chỉ socket), nên khi kết nối TCP từ host qua `127.0.0.1:5432` thành công thì server thật đã lên. 60×2s, rồi kiểm lại một lần ngoài vòng với `ON_ERROR_STOP` (fail rõ ràng). Đúng.
- **psql trên ubuntu-latest:** có sẵn (các bước cũ "Tạo extension", "Migrate" vốn đã dùng). Client 16 với server 17 vẫn chạy được cho `-c`/`-f`. OK.
- **BuildKit `COPY --chmod`:** Docker ≥ 23 trên ubuntu-latest dùng BuildKit/buildx làm builder mặc định, frontend Dockerfile hỗ trợ `--chmod` ổn định. Staging/dev đã build cùng Dockerfile. OK, còn residual risk vì chưa chạy trên runner thật.
- **Bind cổng `127.0.0.1:5432`:** dịch vụ PostgreSQL cài sẵn trên runner mặc định không chạy. Service cũ cũng chiếm 5432. OK.
- **Log khi lỗi:** `if: failure()` + `|| true`, đặt sau Test và trước log SeaweedFS. Lỗi ở các bước từ build tới test đều in log. OK.
- **Thứ tự kiểm phiên bản:** đặt sau init.sql nên `postgis_lib_version()` chắc chắn có extension. `server_version` tách bằng `split_part` cho ra `17.11`. OK.

## Skill gates

| Gate | Kết quả |
|---|---|
| aislop | N/A: diff không có source code (chỉ YAML CI) |
| oxlint (anti-slop) | N/A: không đụng TS/JS |
| ocr (open-code-review) | skip, ocr not installed / không chạy cho diff YAML |
| AI-readable | OK: tên bước/container rõ ràng, comment giải thích WHY (vì sao không dùng `services:`, vì sao chờ qua TCP), không có magic number đáng kể (60×2s đúng mẫu SeaweedFS). 0 indicator |
| ai-friendly-web | N/A: không phải task public-facing |
| blitzstrike | N/A: không phải STRICT |
| Responsive Checklist Gate | N/A: diff không đụng UI |
| Migration safety | N/A: không đổi migration/schema; DB CI dùng rồi bỏ |

## Findings

**[CRITICAL]** không có.

**[MAJOR]** không có.

**[MINOR-1]** `.github/workflows/ci.yml:96`: `test -n "$pg_expected" && test -n "$postgis_expected"` không fail-fast khi `pg_expected` rỗng. Dưới `bash -e`, lệnh lỗi đứng **trước** `&&` không làm shell thoát (đã chứng minh bằng lệnh ở trên); chỉ vế cuối (`postgis_expected`) có hiệu lực. Hậu quả thực tế vẫn **fail-closed**: `pg_actual` không rỗng (psql lỗi thì phép gán `$(…)` đã làm `-e` thoát), nên so với chuỗi rỗng sẽ lệch và `exit 1`. Chỉ có thông báo lỗi gây hiểu nhầm ("PostgreSQL lệch Dockerfile" thay vì "regex ARG gãy"). Cách sửa đề xuất: tách thành 2 dòng `test -n "$pg_expected"` và `test -n "$postgis_expected"`, hoặc `[ -n "$pg_expected" ] && [ -n "$postgis_expected" ] || { echo "không đọc được ARG phiên bản từ Dockerfile"; exit 1; }`. Không chặn PASS.

**[MINOR-2]** (residual, không phải lỗi) Bước build image không có cache nên mỗi lần CI phụ thuộc mạng tới Docker Hub (base ghim digest) và `apt-archive.postgresql.org`; thời gian job tăng khoảng 1–2 phút trong `timeout-minutes: 20`. Đây là lựa chọn có chủ đích (quyết định 1 và 3, không thêm action bên thứ ba). Theo dõi thời lượng job sau lần chạy thật đầu tiên. Không cần sửa.

## Residual risk

- Chưa chạy trên runner GitHub thật (reviewer không có môi trường Actions). Các điểm cần xác nhận ở lần chạy đầu: build không cache thành công trên ubuntu-latest, vòng chờ, log phiên bản (`bookworm`, `2.36`, `17.11`, `3.5.2`), `pnpm test` xanh.
- Reviewer không tự chạy lại mô phỏng Docker; dựa vào evidence của builder trong Verification summary của task file.

## Verdict

✅ **PASS**: không có CRITICAL/MAJOR. Acceptance của task đã đáp ứng (không còn `postgis/postgis`/bullseye trong CI; DB test được build từ `docker/backup/Dockerfile` target `postgis`; env/cổng không đổi; no doc impact đã xác nhận bằng grep). MINOR-1 có thể sửa kèm hoặc ở task sau.
