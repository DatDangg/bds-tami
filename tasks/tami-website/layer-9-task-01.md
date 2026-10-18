# Task 01: Trang chủ (S01): hero slide, Về TAMI, dự án nổi bật, dịch vụ, ưu đãi, CTA

## Layer
9 — Trang chủ, nghiệp vụ lead (endpoint, phân công, nhắc, xuất, lưu trữ), dịch tự động

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SINGLE_SURFACE
- Review level expected: **STRICT** — trang LCP chính (CWV), carousel a11y
- Blast radius: src/app/(frontend)/[locale]/page.tsx; src/components/home/HeroSlider.tsx, AboutBlock.tsx, FeaturedProjects.tsx, ServicesBento.tsx, FeaturedOffers.tsx, CtaBanner.tsx
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- FR-PUB-01
- NFR-01, NFR-07
- SPECIFICATIONS § Quy tắc biên (khối chưa có EN → ẩn ở /en)
- design-spec S01, §6.1

## Description
Render trang chủ theo `blockOrder` và `enabled`, đúng screen spec.

## Dependencies
- `layer-8-task-01` Global `homepage` (khối, thứ tự, hero video tuỳ chọn, CTA banner) (dùng kết quả của task này)
- `layer-5-task-05` Khung trang công khai: header, menu toàn màn hình, footer, chuyển ngôn ngữ (dùng kết quả của task này)
- `layer-5-task-06` Thành phần trang dùng chung: nút liên hệ nổi, breadcrumb, page banner, phân trang, template danh mục, trạng thái trống/lỗi, 404/500 (dùng kết quả của task này)
- `layer-2-task-08` Component media: thư viện ảnh + lightbox, bản đồ MapLibre lười, video facade (dùng kết quả của task này)
- `layer-5-task-08` Nền SEO: metadata, Open Graph, canonical, hreflang, JSON-LD builders (dùng kết quả của task này)
- `layer-4-task-03` Truy vấn công khai dùng chung + chính sách cache (dùng kết quả của task này)

Mở khoá cho: `layer-10-task-03`, `layer-13-task-04`, `layer-14-task-02`

## Acceptance Criteria
- [x] Hero: ảnh slide 1 là LCP (`priority`), video chỉ phát ≥ 1024px, không reduced-motion, không Save-Data; carousel a11y (region, nút dừng, autoplay dừng khi focus)
- [x] Dự án nổi bật: chọn tay hoặc `isFeatured` mới nhất (≤ 6); Ưu đãi: chọn tay hoặc `isFeatured` còn hạn (`isOfferEnded`)
- [x] Dịch vụ dạng bento 7/5 với `coverImage`
- [x] CTA "Nhận tư vấn" → khoá trang/URL
- [x] Ở `/en`: khối thiếu chữ EN bị ẩn (không lấy chữ Việt)
- [x] JSON-LD Organization; eyebrow ≤ 1/3 số section

## Tests cần viết
- Integration render: tắt khối → không render; đổi `blockOrder` → đúng thứ tự
- Integration render EN: ctaBanner thiếu title EN → ẩn
- RTL: carousel dừng autoplay khi focus

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-9-task-01-round-<R>-review.md`

## Migration
- Không đụng schema (không tạo migration).

## Retry / Error Memory
- Attempt: 2
- Last failure type (round 1): 4 MAJOR hero carousel (1 slide video không có Pause, phím mũi tên làm mất focus, h1 bị ẩn theo slide, nút Pause đè dot ở 375px)
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: pending
- Verify commands + result: worktree `pnpm lint` · `pnpm typecheck` · `pnpm build` PASS, `pnpm test` 1.967 PASS (`contrast.test.ts` CRLF BL-004); sau squash xem commit
- Reviewer verdict: STRICT round 1 FAIL → round 2 PASS (`.context/review-reports/build-tami-website-layer-9-task-01-round-2-review.md`)
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: pending (dự kiến: no doc impact)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-9): task-01 pubhome` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-9/task-01` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`; `contrast.test.ts` fail do CRLF worktree = BL-004)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled: `docs/ERD.md` §4.15 as-built (L9-T01)
- [x] Committed

