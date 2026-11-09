Agent: spec-validator

# Spec validation — feature-production-new-server-tamihomes (BL-112), phase 4 + toàn change — round 1

- Mode: **Phase review (phase cuối) + close-out toàn change**
- Ngày: 2026-11-09 (~04:50Z)
- Nguồn: change doc `spec/changes/2026-11-06-production-new-server-tamihomes.md` (Acceptance 5 mục, Phải làm 1–8), `tasks/feature-production-new-server-tamihomes/README.md` (Q1–Q5), task `phase-1..4-*.md`, 9 review report `feature-production-new-server-tamihomes-*`, commit 884e0ae2 ad9f6581 1dab6943 4ede6ce4 ec340561 e80b2e14 986a4594, working tree P4.T02 (`docs/runbooks/deploy.md`, `docs/runbooks/restore.md`, `.context/project-config.md`, `.context/decisions.md`, `SPECIFICATIONS.md`, `spec/updates/2026-11-09-production-new-server-tamihomes.md`, `spec/CHANGELOG.md`, `spec/test-scope/current.json`, `spec/changes/BACKLOG.md`), phần BL-112 của `docs/ARCHITECTURE.md` (scratchpad `arch-bl112.diff`), `.context/progress.json`.

## Verdict: ❌ FAIL — GAPS FOUND (close-out chưa đủ; hạ tầng đạt)

Hạ tầng production đã chạy đúng spec. Acceptance 1, 3, 4 có bằng chứng; curl live hôm nay cũng khớp.
FAIL do close-out: thiếu 1 mục (❌, backlog Turnstile theo Q5), 3 mục ⚠️ (bằng chứng gate sau push, SPECIFICATIONS còn nhắc job đã gỡ, P4.T02 thiếu Evidence/review) và 1 conflict MEDIUM (BACKLOG có dòng lỗi không thuộc BL-112).
Cả 5 gap đều là tài liệu/backlog/bằng chứng, không cần chạm server.

## Kiểm live (chỉ đọc, 2026-11-09 04:49Z)
| Lệnh | Kết quả |
|---|---|
| `curl -sI https://tamihomes.vn/` | `200`, nginx 1.28.3, `Strict-Transport-Security: max-age=31536000`, **không** `X-Robots-Tag` |
| `curl -sI https://www.tamihomes.vn/` | `301 Location: https://tamihomes.vn/` |
| `curl -sI https://tami.genieplatform.cloud/du-an` | `301 Location: https://tamihomes.vn/du-an` (giữ path; nginx 1.24 server cũ vẫn phục vụ 301 sau khi dừng stack) |

