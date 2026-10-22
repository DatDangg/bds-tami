# bug-button-variants-merge-and-empty-upload · phase-1-task-01 — `buttonVariants` trả class đã gộp + node `upload` rỗng không tính là nội dung thêm

- Nguồn: BL-057 · change doc `spec/changes/2026-10-22-button-variants-merge-and-empty-upload.md` (follow-up BL-056 n-1 / n-2, review `.context/review-reports/bug-listing-detail-design-match-phase-1-task-01-round-2-review.md`).
- Không đổi schema, không migration, không đổi requirement (as-built PATCH).
- **AUTO PROCEED** (user 2026-10-22: "tự quyết nhé, đừng hỏi t"): change-request tự quyết phương án đơn giản nhất thoả acceptance — ghi ở § Quyết định.

## Classification / Risk
- Type: **BUG** (n-1 lỗi hiển thị thật khi media bị xoá; n-2 chặn tái phát lỗi viền vô hình).
- Risk: **MEDIUM** — `buttonVariants` là shared component dùng ở mọi nút/link public (Button, Header, MobileMenu, FilterPanel, ListingHero, careers, spotlight, DetailShareButton…); `RichText` dùng cho mọi rich text public.
- Expected review level: **STRICT** (shared component).
- Blast radius: `src/components/ui/button.tsx`, `src/components/content/RichText.tsx`, `src/lib/content/rich-text-lead.ts`, helper mới dùng chung + test.

## Root cause (file:line đã có — không spawn Explore)
- n-2: `src/components/ui/button.tsx:7-31` — `buttonVariants = cva(base, …)` với base có `border border-transparent`; biến thể `secondary` (`border-border`, :14) / `chip` (`border-on-dark/30`, :16) / `outline` (`border-text`, :18) thêm class viền thứ 2. `cva` chỉ nối chuỗi, không merge Tailwind → chuỗi chứa cả `border-transparent` lẫn `border-text`; thứ tự utility trong CSS do Tailwind quyết → `border-transparent` có thể thắng → viền `rgba(0,0,0,0)` (đo ở BL-056 r1). Chỉ `Button` (:52) và các chỗ bọc `cn()` được `twMerge` cứu.
- n-1: `src/lib/content/rich-text-lead.ts:3` `NON_TEXT_BLOCKS` coi **mọi** node `upload` là hiển thị được (`isVisibleBlock` :28-30), trong khi `src/components/content/RichText.tsx:115-118` `renderUpload` trả `null` khi `relationTo !== "media"`, value chưa populate / không có `url`, hoặc `mimeType` không phải `image/*`. Hai bên lệch tiêu chí → `splitOverview` trả `rest` có 1 node upload không render → `DetailOverviewIntro` hiện "Xem thêm" mở ra trống.

## Quyết định (AUTO PROCEED)
1. **n-2** — Giữ `cva` làm nguồn class, nhưng `buttonVariants` export là hàm bọc: `buttonVariants(props) = cn(cvaFn(props))` — **bắt buộc dùng `cn` từ `@/lib/utils`** (không dùng `twMerge` mặc định của `tailwind-merge`): `cn` là `extendTailwindMerge` đã khai `rounded-pill` + nhóm font-size `text-button`/`text-button-sm`…; twMerge mặc định coi `text-button` là màu chữ và sẽ xoá nhầm khi đi cùng `text-primary-foreground` / `text-text`. Test phải khẳng định chuỗi trả về vẫn còn `text-button` (và `text-button-sm` khi `size: "sm"`) cùng class màu chữ của biến thể. Kiểu `VariantProps<typeof buttonVariants>` giữ nguyên (tham số không đổi). Không đổi class/variant/size nào; **không** đổi hành vi `Button` (vẫn `cn(buttonVariants(...), className)` để `className` ghi đè). Các `cn(buttonVariants(...))` thừa ở `ProjectSpotlightContent.tsx:57`, `RentalSpotlightContent.tsx:61`, `PostSpotlightContent.tsx:84`, `JobDetailHero.tsx:78` có thể bỏ `cn()` (tuỳ builder, tối giản diff — không bắt buộc).
2. **n-1** — Tạo helper dùng chung `src/lib/content/rich-text-upload.ts` (tên gợi ý) export 1 hàm, vd `renderableUploadImage(node): MediaImage | null` (hoặc `isRenderableUpload`), gom đúng điều kiện hiện tại của `renderUpload`: `relationTo === "media"`, value là object có `url`, `mimeType` rỗng hoặc `image/*`. `RichText.renderUpload` và `rich-text-lead.isVisibleBlock` cùng gọi hàm này (`NON_TEXT_BLOCKS` chỉ còn `table`, `horizontalrule`; `upload` kiểm qua helper). Không đổi hành vi render ảnh.

