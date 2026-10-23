Agent: reviewer

# Review — feature-ui-polish-sticky-underline-flags · phase-1-task-02 · round 2

- Task: `tasks/feature-ui-polish-sticky-underline-flags/phase-1-task-02.md` (BL-074 mục 2 — bỏ gạch chân link/nút/menu site công khai)
- Round 1: `.context/review-reports/feature-ui-polish-sticky-underline-flags-phase-1-task-02-round-1-review.md` (FAIL — 2 MAJOR contrast + 2 MINOR)
- Diff reviewed: `git diff -- src` (28 file, 47+/33-, cùng tập file/số dòng với round 1; chỉ 2 dòng fix khác), branch `staging`, base 541dc36
- **Review level: STRICT**
- **Reason:** shared components toàn site (DesktopNav, Footer, ConsentCheckbox, FormErrorSummary dùng mọi form lead/liên hệ/ứng tuyển, filter facets, CookieBanner) + rủi ro a11y (WCAG 1.4.1 / 1.4.3 / focus-visible).
- **Blast radius:** như round 1 — header ≥ xl, footer mọi trang, mọi form có consent/tóm tắt lỗi, bộ lọc `/du-an` `/cho-thue` `/tuyen-dung`, trang chi tiết, 404, cookie banner, announcement bar. Round 2 chỉ đổi thêm `FormErrorSummary` hotline link (LeadForm, ApplyForm — NewsletterSignup không truyền `hotline`) và `ListError` "Thử lại" trang cho thuê. Không đổi API/schema/i18n/props/điều hướng.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS — 4592/4592 tests (exit 0) |

## Round-1 findings — closure
| # | Finding | Trạng thái | Bằng chứng |
|---|---|---|---|
| MAJOR 1 | `FormStatus.tsx:76` hotline `accent-text` trên `error-subtle` 4.40:1 | **Resolved** | Nay `font-semibold rounded-sm px-1 text-text transition-colors duration-(--duration-fast) hover:bg-text/6`. `#141414` trên `#fbeae8` ≈ **15.7:1**; khi hover (6% `#141414` phủ lên → ~`#eddddb`) ≈ **13.9:1**; tone `warning` (`warning-subtle`) tương tự > 15:1. Hover thấy được qua nền token (cùng pattern DesktopNav đã chấp nhận). Không xoá focus-visible: link dùng outline toàn cục `:focus-visible { outline: 2px solid var(--color-focus-ring) }` (`globals.css:374`). Ngữ cảnh tối: `NewsletterSignup.tsx:84-90` không truyền `hotline` → residual risk round 1 không áp dụng. |
| MAJOR 2 | `RentalListPage.tsx:290` "Thử lại" `accent-text` trên `error-subtle` | **Resolved** | Cùng class như trên → ≈ 15.7:1 / hover ≈ 13.9:1; focus-visible toàn cục giữ. |
| MINOR 3 | DetailInfoGrid decision log | **Resolved (decision log)** | Task file decision log ghi rõ: `dd` đã semibold, mỗi giá trị đứng riêng ô, link khác màu + hover; chấp nhận không thêm icon. Chấp nhận được (không nằm giữa câu → không vi phạm 1.4.1). |
| MINOR 4 | AnnouncementBar semibold + px-1 | **Resolved (decision log)** | Decision log giải thích lý do (link đậm hơn chữ `font-medium`, px-1 làm đệm nền hover). |

## Regression check
- `RentalListPage.tsx:276` chip gợi ý (EmptyResults): `text-small font-semibold text-accent-text transition-colors duration-(--duration-fast) hover:text-text` — **không đổi so với round 1** (round 1 đã duyệt; nền trang `bg`/`surface` → accent 4.7–5.1:1, OK).
- Diff tổng giữ nguyên 28 file / 47+/33- như round 1 → không có thay đổi ngoài 2 dòng fix. Không có drive-by.
- Không còn `text-accent-text` trên `bg-error-subtle` trong diff.

## Acceptance re-check (ngắn)
- Grep `underline|decoration-|text-decoration` trong `src` (bỏ `*.test.*`): ngoài `src/components/admin/styles/*.scss` (admin, ngoài phạm vi) chỉ còn `src/components/content/RichText.tsx:48` (`TEXT_CLASS.link`) — **OK**.
- Hover token + `transition-colors` ở mọi chỗ đổi; focus-visible giữ (outline toàn cục, không chỗ nào thêm `outline-none`) — OK.
- DesktopNav: chỉ báo đang xem bằng nền + `aria-current`, test giữ — OK (không đổi từ round 1).

## Responsive Checklist Gate (diff đụng UI — chỉ phần thay đổi)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Layout không tràn ngang | OK (CSS math) | Round 2 chỉ thêm `px-1` (4px mỗi bên) vào link `inline-flex` trong hộp `flex-col items-start`/`flex-wrap` — không tràn ở 375/768/1280 |
| Mobile-first media query | N/A | Không thêm breakpoint |
| Grid auto-fit/minmax | N/A | Không đụng grid |
| Font-size rem | OK | `text-small` (rem) giữ |
| Heading fluid / spacing scale | N/A | |
| Media | N/A | |
| Touch target ≥ 44px | OK | `min-h-11` giữ ở cả 2 link |
| Nav mobile | N/A | |
| Table scroll | N/A | |
| 100vh | N/A | |
| prefers-reduced-motion | OK | `duration-(--duration-fast)` token theo pattern sẵn có |
| Không che lỗi bằng overflow:hidden | OK | Không thêm overflow |

## Skill gates
| Gate | Kết quả |
|---|---|
| aislop | skip — không có quyền chạy (Bash chỉ verify commands + git); diff chỉ className |
| oxlint (anti-slop) | skip, oxlint not configured; `pnpm lint` (eslint) PASS |
| ocr (open-code-review) | skip, ocr not installed / không được phép chạy |
| AI-readable | OK — 0 indicator (chỉ className, không hàm mới/magic number) |
| ai-friendly-web | N/A — không đổi route/robots/sitemap/llms |
| blitzstrike | N/A — không đụng auth/API/input |

## Findings
Không còn CRITICAL / MAJOR / MINOR mới.

## Residual risk
- Không có browser trong quyền reviewer: contrast tính bằng token `globals.css` (CSS math); hover `bg-text/6` là thay đổi nền nhẹ (không có yêu cầu WCAG cho tương phản trạng thái hover, chỉ báo chính vẫn là focus outline).
- `accent-text` trên `warning-subtle` 4.57:1 (JobDetail, ApplyForm) — đạt AA sát ngưỡng, đã ghi decision log.

## Verdict
**PASS** — 2 MAJOR round 1 đã sửa (≈15.7:1 trên `error-subtle`, hover thấy được, focus-visible giữ), 2 MINOR đóng bằng decision log; không regression; lint/typecheck/test PASS; acceptance grep đạt.
