# Spec Update — 2026-10-21 favicon-tab-logo (logo TAMI trên tab trình duyệt)

**spec_version:** 1.39.0 → 1.40.0 (MINOR — thêm yêu cầu icon tab; không đổi schema, API, URL trang, quyền)

**BRD:** không đổi.

**Trigger:** feature-update (Change Request **BL-048**, ADDITIVE). Change doc `spec/changes/2026-10-21-favicon-tab-logo.md` (archive ở close-out → `spec/changes/archive/2026-10-21-favicon-tab-logo.md`). Task `tasks/feature-favicon-tab-logo/phase-1-task-01.md`. Review: `.context/review-reports/feature-favicon-tab-logo-phase-1-task-01-round-2-review.md` (NORMAL, PASS r2). Spec-validator: `.context/review-reports/spec-validation-feature-favicon-tab-logo-phase-1.md` (PASS, W1/W2 đã xử lý ở r2).

## Requirements (SPECIFICATIONS.md)

- **F11. SEO — FR-PUB-15 (THÊM):** câu "**Icon tab trình duyệt (BL-048)**": mọi trang public (vi + en, kể cả 404 / trang lỗi) và `/admin` khai `<link rel="icon">` là logo TAMI (mái nhà vàng từ `public/brand/tami-icon-gold.png` trên ô vuông bo góc nền tối `--color-dark`, đọc rõ ở 16/32px trên tab sáng và tối) + `apple-touch-icon` 180×180 nền đặc. URL icon trả 200. Không đổi schema/API.

## Hành vi mới

| Trước | Sau (BL-048) |
|---|---|
| Trang public không có `<link rel="icon">` → tab hiện icon mặc định | Mỗi trang public (vi/en, 404) có đúng 1 `rel="icon"` (`/icon.png`, 64×64) + 1 `apple-touch-icon` (`/apple-icon.png`, 180×180) |
| `/admin` dùng `/brand/tami-icon-gold.png` (vàng trên nền trong suốt, mờ ở tab sáng), không có apple-touch-icon | `/admin` dùng `/icon.png` + `apple-touch-icon` `/apple-icon.png`, mỗi loại 1 link |
| `global-error` không có icon | `global-error.tsx` tự khai `<link rel="icon">` + `apple-touch-icon` trong `<head>` |

## Code (as-built)

- `src/app/icon.png` — 64×64, mái nhà vàng trên ô bo góc nền `#111111` (`--color-dark`), ngoài góc trong suốt (file convention App Router, phủ cả route group + global-not-found).
- `src/app/apple-icon.png` — 180×180, nền đặc kem `#f7f5f4` (`--color-bg`), opaque.
- `src/app/global-error.tsx` — thêm 2 link icon trong `<head>`.
- `src/payload.config.ts` — `admin.meta.icons`: icon → `/icon.png`, thêm `apple-touch-icon`.
- `scripts/gen-favicon.mjs` — sinh 2 PNG bằng `sharp` (có sẵn), chạy tay khi đổi logo.

## Ảnh hưởng

- **Trực tiếp:** `<head>` mọi trang public vi/en, trang 404, trang lỗi gốc, `/admin`.
- **Hồi quy:** metadata/head trang (title, meta, OG, hreflang, JSON-LD không đổi), tải admin.
- Không migration, không đổi quyền, không endpoint mới. `no doc impact`.
