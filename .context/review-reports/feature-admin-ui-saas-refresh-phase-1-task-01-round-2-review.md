Agent: reviewer

# Review: feature-admin-ui-saas-refresh, phase-1-task-01, round 2 (BL-015 style chung + token admin sáng/tối, sau fix round 1)

- Worktree: `D:/prj/bds-wt15-t01` (base staging 1c0554a, chưa commit)
- Phạm vi: `src/app/(payload)/custom.scss` (M), `src/components/admin/TranslationFailedBanner.tsx` (M), `src/components/admin/admin-tokens.ts` + `.test.ts` (A), `src/components/admin/styles/_tokens|_controls|_surfaces|_lists.scss` (A). Bỏ qua `src/payload-types.ts`, `importMap.js` (chỉ khác line-ending), `docs/specs/`, `tasks/`, `.context/runs/*.builder.md`.
- Round 1: `.context/review-reports/feature-admin-ui-saas-refresh-phase-1-task-01-round-1-review.md`. Builder ghi fix ở task file, mục "Attempt 2 — fix review r1".

## Review level: NORMAL
**Reason:** vẫn chỉ có CSS, một component trình bày và test unit. Không đụng auth, schema, API, hook hay access. Round 2 chỉ kiểm lại các fix của round 1.

**Blast radius:** như round 1, tức mọi màn `/admin` sáng và tối qua CSS dùng chung. Fix MAJOR-1 có thêm tác động lên mọi `.checkbox-input` trên mobile (<768): field checkbox trong form, checkbox chọn dòng / chọn tất cả ở list view (`SelectRow`/`SelectAll` dùng `CheckboxInput`), checkbox ở popup bộ lọc / cột. Nó cũng tác động lên mọi `.radio-input`. Frontend không bị ảnh hưởng.

## Verify commands + result (chạy trong worktree, DB `tami_wt15_t01` theo `.env.local`)
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS: 2550/2550 test (exit 0), khớp số builder báo |
| `pnpm build` | PASS (exit 0) |

## Kiểm từng finding round 1

| Finding | Kết quả | Bằng chứng |
|---|---|---|
| MAJOR-1 checkbox/radio vùng chạm 44px (mobile) | **Radio: OK. Checkbox: CHƯA ĐẠT** | Xem phân tích DOM bên dưới |
| MINOR-1 sticky header chết | OK | `_lists.scss` đã bỏ `position: sticky; top: 0` khỏi `th`. Comment dòng 3 ghi lý do (`.table` có `overflow:auto`). Task file ghi header dính để T03/T04 xử lý |
| MINOR-2 làm tròn ratio trước khi so | OK | `admin-tokens.test.ts:32-41`: so ratio thô, chỉ `toFixed(3)` trong message |
| MINOR-3 radius/shadow chưa đối chiếu, export thừa | OK | Đã thêm case `radius s/m/l` và `%s: --admin-shadow-sm/md` (`admin-tokens.test.ts:121-132`). `contrastRatio` không còn `export` |
| MINOR-4 focus checkbox là glow `!important` của Payload | OK (residual hợp lệ) | Payload 3.91 `fields/Checkbox/index.scss` đặt `box-shadow … !important` trong `@layer payload-default`. Declaration `!important` trong layer thắng mọi declaration ngoài layer, kể cả `!important` ngoài layer, mà task lại cấm thêm `!important`. Glow màu nhấn vẫn là chỉ báo focus nhìn thấy được. Builder đã ghi residual trong task file. Vẫn có thể thêm `outline` (Payload chỉ đặt `outline: 0` dạng thường) nếu muốn có ring 2px; không bắt buộc |

### Phân tích DOM MAJOR-1 (`node_modules/@payloadcms/ui` 3.91.0)
- **Radio:** `fields/RadioGroup/Radio/index.js` render `<label htmlFor={id}><div class="radio-input">input + span.__styled-radio + span.__label</div></label>`. Div `.radio-input` (`display:flex`, rộng full) nằm **bên trong** `<label>`. Vì vậy `min-height: 44px` đặt trên `.radio-input` làm toàn bộ hàng 44px thuộc label, chạm đâu trên hàng cũng chọn được radio. **Đạt.**
- **Checkbox:** `fields/Checkbox/Input.js` render `<div class="checkbox-input"><div class="checkbox-input__input">input(absolute) + icon</div><label class="field-label" for={id}>…</label></div>`. Div `.checkbox-input` **không** phải label, label chỉ là một flex item con. Fix đặt `min-height: 44px; align-items: center` lên `.checkbox-input`, mà `align-items: center` làm mọi item co về chiều cao nội dung:
  - `.checkbox-input__input` có `height: $baseline` cố định. Input thật là `position:absolute`, rộng/cao `calc(100% + 4px)`, nên vùng chạm hộp khoảng 26×26.
  - `label.field-label` (`display:flex`, padding-bottom bị Payload đặt 0 trong `.checkbox-input`) chỉ cao bằng một dòng chữ body, khoảng 20px.
  - Phần trống phía trên và dưới label, trong khoảng 44px của div, là vùng của `div`, chạm vào **không toggle**.
  - Kết quả: hàng nhìn thì cao 44px nhưng vùng bấm thật vẫn khoảng 26px chiều cao. Ghi chú "chạm label cũng toggle" trong task file chỉ đúng cho phần chữ. Đề xuất fix ở round 1 của reviewer cũng thiếu điểm này (tôi chưa tính tới việc `align-items:center` làm label co lại), nên round này nêu lại kèm cách fix chính xác.

