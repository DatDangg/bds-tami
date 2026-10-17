# Task 03: Trang Chi tiết tin cho thuê (S07), gồm trạng thái "Đã thuê" và tin tương tự

## Layer
7 — Đăng tin BĐS, SearchService, chi tiết Cho thuê, form ứng tuyển

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SINGLE_SURFACE
- Review level expected: **NORMAL** — trang đọc công khai
- Blast radius: src/app/(frontend)/[locale]/cho-thue/[slug]/page.tsx; src/components/rentals/RentalSpecs.tsx, RentalTerms.tsx, SaleContactBox.tsx, SimilarRentals.tsx
- Doc impact (dự kiến): no doc impact
- Decision impact: NO

## Requirements
- FR-PUB-05
- BR-01
- FR-PUB-15 (RealEstateListing)
- SPECIFICATIONS § Quy tắc biên (sale bị khoá, tin đã thuê)
- design-spec S07

## Description
Chi tiết tin cho thuê đủ thông tin; tin `rented` vẫn mở, nhãn "Đã thuê", `noindex, follow`.

## Dependencies
- `layer-6-task-02` Collection `rentals` (Cho thuê): mã `CT-`, điều khoản thuê, `searchText` (dùng kết quả của task này)
- `layer-5-task-05` Khung trang công khai: header, menu toàn màn hình, footer, chuyển ngôn ngữ (dùng kết quả của task này)
- `layer-5-task-06` Thành phần trang dùng chung: nút liên hệ nổi, breadcrumb, page banner, phân trang, template danh mục, trạng thái trống/lỗi, 404/500 (dùng kết quả của task này)
- `layer-2-task-08` Component media: thư viện ảnh + lightbox, bản đồ MapLibre lười, video facade (dùng kết quả của task này)
- `layer-5-task-08` Nền SEO: metadata, Open Graph, canonical, hreflang, JSON-LD builders (dùng kết quả của task này)
- `layer-4-task-03` Truy vấn công khai dùng chung + chính sách cache (dùng kết quả của task này)

Mở khoá cho: `layer-10-task-01`

## Acceptance Criteria
- [ ] Hiện mã tin, giá/tháng (hoặc "Thoả thuận"), diện tích, phòng ngủ/WC, tầng, hướng, nội thất, điều khoản thuê, mô tả, vị trí (ẩn số nhà khi `showExactAddress=false`), video facade
- [ ] Sale phụ trách hiện tên/SĐT; sale `active=false` → thay bằng hotline chung
- [ ] Tin `rented`: badge, `noindex, follow`, gợi ý tin tương tự nổi bật; không JSON-LD RealEstateListing
- [ ] Tin tương tự: cùng danh mục + tỉnh, loại trừ tin hiện tại, tối đa 4
- [ ] Vùng `LeadFormSlot` (biến thể "Nhận tư vấn căn tương tự" khi rented)
- [ ] Khi `showExactAddress=false`: server component phải truyền `approximateLocation(location)` (src/components/media/map-geometry.ts) cho `LazyMap` (kèm `approximate`), KHÔNG truyền toạ độ thật — props client component bị serialize vào HTML (contract từ layer-2-task-08)

## Tests cần viết
- Integration render: rented → meta robots noindex; sale khoá → hotline
- Integration: không lộ địa chỉ chính xác khi tắt

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-7-task-03-round-<R>-review.md`

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
- Commit gợi ý: `feat(layer-7): task-03 pubrentdetail` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-7/task-03` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức NORMAL)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

## Files to Create/Modify
- src/app/(frontend)/[locale]/cho-thue/[slug]/page.tsx
- src/components/rentals/RentalSpecs.tsx, RentalTerms.tsx, SaleContactBox.tsx, SimilarRentals.tsx

## Notes
- —
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.

## Follow-up từ review layer-5-task-06
- FloatingContact chưa nhận `refCollection`/`refId` (design-spec §2.5): trang chi tiết cần truyền để click-stats tính theo tin/dự án (`src/components/layout/FloatingContact.tsx`, endpoint đã nhận enum `CLICK_REF_COLLECTIONS`).
- Nếu trang có thanh cố định đáy (giá/CTA trên mobile): đặt `--floating-bottom-offset` để nút nổi không bị đè.

## Follow-up từ review layer-6-task-03
- [ ] Slug không tồn tại / bản ghi chưa có EN (`notFound()` trong page) trả 404 **có nội dung trong HTML server** (h1 đúng ngôn ngữ, header/footer), không phải shell `__next_error__` (giới hạn Next 16 — ARCH §5.1): kiểm tra ở proxy trước khi vào page, hoặc cách khác đã ghi ở ARCH §5.1; curl bằng chứng.
