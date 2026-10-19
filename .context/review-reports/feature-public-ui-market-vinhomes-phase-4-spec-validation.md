Agent: spec-validator

# Spec validation: feature-public-ui-market-vinhomes (BL-020) · Phase 4 (chi tiết dự án)
> Report do primary lưu (guard chặn ghi `.context/review-reports/**` trong worktree). Nội dung theo báo cáo spec-validator.

- Scope: worktree `D:/prj/bds/.claude/worktrees/bl020-p3p5`, commit 80ba71e (P4-T01 NORMAL PASS r2), 27f5ddb (P4-T02 STRICT PASS r1) trên 9588007 (spec 1.19.0 / scope v23). Chỉ đọc.

## Verdict lần 1: GAPS FOUND
Code khớp phạm vi P4, không thiếu. Gap: spec delta chưa publish (dự kiến close-out), 1 dòng as-built cũ, 1 MINOR chuyển P5.

## Coverage
| # | Yêu cầu | Nguồn | Trạng thái | Hiện thực |
|---|---|---|---|---|
| 1 | Hero ảnh + h1 serif viết thường | change doc:53; SPEC:21 | ✅ | `ProjectHero.tsx`; ảnh `priority` (LCP); design-spec:348 |
| 2 | Menu neo dính viên thuốc | :53 | ✅ | `ProjectSubNav.tsx:14-15` (observer -176px), `ProjectSection.tsx:29` (+4.5rem); mục "Khu", "Giá & quỹ căn" cần schema → P5 |
| 3 | Thẻ "Tư vấn 1:1" dính phải ≥ lg | :91 | ✅ | `ProjectDetail.tsx:34-35,84,109-123` lưới 22/24rem, sticky, max-h, cuộn trong; 1 LeadForm |
| 4 | Lead dự án `source=project` | SPEC F9:87; BRD FR-PUB-03:138 | ✅ | `ProjectDetail.tsx:120`; < lg `ProjectStickyCta` → `#lead-form` |
| 5 | Tin liên quan (đúng dự án + locale, không N+1, ẩn khi trống) | :54,56,91 | ✅ | `project-listings.ts:26-44` qua `findPublicList`; 2 truy vấn song song + 1 ảnh gom; `visibleSections` ẩn khối + mục menu (`project-detail-view.ts:182-212`) |
| 6 | Mục "Tin liên quan" trên menu neo | design-spec:350 | ✅ | `SECTION_IDS` + i18n VI/EN |
| 7 | CTA tham quan cuối trang | :54 | ✅ (một phần so với market) | `ProjectDetail.tsx:142-148` CtaBanner tối → `#lead-form` + `tel:`; không ảnh (quyết định agent, không field CMS) |
| 8 | Restyle khối | task 02:16 | ✅ | Location/Amenities/LegalPolicy (T01), FloorPlans/Documents (T02), Thư viện thẻ tối 20px |
| 9 | ISR làm mới khi tin liên quan đổi | SPEC F10:89 | ✅ | hook `revalidate-project-on-listing.ts` (dự án cũ + mới, vi/en), `Rentals.ts:141-142`, `PropertyPosts.ts:66`; ưu đãi hết hạn rơi theo `revalidate = 60` |
| 10 | VI/EN cùng bố cục | :92 | ✅ | `listings.*`, `visitCta.*` VI/EN; `/en` chỉ tin có EN |
| 11 | Không CLS, LCP | :92; NFR-01 | ✅ (tĩnh) | thẻ lazy, hero `priority`; chưa đo CWV |
| 12 | Phần cần schema tách phase | :56,91 | ✅ | P5 |
| 13 | Tick acceptance / dòng tiến độ P4 | :66,91 | ⏳ | close-out |

## Gaps
- **[HIGH, spec delta]** `SPECIFICATIONS.md:66` (F2) chưa mô tả bố cục chi tiết mới → thêm "Bố cục chi tiết (BL-020 P4)": hero h1 serif viết thường 400; thanh mục con viên thuốc dính (Tổng quan · Vị trí · Tiện ích · Mặt bằng · Pháp lý · Chính sách · Thư viện · Tin liên quan khi có); ≥ lg 2 cột + thẻ "Tư vấn 1:1" dính phải (hotline + 1 LeadForm `source=project`), < lg thẻ sau Tài liệu + giữ CTA dính đáy; "Tin liên quan" ≤ 4 cho thuê `published` + ≤ 4 Tin BĐS ưu đãi chưa kết thúc, quy tắc công khai như danh sách, `/en` chỉ tin có EN, ẩn khi trống, không "Xem thêm"; CTA "Đăng ký tham quan" cuối trang → `#lead-form` + `tel:`, chữ i18n.
- **[MEDIUM, spec conflict]** `SPECIFICATIONS.md:63` (F1) "Lưu/ẩn/xoá tin cho thuê hoặc tin tức … **chỉ** làm mới trang chủ" — nay tin cho thuê/Tin BĐS công khai còn làm mới chi tiết dự án cũ + mới → sửa câu hoặc thêm quy tắc revalidate vào F2.
- **[LOW]** `SPECIFICATIONS.md:21` (§Giao diện) thêm ghi chú chi tiết dự án 2 cột + thẻ tư vấn dính, bỏ nền section xen kẽ.
- **[LOW, intent, cần user]** `docs/BRD.md:138` FR-PUB-03 chưa nêu tin liên quan / CTA tham quan — thuần hiển thị, không nguồn lead mới → bump BRD tuỳ chọn.
- **[LOW, as-built]** `.context/design-spec.md:86` còn "+ 3.5rem" → code dùng +4.5rem.
- **[MINOR carry-over]** `ProjectListings.tsx:47` RentalCard `sizes` lưới 4 cột → đã ghi `phase-5-task-02.md`.
- **[LOW, có sẵn]** `SPECIFICATIONS.md:11` "Trạng thái: đã duyệt thiết kế, chưa có code" cũ.

## Docs as-built
design-spec S03:345-374 + `docs/DESIGN.md:240` khớp code; `.context/design-spec.md:86` là dòng cũ duy nhất. `docs/API_SPEC.md`, `docs/ERD.md` không ảnh hưởng (không schema/API, Migration: none).

## Residual risk
DB worktree không có tin gắn dự án → chưa thấy khối "Tin liên quan" với dữ liệu thật (test mock); CLS/LCP chưa đo thực địa.

## Xử lý (primary, quyết định agent — user ủy quyền 2026-10-20)
1. Spec delta HIGH + MEDIUM + LOW §Giao diện + dòng trạng thái :11 → spec-publisher 1.20.0 / scope v24.
2. `.context/design-spec.md:86` → +4.5rem: **primary đã sửa**.
3. Change doc P4 done + tick acceptance :91 (giữ :92 tới P5).
4. BRD FR-PUB-03: **không bump** — thay đổi thuần hiển thị, không nguồn lead mới (khác P3).
