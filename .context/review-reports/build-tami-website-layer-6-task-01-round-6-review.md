Agent: reviewer

# Review: build/tami-website · layer-6-task-01 · phần B (server + close-out) · round 6

- Review level: **NORMAL**
- Reason: diff round 6 chỉ đổi tài liệu (Feature Verification L6-T01, follow-up L12/L15, runbook §9 bước 12, run journal). Không đổi code, schema hay API. Code deploy đã qua STRICT ở round 4. Việc chính là đối chiếu AC với chứng cứ và nơi nhận.
- Blast radius: `tasks/tami-website/layer-6-task-01.md` (đóng task), `tasks/tami-website/layer-12-task-01.md` và `layer-15-task-01.md` (nơi nhận mục hoãn trước M3/M5), `docs/runbooks/deploy.md` (người vận hành làm theo), `.context/runs/build-tami-website-layer-6-task-01.md`.

## Verify commands + result
- `bash scripts/deploy/deploy.test.sh` → **Tất cả test PASS**.
- `git diff` (5 file, +48/-14, chỉ `.md`), `git log -6 --format='%h %cI %s'`.
- `pnpm lint/typecheck/test/build`: skip vì không đổi code (phần A đã PASS: 141 file, 1.538 test).
- Không ssh server (theo chỉ dẫn). Evidence server lấy từ task file và journal.

## Đóng finding round 5

| Finding r5 | Trạng thái | Chứng cứ |
|---|---|---|
| MAJOR-1.1 pháp lý L62 | Đóng | L6:90 nêu lý do (seed draft, admin publish). L12:122 nhận và kiểm `/chinh-sach-bao-mat` |
| MAJOR-1.2 G17 hotline | Đóng | L6:89 phần code Done (Dockerfile:40-42, deploy.yml:75), var chưa đặt. L12:121 nhận |
| MAJOR-1.3 G18 GlitchTip sourcemap | Đóng | L6:91 Hoãn → L12. L12:123 nhận |
| MAJOR-1.4 nginx chỉ IP Cloudflare L58 | Đóng | L6:91 có trong nhóm Cloudflare. L15:177 nhận riêng |
| MAJOR-1.5 postgres không recreate L50 | Đóng (Done) | L6:88. Đã kiểm với code: mỗi lần deploy đều chạy `compose up -d postgres redis seaweedfs` (`scripts/deploy/deploy.sh:241,272`). Nếu Compose resolve symlink `current` cho bind `init.sql` thì đường dẫn nguồn đổi theo release và postgres phải bị tạo lại. Postgres Created 06:25:55Z, app Created 06:53:48Z (sau commit b936204 lúc 06:37:23Z) cho thấy không tạo lại. Chứng cứ hợp lệ |
| MAJOR-1.6 backup L49 sai nơi nhận | Đóng | L6:91 → L15. L15:178 chép đủ: BACKUP_ENV_DIR, stanza-create, restic init, digest + ldd, HEARTBEAT_URL_WAL, MINOR-A `ARG POSTGIS_IMAGE` |
| MINOR-1 runbook bước 12 phải qua CI, không migration | Đóng | `docs/runbooks/deploy.md:265-266`. Câu "rollback dùng chung `ENV_FILE`" vẫn đúng với code (`deploy.sh:125-127, 284-286`) |
| MINOR-2 budget.ts production | Đóng | L6:91 → L15. L15:179 nhận |
| MINOR-3 approvals | Đóng | journal `approvals` có `rollback_drill_defer` |

## Đối chiếu lại toàn bộ AC (dòng 46-62) và follow-up (127-142)

