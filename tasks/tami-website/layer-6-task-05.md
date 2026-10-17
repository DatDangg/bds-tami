# Task 05: Trang Chi tiết dự án (S03)

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
- Blast radius: src/app/(frontend)/[locale]/du-an/[slug]/page.tsx; src/components/projects/ProjectOverview.tsx, ProjectSpecs.tsx, FloorPlans.tsx, Documents.tsx
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- FR-PUB-03
- FR-PUB-15
- LGL-02
- design-spec S03

## Description
Chi tiết dự án: tổng quan, chủ đầu tư, bản đồ, tiện ích, mặt bằng, pháp lý, chính sách bán hàng, tài liệu, thư viện ảnh; chừa vị trí form lead.

## Dependencies
- `layer-5-task-01` Collection `projects` (Dự án) (dùng kết quả của task này)
- `layer-5-task-05` Khung trang công khai: header, menu toàn màn hình, footer, chuyển ngôn ngữ (dùng kết quả của task này)
- `layer-5-task-06` Thành phần trang dùng chung: nút liên hệ nổi, breadcrumb, page banner, phân trang, template danh mục, trạng thái trống/lỗi, 404/500 (dùng kết quả của task này)
- `layer-2-task-08` Component media: thư viện ảnh + lightbox, bản đồ MapLibre lười, video facade (dùng kết quả của task này)
- `layer-5-task-08` Nền SEO: metadata, Open Graph, canonical, hreflang, JSON-LD builders (dùng kết quả của task này)
- `layer-4-task-03` Truy vấn công khai dùng chung + chính sách cache (dùng kết quả của task này)

Mở khoá cho: `layer-10-task-01`

## Acceptance Criteria
- [ ] Không có bản EN → 404 EN; slug cũ → 301 (resolve-redirect)
- [ ] Ảnh LCP `priority`; bản đồ lười; tài liệu PDF mở tab mới
- [ ] Có vùng `LeadFormSlot` (form ráp ở task lead-form-integration)
- [ ] JSON-LD Organization/breadcrumb; meta + OG
- [ ] Mỗi trang đúng một `h1`

## Tests cần viết
- Integration render: dự án đủ khối; dự án thiếu `floorPlans` → ẩn khối, không lỗi
- Integration: EN chưa dịch → notFound

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-6-task-05-round-<R>-review.md`

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
- Commit gợi ý: `feat(layer-6): task-05 pubprojdetail` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-6/task-05` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức NORMAL)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/app/(frontend)/[locale]/du-an/[slug]/page.tsx
- src/components/projects/ProjectOverview.tsx, ProjectSpecs.tsx, FloorPlans.tsx, Documents.tsx

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ review layer-5-task-06
- FloatingContact chưa nhận `refCollection`/`refId` (design-spec §2.5): trang chi tiết cần truyền để click-stats tính theo tin/dự án (`src/components/layout/FloatingContact.tsx`, endpoint đã nhận enum `CLICK_REF_COLLECTIONS`).
- Nếu trang có thanh cố định đáy (giá/CTA trên mobile): đặt `--floating-bottom-offset` để nút nổi không bị đè.

## Follow-up từ spec-validation layer 5
- [ ] G18 (L5-T06 MINOR-2): Blob gửi bằng `navigator.sendBeacon` trong `src/components/layout/FloatingContact.tsx` đặt type `text/plain;charset=UTF-8` (làm cùng lúc truyền `refCollection`/`refId` ở mục trên); test giải mã Blob kiểm type.
