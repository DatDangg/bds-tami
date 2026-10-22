# feature-news-careers-contact-redesign · phase-1-task-03 — Đếm lượt xem bài + loader "Đọc nhiều"

- Nguồn: BL-054 Quyết định 1. Spec 1.47.0 khối BL-054 mục "Đọc nhiều = lượt xem thật" + API `POST /api/public/news-views`.
- Plan: phase 1 wave B (sau P1-T01 merge; song song P1-T04).
- Phụ thuộc: P1-T01 (`news-views-daily`).

## Classification / Risk
- Type: **ADDITIVE**. Risk: **HIGH** — endpoint công khai không auth (spam / đếm giả), PII (IP), hiệu năng ISR. Review: **STRICT** (+ đọc skill `security`).
- Blast radius: `src/endpoints/public/news-views.ts` (mới) + đăng ký endpoint, `src/endpoints/_middleware/public-pipeline.ts` (tái dùng rate limit), `src/lib/news/most-read.ts` (mới), `src/lib/news/view-dedupe.ts` (mới: bot filter + khoá băm), `src/components/news/NewsViewBeacon.tsx` (mới — chưa gắn trang; P2-T02 gắn), `src/lib/env.ts` (secret băm nếu cần — mặc định dẫn xuất từ `PAYLOAD_SECRET`), `docs/API_SPEC.md`.
- Doc impact: `docs/API_SPEC.md`.

## Files to Create/Modify
- `src/endpoints/public/news-views.ts`
- `src/lib/news/most-read.ts`
- `src/lib/news/view-dedupe.ts`
- `src/components/news/NewsViewBeacon.tsx`
- `docs/API_SPEC.md`
- `src/lib/security/rate-limit.ts`
- `src/payload.config.ts`

## Scope
1. `POST /api/public/news-views` body `{ newsId }` (UUID): pipeline công khai sẵn có (rate limit theo IP như click-events; body nhỏ; JSON). Bỏ qua (trả 204, không ghi) khi: UA rỗng / bot (crawler, headless, link preview — regex có test), `Sec-Purpose`/`Purpose: prefetch`, bài không tồn tại / chưa xuất bản / xoá mềm. Chống trùng: khoá `HMAC_SHA256(secret, ip|ua|dayVN|newsId)` → Redis `SET NX` TTL tới hết ngày VN; trùng → 204 không cộng. Redis lỗi → **không cộng** (spec-validation F1: pipeline công khai trả 503 khi Redis lỗi — giữ hành vi đó; beacon bỏ qua phản hồi; log cảnh báo không chứa IP). **Không lưu IP / UA thô** (DB, log). Cộng dồn: SQL upsert nguyên tử `INSERT … ON CONFLICT (news_id, day) DO UPDATE SET views = views + 1` (qua `payload.db` drizzle — không read-modify-write). Phản hồi nhanh (204), không lộ lý do bỏ qua. Body sai → 400.
2. Loader `loadMostReadNews(locale, limit = 5)`: tổng views 30 ngày (theo ngày VN) của bài `published`, chưa xoá, `/en` chỉ bài có bản EN; sắp xếp views giảm, hoà → mới hơn; thiếu → bù bài `isFeatured` mới nhất rồi bài mới nhất (không trùng). Trả view model gọn (id, title, href theo locale, cover, publishedAt). Cache (`unstable_cache` / cache sẵn có, revalidate ≤ 3600s, tag news để xuất bản / ẩn bài làm mới). Truy vấn dùng index `(news_id, day)`.
3. `NewsViewBeacon` (`"use client"`, prop `newsId`): sau khi mount + trang hiện (`visibilityState === "visible"`, trễ ~1–2s hoặc `requestIdleCallback`) gửi 1 lần bằng `navigator.sendBeacon` (fallback `fetch` `keepalive`), không chặn render, không gửi khi `navigator.webdriver`. Chưa gắn vào trang (P2-T02).
4. Test: endpoint (bot bỏ qua, trùng trong ngày không cộng, Redis lỗi không cộng, bài chưa xuất bản bỏ qua, rate limit, body sai 400), upsert đồng thời không mất lượt (integration), loader (top 5, bù, EN lọc, cửa sổ 30 ngày), beacon (gửi 1 lần, không gửi khi webdriver).
5. `docs/API_SPEC.md` thêm endpoint.

