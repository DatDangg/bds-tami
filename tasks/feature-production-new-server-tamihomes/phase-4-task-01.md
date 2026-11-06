# feature-production-new-server-tamihomes · phase-4-task-01 — Gỡ job record-staging-pass (staging + production cùng máy) (BL-112)

- Phụ thuộc: phase-2-task-02 (secret production đã trỏ server mới). Làm được song song P3/P4.T02.
- Trạng thái: `pending` — plan duyệt 2026-11-06T07:45Z.

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
