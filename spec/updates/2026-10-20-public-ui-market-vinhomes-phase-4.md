# Spec Update — 2026-10-20 public-ui-market-vinhomes Phase 4 (chi tiết dự án)

**spec_version:** 1.19.0 → 1.20.0 (MINOR — bố cục/hành vi mới ở trang chi tiết dự án + quy tắc làm mới cache mới; không đổi schema/DB, migration, API endpoint, quyền, tham số URL, nguồn lead)

**Trigger:** feature-update (Change Request BL-020, **Phase 4/5**). Change doc `spec/changes/2026-10-19-public-ui-market-vinhomes.md` (vẫn mở). Plan: `tasks/feature-public-ui-market-vinhomes/README.md`. Task `phase-4-task-01.md`, `phase-4-task-02.md`. Spec-validation phase 4: `.context/review-reports/feature-public-ui-market-vinhomes-phase-4-spec-validation.md` (GAPS FOUND: HIGH F2, MEDIUM F1 xung đột, LOW §Giao diện / dòng trạng thái → xử lý bằng delta này; `.context/design-spec.md:86` +4.5rem đã sửa ở close-out).

> **Delta này chỉ là Phase 4/5.** P1 1.16.0 / v19, P2 1.17.0 / v20, P3 1.19.0 / v23. Còn mở: **P5** schema dự án (highlights, nearbyAmenities, priceTable, faqs; mục "Khu", "Giá & quỹ căn" trên thanh mục con).

## Đã làm (Phase 4)

| Task | Loại | Commit | Nội dung | Review |
|---|---|---|---|---|
| P4-T01 | MODIFY (UI) | `80ba71e` | Hero h1 serif viết thường 400 (ảnh `priority`); thanh mục con viên thuốc trắng dính dưới header nổi (scroll-margin +4.5rem, observer 176px, `aria-current`); ≥ lg 2 cột + thẻ "Tư vấn 1:1" sticky phải (hotline + LeadForm duy nhất `source=project`, `aside aria-labelledby`, cao ≤ viewport còn lại, cuộn trong); < lg thẻ sau Tài liệu + giữ `ProjectStickyCta`; bỏ nền section xen kẽ, Thư viện thẻ tối 20px; `LeadFormSlot` prop `headingId` | NORMAL FAIL r1 (pill che thẻ khi nhảy `#lead-form` mobile) → PASS r2 |
| P4-T02 | MODIFY (UI) + cache | `27f5ddb` | Khối "Tin liên quan" (≤ 4 cho thuê `published` + ≤ 4 Tin BĐS chưa kết thúc, qua `findPublicList`, 2 truy vấn song song + ảnh gom, không N+1; ẩn khi trống, mục menu theo); CTA "Đăng ký tham quan" (`CtaBanner` → `#lead-form` + `tel:`); restyle Mặt bằng / Tài liệu; hook Rentals / PropertyPosts làm mới chi tiết dự án cũ + mới (vi/en) | STRICT PASS r1 |
| close-out | docs | (commit chứa file này) | `.context/design-spec.md:86` +3.5rem → +4.5rem; spec delta này | — |

## Quyết định agent (user ủy quyền 2026-10-20 — "tự quyết định đừng hỏi lại")

1. Thanh mục con = viên thuốc trắng, thanh nổi thứ hai giữ khe dưới header nổi; `scroll-margin` / observer bù +4.5rem (176px).
2. ≥ lg lưới `1fr` + 22rem (xl 24rem); thẻ "Tư vấn 1:1" sticky cột phải chứa hotline + **LeadForm duy nhất** của trang, cao tối đa = viewport còn lại, cuộn trong thẻ.
3. < lg: thẻ tư vấn nằm sau Tài liệu, giữ `ProjectStickyCta` dính đáy.
4. Bỏ nền section xen kẽ full-bleed (không hợp lưới 2 cột) — phân tách bằng đường kẻ; Thư viện thành thẻ tối bo 20px; Tiện ích 3 cột ở lg, Vị trí và Pháp lý/Chính sách chia cột từ xl.
5. Tiêu đề thẻ giữ "Nhận thông tin dự án" (spec/test/SEO đang dùng).
6. "Tin liên quan" trong cột chính sau Tài liệu, mục cuối thanh mục con; 2 nhóm Cho thuê (≤ 4, chỉ `published`, không gợi ý căn đã thuê) / Tin BĐS (≤ 4, chưa kết thúc ưu đãi); ẩn nhóm/khối khi trống; nhãn nhóm là `<p>` (h3 thẻ ngay dưới h2).
7. **Không "Xem thêm"** ở Tin liên quan — danh sách chưa có tham số URL lọc theo dự án, không thêm tham số mới.
8. CTA "Đăng ký tham quan" dùng lại `CtaBanner` tối cuối trang (→ `#lead-form`, nút phụ `tel:` hotline khi có), chữ i18n, không ảnh, **không field CMS mới**.
9. Hook làm mới chi tiết dự án **cũ + mới** (vi/en) khi tin công khai đổi; không đụng danh sách / trang chủ (trang chủ vẫn theo hook F1 sẵn có).
10. **BRD không bump** (`docs/BRD.md` FR-PUB-03 giữ nguyên): thay đổi thuần hiển thị, không thêm nguồn lead (lead dự án vẫn `source=project` như cũ) — khác P3 (thêm điểm thu lead `/tin-tuc`).

