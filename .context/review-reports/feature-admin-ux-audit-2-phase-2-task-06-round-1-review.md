Agent: reviewer

# Review — feature-admin-ux-audit-2 · phase-2-task-06 · round 1 (BL-051 GĐ2 A14 + carry-over A11)

## Review level
NORMAL

## Reason
Thay đổi chỉ ở cấu hình bố cục admin (tab/collapsible không tên), nhãn, chú thích, một quy tắc CSS cho mobile và quy tắc quét nhãn trong test. Không đổi schema/DB/access/API. Không nâng lên STRICT vì:
- Đường dẫn dữ liệu không đổi: mọi group khối giữ nguyên định nghĩa; diff chỉ đổi kiểu `Field` -> `GroupField`, còn `label: false` được thêm qua spread trong `homepageBlock`. Collapsible/tab đều không có `name`. `payload-types.ts` chỉ đổi chú thích và thứ tự.
- Quy tắc quét nhãn được nới rất hẹp (xem bên dưới), có ca âm tính đi kèm.

## Blast radius
- `src/globals/Homepage.ts`: form admin của global Trang chủ (bố cục), shape API/DB không đổi.
- `src/globals/homepage/blocks.ts`: `enabledField` (chỉ đổi nhãn, chỉ Trang chủ dùng: 11 công tắc), chuỗi `BLOCK_ORDER_NOTE`, chú thích kiểu.
- `src/fields/translation.ts`: được Header/Footer/SiteSettings/Homepage (`translationGroup()`) và mọi collection nội dung (`translationFields()` -> `translationDataGroup()`, `translationBlockFields()` trong `content-defaults.ts`) dùng.
- `src/components/admin/styles/_forms.scss`: `.collapsible__toggle` ở <=767px, áp cho mọi collapsible admin (Leads "Nguồn", sidebar "Nâng cao", "Bản dịch tiếng Anh", và các khối Trang chủ).
- `tests/unit/admin-labels.test.ts`: quy tắc gate nhãn.
- Trang chủ công khai: không ảnh hưởng (dữ liệu/đường dẫn giữ nguyên; bộ duyệt field của dịch tự động `src/lib/translation/leaves.ts:95` đã xử lý `collapsible`).

## Verify commands + result
- `pnpm typecheck`: PASS (exit 0).
- `pnpm lint`: PASS, 0 error, 2 warning có sẵn ở `tools/task-dashboard/server.mjs` (ngoài scope).
- `pnpm test`: PASS, 361 file / 3639 test.
- Kiểm `payload-types.ts` độc lập: so tập dòng -/+ đã sắp xếp (bỏ CR) thì chỉ khác 4 dòng chú thích (mô tả `blockOrder` + 3 lần `BLOCK_ORDER_NOTE`); 69+/69- còn lại là đổi thứ tự. Không đổi kiểu.
- `migrate:create` "No schema changes detected": lấy theo bằng chứng của builder (reviewer không được chạy lệnh DB/payload); khớp với kết quả diff types ở trên.

## Kiểm theo yêu cầu
- **Đường dẫn dữ liệu / baseline**: `PATHS_BEFORE_A14` là danh sách viết cứng, nên không chứng minh bằng thực thi được rằng nó được ghi từ `HEAD`. Tôi kiểm bằng cấu trúc: `HEAD` có 14 tab chứa đúng 15 field gốc (announcementBar, hero, heroSearch, strengths, about, featuredProjects, services, featuredOffers, rentals, news, partners, ctaBanner, blockOrder, seo, translation). Bản mới có đúng tập này, và diff không đụng tới field con nào. Như vậy tập đường dẫn giống hệt về mặt cấu trúc, đồng thời khớp với diff `payload-types` (không đổi kiểu). Danh sách viết cứng cũng không lấy từ config mới: nó là hằng số độc lập và được so bằng `toEqual` sau khi sắp xếp, có kiểm cả độ dài. OK.
- **Group `label: false`**: chỉ ảnh hưởng hiển thị. Group có `name` vẫn tạo một cấp dữ liệu, tên cột DB không đổi. OK.
- **Nới quét nhãn**: chỉ miễn khi thỏa đủ (a) cha trực tiếp là `collapsible`, (b) collapsible đó có nhãn tiếng Việt hợp lệ, (c) field là `group`, (d) `label === false`. Field con của group đó vẫn được quét với `titledByParent=false`. Group trong `row` hoặc trong collapsible không nhãn vẫn bị bắt (có ca âm tính `x.(row).unTitled`). Không để lọt field thiếu nhãn. OK.
- **Refactor `translation.ts`**: `translationGroup()` tương đương `translationGroup(true)` cũ, `translationDataGroup()` tương đương `translationGroup(false)` cũ (nhóm ẩn của P2-T05). `translationBlockFields()` trả về đúng 2 field ui như trước. Không còn ai gọi `translationGroup(false)` hay `translationActionFields`. Hành vi giống hệt. OK.
- **`_forms.scss`**: nằm trong `@media (max-width: 767px)` có sẵn, chỉ thêm `min-height: 44px` (thanh tiêu đề mặc định cao 40px). Áp cho mọi collapsible trên mobile và chỉ làm chúng cao hơn 4px, không gây tràn. Chấp nhận được.
- **Trang chủ công khai**: không đổi dữ liệu. Builder đo lại HTML `/vi` thấy giống trước và sau, đồng thời kiểm vòng bật/tắt `partners.enabled` qua API.

