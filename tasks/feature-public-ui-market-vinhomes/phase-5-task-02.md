# feature-public-ui-market-vinhomes · phase-5-task-02 — UI các khối mới chi tiết dự án

- Change doc: `spec/changes/2026-10-19-public-ui-market-vinhomes.md` (BL-020) · plan tổng: `README.md`
- Status: **approved 2026-10-19** (user duyệt plan theo đề xuất)
- Verify: `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build` (`.context/project-config.md`)
- Retry/Escalation: attempt ≤ 3, review ≤ 2 vòng → `architecture_review_needed`
- Report: `.context/review-reports/feature-public-ui-market-vinhomes-phase-<N>-task-<NN>-round-<R>-review.md`
- Không sửa: SPECIFICATIONS.md, spec/CHANGELOG.md, spec/updates/, spec/test-scope/, BACKLOG, progress.json (session chính publish)

## Classification / Risk
ADDITIVE UI + SEO (JSON-LD) → STRICT.

## Việc
- Điểm nổi bật (lưới thẻ), bản đồ + tab tiện ích quanh theo `category` (tablist a11y; marker nếu có toạ độ), khối Pháp lý (richText + danh sách PDF), Bảng giá (bảng cuộn ngang mobile, ngày cập nhật, "Liên hệ" khi trống giá), FAQ (accordion `details/summary` + JSON-LD `FAQPage` đúng locale).
- Menu neo theo thứ tự: Tổng quan · Nổi bật · Vị trí · Tiện ích · Pháp lý · Giá · Tin liên quan · FAQ (mục trống tự ẩn).
- Docs: design-spec S03, DESIGN.md.

## Acceptance
- [ ] Mỗi khối ẩn khi trống; JSON-LD hợp lệ; VI/EN cùng bố cục

## Carry-over từ P4-T02 (reviewer r1)
- MINOR-2: `ProjectListings.tsx:47` RentalCard dùng `sizes` của lưới 4 cột → thêm prop `imageSizes` cho RentalCard, truyền `(min-width:1280px) 390px, (min-width:640px) 45vw, 100vw`.

## Carry-over từ P5-T01 (reviewer r1)
- MINOR-2: `src/collections/projects/market-blocks.ts:108-111` `vndRange` gắn `Cell: VndCell` vô dụng cho field trong mảng → dùng `rangeNumber`, bỏ `vndRange`.
- MINOR-4: thêm test `priceTable: [{ unitType: "A", areaTo: -1 }]` (và `priceTo: -1`) → 400.