| Mục | Trạng thái | Chứng cứ / nơi nhận |
|---|---|---|
| L47 siteName, ValidationError, seed-sample chặn prod | Done | phần A r4, L6:85 |
| L48 G10 báo động staging | Quyết định → L12 | L6:91. L12:56 có Uptime Kuma + cảnh báo thử |
| L48 budget.ts production | → L15 | L15:179 |
| L49 backup | → L15 | L15:178 |
| L50 rollback qua `current` + assert | Done | phần A r4, deploy.test.sh PASS |
| L50 postgres không recreate | Done | L6:88 (đã kiểm ở trên) |
| L50 required reviewers, nhánh mặc định, secret | Done | journal (round 5 đã chấp nhận) |
| L51 pin SHA, L52 seed/ | Done | L6:85 |
| L53 `nginx -v`/`docker version` | Done | journal 11:00. Feature Verification không ghi lại (MINOR-1) |
| L53 Origin Pulls, smoke 2 IP qua CF | → L15 | L15:176 |
| L54/L55 cache rules | → L15 | L15:176 |
| L56 xác nhận từng bước | Done | L6:85 |
| L57 compose, bind 127.0.0.1:3011 | Done | L6:85 |
| L58 `nginx -t`, không sửa site khác | Done | L6:85 |
| L58 chỉ IP Cloudflare | → L15 | L15:177 |
| L59 chặn công khai, noindex, robots | Done (basic auth) | L6:85 |
| L59 DNS / SSL Full Strict | → L15 | L15:176 |
| L60 CD thật → health 200 | Done | L6:85 (b936204) |
| L60 thử rollback | → L12 (user duyệt) | L12:118, approvals |
| L61 seed nền + sample | Done | L6:85. Exit 1 lần đầu → L12:120 |
| L62 dự án / tin tức / tuyển dụng | Done (qua tunnel) | L6:87 |
| L62 dịch vụ | Giải thích (draft) | L6:87 |
| L62 pháp lý | → L12 | L12:122 |
| G17 | code Done, kiểm → L12 | L12:121 |
| G18 importMap | Done | L6:85 |
| G18 GlitchTip | → L12 | L12:123 |
| G20 / G21 | Done | L6:85 |
| G24 | Done | L6:91 + runbook bước 12 |
| L6-T09 `TRUST_CF_CONNECTING_IP` | → L15 | L15:176 |
| L6-T07 bản đồ `/lien-he` | → L12 | L12:119 |

Không mục AC hay follow-up nào rơi.

## Responsive Checklist Gate
N/A: diff không đụng UI (chỉ tài liệu).

## Skill gates
- aislop: N/A, không có code trong diff.
- oxlint (anti-slop): N/A, không có diff TS/JS.
- ocr (open-code-review): skip, chỉ có diff tài liệu.
- AI-readable: OK. Các mục Hoãn đều trỏ đúng task và dòng AC.
- ai-friendly-web: N/A, staging noindex nội bộ.
- blitzstrike: N/A, không phải STRICT.

## Findings

Không có CRITICAL hay MAJOR.

### [MINOR-1] Feature Verification thiếu vài mục phụ
`tasks/tami-website/layer-6-task-01.md:85`:
- AC L53 `nginx -v` (1.24) / `docker version` (29.7) chỉ có trong journal. Nên thêm vào danh sách Done.
- "Tests cần viết" dòng 66 "Xác nhận DB staging khác DB production" chưa có kết quả hay nơi nhận. Production chưa có env nên chưa kiểm được. Nên ghi chuyển sang L15 (go-live production), hoặc ghi `staging_db ≠ prod_db` theo project-config.

### [MINOR-2] Timestamp journal lệch giờ thật
`.context/runs/build-tami-website-layer-6-task-01.md`: History ghi CD b936204 lúc `19:55Z`, nhưng commit b936204 là `06:37Z` và app Created `06:53:48Z` (L6:88). Có vẻ giờ địa phương bị ghi kèm hậu tố `Z`. Không ảnh hưởng kết luận, nhưng làm khó đối chiếu khi resume. Từ nay nên ghi giờ UTC thật.

## Residual risk
- Evidence server (postgres Created/RestartCount, rate limit, trang) chỉ dựa trên ghi chép của primary. Reviewer không kiểm trực tiếp.
- Các trang được kiểm qua tunnel 127.0.0.1:3011, không qua tên miền staging + nginx (round 5 đã chấp nhận).
- Rollback drill trên image thật chưa chạy. Hiện chỉ dựa vào `deploy.test.sh` (user duyệt hoãn → L12).

## Verdict: PASS
Đã đóng hết finding round 5. Mỗi AC và follow-up đều Done có chứng cứ hoặc có nơi nhận cụ thể ở L12/L15. Không thấy lỗi mới trong diff. Hai MINOR còn lại có thể sửa lúc close-out.
