Agent: reviewer

# Review: bug-careers-cv-mailto-no-action · phase-1-task-01 · round 2 (BL-114)

- Review level: **NORMAL**
- Reason: Đây là UI bug ở trang công khai `/tuyen-dung`. `CtaBanner` dùng chung chỉ có thêm prop tuỳ chọn `extraAction`. Không đụng auth, tenant, schema hay API. Round 2 chỉ sửa class focus, khoảng cách và `aria-atomic`, và thêm test.
- Blast radius: `src/components/careers/CopyEmailButton.tsx` (+ test), `JobListPage.tsx`, `CareersCvBanner.tsx`, `src/components/layout/CtaBanner.tsx` (+ test), và 3 key i18n `page.careers.v2.cvCopy/cvCopied/cvCopyFailed` (vi/en). Các nơi khác gọi `CtaBanner` không truyền `extraAction` nên DOM giữ như cũ.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm vitest run src/components/careers src/components/layout src/i18n` | PASS: 30 file, 231 test. Round 1 có 229 test; round 2 thêm 2 test mới (focus ring, `extraAction`). |
| `pnpm typecheck` (`tsc --noEmit`) | PASS, không có lỗi |
| `pnpm exec eslint` cho 7 file TS/TSX của task | sạch, exit 0 |

## Kiểm lại các finding của round 1
- **MAJOR-1 (focus ring trên banner có ảnh): ĐÃ ĐÓNG.**
  - `CopyEmailButton.tsx:46-49`: khi `tone="onDark"` nút dùng `focus-visible:outline-on-dark` (`--color-on-dark` #ffffff, `globals.css:40`).
  - Màu trắng trên scrim phủ ảnh trắng (≈ rgb(114,110,103), L≈0.157) cho tỉ lệ ≈ 5.5:1, vượt mức 3:1.
  - Trên khối tối không có ảnh, viền trắng còn rõ hơn.
  - Class utility thắng quy tắc `:focus-visible` gốc trong `@layer base` (`globals.css:374-377`). `Button` gộp `className` bằng `cn`/twMerge (`button.tsx:59`), và lớp nền không có class outline nào xung đột.
  - Tone `light` giữ `outline-focus-ring` (#8c6733) trên nền sáng.
  - Test mới `CopyEmailButton.test.tsx:32-38` kiểm class của cả hai tone.
- **MINOR-1 (khoảng trống thừa): ĐÃ ĐÓNG.** Bỏ `gap-x`, chỉ thêm `ms-3` khi có `message` (`:54`). `span` rỗng giờ rộng 0 nên nút không còn lệch.
  - Ở panel trống canh giữa, cụm nút vẫn dời nhẹ để canh giữa lại khi câu báo hiện. Đây là hệ quả tự nhiên khi hiện chữ báo, chấp nhận được.
- **MINOR-2 (vùng live lồng nhau): ĐÃ ĐÓNG.** Đã thêm `aria-atomic="true"` trên `span`.
- **MINOR-3 (test cho `extraAction`): ĐÃ ĐÓNG.**
  - `CtaBanner.test.tsx:70-76`: chỉ truyền `extraAction` thì vẫn dựng khối nút; không truyền thì không có khối nút.
  - Các test cũ của CtaBanner vẫn PASS.
- **Hồi quy:** không có.
  - Logic clipboard, timer và cleanup không đổi so với round 1.
  - Thiếu email thì không có nút nào (spread có điều kiện trong `CareersCvBanner.tsx:24`).
  - Server/Client boundary giữ nguyên.
  - i18n vi/en đủ cặp, không có gạch dài.

## Responsive Checklist Gate (diff đụng UI; xác minh bằng CSS, không có browser)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang 375/768/1280 | OK | `CopyEmailButton` là `flex flex-wrap`, câu báo được xuống dòng. Panel trống dùng `flex-wrap justify-center`. Banner là `flex-col` ở dưới `sm` và `sm:flex-row` từ `sm` trở lên. |
| Mobile-first `min-width` | OK | Chỉ dùng tiền tố `sm:` có sẵn. |
| Grid cột cố định / container px | N/A | Không thêm grid hay container mới. |
| Font rem / heading clamp | OK | Dùng token `text-small` / `text-button`. |
| Media | N/A | Không thêm ảnh hay video. |
| Touch ≥ 44×44 | OK | Nút cao 44px (md) / 52px (lg), cộng `min-w-11`. |
| Nav / table | N/A | Không đụng. |
| 100vh / reduced-motion / overflow:hidden | N/A | Không thêm. Banner compact dùng `min-h` nên không cắt câu báo. |

## Skill gates
- aislop: skip, không có trong verify commands được cho phép của reviewer.
- oxlint (anti-slop): skip, oxlint chưa cấu hình. ESLint trên các file đổi: sạch.
- ocr: skip, ocr chưa cài.
- AI-readable: OK.
  - Hàm ngắn, tên rõ.
  - Comment giải thích WHY (lý do chọn outline-on-dark, lý do dùng aria-live).
  - Số 3000ms theo mẫu `CopyVoucherButton`.
  - 0 indicator.
- ai-friendly-web: N/A. Task không đổi robots, sitemap hay llms.
- blitzstrike: N/A. Không phải STRICT, không có input hay auth.

## Findings
- Không có CRITICAL hay MAJOR.
- [MINOR-4] Ở mobile (< `sm`), nút chính của banner là `w-full max-w-xs`, còn nút "Sao chép email" chỉ rộng theo nội dung. Hai nút xếp dọc vì thế không đều chiều rộng. Đây chỉ là chuyện thẩm mỹ, không chặn PASS. Nếu muốn đồng bộ, có thể thêm `w-full max-w-xs sm:w-auto` cho nút ở tone `onDark` (`CopyEmailButton.tsx:45`).

## Repro Verification
- Status: PASS theo test tự động.
- Nút "Sao chép email" không tồn tại ở code cũ, nên các assertion `getByRole("button", { name: "Sao chép email" })` sẽ fail trước fix.
- Clipboard OK, clipboard lỗi, bản EN, panel trống, banner và trường hợp thiếu email đều có test.

## Residual risk
- Responsive và màu chỉ xác minh bằng CSS math; chưa có ảnh chụp 375/768/1280 trên trình duyệt thật.
- `navigator.clipboard` cần HTTPS (production có HTTPS). Nhánh lỗi đã in email để chép tay.

## Verdict: PASS
