# feature-apply-form-upload-progress · phase-1-task-01 — Form ứng tuyển: % tiến trình tải CV (XHR) + vùng kéo-thả ≥ md

- Change doc: `spec/changes/2026-10-19-apply-form-upload-progress.md` (BACKLOG BL-005)
- Nguồn: nợ thiết kế L7-T04, D3 spec-validation layer 7
- Spec: `SPECIFICATIONS.md` F6 (câu mới), `.context/design-spec.md` §3.4 (đã mô tả sẵn, không đổi)

## Hiện trạng (change-request đã đọc code)
- `src/components/careers/ApplyForm.tsx`: CV dùng `FormField as="file"` (nút native), kiểm đuôi + ≤ 5MB trong `handleFileChange`, file giữ ở state `cv`, hiện tên/dung lượng/nút xoá. Gửi qua `usePublicForm` (`src/components/forms/use-public-form.ts`), `send()` dùng `fetch` → không có upload progress. Nút gửi: "Đang gửi…" khi submitting.
- `usePublicForm` dùng chung với `src/components/leads/LeadForm.tsx` (json) → mọi thay đổi hook phải tương thích ngược, LeadForm không đổi hành vi.
- Test: `src/components/careers/ApplyForm.test.tsx` stub `fetch`; `src/components/forms/use-public-form.test.tsx`.

## Classification / Risk
- Type: **MODIFY** (thêm hành vi UI cho form có sẵn; không đổi API/schema)
- Risk: **MEDIUM** — upload file public + hook form dùng chung với LeadForm. Không đổi contract `POST /api/public/job-applications` (multipart, cùng field), Turnstile, thông báo lỗi/thành công, i18n.
- Review level expected: NORMAL (STRICT nếu sửa hook dùng chung theo cách ảnh hưởng LeadForm/upload — reviewer tự quyết).

## Thiết kế (gợi ý — builder chốt theo code thật, chọn phương án đơn giản nhất)
- **Upload progress:** phương án ưu tiên: thêm option tuỳ chọn vào `usePublicForm` (vd `onUploadProgress?: (percent: number | null) => void` hoặc trả `uploadProgress` trong kết quả hook) — khi có thì `send()` dùng `XMLHttpRequest` (POST, `Accept: application/json`, cùng body multipart từ `buildMultipartBody`) thay vì `fetch`, `xhr.upload.onprogress` → `Math.round(loaded/total*100)` khi `lengthComputable`; phần xử lý kết quả (ok/400/413/415/429/503/5xx, `Retry-After`, JSON body, lỗi mạng `onerror`/`ontimeout` → network) dùng **chung** luồng hiện tại để không lặp logic lỗi. Không có option → `fetch` y như cũ (LeadForm không đổi). Nếu builder thấy XHR riêng trong `ApplyForm` đơn giản hơn mà không nhân bản logic lỗi → được, ghi lý do.
- **Nút gửi khi đang gửi:** nhãn "Đang gửi… 42%" / "Sending… 42%" (khi chưa có số → nhãn như cũ). Thanh tiến trình nằm **trong nút** (lớp phủ/ dải tô theo %, không có track nền — taste §9.F), `prefers-reduced-motion` thì không transition chiều rộng. A11y: phần tử `role="progressbar"` có `aria-valuenow/min/max` + `aria-label`, hoặc vùng `aria-live="polite"` (không đọc từng 1% — làm tròn theo bước, vd 10%, hoặc chỉ progressbar). Xong/lỗi → về trạng thái như cũ, reset %.
- **Vùng kéo-thả ≥ md:** khối viền nét đứt quanh/ cạnh nút chọn tệp, `hidden md:flex` (< md chỉ nút "Chọn tệp"). `onDragOver` preventDefault + trạng thái highlight, `onDragLeave`, `onDrop` lấy `dataTransfer.files[0]` → **cùng hàm validate** với chọn tệp (đuôi + 5MB, lỗi hiện tại ô CV), hợp lệ → `setCv`. Disabled khi submitting. Label/hướng dẫn: "Kéo thả CV vào đây hoặc" + nút "Chọn tệp / Choose file" (fallback bàn phím = nút/input native có label). Không làm vùng drop thành tabbable thừa; input file vẫn có label "CV" (test hiện có `getByLabelText(/CV/)` vẫn chạy).
  - Lưu ý: file thả vào không nằm trong `input.files` → submit dùng state `cv` (đã có `additionalFields`), validate `cvMissing` theo state.
  - Có thể cần thay `FormField as="file"` bằng markup riêng để có nút "Chọn tệp" style hệ thống ở mọi cỡ (design-spec §3.4 "nút Chọn tệp mọi cỡ") — giữ `aria-invalid`, `aria-describedby` helper/lỗi, `required`.