## Scope
1. Sửa theo § Quyết định 1 và 2.
2. Test (vitest, TDD — test fail trước, pass sau):
   - `button.test` (file mới hoặc file test ui có sẵn): `buttonVariants({ variant })` gọi trần cho `secondary` / `outline` / `chip` **không** chứa `border-transparent` và **có** class viền của biến thể; `primary` vẫn có `border-transparent`; `cn(buttonVariants(...), "extra")` cho phép `extra` ghi đè (vd `h-9` thắng `h-11`).
   - `rich-text-lead.test.ts`: node `upload` value là id string / không `url` / `mimeType` không ảnh / `relationTo` khác → không tính nội dung thêm (`splitOverview(...).rest === null` khi chỉ còn node đó); upload hợp lệ vẫn tính. Lưu ý fixture cũ `upload = { type: "upload", value: { id: "1" } }` (:9) không có `relationTo`/`url` → sau fix sẽ **không** hiển thị được; đổi fixture thành media hợp lệ (`relationTo: "media"`, `value: { id, url, mimeType: "image/jpeg" }`) cho các test "ảnh vẫn tính là nội dung thêm", và thêm case riêng cho upload rỗng.
   - `RichText.test.tsx`: test ảnh upload hiện có (:151) vẫn PASS sau khi dùng helper.
3. Không sửa intent docs. Doc impact: `no doc impact` trừ khi `docs/DESIGN.md` / `.context/design-spec.md` có câu mô tả `buttonVariants` cần ghi as-built (builder kiểm nhanh bằng Grep).
4. Verify (`.context/project-config.md`): `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build`.

## Acceptance (từ change doc)
- [x] `buttonVariants(...)` gọi trần (không `cn`) cho `secondary` / `outline` / `chip` không còn `border-transparent` trong chuỗi class; có unit test cho 3 biến thể (`button.test.tsx` › "buttonVariants (gọi trần, không bọc cn)").
- [x] `Button` và mọi chỗ đang dùng `cn(buttonVariants(...), extra)` hiển thị không đổi (class `extra` vẫn ghi đè được) — test "cn(buttonVariants(), extra) vẫn cho extra ghi đè" + test `Button className="h-14"` có sẵn.
- [x] Node `upload` không có media / không có URL không tính là nội dung thêm → không có nút "Xem thêm" nếu chỉ còn node đó; có unit test (`rich-text-lead.test.ts` › "upload rỗng (…) → rest null", 6 case).
- [x] `RichText` và `rich-text-lead` dùng chung 1 hàm kiểm tra upload hiển thị được (`src/lib/content/rich-text-upload.ts` › `renderableUploadImage`).
- [x] Test + typecheck + lint + build PASS (lint: scope files sạch; 4 error còn lại của `pnpm lint` nằm ở `.local-seed/seed-sample-project-blocks.ts` — file git-ignored có sẵn, ngoài scope).

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Repro Verification
(builder điền) Repro bằng unit test (không cần trình duyệt — n-1 cần xoá media trong DB, n-2 đã đo ở BL-056 r1):