## Requirements (SPECIFICATIONS.md)

- **F2 — "Bố cục chi tiết (BL-020 P4)"** (HIGH): hero, thanh mục con viên thuốc dính, 2 cột ≥ lg + thẻ "Tư vấn 1:1" dính (1 LeadForm `source=project`), < lg thẻ sau Tài liệu + CTA dính, Tin liên quan (quy tắc công khai, `/en` chỉ tin EN, ẩn khi trống, không "Xem thêm"), CTA tham quan → `#lead-form` + `tel:`.
- **F2 — "Làm mới chi tiết dự án"** + **F1** (MEDIUM, hết xung đột): F1 bỏ chữ "chỉ" — tin cho thuê / Tin BĐS gắn dự án còn làm mới chi tiết dự án cũ + mới (vi/en); không làm mới danh sách/trang chủ vì lý do này.
- **§Giao diện** (LOW): chi tiết dự án 2 cột ≥ lg + thẻ tư vấn dính, không nền section xen kẽ.
- **Dòng trạng thái** (LOW): "đã duyệt thiết kế, chưa có code" → "đã build, đang vận hành — thay đổi qua `/change`".
- **Không đổi:** URL `/du-an/<slug>` / `/en/projects/<slug>`, metadata, JSON-LD, canonical, sitemap; nguồn lead; F9.

## Schema / Migration / API

- Schema/DB: **không đổi**, không migration.
- API: không endpoint mới; form thẻ tư vấn gọi `POST /api/leads` `source=project` + `sourceId` như cũ.
- Quyền: không đổi. Hook mới chỉ `revalidatePath` (đọc `projects.slug` `overrideAccess`, `trash: true` để lấy cả dự án cũ đã xoá mềm).

## Hành vi bị thay thế

| Trước | Sau (BL-020 P4) |
|---|---|
| Chi tiết dự án 1 cột, section nền xen kẽ tràn viền | ≥ lg 2 cột + thẻ "Tư vấn 1:1" sticky; khối phân tách bằng đường kẻ |
| Form lead dự án là 1 section trong luồng | Một LeadForm duy nhất trong thẻ tư vấn (sticky ≥ lg / sau Tài liệu < lg) |
| Không có tin cho thuê / Tin BĐS trên chi tiết dự án | Khối "Tin liên quan" (≤ 4 + ≤ 4) |
| Không CTA tham quan | Banner "Đăng ký tham quan" cuối trang |
| Đổi tin cho thuê / Tin BĐS không làm mới chi tiết dự án (chờ ISR) | Làm mới ngay chi tiết dự án cũ + mới (vi/en) |

## Ảnh hưởng

- Trang công khai: `/du-an/<slug>` + `/en/projects/<slug>`.
- Component: `ProjectDetail`, `ProjectHero`, `ProjectSubNav`, `ProjectSection`, `ProjectListings`, `FloorPlans`, `Documents`, `LegalPolicy`, `ProjectAmenities`, `ProjectLocation`, `LeadFormSlot` (prop `headingId` tuỳ chọn — form khác không đổi).
- Collection hook: `Rentals`, `PropertyPosts` (thêm afterChange/afterDelete làm mới chi tiết dự án).

**Residual:** DB worktree không có tin gắn dự án → khối "Tin liên quan" có dữ liệu mới thấy qua test mock; CLS/LCP chưa đo thực địa; `RentalCard` `sizes` lưới 4 cột trong khối (carry-over `phase-5-task-02.md`).

**Scope sinh:** `spec/test-scope/current.json` scopeVersion 24
