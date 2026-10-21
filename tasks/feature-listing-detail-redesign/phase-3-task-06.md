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
