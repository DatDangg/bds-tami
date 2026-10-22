# feature-listing-followups · phase-1-task-03 — Đo LCP bản build cho 6 trang danh sách / chi tiết (BL-052 residual)

- Nguồn: BL-055 · change doc `spec/changes/2026-10-22-listing-followups.md` (mục "Đo LCP thật (bản build)"; phase review BL-052 P-2 / Residual).
- Task **đo + ghi nhận**: không đổi code trừ khi phát hiện lỗi rõ ràng và nhỏ (≤ 1 dòng, có root cause) — lỗi lớn hơn → ghi vào Verification summary làm follow-up, KHÔNG tự sửa.
- **AUTO PROCEED**: không đo được trong môi trường → ghi Residual rõ ràng (lý do, đã thử gì), task vẫn đóng.

## Classification / Risk
- Type: **MODIFY** (đo lường, bằng chứng QA).
- Risk: **LOW** — không đổi code dự kiến.
- Expected review level: **FAST** (không đổi code) / NORMAL nếu có sửa.
- Blast radius: task file này (số đo); có thể `.context/review-reports/assets/bl055-*.png`.

## Cách đo (gợi ý — chọn cách làm được)
1. `pnpm build` rồi `pnpm start` (port 3000; cần `.env.local` DB dev có dữ liệu: Dự án 61, Tin BĐS 38, Cho thuê ~32 tin). Dev server (`next dev`) **không** dùng để đo LCP.
2. 6 trang (locale `vi`; thêm `/en` nếu còn thời gian): `/du-an`, `/du-an/<slug có ảnh bìa>`, `/cho-thue`, `/cho-thue/<slug>`, `/tin-bds`, `/tin-bds/<slug>`. Lấy slug thật từ DB (`payload.find` hoặc SQL `SELECT slug FROM ... WHERE status='published' LIMIT 1`).
3. Đo LCP bằng một trong: (a) Browser pane (tool `navigate` + `javascript_tool`: `new Promise(r => new PerformanceObserver(l => r(l.getEntries().at(-1))).observe({type:"largest-contentful-paint", buffered:true}))` → `startTime`, `element`, `url`), đo ở 1440 và 390 (mobile preset), mỗi trang ≥ 2 lần lấy lần tốt hơn (lần đầu là cold cache ISR); (b) `npx lighthouse <url> --only-categories=performance --output=json --chrome-flags="--headless"` nếu có Chrome; (c) Playwright nếu có trong repo. Ghi rõ cách đo + điều kiện (local, không throttle).
4. Ngưỡng tham chiếu: LCP ≤ 2.5s tốt (Web Vitals). Ghi element LCP của từng trang (ảnh hero? `priority`/`fetchpriority` có chưa?) → nếu ảnh hero danh sách/chi tiết **chưa** có `priority` (Next `Image`) và LCP > 2.5s thì ghi follow-up cụ thể (file:line), không sửa trong task này trừ khi là 1 dòng rõ ràng.

## Scope
1. Đo theo § Cách đo; ghi bảng vào § Verification summary: trang · viewport · LCP (ms) · element · ghi chú.
2. Chụp 1 ảnh/trang ở 1440 (tuỳ chọn) vào `.context/review-reports/assets/bl055-p1t03-<trang>-1440.png`.
3. Không doc impact (`no doc impact`), trừ khi sửa code.
4. Verify: nếu không đổi code → ghi `skip, no code change`; có đổi → `pnpm typecheck` · `pnpm lint` (scope) · `pnpm test` · `pnpm build`.

## Acceptance
- [x] Có số đo LCP cho 6 trang (ít nhất 1440; 390 nếu được) trên bản `pnpm build` + `pnpm start`, kèm element LCP và cách đo — hoặc Residual rõ ràng vì sao không đo được.
- [x] Trang > 2.5s có ghi nguyên nhân + follow-up cụ thể (file:line). → không có trang nào > 2.5 s (max 420 ms).
- [x] Không đổi code ngoài fix 1 dòng có root cause (nếu có). → không đổi code.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Verification summary

**Kết luận:** cả 6 trang vi có LCP **≤ 420 ms** ở cả 1440 và 390 trên bản build local — xa dưới ngưỡng 2 500 ms. Element LCP của mọi trang là ảnh hero (`<img fetchpriority="high" data-nimg="fill" class="object-cover">`) đã có `priority` (preload + fetchPriority=high) qua `src/components/media/ResponsiveImage.tsx:87-89`: trang danh sách dùng `PageHero` (`src/components/layout/PageHero.tsx:38`), trang chi tiết dùng `DetailHeroMosaic` (`src/components/detail/DetailHeroMosaic.tsx:46`). Không có follow-up `priority`/`fetchPriority`. Không đổi code.

