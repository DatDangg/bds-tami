Agent: reviewer

# Review: feature-admin-ui-saas-refresh, phase-1-task-01, round 3 (BL-015; user đã duyệt ngoại lệ vượt giới hạn 2 vòng)

- Worktree: `D:/prj/bds-wt15-t01` (base 1c0554a, chưa commit). Fix của builder ghi ở task file, mục "Attempt 3".
- Trọng tâm: MAJOR-1 của round 2 (vùng bấm thật của checkbox admin trên mobile <768 phải ≥ 44×44). Ngoài ra quét nhanh lại toàn diff.

## Review level: NORMAL
**Reason:** chỉ có CSS admin, một component trình bày và test unit. Không đụng auth, schema, API hay access. Round này chỉ đổi khối mobile trong `_controls.scss` và thêm 1 test.

**Blast radius:** mọi `.checkbox-input` của Payload trên mobile (<768): checkbox field trong form, `SelectRow`/`SelectAll` ở list view, `CheckboxPopup`, checkbox trong modal DeleteMany/Restore/Duplicate. Radio không đổi. Frontend không bị ảnh hưởng.

## Verify commands + result (chạy trong worktree, DB `tami_wt15_t01`)
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS (exit 0), 243 file |
| `pnpm build` | PASS (exit 0) |

## Kiểm MAJOR-1 bằng DOM/CSS math (`@payloadcms/ui` 3.91.0)
| Điểm kiểm | Kết quả | Bằng chứng |
|---|---|---|
| Offset căn giữa input 44×44 | OK | `.checkbox-input__input` là `position:relative`, rộng 22px (ghi đè), viền 1px (formInput), `padding:0`, nên padding-box rộng 20px và tâm nằm ở 10px. Input `position:absolute` không có top/left, nên mép đặt tại gốc padding-box. Với margin −12px, input phủ [−12, 32] theo padding-box, tâm ở 10px, trùng tâm hộp. Đối chiếu Payload gốc: `calc(100%+4px)` với `margin -2px` phủ [−2, 22], cũng tâm 10px |
| Specificity / layer | OK | Rule Payload nằm trong `@layer payload-default`; rule của diff không có layer nên thắng mà không cần `!important`. Rule `.checkbox-popup .checkbox-input { align-items:center }` (0,2,0, có layer) cũng thua `.checkbox-input { align-items: stretch }` không layer |
| Label stretch phủ cả hàng (form, popup) | OK | `.checkbox-input` là inline-flex với `align-items:stretch`, `label.field-label` có `min-height:44px` và tự căn chữ giữa bằng `align-items:center`. Hộp có `align-self:center` trong hàng 44px, nên input trải đúng y 0..44 của hàng. Vì vậy chạm bất kỳ đâu trên hàng đều rơi vào label `for` hoặc input |
| SelectRow / SelectAll (không label) | OK, có lưu ý MINOR | `.select-row__checkbox`/`.select-all__checkbox` đặt `display:block` lên chính div `.checkbox-input` (`Input.js:51`: className nối vào cùng div). Nếu rule này thắng theo thứ tự bundle thì `align-self` mất tác dụng: hộp nằm ở đỉnh, input vẫn đủ 44×44 quanh tâm hộp. Theo chiều ngang: td đầu có padding trái `base(0.8)` = 16px và padding phải `base(0.6)` = 12px, đều ≥ 11px tràn ra, nên input không lấn sang ô bên cạnh (mỗi td là stacking context riêng `relative; z-index:1`). Theo chiều dọc: tràn khoảng 3px lên phần padding không tương tác của ô select hàng trên, không che control nào |
| Checkbox xếp cạnh nhau trong form | OK | Input bị giới hạn trong hàng 44px. Giữa các `.checkbox` có `margin-bottom:$baseline`, nên không chồng nhau theo chiều dọc. Tràn trái 11px chỉ rơi vào gutter |
| Radio | Không đổi | `_controls.scss:287-290` giống round 2 |
| `!important` | OK | Diff không thêm `!important` (chỉ còn 3 chỗ logo có sẵn ở `custom.scss:127-138`) |
| Test | OK (regex trên source) | `admin-tokens.test.ts:135-145` khóa các giá trị 44/−12/stretch và kiểm không có `!important`. Đây là guard cấu hình, không đo hit-test |

