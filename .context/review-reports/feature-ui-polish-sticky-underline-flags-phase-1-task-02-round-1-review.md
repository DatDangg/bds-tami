Agent: reviewer

# Review — feature-ui-polish-sticky-underline-flags · phase-1-task-02 · round 1

- Task: `tasks/feature-ui-polish-sticky-underline-flags/phase-1-task-02.md` (BL-074 mục 2 — bỏ gạch chân link/nút/menu site công khai)
- Diff reviewed: `git diff -- src` (28 file, 47+/33-), branch `staging`, base 541dc36
- **Review level: STRICT**
- **Reason:** shared components toàn site (header `DesktopNav`, `Footer`/`FooterLinkColumn`, `ConsentCheckbox` dùng trong mọi form lead, `FormErrorSummary`, filter facets/panel, `CookieBanner`), có rủi ro a11y (WCAG 1.4.1 / 1.4.3 / focus-visible).
- **Blast radius:** header ≥ xl mọi trang; footer mọi trang; mọi form có consent / tóm tắt lỗi (lead, liên hệ, ứng tuyển, newsletter); bộ lọc `/du-an`, `/cho-thue`, `/tuyen-dung`; chi tiết dự án/cho thuê/tin tức/tuyển dụng; 404; cookie banner; announcement bar trang chủ. Không đổi API / schema / i18n / props / điều hướng (chỉ đổi className + 1 comment + 1 test).

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS — 436 files / 4592 tests (exit 0) |

Browser đo trực tiếp: không có công cụ browser trong quyền reviewer → phân tích CSS/token (xem Residual risk).

## Requirements coverage
- Grep `underline|decoration-|text-decoration` trong `src` (bỏ test): ngoài admin SCSS (ngoài phạm vi) chỉ còn `src/components/content/RichText.tsx:48` (`TEXT_CLASS.link`) — **OK**, đúng acceptance. `ListingCategoryTabs` không bị đụng — OK (giữ chỉ báo tab theo quyết định).
- Mọi chỗ bỏ gạch chân đều có `transition-colors duration-(--duration-fast)` + hover đổi màu/nền token — OK. Không chỗ nào xoá `focus-visible` sẵn có — OK.
- DesktopNav: bỏ `border-b-2`/`hover:border-text/40`/`aria-[current=page]:border-text`; thay `rounded-pill px-2.5 2xl:px-3` + `hover:bg-text/6` + `aria-[current=page]:bg-text/10`, giữ `min-h-11`, `aria-current` giữ nguyên logic. Khoảng cách chữ: gap 4px + 2×10px padding = 24px (2xl: 8 + 24 = 32px) giữ như cũ; tổng bề rộng nav tăng ~20px (padding đầu/cuối). Token `--color-text` nên nền hover/đang xem đúng cả trong `theme-dark-block`. Test mới khẳng định aria-current + nền + không `border-b|underline` — OK.
- Link giữa câu ngoài RichText: `ConsentCheckbox` (label `text-small` thường → link semibold), `CookieBanner` (`<p class="text-small">` thường → link semibold), `NewsArticleContactNote` (`<p>` thường, link đã semibold từ trước) → phân biệt bằng độ đậm + màu — OK (1.4.1).

## Contrast (1.4.3) — tính theo token `globals.css`
`--color-accent-text #8c6733` (L ≈ 0.155):
| Nền | Ratio | Chỗ dùng | Kết quả |
|---|---|---|---|
| `surface #ffffff` | 5.12 | CookieBanner, ConsentCheckbox, LazyMap, Detail*, filter | OK |
| `bg #f7f5f4` | ~4.7 | trang | OK |
| `primary-subtle #f8f3eb` | 4.63 | NewsArticleContactNote | OK (không đổi màu) |
| `warning-subtle #fbf1e0` | 4.57 | ApplyForm (không đổi màu), JobDetail expired link (mới accent) | OK (sát ngưỡng) |
| **`error-subtle #fbeae8`** | **4.40** | **FormErrorSummary tone error (hotline), RentalListPage ListError (retry)** | **FAIL** (`text-small`/14px semibold không phải large text, cần ≥ 4.5) |

## Findings

