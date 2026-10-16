Agent: reviewer

# Review — build-tami-website layer-1-task-03 (next-intl routing + proxy.ts + format Intl) — round 1

- **Review level:** STRICT
- **Reason:** proxy/navigation dùng chung cho mọi trang công khai, cache CDN theo URL, redirect 301 (browser/CDN cache vĩnh viễn), có dependency mới (next-intl@4.14.9).
- **Blast radius:** `src/proxy.ts` (mọi request trừ /admin, /api, /_next, file có dấu chấm), `src/i18n/routing.ts` (bảng pathnames: mọi Link/redirect/sitemap sau này), `src/i18n/navigation.ts`, `src/i18n/request.ts`, `src/app/(frontend)/[locale]/layout.tsx` (`<html lang>`, NextIntlClientProvider), `next.config.ts` (plugin), `vitest.config.ts`, `src/lib/format.ts`, `docs/ARCHITECTURE.md`, lockfile (+~40 gói gồm @swc/core*, @parcel/watcher*, @formatjs/*).

## Verify commands + result (reviewer tự chạy)
| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS (exit 0, lockfile khớp) |
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS — 8 files, 77 tests (log ERROR "Thiếu mật khẩu mới." là case lỗi có chủ đích của access.test.ts) |
| `pnpm build` | PASS — `/[locale]` SSG `/vi`, `/en`; `ƒ Proxy (Middleware)` nhận diện `src/proxy.ts` |
| `pnpm audit --audit-level high` | PASS (exit 0): 2 low + 1 moderate (dompurify, esbuild — qua @payloadcms, có sẵn), 1 high đã ignore từ trước (`GHSA-vfj7-8cjw-p6xm`, không do diff này). Không advisory nào qua next-intl |
| `git status` sau build | AGENTS.md không đổi; không có file lạ ngoài manifest. Không chạy `pnpm start` (không cần) |

## Kiểm các trọng tâm
- **18 cặp pathnames vs BRD §2.1:** OK — đối chiếu `docs/BRD.md:106-114` từng dòng; `/` ↔ `/en`; test `routing.test.ts` khoá đủ 18 cặp + đếm tổng + không trùng + tên tham số động trùng.
- **Không redirect theo Accept-Language/cookie:** OK — `localeDetection: false`; test `/` với `accept-language: en` và `cookie NEXT_LOCALE=en` đều rewrite `/vi`, không `location`.
- **`/vi/*` → 301 bản không tiền tố, không `/` → `/vi`:** OK (test). Query string được giữ: next-intl `middleware.js:114,123,130,133,153` đều nối `request.nextUrl.search` vào URL redirect. Không loop: đích redirect là URL không tiền tố → nhánh `next()` rewrite nội bộ, không redirect lại.
- **307 → 301:** chấp nhận. Với `localeDetection: false` mọi redirect của next-intl đều tất định theo URL (`/vi/*`, đường dẫn sai ngôn ngữ `/en/du-an` → `/en/projects`, chữ hoa locale), nên “vĩnh viễn” đúng nghĩa và đúng SPEC F12 (yêu cầu 301). Rủi ro còn lại ghi ở Residual risk.
- **Matcher:** OK — bỏ qua `/admin`, `/admin/...`, `/api/...`, `/_next/...`, mọi path có dấu chấm (`sitemap.xml`, `robots.txt`, ảnh); `/administrator-guide` vẫn được xử lý (có test). Không phá admin/REST Payload (build/test integration Payload vẫn PASS).
- **`localeCookie: false`:** đúng cho CDN (test khẳng định không Set-Cookie). Xem MINOR-2 về việc cookie không có nơi đọc.
- **ARCHITECTURE.md:** as-built hợp lệ (đổi tên middleware→proxy theo Next 16, mô tả 301 + cookie khớp code); không đụng intent doc.
- **vitest inline next-intl:** chỉ đổi cách resolve `next/server` không đuôi `.js` trong project integration; không mock/skip gì → không che lỗi.

## Findings

### [MAJOR] M1 — Proxy phát header `Link` hreflang sai cho mọi trang (SEO + CDN cache)
- `src/i18n/routing.ts:45-55` không đặt `alternateLinks`; next-intl mặc định `alternateLinks: true` (`routing/config.js:7`) và `middleware.js:159` gắn header `Link: <…>; rel="alternate"; hreflang=…` cho mọi response không redirect.
- Hệ quả: `/du-an/<slug-vi>` sẽ khai báo `hreflang="en"` → `/en/projects/<slug-vi>`, trong khi BRD §2.1 (`docs/BRD.md:102`) quy định bản EN có **slug tiếng Anh riêng**, và ARCHITECTURE: bản EN không có `hasEnglish` → `notFound()`. Tức là hreflang trỏ tới URL sai/404 trên mọi trang chi tiết, bị CDN cache cùng response; mâu thuẫn chiến lược ARCHITECTURE (hreflang qua `sitemap.xml` alternates / metadata).
- **Fix:** thêm `alternateLinks: false` vào `defineRouting`; hreflang sinh ở sitemap/`generateMetadata` (task SEO). Thêm assert `res.headers.get("link")` null trong `tests/integration/proxy.test.ts` (vd cho `/du-an/abc` và `/`).

### [MINOR] m2 — Cookie `NEXT_LOCALE` được ghi nhưng không có nơi đọc
- `src/i18n/localeCookie.ts` chỉ build chuỗi cookie; `localeDetection: false` + `localeCookie: false` nên proxy không bao giờ đọc nó. BRD `docs/BRD.md:117` “Lựa chọn của khách được nhớ bằng cookie” hiện không có hiệu lực. Đọc cookie để redirect ở `/` sẽ phá cache CDN (ARCHITECTURE D6), nên cần quyết định rõ nơi tiêu thụ (vd client-side gợi ý/redirect ở nút chuyển ngôn ngữ).
- **Fix:** ghi Decision/gap trong task file (hoặc gap register) và giao cho task language switcher; không cần đổi code task này.

### [MINOR] m3 — Matcher bỏ qua mọi path có dấu chấm
- `src/proxy.ts:16` `.*\\..*` → slug chứa `.` (vd `/en/projects/can-ho-2.5pn`) không được rewrite → 404. Hiện chấp nhận nếu hàm slugify về sau loại bỏ `.`; **Fix:** ghi ràng buộc “slug không chứa dấu chấm” vào task slug/collections, hoặc thu hẹp sang danh sách đuôi file tĩnh.

### [MINOR] m4 — Task file chưa cập nhật Doc Impact
- `tasks/tami-website/layer-1-task-03.md:17,67` vẫn ghi dự kiến “no doc impact” trong khi diff sửa `docs/ARCHITECTURE.md` (đúng theo follow-up dòng 97). Cập nhật khi close-out.

### Ghi chú (không tính lỗi)
- `NextIntlClientProvider` không truyền `messages` → v4 tự đẩy toàn bộ messages xuống client; khi `en.json/vi.json` lớn nên lọc theo namespace (task UI sau).
- Dependency mới kéo `@swc/core` + `@parcel/watcher` (native, phục vụ extractor của next-intl) — không có advisory, nhưng tăng bề mặt supply chain/kích thước image.

## Responsive Checklist Gate
Diff có đụng `layout.tsx` nhưng chỉ đổi `<html lang>` + provider, không thêm CSS/markup hiển thị.
- Layout: N/A (không đổi CSS/markup) · Typography/Spacing: N/A · Media: N/A · Touch/Interaction: N/A · Viewport/A11y: N/A — `lang` đúng theo URL là cải thiện a11y (OK).

## Skill gates
- aislop: skip — không nằm trong verify commands được allow cho reviewer.
- oxlint (anti-slop): skip, oxlint not configured (Glob không thấy `.oxlintrc.json`/`oxlint.json`); ESLint PASS.
- ocr (open-code-review): skip, ocr not installed / không trong allow list.
- AI-readable: OK — file ≤ 60 dòng, hàm ngắn, tên rõ, hằng số có tên (`ONE_YEAR_SECONDS`, `TIME_ZONE`), comment giải thích WHY; ARCHITECTURE đã cập nhật luồng. 0 indicator.
- ai-friendly-web: N/A — task hạ tầng routing, chưa có trang công khai/robots/sitemap (thuộc task SEO).
- blitzstrike: skip — không có môi trường được phép.

## Residual risk
- 301 bị browser/CDN cache vĩnh viễn: đổi `pathnames` sau go-live sẽ kẹt redirect cũ → mọi đổi đường dẫn phải giữ redirect chuyển tiếp. 301 cho phép đổi POST→GET (308 thì không); hiện form đi qua `/api`/server action ở URL không tiền tố nên không ảnh hưởng.
- Không chạy server thật để curl; hành vi xác minh qua integration test gọi trực tiếp `proxy()` + đọc mã next-intl.

## Verdict: FAIL
1 MAJOR (M1 — header `Link` hreflang mặc định của next-intl). Fix M1 + test, cập nhật m4; m2/m3 ghi quyết định/ràng buộc rồi gửi lại round 2.