## Acceptance
- [ ] 2 lần cùng người cùng ngày → +1; bot UA → 0; IP thô không có trong DB / log.
- [ ] Trang ISR không phụ thuộc endpoint (beacon client-side).
- [ ] Loader trả top 5 đúng, bù khi thiếu, EN đúng.
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` PASS.
- Song song P1-T04: cả 2 task thêm `RATE_LIMITS` (`src/lib/security/rate-limit.ts`) + đăng ký endpoint (`src/payload.config.ts`) — thêm **cuối** danh sách, primary gộp khi merge.

## Quy ước song song
- i18n: chỉ thêm key trong **namespace riêng của task** (ghi tên namespace trong báo cáo), thêm vào **cuối** object namespace ở `src/i18n/messages/vi.json` + `en.json`; không sắp xếp lại / format lại file. Primary gộp xung đột khi merge.
- `src/payload-types.ts` là file sinh: regen bằng `pnpm generate:types` (primary regen lại khi merge nếu xung đột).
- Không sửa file thuộc task song song cùng wave; cần thì ghi vào báo cáo để primary chuyển.
- Tái dùng component BL-052 (`src/components/listing/*`, `src/components/detail/*`, `Pagination`, `ConsultBanner`, `SectionHeading`, Button/Badge/chip sẵn có); token màu theo `no-raw-colors.test`; không thêm màu / kiểu nút mới.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`. Migration phát sinh thao tác phá huỷ → DỪNG, gắn `HIGH_RISK_MIGRATION`, báo primary.

## Quyết định (builder)

Builder: `builder-strong`.

1. **Thứ tự xử lý endpoint:** pipeline công khai (rate limit → validate) chạy TRƯỚC lọc bot, để mọi request (kể cả bot) bị rate limit như nhau và body sai luôn 400. Sau pipeline: bot / prefetch → bài công khai → chống trùng → upsert. Mọi nhánh bỏ qua trả 204 giống nhau.
2. **Khoá chống trùng dùng `ipHash` thay cho IP thô:** `HMAC_SHA256(PAYLOAD_SECRET, "news-view:v1:" + ipHash + "|" + ua + "|" + ngàyVN + "|" + newsId)`. `ipHash` là HMAC cố định của IP chuẩn hoá nên phân biệt người như dùng IP, nhưng IP thô không ra khỏi pipeline. UA cắt 512 ký tự trước khi băm. Không cần secret mới trong `src/lib/env.ts` (dẫn xuất từ `PAYLOAD_SECRET`, tiền tố mục đích riêng).
3. **Redis lỗi ở bước `SET NX`** (rate limit đã qua): không cộng, trả **503** cho giống pipeline (spec-validation F1). Log `warn` chỉ ghi tên lỗi.
4. **`day`** = mốc 00:00 giờ VN dạng instant (17:00 UTC hôm trước), đúng ERD / mô tả collection (khác `click-stats-daily` vốn lưu 00:00 UTC). Cửa sổ "Đọc nhiều" = 30 ngày gồm hôm nay (`day >= hôm nay − 29 ngày`).
5. **Bộ lọc bot:** regex tự viết (không thêm dependency); không chặn trình duyệt trong app (Zalo, Messenger, Slack desktop); `(?<!cu)bot\b` để máy Cubot không bị coi là bot. Prefetch: `Sec-Purpose` / `Purpose` / `X-Moz` chứa `prefetch|prerender`.
6. **Loader:** SQL gộp `SUM(views)` có JOIN `news` lọc sơ bộ (`PUBLIC_STATUSES.default`, `deleted_at IS NULL`, `/en` `has_english`) để bài ẩn không chiếm suất; rồi đọc lại bài qua `findPublicList` (nơi duy nhất dựng điều kiện công khai) và giữ thứ tự hạng. `select` chỉ `title/slug/cover/publishedAt` (không kéo `content`). Trả thêm `dateLabel` (ngoài id/title/href/cover/publishedAt) để P2-T02 khỏi format lại.
7. **Cache:** `unstable_cache` 600 s, khoá `(locale, limit)`, tag `news:most-read` (`src/lib/news/news-cache-tags.ts`, file không import gì để `payload.config` không kéo `next/cache`). **Thêm ngoài danh sách file:** hook `src/hooks/news/revalidate-most-read.ts` gắn vào `src/collections/News.ts` (`afterChange`/`afterDelete`, chỉ khi bài đang hoặc vừa công khai) — cần để "xuất bản / ẩn bài làm mới" như scope §2; `createNews` nhận thêm tham số tuỳ chọn `revalidateTags` (chỉ cho test).
8. **Rate limit** `"news-views": 30/60s` thêm **cuối** `RATE_LIMITS`; endpoint thêm **cuối** mảng `endpoints` của `payload.config.ts` (song song P1-T04 — primary gộp).
9. Không migration, không đổi schema → không regen `payload-types.ts`. Không thêm key i18n.

## Verification summary (Builder)

Chạy trong worktree, `DATABASE_URL_TEST` = DB worktree `tami_wt54_p1t03` (test tạo DB tạm con rồi DROP), Redis db 13. Không đụng DB `tami`. Không bật dev server (không cần).

- `pnpm typecheck` — PASS.
- `pnpm lint` — PASS (0 error; 2 warning có sẵn ở `tools/task-dashboard/server.mjs`, không thuộc task).
- `pnpm build` — PASS.
- Test mới của task — PASS:
  - `src/lib/news/view-dedupe.test.ts` (44): bot regex (crawler, headless, Lighthouse/PageSpeed, preview link, thư viện HTTP; người thật gồm Zalo / Messenger in-app, Cubot, Slack desktop), prefetch header, ngày VN + TTL, khoá HMAC không chứa dữ liệu thô, `SET NX EX`, Redis lỗi.
  - `src/endpoints/public/news-views.test.ts` (20): lần đầu +1, trùng trong ngày không cộng, người khác cộng, bot / UA rỗng / prefetch bỏ qua, bài không công khai 204 không cộng, Redis lỗi ở dedupe 503 không cộng + log không chứa IP/UA, Redis lỗi ở rate limit 503, 429, body sai / quá lớn 400.
  - `src/components/news/NewsViewBeacon.test.tsx` (6): gửi đúng 1 lần sau trễ, không gửi khi webdriver, chờ tab hiện, rời trang trước trễ không gửi, fallback `fetch keepalive`.
  - `src/hooks/news/revalidate-most-read.test.ts` (6).
  - `tests/integration/news-views.test.ts` (12, DB tạm + migration thật + Redis thật): 2 lần cùng người → +1, bot → 0, nháp / xoá mềm / không tồn tại → 0, 400, rate limit 31 lần → 429, bảng không có cột IP/UA + khoá Redis không chứa IP, 25 người đồng thời → 25, 50 upsert song song → 50 (1 dòng), loader top 5 + hoà + cửa sổ 30 ngày + bài ẩn bị loại, `/en` chỉ bài EN + bù, bù featured → mới nhất, không lượt xem → toàn phần bù.
- `pnpm test` (toàn bộ) — 3982 pass / 1 fail / 55 skip; 5 file fail, **không liên quan task**:
  - `src/components/layout/Header.test.tsx` "bẫy focus" — timeout 5s khi máy tải nặng; chạy riêng với `--test-timeout 60000` → 17/17 PASS.
  - `tests/integration/access`, `jobs-email`, `media-upload`, `session-refresh` — `beforeAll` không khai timeout nên dùng 10s mặc định, trong khi import `payload.config` lạnh trong worktree đo được ~21s. Thêm vào đó Postgres dùng chung `tami-postgres` sập trong lúc chạy ("too many clients" khi nhiều worktree chạy test song song → process exit 2 → recovery fsync ~25 phút). Sau khi DB hồi phục, chạy lại 4 file + `news-views.test.ts` với config tạm `hookTimeout: 120_000` (file tạm đã xoá) → **5/5 file, 67/67 PASS**.

**Residual risk**
- 4 file integration trên phụ thuộc thời gian import (hook 10s mặc định): không do task gây ra, nhưng có thể lại fail khi máy chạy chậm.
- Khách không xác định được IP (`UNKNOWN_CLIENT_IP`, thiếu cấu hình proxy) dùng chung `ipHash`: chống trùng khi đó chỉ còn theo UA (đếm thiếu, không đếm thừa).
- Bộ lọc bot là regex tự duy trì: bot giả UA trình duyệt thật vẫn được đếm (giới hạn bởi rate limit 30/phút/IP + 1 lượt/người/bài/ngày).
- `loadMostReadNews` ném lỗi khi DB lỗi: P2-T02 khi gắn khối nên bọc (vd trả `[]`) để trang không hỏng.

## Review

## Doc impact

- `docs/API_SPEC.md`: thêm dòng bảng §3 + mục **§3.12 `POST /api/public/news-views`** (body, thứ tự xử lý, chống trùng, upsert, không PII) + loader "Đọc nhiều" (cache / tag / hook làm mới). Primary gộp với mục bản tin của P1-T04 nếu trùng số mục.
- `docs/ERD.md`: no doc impact (schema `news-views-daily` đã ghi ở P1-T01; không đổi schema).
- `docs/PERMISSION.md`: no doc impact (đã ghi endpoint ghi `news-views-daily` ở P1-T01).
- Intent docs (`SPECIFICATIONS.md`): không đổi.