## Responsive Checklist Gate (375/768/1280, không có browser, xác minh bằng CSS math + DOM)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | Input tràn ra nằm trong padding ô bảng hoặc trong vùng `overflow:auto` của `.table`; không có width cố định mới |
| Mobile-first `min-width` | OK, ngoại lệ có lý do | `max-width:767px` để ghi đè đúng mốc desktop-first của Payload (như round 1/2) |
| Grid / container | N/A | Không có grid hay container mới |
| Font `rem` / `clamp` | OK, ngoại lệ có lý do | Như round 2 |
| Media | N/A | Không có media mới |
| **Touch target ≥ 44×44** | **OK** | Checkbox: input thật 44×44 căn tâm hộp, form/popup có thêm label phủ cả hàng. Radio, nút, input, select, nav giữ như round 2 |
| Nav mobile | OK | Giữ drawer của Payload |
| Table scroll / card | OK | `.table` của Payload có `overflow:auto` |
| Không `100vh` | OK | Không dùng |
| `prefers-reduced-motion` | N/A | Không có animation mới |
| Không che lỗi bằng `overflow:hidden` | OK | Như round 2 |

## Skill gates
| Gate | Kết quả |
|---|---|
| aislop | skip: không nằm trong verify command được phép của reviewer |
| oxlint | skip: oxlint chưa cấu hình (dự án dùng eslint, `pnpm lint` PASS) |
| ocr | skip: ocr chưa cài |
| AI-readable | OK: comment giải thích WHY và toán offset. `_controls.scss` 297 dòng (≤ 300, sát ngưỡng). 0 indicator |
| ai-friendly-web | N/A: admin nội bộ |
| blitzstrike | N/A |

## Findings
- **MAJOR-1 (round 2): ĐÃ ĐÓNG.**
- **[MINOR-1]** `_controls.scss:266-268`: trên list view mobile, `min-height:44px` của `.checkbox-input` làm hàng cao 60px thay vì 48px và header cao 64px thay vì 40px. Nếu `display:block` của `.select-row__checkbox` thắng thì hộp còn lệch lên đỉnh ô. Ngoài ra input của SelectAll có thể bị `.table` cắt khoảng 1px ở mép trên (th `padding-top:10px` so với 11px tràn). Không chặn PASS. Có thể sửa ở T03/T04: với `.select-row__checkbox, .select-all__checkbox` thì bỏ `min-height` (input 44×44 tự đủ vùng bấm) và căn giữa bằng flex.
- **[MINOR-2]** `_controls.scss` 297/300 dòng. Task sau thêm style thì nên tách file.

## Residual risk (primary cần đo bằng trình duyệt)
- Chưa đo hit-test thật. Cần đo ở viewport 390px: form Projects (checkbox field) và list view (SelectRow/SelectAll). Kiểm `elementFromPoint` tại các điểm cách tâm hộp ±21px theo x/y phải trả về input hoặc label của chính checkbox đó.
- Rule nào thắng giữa `display:block` (select-row/select-all) và `inline-flex` phụ thuộc thứ tự bundle CSS; cả hai trường hợp đều cho vùng bấm 44×44 (khác nhau ở căn hàng, xem MINOR-1).
- Glow focus `!important` của Payload (MINOR-4 round 1) giữ làm residual như builder đã ghi.

## Verdict: PASS
MAJOR-1 đã đóng nhờ input 44×44 căn tâm hộp, được chứng minh bằng DOM/CSS math. Không phát sinh CRITICAL/MAJOR mới; radio và các phần đã PASS ở round 2 không regression. Lint, typecheck, test, build đều PASS.