### [MAJOR] 1 — Regression tương phản AA: link hotline trong `FormErrorSummary` (tone mặc định `error`)
- `src/components/forms/FormStatus.tsx:76` — trước link kế thừa `text-text` (#141414, ~16:1); nay `text-accent-text` trên `bg-error-subtle` (dòng 58) = **4.40:1 < 4.5** ở cỡ `text-small` 14px semibold. Component dùng chung mọi form lead/liên hệ/ứng tuyển (hiện khi 429/lỗi hệ thống).
- Fix đề xuất: trong hộp lỗi/cảnh báo giữ màu chữ `text-text` (đã semibold, đứng riêng không giữa câu) và hover bằng token khác đạt AA, vd `hover:text-text-secondary` (#555 trên error-subtle ≈ 6.4:1) hoặc nền `hover:bg-text/6 rounded-sm`; hoặc dùng token chữ đậm hơn đã có. Không dùng `accent-text` trên `error-subtle`.

### [MAJOR] 2 — Regression tương phản AA: link "Thử lại" trong `ListError` trang cho thuê
- `src/components/rentals/RentalListPage.tsx:290` — `text-small font-semibold text-accent-text` trên `bg-error-subtle` (dòng 288) = **4.40:1**; trước kế thừa `text-text`. Fix như Finding 1.

### [MINOR] 3 — DetailInfoGrid: decision log không khớp thực tế (chữ quanh đã semibold)
- `src/components/detail/DetailInfoGrid.tsx:26,46` — `dd` đã `font-semibold text-text`, nên `font-semibold` thêm vào `LINK_CLASS` không tạo khác biệt; giá trị-link chỉ khác giá trị thường ở **màu**. Vì mỗi giá trị đứng riêng một ô (không nằm giữa câu) nên chưa tính vi phạm 1.4.1, nhưng task yêu cầu "chữ quanh đã semibold → dùng cách khác token-based + ghi decision log". Fix: bỏ `font-semibold` thừa, ghi decision log lý do (giá trị đứng riêng ô), hoặc thêm icon sẵn có (vd `ArrowUpRight` cho external) làm dấu hiệu không-màu.

### [MINOR] 4 — AnnouncementBar đổi trọng lượng chữ cả thanh
- `src/components/home/AnnouncementBar.tsx:68` — khi có `href`, toàn bộ text thành semibold (trước `font-medium` của `<p>`) và thêm `px-1` (lệch tâm/khoảng ~4px mỗi bên so với thanh không link). Contrast OK (#141414 trên #e0bf89 cao; hover nền `primary-foreground/10` vẫn tối chữ). Chấp nhận được; ghi decision log để khỏi bị coi là drive-by.

## Responsive Checklist Gate (diff đụng UI — chỉ phần thay đổi)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Layout không tràn ngang | OK (CSS math) | Chỉ đổi màu/nền/padding; DesktopNav chỉ hiện ≥ xl, khoảng cách chữ giữ 24/32px, tổng tăng ~20px; builder đo nav right ~923px < phần kế 1097px ở 1280 vi/en (không tự đo lại được) |
| Mobile-first media query | N/A | Không thêm breakpoint mới ngoài `2xl:px-3` (min-width) |
| Grid auto-fit/minmax | N/A | Không đụng grid |
| Font-size rem | OK | Không đổi cỡ chữ; class token `text-small`/`text-xsmall` (rem) |
| Heading fluid / spacing scale | N/A | Không đụng |
| Media (img/video) | N/A | Không đụng |
| Touch target ≥ 44px | OK | `min-h-11` giữ ở mọi link/nút đã sửa; ConsentCheckbox giữ `min-h-6` inline như trước (không đổi trong diff); AnnouncementBar thanh `min-h-11` |
| Nav mobile | N/A | MobileMenu không đổi |
| Table scroll | N/A | |
| 100vh | N/A | |
| prefers-reduced-motion | OK | `duration-(--duration-fast)` theo pattern có sẵn (token tức thì khi reduced-motion) |
| Không che lỗi bằng overflow:hidden | OK | Không thêm overflow |

## Skill gates
| Gate | Kết quả |
|---|---|
| aislop | skip — không có quyền chạy `aislop` (Bash chỉ verify commands + git); diff nhỏ, chỉ className, không thấy slop |
| oxlint (anti-slop) | skip, oxlint not configured (không có `.oxlintrc.json`); `pnpm lint` (eslint) PASS |
| ocr (open-code-review) | skip, ocr not installed / không được phép chạy |
| AI-readable | OK — 0 indicator mới (không hàm mới, không magic number ngoài token Tailwind, comment DesktopNav giải thích WHY) |
| ai-friendly-web | N/A — không đổi route/crawl/robots/sitemap |
| blitzstrike | N/A — không đụng auth/API/input |

## Residual risk
- Không đo được bằng browser: menu ≥ xl 1280 vi/en dựa vào số đo của builder + CSS math; hover/focus thực tế trên header dạng kính trong suốt trên hero ảnh chưa xác minh trực quan.
- `FormErrorSummary` trong `NewsletterSignup` (`theme-dark-block`): `accent-text` → `on-dark-accent #e0bf89` trên `error-subtle` sáng sẽ rất thấp tương phản nếu có truyền `hotline` ở đó (cần kiểm cùng lúc khi fix Finding 1; trước diff chữ trắng cũng đã kém — tồn tại sẵn một phần).
- JobDetail/ApplyForm `accent-text` trên `warning-subtle` = 4.57:1, sát ngưỡng.

## Verdict
**FAIL** — 2 MAJOR (regression tương phản AA 1.4.3 do đổi màu link sang `accent-text` trên nền `error-subtle`: `FormStatus.tsx:76`, `RentalListPage.tsx:290`). Lint/typecheck/test PASS; phần còn lại của acceptance đạt. Builder sửa 2 MAJOR (+ cân nhắc MINOR 3–4, ghi decision log) rồi review round 2.
