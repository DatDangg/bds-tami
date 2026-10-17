# Task 07: Trang Dịch vụ (S14), Liên hệ (S15, chưa form), Pháp lý (S16)

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
- Blast radius: src/app/(frontend)/[locale]/dich-vu/[slug]/page.tsx; src/app/(frontend)/[locale]/lien-he/page.tsx; src/app/(frontend)/[locale]/chinh-sach-bao-mat/page.tsx, dieu-khoan-su-dung/page.tsx (route theo `kind`)
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- FR-PUB-10
- FR-PUB-11 (bản đồ, hotline, địa chỉ, email)
- FR-PUB-14
- design-spec S14, S15, S16

## Description
Ba nhóm trang tĩnh-động; trang liên hệ chừa vùng form lead.

## Dependencies
- `layer-5-task-02` Collection `services` + `pages` (pháp lý) + đồng bộ `privacyPolicyVersion` (dùng kết quả của task này)
- `layer-5-task-05` Khung trang công khai: header, menu toàn màn hình, footer, chuyển ngôn ngữ (dùng kết quả của task này)
- `layer-5-task-06` Thành phần trang dùng chung: nút liên hệ nổi, breadcrumb, page banner, phân trang, template danh mục, trạng thái trống/lỗi, 404/500 (dùng kết quả của task này)
- `layer-2-task-08` Component media: thư viện ảnh + lightbox, bản đồ MapLibre lười, video facade (dùng kết quả của task này)
- `layer-5-task-08` Nền SEO: metadata, Open Graph, canonical, hreflang, JSON-LD builders (dùng kết quả của task này)
- `layer-4-task-03` Truy vấn công khai dùng chung + chính sách cache (dùng kết quả của task này)

Mở khoá cho: `layer-10-task-01`

## Acceptance Criteria
- [ ] Trang pháp lý route cố định theo `kind`, hiện `version` + `effectiveDate`; EN chỉ khi admin đã bật `hasEnglish`
- [ ] Liên hệ: hotline, email, địa chỉ, bản đồ lười từ `site-settings.mapLocation`; vùng `LeadFormSlot`
- [ ] Dịch vụ: hero dùng `coverImage`, banner CTA cuối trang (dùng lại khối CTA)

## Tests cần viết
- Integration render: pháp lý EN chưa duyệt → 404 EN
- Integration render: liên hệ khi chưa có `mapLocation` → ẩn bản đồ

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-6-task-07-round-<R>-review.md`

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
- Commit gợi ý: `feat(layer-6): task-07 pubsvc` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-6/task-07` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức NORMAL)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/app/(frontend)/[locale]/dich-vu/[slug]/page.tsx
- src/app/(frontend)/[locale]/lien-he/page.tsx
- src/app/(frontend)/[locale]/chinh-sach-bao-mat/page.tsx, dieu-khoan-su-dung/page.tsx (route theo `kind`)

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ review layer-6-task-03
- [ ] Slug không tồn tại / bản ghi chưa có EN (`notFound()` trong page) trả 404 **có nội dung trong HTML server** (h1 đúng ngôn ngữ, header/footer), không phải shell `__next_error__` (giới hạn Next 16 — ARCH §5.1): kiểm tra ở proxy trước khi vào page, hoặc cách khác đã ghi ở ARCH §5.1; curl bằng chứng.

## Follow-up từ review layer-6-task-06
- [ ] `RichText` (dùng chung): thêm `break-words`/`overflow-wrap:anywhere` ở gốc để URL dài không gây cuộn ngang ở 375; wrapper bảng cuộn có `role="region"` + `aria-label`; link nội bộ dạng `doc` render thành link thật (MINOR 6, 8, 9).