- i18n VI/EN: thêm khoá dưới `page.careerDetail.applyForm` (vd `chooseFile` "Chọn tệp"/"Choose file", `dropHint` "Kéo thả CV vào đây hoặc"/"Drag and drop your CV here or", `uploading` "Đang gửi… {percent}%"/"Sending… {percent}%", `uploadProgress` label) — **cả** `vi.json` + `en.json` (test messages-check).
- KHÔNG đổi endpoint/server, không đổi `LeadForm`.

## Acceptance
- [ ] ≥ md: vùng kéo-thả nhận file (.pdf/.doc/.docx ≤ 5MB), validate giống chọn tệp; < md chỉ nút chọn tệp
- [ ] Khi gửi: nút hiện % tiến trình upload thật (XHR `upload.onprogress`); xong/lỗi về trạng thái như cũ
- [ ] Giữ nguyên contract endpoint, Turnstile, thông báo lỗi/thành công (200/400 field/postingClosed/413/415/429/5xx/mạng), i18n VI/EN; LeadForm không đổi
- [ ] A11y: vùng kéo-thả có label + fallback nút bàn phím; tiến trình đọc được (`aria-live` hoặc progressbar)
- [ ] Test component kéo-thả + progress (+ hook nếu sửa); `pnpm lint`/`pnpm typecheck`/`pnpm test`/`pnpm build` PASS

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Test fail sẵn không tính: `src/endpoints/public/job-applications.test.ts` "vị trí hết hạn → 400" (phụ thuộc ngày thật; task này không chạm endpoint).
- Reviewer: impeccable + frontend-checklist + responsive-web; trình duyệt 375/768/1280 nếu dev server chạy được.
- Report: `.context/review-reports/feature-apply-form-upload-progress-phase-1-task-01-round-<R>-review.md`

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → escalate `architecture_review_needed`.

