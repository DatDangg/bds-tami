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
- [x] Không có bản EN → 404 EN; slug cũ → 301 (resolve-redirect)
- [x] Ảnh LCP `priority`; bản đồ lười; tài liệu PDF mở tab mới
- [x] Có vùng `LeadFormSlot` (form ráp ở task lead-form-integration)
- [x] JSON-LD Organization/breadcrumb; meta + OG
- [x] Mỗi trang đúng một `h1`

## Tests cần viết
- Integration render: dự án đủ khối; dự án thiếu `floorPlans` → ẩn khối, không lỗi
- Integration: EN chưa dịch → notFound

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-6-task-05-round-<R>-review.md`

## Migration
- Không đụng schema (không tạo migration).

## Retry / Error Memory
- Attempt: 2 (attempt 2 = sửa MINOR sau PASS round 1)
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: 5/5 PASS + follow-up L5-T06 (refCollection/refId, offset), L5-T01 (validator upload mặc định gallery/cover, ward∈province, placeholder mất ảnh), G18 (beacon text/plain), L6-T03 (404 có nội dung)
- Verify commands + result: pnpm install --frozen-lockfile / lint / typecheck = PASS; pnpm test 135 file 1.477 PASS; pnpm build PASS (`/[locale]/du-an/[slug]` ISR). Trình duyệt next start :3227: 375/768/1280 không cuộn ngang; sub-nav dính, cuộn + focus + hash; lightbox bẫy focus, Esc, trả focus; accordion 375 / 2 cột 1280 (kể cả tắt JS); `/en` tiếng Anh. curl: ISR MISS→HIT `public, s-maxage=60, stale-while-revalidate=300`; slug lạ + EN chưa dịch → 404 có h1/header/footer; slug cũ → 301; JSON-LD RealEstateListing + BreadcrumbList escape; og:image 1200×630; 1 h1
- Reviewer verdict: STRICT PASS round 1 → PASS round 2 (delta MINOR 1–4) — `.context/review-reports/build-tami-website-layer-6-task-05-round-2-review.md`. Primary sửa 2 MINOR round 2 (try/catch `decodeURIComponent` hash trong LegalPolicy; regex test `/shidden(=|s|>)/`) — test file 19/19, lint, typecheck PASS
- Residual risk: dev DB 3 ảnh mẫu cũ có alt EN tiếng Việt (seed chỉ đặt khi tạo mới). Bản đồ chưa kiểm hiển thị (→ staging L6-T01). Link breadcrumb 42px rộng (component có sẵn) → L14-T02. Không JS < lg: panel thứ 2 accordion không mở được (nội dung vẫn trong HTML)
- Spec Validator verdict (layer close): COMPLETE — `.context/review-reports/spec-validation-build-tami-website-layer-6.md`

## Doc / Decision Impact
- Doc impact result: `docs/ARCHITECTURE.md` §5.1 (as-built layer-6-task-05), `docs/API_SPEC.md` §3.4 (refCollection/refId)
- Decision log: biến riêng `--sticky-cta-height`; RealEstateListing không giá; 1 icon tiện ích; validator phường dùng chung `src/fields/` (reviewer chấp nhận)

## Commit / Tracking
- Commit gợi ý: `feat(layer-6): task-05 pubprojdetail` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-6/task-05` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức NORMAL)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

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
- [x] G18 (L5-T06 MINOR-2): Blob gửi bằng `navigator.sendBeacon` trong `src/components/layout/FloatingContact.tsx` đặt type `text/plain;charset=UTF-8` (làm cùng lúc truyền `refCollection`/`refId` ở mục trên); test giải mã Blob kiểm type.

## Follow-up từ review layer-5-task-01
- [x] `Projects.gallery` (và `News.cover`) dùng `validate` tuỳ biến nên bỏ qua kiểm upload mặc định của Payload: gọi validator `upload` mặc định (`payload/shared`) trước rồi mới kiểm publish — chặn PDF vào gallery, id media sai trả 400 thay vì 500 (`src/collections/Projects.ts:29-34`).
- [x] `Projects.ward` thêm `filterOptions` chỉ phường thuộc `province` đã chọn (`src/collections/Projects.ts:103`) + validate phía server.
- [x] Dự án published mà mọi ảnh gallery bị xoá (FK set null) → trang chi tiết/danh sách hiện ảnh placeholder, không vỡ.

## Follow-up từ review layer-6-task-03
- [x] Slug không tồn tại / bản ghi chưa có EN (`notFound()` trong page) trả 404 **có nội dung trong HTML server** (h1 đúng ngôn ngữ, header/footer), không phải shell `__next_error__` (giới hạn Next 16 — ARCH §5.1): kiểm tra ở proxy trước khi vào page, hoặc cách khác đã ghi ở ARCH §5.1; curl bằng chứng.
