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
- [ ] Hero: ảnh slide 1 là LCP (`priority`), video chỉ phát ≥ 1024px, không reduced-motion, không Save-Data; carousel a11y (region, nút dừng, autoplay dừng khi focus)
- [ ] Dự án nổi bật: chọn tay hoặc `isFeatured` mới nhất (≤ 6); Ưu đãi: chọn tay hoặc `isFeatured` còn hạn (`isOfferEnded`)
- [ ] Dịch vụ dạng bento 7/5 với `coverImage`
- [ ] CTA "Nhận tư vấn" → khoá trang/URL
- [ ] Ở `/en`: khối thiếu chữ EN bị ẩn (không lấy chữ Việt)
- [ ] JSON-LD Organization; eyebrow ≤ 1/3 số section

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
- Attempt: 0
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: pending
- Verify commands + result: pending
- Reviewer verdict: pending
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: pending (dự kiến: no doc impact)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-9): task-01 pubhome` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-9/task-01` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/app/(frontend)/[locale]/page.tsx
- src/components/home/HeroSlider.tsx, AboutBlock.tsx, FeaturedProjects.tsx, ServicesBento.tsx, FeaturedOffers.tsx, CtaBanner.tsx

## Notes
- Khối Đối tác (Should FR-PUB-17) làm ở task riêng.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ review layer-8-task-01 round 2 (MINOR)
- [ ] `src/hooks/media/guard-delete.ts:11` truyền `req` vào `findGlobal({locale:"vi"})` → Local API đổi `req.locale` của request xoá sang vi (response/afterRead trả alt vi cho request en). Dùng `req.payload.db.findGlobal({ slug: "homepage", locale: "vi", req })` hoặc lưu/khôi phục `req.locale`/`fallbackLocale`.
- [ ] Test guard xoá media: thêm case video slide, `about.image`, `ctaBanner.backgroundImage`, bulk delete, ảnh OG xoá được.
- [ ] Race 2 admin (vi tắt + title rỗng / en bật cùng lúc) có thể để `enabled=true` + title vi rỗng → trang chủ ẩn CTA banner khi title rỗng (phòng thủ ở lớp hiển thị).

## Follow-up từ spec-validation layer 8 (G32)
- [ ] (từ L8-T04 MINOR-1) `src/lib/posts/post-queries.ts:127-132` `findRelatedPosts`: danh mục còn 1–2 bài còn hạn thì lấy bù từ nhóm đã kết thúc cho đủ 3 thẻ (design-spec S09); test.
