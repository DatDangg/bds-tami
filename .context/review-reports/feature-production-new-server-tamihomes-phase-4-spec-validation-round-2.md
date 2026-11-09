Agent: spec-validator

# Spec validation — feature-production-new-server-tamihomes (BL-112), phase 4 + close-out — round 2

- Mode: Phase review (phase cuối) + close-out, **chỉ tài liệu** (không chạm server; hạ tầng đã kiểm ở r1).
- Ngày: 2026-11-09
- Round 1: `.context/review-reports/feature-production-new-server-tamihomes-phase-4-spec-validation.md` (FAIL: G1–G4, C1–C5).
- Nguồn kiểm r2: `tasks/feature-production-new-server-tamihomes/phase-4-task-01.md`, `phase-4-task-02.md`, `SPECIFICATIONS.md:354-355`, `spec/updates/2026-11-09-production-new-server-tamihomes.md`, `.context/decisions.md:117-120`, `spec/test-scope/current.json`, `spec/test-scope/archive/test-scope-1.63.0-117.json`, `spec/CHANGELOG.md:95`, `spec/changes/2026-11-09-production-turnstile-real-key.md`, `spec/changes/archive/2026-11-06-production-new-server-tamihomes.md`, `scripts/deploy/lib/release.sh:77-94`, scratchpad `BACKLOG.head{,-patched}.md` + `ARCHITECTURE.head{,-patched}.md` (đã đối chiếu `.head` = `git show HEAD:` — giống hệt).

## Verdict: ✅ PASS (có 1 điều kiện bắt buộc trước commit + 2 mục LOW)

Cả 4 gap và 4 conflict trong scope của r1 đã đóng. G2 chỉ còn một chỗ chưa nhất quán trong task file (Acceptance chưa tick, một dòng Evidence cũ). Đây là ⚠️ nhỏ, chỉ cần sửa văn bản. Có 1 ⚠️, không ❌, không conflict HIGH, nên chưa chạm ngưỡng FAIL.

## Ma trận theo gap/conflict r1
| # r1 | Yêu cầu r1 | Bằng chứng r2 | Status | Note |
|---|---|---|---|---|
| G1 | Backlog Turnstile prod (Q5) + change doc; SMTP trỏ BL-095 | `spec/changes/2026-11-09-production-turnstile-real-key.md` (pending, nêu rõ hostname `tamihomes.vn`, Q2 staging sslip, SMTP thuộc BL-095); `BACKLOG.head-patched.md` thêm dòng BL-118 pending. Tham chiếu BL-118/BL-095 có ở `SPECIFICATIONS.md:355`, `spec/updates/...:19`, `decisions.md:120` (Decision 13), `phase-4-task-02.md:32,37` | ✅ PASS | `current.json` `testNotes` (dòng 68) chỉ ghi "backlog riêng", chưa có ID. Không chặn |
| G2 | Bằng chứng gate sau push (run, staging.history, từ chối SHA chưa qua staging); tick Acceptance, status done | `phase-4-task-01.md:4-7`: run `42193343151` chỉ có 2 job (build + deploy staging), `staging.history` có dòng `e80b2e14`, `production.current` = digest đó (run 42194365495). Gate kiểm bằng biểu thức awk: `e80b2e14` PASS, `9aaf11d2` REJECT. Validator đã đọc `release.sh:80-84` và xác nhận: `--dry-run` return 0 trước dòng awk, nên chọn kiểm bằng awk là đúng. Change doc archive A2 đã tick (`archive/...:40`) | ⚠️ PARTIAL (nhỏ) | Còn sót: (a) `phase-4-task-01.md:27` Acceptance vẫn `- [ ]`; (b) `:41` vẫn ghi "Còn sau push (change-request làm)…", mâu thuẫn với dòng 4-7; (c) `progress.json:3594-3601` P4.T01 chưa `done` (primary đã nói sẽ ghi trước commit). **Điều kiện trước commit:** tick dòng 27, sửa hoặc xoá dòng 41, ghi progress P4.T01 `done` |
| G3 | SPECIFICATIONS + spec/updates ghi job `record-staging-pass` đã gỡ | `SPECIFICATIONS.md:354` (BL-111: "job này đã gỡ ở BL-112 … dùng chung `staging.history`"), `:355` (BL-112: "Cổng … đọc trực tiếp `staging.history` chung (job CI `record-staging-pass` đã gỡ)"); `spec/updates/...:15` | ✅ PASS | Đây là sửa as-built, không phải intent, nên hợp lệ theo AGENTS |
| G4 | P4.T02 Evidence + review NORMAL + progress | `phase-4-task-02.md:4` `done`; Evidence `:25-33`; Residual `:35-38`; Acceptance `:23` đã tick; review r1 NORMAL PASS (`…phase-4-task-02-round-1-review.md`) | ✅ PASS (điều kiện) | `progress.json`: chưa có entry P4.T02, `activeWorkItem` chưa về null. Primary cam kết ghi trước commit, theo đúng luật "progress cập nhật TRƯỚC commit" |
| C1 | BACKLOG: không commit sửa ngoài scope (BL-013 hỏng, BL-059/068/070) | `BACKLOG.head.md` = `git show HEAD:spec/changes/BACKLOG.md` (diff -q rỗng). `diff head head-patched` chỉ có 2 dòng thêm (BL-112 done, BL-118 pending). Không có hunk BL-013/059/068/070 | ✅ PASS | Working tree vẫn còn sửa ngoài scope. Phải stage đúng blob `head-patched` (ví dụ `git update-index --cacheinfo` / `hash-object`), **không** `git add spec/changes/BACKLOG.md`. Dòng BL-013 hỏng trong working tree vẫn cần user/primary xử lý riêng |
| C2 | HEAD chưa có dòng BL-112 | Dòng BL-112 `done` + path archive + ngày 2026-11-06 / 2026-11-09 có trong `head-patched` | ✅ PASS | |
| C3 | ARCHITECTURE phần commit giữ "≈ 7,5GB" | `diff ARCHITECTURE.head.md ARCHITECTURE.head-patched.md`: dòng tổng RAM thành prod ≈ 3,1GB (1g+384m+1g+128m+256m+384m ≈ 3,15) + staging 2,3 + giám sát 1 ≈ **6,4GB**. Grep `7,5 ?GB` trong head-patched rỗng. "DB khởi đầu trống" đã ghi rõ là lần dựng đầu 2026-10-23, còn prod server mới dùng dữ liệu chuyển nguyên | ✅ PASS | Số đã tính lại đúng. Commit phải stage blob `head-patched`, không stage working tree (+462/-282 dòng ngoài scope) |
| C4 | Trigger thống nhất, `generatedAt` thật, thêm `reviewReport` | `current.json:4` `2026-11-09T04:50:00.000Z`, `:5` `feature-update` = `spec/updates/...:4` = convention v117 (`archive/test-scope-1.63.0-117.json:5`); `:72-75` `reviewReport`; `:11` `changeDoc` trỏ archive (file có thật) | ✅ PASS | LOW: `reviewReport` và `phase-4-task-02.md:33` mới trỏ tới spec-validation **r1 (FAIL)**. Nên thêm report r2 này |
| C5 | INFO intent (Cloudflare / "Email gửi thật") | Không sửa, đúng chỉ đạo | ✅ N/A | Ngoài scope; đã có BL-095 cho email |

