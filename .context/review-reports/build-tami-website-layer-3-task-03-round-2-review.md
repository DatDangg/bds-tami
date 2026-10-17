Agent: reviewer

# Review — build/tami-website · layer-3-task-03 · round 2

- **Review level:** STRICT
- **Reason:** vẫn là hạ tầng mạng và cổng trên server dùng chung, cổng chặn truy cập staging (basic auth + cache CDN), secret, hành vi migrate lúc khởi động (`payload.config.ts`), file dùng chung `sentry.server.config.ts` (app + jobs). Round 2 kiểm lại MAJOR-1 và xem các bản sửa MINOR có gây lỗi mới không.
- **Blast radius:** `docker/nginx/tami-staging.conf` (location media mới, header bảo mật, auth), `docker/nginx/tami.conf` (chỉ đổi cách khai `listen ... http2`), `docker/docker-compose.{prod,staging}.yml` (`seaweedfs-init`, comment), `docker/Dockerfile` (`rm -rf .next/cache`), `src/payload.config.ts` + `src/lib/payload/prod-migrations.ts` (migrate lúc start ở mọi môi trường production), `sentry.server.config.ts` + `src/lib/monitoring/sentry-options.ts` (khởi tạo Sentry ở app và jobs), `docs/ARCHITECTURE.md` §5.1/§5.3/§6.2, `.env.example`, task file.
- **Diff:** working tree so với HEAD `0e3a8d7` (+ file chưa track). Ngoài scope theo yêu cầu: `src/payload-types.ts` (CRLF), `tasks/tami-website/layer-4-task-03.md`, `layer-6-task-01.md`, quyết định G1 trong `.context/progress.json`.

## Verify commands + result

| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | exit 0 — 64 file / 614 test PASS (round 1: 63/609; thêm 5 test mới) |
| `pnpm build` | exit 0 (`/vi`, `/en` SSG; `/api/*` dynamic) |
| `docker compose --env-file <fake.env> -f docker/docker-compose.staging.yml config -q` | exit 0 |
| `docker compose --env-file <fake.env> -f docker/docker-compose.prod.yml config -q` | exit 0; khối `seaweedfs-init` của staging sau khi render giữ nguyên logic `case` (`$$` escape đúng) |
| `nginx -t` (container tạm `nginx:1.18-alpine`, snippet Cloudflare thật, cert tự ký, cả 2 conf cùng lúc) | PASS — 1.18.0 không cảnh báo |
| `nginx -t` (container tạm `nginx:alpine` 1.31.7) | PASS — chỉ cảnh báo `listen ... http2` deprecated (đúng như comment trong conf) |
| Thử chức năng nginx 1.31.7 (container tạm, snippet thay bằng `allow all`, upstream giả trên 127.0.0.1:3010/3011 trả `public, max-age=31536000, immutable` cho media và `no-store` cho trang) | xem bảng MAJOR-1 bên dưới |
| Dọn | `docker rm -f rv-ngx-func`; `docker run --rm` cho `nginx -t`; không còn container `rv-ngx*`. Không đụng container `tami-*` (dev `tami-postgres/redis/seaweedfs` vẫn chạy như trước). Image `nginx:1.18-alpine` đã pull vẫn còn trong cache local |
| `docker build` / chạy compose staging thật | không chạy lại (nặng); dựa evidence của builder + đọc Dockerfile |

## Xác minh MAJOR-1 (ảnh staging lọt basic auth qua cache Cloudflare) — ĐÃ ĐÓNG

Đọc cấu hình (`docker/nginx/tami-staging.conf`):
- **Thứ tự chọn location:** toàn file không có location regex (`~`/`~*`), chỉ có `= /api/metrics`, `^~ /api/media/file/`, `^~ /admin`, `^~ /api/`, `/`. Nginx chọn prefix dài nhất, nên `/api/media/file/...` luôn vào location media (dài hơn `/api/`); `^~` chặn mọi regex nếu sau này có thêm. Không có location nào khác bắt được đường này trước.
- **auth_basic:** khai ở mức server (`:37-38`); location media không khai `auth_basic` nên kế thừa. `proxy_set_header Authorization ""` (`:40`) cũng kế thừa vì location không có `proxy_set_header` nào.
- **Header:** `proxy_hide_header Cache-Control` + `add_header Cache-Control "private, no-store" always` (`:74-75`); 5 header lặp lại (`:76-80`) khớp đúng giá trị mức server (`:41`, `:45-48`). Comment `:43`, `:70-71` nhắc phải sửa đồng bộ.
- `tami.conf` (prod) không đổi gì ở location media → giữ header G1 của app.

