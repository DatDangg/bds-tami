# Spec Update — 2026-11-06 staging-new-server-nginx-tamihomes

**spec_version:** 1.62.0 → 1.62.1 (PATCH — làm rõ hạ tầng staging, không đổi requirement sản phẩm)
**Trigger:** feature-update (BL-111, change-request class MODIFY, hạ tầng)
**Work item:** `feature/staging-new-server-nginx-tamihomes`
**Change doc:** `spec/changes/archive/2026-11-06-staging-new-server-nginx-tamihomes.md`

## Lý do
Staging chuyển sang server riêng mới 179.197.242.57 (Nginx host + Let's Encrypt, không Cloudflare/Tunnel). Production vẫn ở server cũ (chuyển sang `tamihomes.vn` là BL-112).

## Delta (SPECIFICATIONS.md § Hạ tầng/Deployment, bullet "As-built BL-111")
- LÀM RÕ: base URL staging mới `https://179-197-242-57.sslip.io`; mở công khai + `noindex`, không basic auth (quyết định user).
- LÀM RÕ: cổng "production chỉ nhận digest đã qua staging" giữ được khi staging/production tách máy (job `record-staging-pass`, `deploy.sh record-staging`).
- Không đổi code ứng dụng, schema, API.

## Ảnh hưởng
Chỉ môi trường test: staging cũ `https://187-52-119-50.sslip.io` đóng băng ở commit 678b3568 (KHÔNG test ở đó). Dữ liệu copy từ staging cũ lúc ~04:09Z (DB) / ~04:11Z (media) 2026-11-06. Risk medium (env/infra). Commits: 940ab50c, fd524e26, e49d01f2, 55e52730, 0bcab51d, 98c08b2a.