### Cách đo + điều kiện
- Bản build: `node scripts/copy-maplibre-worker.mjs && next build` (= `pnpm build`, exit 0, 2026-10-22 ~21:25, tại commit `e0a61b3`) rồi `next start -p 3100` (port 3000 bị `next dev` khác chiếm; Next 16 tách `.next/dev` nên không xung đột `.next`). DB dev `.env.local` (Dự án 61 / Tin BĐS 38 / Cho thuê ~32 tin). Máy local Windows, không throttle mạng/CPU, ảnh phục vụ qua `/api/media/file/*` local.
- Slug lấy qua SQL (`projects_locales`/`rentals_locales`/`property_posts_locales` join `status='published'`, locale vi, mới cập nhật nhất): `/du-an/du-an-mau-can-ho-song-sai-gon`, `/cho-thue/cho-thue-can-3-ngu-kosmo-tay-ho-view-ho-cuc-dinh`, `/tin-bds/ban-nha-pho-shophouse-elegant-park-thach-ban-tay-tu-trach-hoan-thien-ben-ngoai`.
- **Cách A — Lighthouse 12.8.2 headless** (Edge/Chromium `msedge.exe`, `--headless=new`, `--throttling-method=provided`, cpuSlowdown 1, `--only-categories=performance`): 1440 = `form-factor=desktop`, screenEmulation 1440×900 DPR 1; 390 = `form-factor=mobile`, screenEmulation 390×844 DPR 3. Mỗi trang × viewport chạy 2 lần (lần 1 storage sạch; lần 2 `--disable-storage-reset` = cache ấm). Số = `audits.largest-contentful-paint.numericValue`, element = `largest-contentful-paint-element`.
- **Cách B — Browser pane** (Chromium nhúng, `PerformanceObserver` `largest-contentful-paint` buffered, `resize_window` 1440×900 rồi 390×844), mỗi trang 2 lần tải liên tiếp (cache ấm cả 2 lần vì cùng tab; lần 1 ngay sau Lighthouse nên ảnh đã nằm trong cache Next image). Lưu ý: Browser pane bị ẩn thì trang chạy nền → **không có LCP entry** (first-paint 11 s vì chỉ vẽ khi chụp ảnh); phải `show_pane preview` trước rồi mới đo được — đã làm.
- Server-side: TTFB (Lighthouse `server-response-time`) trang danh sách ~95–110 ms (/du-an), ~30–45 ms (/cho-thue), ~50–60 ms (/tin-bds) — render động mỗi request; trang chi tiết ~6–7 ms (full-route cache / ISR).

### Bảng LCP (ms) — Lighthouse (lần 1 / lần 2) · Browser pane (lần 1 / lần 2)

| Trang | Viewport | LH lần 1 | LH lần 2 | Pane lần 1 | Pane lần 2 | Element LCP | Ghi chú |
|---|---|---|---|---|---|---|---|
| `/du-an` | 1440 | 364 | 369 | 220 | 156 | `img.object-cover` hero `PageHero` (`…-1600x1056.webp`, fetchpriority=high, alt="") | TTFB ~100 ms; FCP = LCP |
| `/du-an` | 390 | 407 | 420 | 208 | 152 | như trên | chậm nhất bộ, vẫn < 0.5 s |
| `/du-an/<slug>` | 1440 | 315 | 345 | 188 | 72 | `img.object-cover` hero `DetailHeroMosaic` ảnh 1 (`…-1600x901.webp`, alt "Phối cảnh các toà căn hộ ven hồ về đêm") | TTFB 7 ms (cache) |
| `/du-an/<slug>` | 390 | 346 | 254 | 92 | 72 | như trên | |
| `/cho-thue` | 1440 | 239 | 221 | 104 | 92 | `img.object-cover` hero `PageHero` (`…-1600x900.webp`) | |
| `/cho-thue` | 390 | 204 | 188 | 108 | 92 | như trên | |
| `/cho-thue/<slug>` | 1440 | 238 | 270 | 104 | 72 | `img.object-cover` hero ảnh 1 (`…-1600x1200.webp`, alt "… - ảnh 1") | |
| `/cho-thue/<slug>` | 390 | 338 | 219 | 88 | 84 | như trên | |
| `/tin-bds` | 1440 | 325 | 314 | 136 | 120 | `img.object-cover` hero `PageHero` (`…-800x422.webp`) | ảnh hero chỉ có bản 800 px (nguồn upload nhỏ) → bị phóng ở 1440; vấn đề chất lượng ảnh/nội dung CMS, không phải LCP |
| `/tin-bds` | 390 | 297 | 320 | 128 | 108 | như trên | |
| `/tin-bds/<slug>` | 1440 | 346 | 340 | 68 | 84 | `img.object-cover` hero ảnh 1 (`…-800x450.webp`) | ảnh gốc tin chỉ 800 px (upload nhỏ) |
| `/tin-bds/<slug>` | 390 | 255 | 221 | 108 | 76 | như trên | |

Trang > 2 500 ms: **không có**. Follow-up code: **không**.

### Ảnh đã lưu (1440×900, trích từ `final-screenshot` của Lighthouse lần 2, định dạng JPEG vì Lighthouse xuất JPEG — không phải PNG như gợi ý)
`.context/review-reports/assets/bl055-p1t03-{du-an,du-an-detail,cho-thue,cho-thue-detail,tin-bds,tin-bds-detail}-1440.jpg`

### Verify
`skip, no code change` (không chạy typecheck/lint/test; `pnpm build` PASS như trên để có bản đo). Doc impact: `no doc impact`.

### Residual
- Số đo là local, không throttle, ảnh từ Payload local → chỉ chứng minh không có lỗi cấu trúc (ảnh hero đã preload/fetchpriority, không chờ JS); LCP thật trên production phụ thuộc mạng/CDN và kích thước ảnh upload. Lighthouse mobile mặc định (4G chậm + CPU 4×) sẽ cao hơn nhiều số ở đây.
- Lighthouse "lần 1" đã ấm server (trang được curl/Browser pane mở trước đó, Next image cache đã có ảnh) — chưa đo cold start server.
- Chưa đo locale `/en` (ngoài scope bắt buộc).
- Server 3100 đã tắt (`taskkill PID 8864`, port 3100 free). Không đụng `next dev` PID 24368 ở port 3000.