| Mục | Expected | Actual before fix | Actual after fix | Evidence | Status |
|---|---|---|---|---|---|
| n-2 `buttonVariants({variant:"outline"})` | chuỗi có `border-text`, không `border-transparent` | chuỗi có cả `border-transparent` lẫn `border-text` (cva chỉ nối chuỗi); `size:"sm"` có cả `text-button` lẫn `text-button-sm` | chỉ còn `border-text` (+ `border`); `sm` chỉ còn `text-button-sm`; `primary` vẫn `border-transparent`; màu chữ biến thể giữ nguyên | `src/components/ui/button.test.tsx` › describe "buttonVariants (gọi trần, không bọc cn)" — 6 test FAIL trước fix (4 fail: 3 biến thể + token cỡ chữ), PASS sau fix | PASS |
| n-1 `splitOverview` với upload không url | `rest === null` | `rest = { root: { children: [upload rỗng] } }` → `DetailOverviewIntro` hiện "Xem thêm" mở ra trống | `rest === null` cho 6 dạng upload rỗng (id string, `value: null`, không `url`, mimeType không ảnh, `relationTo` khác, không `relationTo`); upload hợp lệ (có/không `mimeType`) vẫn tính | `src/lib/content/rich-text-lead.test.ts` › "upload rỗng (%s) → rest null" (6 case FAIL trước fix, PASS sau) + "upload hợp lệ không có mimeType vẫn tính"; `DetailOverviewIntro.test.tsx` fixture `{type:"upload", value:null}` (= media đã xoá) FAIL sau fix đúng như mong đợi → đổi fixture thành media hợp lệ, PASS | PASS |

## Verification summary
- **Attempt 1** (builder, 2026-10-22) — PASS.
- Thay đổi: `src/components/ui/button.tsx` (`cva` → const nội bộ `buttonClassVariants`; export `buttonVariants = (props?) => cn(buttonClassVariants(props))`, `Button` giữ `cn(buttonVariants(...), className)`); mới `src/lib/content/rich-text-upload.ts` (`renderableUploadImage`, type-only import `MediaImage`); `src/components/content/RichText.tsx` (`renderUpload` dùng helper, bỏ import type `MediaImage`, khai `relationTo`/`value` trên `LexicalNode` cho weak-type check); `src/lib/content/rich-text-lead.ts` (`NON_TEXT_BLOCKS` chỉ còn `table`/`horizontalrule`; `isVisibleBlock` xét `upload` qua helper). Không bỏ các `cn(buttonVariants(...))` thừa ở spotlight/JobDetailHero (tối giản diff).
- Test: `button.test.tsx` +6, `rich-text-lead.test.ts` +7 (fixture `upload` đổi thành media hợp lệ), `DetailOverviewIntro.test.tsx` fixture ảnh đổi thành media hợp lệ (2 test), `RichText.test.tsx` upload test (:151) không đổi, PASS.
- Verify: `pnpm typecheck` PASS · `pnpm lint` exit 1 — 4 error đều ở `.local-seed/seed-sample-project-blocks.ts` (git-ignored qua `.git/info/exclude`, có sẵn, ngoài scope); `npx eslint` trên 7 file scope: 0 problem · `pnpm test`: lần 1 417/418 file, 4378/4380 (2 fail = fixture `DetailOverviewIntro` nói trên) → sửa fixture → 4 file liên quan 67/67 PASS, chạy lại full suite lần 2: **418/418 file, 4380/4380 test PASS** (không timeout) · `pnpm build` PASS. Không có oxlint config → bỏ `npx oxlint`.
- Doc impact: `docs/DESIGN.md` không mô tả `buttonVariants`; `.context/design-spec.md:245` (as-built, mô tả workaround bọc `cn` của BL-056) → bổ sung câu BL-057. Không đụng intent docs.
- Residual: ảnh upload hợp lệ render y như cũ (helper giữ nguyên 3 điều kiện); chưa kiểm bằng trình duyệt (n-1 cần xoá media trong DB; n-2 đã đo ở BL-056 r1).
