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
- [x] Mỗi khối ẩn khi trống; JSON-LD hợp lệ; VI/EN cùng bố cục (STRICT PASS r1)

## Carry-over từ P4-T02 (reviewer r1)
- MINOR-2: `ProjectListings.tsx:47` RentalCard dùng `sizes` của lưới 4 cột → thêm prop `imageSizes` cho RentalCard, truyền `(min-width:1280px) 390px, (min-width:640px) 45vw, 100vw`.

## Carry-over từ P5-T01 (reviewer r1)
- MINOR-2: `src/collections/projects/market-blocks.ts:108-111` `vndRange` gắn `Cell: VndCell` vô dụng cho field trong mảng → dùng `rangeNumber`, bỏ `vndRange`.
- MINOR-4: thêm test `priceTable: [{ unitType: "A", areaTo: -1 }]` (và `priceTo: -1`) → 400.

## Kết quả (2026-10-20)
- Reviewer STRICT r1 PASS (5 MINOR → close-out Phase 5). Kiểm dev :3001 với dữ liệu mẫu (DB worktree): menu neo, active "Giá", JSON-LD FAQPage, 3 tab tiện ích quanh, 375 không cuộn ngang, bảng giá cuộn trong.
- Quyết định agent (user ủy quyền 2026-10-20): thứ tự Tổng quan · Nổi bật · Vị trí · Tiện ích · Mặt bằng · Pháp lý · Chính sách · Giá · Thư viện · Tin liên quan · Hỏi đáp (trống tự ẩn); "Chính sách bán hàng" giữ khối riêng cạnh Pháp lý; Tài liệu (PDF) thành mục con trong Pháp lý (giữ neo `#documents` cho nút hero); tiện ích quanh là tab theo nhóm trong khối Vị trí + điểm trên bản đồ sẵn có (prop `markers` của `LazyMap`, không thêm thư viện), chỉ có danh sách khi dự án không có toạ độ; Nổi bật icon chung (`icon` lưu nhưng chưa map icon); bảng giá dạng rút gọn (`3 tỷ – 4 tỷ`), thiếu giá → "Liên hệ", một đầu → "Từ/Đến", ngày cập nhật `dd/MM/yyyy`; FAQ `<details>` + JSON-LD `FAQPage` theo ngôn ngữ trang, không fallback; nhãn menu "Nổi bật / Giá / Hỏi đáp" (EN "Highlights / Pricing / FAQ").