## Ma trận Acceptance (change doc §Acceptance)
| # | Requirement | Evidence | Status | Note |
|---|---|---|---|---|
| A1 | `https://tamihomes.vn` HTTPS hợp lệ, chạy trên 179.197.242.57, dữ liệu prod đủ (đếm khớp) | P3.T01 Evidence: 149 bảng `count(*)` IDENTICAL, 43 migration, 7 ext, bucket 1595 chunk / 257 871 920 B khớp (`phase-3-task-01.md:62-73`); reviewer STRICT tự đếm lại (`…phase-3-task-01-round-1-review.md`); P3.T02 #1 cert LE SAN apex+www, hạn 2027-02-04 (`phase-3-task-02.md:31`); curl live 200 + HSTS | ✅ | Residual: chưa đăng nhập admin, chưa tải CV private (bucket private = 0 object nên không mất dữ liệu) |
| A2 | Deploy prod qua CI vào server mới, health PASS, gate "chỉ nhận bản đã qua staging" vẫn đúng | P2.T02: run 42183151702 (b75ff984) success, `production.current` = digest image chạy, health 200 (`phase-2-task-02.md:61`); P4.T01: job `record-staging-pass` gỡ, `action.yml`/`deploy.yml` byte-identical `fd524e26~1`, `staging.history` tail = `production.current` (`phase-4-task-01.md:35-37`); 986a4594 đã có trên `origin/staging` | ⚠️ PARTIAL | Bằng chứng sau push **chưa ghi**: run Deploy chỉ còn `build` + `deploy-staging`, dòng mới `staging.history`, `deploy.sh production --dry-run` từ chối SHA chưa qua staging (`phase-4-task-01.md:38`, review r2 Residual, `progress.json:3596` `awaiting_push_verify`) |
| A3 | Backup prod chạy + restore thử PASS trên server mới | P2.T03: stanza `/tami-prod-s2`, full + restic, drill pgBackRest 240 s (149 bảng IDENTICAL) + restic 1593 file (`phase-2-task-03.md:36-45`), STRICT PASS r2; P3.T02 #11: full `20261106-153347F` sau cắt chuyển, `OK wal`, prom `last_run_ok`=1 (`phase-3-task-02.md:41`) | ✅ | Residual: drill chạy trên bản thử (trước cắt chuyển); chưa drill PITR; restic chỉ so sha 300/1593 file |
| A4 | Rate limit lấy đúng IP thật; robots/sitemap/canonical dùng tamihomes.vn | P3.T02 #3–#5, #10 (`phase-3-task-02.md:33-40`): robots `Sitemap: https://tamihomes.vn/sitemap.xml`, sitemap/canonical/og/hreflang 0 domain khác; nginx `$remote_addr` = IP thật; app 0 cảnh báo IP | ✅ | IP thật ở tầng app chỉ có bằng chứng gián tiếp (không gửi form). Đã ghi Residual 3 |
| A5 | Runbook / ARCHITECTURE / project-config / decisions cập nhật | Working tree: deploy.md §9/§10 lịch sử, §12 as-built, §12.1c, §12.2 rollback sau P4; restore.md as-built `-s2`; ARCHITECTURE §6 (working tree dòng 393, 400, 421, 435-436, 450, 460, 499); project-config `deploy_platform`; decisions Decision 13 | ⚠️ PARTIAL | Đủ 4 tài liệu nêu tên. Nhưng `SPECIFICATIONS.md` (as-built Deployment) vẫn nói cổng giữ bằng "job `record-staging-pass`", trong khi BL-112 đã gỡ job này. Xem G3 |

## Ma trận "Phải làm" + quyết định Q1–Q5
| Mục | Evidence | Status |
|---|---|---|
| 1 DNS A apex + www | README hiện trạng (`README.md:22`); curl live | ✅ |
| 2 Compose `tami-prod-*` 127.0.0.1:3010, vhost + www 301, HSTS dài, không noindex, chặn `/api/metrics` `/api/internal/` | 884e0ae2 (vhost, compose 1g/256MB); P3.T02 #1, #2, #7 | ✅ |
| 3 Backup prod + diễn tập | = A3 | ✅ |
| 4 Chuyển dữ liệu, đếm đối chiếu, downtime | P3.T01 (downtime thực tế cũ ~5m22s, mới ~4m12s) | ✅ |
| 5 `production.env` SITE_URL, Turnstile hostname, SMTP giữ nguyên | P2.T01 (`progress.json:3550` chỉ đổi `NEXT_PUBLIC_SITE_URL`); Turnstile theo Q5 giữ test key | ✅ (Turnstile = Q5, xem G1) |
| 6 Secret Environment `production` → server mới; gate staging.history; gỡ/chỉnh `record-staging-pass` | P2.T02 secrets 07:47Z, fingerprint khớp; P4.T01 | ⚠️ (= A2) |
| 7 / Q2 Tên miền cũ 301 | P3.T01 bước 6; curl live 301 giữ path | ✅ |
| 8 Dừng prod + staging cũ, không xoá dữ liệu | deploy.md §12.1c (working tree): `docker stop` 04:42:55–04:43:22Z, `restart=no` 13 container, gỡ symlink 443 `tami-staging-sslip.conf`, giữ 301 + cổng 80, 9 volume còn, certbot dry-run PASS; curl live 301 OK | ⚠️ PARTIAL. Bằng chứng chỉ có trong runbook; task file P4.T02 chưa có Evidence (G4). Validator không SSH được nên trạng thái container/volume là Residual |
| Q1 www 301 apex | curl live | ✅ |
| Q3 cắt chuyển ngay sau P2 | P3.T01 08:28Z | ✅ |
| Q4 R2 path `-s2`, kho cũ giữ ≥ 30 ngày | restore.md as-built; deploy.md §12.1c; Decision 13 | ✅ |
| Q5 Turnstile test key + SMTP giả giữ, **tách backlog riêng ở close-out** | SMTP: BL-095 (`BACKLOG.md:105`, blocked, ghi rõ `smtp.invalid` "ở cả staging + prod"); BL-106 phụ thuộc SMTP. **Turnstile prod test key: không có dòng backlog nào.** Grep `Turnstile` trong `spec/changes/*.md` chỉ ra chính change doc BL-112 | ❌ MISSING (G1) |

