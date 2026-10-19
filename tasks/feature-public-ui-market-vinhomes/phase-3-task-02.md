# feature-public-ui-market-vinhomes · phase-3-task-02 — Băng tìm kiếm gọn: Dự án, Tin BĐS

- Change doc: `spec/changes/2026-10-19-public-ui-market-vinhomes.md` (BL-020) · plan tổng: `README.md`
- Status: **approved 2026-10-19** (user duyệt plan theo đề xuất)
- Verify: `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` (`.context/project-config.md`)
- Retry/Escalation: attempt ≤ 3, review ≤ 2 vòng → `architecture_review_needed`
- Report: `.context/review-reports/feature-public-ui-market-vinhomes-phase-<N>-task-<NN>-round-<R>-review.md`
- Không sửa: SPECIFICATIONS.md, spec/CHANGELOG.md, spec/updates/, spec/test-scope/, BACKLOG, progress.json (session chính publish)

## Classification / Risk
MODIFY UI · bộ lọc + template dùng chung `CategoryListTemplate` → STRICT.

## Việc
- Áp `ListSearchBar` + banner 240px + "Có N kết quả" + lưới 4 cột cho `/du-an` (ProjectFilters) và `/tin-bds` (+ danh mục). `/tuyen-dung` chỉ nhận banner/thẻ mới, giữ bộ lọc hiện tại.
- Test params; lọc dự án không JS vẫn chạy (progressive của BL-016).

## Acceptance
- [x] Như P3-T01 cho 2 trang; template dùng chung không làm vỡ Tin tức / Tuyển dụng (STRICT PASS r1)


## Carry-over từ P3-T01 (reviewer r2)
- MINOR-1: `RentalFilterSheet` seed từ `filters` URL, không từ draft chung (`RentalFilters.tsx:193`, `RentalFilterSheet.tsx:52`) → seed từ `useRentalListNavigation().draft` + áp qua `update`/`submit` chung (xoá timer debounce trước điều hướng).
- NIT-1: `useMemo` cho context value `RentalListNavigation.tsx:289`.

## Kết quả (2026-10-20)
- Reviewer STRICT r1 PASS.
- Quyết định agent (user ủy quyền 2026-10-20): `/du-an` băng tìm kiếm = Tỉnh + Trạng thái + nút Lọc (không có ô từ khoá vì danh sách dự án không có `q`; không nút "Bộ lọc" vì không có lọc phụ; đổi select không tự gửi — WCAG 3.2.2); `/tin-bds` không có bộ lọc sẵn → không dựng băng tìm kiếm, chỉ banner compact + "Có N kết quả" (tính cả bài nổi bật) + lưới 4 cột; `/tuyen-dung` chỉ banner compact + thẻ viền, giữ bộ lọc; ProjectCard/PostCard thẻ trắng bo 20px áp mọi nơi dùng (OffersSlider trang chủ, "Dự án khác", bài liên quan).
