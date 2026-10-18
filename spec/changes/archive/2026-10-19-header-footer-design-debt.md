---
id: header-footer-design-debt
type: feature
status: done
completed: 2026-10-19
created: 2026-10-19
backlog: BL-001
---

# Design debt header/footer: header 1 hàng ở xl, CTA/logo từ CMS, footer accordion < md, menu con accordion

## Yêu cầu
MODIFY (nợ thiết kế L5-T05 decision log; G18 spec-validation layer 5). User quyết 2026-10-19: làm ngay, trước go-live.
- Header ≥ xl: gộp thành **1 hàng** (logo trái, menu ngang giữa, ngôn ngữ + nút Menu/CTA phải) thay vì 2 hàng hiện tại.
- Website dùng `header.ctaButton` (khi bật) và logo nhập trong CMS (global `header`) thay vì giá trị cứng; thiếu dữ liệu CMS → fallback hiện tại.
- Footer < md: cột link thành accordion (nút tiêu đề cột, `aria-expanded`), ≥ md giữ lưới (design-spec §2.4).
- Menu toàn màn hình: mục có con xổ **accordion** menu con (design-spec §2.2), dùng được bằng bàn phím.

## Acceptance (bắt buộc)
- [x] ≥ xl header 1 hàng: logo trái · 7 mục menu giữa (dropdown mục có con giữ nguyên) · VI|EN + Menu (+ CTA nếu bật) phải; < xl không đổi
- [x] `header.ctaButton` bật trong CMS → nút CTA hiện trên header (nhãn/link từ CMS, đúng locale); tắt → ẩn
- [x] Logo upload trong CMS (global `header`) được dùng cho header; không có → logo mặc định
- [x] Footer < md: mỗi cột link là accordion đóng mặc định, nút tiêu đề có `aria-expanded`/`aria-controls`; ≥ md lưới như cũ
- [x] Menu toàn màn hình: mục có con có nút xổ accordion, `aria-expanded`, bàn phím OK, tắt animation khi reduced motion
- [x] Không vỡ revalidate header/footer ở `/` và `/en`; test cập nhật + `pnpm test`/lint/typecheck/build PASS
- [x] design-spec §2.1 (bố cục ≥ xl) cập nhật intent "1 hàng" (user đã quyết 2026-10-19)

## Ghi chú
Tham chiếu design-spec §2.1/§2.2/§2.4, L5-T05 decision log, spec-validation layer 5 G18.

## Kết quả (2026-10-19)
- phase-1-task-01 (be33577): header 1 hàng ≥ xl, CTA từ `header.ctaButton`, logo từ `site-settings.logo/logoDark` (decisions #7), STRICT PASS round 2.
- phase-1-task-02: footer accordion < md, accordion menu con trong menu toàn màn hình, STRICT PASS round 1.
- spec_version 1.4.0, test-scope scopeVersion 3.