## Gap list
1. **[MISSING] G1: chưa có backlog Turnstile prod test key (Q5).**
   - Liên quan: README Q5, P4.T02 bước 4, Decision 13, spec/updates §Ảnh hưởng, test-scope `testNotes`.
   - Bốn tài liệu trên đều viết "backlog riêng", nhưng `spec/changes/BACKLOG.md` chưa có dòng nào, và cũng chưa có change doc `spec/changes/YYYY-MM-DD-*.md` cho Turnstile.
   - Production đang dùng Turnstile key `1x00…` (luôn pass), nên các form công khai thực tế không có chống bot.
   - Cần làm: tạo dòng BL mới + change doc pending, nêu rõ key thật cho hostname `tamihomes.vn` (và staging sslip `179-197-242-57`, residual từ BL-111 ở `progress.json:3515`).
   - SMTP đã có BL-095. Có thể ghi thêm 1 câu vào BL-095 rằng prod nay là `tamihomes.vn`, hoặc trỏ dòng mới về BL-095.
2. **[PARTIAL] G2: thiếu bằng chứng gate sau push (A2, P4.T01).**
   - Liên quan: `phase-4-task-01.md:38`, `progress.json:3596`.
   - Cần ghi vào Evidence của task:
     - run Deploy sau push 986a4594: id run, chỉ có `build` + `deploy-staging`, cả hai xanh;
     - `tail -1 /opt/tami/state/staging.history` có SHA mới;
     - `deploy.sh production --dry-run <SHA chưa qua staging>` bị từ chối.
   - Sau đó tick Acceptance `phase-4-task-01.md:24` và chuyển status sang `done`.
3. **[PARTIAL] G3: SPECIFICATIONS.md còn nhắc job đã gỡ.**
   - Liên quan: MINOR từ review P4.T01 r1, mà r2 ghi "DEFERRED, spec-publisher ở P4.T02".
   - Bullet BL-111 (`SPECIFICATIONS.md` ~dòng 354) vẫn viết: "Cổng … giữ được khi 2 server tách nhau (job `record-staging-pass`)".
   - Bullet BL-112 (~355) và `spec/updates/2026-11-09-…md` không nói job đã gỡ, cũng không nói gate nay dựa vào `staging.history` chung một máy.
   - Cần làm: thêm 1 câu vào bullet BL-112 và vào delta spec/updates.
4. **[PARTIAL] G4: P4.T02 chưa có Evidence, Decision log, review.**
   - Liên quan: `phase-4-task-02.md:4` vẫn `pending` và chưa có phần Evidence/Decision log. Theo AGENTS, task file là nguồn sự thật cho evidence; hiện số liệu thao tác server cũ chỉ nằm ở deploy.md §12.1c.
   - Task ghi "Review: NORMAL" (`:7`) nhưng chưa có `feature-production-new-server-tamihomes-phase-4-task-02-round-1-review.md`.
   - `progress.json` chưa có entry P4.T02, `activeWorkItem.phaseTask` vẫn `phase-3-task-02`, `currentPhase` vẫn 3.
   - Cần làm: chép Evidence từ §12.1c vào task, chạy reviewer NORMAL, cập nhật progress, tick Acceptance trước commit.

