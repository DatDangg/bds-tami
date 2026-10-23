# builder T02 (BL-027) — chi tiết cho thuê dùng DetailLayout
- Làm: RentalDetail dựng bằng DetailLayout/DetailSection (before=breadcrumb+băng+thư viện+[rented: tin tương tự], after=tin tương tự+ClickRef/StickyCta ngoài); RentalOverview (#overview, h1); RentalTerms nhận id (DetailSection / accordion rented); SaleContactBox thành thẻ DETAIL_ASIDE_CARD_CLASS; thêm src/lib/rentals/rental-detail-sections.ts (+test), i18n subNav/subNavLabel vi/en, test rental-detail.test.tsx.
- Không sửa src/components/detail/*. Verify: vitest 15 file/187 PASS, lint 0 error, typecheck PASS. Đã kiểm dev server 1280/375 (tin published).
- Dở: chưa kiểm mắt tin rented/768/reduced-motion. Chưa commit (theo yêu cầu).
