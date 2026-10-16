Agent: reviewer

# Review — build tami-website layer-0 task-01 (scaffold Next.js 16.4.2 + Payload 3.91.0) — round 1

## Review level
STRICT

## Reason
Đây là nền dùng chung cho mọi task sau: config Payload và DB adapter, schema env, migration khởi tạo, auth collection, hạ tầng Docker dev và chọn phiên bản dependency.

## Blast radius
package.json, pnpm-lock.yaml, tsconfig.json, next.config.ts, eslint.config.mjs, vitest.config.ts, src/payload.config.ts, src/lib/env.ts (mọi module đọc env), src/collections/Staff.ts (auth admin), src/app/(payload)/**, src/app/(frontend)/[locale]/**, migrations/* (schema DB), docker/** (hạ tầng dev), .env.example, .gitignore, README.md, .context/decisions.md, .context/progress.json. Mở khoá 7 task ở layer-1.

## Verify commands + result (reviewer tự chạy)
| Lệnh | Kết quả |
|---|---|
| `pnpm install --frozen-lockfile` | PASS (exit 0) |
| `pnpm lint` (eslint .) | PASS, 0 lỗi |
| `pnpm typecheck` (tsc --noEmit) | PASS |
| `pnpm test` (vitest run) | PASS: 2 file, 5 test (4 unit env + 1 integration smoke trên DB dev, chạy thật, không skip) |
| `pnpm build` (next build) | PASS; routes `/[locale]`, `/admin/[[...segments]]`, `/api/[...slug]` |
| `pnpm audit --audit-level high` | 1 high (`braces <=3.0.3`, không có bản vá), 1 moderate, 2 low; xem F3 |
| `git diff --quiet -- AGENTS.md` | Không đổi (AGENTS_UNCHANGED). Reviewer không chạy `pnpm dev` |
| `git check-ignore` | `.env`, `.env.local` bị ignore; `.env.example` được track |

## Acceptance criteria
| AC | Kết quả | Bằng chứng |
|---|---|---|
| install/lint/typecheck/test/build PASS | OK | bảng trên |
| Cấu trúc thư mục theo ARCHITECTURE §4 | OK | src/{collections,globals,access,hooks,endpoints,jobs,lib,components,i18n}, seed/, migrations/, docker/ |
| payload.config: uuid, localization vi/en fallback false, GraphQL tắt, admin vi | OK (xem F1) | src/payload.config.ts:28,33-38,41,43; `push: false` dòng 43 |
| env.ts zod, báo tên biến, không in giá trị; .env.example đủ biến | OK | env.ts:9-44 khớp đủ 17 biến ở project-config § Secrets; test kiểm message không chứa giá trị |
| Docker: 3 extension, Redis, SeaweedFS 2 bucket, bind 127.0.0.1 | OK (kiểm tĩnh) | docker-compose.dev.yml:15,29,44 chỉ bind `127.0.0.1`; init.sql có 3 extension; integration smoke xác nhận 3 extension trên DB đang chạy; tên `tami-*` |
| /admin hiện màn tạo tài khoản đầu tiên (tiếng Việt) | Residual | reviewer không chạy app; chỉ thấy route admin build được |
| Migration bằng `migrate:create`, không có `push: true` | OK | migrations/20261016_090115_init.ts `up` chỉ có CREATE TYPE/TABLE/INDEX và ADD FK trên bảng mới. DROP chỉ có trong `down` (dòng 104-112). Thay đổi additive, không HIGH_RISK |

## Kiểm tra theo trọng tâm
- Phiên bản: Next 16.4.2 nằm trong peer range `>=16.3.3 <17` của Payload 3.91.0. Lý do không dùng Next 15.4.x (advisory critical) đã ghi trong decisions.md Decision 1. Chấp nhận.
- Secrets: `.env.example` chỉ có giá trị dev local (`tami_dev_password`, `tami-dev-secret-not-for-prod`, khớp với docker/seaweedfs/s3.json); các secret thật (PAYLOAD_SECRET, TURNSTILE, SMTP, ANTHROPIC) để trống.
- Scope: không cài thư viện UI hay i18n routing (không có next-intl hay UI lib trong package.json). Staff auth collection là bắt buộc để có admin Payload, và slug khớp ERD. Đây không phải scope creep.
- AGENTS.md: không đổi.

## Skill gates
- aislop: skip, `aislop` chưa cài. Đánh giá tay: không có file thừa, comment ngắn và nêu lý do (WHY) chứ không mô tả code làm gì, không có config dư.
- oxlint (anti-slop): skip, oxlint chưa cấu hình (đã chạy ESLint thay, kết quả PASS).
- ocr: skip, `ocr` chưa cài.
- AI-readable: OK. Có 0 indicator: tên rõ, hàm nhỏ hơn 50 dòng, file nhỏ hơn 300 dòng, README đã cập nhật mục chạy dev.
- ai-friendly-web: N/A (scaffold, chưa có trang public).
- blitzstrike: skip, chưa cài và không có môi trường được phép.
- Responsive Checklist Gate: N/A. Diff chỉ có placeholder `<main>TAMI</main>`, không có CSS hay component UI.

## Findings
- [MINOR] F1. src/payload.config.ts:29-32: `supportedLanguages: { vi, en }` khiến Payload chọn ngôn ngữ admin theo Accept-Language. Trình duyệt tiếng Anh sẽ thấy admin tiếng Anh, còn AC ghi "admin tiếng Việt". Đề xuất: chỉ để `{ vi }` nếu yêu cầu là admin luôn tiếng Việt, hoặc ghi rõ trong spec rằng admin cho phép chuyển en.
- [MINOR] F2. src/payload.config.ts:15 + src/lib/env.ts:9-28: `getEnv()` chạy khi import config. Vì vậy `next build` và CI phải có đủ 17 biến, kể cả ANTHROPIC/SMTP/TURNSTILE. README đã ghi điều này. Đề xuất: task CI/Dockerfile cần cấp biến lúc build (giá trị giả cho build) và không bake secret thật vào image.
- [MINOR] F3. pnpm-lock.yaml: `braces@3.0.3` có advisory high GHSA-vfj7-8cjw-p6xm (DoS do pattern lồng sâu) và chưa có bản vá. Lỗi đến gián tiếp qua sass/chokidar/micromatch, là công cụ build và watch, không xử lý input người dùng lúc runtime. Không chặn task này. Đề xuất: task CI dùng `pnpm audit` kèm allowlist có lý do cho advisory này và theo dõi bản vá.
- [MINOR] F4. src/app/(frontend)/[locale]/: không có trang `/` (trả 404) cho tới task i18n routing. Hợp lệ với placeholder; task i18n cần thêm redirect `/` → `/vi`.

## Residual risk
- AC "/admin hiện màn tạo tài khoản đầu tiên tiếng Việt" chưa được reviewer xác minh trực tiếp (không chạy app). Cần builder có evidence hoặc spec-validator xác nhận khi đóng layer.
- Trạng thái container Docker (2 bucket SeaweedFS) chỉ kiểm qua file compose, không chạy lệnh docker. Riêng extension Postgres đã được xác minh qua integration test.

## Verdict
✅ PASS. Không có CRITICAL/MAJOR; còn 4 MINOR, không chặn.