## Conflict list
| # | Mức | Conflict | Nguồn | Đề xuất |
|---|---|---|---|---|
| C1 | MEDIUM | `spec/changes/BACKLOG.md` working tree có sửa **không thuộc BL-112**, trông như một lệnh thay hàng loạt `pending` → `in-progress — đã điều tra, chờ duyệt phase plan (2026-11-05)`. **Dòng BL-013 (done) bị hỏng chữ**: "hasEnglish=false + in-progress — đã điều tra, chờ duyệt phase plan (2026-11-05)_review" (gốc `pending_review`). BL-059 / BL-068 / BL-070 cũng đổi trạng thái | `git diff -- spec/changes/BACKLOG.md` hunk @@-20, @@-66, @@-75 | Close-out BL-112 chỉ stage hunk BL-112 (+ BL-106 nếu đúng ý); **không commit** dòng BL-013 hỏng. Báo primary/user để khôi phục BL-013 và xác nhận BL-059/068/070 |
| C2 | LOW | HEAD `BACKLOG.md` **không có dòng BL-112** (dòng chỉ có ở working tree, status `in-progress`) | `git show HEAD:spec/changes/BACKLOG.md` | Close-out ghi BL-112 `done` + đường dẫn archive change doc |
| C3 | LOW | Phần ARCHITECTURE sẽ commit cho BL-112 (`arch-bl112.diff` áp lên HEAD) giữ tổng "≈ 7,5GB". Với prod 3,1 + staging 2,3 + giám sát 1 thì tổng chỉ ≈ 6,4 GB. Bản working tree (dòng 421) đã viết đúng | `arch-bl112.diff:40` | Sửa con số trong hunk commit, hoặc bỏ cụm "≈ 7,5GB" |
| C4 | LOW | Không khớp về trigger và mốc giờ: `spec/updates` ghi `Trigger: feature-update`, còn `current.json` ghi `"trigger": "change-request"`. `generatedAt` `2026-11-09T06:00:00.000Z` muộn hơn giờ hiện tại (~04:50Z). `current.json` bỏ trường `reviewReport` | `spec/test-scope/current.json`, `spec/updates/2026-11-09-production-new-server-tamihomes.md:4` | Thống nhất trigger, đặt `generatedAt` thật, thêm `reviewReport` (các report BL-112 + report này) |
| C5 | INFO (ngoài scope, có từ trước) | Phần intent của SPECIFICATIONS vẫn ghi "Cloudflare phía trước; server chỉ nhận traffic từ IP Cloudflare". ARCHITECTURE bảng env vẫn ghi prod "Email: Gửi thật". As-built thì không Cloudflare (quyết định user 2026-10-23) và SMTP giả | `SPECIFICATIONS.md` ~356; ARCHITECTURE bảng môi trường | Không sửa intent (AGENTS). Ghi nhận; đã có BL-095 cho email |

## Residual risk (không chặn sau khi gap được đóng)
- Validator không được SSH, nên trạng thái server cũ (container dừng, 9 volume, `restart=no`) dựa trên bằng chứng builder ở deploy.md §12.1c. Curl live xác nhận 301 vẫn chạy.
- Đăng nhập admin, tải CV private, và một lần gửi form thật để thấy IP thật ở rate limit: chưa kiểm (giao user).
- RAM/swap 24h: mới có 1 điểm đọc (P3.T02). Host 7.7 GB chạy chung staging, prod và dự án khác.
- Kho R2 cũ `/tami-prod` + `tami-prod-files`: giữ ≥ 30 ngày từ 2026-11-06, cần nhắc user quyết sau 2026-12-06.
- `https://187-52-119-50.sslip.io` nay rơi vào site 443 mặc định của dự án khác (cert lệch). Đã ghi trong §12.1c và Decision 13.

## Kết luận cho change-request
Hạ tầng BL-112 đạt (A1, A3, A4 ✅; A2, A5 gần đủ). Trước commit close-out cần đóng G1–G4 và xử lý C1 (bắt buộc), C2–C4 (nên). Sau đó chạy lại spec-validator round 2: chỉ kiểm phần tài liệu, không cần chạm server.
