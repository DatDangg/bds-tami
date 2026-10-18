# Task 06: Trang Tin tức: danh sách theo danh mục + chi tiết + bài liên quan (S10, S11)

## Layer
6 — Deploy staging sớm + Cho thuê (dữ liệu), redirect slug, trang công khai đợt 1, endpoint ứng tuyển/tải CV

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SINGLE_SURFACE
- Review level expected: **NORMAL** — trang đọc công khai
- Blast radius: src/app/(frontend)/[locale]/tin-tuc/page.tsx, [slug]/page.tsx; src/components/content/RichText.tsx (render Lexical an toàn, dùng chung); src/components/news/NewsCard.tsx
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- FR-PUB-08
- FR-PUB-15 (Article JSON-LD)
- design-spec S10, S11

## Description
Danh sách tin tức có lọc danh mục + phân trang; chi tiết render richText an toàn, tags, bài liên quan.

## Dependencies
- `layer-5-task-03` Collection `news` (Tin tức) (dùng kết quả của task này)
- `layer-5-task-05` Khung trang công khai: header, menu toàn màn hình, footer, chuyển ngôn ngữ (dùng kết quả của task này)
- `layer-5-task-06` Thành phần trang dùng chung: nút liên hệ nổi, breadcrumb, page banner, phân trang, template danh mục, trạng thái trống/lỗi, 404/500 (dùng kết quả của task này)
- `layer-5-task-08` Nền SEO: metadata, Open Graph, canonical, hreflang, JSON-LD builders (dùng kết quả của task này)
- `layer-4-task-03` Truy vấn công khai dùng chung + chính sách cache (dùng kết quả của task này)

Mở khoá cho: `layer-10-task-03`

## Acceptance Criteria
- [x] Test `news_list_idx` tồn tại sau khi chạy migration thật (`pg_indexes`, mẫu `audit-staff.test.ts:95-96`) (MINOR-2) (review L5-T03 round 1)
- [x] Test nhánh category trong thùng rác (`src/fields/scoped-category.ts:36`) + quyết định UX khi khôi phục bài có category đã xoá (MINOR-3) (review L5-T03 round 1)
- [x] G14: quan sát `revalidatePath` trúng cache Next thật khi lưu bài (đo `next start`: trước/sau lưu) (spec-validation layer 4)
- [x] G13: sửa `categories` (route: null) phải làm mới cache trang danh sách theo danh mục (revalidate path/tag tương ứng); test hook (spec-validation layer 4)
- [x] RichText không render HTML tuỳ ý; link ngoài `rel="noopener"`
- [x] Bài liên quan cùng danh mục, loại trừ bài hiện tại, tối đa 3
- [x] JSON-LD `Article` có `inLanguage`
- [x] Không có form lead

## Tests cần viết
- Unit RichText: node HTML/script không được render
- Integration render: bài liên quan đúng

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-6-task-06-round-<R>-review.md`

## Migration
- Không đụng schema (không tạo migration).

## Retry / Error Memory
- Attempt: 1
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: PASS toàn bộ + G13, G14, G18 (test CategoryListTemplate), follow-up L6-T03 (404 có nội dung)
- Verify commands + result: pnpm install --frozen-lockfile / lint / typecheck = PASS; pnpm test 122 file 1.346 PASS (gồm news-migration chạy migration thật trên DB tạm); pnpm build PASS. Trình duyệt next start :3224 (25 bài mẫu, đã xoá): 375/768/1280 không cuộn ngang, touch ≥44 (trừ link trong đoạn văn), 1 h1, heading không nhảy cấp, alt đủ, focus ring, CLS 0, ảnh bìa fetchpriority high. curl: `/tin-tuc/khong-ton-tai`, `/en/news/khong-ton-tai`, bài thiếu EN, danh mục không có → 404 HTML có h1/header/footer, `private, no-cache, no-store`; chi tiết `public, s-maxage=60, stale-while-revalidate=300`, MISS→HIT; PATCH bài → lần tải sau có nội dung mới (G14); staging noindex, production index, hreflang chỉ khi có EN
- Reviewer verdict: STRICT PASS round 1 — `.context/review-reports/build-tami-website-layer-6-task-06-round-1-review.md`
- Phạm vi thêm: trang S05 `/tin-tuc/danh-muc/[category]` (chip S10 trỏ tới); `RichText` dùng chung; `resolve-missing-page.ts` (proxy kiểm slug); `createCategories(revalidate?)` + hook revalidate danh mục
- Residual risk: trang danh sách `force-dynamic` (do `?page=`) — cần curl `-I /tin-tuc?page=2` có `public, s-maxage=60` lúc đóng layer; `?page=99` → 404 shell rỗng (giới hạn đã ghi ARCH §5.1); link chia sẻ Zalo chưa kiểm trên điện thoại. MINOR 1–10 → L15-T01 / L6-T07
- Spec Validator verdict (layer close): COMPLETE — `.context/review-reports/spec-validation-build-tami-website-layer-6.md`

## Doc / Decision Impact
- Doc impact result: `docs/ARCHITECTURE.md` §5.1 (as-built layer-6-task-06: kiểm slug ở proxy → 404 SSR có nội dung)
- Decision log: thêm trang danh mục tin tức S05 tại task này (reviewer chấp nhận); danh sách dynamic thay ISR

## Commit / Tracking
- Commit gợi ý: `feat(layer-6): task-06 pubnews` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-6/task-06` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức NORMAL)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/app/(frontend)/[locale]/tin-tuc/page.tsx, [slug]/page.tsx
- src/components/content/RichText.tsx (render Lexical an toàn, dùng chung)
- src/components/news/NewsCard.tsx

## Notes
- `RichText` là component dùng chung cho các trang chi tiết sau.
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ spec-validation layer 5
- [x] G18 (L5-T06 MINOR-5): test riêng cho `src/components/templates/CategoryListTemplate.tsx` (consumer chạy được đầu tiên; L6-T04 đang bị chặn): chips danh mục có `aria-current` đúng mục đang chọn; danh sách trống → `EmptyState` với link `parentListHref`; ẩn phân trang khi trống.

## Follow-up từ review layer-6-task-03
- [x] Slug không tồn tại / bản ghi chưa có EN (`notFound()` trong page) trả 404 **có nội dung trong HTML server** (h1 đúng ngôn ngữ, header/footer), không phải shell `__next_error__` (giới hạn Next 16 — ARCH §5.1): kiểm tra ở proxy trước khi vào page, hoặc cách khác đã ghi ở ARCH §5.1; curl bằng chứng.
