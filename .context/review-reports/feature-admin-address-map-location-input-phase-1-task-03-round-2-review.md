Agent: reviewer

# Review — feature-admin-address-map-location-input · phase-1-task-03 · round 2 (BL-131 T03)

- Review level: **STRICT**
- Reason: component client admin dùng chung cho 6 form (Cho thuê, Dự án, Tiện ích xung quanh, Tin BĐS, Cài đặt website, Văn phòng), ghi trực tiếp toạ độ `[lng, lat]`; round 1 có CRITICAL làm lưu sai toạ độ âm thầm.
- Blast radius: `src/fields/map-location.ts` (`admin.components.Field` cho mọi chỗ dùng `mapLocationField`) → 6 form admin; `src/app/(payload)/admin/importMap.js` (+1 import, +1 entry); `src/app/(payload)/custom.scss` (+`@use map-location`, stylesheet admin toàn cục). Không đổi kiểu dữ liệu, không migration. Chỉ review 7 file của task; file bẩn khác trong working tree ngoài scope.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/components/admin src/fields src/lib/admin src/collections src/globals` | PASS — 112 files / 1032 tests |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm exec eslint` 6 file TS/TSX đổi | PASS (exit 0) |
| Sass compile `custom.scss` (sass 1.77.4, loadPaths node_modules) | PASS — 62 859 ký tự; khối `.tami-map-location*` ra đúng, đứng trước `_field-errors` |
| `git diff` map-location.ts / test / custom.scss / importMap.js | Đúng phạm vi, không thừa |
| Kiểm admin thật bằng trình duyệt | skip — không có tài khoản test (không dùng `.env.local`); xem Residual risk |

## Xác nhận các finding round 1
| Round 1 | Trạng thái | Bằng chứng |
|---|---|---|
| [CRITICAL] ô số nuốt số 0 (106.7009 → 106.79) | **Đã sửa** | `MapLocationField.tsx:18` `toInputValue = numberOrNull(part) ?? ""` → prop là number như ô point Payload; React so lỏng `"106.70" != 106.7` = false nên không ghi đè. Test harness `useState` thật (`MapLocationField.test.tsx:146-179`) gõ từng ký tự `106.7009`, `10.009`, `10.0234` → `input.value` giữ nguyên + `setValue` cuối `[106.7009, ""]` / `["", 10.0234]`. Harness nối vào chữ đang hiện trong ô nên sẽ bắt lại bug cũ nếu tái phát. |
| [MAJOR] ô dán parse mỗi phím | **Đã sửa** | `:93-108` chỉ `applyPasteText` khi `onPaste` / Enter (có `preventDefault` chặn submit form) / blur; `onChange` chỉ lưu chữ + xoá thông báo. Test `:95-114` gõ từng ký tự không gọi `setValue`, status rỗng; Enter/blur mới áp dụng đúng `[lng, lat]`. |
| MINOR 1 FieldError xa ô số | Đã sửa | `:119-162` lỗi nằm trong `div.field-type__wrap` cùng `ul`; luật `_field-errors.scss:8` (`.field-type__wrap:has(> .field-error)` flex column, error order 2) đặt lỗi ngay dưới hai ô số, trước link + mô tả. Gốc `.field-type` không còn con `.field-error` nên link không bị kéo giãn. |
| MINOR 2 touch target link | Đã sửa | `_map-location.scss:41-50` `display:flex; width:fit-content; min-height:2.75rem` (≥44px), `fit-content` nên không thành cả hàng bấm được. |
| MINOR 3 id `undefined` | Chấp nhận (như Payload) | Không đổi; id theo `path` (`.`→`__`) nên duy nhất trong array. |
| MINOR 4 role=status | Đã sửa | `:114-116` `<p role="status">` luôn mount, chỉ đổi nội dung. |
| MINOR 5 gợi ý dán ngược | Đã sửa | `map-location-parse.ts:16-18` trả `{ error: "reversed" }` khi số đầu ∈ (90,180] và số sau ≤ 90; không tự đảo (tốt — không đoán). Test parser `:17-19` + component `:84-86`. |
| MINOR 6 `as never` | Đổi thành `as unknown as Validate` + comment (`:52,60`) | Vẫn là ép kiểu nhưng gom 1 chỗ, có lý do; không ảnh hưởng runtime. Chấp nhận. |

