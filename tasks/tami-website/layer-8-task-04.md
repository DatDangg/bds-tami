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
- [ ] Nhãn "Đã kết thúc" dùng `isOfferEnded`; mã voucher ẩn khi đã kết thúc
- [ ] Hiện giá/ghi chú giá, khu vực, link dự án/tin cho thuê liên quan nếu có
- [ ] Vùng `LeadFormSlot`; JSON-LD Article

## Tests cần viết
- Integration render: ưu đãi hết hạn → badge + ẩn voucher

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-8-task-04-round-<R>-review.md`

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
- Commit gợi ý: `feat(layer-8): task-04 pubposts` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-8/task-04` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức NORMAL)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/app/(frontend)/[locale]/tin-bds/page.tsx, [slug]/page.tsx
- src/components/posts/PostCard.tsx, OfferBox.tsx

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ spec-validation layer 6
- [ ] G27 (LOW): route mới thêm rule vào `MISSING_PAGE_RULES` để slug lạ trả 404 có nội dung (G15), không quay lại 404 rỗng. Report: `.context/review-reports/spec-validation-build-tami-website-layer-6.md`.
