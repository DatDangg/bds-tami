Agent: spec-validator

# Spec validation: feature-public-ui-market-vinhomes (BL-020) · Phase 3 (trang danh sách + Tin tức)
> Report do primary lưu (guard chặn ghi `.context/review-reports/**` trong worktree). Nội dung theo báo cáo spec-validator.

- Scope: branch `claude/bl020-p3p5`, commit 16c5e81 (T01 STRICT PASS r2), 1511db5 (T02 STRICT PASS r1), 0b95083 (T03 STRICT PASS r3) trên staging b2f430e (62 file). Chỉ đọc.

## Verdict lần 1: GAPS FOUND
Code phủ đủ yêu cầu Phase 3. Gap nằm ở spec/docs: `SPECIFICATIONS.md` mâu thuẫn hành vi mới (1 HIGH, 2 MEDIUM) + nhiều dòng as-built cũ. Chưa close-out tới khi publish spec delta.

## 1. Coverage
| # | Yêu cầu | Nguồn | Hiện thực | Trạng thái |
|---|---|---|---|---|
| 1 | Banner ~240px trang danh sách | change doc :15, :46, :82 | `PageBanner.tsx:31` `h-60` khi `size="compact"`; Cho thuê, Dự án, Tin BĐS, Tuyển dụng, Tin tức | ✅ |
| 2 | Băng tìm kiếm gọn đè banner | :44, :46 | `ListSearchBar.tsx:32-71`; Cho thuê `RentalListPage.tsx:130`; Dự án `ProjectListPage.tsx:105` | ✅ |
| 3 | Băng tìm kiếm Tin BĐS | :43 | Không có (trang không có từ khoá/lọc/sắp xếp — `phase-3-task-02.md:27`) | ⚠️ lệch change doc → spec delta / user xác nhận |
| 4 | Lọc phụ trong "Bộ lọc" | :46 | `RentalFilterPopover` (≥ lg, nút Đóng) / `RentalFilterSheet` (< lg); badge `secondaryFilterCount` | ✅ |
| 5 | Lưới 4 cột ≥ xl | :46, :82 | `xl:grid-cols-4` ở Rental/Project/PostListBody/NewsListBody/NewsHomeBody | ✅ |
| 6 | Lọc cũ còn, URL params không đổi | :82; SPEC F3 :69 | golden test `rental-filter-params`, `project-filter-params`; GET form thật; `FilterFields.tsx:117-179` | ✅ |
| 7 | "Có N kết quả" + sắp xếp cùng hàng | :44 | `RentalListPage.tsx:197-202`; Dự án `:128-138`; Tin BĐS `totalDocs` | ✅ |
| 8 | Thẻ trắng bo 20px | :25 | Rental/Project/PostCard đổi; **NewsCard** (`NewsCard.tsx:49`) chỉ bo ảnh | ⚠️ một phần |
| 9 | Tin tức: tab → Tin nổi bật → hàng danh mục + "Xem thêm" | :49-50, :83 | `NewsHomeBody.tsx`, `news-home.ts:38-58` (≤ 6 hàng, gồm danh mục con) | ✅ |
| 10 | Form tư vấn cuối Tin tức | :50, :83 | `NewsListPage.tsx:83,91-99` LeadForm `source="contact"` + Turnstile, mọi trang `/tin-tuc`, không ở danh mục | ✅ code; ❌ mâu thuẫn spec (C1) |
| 11 | Phân trang/canonical/offset không đổi | T03 | `buildMoreNews` giữ mọi bài truy cập được; metadata không đổi | ✅ ("Tin khác" là phần thêm) |
| 12 | VI/EN cùng bố cục | :85 | key VI/EN đủ cặp | ✅ |
| 13 | Không CLS, LCP NFR-01 | :85; SPEC :167 | banner cao cố định, băng trong luồng | ⚠️ chưa đo trình duyệt; 2 ảnh `priority`/trang |
| 14 | Responsive mobile | :85 | `ListSearchBar.tsx:43` `flex-col` → `lg:flex-row`; sort 375 đã sửa | ✅; residual h1 EN dài trong banner 240px |