Thử chức năng (curl qua HTTP/2 tới container tạm):

| Trường hợp | Kết quả |
|---|---|
| staging `/api/media/file/a.webp` có basic auth | 200, đúng **một** `cache-control: private, no-store` + X-Robots-Tag + HSTS + nosniff + X-Frame-Options + Referrer-Policy |
| staging media không có auth | 401 `WWW-Authenticate: Basic`, kèm `private, no-store` + đủ 5 header |
| staging `/api/%6Dedia/file/a.webp` (mã hoá %) | vào location media (nginx chuẩn hoá URI) → `private, no-store` |
| staging `/api//media/file/a.webp` (dấu `/` đôi) | vào location media (`merge_slashes`) → `private, no-store` |
| staging `/vi` | header kế thừa từ mức server vẫn đủ (X-Robots-Tag + 4 header bảo mật), giữ `no-store` của upstream |
| prod `/api/media/file/a.webp` | `public, max-age=31536000, immutable` (G1 giữ nguyên) + 4 header bảo mật |
| prod `/` | `no-store` của upstream + 4 header bảo mật |

Ảnh media trên site không đi qua `/_next/image`: `src/components/media/ResponsiveImage.tsx:34` dùng loader riêng, trỏ thẳng `/api/media/file/*` (`Gallery.test.tsx:37` khẳng định không có `/_next/image`). Không còn đường nào khác cho ảnh upload né được location đã ghi đè header.

## Xác minh các bản sửa MINOR (có gây lỗi mới không)

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| MINOR-2 `listen 443 ssl http2;` | OK | 2 server block cùng `443`/`[::]:443` khai cùng tham số `ssl http2` → không xung đột (`nginx -t` PASS khi nạp cả 2 conf cùng lúc trên 1.18 và 1.31.7). Comment `tami.conf:17-18`, `tami-staging.conf:19-20` + ARCHITECTURE §6.2 ghi lý do |
| MINOR-3 `resolveProdMigrations` | OK | `src/lib/payload/prod-migrations.ts:10` chỉ bật khi đúng chuỗi `"true"`, các giá trị khác → `undefined` (mặc định tắt). Test `prod-migrations.test.ts` có undefined / `""` / `"false"` / `"1"` / `"TRUE"` / `"yes"` / `"true"`. `payload.config.ts:78` truyền `process.env.AUTO_MIGRATE_ON_START`; compose không đặt biến này |
| MINOR-3 `pickSentryExports` | OK | `sentry-options.ts:71-73`: có `default` → lấy `default`, không có → giữ namespace. ESM chạy trong jobs (tsx nạp bản CJS): `default` = `module.exports` đủ bộ export → đúng. Next/Turbopack nạp bản ESM, không có `default` → giữ namespace. Nếu bundler bọc CJS và tự thêm `default` thì đó vẫn là `module.exports` đủ bộ → vẫn đúng. `@sentry/nextjs` không có default export riêng nên không chọn nhầm đối tượng khác. 2 test phủ cả 2 nhánh; typecheck/build PASS |
| MINOR-4 AC/Description | OK | task file dòng 27 (không dùng standalone), AC Nginx (bỏ `real_ip_header` kèm lý do pha access; staging media dùng `private, no-store`) |
| MINOR-5 doc/env | OK | ARCHITECTURE §6.2 có tổng `mem_limit` ≈ 6,8GB; compose `:12` trỏ đúng khối "Docker Compose staging/prod"; `.env.example` giải thích vì sao 2 ví dụ `DATABASE_URL_*` giống nhau |
| MINOR-6 `seaweedfs-init` | OK | compose staging `:196-203` (prod giống hệt): chỉ bỏ qua khi output chứa "already exists", lỗi khác in ra stderr rồi `exit 1`. Builder có evidence chạy thật SeaweedFS 4.48 (bucket đã có → exit 0, tên sai → exit 1); reviewer không tự chạy lại (xem Residual) |
| MINOR-7 `.next/cache` | OK | `Dockerfile:35-37` `rm -rf .next/cache` ở stage builder; runner `:48` tự tạo `/app/.next/cache` thuộc `node` trước khi COPY, COPY gộp thư mục nên vẫn ghi được. Trang SSG nằm ở `.next/server`, không phụ thuộc cache build |
| MINOR-1 / MINOR-8 | OK (follow-up) | ghi ở task file, mục "Follow-up" (Prometheus scrape loopback; `NEXT_PUBLIC_SITE_URL` lúc build cho task SEO) |

