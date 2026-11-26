# feature-admin-address-map-location-input · phase-1-task-01 — Tin BĐS: Địa chỉ + Toạ độ ra ngay dưới Tỉnh/Phường (BL-131 T01)

- Change doc: `spec/changes/2026-11-26-admin-address-map-location-input.md` (BACKLOG BL-131).
- Phụ thuộc: không. Task sau: T02 (trường toạ độ dùng chung), T03 (ô dán Google Maps).
- Trạng thái: `done` — NORMAL PASS round 1 (`.context/review-reports/feature-admin-address-map-location-input-phase-1-task-01-round-1-review.md`); 1 MINOR (biểu thức topLevel trong test dồn 1 dòng — không chặn).

## Classification / Risk
- Type: **MODIFY** (UX admin; user duyệt plan 3 task trong chat — "làm cả 3 phần" + "làm đi").
- Scope: chỉ cấu hình field admin `src/collections/PropertyPosts.ts` (vị trí hiển thị). Không đổi schema, đường dẫn dữ liệu, access, validate.
- Risk: **LOW** — collapsible `specsSection` không tên → `address`/`location` vẫn ở cấp gốc dù chuyển ra ngoài; không migration.
- Expected review level: FAST/NORMAL (1 collection config + test).
- Blast radius: form admin Tin BĐS; backfill `src/lib/backfill/property-posts.ts` đọc `doc.address` (đường dẫn dữ liệu không đổi); test `src/collections/property-posts-specs.test.ts` (`SPEC_FIELDS` gồm address/location — cần cập nhật).
- Doc impact dự kiến: `docs/DESIGN.md` nếu có mô tả form Tin BĐS; SPECIFICATIONS F4 as-built (spec-publisher cuối phase).
- Decision impact: không.

## Việc cần làm
1. `src/collections/PropertyPosts.ts:77-78`: bỏ `address` + `location` khỏi `specsSection`; đặt ngay sau `formRow(province, ward)` (`:122-125`) trong tab "Thông tin tin đăng" (trước hàng Dự án liên quan / Tin cho thuê liên quan), giữ nguyên `label`/`admin.description`.
2. Cập nhật comment JSDoc của `specsSection` (hiện nói address/location nằm trong khối).
3. Test: `src/collections/property-posts-specs.test.ts` — address/location không còn trong collapsible "Thông số bất động sản", nằm ngay sau hàng Tỉnh/Phường, vẫn ở cấp gốc (findLayoutField), type text/point, không access riêng.
4. Kiểm `src/lib/backfill/property-post*.ts` không giả định vị trí field trong collapsible.

## Acceptance
- [x] Form Tin BĐS hiện Địa chỉ + Toạ độ ngay dưới Tỉnh/thành – Phường/xã, ngoài khối "Thông số bất động sản".
- [x] Đường dẫn dữ liệu giữ nguyên (`address`, `location` cấp gốc) → tin cũ giữ dữ liệu; không migration (`payload migrate:create` không cần).
- [x] `pnpm vitest run src/collections src/lib/backfill` + `pnpm typecheck` + eslint file đổi PASS.

## Retry / Error Memory
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Verification summary
- Acceptance criteria: 3/3 đạt (address/location ngay sau hàng Tỉnh/Phường, ngoài khối "Thông số BĐS"; đường dẫn dữ liệu cấp gốc giữ nguyên, không migration; verify PASS). Backfill `src/lib/backfill/property-post*.ts` không phụ thuộc vị trí field (chỉ đọc `doc.address`).
- Verify commands + result: `pnpm vitest run src/collections src/lib/backfill` PASS (19 files, 180 tests); `pnpm typecheck` PASS; `pnpm exec eslint src/collections/PropertyPosts.ts src/collections/property-posts-specs.test.ts` sạch. Integration test cần DB: không chạy (không thuộc scope).
- Reviewer verdict: NORMAL PASS round 1.
