# feature-listing-detail-redesign · phase-2-task-04 — Số đếm bộ lọc Tiện ích `/cho-thue` (fix gap G1 phase review P1+P2)

- Nguồn: `.context/review-reports/feature-listing-detail-redesign-phase-1-2-phase-review.md` G1 (MAJOR).
- Spec: 1.46.0 khối BL-052 "Trang danh sách (khung chung)" (`SPECIFICATIONS.md:39` — tab, ô tích, chip có số đếm).
- Plan: wave 3A (song song P3-T01 — không chung file).
- Phụ thuộc: P2-T01, P2-T02.

## Classification / Risk
- Type: **MODIFY** (fix gap spec).
- Risk: **HIGH** — query SQL công khai, hiệu năng danh sách.
- Expected review level: **STRICT**.
- Blast radius: `src/lib/rentals/rental-list-queries.ts` (+ test), `src/components/rentals/RentalListBody.tsx`, `src/components/rentals/rental-list-state.ts` (+ test).

## Scope
1. `listRentals()` trả thêm `facets.amenities` — số tin khớp các bộ lọc hiện tại (trừ chính chiều tiện ích, theo đúng quy tắc đếm faceted của `/du-an` cho tiện ích, AND) cho mỗi tiện ích; dùng lại cách đếm chiều tiện ích của `/du-an` (`src/lib/projects/*`, `project-list-state.ts:82`).
2. UI: ô tích Tiện ích hiển thị `count` như `/du-an`; tiện ích đang chọn mà đếm 0 vẫn bỏ chọn được.
3. Chip Phòng ngủ / Nội thất: **không** số đếm (quyết định user 2026-10-22, theo design).
4. Đo lại thời gian query (p95 local) trước/sau, ghi vào báo cáo.

## Quyết định
- 2026-10-22 user chọn: chip đơn chọn (Phòng ngủ, Nội thất /cho-thue; Tình trạng /du-an; tương tự /tin-bds) **không** hiện số đếm, theo design → as-built B1 ghi spec ở close-out. Ô tích vẫn có số đếm.

## Acceptance
- [ ] Ô tích Tiện ích `/cho-thue` có số đếm đúng (test query + UI).
- [ ] Không chậm rõ rệt (ghi số đo).
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` PASS.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.
