Agent: reviewer

# Review — feature-admin-address-map-location-input · phase-1-task-03 · round 3 (sửa tiếp sau 9c9b1991)

- **Review level:** STRICT
- **Reason:** `MapLocationField` là component dùng chung cho 6 form admin (Cho thuê, Dự án, Tiện ích xung quanh, Tin BĐS, Cài đặt website, Hệ thống văn phòng), và bản sửa đổi cách component báo kết quả validate cho `useField` (lỗi server có hiện ra hay không). Theo luật, component dùng chung thì phải STRICT. Phạm vi diff vẫn hẹp (2 file, khoảng 25 dòng).
- **Blast radius:** `src/components/admin/MapLocationField.tsx` (callback validate) và `src/components/admin/styles/_map-location.scss` (được `@use` ở cấp gốc trong `src/app/(payload)/custom.scss:13`). Chỉ ảnh hưởng ô "Toạ độ bản đồ" trong 6 form admin. Không đổi API, schema, quyền truy cập hay validate phía server (`src/fields/map-location.ts`).
- **Scope:** chỉ xét 2 file này (`git diff`). Các file bẩn khác trong working tree là việc khác, đã bỏ qua.

## Verify commands + result

| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` (`tsc --noEmit`) | PASS, 0 lỗi |
| `pnpm vitest run src/components/admin/MapLocationField.test.tsx src/fields/map-location.test.ts` | PASS: 2 file, 48 test |
| `pnpm test` (toàn bộ) | không chạy: diff chỉ có 2 file, đã chạy đúng các file test liên quan |

## Kiểm tra root cause với mã nguồn Payload

1. **Lỗi server không hiện dưới ô: ĐÚNG.**
   - Trong `@payloadcms/ui/dist/forms/useField/index.js` L181-207, `validate` là hàm ta truyền vào (`memoizedValidate`), nên lúc nào cũng là function và luôn được gọi.
   - Nếu kết quả là `boolean`, đoạn đó gán `valid_0 = isValid` và `errorMessage = undefined`. Vì vậy bản cũ trả `true` làm mất lỗi server sau mỗi lần effect chạy.
   - Nếu kết quả là `undefined`, không nhánh nào chạy và state giữ `prevValid` / `prevErrorMessage`, nên lỗi server còn nguyên.
   - Ô point gốc của Payload (`fields/Point/index.js` L39-46) cũng ngầm trả `undefined` khi không có `validate`. Bản sửa khớp với hành vi này.
2. **Khung input mặc định của trình duyệt: ĐÚNG.**
   - Payload áp `@mixin formInput` (`dist/scss/vars.scss` L131-143: `width:100%`, `border:1px solid`, `background: var(--theme-input-bg)`, `font-family: var(--font-body)`, `-webkit-appearance:none`) qua `.field-type.number` / `.field-type.text`. Gốc component chỉ có class `field-type tami-map-location`, nên mixin này không áp vào.
   - `_controls.scss` L64-106 chỉ đặt border-color, radius, color, font-size, height và padding, không có border-width/style, width hay background.
   - Các thuộc tính mới thêm khớp đúng phần còn thiếu của `formInput`.
3. **Nền ô lỗi: ĐÚNG.** `lightInputError` dùng `--theme-error-50`, `darkInputError` dùng `--theme-error-100` (`vars.scss` L180-187). Phần viền đỏ của mixin vẫn bị `_controls.scss` (specificity 0,6,1) ghi đè cho mọi ô text/number, nên ô toạ độ trông giống ô "Địa chỉ".

## Selector dark mode (CSS math)

- File được `@use` ở cấp gốc, không nằm trong selector cha nào. Selector `html[data-theme="dark"] &.error &__coords input` biên dịch thành:
  `html[data-theme="dark"] .tami-map-location.error .tami-map-location__coords input`.
  Sass cho phép dùng `&` nhiều lần và `&__suffix` ở đầu compound selector, nên cú pháp hợp lệ.
- Specificity:
  - light `.tami-map-location.error .tami-map-location__coords input` = (0,3,1)
  - dark = (0,4,2)
  - base `.tami-map-location input` = (0,1,1)
  - `_controls.scss` (0,6,1) không đặt `background`, nên không đè nền.

  Thứ tự áp đúng: base < light < dark. Ô dán (nằm trong `__paste`, không thuộc `__coords`) không bị tô lỗi, đúng chủ đích.

## Type-safety của `memoizedValidate`

- Chữ ký mới là `(value: PointValue | null, options: Parameters<NonNullable<PointFieldClientProps["validate"]>>[1]) => ReturnType | undefined`. Kiểu trả về tự suy ra có `undefined`, nên bỏ generic `useCallback<...>` là hợp lý (với generic cũ thì `undefined` không gán được).
- `value as never` tắt kiểm tra kiểu của đối số đầu: `PointValue` có phần tử `string` khi đang gõ dở, còn validate Payload nhận `[number, number]`.
  - Nhánh này gần như không bao giờ chạy: prop `validate` phía client thường là `undefined` vì validate tuỳ biến chỉ chạy ở server.
  - Lúc chạy cũng không đổi gì, Payload tự truyền nguyên giá trị như vậy.
  - Cast hẹp hơn sẽ rõ ý hơn (xem MINOR-2).
- Cast `memoizedValidate as unknown as Validate` ở L63 có sẵn từ trước và có comment giải thích. typecheck sạch.

## Responsive Checklist Gate

Diff chỉ đụng SCSS của 1 ô form admin. Breakpoint lấy từ profile: 375/640/768/1024/1280/1536. Đã xác minh bằng CSS math cộng với bằng chứng browser của builder (390 và 1440, dark).

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không scroll ngang | OK | `width:100%` nằm trong cột grid/flex của `__coords`, không có độ rộng cố định px. Builder xác nhận input full width ở 390 |
| Mobile-first / min-width MQ | N/A | Diff không thêm media query |
| Grid auto-fit/minmax | N/A | Diff không đổi layout grid |
| Container không fixed px | OK | Chỉ có `border-width:1px` |
| Font-size rem | OK / N/A | Diff không đặt font-size (giữ 14px từ `_controls.scss`, có sẵn, ngoài scope) |
| Heading clamp / spacing scale | N/A | Không có heading/spacing mới |
| Media (ảnh/video) | N/A | Không có |
| Touch target ≥ 44px | OK | `_controls.scss` L258 nâng input lên 44px ở mobile. Builder đo được 44px |
| Nav / table mobile | N/A | Không có |
| 100vh / reduced-motion | N/A | Không có |
| overflow:hidden che lỗi | OK | Không dùng |

## Skill gates

| Gate | Kết quả |
|---|---|
| aislop | skip: `aislop` không có trong verify commands được phép |
| oxlint (anti-slop) | skip: không có trong verify commands của profile. typecheck là gate type thay thế, PASS |
| ocr (open-code-review) | skip: ocr not installed / not allowed |
| AI-readable | OK: 0 indicator. Tên rõ, không có hàm mới > 50 dòng, không magic number mới. Comment giải thích TẠI SAO (useField giữ lỗi server; gốc thiếu class `number`), không mô tả CÁI GÌ. File 175 dòng |
| ai-friendly-web | N/A: admin nội bộ, không public |
| blitzstrike | N/A: không đụng auth, API public hay input server |

## Findings

**[CRITICAL]:** không có.

**[MAJOR]:** không có.

**[MINOR-1] Thiếu test regression cho hành vi "không có validate client → trả `undefined`".**
- Vị trí: `src/components/admin/MapLocationField.test.tsx` L15.
- Viết được và rẻ: mock `useField` hiện là arrow thường. Đổi thành `vi.fn()` để bắt được `args.validate`, rồi thêm 2 test:
  - (a) render không có prop `validate`, gọi `args.validate([200, 10], {})` và kỳ vọng `toBeUndefined()`. Nếu ai đó đổi lại thành `true` thì test sẽ đỏ.
  - (b) truyền `validate = vi.fn(() => "x")` với `field.required: true`, kỳ vọng trả `"x"` và options có `required: true`.
- Không chặn PASS vì: bản sửa là 1 return giống hệt ô Point của Payload, builder đã xác minh trên browser thật (lưu cặp toạ độ ngược thì lỗi hiện dưới ô), và test chỉ khoá contract của callback chứ không thay được integration. Vẫn khuyến nghị thêm vì đây là lỗi chỉ lộ ra khi kiểm tra trên browser.

**[MINOR-2] Cast `value as never` quá rộng.**
- Vị trí: `MapLocationField.tsx:52`.
- Đề xuất đổi sang `value as Parameters<typeof validate>[0]` để chỉ ép đúng kiểu đối số mà validate nhận, không tắt hết kiểm tra.

**[MINOR-3] Ô bị khoá có nền giống ô sửa được.**
- Vị trí: `_map-location.scss` L7-14.
- Khi khoá (`read-only`/`disabled`), hai ô số giờ nền `--theme-input-bg`, giống ô sửa được; chỉ khác màu chữ (`_controls.scss` L94-97). Payload dùng `@mixin readOnly` (nền `--theme-elevation-100`) cho `.field-type.*.read-only input`.
- Trước bản sửa thì nền là của trình duyệt, nên đây không phải regression nặng. Muốn đồng bộ với ô "Địa chỉ" thì thêm `&.read-only input { background: var(--theme-elevation-100); }`. Phần này builder chưa kiểm trên browser.

## Residual risk

- Reviewer không có browser. Bố cục 390/1440, màu lỗi dark mode và trạng thái read-only dựa vào CSS math và bằng chứng browser do builder báo, chưa tự quan sát.
- Chưa chạy `pnpm test` toàn bộ. Rủi ro thấp vì không có file nào khác import thay đổi này ngoài component.

## Verdict

✅ **PASS**: không có CRITICAL/MAJOR. Root cause của cả hai lỗi khớp với mã nguồn Payload, typecheck sạch, 48/48 test liên quan pass. Còn 3 MINOR, khuyến nghị nhưng không chặn; MINOR-1 nên làm khi tiện.
