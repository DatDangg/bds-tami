Agent: reviewer

# Review: bug-footer-logo-not-linked, phase-1-task-01, round 1 (BL-117)

- Review level: **FAST**
- Reason: Diff nhỏ gồm 2 file (`Footer.tsx` +14/-1, `Footer.test.tsx` +21). Không đụng auth, API, schema, i18n messages hay shared service. Footer là component dùng chung nhưng thay đổi chỉ bọc thêm link, không đổi props/contract. Builder đã test PASS và reviewer đã chạy lại.
- Blast radius: footer của mọi trang công khai (vi/en). Không đổi props của `Footer`. `BrandLogo` và `resolveNavLink` không bị sửa.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/components/layout` | PASS — 22 file / 163 test |
| `npx eslint src/components/layout/Footer.tsx src/components/layout/Footer.test.tsx` | PASS (exit 0, không có output) |
| `pnpm typecheck` (`tsc --noEmit`) | PASS (không có lỗi) |

## Kiểm theo yêu cầu
- **Link đúng locale:** OK. Dùng `resolveNavLink("home", locale)?.href ?? "/"`, giống hệt `Header.tsx:43`. Test `it.each` kiểm href vi=`/` và en=`/en`.
- **Tên truy cập:** OK. `aria-label={tHeader("home")}` lấy lại key sẵn có `layout.header.home`, không thêm key mới. Test tìm bằng `getByRole("link", { name })` theo từng bộ messages.
- **Alt rỗng:** OK. `BrandLogo` luôn để `alt=""` (BrandLogo.tsx:32), test kiểm `img[alt=""]`.
- **Focus-visible trên nền tối:** OK. `focus-visible:outline-2 outline-offset-2 outline-text`; trong `.theme-dark-block` biến `--color-text` được đổi thành `--color-on-dark` (globals.css:225), nên viền focus sáng trên nền tối. Cùng pattern đang dùng ở 33 component khác.
- **Vùng chạm:** OK. `min-h-11 min-w-11` = 44px, logo cao `h-10` (40px) / `lg:h-12` nên link ≥ 44px. Giữ `self-start` để link không giãn hết cột.
- **Server/Client:** OK. `Footer.tsx` không có `"use client"` và vốn đã gọi `useTranslations`. `useLocale` của next-intl chạy được trong Server Component cùng cơ chế đó. `next/link` dùng được ở server.
- **Lệch hydrate:** N/A. Href tính tất định từ locale của request, không có state client hay `Date`/`window`, nên không có nguồn lệch.

## Bug repro closure
`Repro Verification` có Status `PASS`. Có test hồi quy tự động kiểm chứng được (`Footer: logo là link về trang chủ (BL-117)`). Trước fix, `getByRole("link", { name: "TAMI, về trang chủ" })` trong `contentinfo` chắc chắn fail vì code cũ (`BrandLogo` trần, xem diff `-` dòng 55) không có link nào mang tên đó. Fail-before suy ra từ diff, không chạy thật; chấp nhận được vì quan hệ nhân quả rõ ràng.

## Responsive Checklist Gate (diff đụng UI)
- Layout, không horizontal scroll: OK. Link `inline-flex self-start` nằm trong cột `flex-col`, không có width cố định. Logo có `max-w-[7.5rem]` (khoảng 120px) nên không tràn ở 375.
- Mobile-first / grid: N/A. Không đổi grid hay media query.
- Typography/spacing: N/A. Không thêm font-size hay spacing.
- Media: OK. Ảnh vẫn là `next/image` với width/height (giữ tỉ lệ) và `w-auto`, không đổi.
- Touch target ≥ 44×44: OK (`min-h-11 min-w-11`).
- Nav/table: N/A.
- Viewport/100vh, reduced-motion, overflow hidden: N/A. Không thêm animation hay overflow.
- Residual: không có browser thật. Kết quả xác minh bằng CSS math ở 375/768/1280.

## Skill gates
- aislop: skip, chưa chạy (diff 2 file, ngoài allowlist verify command). Đọc tay không thấy slop.
- oxlint (anti-slop): skip, oxlint not configured. Đã chạy eslint trên 2 file đổi và PASS.
- ocr: skip, ocr not installed.
- AI-readable: OK. 0 indicator. Tên rõ (`homeHref`, `tHeader`). Comment giải thích WHY (lý do alt rỗng, BL-117). Hàm `Footer` vẫn ngắn.
- ai-friendly-web: N/A (fix UI nhỏ, không đổi robots/sitemap/llms).
- blitzstrike: N/A (không phải task STRICT).

## Findings
- [MINOR] `src/components/layout/Footer.test.tsx:105`: `expect(home).toHaveClass("min-h-11")` gắn test vào tên class Tailwind. Chấp nhận được vì đó là cách duy nhất kiểm vùng chạm trong jsdom. Không cần sửa.
- [MINOR] `src/components/layout/Footer.tsx:49`: `useLocale() as Locale` ép kiểu giống Header. Nhất quán với code có sẵn, không cần sửa.

Không có CRITICAL hoặc MAJOR.

## Doc impact
Đồng ý `no doc impact`.

## Verdict
**PASS**
