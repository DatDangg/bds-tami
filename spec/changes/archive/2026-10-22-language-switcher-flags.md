---
id: language-switcher-flags
type: feature
status: done
completed: 2026-10-22
spec_version: 1.51.0
scopeVersion: 67
review: NORMAL PASS r1 — .context/review-reports/feature-language-switcher-flags-phase-1-task-01-round-1-review.md
created: 2026-10-22
---

# Nút đổi ngôn ngữ dùng cờ vuông thay chữ VI | EN

## Yêu cầu
Nút đổi ngôn ngữ (header desktop, menu mobile, footer) hiện là chữ "VI | EN". Đổi sang **cờ vuông** (user chọn 2026-10-22): cờ Việt Nam cho `vi`, cờ Anh (UK) cho `en`,
chỉ cờ, không chữ. Ngôn ngữ đang chọn rõ ràng (đậm/viền), ngôn ngữ kia mờ hơn, hover sáng lên.

## Acceptance (bắt buộc)
- [x] Header (desktop + header nổi khi cuộn), menu mobile, footer: hiện 2 cờ vuông thay chữ; bấm đổi đúng URL ngôn ngữ như hiện tại (giữ đường dẫn tương ứng).
- [x] Cờ là SVG inline/tĩnh (không emoji — emoji cờ không hiện trên Windows), góc vuông (bo rất nhẹ ≤ 2px được), kích thước đều nhau, nét trên nền sáng lẫn nền tối/hero.
- [x] Trạng thái đang chọn phân biệt không chỉ bằng màu; `aria-label` "Tiếng Việt" / "English", `aria-current` cho ngôn ngữ hiện tại, `lang`/`hreflang` giữ nguyên.
- [x] Vùng bấm ≥ 24px (mobile ≥ 44px); test `LanguageSwitcher.test.tsx` cập nhật.

## Ghi chú
- File: `src/components/layout/LanguageSwitcher.tsx` (+ `Header.tsx`, `MobileMenu.tsx`, `Footer.tsx`).
