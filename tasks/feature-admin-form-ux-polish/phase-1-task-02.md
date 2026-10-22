# feature-admin-form-ux-polish · phase-1-task-02 — Lỗi nhập liệu hiện dưới từng ô + đánh dấu tab + tự mở tab/cuộn tới ô lỗi đầu tiên

- Change doc: `spec/changes/2026-10-22-admin-form-ux-polish.md` (BACKLOG BL-058, mục 2)
- Spec: FR-ADM-19 (BL-042 "lỗi hiện ngay tại ô (khung báo đỏ của Payload)") — câu này đổi theo spec delta mục 2 của change doc
- Status: approved 2026-10-22 (user "Ok, chạy đợt 1") · Wave 1 (song song với T01, T03). T04 chạy SAU task này (chung `payload.config.ts`, `importMap.js`, `custom.scss`).

## Hiện trạng + root cause (change-request đọc code Payload 3.91.0 — builder phải tái hiện trên trình duyệt trước khi sửa)
1. **Form sửa không validate phía client trước khi gửi.** `@payloadcms/next` → `@payloadcms/ui/dist/views/Edit/index.js:186-191` khởi tạo
   `validateBeforeSubmit` = `true` chỉ khi `operation === 'create'` của collection auth; mọi collection nội dung → `false` →
   `:458` `disableValidationOnSubmit: !validateBeforeSubmit` → `forms/Form/index.js:278` bỏ qua `validateForm()`; form gửi thẳng lên server.
2. **Server trả `ValidationError`** (`payload/dist/errors/ValidationError.js:7-33`): message = `t('error:followingFieldsInvalid')` + danh sách nhãn
   `Tab > Trường` (nhãn dựng trong `payload/dist/fields/hooks/beforeChange/promise.js:91,164,288`). Chữ VI đặt ở
   `src/lib/admin/payload-vi-overrides.ts:23-24` (`followingFieldsInvalid_one/_other`).
3. **Toast gom cả danh sách**: `forms/Form/index.js:380-410` tách `json.errors` → lỗi theo trường dispatch `ADD_SERVER_ERRORS` (ô có `valid:false` + `errorMessage`),
   phần message → `FieldErrorsToast` (`@payloadcms/ui/dist/elements/Toasts/fieldErrors.js:27-47` `createErrorsFromMessage`: thêm "(N):", đổi " > " → " → ", liệt kê) ⇒ đúng chuỗi user thấy
   "Các trường sau chưa hợp lệ (6): Nội dung → Tiêu đề, … Nâng cao → Đường dẫn trang".
4. **Vì sao không thấy lỗi dưới ô:** lỗi theo trường CÓ được gắn, nhưng `fields/FieldError/index.js:40-48` chỉ render một **Tooltip đỏ nhỏ** (`staticPositioning`)
   ở mép trên-phải ô, nằm TRƯỚC input trong `.field-type__wrap` (vd `fields/Text/Input.js:77-85`) — không phải dòng chữ dưới ô; ô ở **tab chưa mở thì chưa render** nên không thấy gì;
   không có gì tự chuyển tab / cuộn. Nhãn tab có `ErrorPill` đếm lỗi (`fields/Tabs/Tab/index.js:25-54`, class `tabs-field__tab-button--has-error`) — **builder xác minh nó có hiện với lỗi từ server không**
   (và trong khối thu gọn "Nâng cao" ở cột phải — `collapsible` có pill lỗi riêng).
5. Viền đỏ: field có class `error` (vd `Text/Input.js:51`); richText đã có viền đỏ riêng `src/components/admin/styles/_forms.scss:79-81`.

## Classification / Risk
- Type: **MODIFY** (UI admin, hành vi form dùng chung mọi collection/global). Không đổi schema / API / access / validate server.
- Risk: **MEDIUM** — chạm toàn bộ form admin (CSS dùng chung + provider client chạy ở mọi màn sửa). Reviewer: **NORMAL** (nâng STRICT nếu đụng chuỗi lỗi API dùng ngoài admin).

## Hướng làm (change-request đề xuất — builder được chọn chi tiết, ghi decision log)
1. **Chữ lỗi dưới ô (CSS, partial mới `src/components/admin/styles/_field-errors.scss` + 1 dòng `@use` trong `src/app/(payload)/custom.scss`)**:
   đổi `.field-error` (Tooltip trong `.field-type__wrap`) thành dòng chữ tĩnh **dưới** ô (bỏ nền pill/caret, chữ màu danger token admin, cỡ ~0.8125rem, `order` sau input),
   viền ô đỏ khi `.error`. Kiểm đủ loại ô: text, textarea, number, select, relationship (react-select), upload, date, richText (lexical), checkbox, ô trong array/collapsible/group.
   Không phá tooltip khác của Payload (selector chỉ `.field-error`). AA sáng/tối.
