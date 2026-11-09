Agent: reviewer

# Review: bug-careers-cv-mailto-no-action · phase-1-task-01 · round 1 (BL-114)

- Review level: **NORMAL**
- Reason: Đây là UI bug ở trang công khai `/tuyen-dung`. Diff chạm `CtaBanner` dùng chung nhưng chỉ thêm prop tuỳ chọn `extraAction`; không đụng auth, tenant, schema hay API. Nhánh `extraAction` không truyền thì giữ nguyên DOM cũ nên không cần STRICT.
- Blast radius: `src/components/layout/CtaBanner.tsx`. Chỉ `CareersCvBanner` truyền `extraAction`. Grep thấy `HomeBlocks` và `ConsultBanner` gọi `CtaBanner` với prop `block` (component khác hoặc wrapper), không truyền `extraAction`. Ngoài ra có `src/components/careers/{CopyEmailButton,JobListPage,CareersCvBanner}.tsx` và 3 key i18n `page.careers.v2.cvCopy/cvCopied/cvCopyFailed` (vi/en).

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm vitest run src/components/careers src/components/layout src/i18n` | PASS: 30 file, 229 test |
| `pnpm typecheck` (`tsc --noEmit`) | PASS, không có lỗi |
| `pnpm exec eslint` cho 6 file TS/TSX đổi | sạch, không có output |

## Kiểm theo yêu cầu
- **CtaBanner ở nơi khác không đổi:** OK. Prop là tuỳ chọn. Điều kiện render khối nút thêm `|| extraAction`; không truyền thì giá trị là `undefined`, nên DOM giữ như cũ. Test `CtaBanner.test.tsx` cũ vẫn PASS.
- **Server/Client boundary:** OK. `CopyEmailButton` có `"use client"` và nhận prop `email: string`, serializable. `CareersCvBanner`, `JobListPage` và `CtaBanner` vẫn là Server Component. Truyền `extraAction` (element của client component) qua prop của server component là hợp lệ.
- **Vùng chạm:** OK. `Button` size `md` có `h-11` = 44px (panel trống), size `lg` có `h-13` = 52px (banner). Cả hai cộng thêm `min-w-11`.
- **Tương phản chữ trên banner:** OK. Variant `chip` dùng `text-on-dark` và câu báo cũng dùng `text-on-dark`. Đây là đúng cặp màu mà `contrast.test.ts` đã chứng minh đạt 4.5:1 trên scrim phủ ảnh trắng.
- **Focus-visible trên banner có ảnh:** **FAIL** (xem MAJOR-1).
- **Dùng `aria-live` thay `role="status"`:** chấp nhận được. Lý do của builder hợp lệ: test `getByRole("status")` của panel trống phải còn duy nhất một vùng. Rủi ro AT còn lại ghi ở MINOR-2.

## Responsive Checklist Gate (diff đụng UI; xác minh bằng CSS, không có browser)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang 375/768/1280 | OK | Panel trống: `flex flex-wrap justify-center gap-x-6 gap-y-2`. Nút sao chép rộng khoảng 180px, và câu báo dài nhất (khoảng 50 ký tự `text-small`) được xuống dòng vì `CopyEmailButton` cũng là `flex-wrap`, không có `whitespace-nowrap` ở `span`. Banner: `flex-col` ở dưới `sm`, `sm:flex-row` ở 768 trở lên. |
| Mobile-first `min-width` | OK | Chỉ dùng tiền tố `sm:` có sẵn của CtaBanner. |
| Grid cột cố định / container px | N/A | Không thêm grid hay container mới. |
| Font rem / heading clamp | OK | Dùng token `text-small` / `text-button`; không có `px` font mới. |
| Media | N/A | Không thêm ảnh hay video. |
| Touch ≥ 44×44 | OK | 44px (md) / 52px (lg), cộng `min-w-11`. |
| Nav hamburger / table wrapper | N/A | Không đụng. |
| 100vh / reduced-motion / overflow:hidden | N/A | Không thêm. `overflow-hidden` của section banner là code sẵn có. Banner compact dùng `min-h` nên câu báo dài xuống dòng sẽ đẩy cao banner, không bị cắt. |

## Skill gates
- aislop: skip, không có trong verify commands được cho phép của reviewer.
- oxlint (anti-slop): skip, oxlint chưa cấu hình. ESLint chạy trên file đổi: sạch.
- ocr: skip, ocr chưa cài.
- AI-readable: OK. Tên rõ, hàm ngắn (`CopyEmailButton` khoảng 35 dòng), không có magic number đáng kể: 3000ms giống hệt mẫu `CopyVoucherButton`. Comment giải thích WHY. Không có indicator nào.
- ai-friendly-web: N/A. Task không đổi robots, sitemap hay llms.
- blitzstrike: N/A. Không phải STRICT, không có input hay auth.

## Findings

### [MAJOR-1] Focus ring của nút "Sao chép email" trên banner có ảnh không đạt 3:1 (WCAG 1.4.11). Vi phạm quy tắc BL-020 #7 đã có trong repo.
- `src/components/careers/CopyEmailButton.tsx:45`: `focus-visible:outline-focus-ring`. Trong `.theme-dark-block`, `--color-focus-ring` bằng `--color-on-dark-accent` (#e0bf89), xem `src/app/(frontend)/globals.css:231` và `:42`.
- `src/components/layout/CtaBanner.tsx:43` chỉ đổi focus ring cho thẻ `a` (`[&_a:focus-visible]:outline-on-dark`) khi có ảnh nền. `src/lib/contrast.test.ts:199-207` ghi rõ: "vòng focus mặc định chỉ ~3:1 trên scrim đè ảnh trắng nên khối có ảnh dùng outline-on-dark". Nút mới là `<button>` nên không được selector này áp dụng.
- Tính tay: scrim `rgb(20 13 2 / .6)` phủ ảnh trắng ra khoảng rgb(114,110,103), L≈0.157. Màu #e0bf89 có L≈0.549. Tỉ lệ ≈ **2.9:1, dưới 3:1**.
- Ảnh nền thật sự có dùng: `JobListPage.tsx:245` truyền `hero.image` vào `CareersCvBanner`.
- Đây đúng là hạng mục task yêu cầu kiểm ("focus-visible trên nền ảnh/tối").
- Cách sửa (chọn một):
  - (a) Trong `CopyEmailButton`, với `tone="onDark"` dùng `focus-visible:outline-on-dark` thay `outline-focus-ring` (giống `AboutVideoButton.tsx:18` và `ShareButtons.tsx:28`).
  - (b) Mở rộng selector ở CtaBanner thành `[&_:is(a,button):focus-visible]:outline-on-dark`. Cập nhật assertion ở `CtaBanner.test.tsx`/`contrast.test.ts` nếu cần.
- Thêm assertion class focus `on-dark` cho tone `onDark` trong `CopyEmailButton.test.tsx`.

### [MINOR-1] Có khoảng trống thừa và layout nhảy khi câu báo xuất hiện
- `CopyEmailButton.tsx:40,50`: `span` rỗng vẫn là flex item nên `gap-3` cộng 12px sau nút. Ở panel trống (canh giữa), nút lệch khoảng 6px. Khi câu báo hiện hoặc ẩn sau 3s, hàng nút dời vị trí.
- Gợi ý: chỉ render câu báo khi có `message`, còn vùng `aria-live` luôn tồn tại. Có thể giữ `span` live nhưng đặt nội dung text trong một phần tử con hiển thị có điều kiện, hoặc dùng `empty:hidden`.

### [MINOR-2] Vùng `aria-live` lồng trong `role="status"` của panel trống
- `JobListPage.tsx` `NoJobsPanel` (role=status, mặc định `aria-atomic=true`) chứa `span aria-live=polite`. Một số AT có thể đọc lại toàn bộ panel khi câu báo đổi.
- Rủi ro thấp; không chặn PASS. Có thể thêm `aria-atomic="true"` trên `span` để AT lấy vùng gần nhất.

### [MINOR-3] `CtaBanner.test.tsx` chưa có ca cho `extraAction`
- Prop mới chỉ được kiểm gián tiếp qua `JobListPage.test.tsx`. Nên thêm 1 ca: chỉ truyền `extraAction` thì vẫn render khối nút; không truyền thì DOM không đổi.

## Repro Verification
- Status builder ghi: PASS theo test tự động. Test hồi quy hợp lệ: nút "Sao chép email" chưa tồn tại trước fix nên các assertion `getByRole("button", { name: "Sao chép email" })` sẽ fail ở code cũ. Clipboard OK, clipboard lỗi và bản EN đều có test.
- Chưa kiểm bằng trình duyệt thật. Phần hành vi chính (clipboard và thông báo) đã được kiểm qua test.

## Residual risk
- Responsive và màu chỉ xác minh bằng CSS math; chưa có ảnh chụp 375/768/1280.
- `navigator.clipboard` cần secure context. Nhánh lỗi đã in email để chép tay.

## Verdict: FAIL
Lý do: MAJOR-1 (focus ring trên banner có ảnh khoảng 2.9:1). Sửa xong thì gửi review round 2. Các MINOR là tuỳ chọn.
