# feature-site-redesign-homepage-style · phase-1-task-04 — Khung chi tiết mới (ảnh lớn kiểu hero + khối tiêu đề nổi có dải thông số + mục thẻ trắng + slider "tương tự") + áp cho Chi tiết Dự án (BL-045)

- Change doc: `spec/changes/2026-10-21-site-redesign-homepage-style.md` (BL-045) mục 2. Spec delta: khối BL-045 mục "Trang chi tiết" (Q7, Q8 đã chốt).
- **Mockup bắt buộc Read:** `docs/specs/site-redesign-mockup/index.html` view `detail-project` (`.gal`, `.counter`, `.thumbs`, `.dhead`, `.facts`, `.subnav`, `.block`, `.aside`, `.sec.white .shead.left`, `.slider`), DECISIONS #4, #5, #6.
- Phụ thuộc: **T01** (breadcrumb overlay, SectionHeading, ConsultBanner), **T02** (`ProjectCard`, `CardSlider`). T05 phụ thuộc task này.
- Song song: **được** với T03, T06, T07 (wave B). Trùng duy nhất `vi/en.json` (namespace `page.projectDetail.*`, `page.detail.*`).
- Trạng thái: `pending` — **plan đã duyệt 2026-10-21** (user chốt Q1–Q9 theo đề xuất; xem khối BL-045 trong `SPECIFICATIONS.md`).

## Ràng buộc user
Như T01. Giữ nguyên component chức năng (bản đồ, lân cận tab, mặt bằng, bảng giá, hỏi đáp + JSON-LD FAQPage, pháp lý/tài liệu, LeadForm `source=project`, scroll-spy BL-027/028/029, aside dính BL-031, header ẩn khi cuộn trên trang chi tiết).

## Classification / Risk
- Type: **MODIFY** (bố cục chi tiết F2; thay BL-027 "một thẻ trắng" cho trang này).
- Risk: **HIGH** — `src/components/detail/*` dùng chung với `PostDetail` (Tin BĐS) và `tin-tuc/[slug]`; LCP ảnh; slider/lightbox client.
- Expected review level: **STRICT** (shared layout).
- Blast radius: `/du-an/[slug]` (+ `/en`); `DetailLayout`/`DetailSection` cũng render Tin BĐS + tin tức → **phải giữ biến thể một thẻ** (mặc định) để 2 trang đó không đổi ở task này.
- Doc impact: design-spec S03, `docs/DESIGN.md` — T08.

## Scope / files
1. **`DetailGalleryHero`** mới `src/components/detail/DetailGalleryHero.tsx` (client nhỏ): ảnh lớn `min(78vh,640px)` (< md 480px), ảnh 1 `priority`, scrim token; breadcrumb overlay (T01) góc trên-trái; mũi tên tròn hai mép (nút `aria-label`, ≥ md); đáy trái bộ đếm `01 / N` (`aria-hidden`) + thanh tiến trình (như `HeroSlider` BL-044); đáy phải ảnh nhỏ (≤ 4, nút `aria-label`, `aria-current`) + "Xem tất cả ảnh" (mở `src/components/media/Lightbox.tsx` sẵn có) + slot nút "Video" (T05); vuốt + ←/→; không autoplay; 1 ảnh → ẩn mũi tên/bộ đếm; 0 ảnh → nền tối cùng chiều cao.
2. **`DetailTitleCard`** mới `src/components/detail/DetailTitleCard.tsx`: thẻ trắng nổi đè đáy ảnh (như `.dhead`): trái eyebrow loại hình + badge, `h1`, ghim vị trí; phải "Giá từ" + giá vàng (`text-accent-text` AA) + nút chia sẻ tròn (tái dùng cơ chế `PostShare`/`ShareButtons`: Web Share → menu); **dải thông số trong thẻ** (`.facts`, ngăn đường kẻ, icon tròn `bg-primary-subtle` + giá trị đậm `text-text` + nhãn muted), ô trống bị bỏ. Prop `facts: {icon,label,value}[]`.
3. **Mục thẻ** `src/components/detail/DetailSection.tsx` + `DetailLayout.tsx`: thêm `sectionStyle="cards"` (mỗi mục thẻ trắng bo 20px + eyebrow vàng + `h2`), mặc định giữ kiểu một thẻ (Tin BĐS, tin tức không đổi). Thanh mục con chip giữ hành vi.
4. **Chi tiết Dự án** `src/components/projects/ProjectDetail.tsx`, `ProjectHero.tsx` (thay bằng hai component trên; xoá file nếu hết dùng), `ProjectSpecs.tsx` (→ facts: quy mô `scale.landAreaM2`, số sản phẩm `scale.totalUnits`, chủ đầu tư, bàn giao `handoverTime`; phần thông số còn lại vào mục Tổng quan), `ProjectOverview.tsx`, `ProjectStickyCta.tsx` (giữ < lg), `src/lib/projects/project-detail-view.ts` (`visibleSections` **bỏ `gallery`** — Q7; thứ tự hiện có). Mục theo spec: Tổng quan · Nổi bật · Vị trí (gồm lân cận) · Tiện ích · Mặt bằng · Pháp lý · Chính sách · Bảng giá · Tin liên quan · Hỏi đáp (không "Tiến độ"). Cuối trang: `section` nền trắng, `SectionHeading` canh trái ("Có thể bạn quan tâm" / "Dự án tương tự") + `CardSlider` của `ProjectCard` (nguồn "Dự án khác" hiện có) → `ConsultBanner actionHref="#lead-form"` + nút phụ `tel:` (Q8).
5. **i18n** `page.projectDetail.*`, `page.detail.*` (eyebrow mục, nhãn thông số, counter, nút).
6. **Tests**: `DetailGalleryHero.test.tsx`, `DetailTitleCard.test.tsx`, `DetailLayout`/`DetailSection` (biến thể cards + mặc định không đổi), `project-detail-view.test.ts`, `ProjectDetail` tests, `FloorPlans`/`NearbyTabs` (**dirty EOL — chỉ phần mình**), FAQ JSON-LD giữ, 1 `h1`.