## Decision log
- (change-request) Spec delta: SPECIFICATIONS F6 thêm câu kéo-thả ≥ md + % tiến trình; design-spec §3.4 đã đúng, không đổi.
- (change-request) Endpoint test "vị trí hết hạn → 400" không thuộc phạm vi (task không chạm endpoint) — để nguyên.
- (builder) Progress qua hook: option `trackUploadProgress?: boolean` trong `usePublicForm`, hook trả `uploadPercent: number | null`. Chọn state trả về thay vì callback `onUploadProgress` vì component khỏi phải tự wire callback → state; LeadForm/json không truyền option nên `fetch` y nguyên.
- (builder) `postWithUploadProgress` (submit-helpers) gửi XHR rồi **bọc kết quả thành `Response`** (status + `Retry-After` + body text) → `send()` giữ nguyên nhánh `response.ok` / `response.json()` / `failFromBody`; lỗi mạng/timeout/abort và status 0 reject `TypeError` như fetch → nhánh `network` dùng chung. Không nhân bản logic lỗi.
- (builder) Tách `CvPicker.tsx` (ô CV: label, nút "Chọn tệp" thật, input file `sr-only` `tabIndex=-1` vẫn mang label/aria-invalid/aria-describedby, vùng kéo-thả, hàng tên file/xoá) để `ApplyForm` không phình; validate đuôi + 5MB vẫn ở `ApplyForm.acceptCv` dùng chung cho chọn tệp lẫn thả.
- (builder) Input file chỉ là hộp chọn: `value=""` ngay sau mỗi lần chọn → file (chọn hay thả) **chỉ** sống trong state `cv` và gửi qua `additionalFields`; tránh file sai/đã xoá còn trong `input.files` bị `FormData(form)` gửi lên.
- (builder) Handler drag/drop gắn ở mọi cỡ (vô hại trên touch), chỉ **viền nét đứt + hint** hiện từ `md:` → < md đúng là chỉ nút "Chọn tệp" như spec; không thêm phần tử tabbable.
- (builder) A11y tiến trình: dải tô trong nút là `role="progressbar"` (`aria-valuenow/min/max` + `aria-label` "Tiến trình tải CV"/"CV upload progress") — không dùng aria-live để khỏi đọc từng %. `motion-reduce:transition-none` cho `transition-[width]`.
- (builder, round 1 fixes) **MAJOR-1** focus vô hình khi CV lỗi: nút "Chọn tệp" (đứng trước input trong DOM) cũng mang `aria-invalid` → `querySelector('[aria-invalid="true"]')` của `usePublicForm` tìm thấy nút trước, focus rơi vào phần tử nhìn thấy được. Input sr-only vẫn giữ `aria-invalid` (test/AT theo label). Vì focus do code gọi `.focus()` không chắc khớp `:focus-visible`, nút khi lỗi dùng `aria-invalid:focus:outline-2 … outline-focus-ring` để vòng focus hiện chắc chắn. Không đổi hook.
- (builder, round 1 fixes) **MAJOR-2** progressbar trong `<button>` (children presentational): dải tô trong nút chỉ còn `aria-hidden`; `role="progressbar"` (`sr-only`, cùng `aria-valuenow/min/max/label`) đặt **ngay sau nút**, ngoài `<button>`. Vẫn không dùng aria-live (khỏi đọc từng %).
- (builder, round 1 fixes) **MINOR-1** nút "Chọn tệp" thêm `aria-invalid:border-error` → < md ô CV lỗi có viền lỗi (design-spec §3.3). **MINOR-2** đổi thứ tự trong `cn`: `error` trước, `dragging` sau → kéo vào ô đang lỗi vẫn thấy highlight. **MINOR-3** `uploadPercent >= 100` → nhãn về "Đang gửi…" (server còn xử lý), progressbar vẫn báo 100.
- (builder) Helper test `FakeUploadXhr` đặt tên `src/components/forms/test-utils.ts` vì `tests/unit/runtime-dependencies.test.ts` chỉ miễn kiểm devDependency cho `*.test.*` / `test-utils.*` (lần đặt `fake-upload-xhr.ts` làm test đó FAIL).

## Verification summary
- **Thiết kế chốt:** hook `usePublicForm` + option `trackUploadProgress` → XHR qua `postWithUploadProgress` trả `Response`; `ApplyForm` dùng `CvPicker` mới (nút Chọn tệp mọi cỡ, kéo-thả ≥ md), nút gửi hiện "Đang gửi… {percent}%" + progressbar tô trong nút. Contract endpoint/Turnstile/thông báo lỗi giữ nguyên; LeadForm không đổi.
- **Files:**
  - sửa: `src/components/careers/ApplyForm.tsx`, `src/components/forms/use-public-form.ts`, `src/components/forms/submit-helpers.ts`, `src/i18n/messages/vi.json`, `src/i18n/messages/en.json` (khoá `applyForm.chooseFile/dropHint/uploading/uploadProgress`)
  - mới: `src/components/careers/CvPicker.tsx`, `src/components/forms/test-utils.ts` (FakeUploadXhr, test-only)
  - test sửa: `src/components/careers/ApplyForm.test.tsx` (stub fetch → FakeUploadXhr; +1 nút Chọn tệp, +6 kéo-thả, +4 tiến trình), `src/components/forms/use-public-form.test.tsx` (+4: không bật option vẫn fetch & không tạo XHR; XHR body/Accept/%/200; 413 + 429 Retry-After qua XHR; onerror → network)