## 2. Mâu thuẫn cần spec delta Phase 3
- **C1 (HIGH) Tin tức thu lead**: `SPECIFICATIONS.md:75` (F5) "Không thu lead" → `/tin-tuc` (mọi trang, không trang danh mục) có form "Tư vấn nhu cầu" `source=contact`; chi tiết tin vẫn không form. `:87` (F9) thêm "`/tin-tuc` (nguồn `contact`)". Intent `docs/BRD.md:121` + BR-10 `:201` cần duyệt qua change request (design-spec :513 đã ghi).
- **C2 (MEDIUM)** FR-ADM-20 `SPECIFICATIONS.md:94` còn ghi "Ngoài phạm vi (BL-020, Phase 3): banner ~240px, băng tìm kiếm" → mô tả đã giao: trang danh sách banner 240px cố định, đệm đáy 3rem chỉ khi có băng tìm kiếm đè; pháp lý/liên hệ/dịch vụ/404 giữ cỡ mặc định.
- **C3 (MEDIUM)** `:21` no-JS chỉ nêu Dự án/Tuyển dụng → thêm Cho thuê (GET thật; từ khoá + Loại không cần JS; Khoảng giá cần JS). F3 `:69` bố cục băng (Loại = `category`, Khoảng giá 4 mức, "Bộ lọc" popover/sheet + badge, sắp xếp ở hàng "Có N kết quả", 4 cột ≥ xl) + **bỏ thanh lọc dính mobile**. F2 `:66` `/du-an` Tỉnh + Trạng thái + Lọc, không từ khoá, không "Bộ lọc". F4 `:72` `/tin-bds` **không băng tìm kiếm**.
- **C4 (LOW)** F5 `:75` cấu trúc trang tin (trang 1: Tin nổi bật 1+4, hàng danh mục cấp 1 ≤ 6, "Tin khác"; trang 2+: lưới 4 cột; danh mục: banner compact + 4 cột, không form); `:21` thêm thẻ trắng bo 20px; quyết định NewsCard.
- Change doc: bảng tiến độ `:65` P3 "pending", Acceptance :82-83 chưa tick → cập nhật rồi publish (1.18.0 → 1.19.0, scope v23).

## 3. Docs as-built cũ
- `.context/design-spec.md:124` (§2.7) banner compact luôn đệm 3rem → nay chỉ khi `overlap`.
- `.context/design-spec.md:336-339` (S02) "lưới 3 cột", "1536 giữ 3 cột", "2 select 50/50" mâu thuẫn `:328`.
- `.context/design-spec.md:479` (S08) "lưới 3 cột", thiếu 1280 vs `:469`.
- `.context/design-spec.md:142` (§3.2 thẻ Dự án) `--text-h3` không khung → nay `text-h4`, thẻ trắng 20px viền, `p-4`; `:143-144` thêm thẻ trắng + `hover:shadow-md`.
- `docs/DESIGN.md:239` (Dự án), `:243` (Đăng tin BĐS) thiếu banner compact/băng/"Có N kết quả"/4 cột; `:241` Cho thuê nêu Bộ lọc popover/sheet + bỏ thanh dính.
- `docs/DESIGN.md:269` (Card) thêm Dự án + PostCard thẻ trắng.

## 4. Gap
- [PARTIAL] Băng tìm kiếm Tin BĐS → spec delta C3 hoặc user xác nhận ngoài phạm vi.
- [PARTIAL] NewsCard thẻ trắng → follow-up hoặc ghi spec Tin tức dùng thẻ ảnh.
- [MISSING docs] spec delta C1–C4, BRD :121/BR-10, sửa docs §3 — close-out primary, không cần sửa source.
- Residual: CLS/LCP chưa đo trình duyệt; 2 ảnh `priority`/trang; h1 EN dài trong banner 240px.

## Xử lý (primary, quyết định agent — user ủy quyền 2026-10-20)
- Tin BĐS không băng tìm kiếm: **chấp nhận** (không có lọc sẵn; thêm param mới = ngoài phạm vi) → ghi spec delta F4.
- NewsCard: **đổi sang thẻ trắng bo 20px** cho đồng bộ (close-out builder).
- C1 BRD: form tư vấn Tin tức có trong change doc user đã duyệt (§Tin tức) → cập nhật BRD :121 + BR-10 qua spec delta.
- §3 docs: sửa ở close-out builder.