## Files to Create/Modify
- src/app/(frontend)/[locale]/page.tsx
- src/components/home/HeroSlider.tsx, AboutBlock.tsx, FeaturedProjects.tsx, ServicesBento.tsx, FeaturedOffers.tsx, CtaBanner.tsx

## Notes
- Khối Đối tác (Should FR-PUB-17) làm ở task riêng.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ review layer-8-task-01 round 2 (MINOR)
- [x] `src/hooks/media/guard-delete.ts:11` truyền `req` vào `findGlobal({locale:"vi"})` → Local API đổi `req.locale` của request xoá sang vi (response/afterRead trả alt vi cho request en). Dùng `req.payload.db.findGlobal({ slug: "homepage", locale: "vi", req })` hoặc lưu/khôi phục `req.locale`/`fallbackLocale`.
- [x] Test guard xoá media: thêm case video slide, `about.image`, `ctaBanner.backgroundImage`, bulk delete, ảnh OG xoá được.
- [x] Race 2 admin (vi tắt + title rỗng / en bật cùng lúc) có thể để `enabled=true` + title vi rỗng → trang chủ ẩn CTA banner khi title rỗng (phòng thủ ở lớp hiển thị).

## Follow-up từ spec-validation layer 8 (G32)
- [x] (từ L8-T04 MINOR-1) `src/lib/posts/post-queries.ts:127-132` `findRelatedPosts`: danh mục còn 1–2 bài còn hạn thì lấy bù từ nhóm đã kết thúc cho đủ 3 thẻ (design-spec S09); test.

## Builder notes (L9-T01)
Quyết định thiết kế:
- Tách view model thuần `src/lib/home/home-view.ts` (`buildHomeView`, `visibleBlockKeys`) khỏi truy vấn (`home-queries.ts`) và loader (`load-home.ts`); `HomePage` (async) + `HomeBlocks` (đồng bộ) chỉ render. Test view/queries không cần DB.
- Khối hiện khi: bật + có `title` ở ngôn ngữ đang xem (một quy tắc cho cả vi/en; `ctaBanner` mặc định tắt). Khối danh sách rỗng thì ẩn. Dịch vụ: chỉ mục đã chọn (ERD không có fallback), trống thì ẩn.
- Bản ghi khối đọc lại như khách qua `findPublicList` theo id (depth 1 của global chỉ có id ảnh và không lọc bản ghi ẩn/chưa dịch); dữ liệu vào Client Component đều qua `toPublicImage` (whitelist `url/alt/width/sizes`).
- Hero: crossfade bằng opacity, chỉ ảnh slide 1 `priority`; ảnh slide kế tải sau 1,5s; video dựng ở client (≥1024px, không reduced-motion, không Save-Data). Autoplay dừng khi hover/focus/tab ẩn/reduced-motion/bấm Dừng; `inert` + `aria-hidden` cho slide không hiện; `h1` ẩn bằng tên site khi slide 1 không có title.
- Slider dự án: CSS scroll-snap + IntersectionObserver (không scroll listener), không autoplay.
- `CtaBanner` dùng chung (`layout/CtaBanner`) thêm prop tuỳ chọn `backgroundImage` (mờ 20%); `home/CtaBanner.tsx` chỉ thêm nhãn mặc định. `ServiceCard` thêm prop `className` (khung bento).
- Follow-up: `guard-delete` đọc bằng `req.payload.db.findGlobal` (không đổi `req.locale`); `findRelatedPosts` lấy bài còn hạn trước rồi bù bài đã kết thúc cho đủ 3.
Chưa làm / lệch so với spec: `h1` là `sr-only` tên site đặt ngoài carousel (design-spec S01 `:284` ghi h1 = tiêu đề slide 1 — lệch, follow-up ở L10-T03); Đối tác (partners) bỏ qua (task riêng); header trong suốt đè hero (S01.1) chưa làm (hero cao 100svh trừ header đặc; cần biến thể Header + sentinel cuộn, ngoài Files to Modify); khối Đối tác (task riêng).

## Follow-up từ review layer-9-task-01 round 2 (MINOR) → layer-10-task-03
- Chuyển sang `layer-10-task-03.md`.