## Acceptance change doc (archive) — xác nhận lại
`spec/changes/archive/2026-11-06-production-new-server-tamihomes.md`: `status: done`, đủ 5/5 `[x]` (dòng 39-43), mỗi mục có bằng chứng tham chiếu. Số liệu khớp ma trận r1 (A1, A3, A4 ✅ từ r1; A2 nay có bằng chứng G2; A5 nay có G3/G4).

## Gaps còn lại
1. **[PARTIAL] G2-residual** (`phase-4-task-01.md`): Acceptance `:27` chưa tick, Evidence `:41` cũ, progress P4.T01 chưa `done`. Phải sửa trước commit (chỉ văn bản).
2. **[LOW]** `current.json` `reviewReport` + `phase-4-task-02.md:33` nên thêm `.context/review-reports/feature-production-new-server-tamihomes-phase-4-spec-validation-round-2.md`.
3. **[LOW / INFO]** `tasks/feature-production-new-server-tamihomes/phase-1-task-01.md:3` vẫn trỏ path change doc cũ `spec/changes/2026-11-06-…` (file nay ở `archive/`). README/current.json/spec/updates đã đổi. Không chặn, nên sửa cho nhất quán.

## Điều kiện commit (cho change-request)
- Sửa G2-residual. Ghi `progress.json`: P4.T01 `done`, entry P4.T02 kèm report, `activeWorkItem` → null.
- Stage BACKLOG và ARCHITECTURE bằng **blob đã vá từ HEAD** (`*.head-patched.md`), không stage nguyên file working tree.
- Change doc gốc `spec/changes/2026-11-06-production-new-server-tamihomes.md` chưa từng được track (git status không có `D`). Chỉ cần add bản archive.

## Residual risk (giữ từ r1, không chặn)
- Validator không SSH được: trạng thái server cũ dựa trên Evidence P4.T02 + reviewer NORMAL r1.
- Chưa đăng nhập admin, chưa tải CV, chưa gửi form thật trên `tamihomes.vn` (giao user).
- Kho R2 cũ + volume/`/opt/tami` server cũ: user quyết sau 2026-12-06.
- Bằng chứng gate (SHA chưa qua staging bị từ chối) chỉ là biểu thức awk tái hiện, chưa phải lần chạy `deploy.sh production` thật bị `die`. Biểu thức đúng y dòng `release.sh:84`, nên chấp nhận.