## Kiểm lại hành vi cốt lõi
- Lưu `[lng, lat]`: dán → `setValue([result.lng, result.lat])` (`:75`); ô Vĩ độ sửa index 1, Kinh độ index 0 (`:132,151`); Vĩ độ render trước. OK.
- Xoá cả hai → `null` (`nextPointValue :33`); nửa ô → `""` như Payload để validate T02 báo. OK.
- readOnly/disabled: ẩn ô dán, khoá hai ô số, class `read-only`. OK.
- `mergeFieldStyles(field)` memo (BL-130). OK.
- Link `https://www.google.com/maps?q=lat,lng`, chỉ khi cả hai là số hữu hạn, `target=_blank rel="noopener noreferrer"`; href ghép từ number đã kiểm → không XSS/`javascript:`. OK.
- Parser: `SHORT_LINK` kiểm trước → không gọi mạng; `!3d!4d` → `@` → `[?&](q|query|ll|center|destination)=` đúng ưu tiên (test `:40-43`); `[?&]` chặn `sll=`; `safeDecode` an toàn với `%` hỏng. OK.
- Leftover sau 2 builder chạy song song: không thấy class CSS chết (5 class SCSS đều dùng trong TSX), không trùng logic, test khớp component (tên `nextPointValue`/`googleMapsUrl`/`PASTE_MESSAGES` thống nhất). `mockReset` trong `beforeEach` dọn `mockImplementation` của harness. OK.

## Responsive Checklist Gate (UI admin — kiểm bằng CSS math, không có browser)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang 375/768/1280 | OK | `__coords` flex, `li { flex:1 1 0; min-width:0 }`; ≤600px xếp cột; input kế thừa width 100% từ `.field-type input`. Không width px cố định. |
| Mobile-first `min-width` | OK (ghi chú) | `max-width: 600px` theo quy ước admin Payload sẵn có; không gây lỗi bố cục. |
| Grid/container không px cố định | OK | Không có. |
| Font-size rem / heading fluid / spacing | OK / N/A / OK | 0.875rem; không heading; spacing rem. |
| Media | N/A | Không có ảnh/video. |
| Touch target ≥44px | OK | Link `min-height: 2.75rem`; ô nhập kế thừa chiều cao input Payload. |
| Nav/table mobile | N/A | |
| 100vh / reduced-motion / overflow hidden | N/A | Không dùng, không animation. |

## Skill gates
- aislop: skip — không nằm trong verify commands của profile.
- oxlint (anti-slop): skip, oxlint not configured; eslint PASS thay thế.
- ocr (open-code-review): skip, ocr not installed / không trong allowlist.
- AI-readable: OK — 1 indicator (`MapLocationField` ~125 dòng > 50, chủ yếu JSX); tên rõ, comment là WHY, không magic number. < 3 → không FAIL.
- ai-friendly-web: N/A (admin nội bộ).
- blitzstrike: skip — không có môi trường được phép; kiểm tay XSS như trên: OK.

## Findings

### [CRITICAL]
Không có.

### [MAJOR]
Không có.

### [MINOR] (không chặn PASS)
1. `src/components/admin/MapLocationField.tsx:103-107`: `onPaste` `preventDefault` rồi thay **toàn bộ** ô dán bằng chuỗi vừa dán — nếu người dùng đã gõ một phần (vd "10.7769, ") rồi dán phần còn lại, phần đã gõ mất và báo "Không đọc được". Hiếm gặp; có thể ghép theo selection (`value.slice(0,selStart) + pasted + value.slice(selEnd)`) nếu muốn.
2. `MapLocationField.tsx:119-162`: thụt lề JSX bên trong `div.field-type__wrap` lệch (ul/RenderCustomComponent không thụt) — dấu vết sửa đồng thời; chỉ là định dạng, eslint không bắt. Chạy prettier khi tiện.
3. `MapLocationField.tsx:60`: `memoizedValidate as unknown as Validate` vẫn là double-cast; đã có comment lý do — chấp nhận.
4. Khi gõ dở "10." trình duyệt có thể báo `value=""` → giá trị tạm thành `""`/`null` cho tới phím kế tiếp; giống hệt ô point mặc định của Payload, không làm sai giá trị cuối (test harness xác nhận).

## Residual risk
- Chưa kiểm trên trình duyệt thật (1440/390, sáng/tối, ô trong array Tiện ích/Văn phòng, lỗi server hiển thị dưới ô, style mặc định Payload của `.field-type__wrap` khi bọc `ul`). Bố cục chỉ xác minh bằng CSS biên dịch + suy luận. Acceptance "Kiểm admin thật" của task vẫn mở — cần QA tay khi có tài khoản test.
- Hành vi React number input xác minh qua jsdom + mã react-dom, chưa qua Chrome/Safari thật.
- Doc impact `docs/DESIGN.md` (admin form toạ độ) chưa reconcile — làm ở close-out.

## Verdict
✅ **PASS** — CRITICAL và MAJOR round 1 đã sửa có test khoá lại; MINOR round 1 đã xử lý hoặc chấp nhận có lý do; còn 4 MINOR không chặn. Verify vitest/typecheck/eslint/sass đều PASS.
