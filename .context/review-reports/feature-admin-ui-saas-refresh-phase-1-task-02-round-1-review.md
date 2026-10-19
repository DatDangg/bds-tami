Agent: reviewer

# Review — feature/admin-ui-saas-refresh · phase-1-task-02 · round 1

- Work item: BL-015, FR-ADM-19. Việt hoá toàn bộ nhãn admin và thêm test quét config.
- Code: worktree `D:/prj/bds-wt15-t02` (branch `wt/bl15-t02`, base staging `1c0554a`), chưa commit.
- Review level: **NORMAL**
- Reason: task chạm khoảng 40 file config Payload, nhưng sau khi duyệt từng hunk thì chỉ thấy thay đổi ở `label`/`labels`/`admin.description`/`admin.components.RowLabel`/nhãn option. Không đổi `name`, kiểu, required, localized, index, access hay hook. Không có schema/migration (đã chạy kiểm), không đụng auth hay API contract. Không có lý do nâng lên STRICT.
- Blast radius: chỉ phần hiển thị trong admin Payload (nhãn collection/global/field, description, nhãn hàng array). `TranslationFailedBanner` dùng `COLLECTION_LABELS`/`GLOBAL_LABELS`: vẫn giữ đúng 9 khoá collection có dịch và 4 global, chỉ đổi nhãn header "Đầu trang" thành "Menu đầu trang" để thống nhất theo N5. `payload-types.ts` chỉ thêm JSDoc. `importMap.js` thêm 1 entry. Không đụng `src/app/(frontend)`.

## Verify commands + result (chạy trong worktree)

| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` (unit + integration, DB `tami_wt15_t02`) | PASS: 243 file / 2559 test, exit 0. Lần chạy này không gặp recovery mode hay timeout |
| `pnpm build` | PASS (exit 0) |
| `pnpm payload migrate:create --skip-empty` (DB `tami_wt15_t02`) | Không tạo file migration. `git status --untracked-files=all` không có file mới trong migrations |
| `git diff --ignore-cr-at-eol -U0 src/payload-types.ts`, lọc dòng không phải comment | 0 dòng bị xoá; toàn bộ dòng thêm là JSDoc (`/**`, `*`, `*/`). Không đổi kiểu |

## Kiểm trọng tâm

1. **Không đổi name/type/required/localized/index/access/hook, không thêm admin.group**: OK. Đã lọc diff, bỏ các dòng label/labels/description/RowLabel, rồi đọc phần còn lại.
   - Các dòng `useAsTitle`/`defaultColumns`/`hidden` xuất hiện trong diff chỉ vì object `admin` được tách ra nhiều dòng; giá trị giữ nguyên (đã đối chiếu LeadActivities, PrivateFiles, Media, Categories, redirects).
   - Helper đổi chữ ký (`nonNegativeNumber`, `mediaUpload`, `imageUpload`, `directionField`) chỉ thêm tham số `label`.
   - Homepage: `{ ...enabledField, defaultValue: false }` và `{ ...titleField, validate }` cho ra đúng name/type/localized/default như trước, chỉ thêm label.
   - redirects: override `type` thay `options` bằng `[{label:"301 (vĩnh viễn)", value:"301"}]`, khớp `redirectTypes: ["301"]` nên enum không đổi (migrate:create xác nhận).
   - `translation.admin.readOnly: true` đã có từ trước, chỉ thêm description.
   - Không có `admin.group` nào được thêm.
2. **payload-types.ts chỉ đổi comment**: OK (xem bảng trên).
3. **migrate:create không tạo file**: OK.
4. **Test quét đủ mạnh**: OK, với vài giới hạn MINOR ghi ở dưới.
   - Nạp động mọi module trong `src/collections` và `src/globals`. Assert số lượng: đúng 21 collection, đúng 4 global, có `redirects` (lấy bằng cách áp plugin).
   - Đệ quy qua `fields`/`tabs`/`blocks`, tức là phủ cả group/array/row/collapsible.
   - Kiểm các mục (a) đến (d), và còn bắt option có `label === value` (mã thô), đúng theo N6(c).
   - Có test tự kiểm bộ quét: thiếu label, array thiếu labels, option rỗng/chuỗi/mã thô, field trong row, collection/global thiếu labels.
   - Quy tắc miễn được viết rõ trong code: field không `name` bỏ qua; `admin.hidden: true` bỏ qua kể cả con. Field `ui` có tên vẫn bị đòi label; field-level `hidden` vẫn bị đòi label (chặt hơn yêu cầu). Như vậy N6(a)(b) đã có quy tắc rõ.
5. **Nhãn tiếng Việt đúng nghĩa**: OK. Đã đọc toàn bộ nhãn thêm mới; không còn option dạng `label: value` (AUDIT_ACTIONS, CLICK_TYPES, ROLE_VALUES, LEAD_STATUSES, SOCIAL_PLATFORMS, HOMEPAGE_BLOCKS, translation status/enSource đều có map nhãn). Tên thương hiệu (Facebook, Zalo, Hotline, Fanpage) giữ nguyên, hợp lệ theo N6(c).
6. **Một nguồn nhãn**: OK.
   - `src/lib/admin/collection-labels.ts` là nguồn duy nhất. `admin-ui.ts` lấy `COLLECTION_LABELS` từ `ADMIN_COLLECTION_LABELS[slug].plural` cho 9 collection có dịch, và `GLOBAL_LABELS = { ...ADMIN_GLOBAL_LABELS }`. Giá trị cũ của 9 collection khớp 100%, nên banner không đổi tập khoá và không phát sinh request 400 (N5).
   - Vì sao chấp nhận đặt nhãn ở `src/lib/admin/` (ngoài `src/components/admin/**`): đây là dữ liệu nhãn và helper cấu hình admin thuần, không có runtime logic, không đụng frontend hay schema. Mục đích của ràng buộc (chỉ chạm `/admin`, không đổi schema/API) vẫn được giữ.
7. **importMap chỉ thêm entry**: OK. Thêm đúng 2 dòng (import + entry `TextRowLabel`), không xoá gì.
8. **Không đụng `src/app/(frontend)`**: OK. File mới đều ≤ 126 dòng; file sửa lớn nhất là Homepage 243 dòng (≤ 300). Hàm mới đều ngắn. Xem MINOR-1 về các factory config có sẵn.

## Responsive Checklist Gate

Diff có đụng UI: thêm 1 client component `TextRowLabel`, chỉ render `<span>` text bên trong header hàng array của Payload. Không có CSS, layout, route hay media mới.

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Layout: không cuộn ngang / mobile-first / grid / container | N/A | Không thêm CSS hay layout; `<span>` inline nằm trong header hàng của Payload |
| Typography/Spacing (rem, clamp) | N/A | Không đặt style; kế thừa style của Payload |
| Media (max-width, aspect-ratio, srcset) | N/A | Không có ảnh hay video |
| Touch target ≥ 44px / nav mobile / table wrapper | N/A | Không thêm phần tử tương tác (hàng array vẫn do Payload điều khiển) |
| Viewport/A11y (100dvh, reduced-motion, overflow:hidden) | N/A | Không có CSS |

Residual: chưa xem trên trình duyệt ở 375/768/1280 (reviewer không chạy app). Rủi ro là nhãn hàng dài (ví dụ tiêu đề slide) bị tràn trong header hàng, nhưng phần cắt chữ do CSS của Payload xử lý, không thuộc diff này.

## Skill gates

| Gate | Kết quả |
|---|---|
| aislop | skip, aislop chưa cài (`command -v aislop` không có) |
| oxlint (anti-slop) | skip, oxlint chưa cấu hình (không có `.oxlintrc.json`/`oxlint.json`); `pnpm lint` (eslint) PASS |
| ocr (open-code-review) | skip, ocr chưa cài |
| AI-readable | OK. Tên rõ (`collectionLabels`, `textRowLabel`, `ACTION_LABELS`, `BLOCK_LABELS`…); comment giải thích WHY (lý do tách hai map, vì sao quét config thô); indirection ≤ 2 bước (collection → `collectionLabels` → map); không có magic number. Chỉ có 1 indicator nhẹ (factory config > 50 dòng, có sẵn từ trước), dưới ngưỡng 3 |
| ai-friendly-web | N/A (chỉ admin nội bộ) |
| blitzstrike | N/A (không phải STRICT, không có bề mặt auth/input mới) |

## Findings

Không có [CRITICAL] hay [MAJOR].

- **[MINOR-1]** `src/globals/SiteSettings.ts:65-146`: `createSiteSettings` dài khoảng 81 dòng (base khoảng 70 dòng, đã vượt 50 từ trước). Task này làm dài thêm khoảng 11 dòng vì thêm label. Các factory config như `createRentals` cũng vậy. Đây là object khai báo và vi phạm có sẵn, ngoài scope. Đề xuất task riêng: tách mảng `fields` thành hằng hoặc hàm con (ví dụ `contactFields`, `socialLinksField`).
- **[MINOR-2]** `src/fields/translation.ts` (hàm `options`): `labels[value] ?? value` âm thầm rơi về mã tiếng Anh khi thiếu nhãn. Test quét vẫn bắt được trường hợp này (`label === value`) nên chưa gây lỗi thật. Đề xuất (tuỳ chọn): đổi kiểu sang `Record<TranslationStatus, string>` để typecheck bắt thay vì fallback.
- **[MINOR-3]** `tests/unit/admin-labels.test.ts:44`: với field `blocks`, test chỉ đệ quy vào `block.fields`, không kiểm `block.labels` của từng block. Hiện repo không có field `blocks` nào (thứ tự khối trang chủ là array `blockOrder`), nên không có lỗ hổng thực tế. Đề xuất bổ sung khi có blocks.
- **[MINOR-4]** `tests/unit/admin-labels.test.ts:91-93`: test quét config export thô, không quét config cuối sau `buildConfig`/plugin khác. Field hệ thống do Payload hay plugin thêm (versions, trash, `deletedAt`) không được kiểm. Chấp nhận được vì Payload tự gắn nhãn i18n cho các field này; ghi lại để biết.
- **[MINOR-5]** `src/lib/admin/row-label.ts:1`: `lib` import type từ `components`, ngược chiều phụ thuộc thông thường. Vì là import type-only nên không ảnh hưởng bundle. Có thể chuyển `TextRowLabelProps` sang `lib/admin` nếu muốn sạch chiều phụ thuộc.

## Residual risk

- Acceptance mục 2 (xem bằng mắt trên trình duyệt: form Projects, Leads, Site settings, list Redirects) chưa được reviewer kiểm. Hiện chỉ có bằng chứng gián tiếp qua test quét config + build PASS + typecheck PASS.
- Kiểm âm tính bằng cách xoá label `slug` (8 test FAIL) là bằng chứng của builder, reviewer không tái lập vì không được sửa source. Test tự kiểm trong file test chứng minh bộ quét FAIL thật khi thiếu nhãn.
- Integration test dùng Postgres chung với nhiều worktree; lần chạy này PASS sạch.

## Verdict

**PASS**. Không còn CRITICAL hay MAJOR. Các mục MINOR không chặn PASS; MINOR-1 nên mở task riêng.
