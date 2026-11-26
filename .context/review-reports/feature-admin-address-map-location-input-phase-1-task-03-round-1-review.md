Agent: reviewer

# Review — feature-admin-address-map-location-input · phase-1-task-03 · round 1 (BL-131 T03)

- Review level: **STRICT**
- Reason: component client admin dùng chung cho 6 form (Cho thuê, Dự án, Tiện ích xung quanh, Tin BĐS, Cài đặt website, Văn phòng), ghi trực tiếp dữ liệu toạ độ `[lng, lat]`; sai thứ tự hoặc sai số = lưu sai vị trí mà validate vùng VN có thể không bắt được.
- Blast radius: `src/fields/map-location.ts` (gắn `admin.components.Field` cho mọi chỗ dùng `mapLocationField`) → 6 form admin; `src/app/(payload)/admin/importMap.js`; `src/app/(payload)/custom.scss` (stylesheet admin toàn cục). Dữ liệu DB không đổi kiểu, không migration. `src/payload-types.ts` bẩn sẵn từ trước, không thuộc task.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/components/admin src/fields src/lib/admin src/collections src/globals` | PASS — 112 files / 1027 tests |
| `pnpm typecheck` | PASS (tsc --noEmit, không lỗi) |
| `pnpm exec eslint` 6 file TS/TSX đổi | PASS (exit 0, không output) |
| Biên dịch Sass `custom.scss` (sass 1.77.4, loadPaths node_modules) | PASS — CSS 62 790 ký tự; khối `.tami-map-location*` ra đúng; token `--admin-text-muted` / `--admin-accent` có ở cả sáng (`_tokens.scss:13,15`) lẫn tối (`:86,88`) |
| `git diff importMap.js` | Chỉ thêm 1 import + 1 entry `MapLocationField`, đúng |
| Kiểm admin thật bằng trình duyệt | skip — không có tài khoản test (không dùng `.env.local`); xem Residual risk |

## Responsive Checklist Gate (diff đụng UI admin — kiểm bằng CSS math, không có browser)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang 375/768/1280 | OK | `__coords` flex, `li { flex: 1 1 0; min-width: 0 }`; ≤600px xếp cột. Input kế thừa width 100% từ `.field-type input` (`_controls.scss:64`). |
| Mobile-first `min-width` | OK (ghi chú) | Dùng `max-width: 600px` — trùng quy ước sẵn có của admin (Payload breakpoints, 24 media query khác trong `styles/`); không gây lỗi bố cục. |
| Grid/container không px cố định | OK | Không có width cố định. |
| Font-size rem | OK | 0.875rem. |
| Heading fluid | N/A | Không có heading. |
| Spacing theo scale | OK | rem. |
| Media/ảnh/video | N/A | Không có. |
| Touch target ≥44px | FAIL (MINOR) | Link "Xem trên Google Maps" chữ 0.875rem, không padding → cao ~18–20px trên mobile. Ô nhập kế thừa chiều cao input Payload (OK). |
| Nav/table mobile | N/A | |
| 100vh / reduced-motion / overflow hidden | N/A / OK | Không dùng. |

## Skill gates
- aislop: skip, `aislop` không được cấu hình trong verify commands của profile (không chạy ngoài allowlist).
- oxlint (anti-slop): skip, oxlint not configured (không có `.oxlintrc*`); eslint PASS thay thế.
- ocr (open-code-review): skip, ocr not installed / không trong allowlist.
- AI-readable: OK — 1 indicator (`MapLocationField` ~108 dòng > 50, `MapLocationField.tsx:45-152`); tên rõ, comment là WHY, không magic number đáng kể. < 3 → không FAIL.
- ai-friendly-web: N/A (admin nội bộ).
- blitzstrike: skip, không có môi trường được phép. Kiểm tay XSS: chuỗi dán chỉ đi vào `value` của input controlled; href chỉ ghép từ `number` đã kiểm `Number.isFinite` (`MapLocationField.tsx:13-26`) → không có XSS/`javascript:`.

## Findings

### [CRITICAL] Ô số Vĩ độ/Kinh độ nuốt chữ số 0 sau dấu thập phân → lưu sai toạ độ mà vẫn qua validate
- `src/components/admin/MapLocationField.tsx:18` + `:118` / `:137`: `value={toInputText(...)}` truyền **chuỗi** đã chuẩn hoá qua `parseFloat(...).toString()`.
- React (`node_modules/react-dom/cjs/react-dom-client.development.js:1851-1853`) với `type="number"` chỉ giữ nguyên chữ đang gõ khi `element.value != value` (so sánh lỏng). Ô point mặc định của Payload truyền **number** (`value_0[0]`) nên `"106.70" != 106.7` là false → giữ nguyên. Ở đây prop là chuỗi `"106.7"` → `"106.70" != "106.7"` là true → React ghi đè DOM về `"106.7"`.
- Hệ quả: gõ tay `106.7009` → sau "106.70" ô bị đặt lại "106.7", gõ tiếp "0" lại bị đặt lại, "9" → **106.79**. Vẫn nằm trong vùng VN → validate T02 cho qua → lưu sai vị trí khoảng 9 km mà không báo gì. Tương tự `10.0234` → "10" + "234" = 10234 (bị validate chặn nhưng không nhập được). Toạ độ có số 0 ngay sau dấu chấm/giữa phần lẻ rất phổ biến.
- Test hiện tại không bắt được vì mock `useField` trả giá trị tĩnh, không có vòng gõ từng phím.
- Fix: giữ hành vi như Payload — `value={typeof v === "number" ? v : ""}` (truyền number, không `toString`). Thêm test component có harness giữ state (useState/`setValue` cập nhật lại value) gõ lần lượt "1","10","10.","10.0","10.00","10.009" và assert `input.value` + giá trị cuối `[…, 10.009]`.

### [MAJOR] Ô "Dán từ Google Maps" tự áp dụng ở mỗi phím gõ → gõ tay ghi giá trị sai rồi xoá ô
- `src/components/admin/MapLocationField.tsx:67-76, 91`: `onChange` → `parseMapLocationInput` mỗi phím; `PLAIN_PAIR` (`map-location-parse.ts:5`) khớp ngay khi số thứ hai mới có 1 chữ số.
- Gõ tay "10.7769, 106.7009" (placeholder mời đúng dạng này): tới "10.7769, 1" → `setValue([1, 10.7769])` và xoá ô dán → không gõ tiếp được, form nhận Kinh độ = 1. Đồng thời mỗi phím trước đó hiện "Không đọc được toạ độ…" gây nhiễu. Validate server chặn được trường hợp này (ngoài VN) nên không lưu sai, nhưng đường nhập chính của task không dùng được khi gõ.
- Fix: chỉ tự áp dụng khi là dán (`onPaste` đọc `clipboardData`, hoặc `nativeEvent.inputType === "insertFromPaste"`); gõ tay thì áp dụng khi Enter/blur (hoặc nút "Điền"), và chỉ hiện "Không đọc được" sau khi dán/Enter/blur. Thêm test: gõ từng ký tự không gọi `setValue` cho tới khi Enter/blur.

### [MINOR]
1. `MapLocationField.tsx:143` + `_field-errors.scss:7-19`: `FieldError` là con trực tiếp của gốc `.field-type` → luật flex-column/order đẩy lỗi xuống **cuối** (sau link "Xem trên Google Maps" và mô tả), và flex column kéo giãn link thành cả hàng bấm được. Cân nhắc đặt lỗi trong một wrapper ngay dưới `__coords` (vd bọc `ul` + error trong `.field-type__wrap`) để lỗi nằm sát ô số.
2. `_map-location.scss:40-46`: link touch target < 44px trên mobile — thêm `padding-block` / `min-height: 2.75rem; display:inline-flex; align-items:center` ở màn hẹp.
3. `MapLocationField.tsx:65`: `path` undefined → id `field-…-undefined`; Payload cũng vậy, chấp nhận được, chỉ ghi chú. Label chính (`FieldLabel` `htmlFor=field-<path>`) không trỏ tới input nào — cùng hạn chế với ô point mặc định.
4. `MapLocationField.tsx:97`: `role="status"` chỉ render khi có lỗi → một số screen reader không đọc live region mới chèn; để `<p role="status">` luôn có trong DOM, chỉ đổi nội dung.
5. `map-location-parse.ts`: dán ngược "106.7009, 10.7769" → "Không đọc được" (|lat|>90) thay vì gợi ý ngược thứ tự; chấp nhận được (không lưu sai), có thể thêm gợi ý.
6. `MapLocationField.tsx:58`: `memoizedValidate as never` — ép kiểu che chữ ký; nên khai đúng kiểu `Validate` của Payload.

### Kiểm đúng (không phải lỗi)
- Parser: thứ tự ưu tiên `!3d!4d` → `@` → `?q|query|ll=` đúng; `[?&]` chặn `sll=`; số có biên `\d{1,3}` không bắt nhầm số dài trong path; link rút gọn trả `short-link`, không gọi mạng; rác/1 số/3 số → null; `%2C` giải mã an toàn.
- Component: Vĩ độ trước, Kinh độ sau; dán → `setValue([lng, lat])` đúng định dạng Payload point; xoá cả hai → `null` (validate T02 coi trống hợp lệ); nửa ô → `""` như Payload; readOnly ẩn ô dán + khoá ô số; validate memo truyền `required` như Payload; `mergeFieldStyles(field)` (BL-130); link `https://www.google.com/maps?q=lat,lng` + `rel="noopener noreferrer"` `target=_blank`; id theo `path` nên duy nhất trong array.
- `mapLocationField` không nhận `condition` nên việc component tuỳ biến không bọc `withCondition` không ảnh hưởng.

## Residual risk
- Chưa kiểm trên trình duyệt thật (1440/390, sáng/tối, ô trong array Tiện ích/Văn phòng, hiển thị lỗi server dưới ô). Bố cục chỉ xác minh bằng CSS biên dịch + suy luận.
- Hành vi CRITICAL suy ra từ mã nguồn react-dom đã cài (dòng trích ở trên), chưa tái hiện bằng trình duyệt — builder nên thêm test harness có state để khoá lại.
- Doc impact `docs/DESIGN.md` (admin form toạ độ) chưa reconcile — làm ở close-out.

## Verdict
❌ **FAIL** — 1 CRITICAL (ô số nuốt chữ số 0 → lưu sai toạ độ âm thầm), 1 MAJOR (ô dán tự áp dụng khi gõ tay). Trả builder sửa 2 lỗi trên + test kèm theo; MINOR tuỳ chọn.
