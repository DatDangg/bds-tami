Agent: reviewer

# Review — feature-detail-aside-no-inner-scroll · phase-1-task-01 · round 1 (BL-031)

- Review level: **NORMAL**
- Reason: thay đổi UI-only ở shared component `DetailLayout` / `DETAIL_ASIDE_CARD_CLASS` (2 trang chi tiết); không auth/tenant/schema/API/data. Không có red-risk → không cần STRICT.
- Blast radius: `/du-an/[slug]`, `/en/projects/[slug]` (LeadFormSlot trong ProjectDetail), `/cho-thue/[slug]`, `/en/for-rent/[slug]` (SaleContactBox + khối ảnh RentalDetail). Chỉ ≥ lg cho thẻ phụ; pb-8 khối ảnh cho thuê ở mọi breakpoint.

## Diff đã xem
- `src/components/detail/DetailLayout.tsx` — bỏ `lg:max-h-[...]` + `lg:overflow-y-auto`; `top` = `min(calc(var(--sticky-top)_+_4.5rem),calc(100dvh_-_var(--detail-aside-h,0px)_-_1rem))`; `<aside>` → `DetailAsideFit`.
- `src/components/detail/DetailAsideFit.tsx` (mới, client, 36 dòng).
- `src/components/rentals/RentalDetail.tsx:144` — `pb-8` khối ảnh.
- Tests: `DetailLayout.test.tsx`, `rental-detail.test.tsx`, `project-detail.test.tsx`.

## Verify commands + result
- `pnpm vitest run src/components/detail src/components/projects src/components/rentals` → **13 files / 166 tests PASS**.
- `pnpm typecheck` → **PASS** (tsc --noEmit, 0 lỗi).
- `pnpm lint` → **0 error, 3 warning**: 2 có sẵn (`tools/task-dashboard/server.mjs`) + **1 MỚI do task**: `src/components/rentals/rental-detail.test.tsx:130:13 'container' is assigned a value but never used` (Builder ghi "2 warning có sẵn" — không khớp).

## Acceptance
| Acceptance | Kết quả | Bằng chứng |
|---|---|---|
| Thẻ không `max-h`/`overflow-y-auto` | OK | `DetailLayout.tsx:11`; test `not.toMatch(/max-h\|overflow-y/)` ở cả 3 file; evidence: overflow-y visible, max-height none |
| Thẻ vừa viewport dính dưới thanh mục con | OK | min() nhánh 1; evidence dự án 706px → top 88px |
| Thẻ cao hơn viewport không bị cắt, tới được nút gửi | OK | evidence cho thuê 842px → top 41.9 (=900−842−16), nút submit bottom 859 < 900 |
| Khoảng ảnh ↔ thanh mục con (cho thuê) | OK (rented: xem MINOR-3) | `RentalDetail.tsx:144` pb-8; evidence 32px; test `nav.previousElementSibling` pb-8 |
| Breadcrumb giữ; < lg không đổi | OK | breadcrumb không đụng; mọi thay đổi thẻ ở prefix `lg:`; `pt-6 lg:pt-0` giữ |
| vitest/lint/typecheck PASS | OK (lint có 1 warning mới) | trên |

## Kiểm kỹ thuật
- **Tailwind v4 arbitrary**: `_` → khoảng trắng trong `min()/calc()` đúng cú pháp (bắt buộc có space quanh `+`/`-` trong calc); fallback `var(--detail-aside-h,0px)` hợp lệ. Evidence computed `top: 41.9px` / `88px` trên :3000 xác nhận CSS được sinh và áp đúng.
- **SSR/hydration**: `DetailAsideFit` là client component nhận `children` từ Server Component (pattern hợp lệ, children vẫn render server). SSR/HTML không có `style` → không mismatch; biến chỉ ghi qua `style.setProperty` sau mount, React không quản `style` của `<aside>` (không có prop `style`) nên re-render không xoá biến. Trước hydrate fallback 0px = hành vi dính trên cũ (đã ghi residual risk).
- **Cleanup**: `observer.disconnect()` trong cleanup; guard `typeof ResizeObserver === "undefined"`; test cả hai nhánh.
- **firstElementChild**: dự án → `LeadFormSlot` (mang `DETAIL_ASIDE_CARD_CLASS`, `ProjectDetail.tsx:101`); cho thuê → div gốc `SaleContactBox.tsx:37`. Cả hai là phần tử con đầu của aside; test project/rental đã assert `aside.firstElementChild` mang class. Evidence đo 842/706px khớp thẻ.
- **a11y**: `aria-labelledby` được forward (test DetailLayout + rental + project assert giữ nguyên).
- **Rented**: thẻ phụ vẫn render (SaleContactBox luôn là aside) → cùng hành vi.
- Effect deps `[]`: ref card chụp 1 lần; aside children không thay phần tử gốc giữa render → chấp nhận.