## Findings

### [CRITICAL]
Không có.

### [MAJOR]
Không có. MAJOR-1 round 1 đã đóng (bằng chứng ở trên).

### [MINOR]

**MINOR-R2-1 — AC của `layer-6-task-01` chưa giới hạn rule cache Cloudflare cho host prod** — `tasks/tami-website/layer-6-task-01.md:47` (file do primary quản lý, ngoài scope diff này).
Task file này (`layer-3-task-03.md`, mục Follow-up) và ARCHITECTURE §5.1 đều ghi "rule Cache Cloudflare cho `/api/media/file/*` chỉ áp host prod", nhưng AC bên `layer-6-task-01` chưa ghi phạm vi host. Hiện vẫn an toàn vì AC ghi "Edge TTL theo header origin" và origin staging trả `no-store`. Tuy vậy, nếu lúc deploy chọn "Ignore cache-control / Edge TTL override" cho mọi host thì lỗi MAJOR-1 sẽ quay lại. Đề xuất: primary thêm "chỉ host prod; host staging bypass" vào AC đó khi chốt task. Không chặn task này.

**MINOR-R2-2 (residual, có từ trước, ngoài MAJOR-1) — Asset tĩnh của staging vẫn có thể được Cloudflare cache theo đuôi file** — `docker/nginx/tami-staging.conf:94-97` (`location /`).
`/_next/static/*.js|css`, `/favicon.ico` và file trong `public/` có đuôi tĩnh, app trả `public, immutable`. Cloudflare có thể cache rồi phát lại mà không qua basic auth. Đây là mã build và asset tĩnh, không phải dữ liệu upload, nên mức rủi ro thấp. Đề xuất: ở `layer-6-task-01`, host staging dùng Cloudflare Access hoặc rule "Bypass cache" cho toàn host. Không chặn task này.

## Skill gates

| Gate | Kết quả |
|---|---|
| aislop | skip, `aislop` chưa cài (`command not found`) |
| oxlint (anti-slop) | skip, oxlint not configured (không có `.oxlintrc.json`/`oxlint.json`); `pnpm lint` (eslint) PASS |
| ocr (open-code-review) | skip, ocr not installed |
| AI-readable | OK — 0 indicator: 2 hàm mới ngắn, tên rõ (`resolveProdMigrations`, `pickSentryExports`), comment nói lý do (WHY); không magic number mới; ARCHITECTURE đã cập nhật luồng nginx/migrate |
| ai-friendly-web | N/A — task hạ tầng, không có trang public mới |
| blitzstrike | skip, không có môi trường được phép (không deploy/SSH); đã thay bằng thử chức năng nginx trong container tạm |
| Responsive Checklist Gate | N/A — diff không đụng route/component/CSS |
| Migration gate | OK — không tạo migration; app/jobs mặc định không tự migrate, migrate là bước riêng (`--profile tools`) |

## Residual risk

- Không tự chạy lại `docker build` và compose staging thật; dựa vào evidence builder (image 2.13GB, `/api/health` 200, đã dọn).
- Exit code của `weed shell` khi bucket đã tồn tại / khi lỗi chỉ dựa vào evidence builder (SeaweedFS 4.48). Nếu nâng phiên bản SeaweedFS thì câu thông báo "already exists" có thể đổi → `seaweedfs-init` sẽ fail ồn ào (an toàn, không nuốt lỗi).
- Header bảo mật lặp ở 2 chỗ trong `tami-staging.conf`: phải sửa đồng bộ (đã có comment nhắc). Có thể tách thành snippet include ở task sau.
- Các residual round 1 vẫn còn: process khác trên host dùng chung gọi thẳng `127.0.0.1:3010/3011` có thể giả `CF-Connecting-IP`; Authenticated Origin Pulls chờ user quyết định; phiên bản Docker/nginx trên server cần kiểm ở task deploy.

## Verdict

✅ **PASS** — MAJOR-1 đã đóng: đã kiểm bằng đọc cấu hình, `nginx -t` trên 1.18 và 1.31.7, và thử chức năng header/auth trên container tạm. Không còn CRITICAL/MAJOR. MINOR-2..7 sửa đúng, không gây lỗi mới; MINOR-1/8 đã chuyển thành follow-up. 2 MINOR mới không chặn task (thuộc cấu hình Cloudflare ở `layer-6-task-01`).
