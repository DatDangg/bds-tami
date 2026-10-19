# feature-public-ui-market-vinhomes · phase-3-task-01 — Băng tìm kiếm gọn + lưới 4 cột: Cho thuê

- Change doc: `spec/changes/2026-10-19-public-ui-market-vinhomes.md` (BL-020) · plan tổng: `README.md`
- Status: **approved 2026-10-19** (user duyệt plan theo đề xuất)
- Verify: `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` (`.context/project-config.md`)
- Retry/Escalation: attempt ≤ 3, review ≤ 2 vòng → `architecture_review_needed`
- Report: `.context/review-reports/feature-public-ui-market-vinhomes-phase-<N>-task-<NN>-round-<R>-review.md`
- Không sửa: SPECIFICATIONS.md, spec/CHANGELOG.md, spec/updates/, spec/test-scope/, BACKLOG, progress.json (session chính publish)

## Classification / Risk
MODIFY UI · bộ lọc + URL params → STRICT.

## Việc
- Component dùng chung `ListSearchBar`: ô từ khoá + 2 OptionSelect chính (Loại / Khoảng giá) + nút "Bộ lọc" mở Sheet (mobile) / Popover (desktop) chứa toàn bộ lọc phụ hiện có (`FilterFields`); `ActiveFilters` giữ nguyên.
- `/cho-thue`, danh mục, khu vực: PageBanner ảnh cao ~240px (đổi clamp của BL-017), băng tìm kiếm đè mép dưới banner, breadcrumb, "Có N kết quả" + SortSelect, lưới `xl:grid-cols-4`, RentalCard bo 20px nền trắng.
- **URL params giữ nguyên** (test so khớp params trước/sau); không JS vẫn submit được form GET.

## Acceptance
- [x] Mọi bộ lọc cũ còn dùng được; URL không đổi; 4 cột ≥ xl, 1–2 cột mobile; không CLS (STRICT PASS r2)


## Kết quả (2026-10-20)
- Reviewer STRICT r1 FAIL (sort 375px, sort tách live draft) → r2 PASS. Report r1/r2 trong `.context/review-reports/`.
- Quyết định agent (user ủy quyền 2026-10-20): "Loại" = `category`, "Khoảng giá" = select 4 mức gợi ý (đặt cặp `priceMin`/`priceMax` như chip cũ; khoảng tuỳ chọn hiện "Khoảng giá tuỳ chọn"); "Bộ lọc" mở Popover ≥ lg (có nút Đóng) / Sheet < lg; badge đếm Tỉnh, Phường, Diện tích, PN, Nội thất + khoảng giá tuỳ chọn; sắp xếp ra hàng "Có N kết quả" dùng chung live draft; bỏ thanh lọc dính mobile (thay bằng băng tìm kiếm đầu trang); banner compact 240px chỉ trang danh sách.