## Đánh giá "~28px đầu thẻ nằm dưới thanh mục con khi dính đáy"
Thẻ cho thuê 842px > 900−88−16 = 796px khả dụng → khi dính đáy, top 42 < đáy thanh mục con (16+54=70) → 28px đầu thẻ bị thanh (z-sticky) che; trừ border+padding p-6 (~25px) chỉ ~3px dòng nhãn giá bị che, và người dùng đã cuộn qua phần này. Đây là hành vi chuẩn của sidebar dính khi cao hơn vùng khả dụng; ưu tiên của BL-031 là tới được nút gửi, đã đạt. **Chấp nhận được → MINOR** (không chặn).

## Responsive Checklist Gate (diff đụng UI)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | chỉ đổi `top` sticky + padding dọc; không đổi width/grid |
| Mobile-first / min-width | OK | thẻ phụ chỉ prefix `lg:`; pb-8 không prefix (mọi mốc, đúng yêu cầu) |
| Grid auto-fit/minmax, container không fixed px | OK / N/A | grid `minmax(0,1fr)_22rem` có sẵn, không đổi |
| Typography rem / clamp | N/A | không đổi typography |
| Spacing theo scale | OK | `pb-8` token scale; `1rem`/`4.5rem` rem |
| Media srcset/aspect-ratio | N/A | Gallery không đổi |
| Touch target ≥ 44px | N/A | không thêm control |
| Nav mobile | N/A | không đổi |
| Table | N/A | |
| Không `100vh` đơn thuần | OK | dùng `100dvh` |
| prefers-reduced-motion | N/A | không thêm animation |
| Không che lỗi bằng overflow:hidden | OK | bỏ hẳn overflow-y-auto, không thêm overflow-hidden |
| 375/768/1280 | OK (CSS math) | < lg (375/768) thẻ static như cũ, chỉ +32px dưới ảnh cho thuê; 1280 (≥ lg) sticky min() — đo thực tế ở 1440x900 bởi change-request, 1280 cùng nhánh lg |

## Skill gates
- aislop: skip — không nằm trong verify commands được allow cho reviewer; diff nhỏ, đọc tay không thấy slop.
- oxlint (anti-slop): skip, oxlint not configured (không có `.oxlintrc.json`); ESLint 0 error.
- ocr (open-code-review): skip, ocr not installed / không trong verify commands.
- AI-readable: OK — 0–1 indicator (tên rõ, hàm ngắn, không magic number ngoài `4.5rem`/`1rem` đã giải thích trong doc comment; comment giải thích WHY).
- ai-friendly-web: N/A — không đổi route/robots/sitemap.
- blitzstrike: N/A — không phải task bảo mật.

## Findings
- **[MINOR-1]** `src/components/rentals/rental-detail.test.tsx:130` — `const { container } = renderRental(fullRental);` không dùng → ESLint warning mới. Fix: `renderRental(fullRental);`. Verification summary ghi "2 warning có sẵn" là sai (thực tế 3).
- **[MINOR-2]** Khi thẻ cho thuê cao hơn vùng khả dụng (vd 842 > 796 ở 900px), ~28px đầu thẻ (≈3px nhãn giá sau padding) nằm dưới thanh mục con dính. Chấp nhận được; nếu muốn tinh chỉnh, task sau có thể giảm chiều cao thẻ (gap/padding) hoặc ghi vào residual risk/spec.
- **[MINOR-3]** Tin rented: `similarBlock` nằm giữa khối ảnh và thanh mục con (`RentalDetail.tsx:156`) — pb-8 tạo khoảng ảnh↔similarBlock, còn similarBlock↔thanh mục con không được đo/test. Acceptance ghi "cả tin rented" nhưng không có evidence trường hợp này; đề xuất ghi số đo rented vào task (hoặc residual risk). Không có ảnh (gallery rỗng) thì không có pb-8 — chấp nhận, nhưng nên ghi.
- **[MINOR-4]** Task file: Verification summary nói "không đo trên :3000" trong khi evidence change-request đã đo — nên cập nhật task file cho khớp evidence (Doc/evidence hygiene khi close-out).

Không có CRITICAL/MAJOR.

## Residual risk
- 1280px chưa đo trực tiếp (đo 1440x900); cùng nhánh `lg:` nên rủi ro thấp.
- Chiều cao viewport thấp (vd 1366x768): top âm → phần đầu thẻ ra ngoài viewport khi dính đáy; hành vi thiết kế chủ đích (D2), không verify bằng mắt.
- Pre-hydration/no-JS: 0px fallback → thẻ cao có thể bị cắt đáy tới khi hết lưới (đã ghi trong task).

## Verdict
**PASS** — không CRITICAL/MAJOR; 4 MINOR nên xử lý khi close-out (MINOR-1 1 dòng, MINOR-3/4 cập nhật task file).
