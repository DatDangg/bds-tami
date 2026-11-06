# feature-staging-new-server-nginx-tamihomes · phase-3-task-02 — Close-out: spec PATCH + spec-publish (base URL staging `https://179-197-242-57.sslip.io`) + doc reconcile + archive (BL-111)

- Change doc: `spec/changes/2026-11-06-staging-new-server-nginx-tamihomes.md`.
- Phụ thuộc: phase-3-task-01 PASS.
- Trạng thái: `done` — 2026-11-06. Spec-validation PASS (`.context/review-reports/feature-staging-new-server-nginx-tamihomes-phase-3-spec-validation.md`, G1 alias server/server-old + G2 changed.files đã xử lý).

## Classification / Risk
- Type: MODIFY tài liệu/spec (không đổi requirement sản phẩm).
- Risk: **LOW**. Review level: **FAST/NORMAL**.

## Việc
1. Spec delta (PATCH, làm rõ — không đổi requirement): `SPECIFICATIONS.md` § Deployment (dòng ~343–347): staging chạy server riêng (179.197.242.57, dùng chung dự án khác), Nginx host do TAMI cài + Let's Encrypt `179-197-242-57.sslip.io` (đổi từ staging.tamihomes.vn), không Cloudflare; production giữ server cũ `tami.genieplatform.cloud`. Câu "Cloudflare phía trước" ghi rõ là mục tiêu chưa áp dụng (không hạ intent).
2. **★ spec-publisher:** `spec_version` 1.62.0 → **1.62.1** (PATCH), `spec/updates/2026-11-0X-staging-new-server-nginx-tamihomes.md`, `spec/CHANGELOG.md`, `spec/test-scope/current.json` (`trigger: feature-update`, ghi rõ **base URL staging đổi sang `https://179-197-242-57.sslip.io`**, dữ liệu sao từ staging cũ, staging cũ `https://187-52-119-50.sslip.io` dự phòng/đóng băng; regression: smoke toàn site + form + upload + rate limit).
3. Doc reconcile cuối: runbook §11 ghi kết quả thật (phiên bản nginx/certbot, đường dẫn cert, ngày), ARCHITECTURE §6.1, `.context/decisions.md`; BACKLOG BL-111 → done; BL-105 ghi chú domain mới.
4. `progress.json` → commit-first; change doc `status: done` → `spec/changes/archive/`.
5. Không tắt staging cũ — để user quyết (ghi "chờ user xác nhận tắt" trong BACKLOG/runbook).

## Acceptance
- [x] Không còn tham chiếu sslip.io cho staging hiện hành (chỉ còn ở mục "server cũ / dự phòng").
- [x] test-scope mới có base URL staging mới; `scopeVersion` +1.

## Kết quả
- Spec: `SPECIFICATIONS.md` § Deployment thêm bullet as-built BL-111 (intent "Cloudflare phía trước" giữ nguyên); 1.62.0 → **1.62.1**; `spec/updates/2026-11-06-staging-new-server-nginx-tamihomes.md`; `spec/CHANGELOG.md`; `spec/test-scope/current.json` **v108** (archive v107).
- Spec-validator: PASS. G1 (ARCHITECTURE §6.1 cả 2 server gọi alias `server`) → server cũ = `server-old`, runbook §11.1 ghi rõ; pointer runbook §11. G2 → bổ sung `changed.files` test-scope + `reviewReport`/`specValidation`.
- Runbook §11.3 thêm bước 8 Turnstile (user). BACKLOG BL-111 → done + residual. Change doc → `spec/changes/archive/`.
- BL-105 (Zalo share): không sửa ở đây — share link lấy `NEXT_PUBLIC_SITE_URL` runtime nên tự theo host mới; ghi chú domain trong change doc BL-105 để việc đó tự cập nhật khi xử lý.
