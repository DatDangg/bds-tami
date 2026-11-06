# feature-production-new-server-tamihomes · phase-4-task-01 — Gỡ job record-staging-pass (staging + production cùng máy) (BL-112)

- Phụ thuộc: phase-2-task-02 (secret production đã trỏ server mới). Làm được song song P3/P4.T02.
- Trạng thái: `review PASS` (STRICT FAIL r1 → PASS r2) — còn verify sau push (run Deploy 2 job, staging.history dòng mới, dry-run từ chối SHA chưa qua staging).

## Vấn đề
Từ P2.T02, staging và production cùng `/opt/tami/state/staging.history` trên 179.197.242.57: deploy staging tự ghi dòng, job `record-staging-pass`
(BL-111 P1.02) ghi lại đúng cặp đó → `deploy.sh` bỏ qua vì trùng. Job vô hại nhưng thừa: mỗi lần push `staging` dùng secret SSH **production** + thêm thời gian CI.

## Classification / Risk
- Type: MODIFY pipeline (REMOVE một job). Risk: **HIGH** (cổng production, secret). Review: **STRICT**.

## Việc (đề xuất mặc định)
- `.github/workflows/deploy.yml`: xoá job `record-staging-pass` + comment liên quan.
- `.github/actions/ssh-deploy`: bỏ `mode: record-staging` nếu không còn ai dùng; `scripts/deploy/deploy.sh record-staging` + `lib/state.sh record_staging_pass` + test: **giữ** (công cụ tay, đã test; dùng lại nếu sau này tách máy) — ghi rõ trong runbook §1. Reviewer quyết nếu thấy là code chết.
- `docs/runbooks/deploy.md` §1 (sơ đồ: một server, staging.history ghi trực tiếp).

## Verify
- YAML parse OK; `bash scripts/deploy/deploy.test.sh` PASS.
- Push staging sau merge: run Deploy chỉ còn `build` + `deploy-staging` xanh; `tail -1 /opt/tami/state/staging.history` = digest + SHA mới (ghi bởi deploy staging).
- Deploy production SHA đó → PASS; SHA chưa qua staging → bị từ chối (thử dry-run trên server, không deploy thật).

## Acceptance
- [ ] Gate "production chỉ nhận bản đã qua staging" vẫn đúng, không còn job dùng secret production trên push.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Decision log (builder, 2026-11-06)
- Xoá job `record-staging-pass` khỏi `deploy.yml`; `ssh-deploy` bỏ input `mode` + bước record-staging; `registry-user/token` trở lại `required: true` (giá trị trước BL-111, commit `fd524e26`). Kết quả: `action.yml` + `deploy.yml` giống hệt `fd524e26~1`.
- GIỮ `deploy.sh record-staging` + `lib/state.sh record_staging_pass` + 20 ca test: lệnh tay nếu sau này staging/production tách máy (runbook §1 trỏ `git show fd524e26` để dựng lại tự động). Chỉ sửa comment.
- Docs: runbook §1 (một server), §11/§12 ghi chú gỡ job; `docs/ARCHITECTURE.md` dòng mô tả job (review r1 MAJOR) sửa thành một server — chỉ stage đúng dòng đó (file có thay đổi chưa commit khác). `SPECIFICATIONS.md` nhắc job → spec-publisher ở P4.T02.

## Evidence / verification
- `grep -rn record-staging .github` rỗng; `bash scripts/deploy/deploy.test.sh` PASS (ca flock SKIP trên Windows, đã PASS trên Linux ở BL-111).
- `action.yml`, `deploy.yml` byte-identical với `fd524e26~1` (đã chạy CI trước BL-111) — reviewer r1 xác nhận.
- Server (chỉ đọc): dòng cuối `staging.history` (`edf4b378…`/`b75ff984`) = `production.current` → production đọc đúng file staging ghi.
- Còn sau push (change-request làm): run Deploy chỉ có `build` + `deploy-staging` xanh; dòng mới trong `staging.history`; `deploy.sh production --dry-run` từ chối SHA chưa qua staging.
- Review r1 FAIL (MAJOR: ARCHITECTURE:498 + task file thiếu log) → đã sửa; r2.