2. **Tự mở tab + cuộn + focus ô lỗi đầu tiên**: component client mới (vd `src/components/admin/FormErrorFocus.tsx`) gắn qua `admin.components.providers` (`src/payload.config.ts:45`) hoặc slot form
   sẵn có — chỉ hoạt động trong form tài liệu: sau một lần Lưu thất bại (`useFormSubmitted` + `useFormProcessing` → false + có field `valid === false`), chọn ô lỗi đầu tiên **theo thứ tự hiển thị**;
   nếu nằm ở tab khác → bấm nút tab có `--has-error` (hoặc tab chứa path); mở khối thu gọn chứa ô; `scrollIntoView({block:"center"})` + focus input. Chỉ chạy 1 lần mỗi lần submit, không giật khi người dùng đang gõ.
   Chạy `pnpm generate:importmap` nếu thêm component vào config.
3. **Nhãn tab có lỗi**: dùng `ErrorPill` sẵn của Payload nếu đã hiện; nếu không hiện với lỗi server → bổ sung (CSS/ component) cho tab + khối thu gọn "Nâng cao".
4. **BỎ HẲN toast lỗi trường (user chốt Q3 = Bỏ hẳn)**: Lưu thất bại vì lỗi theo ô → KHÔNG hiện thông báo nổi nào (cả toast "Các trường sau chưa hợp lệ (N): …" lẫn toast loading còn treo); chỉ còn lỗi dưới ô + đánh dấu tab + tự mở tab/cuộn.
   Markup toast (`elements/Toasts/fieldErrors.js`) không có class riêng → builder chọn cách chắc chắn và ghi decision log (vd provider phát hiện lần submit lỗi có ô `valid:false` rồi dismiss đúng toast đó; hoặc CSS theo cấu trúc ổn định). **Lỗi KHÔNG gắn với ô nào** (mất quyền, lỗi mạng, lỗi server 500, lỗi hook không có `path`) **vẫn phải hiện toast** như cũ. Không bỏ toast thành công. Giữ `followingFieldsInvalid_*` (vẫn là message API) trừ khi cần đổi — nếu đổi thì cập nhật `payload-vi-overrides.test.ts:68-70`.
5. KHÔNG bật lại validate client bằng cách thay view Edit của Payload; không sửa `node_modules`.

## Acceptance
- [ ] Lưu thiếu trường (Tin BĐS, Dự án, Cho thuê, Tin tức; xoá Tiêu đề + Đường dẫn trang + 1 ô quan hệ bắt buộc + 1 ô ở tab khác): mỗi ô lỗi có **chữ lỗi ngay dưới ô** + viền đỏ.
- [ ] Nhãn tab chứa ô lỗi có số lỗi; khối thu gọn chứa ô lỗi được đánh dấu/mở.
- [ ] Sau Lưu lỗi: tự chuyển tới tab chứa ô lỗi đầu tiên, cuộn tới và focus ô đó.
- [ ] Lưu lỗi theo ô: KHÔNG có thông báo nổi nào; lỗi không gắn ô (quyền/mạng/500) vẫn có toast; toast thành công giữ nguyên.
- [ ] Sửa ô hết lỗi → chữ lỗi biến mất như Payload hiện tại; Lưu thành công không bị cuộn/nhảy tab.
- [ ] Global (Trang chủ, Cấu hình chung) và màn tạo mới không vỡ; 390px không tràn ngang.
- [ ] Ảnh 1440 trước/sau (toast cũ + form sau sửa: tab đánh dấu, ô lỗi có chữ dưới) sáng + tối.
- [ ] Test: unit cho logic chọn ô lỗi đầu tiên/chọn tab; test chuỗi override; `pnpm lint` · `pnpm typecheck` · `pnpm test` PASS; `pnpm build` PASS.

## Phạm vi cấm
- KHÔNG sửa: `SPECIFICATIONS.md`, `spec/**`, `.context/progress.json`, `src/components/admin/styles/_forms.scss` (T03 đang sửa — CSS mới để ở `_field-errors.scss`), `RetranslateButton.tsx` (T01), schema/collection fields, validate server. Không migration.