- **Test trước fix:** 24 test mới/sửa FAIL (chưa có XHR path, nút Chọn tệp, vùng kéo-thả, progressbar). Sau fix: `ApplyForm.test.tsx` 26 PASS, `use-public-form.test.tsx` 24 PASS, `messages-check.test.ts` PASS.
- **Verify (`.context/project-config.md`):**
  - `pnpm lint` → PASS (0 lỗi)
  - `pnpm typecheck` → PASS
  - `pnpm test` → 232 file / 2484 test: 2483 PASS, 1 FAIL duy nhất là `src/endpoints/public/job-applications.test.ts` "vị trí hết hạn → 400" (fail sẵn, ngoài phạm vi theo Verification Plan). (`tests/unit/runtime-dependencies.test.ts` từng FAIL do tên helper, đã đổi tên → PASS.)
  - `pnpm build` → PASS (exit 0)
  - `npx oxlint` → skip, repo không có oxlint config (dùng `eslint .`)
- **Round 1 fixes (sau review FAIL):**
  - Files sửa: `src/components/careers/CvPicker.tsx` (nút Chọn tệp `aria-invalid` + ring/viền lỗi; thứ tự class dragging/error), `src/components/careers/ApplyForm.tsx` (dải tô `aria-hidden`, progressbar `sr-only` ngoài nút, nhãn 100% → "Đang gửi…"), `src/components/careers/ApplyForm.test.tsx` (+1 test "CV hợp lệ thì nút Chọn tệp không aria-invalid"; test thiếu CV thêm assert focus vào nút Chọn tệp + aria-invalid + accessible description; test tiến trình assert progressbar ngoài nút `not.toContainElement`, dải tô aria-hidden có width, 100% không còn "%").
  - Test trước fix: 2 test FAIL (focus vào input sr-only; progressbar nằm trong nút / nhãn 100%). Sau fix: `ApplyForm.test.tsx` 27 PASS, `use-public-form.test.tsx` 24 PASS, i18n messages-check PASS (59/59 trong 5 file).
  - `pnpm lint` → PASS (exit 0) · `pnpm typecheck` → PASS (exit 0) · `pnpm test` → 232 file / 2485 test: 2484 PASS, 1 FAIL duy nhất là `job-applications.test.ts` "vị trí hết hạn → 400" (fail sẵn, ngoài phạm vi) · `pnpm build` → PASS (exit 0).
- **Chưa làm / residual risk:** chưa soi trình duyệt 375/768/1280 (tuỳ chọn; cần dev server + DB). Drop zone chỉ test bằng `fireEvent.drop` jsdom; highlight `data-dragging` + class `md:` cần reviewer xem mắt nếu có dev server. Không có doc impact (không đổi API/schema; design-spec §3.4 đã mô tả sẵn).

## Review / Close-out
- Round 1: STRICT FAIL (MAJOR-1 focus vào input sr-only, MAJOR-2 progressbar trong `<button>`) — `.context/review-reports/feature-apply-form-upload-progress-phase-1-task-01-round-1-review.md`
- Round 2: **STRICT PASS** — `.context/review-reports/feature-apply-form-upload-progress-phase-1-task-01-round-2-review.md`
- MINOR còn lại (không chặn, residual): A `aria-invalid` trên button không thuộc ARIA 1.2 (lỗi vẫn đọc qua `aria-describedby`); B input sr-only lặp `aria-describedby` (đọc tuần tự nghe 2 lần); C tên nút "Chọn tệp" thiếu ngữ cảnh "CV"; D thiếu assert focus cho lỗi CV từ server 413/415/400. Chưa soi trình duyệt/screen reader thật.
- Doc impact: `SPECIFICATIONS.md` F6 (intent, qua change request BL-005); `docs/ARCHITECTURE.md` danh sách component careers (as-built). API/schema không đổi.
- Spec: 1.7.0 (MINOR) · test-scope scopeVersion 7.