## Responsive Checklist Gate
Phạm vi: chỉ form admin global Trang chủ và một quy tắc CSS. Không có browser cho reviewer, nên phần dưới xác minh bằng CSS/cấu trúc cộng bằng chứng của builder.
- Layout, không cuộn ngang: OK. Không thêm width cố định. Builder đo `scrollWidth = innerWidth` ở 375 (tối) và 1280 (sáng/tối) trên cả 5 tab.
- Mobile-first `min-width`: N/A. Quy tắc mới nằm trong khối `max-width: 767px` có sẵn của file (theo đúng quy ước file, chỉ thêm 1 thuộc tính).
- Grid `auto-fit/minmax`: N/A (không thêm grid).
- Typography rem/clamp: N/A (không đổi font).
- Media: N/A.
- Touch target >= 44px: OK. `.collapsible__toggle { min-height: 44px }` ở mobile; builder đo được 44px ở 375.
- Nav mobile / table wrapper: N/A (dùng tab của Payload có sẵn).
- 100vh / reduced-motion / overflow hidden: N/A (không thêm).
- Kết quả gate: không mục nào FAIL.

## Skill gates
- aislop: skip, chưa cài `aislop`.
- oxlint (anti-slop): skip, oxlint chưa được cấu hình (không có `.oxlintrc*`). `pnpm lint` (eslint) có 0 error.
- ocr (open-code-review): skip, chưa cài `ocr`.
- AI-readable: OK. Tên rõ (`homepageBlock`, `blocksOf`, `homepageTabs`, `translationDataGroup`), hàm ngắn, comment nói WHY, gián tiếp <= 2 bước. Có 1 indicator nhẹ (file vượt 300 dòng, M1) và 1 comment cũ (M2): tổng 2 < 3, nên OK.
- ai-friendly-web: N/A (admin nội bộ).
- blitzstrike: N/A (không phải STRICT, không đụng auth hay input công khai).

## Findings
- [MINOR] M1 — `src/globals/Homepage.ts` hiện có 310 dòng (ở `HEAD` là 291), vượt mốc 300 dòng. Đề xuất: chuyển `homepageBlock` / `blocksOf` / `homepageTabs` sang `src/globals/homepage/layout.ts`, hoặc tách `blockOrderField` + `validateBlockOrder` sang `homepage/`.
- [MINOR] M2 — `src/globals/homepage/blocks.ts:43`: JSDoc của `BLOCK_ORDER_NOTE` vẫn ghi tên cũ "Thứ tự khối", trong khi chuỗi và nhãn đã đổi thành "Thứ tự các khối". Đề xuất: sửa comment cho khớp.
- [MINOR] M3 — `src/globals/Homepage.test.ts`: tên test "nhãn group/array bỏ để không lặp tiêu đề" nhắc tới array, nhưng chỉ group bị đặt `label: false` (`blockOrder` vẫn giữ nhãn). Đề xuất: bỏ chữ "/array".
- [MINOR] M4 — Bằng chứng: baseline `PATHS_BEFORE_A14` không có ghi chú cách sinh (vd lệnh hoặc commit `e2c2473`). Đề xuất: thêm một dòng comment ghi nguồn (`HEAD e2c2473`) để người sau tin được baseline.
- Residual risk: chưa soi giao diện sáng ở 375px (builder tự ghi nhận). Reviewer không chạy được `migrate:create` và browser nên dựa vào bằng chứng của builder, được kiểm chéo bằng diff `payload-types`.

## Verdict
PASS — không có CRITICAL/MAJOR. 4 MINOR không chặn; có thể sửa trong task này trước commit hoặc ghi lại làm carry-over.