## Verification Plan
- `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`.
- Trình duyệt 1440 + 390 (dev server worktree, DB riêng): kịch bản ở Acceptance, cả tạo mới và sửa; kiểm ô ở tab đang mở và tab khác.
- Ảnh: `.context/review-reports/feature-admin-form-ux-polish/screens/t02-{before,after}-1440-*.png`.
- Report: `.context/review-reports/feature-admin-form-ux-polish-phase-1-task-02-round-<R>-review.md`.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`. Nếu không làm được phần nào mà không thay view gốc Payload → giữ mặc định + ghi gap (như quy tắc BL-051).

## Decision log
- (change-request) Root cause chủ yếu là cơ chế Payload (không validate client ở form nội dung + lỗi trường hiển thị dạng tooltip + tab chưa render) — sửa bằng CSS + provider client, không fork view.
- (user 2026-10-22, checkpoint) Q3 = **Bỏ hẳn** thông báo nổi khi Lưu lỗi theo ô.

## Kết quả tái hiện (builder, attempt 1, 2026-10-22, dev server worktree :3102, DB riêng)
Bản "Voucher trị ân…" (Tin BĐS): xoá Tiêu đề + Danh mục (quan hệ bắt buộc) + Đường dẫn trang (khối Nâng cao) + nhập Giá = -5 (tab "Thông tin tin đăng") → Lưu (đang đứng ở tab 2). Trước khi sửa (đã tắt tạm `@use field-errors`):
- Toast gom "Các trường sau chưa hợp lệ (4): Nội dung → Tiêu đề, … Nâng cao → Đường dẫn trang" — **khớp root cause #3**.
- Lỗi theo ô chỉ là tooltip đỏ nhỏ ở mép trên-phải ô — **khớp #4**; ở màn hẹp (<~768px) Payload còn `display:none` mọi `.tooltip` ⇒ **không thấy chữ lỗi nào** (phát hiện thêm, đã xử lý).
- **ErrorPill CÓ hiện với lỗi từ server**: nhãn tab "Nội dung 2", "Thông tin tin đăng 1" và khối thu gọn "Nâng cao" có pill "1 Lỗi" (viền đỏ). Không cần bổ sung CSS/component cho pill (#3 của "Hướng làm" = không cần làm).
- Form không tự chuyển tab; ô ở tab khác (Giá) không thấy khi đang ở tab 2 → tab 1 chưa render nội dung.
- Ghi chú: lỗi "Nội dung (richText) không được để trống" chỉ lộ sau khi sửa Tiêu đề (Payload revalidate server theo ô) — hành vi Payload, không đổi.

## Decision log (builder)
- **Không có slot nằm trong `<Form>` dùng chung cho mọi collection/global**, mà `admin.components.providers` đứng NGOÀI Form (không dùng được `useFormSubmitted/useAllFormFields`). Chọn: provider `FormErrorFocus` (client, `src/components/admin/FormErrorFocus.tsx`) đọc DOM bằng `MutationObserver` trên `document.body`; tín hiệu "vừa Lưu lỗi theo ô" = toast `FieldErrorsToast` xuất hiện (marker `data-testid="field-errors"|"field-error"` do Payload 3.91 tự gắn; phiên bản Payload đã ghim). Không thêm cấu hình vào từng collection, không fork view Edit, không sửa `node_modules`.
- **Bỏ hẳn toast lỗi theo ô bằng CSS** (không dismiss bằng JS): `.payload-toast-container [data-sonner-toast]:has([data-testid="field-errors"], [data-testid="field-error"]) { display:none }` trong `_field-errors.scss`. Không có flash vì ẩn ngay khi toast vào DOM; toast "Đang gửi…" tự được thay bằng toast lỗi (cùng phần tử) nên cũng không treo. Toast lỗi không gắn ô (mạng/quyền/500, `errorToast(message)` chuỗi thường) và toast thành công **không có marker nên vẫn hiện** — đã kiểm: giả lập `fetch` reject → toast "Failed to fetch" vẫn hiện; Lưu thành công không cuộn/nhảy tab. Rủi ro đã biết: lỗi KHÔNG gắn ô mà message có dấu ":" sẽ bị Payload dựng ra `<ul data-testid="field-errors">` cùng cấu trúc → bị ẩn (hiếm; lỗi hook không `path`). Ghi residual.
- Chọn ô lỗi đầu tiên theo thứ tự DOM (= thứ tự hiển thị): tab có `--has-error` đầu tiên chưa mở → bấm; đang mở → focus ô `.field-error` đầu tiên; ô đứng trước thanh tab (ngoài tab) → focus ô; khối thu gọn `.collapsible--collapsed` bao quanh được mở (nút `.collapsible__toggle`, nội dung khối thu gọn vẫn render trong DOM) rồi đợi 300ms animation trước khi cuộn. Lặp tối đa 12 bước × 120ms (tab chỉ render sau khi bấm). Cuộn `scrollIntoView({block:"center"})` + `focus({preventScroll:true})`. Chạy 1 lần mỗi lần toast xuất hiện; lần Lưu mới/unmount huỷ lần chạy cũ (không giật khi gõ vì chỉ kích hoạt bởi toast).
- CSS `_field-errors.scss`: lỗi theo ô → `display:block; position:static`, chữ `--admin-badge-danger-fg` (token sáng #9f1239 / tối #fda4af, đã có AA trong `_tokens.scss`), cỡ `0.9375rem` (~12px, gốc admin 13px, ngang chữ mô tả), luôn hiện (`opacity/visibility`). Phần tử chứa lỗi (`.field-type`, `.field-type__wrap`, `.upload__wrap` có con trực tiếp `.field-error`) → flex cột + `order` để dòng lỗi nằm dưới ô dù Payload đặt nó trước trong DOM (text, textarea, number, select, relationship, date, upload, richText, checkbox, radio, array/blocks). Viền đỏ `.field-type.error` cho input/textarea/`.rs__control`. `display:block` bắt buộc vì Payload ẩn `.tooltip` ở màn hẹp. Selector chỉ `.field-error` — không đụng tooltip khác.
- Không sửa `_forms.scss` (T03), `RetranslateButton.tsx`, schema, validate; `followingFieldsInvalid_*` giữ nguyên nên `payload-vi-overrides.test.ts` không đổi.
- `pnpm generate:importmap` thêm 2 dòng vào `importMap.js` (provider). `src/payload-types.ts` hiện `M` chỉ vì đổi EOL (không có thay đổi nội dung) — dispatcher đừng stage file này.

## Verification summary (builder)
- `pnpm lint`: 0 error (2 warning cũ ở `tools/task-dashboard/server.mjs`, không thuộc task). `pnpm typecheck`: PASS. `pnpm build`: PASS.
- `pnpm test` (toàn bộ): file mới PASS (12 test `FormErrorFocus.test.tsx`: chọn ô đầu tiên/chọn tab/khối thu gọn lồng/huỷ/tín hiệu toast, + 3 test `field-errors-style.test.ts`); 154/154 PASS với nhóm `src/lib/admin` + file mới. Chạy full suite có 3 nhóm FAIL **do môi trường, không liên quan file đã sửa**: `tests/integration/health.test.ts` (503 — Redis/S3 không sẵn sàng trong worktree), `tests/integration/geo-seed.test.ts` (5 fail — DB tạm; Postgres dùng chung vừa vào "recovery mode" ~25 phút do nhiều worktree clone DB), `Header.test.tsx` focus-trap (timeout 5s khi máy tải; chạy lại riêng PASS 17/17).
- Trình duyệt (Tin BĐS sửa + tạo mới + global Cấu hình chung; 1440 sáng/tối, 390 sáng): lỗi hiện chữ dưới từng ô + viền đỏ; tab "Nội dung 2" / "Thông tin tin đăng 1" / khối "Nâng cao 1 Lỗi"; sau Lưu lỗi (đang ở tab 2) tự về tab 1, focus ô Tiêu đề; khối Nâng cao thu gọn tự mở + focus ô Đường dẫn (kiểm bằng DOM thật, giả lập tín hiệu toast); không còn toast lỗi theo ô; lỗi mạng vẫn toast; Lưu thành công giữ nguyên tab/vị trí; sửa ô → chữ lỗi mất (Payload revalidate); 390px không tràn ngang (scrollWidth = 390); màn tạo mới có lỗi ở textarea/relationship/richText đúng dưới ô.
- Ảnh (screens/): `t02-before-1440-light.jpg`, `t02-after-1440-light.jpg`, `t02-after-1440-dark.jpg`, `t02-after-390-light.jpg`.

## Residual (builder)
- Ảnh là JPG ~800px (khung trình duyệt của công cụ chụp giới hạn), không phải PNG 1440 thật; viewport đã đặt 1440x900 nhưng ảnh bị thu nhỏ. Ảnh "before" chụp bằng cách tắt tạm `@use` (provider vẫn chạy nên form đã nhảy về tab 1).
- Phụ thuộc marker `data-testid` của `FieldErrorsToast` (Payload 3.91 ghim) và class tab/collapsible; nâng cấp Payload cần kiểm lại (test unit nêu rõ selector).
- Lỗi không gắn ô có message chứa ":" bị ẩn nhầm (xem decision log) — hiếm.
- Kịch bản nhiều tab thật cho Dự án / Cho thuê / Tin tức chưa chạy tay từng collection (cùng cơ chế dùng chung, đã kiểm trên Tin BĐS + màn tạo mới + 1 global); dropdown relationship trong trình duyệt tự động không mở được nên chưa tự chọn Danh mục để thử luồng "lưu thành công sau khi sửa hết lỗi" — đã kiểm Lưu thành công theo luồng khác (sửa Giá).
- Bản ghi test trong DB riêng `tami_wt_bl058_t02`: bài "Voucher trị ân…" có Giá = 9 (vô hại, DB tách biệt).

## Decision log (builder, attempt 2 — sửa review round 1)
- **MAJOR-1 (toast ẩn nhầm):** giữ "mặc định ẩn" (không nháy ở ca thường gặp) nhưng thêm cờ hiện lại: `focusFirstFieldError` giờ trả `boolean`; khi không thấy tab có lỗi cũng như ô `.field-error` nào sau ~5 lần chờ (~0,7s), `FormErrorFocus` gọi `markUnmatchedToasts` gắn `data-field-errors-unmatched` lên `[data-sonner-toast]` chứa marker; CSS `:not([data-field-errors-unmatched]):has(marker)`. Đảo logic (mặc định hiện) bị loại vì ô lỗi render sau toast → toast nháy ở ca thường gặp. Đánh đổi: ca không-gắn-ô thấy toast chậm ~0,7s (toast sống ~4–5s).
- **MINOR-1:** `resolveFocusRoot()` = `.drawer` cuối cùng trong DOM (drawer đang mở trên cùng) nếu có, không thì `document`.
- **MINOR-2:** `firstTabToOpen`: duyệt tab `--has-error` theo thứ tự; tab chưa mở → bấm; tab đang mở mà `.tabs-field__content-wrap` của nó đã có ô lỗi → dừng (focus ô); đang mở nhưng chưa có ô lỗi → xét tab kế (tab con).
- **MINOR-4:** `margin-top: 0.3rem`. **MINOR-3 → residual:** toast bị ẩn vẫn chiếm chỗ stack Sonner tới khi hết hạn; MutationObserver trên `body` subtree (callback chỉ quét node thêm vào).

## Verification summary (attempt 2)
- `pnpm lint` 0 error (2 warning cũ); `pnpm typecheck` PASS; `pnpm vitest run --project unit --project ui --maxWorkers=2`: 336 file / 3195 test PASS (không chạy integration); `pnpm build` PASS.
- Test mới: marker-có-nhưng-không-có-ô-lỗi → gắn cờ unmatched; có ô lỗi → không gắn cờ; `focusFirstFieldError` trả false khi không có lỗi; `resolveFocusRoot` (drawer cuối); tab đang mở chưa có ô lỗi → bấm tab con.
- Trình duyệt (cổng 3102, host `t02.localhost` — cookie `localhost` bị dùng chung với dev server của builder khác nên phải tách host): giả lập phản hồi 400 ValidationError path `where` + message "Trường sau chưa hợp lệ: where" (đúng ca Staff EditMany `last-admin-guard`) → toast **hiện** (có cờ unmatched, display flex). Ca thật xoá Tiêu đề → Lưu: toast ẩn (display none, không cờ), chữ lỗi dưới ô + pill tab "Nội dung 1" + focus Tiêu đề. Lưu thành công → toast "Cập nhật thành công." hiện bình thường. Staff EditMany thật chưa chạy tay (chỉ giả lập phản hồi).
- Residual thêm: bài test trong DB riêng đang có Tiêu đề trống/"-5" (đã lưu thử), vô hại.

## Review
- Round 1 — **STRICT FAIL** (`.context/review-reports/feature-admin-form-ux-polish-phase-1-task-02-round-1-review.md`): MAJOR-1 toast lỗi theo ô bị ẩn cả khi không có ô lỗi nào hiển thị (vd Staff EditMany `last-admin-guard` path `where`) → Lưu lỗi im lặng. MINOR-1..4.
- Round 2 — **STRICT PASS** (`.context/review-reports/feature-admin-form-ux-polish-phase-1-task-02-round-2-review.md`): MAJOR-1 đóng bằng cờ `data-field-errors-unmatched`; MINOR-1/2/4 đóng. Còn MINOR (chấp nhận, follow-up): A gắn cờ mọi toast có marker (toast cũ có thể hiện lại), B lưu liên tiếp < 0.6s toast không gắn ô có thể bị ẩn, C `display:none` làm sonner đo chiều cao 0, D thiếu test 2 nhánh.
- Doc impact: no doc impact as-built (không API/schema). Spec delta mục 2 (change doc) áp lúc close-out BL-058. Residual: phụ thuộc marker `data-testid` + class tab/collapsible Payload 3.91 (nâng cấp Payload phải kiểm lại).
