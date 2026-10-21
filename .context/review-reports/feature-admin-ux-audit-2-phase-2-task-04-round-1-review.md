Agent: reviewer

# Review — feature-admin-ux-audit-2 · phase-2-task-04 · round 1 (BL-051 GĐ2 A10, navLinkField chọn trang)

- **Review level:** NORMAL
- **Reason:** Đây là field dùng chung cho Header, Footer, Homepage và khối Trang chủ, nhưng chỉ đổi phần hiển thị trong admin (custom Field client). Field vẫn là `text`, `validate` và hook trim giữ nguyên, không đổi schema/DB/access/API, không migration, `resolveNavLink` không đổi. Không có risk đỏ nên không cần STRICT.
- **Blast radius:** `src/fields/nav-link.ts` → mọi lần gọi `navLinkField` (Header.ts:32,39,47; Footer.ts:35; Homepage.ts:101,239; homepage/blocks.ts:77). `src/lib/content/nav-link.ts` (chỉ thêm export `PAGE_LINK_KEY_MEANINGS`, logic không đổi). Thêm `importMap.js`. `_controls.scss` (khối mới `.tami-nav-link`, có scope). `payload-types.ts` chỉ đổi chú thích. Website: không đổi.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (tsc exit 0) |
| `pnpm lint` | PASS — 0 lỗi, 2 cảnh báo có sẵn ở `tools/task-dashboard/server.mjs` (ngoài scope) |
| `pnpm test` (toàn bộ) | PASS — 3630/3630 test pass, exit 0 |

## Kiểm hợp đồng giá trị
- **Định dạng lưu không đổi:** OK. `navLinkField` vẫn trả `type: "text"`, `validate: validateNavLink`, `hooks.beforeValidate: [trimText]`. Chỉ thêm `admin.components.Field`. Component chỉ gọi `setValue(pageKey | "" | chuỗi gõ vào)`.
- **Override không làm mất custom Field:** OK. Không chỗ nào gọi mà truyền `admin` (chỉ truyền `label` hoặc `required`), nên `...overrides` không ghi đè `admin.components`.
- **Giá trị cũ/lạ giữ nguyên:** OK. `navLinkChoice`: mã trang → chính mã đó; URL hoặc mã lạ → "Địa chỉ khác", giá trị thô hiện trong ô URL; trống → chưa chọn. Chỉ ghi khi người dùng thao tác, nên không âm thầm làm rơi dữ liệu. Có test cho URL cũ và mã lạ.
- **Bắt buộc / không bắt buộc:** OK. `isClearable={!field.required}`, xoá thì ghi `""` (giống ô text cũ). Ô bắt buộc chuyển sang "Địa chỉ khác" thì ghi `""`. Vì `validateNavLink` coi trống là hợp lệ, việc chặn ô bắt buộc để trống vẫn như trước (hành vi có sẵn, ngoài scope).
- **Localized:** field không localized (không đổi).
- **payload-types diff:** chỉ chú thích (9 khối mô tả). Kiểu không đổi.
- **Không import code server-only vào client:** OK. `NavLinkField.tsx` → `@/lib/content/nav-link` → `i18n/routing` (chỉ `defineRouting` của `next-intl/routing`, dùng được ở client). Không kéo cấu hình Payload hay `src/fields`.
- **`resolveNavLink`:** không đổi.

## A11y
- Nhãn select dùng `<label>` bọc SelectInput, tức liên kết ngầm (cùng mẫu với TranslationStatusFilter). Ô URL có `<label htmlFor>` khớp `id`. Dấu `*` bắt buộc hiện khi `field.required`. Lỗi hiện qua `FieldError` của Payload và lớp `error` trên wrapper. Mô tả hiện qua `.field-description`. `readOnly` truyền vào cả select và input.

## Responsive Checklist Gate (diff đụng UI admin)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang | OK | Builder đo scrollWidth 375 ở Footer 375px tối. CSS không thêm width cố định |
| Mobile-first / grid | N/A | Không thêm media query hay grid |
| Container không fixed px | OK | Chỉ có `min-height`, `gap`, `margin` |
| Font-size rem / heading clamp | N/A | Không đặt font-size |
| Spacing | OK | 4px/8px, theo spacing admin hiện có |
| Media | N/A | — |
| Touch target ≥ 44px | OK | `.rs__control` và input URL có `min-height: 44px`. Builder đo ô chọn cao 50px |
| Nav / table mobile | N/A | — |
| 100vh / reduced-motion / overflow:hidden | OK / N/A | Không dùng |
| Style select theo BL-015 | OK | Dùng `SelectInput` của Payload (react-select) giống các ô lọc khác |

Chưa kiểm bằng ảnh: Header 375 và Footer 1280 sáng/tối. Hai ca này dùng chung CSS và component với các ca đã kiểm, xem Residual risk.

## Skill gates
- aislop: skip, chưa cài `aislop`
- oxlint (anti-slop): skip, chưa cấu hình oxlint (repo không có `.oxlintrc.json`). ESLint PASS
- ocr (open-code-review): skip, chưa cài `ocr`
- AI-readable: OK, 1 dấu hiệu (MINOR #2) < 3. Tên rõ, không có magic number (`OTHER_CHOICE` có tên), comment giải thích lý do chứ không mô tả code làm gì
- ai-friendly-web: N/A (chỉ admin nội bộ)
- blitzstrike: N/A (không phải STRICT)

## Findings
- **[MINOR] #1** `src/components/admin/NavLinkField.tsx:38-39`: `otherChosen` chỉ khởi tạo một lần lúc mount. Nếu giá trị đổi từ bên ngoài (reset form, khôi phục version, quay lại bản đã xuất bản) từ URL sang mã trang trong khi `otherChosen === true`, ô vẫn hiện "Địa chỉ khác" và mã trang nằm trong ô URL. Dữ liệu không mất, chỉ hiển thị sai đến lần chọn kế tiếp. Cách sửa: chỉ áp `otherChosen` khi giá trị hiện tại rỗng (`otherChosen && !currentValue`), hoặc đặt lại state khi `currentValue` thành mã trang.
- **[MINOR] #2** `src/components/admin/NavLinkField.tsx:34-95`: hàm `NavLinkField` dài khoảng 62 dòng (> 50), phần lớn là JSX. Có thể tách khối ô URL (dòng 75-90) thành component con.
- **[MINOR] #3** `src/components/admin/NavLinkField.test.tsx:7-27`: test mock `SelectInput` bằng `<select>` gốc, nên không kiểm được việc react-select thật nhận `value` dạng chuỗi hay nút xoá thật. Phần này đã có bằng chứng trình duyệt của builder bù vào. Mock này có thể bỏ qua thay đổi API của Payload sau này.
- Ghi chú F5 thêm vào `phase-2-task-03.md`: một dòng bằng chứng trình duyệt, không đổi code. Chấp nhận.

## Residual risk
- Reviewer không chạy trình duyệt. Phần responsive và sáng/tối dựa vào bằng chứng của builder cộng với CSS (chỉ thêm `min-height`, không có width cố định).
- Ô bắt buộc để trống vẫn qua được `validateNavLink` như trước (hành vi có sẵn, ngoài scope task này).

## Verdict
PASS (không có CRITICAL/MAJOR. 3 MINOR, không chặn PASS)