## Acceptance
- [ ] `/du-an/<slug>` khớp `detail-project` ở **1440 + 390** (ảnh lớn + breadcrumb khung mờ + bộ đếm/thanh tiến trình + ảnh nhỏ + "Xem tất cả ảnh"; khối tiêu đề nổi chứa dải thông số; thanh chip dính; mục thẻ trắng eyebrow+tiêu đề; thẻ tư vấn dính phải; nền `--color-primary-subtle`; slider "Dự án tương tự" canh trái nền trắng; banner tư vấn).
- [ ] Bản đồ, lân cận, mặt bằng, bảng giá, hỏi đáp, pháp lý/tài liệu, form lead, scroll-spy hoạt động như trước; `/tin-bds/[slug]` và `/tin-tuc/[slug]` **không đổi** (chụp trước/sau).
- [ ] LCP ảnh 1 `priority`, không CLS; lightbox mở/đóng bàn phím; 1 `h1`; AA.
- [ ] Không hex mới; `pnpm test` / `pnpm typecheck` / `pnpm lint` PASS.

## Verify
`pnpm vitest run src/components/detail src/components/projects src/lib/projects src/components/media src/components/ui` → `pnpm typecheck` → `pnpm lint` → xem thật http://localhost:3000 (không chạy thêm `pnpm dev`) 1440 + 390, chụp màn hình (`.context/review-reports/assets/site-redesign-t04-*.png`).

## Retry / Escalation
Như T01; attempt 2 so pattern `HeroSlider` (bộ đếm), `DetailLayout` BL-027/031.

## Verification summary (builder điền)
- Acceptance criteria: PASS (xem tay 1440 + 390 trên dự án DB dev; bộ đếm/ảnh nhỏ xem bằng trang preview tạm 12 ảnh vì dữ liệu dev chỉ 1 ảnh/dự án)
- Verify commands + result: pnpm typecheck OK · pnpm lint 0 error · pnpm vitest run src → 250 file / 2457 test PASS
- Quyết định (tự chốt): (1) kiểu thẻ qua biến thể Tailwind group (`group/detail` + `data-section-style="cards"`) thay vì truyền prop xuống từng khối; Tin BĐS/tin tức/Cho thuê giữ nguyên "một thẻ" (mặc định single). (2) eyebrow mục = nhãn ngắn riêng (Giới thiệu, Giá trị, Kết nối, Cuộc sống, Thiết kế, Minh bạch, Ưu đãi, Giá bán, Cơ hội, Giải đáp) ở `page.detail.eyebrow.*`. (3) Dải thông số dùng `ul` (không `dl`) vì có icon; quy mô = diện tích đất, chủ đầu tư là tên (link website vẫn ở Tổng quan khi có). (4) Nút phụ banner: thêm prop `secondary` cho `ConsultBanner` (tel: hotline thắng nút CMS). (5) Banner dựng ở page.tsx rồi truyền qua prop `consultBanner` (ConsultBanner là async). (6) Pháp lý + Chính sách gói trong MỘT thẻ 2 cột (giữ LegalPolicy accordion). (7) Bỏ mục "Thư viện" khỏi `SECTION_IDS`. (8) Slider "tương tự" bọc container để thẻ đầu thẳng hàng tiêu đề. (9) Header vẫn trong luồng (không overlay) như các trang con T01. (10) Nút chia sẻ: Web Share, không có thì menu `ShareButtons`.
- Lệch so với mockup + lý do: tiêu đề thẻ/giá dùng token `text-h2-sm`/`text-price`; arrows nền tối mờ thay vì glass sáng (độ đọc trên ảnh sáng); không có "Tiến độ"/"Lân cận" chip riêng (Lân cận nằm trong Vị trí theo spec).
- Reviewer verdict: (chờ)
