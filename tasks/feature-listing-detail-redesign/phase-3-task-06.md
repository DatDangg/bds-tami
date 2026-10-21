# feature-listing-detail-redesign · phase-3-task-06 — Gom MINOR, dọn component cũ, doc reconcile, kiểm tổng thể

- Nguồn: BL-052; MINOR mở từ review các task trước (primary liệt kê khi giao).
- Spec: 1.46.0 khối BL-052 (toàn bộ) + Acceptance change doc.
- Plan: phase 3 wave D (cuối cùng).
- Phụ thuộc: mọi task trước.

## Classification / Risk
- Type: **MODIFY** (dọn + doc).
- Risk: **MEDIUM** — xoá code chết dùng chung, doc as-built.
- Expected review level: **STRICT** (xoá component dùng chung).
- Blast radius: `src/components/detail/*` (component cũ BL-045 không còn dùng: `DetailGalleryHero`, `DetailTitleCard`, `DetailGalleryParts`, biến thể `DetailLayout` …), `src/components/listing/ListSearchBar*`, `src/components/projects/*` cũ (vd `NearbyTabs`, `ProjectFilters`, `ProjectSpecs`), rentals/posts cũ không còn dùng; `.context/design-spec.md`, `docs/DESIGN.md`, `docs/ERD.md`, `docs/API_SPEC.md`.

## Scope
1. Gom MINOR mở (danh sách primary đưa) — sửa hoặc ghi lý do để lại. Khối "Tin liên quan" chi tiết dự án (`ProjectListings.tsx`) chuyển sang thẻ Cho thuê / Tin BĐS biến thể mới (spec-validation r2 N3).
2. **Giữ** `DetailLayout` + phần dùng bởi `dich-vu/[slug]/page.tsx` và `careers/JobDetail.tsx`, `Pagination`, `PageHero` (BL-054 dùng). Xoá component / helper / i18n key không còn import (kiểm bằng grep + `knip`/tsc nếu có), không đổi hành vi; trang chủ + BL-054 chưa làm (Tin tức/Tuyển dụng/Liên hệ) **không** bị ảnh hưởng (chúng vẫn dùng component nào thì giữ).
3. Doc reconcile as-built: `.context/design-spec.md` (S02–S09 phần Dự án / Cho thuê / Tin BĐS + component mới), `docs/DESIGN.md` (khung danh sách / chi tiết mới), `docs/ERD.md` (đã cập nhật ở T01 — đối chiếu), `docs/API_SPEC.md` (`project` rentals; tham số `/du-an`, `/tin-bds` nếu doc liệt kê tham số trang).
4. Kiểm tổng thể: 6 trang (VI + EN) 1440 / 768 / 390, không JS, Lighthouse/LCP không tệ hơn rõ (ghi số nếu đo), `pnpm build`.

## Acceptance
- [ ] Không còn import chết; test xoá theo component xoá; không đổi hành vi trang khác.
- [ ] Doc as-built khớp code (không sửa intent docs).
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build` PASS.

## Quy ước song song (spec-validation r1 F2/F6)
- i18n: chỉ thêm key trong **namespace riêng của task** (ghi tên namespace trong báo cáo), thêm vào **cuối** object namespace đó ở `src/i18n/messages/vi.json` + `en.json`; không sắp xếp lại / format lại file. Primary gộp xung đột khi merge.
- Không sửa file thuộc task song song cùng wave (xem mục Plan / Blast radius); cần thì ghi vào báo cáo để primary chuyển.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## MINOR gom từ review phase 1–2 (change-request 2026-10-21)
- P1-T03: tách `DetailHeroMosaic` (> 50 dòng/hàm); hằng sticky dùng chung `DetailContactAside`/`DetailLayout`.
- P1-T06: tách hàm `ProjectDetail`; gom `ICON_SIZE`/nhãn Loại hình/quy mô ha lặp giữa `ProjectDetail` + `ProjectOverview`.
- P1-T05: `project-category-icon.ts` khớp theo đoạn slug (shophouse → Storefront, "land" ≠ "island") + test; tách `ProjectListPage`.
- P2-T01: `docs/ARCHITECTURE.md:127` `searchRentals` → `listRentals` + `listRentalProjectOptions`; hoàn 2 dòng chỉ đổi khoảng trắng ở `docs/API_SPEC.md`.
- P2-T03: `DetailInfoGrid` link ngoài/nội bộ bằng union type (không dựa `newTabLabel`).
- P3-T05 nhận: `report.ts` dòng ghi lỗi không tính vào "Đã điền" (P1-T07 r2 N1).
- Dọn key i18n cũ không dùng: `page.projects.sortLabel`, `page.projects.chips.*`, khoá cũ `page.projectDetail` / `page.rentalDetail` (ngoài `.v2`).
- Tin liên quan chi tiết dự án (`ProjectListings.tsx`) dùng thẻ biến thể mới (spec-validation r2 N3).
- P2-T02 (review r1): `RangeSliderFacet.tsx:78,82` nhánh chưa hydrate bỏ `step`/`max` hoặc `step="any"` (giá trị lẻ link cũ chặn submit không JS); `RentalSortControl.tsx:37` + `ProjectSortControl` gửi sort qua `navigate({ sort })` (tránh đè thay đổi lọc đang chờ); dọn key `page.rentals.resultSuffix`/`resultsFor`/`fields.amenitiesCount`, `card.negotiable`, `chips.*`, `mobile.*`, `active.label` (trừ key `HeroSearch` còn dùng) + khoá "Thoả thuận"; tách hàm `RentalListPage` (~115 dòng).
- P2-T02 gap → phase review: số đếm cho ô tích/chip Tiện ích, Phòng ngủ, Nội thất ở `/cho-thue` (spec khung chung) — P2-T01 chỉ trả đếm danh mục + tỉnh.
- P2-T03 M1 (phase review): `RentalPriceText.tsx:20` ký tự U+200B viết trực tiếp → `\u200B` (nếu P2-T02 chưa khép hết).
- P3-T01 (review r1): gom helper `selectOptions`/`nonNegativeNumber` lặp ở `PropertyPosts.ts:55-56` + `Rentals.ts:64-68` vào `src/shared/`; nhãn hướng nhà công khai Tin BĐS đang mượn `page.rentalDetail.direction` → cân nhắc namespace chung. (GIST index `location`: chỉ khi có lọc bản đồ — ngoài phạm vi.)
