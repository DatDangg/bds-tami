# feature-listing-detail-redesign · phase-3-task-01 — Schema Tin BĐS: trường có cấu trúc (migration additive)

- Nguồn: BL-052 change doc mục "Tin BĐS".
- Spec: 1.46.0 khối BL-052 mục "Tin BĐS — trường mới".
- Plan: phase 3 wave A. **Task duy nhất của phase 3 tạo migration.**
- Phụ thuộc: P1-T01 (`PROPERTY_TYPES`), phase 2 xong.

## Classification / Risk
- Type: **ADDITIVE** (schema).
- Risk: **HIGH** — DB/schema/migration.
- Expected review level: **STRICT**.
- Blast radius: `src/collections/PropertyPosts.ts`, `migrations/*`, `src/payload-types.ts`, `docs/ERD.md`.

## Scope
1. `property-posts` thêm (tuỳ chọn, số ≥ 0): `propertyType` (select `PROPERTY_TYPES`, index), `areaM2` (index nếu lọc nhiều), `bedrooms`, `bathrooms`, `houseDirection` (select danh sách hướng của Rentals — dùng lại hằng `DIRECTIONS` + nhãn), `frontageM` "Mặt tiền (m)", `floors` "Số tầng", `handoverCondition` (select `raw` Bàn giao thô · `basic` Hoàn thiện cơ bản · `full` Nội thất đầy đủ — hằng `HANDOVER_CONDITIONS` dùng chung + nhãn i18n công khai), `address` (text, không localized), `location` (point). Đặt ở tab "Thông tin tin đăng", nhóm "Thông số bất động sản" (`formRow` gọn), nhãn + mô tả tiếng Việt; ghi chú "Để trống nếu tin là voucher/ưu đãi".
2. Migration `pnpm payload migrate:create property_post_specs` — chỉ ADD; up/down/up PASS trên DB worktree; regen types.
3. `docs/ERD.md` §property-posts.
4. Test schema + `admin-labels.test` PASS.

## Acceptance
- [x] Admin tin BĐS có các trường mới; tin cũ lưu/xuất bản được khi để trống.
- [x] Migration additive (không HIGH_RISK), up/down/up PASS.
- [x] `pnpm typecheck` · `pnpm lint` · `pnpm test` PASS.

## Quy ước song song (spec-validation r1 F2/F6)
- i18n: chỉ thêm key trong **namespace riêng của task** (ghi tên namespace trong báo cáo), thêm vào **cuối** object namespace đó ở `src/i18n/messages/vi.json` + `en.json`; không sắp xếp lại / format lại file. Primary gộp xung đột khi merge.
- Không sửa file thuộc task song song cùng wave (xem mục Plan / Blast radius); cần thì ghi vào báo cáo để primary chuyển.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`. Thao tác phá huỷ → DỪNG `HIGH_RISK_MIGRATION`.

## Verification summary (close-out 2026-10-22)
- Commit: 65f4cf0 · Review: r1 STRICT PASS (`.context/review-reports/feature-listing-detail-redesign-phase-3-task-01-round-1-review.md`).
- Verify: typecheck · lint · test 382 file (2 integration timeout chạy riêng PASS) · build PASS; migration up/down/up PASS; drift check sạch.
- Kiểm thực tế: Admin: chỉ qua unit/integration test (không mở trình duyệt).
- Doc impact: docs/ERD.md §4.7 (trường mới). Migration 20261021_173246_property_post_specs SAFE_ADDITIVE, đã migrate DB dev tami.
- Residual risk: Không GIST index location (chỉ cần khi lọc bản đồ — backlog); số thực cho phòng ngủ không chặn (giống Cho thuê).
