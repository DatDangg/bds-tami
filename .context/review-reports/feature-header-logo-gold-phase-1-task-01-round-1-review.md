Agent: reviewer

# Review — feature-header-logo-gold · phase-1-task-01 · round 1

- **Review level:** NORMAL
- **Reason:** `BrandLogo` là component dùng chung (header, footer, menu), nhưng thay đổi chỉ là 1 URL ảnh tĩnh, cùng kích thước. Không đụng schema, API, auth hay data. Không có risk đỏ nên không cần STRICT. Component dùng chung nên cũng không chọn FAST.
- **Blast radius:** `src/components/layout/BrandLogo.tsx` (`STATIC_LOGO["on-light"]`), có tác dụng tới `Header.tsx:48` (biến thể đặc, `logo-on-light`). `Header.tsx:49`, `Footer.tsx:48`, `MobileMenu.tsx:55` dùng `tone="on-dark"`, không bị ảnh hưởng. Nếu CMS có logo thì vẫn ưu tiên logo CMS (`image ?? STATIC_LOGO[tone]`, logic không đổi). Admin `Logo.tsx` và OG fallback đã dùng bản vàng từ trước, không thuộc diff.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm lint` | PASS (eslint không có output lỗi) |
| `pnpm typecheck` | PASS (`tsc --noEmit` sạch) |
| `pnpm test -- src/components/layout` | PASS: 15 files, 97 tests |
| Kích thước asset (`file`) | `public/brand/tami-logo-gold.png` là PNG 800 x 416, khớp `width/height` khai báo, nên không gây CLS. File đã được git track. |

Không chạy toàn bộ suite. Builder báo 257 files, 2677 tests PASS. Diff chỉ nằm trong `src/components/layout`. Các test khác có nhắc `tami-logo-gold` (metadata, cache-policy, admin Logo) không phụ thuộc `BrandLogo`.

## Acceptance
- [x] Header đặc dùng `/brand/tami-logo-gold.png` khi CMS trống (BrandLogo.tsx:7, Header.test.tsx:67).
- [x] Header trong suốt, footer và menu vẫn dùng bản trắng (tone `on-dark` giữ nguyên). Có test mới ở Footer.test.tsx:82-92 và MobileMenu.test.tsx:97-105.
- [x] Logo CMS vẫn ưu tiên. Test cũ ở nửa sau của test Header logo vẫn còn và đang PASS.
- [x] Lint, typecheck và test PASS.

## Responsive Checklist Gate
Diff chỉ đổi `src` của ảnh. Class, kích thước và layout giữ nguyên.
- Layout (overflow, grid, container): N/A, không đổi CSS hay markup.
- Typography/Spacing: N/A.
- Media: OK. Intrinsic 800×416 khớp file thật. Vẫn giữ `h-10 w-auto max-w-[7.5rem] object-contain lg:h-12`.
- Touch/Interaction: N/A, link trang chủ không đổi.
- Viewport/A11y: N/A, `alt=""` trong link có tên truy cập giữ nguyên. Tương phản ~1.5:1 là quyết định của user (phương án B), không tính là finding.

## Skill gates
- aislop: skip, chưa cấu hình trong verify commands và reviewer không có quyền chạy. Diff 1 dòng code + test.
- oxlint (anti-slop): skip, oxlint chưa được cấu hình. ESLint đã PASS.
- ocr: skip, ocr chưa cài.
- AI-readable: OK, 0 indicator. Tên rõ, không thêm magic number mới. JSDoc mô tả lý do (vàng cho nền sáng, trắng cho nền tối).
- ai-friendly-web: N/A, chỉ đổi asset logo, không đụng robots, sitemap hay llms.
- blitzstrike: N/A, không phải task nhạy cảm.

## Surgical diff / Doc
- Mọi dòng trong diff đều liên quan trực tiếp tới task. Không có refactor ngoài phạm vi.
- Doc as-built: `docs/ARCHITECTURE.md` không nhắc bản đen, nên "no doc impact" là hợp lý. `docs/DESIGN.md:134-136` (intent, do change-request sửa) đã khớp với code.

## Findings
- [MINOR] Footer.test.tsx:84 và MobileMenu.test.tsx:97-104 chỉ khẳng định file tĩnh khi CMS trống. Không có test cho trường hợp `logoDark` từ CMS ở footer/menu. Hành vi này không đổi trong task nên không bắt buộc bổ sung.
- [MINOR] JSDoc ở BrandLogo.tsx:5 dài 1 dòng (>150 ký tự). Chỉ ảnh hưởng thẩm mỹ, lint vẫn PASS.

Không có CRITICAL hay MAJOR.

## Residual risk
- Chưa xem trực quan logo vàng trên trình duyệt ở 375/768/1280. Tuy vậy kích thước và class không đổi, nên rủi ro layout gần như bằng 0.

## Verdict
PASS
