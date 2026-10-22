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

## Verification summary (Builder)

## Review

## Doc impact
