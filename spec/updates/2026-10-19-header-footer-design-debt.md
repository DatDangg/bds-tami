# Spec Update — 2026-10-19 header-footer-design-debt

**spec_version:** 1.3.0 → 1.4.0 (MINOR — hành vi mới ở khung trang: logo/CTA lấy từ CMS, header một hàng ≥ xl, accordion menu con và footer < md)

**Trigger:** feature-update (Change Request MODIFY, BL-001) — change doc `spec/changes/2026-10-19-header-footer-design-debt.md`, task `tasks/feature-header-footer-design-debt/phase-1-task-01.md` (header) + `phase-1-task-02.md` (footer + menu)

**Nguồn:** user quyết làm ngay trước go-live ngày 19/10/2026 (nợ thiết kế L5-T05 decision log; G18 spec-validation layer 5). Intent ghi vào `.context/design-spec.md`.

**Requirements:**
- SỬA **design-spec §2.1** (Header): ≥ xl **một hàng** — logo trái · 7 mục menu giữa (dropdown mục có con giữ nguyên) · tìm + VI|EN + nút CTA (nếu bật) + nút Menu phải; < xl không đổi. Thêm hàng **Logo** (`site-settings.logo` / `logoDark`, thiếu → logo tĩnh mặc định) và **Nút CTA** (global `header.ctaButton`: có nhãn ở locale đang xem + link → hiện; thiếu → ẩn, BR-07).
- SỬA **design-spec §2.2** (Menu toàn màn hình): mục có con có nút caret xổ **accordion** menu con (`aria-expanded` / `aria-controls`, dùng được bằng bàn phím, tắt chuyển động khi `prefers-reduced-motion`); menu dùng ở mọi breakpoint.
- SỬA **design-spec §2.4** (Footer): < md mỗi cột link là accordion (heading chứa nút, đóng mặc định), cột Liên hệ luôn mở; ≥ md lưới như cũ.
- SỬA **SPECIFICATIONS.md** Overview: thêm đoạn "Khung trang" tóm tắt các điểm trên.
- Liên quan (không đổi chữ): **FR-PUB-19** (nút VI/EN trên header, menu, footer), **BR-07** (nội dung EN không fallback tiếng Việt).

**Schema/API:** không đổi — dùng field đã có (`header.ctaButton`, `site-settings.logo`, `site-settings.logoDark`).

**Ảnh hưởng:**
- Component khung trang: `src/components/layout/{Header,BrandLogo,MobileMenu,Footer,DesktopNav,load-shell,shell-data,PublicShell}.*`.
- Mọi trang công khai `/` và `/en` (header/footer dùng chung).
- Retest: revalidate header/footer/site-settings, chuyển ngôn ngữ, dropdown menu xl, nút liên hệ nổi, cài đặt cookie ở footer.

**Docs đã cập nhật:** `.context/design-spec.md` §2.1/§2.2/§2.4, `SPECIFICATIONS.md` (Overview, version). Doc as-built reconcile ở close-out task.

**Scope sinh:** `spec/test-scope/current.json` scopeVersion 3
