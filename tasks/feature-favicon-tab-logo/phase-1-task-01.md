# feature-favicon-tab-logo · phase-1-task-01 — Logo TAMI trên tab trình duyệt (favicon + apple-touch-icon)

- Nguồn: `spec/changes/2026-10-21-favicon-tab-logo.md` (BL-048). Spec: `SPECIFICATIONS.md` F11 câu "Icon tab trình duyệt (BL-048)". Trạng thái: `done`.

## Classification / Risk
- Type: **ADDITIVE**. Risk: **LOW** — thêm file icon tĩnh + metadata, không đổi schema/API/auth. Review **NORMAL** (đụng metadata dùng chung mọi trang + admin).
- Blast radius: `<head>` mọi trang public (vi/en), 404/global-not-found, `/admin`.

## Hiện trạng (đã xác minh 2026-10-21)
- Public `/`, `/en`: KHÔNG có `<link rel="icon">` nào (không có `src/app/**/icon.*`, `favicon.ico`, `metadata.icons`).
- `/admin`: ĐÃ có `<link rel="icon" href="/brand/tami-icon-gold.png">` từ `src/payload.config.ts` `admin.meta.icons` (commit trước). Thiếu apple-touch-icon.
- Icon nguồn `public/brand/tami-icon-gold.png` 256×256, nền trong suốt; phần hình (mái nhà) 242×121 nằm giữa — đã gần chạm 2 mép ngang, crop thêm không lợi đáng kể.

## Quyết định
- D1 Public: dùng file convention App Router `icon.png` + `apple-icon.png` ở `src/app/` (cấp gốc, phủ cả 2 route group + `global-not-found.tsx`). Nếu thực tế không phủ được route group nào thì đặt ở root layout tương ứng (`src/app/(frontend)/[locale]/`) hoặc khai `metadata.icons` — chọn cách đơn giản nhất mà curl xác nhận được.
- D2 `icon.png`: sinh từ `tami-icon-gold.png` bằng `sharp` (có sẵn trong deps), vuông, nền trong suốt, kích cỡ nhỏ hợp lý (vd 64×64 hoặc giữ 256 nếu Next khai `sizes` đúng) — ưu tiên rõ ở 16/32px. Không thêm dependency.
- D3 `apple-icon.png`: 180×180, **nền đặc** (màu nền kem/sáng của site — lấy từ token `--color-bg`/tương đương trong `globals.css`), mái nhà vàng căn giữa có lề ~12–15%.
- D4 Admin: giữ `admin.meta.icons` hiện có; thêm apple-touch-icon nếu Payload hỗ trợ trong `meta.icons` (rel `apple-touch-icon`). Tránh trùng lặp link icon trên `/admin` nếu file convention cũng chèn vào (kiểm bằng curl).
- D5 Script sinh icon: nếu cần giữ lại để tái sinh, đặt ở `scripts/` (ngắn); hoặc sinh một lần rồi commit PNG — không bắt buộc giữ script.

## Verify
- `pnpm typecheck`, `pnpm lint`, test liên quan (nếu đụng file có test).
- Dev server đang chạy http://localhost:3000 (KHÔNG khởi động server khác): `curl` HTML `/`, `/en`, `/admin`, một URL 404 (vd `/khong-ton-tai`) → có `<link rel="icon"` (+ `apple-touch-icon` ở public); URL icon trả 200 `image/png`.

## Verification summary
- Thêm `src/app/icon.png` (64x64, trong suốt, mái nhà cắt sát bbox) + `src/app/apple-icon.png` (180x180, nền đặc #f7f5f4 = --color-bg, lề ~14%) sinh bằng `scripts/gen-favicon.mjs` (sharp). File convention ở gốc phủ cả (frontend) lẫn global-not-found; KHÔNG chèn vào /admin nên không trùng link.
- `src/payload.config.ts`: thêm 1 entry apple-touch-icon (/apple-icon.png) vào admin.meta.icons; giữ icon cũ.
- curl: /, /en, /khong-ton-tai (404), /en/khong-ton-tai (404) đều có <link rel=icon> + apple-touch-icon; /admin có icon + apple-touch-icon (mỗi loại 1 link). /icon.png, /apple-icon.png → 200 image/png.
- typecheck PASS; lint 0 error (2 warning có sẵn ở tools/task-dashboard/server.mjs). Không có test liên quan.
- Đọc rõ ở 16/32px trên nền sáng và tối (nền sáng tương phản vàng-kem hơi thấp, chấp nhận vì là màu logo).

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Doc impact
`no doc impact` — không đổi API/schema/flow; chỉ thêm icon tĩnh + link `<head>` (spec F11 đã ghi). Reconcile: không có gap register liên quan.

## Verification summary — Round 2 (W1, W2, script MINORs)
- `src/app/icon.png` 64x64: mái nhà vàng (cùng crop) trên ô bo góc r=13 (~20%) nền `#111111`, glyph ~76% chiều ngang, ngoài góc trong suốt. Preview 16/32px trên #fff/#f1f3f4/#202124/#35363a: tile tối tương phản rõ ở cả 4 nền, mái nhà nhận ra được (16px nhỏ nhưng đọc được).
- `src/payload.config.ts`: icon admin -> `/icon.png`; apple-touch-icon giữ nguyên.
- `src/app/global-error.tsx`: thêm `<link rel="icon">` + `apple-touch-icon` trong `<head>`. Không có test riêng.
- `scripts/gen-favicon.mjs`: đường dẫn theo `import.meta.url` (chạy được từ cwd khác, đã thử từ /tmp). `.removeAlpha()` KHÔNG no-op (composite thêm alpha; bỏ -> apple-icon hasAlpha=true) nên giữ, thêm comment. apple-icon 180x180 opaque, không đổi.
- `pnpm typecheck` OK; `pnpm lint` 0 error (2 warning cũ ở tools/task-dashboard); vitest cache-policy 48 pass.
- curl `/`, `/en`, `/khong-ton-tai`, `/en/khong-ton-tai`, `/admin`: đúng 1 icon + 1 apple-touch-icon mỗi trang; `/icon.png`, `/apple-icon.png`, URL hash đều 200 image/png.
- Status: review.
