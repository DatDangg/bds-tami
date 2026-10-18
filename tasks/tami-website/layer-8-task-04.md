# Task 04: Trang Đăng tin BĐS: danh sách theo danh mục + chi tiết (S08, S09)

## Layer
8 — Global trang chủ, dữ liệu lead, danh sách Cho thuê, trang Đăng tin BĐS, sitemap

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SINGLE_SURFACE
- Review level expected: **NORMAL** — trang đọc công khai
- Blast radius: src/app/(frontend)/[locale]/tin-bds/page.tsx, [slug]/page.tsx; src/components/posts/PostCard.tsx, OfferBox.tsx
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- FR-PUB-06
- FR-PUB-07
- BR-06
- design-spec S08, S09

## Description
Danh sách theo danh mục (Tin BĐS, Voucher/Ưu đãi…) và chi tiết với thông tin tuỳ chọn, nhãn "Đã kết thúc".

## Dependencies
- `layer-7-task-01` Collection `property-posts` (Đăng tin BĐS) + job `expire-offers` (dùng kết quả của task này)
- `layer-5-task-05` Khung trang công khai: header, menu toàn màn hình, footer, chuyển ngôn ngữ (dùng kết quả của task này)
- `layer-5-task-06` Thành phần trang dùng chung: nút liên hệ nổi, breadcrumb, page banner, phân trang, template danh mục, trạng thái trống/lỗi, 404/500 (dùng kết quả của task này)
- `layer-2-task-08` Component media: thư viện ảnh + lightbox, bản đồ MapLibre lười, video facade (dùng kết quả của task này)
- `layer-5-task-08` Nền SEO: metadata, Open Graph, canonical, hreflang, JSON-LD builders (dùng kết quả của task này)
- `layer-4-task-03` Truy vấn công khai dùng chung + chính sách cache (dùng kết quả của task này)

Mở khoá cho: `layer-10-task-01`, `layer-10-task-03`

## Acceptance Criteria
- [x] Nhãn "Đã kết thúc" dùng `isOfferEnded`; mã voucher ẩn khi đã kết thúc
- [x] Hiện giá/ghi chú giá, khu vực, link dự án/tin cho thuê liên quan nếu có
- [x] Vùng `LeadFormSlot`; JSON-LD Article

## Tests cần viết
- Integration render: ưu đãi hết hạn → badge + ẩn voucher

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-8-task-04-round-<R>-review.md`

## Migration
- Không đụng schema (không tạo migration).

## Retry / Error Memory
- Attempt: 1
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: 3/3 xong (builder)
- Verify commands + result: pnpm lint OK · pnpm typecheck OK · pnpm test 159 files/1729 tests PASS (+ 25 integration property-posts) · pnpm build OK (builder, worktree wt8-t04)
- Reviewer verdict: STRICT round 1 PASS (`.context/review-reports/build-tami-website-layer-8-task-04-round-1-review.md`)
- Lệch design-spec (ghi gap cho spec-validator, chờ user): (a) voucher hết hạn ẩn hẳn mã thay vì "mã gạch ngang" S09 `design-spec.md:449` — theo AC, không lộ mã; (b) nút chia sẻ ở footer sau form lead (S09 đặt đầu bài), chưa Web Share API ≤ sm và nút dính ≥ xl; (c) banner chữ thay banner ảnh `pageBanners.propertyPosts` (`:612`, spec cho phép fallback)
- Spec Validator verdict (layer close): GAPS (task đạt AC; gap G31 ngoài task) — `.context/review-reports/spec-validation-build-tami-website-layer-8.md`

## Doc / Decision Impact
- Doc impact result: docs/ARCHITECTURE.md thêm as-built layer-8-task-04 (route S08/S09/S05, xếp bài hết hạn sau, voucher ẩn khi hết hạn)
- Decision log: xem mục "Quyết định builder" bên dưới

## Commit / Tracking
- Commit gợi ý: `feat(layer-8): task-04 pubposts` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-8/task-04` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/app/(frontend)/[locale]/tin-bds/page.tsx, [slug]/page.tsx
- src/components/posts/PostCard.tsx, OfferBox.tsx

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ spec-validation layer 6
- [x] G27 (LOW): route mới thêm rule vào `MISSING_PAGE_RULES` để slug lạ trả 404 có nội dung (G15), không quay lại 404 rỗng. Report: `.context/review-reports/spec-validation-build-tami-website-layer-6.md`.

## Quyết định builder (L8-T04)
- Thêm trang danh mục `/tin-bds/danh-muc/[category]` (S05) dù không nằm trong "Files to Create/Modify": tab danh mục của S08 là link tới đó (design-spec S05/S08) và hook `revalidate-category` đã làm mới đường dẫn này; thiếu trang thì tab 404. Cùng `PostListPage` + `CategoryListTemplate` với `/tin-bds`.
- Mã voucher: ưu đãi đã kết thúc KHÔNG đưa mã vào HTML (AC task) thay vì "mã gạch ngang" ở design-spec S09; hiện dòng "Ưu đãi đã kết thúc". Thông báo sao chép dùng `aria-live` thay toast.
- Xếp bài đã kết thúc sau bài còn hạn: hai truy vấn nối theo trang (không dùng sort biểu thức); trang cuối của nhóm còn hạn có thể ngắn hơn 12.
- Thêm `offerEndedWhere` vào `lib/content/offer-status.ts` (phủ định chính xác của `offerNotEndedWhere`, test khớp `isOfferEnded`); thêm `"property-posts"` vào union `findLocalizedSlugs` (`lib/news/news-queries.ts`).
- Chưa làm (ngoài scope/để task sau): nút "Chia sẻ" dùng Web Share API ở < sm (dùng lại `ShareButtons` của tin tức: Facebook/Zalo/sao chép); nút chia sẻ dính cột trái ≥ xl; form lead thật (layer-10-task-01 thay `LeadFormSlot`); banner ảnh `pageBanners.propertyPosts` (như tin tức, dùng banner chữ); nhãn "Đã kết thúc" trong JSON-LD không áp dụng.

## Follow-up từ review layer-8-task-04 round 1 (MINOR)
- [→ L9-T01] `src/lib/posts/post-queries.ts:127-132` `findRelatedPosts`: danh mục còn 1–2 bài còn hạn thì lấy bù từ nhóm đã kết thúc cho đủ 3 thẻ (design-spec S09); test.