## Responsive Checklist Gate (diff đụng UI admin; 375/768/1280; không có browser, xác minh bằng CSS math + DOM)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | Round 2 không thêm width cố định. `min-height` trên hàng checkbox/radio không làm tăng chiều ngang |
| Mobile-first `min-width` | OK, ngoại lệ có lý do | Giữ `max-width: 767px` để ghi đè đúng mốc desktop-first của Payload (như round 1) |
| Grid `auto-fit`/`minmax`, container không fixed px | N/A | Không có grid/container mới |
| Font `rem`, heading `clamp()` | OK, ngoại lệ có lý do | Thang chữ px theo design §1.5 / Payload (như round 1) |
| Media `max-width`/`aspect-ratio`/`srcset` | N/A | Không có media mới |
| **Touch target ≥ 44×44 (mobile)** | **FAIL (checkbox)** | Nút, input, react-select, search bar, nav, radio đều đạt. Riêng checkbox thì vùng bấm thật khoảng 26px chiều cao (phân tích trên). `_controls.scss:261-265` |
| Nav mobile | OK | Giữ hamburger/drawer của Payload |
| Table scroll wrapper / card | OK | `.table` của Payload có `overflow:auto` |
| Không `100vh` trần | OK | Không dùng `vh` |
| `prefers-reduced-motion` | N/A | Không có animation mới |
| Không che lỗi bằng `overflow:hidden` | OK | Chỉ còn `.rs__menu` (cắt option theo bo góc) |

## Skill gates
| Gate | Kết quả |
|---|---|
| aislop | skip: không nằm trong danh sách verify command được phép của reviewer |
| oxlint (anti-slop) | skip: oxlint chưa cấu hình (dự án dùng eslint; `pnpm lint` PASS) |
| ocr (open-code-review) | skip: ocr chưa cài |
| AI-readable | OK: tên rõ, comment giải thích WHY, không hàm > 50 dòng. 0 indicator mới |
| ai-friendly-web | N/A: admin nội bộ |
| blitzstrike | N/A: không phải STRICT |

## Phạm vi / quy tắc
- Không đụng frontend, schema, access, hook, API: OK (diff tracked chỉ có `custom.scss` + `TranslationFailedBanner.tsx`; file mới chỉ nằm trong `src/components/admin/`).
- Không `!important` mới: OK (chỉ còn 3 chỗ logo có sẵn ở `custom.scss:127-138`).
- File ≤ 300 dòng: OK (`_controls` 273, `_lists` 172, `_surfaces` 208, `_tokens` 154, `admin-tokens.ts` 139, test 133). Hàm ≤ 50: OK.
- Fix không sinh lỗi mới ngoài điểm checkbox nêu dưới.

## Findings

### [MAJOR-1] (còn mở, checkbox) Vùng bấm thật của checkbox trên mobile vẫn < 44px
- `src/components/admin/styles/_controls.scss:261-265`: `.checkbox-input { min-height: 44px; align-items: center; }`. Trong DOM Payload 3.91, `.checkbox-input` là `div` chứa hộp và `<label for>` cạnh nhau. `align-items: center` làm label co về khoảng 20px, hộp 22px (input absolute khoảng 26px), còn phần đệm của div thì không bấm được. Radio đã đạt vì `.radio-input` nằm trong `<label>`.
- **Fix đề xuất** (chọn một, giữ hộp 22px, không `!important`, chỉ trong khối `@media (max-width: 767px)`):
  - (a) Cho label lấp đầy chiều cao hàng: `.checkbox-input { align-items: stretch; } .checkbox-input label.field-label { min-height: 44px; align-items: center; }` và `.checkbox-input__input { align-self: center; }`. Khi đó chạm bất kỳ đâu trên phần chữ của hàng 44px đều toggle. Lưu ý checkbox chọn dòng ở list view không có label nên vẫn cần thêm (b).
  - (b) Mở rộng chính input ẩn thành 44×44 quanh hộp: `.checkbox-input__input input[type="checkbox"] { width: 44px; height: 44px; margin-left: -11px; margin-top: -11px; }` (unlayered thắng rule trong layer của Payload). Cách này phủ cả checkbox không label (SelectRow/SelectAll).
  - Khuyến nghị (b), hoặc (a)+(b). Sau đó đo vùng bấm thật (không phải chiều cao hàng) ở form Projects và list view, viewport 390px.

### [MINOR] Không có finding MINOR mới.

## Residual risk
- Không có browser: kết luận checkbox/radio dựa vào DOM `node_modules/@payloadcms/ui/dist/fields/Checkbox/Input.js`, `fields/RadioGroup/Radio/index.js` và SCSS layer của Payload, chưa đo hit-test thật. Builder cũng ghi "chưa đo bằng trình duyệt" cho fix này.
- Touch-adjustment của trình duyệt mobile có thể nới vùng bấm, nhưng không được tính là đạt yêu cầu 44px của design §1.4.
- MINOR-4 (glow focus checkbox) giữ làm residual như builder đã ghi.

## Verdict: FAIL
Còn MAJOR-1 cho checkbox (vùng bấm thật < 44px trên mobile), nên mục Touch của gate Responsive vẫn FAIL. Phần radio của MAJOR-1 và MINOR-1..3 đã xử lý đúng; MINOR-4 là residual hợp lệ. Verify lint/typecheck/test/build đều PASS.
