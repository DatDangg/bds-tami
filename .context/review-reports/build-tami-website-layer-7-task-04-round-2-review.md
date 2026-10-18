Agent: reviewer

# Review — build/tami-website · layer-7-task-04 (form ứng tuyển S13) · round 2

- Worktree: `D:\prj\bds-wt-t04` (chưa commit)
- Review level: **STRICT**
- Reason: form công khai + upload CV (dữ liệu cá nhân); sửa hook dùng chung `use-public-form`; round 2 còn đổi nội dung response lỗi của endpoint public `POST /api/public/job-applications` (API contract).
- Blast radius:
  - Endpoint `src/endpoints/public/job-applications.ts` (`failCv` mới: lỗi CV 400/413/415 kèm `details: [{field:"cv", message}]`) + `job-applications.test.ts`
  - `docs/API_SPEC.md` §3.2 (as-built, ghi shape lỗi)
  - UI: `src/components/careers/ApplyForm.tsx` (+ test), `ApplyFormSlot.tsx`, `JobDetail.tsx`, `src/app/(frontend)/[locale]/tuyen-dung/[slug]/page.tsx` (+ test), i18n vi/en
  - Shared hook `src/components/forms/use-public-form.ts` (tham số tuỳ chọn `additionalFields`, không đổi so với round 1)
  - Caller khác của endpoint: chỉ `ApplyForm` (client) + `tests/integration/job-applications.test.ts` (chỉ assert `status`/`error`, không assert `details` -> không vỡ)
  - `src/payload-types.ts`: `git diff --ignore-all-space --quiet` exit 0 -> chỉ line-ending, không stage

## Verify commands + result (cwd `D:\prj\bds-wt-t04`)

| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` (lần 1) | 147/148 file PASS, 1566/1566 test PASS; file FAIL duy nhất `src/lib/contrast.test.ts` (đã biết, CRLF worktree) |
| `pnpm test` (lần 2, kiểm chập chờn) | Giống hệt lần 1: 147/148 file, 1566/1566 test; chỉ `contrast.test.ts` FAIL. Không tái hiện "29 file lỗi" builder báo -> ổn định |
| `pnpm build` | PASS (exit 0); `/[locale]/tuyen-dung/[slug]` là SSG/ISR (●) |

## Kiểm đặc biệt theo yêu cầu

1. **MAJOR-1 đã đóng.** `inspectCv` (cvTooLarge/cvUnsupported/cvMissing) và `storeCv` (cvInvalid) đều qua `failCv` (`job-applications.ts:59-62, 92, 106`) -> 400 `cvInvalid`/`cvMissing` có detail `cv`; hook (`use-public-form.ts:100-111`) gắn vào ô CV + focus, `fieldErrors` khác rỗng -> `expired` = false (`ApplyForm.tsx:103`). Test endpoint assert `details` `[{field:"cv", message}]` cho cvInvalid và `[]` cho postingClosed; RTL `ApplyForm.test.tsx:183` assert 400 CV hỏng không hiện panel hết hạn. 413/415 hook xử lý theo status (bỏ qua details) -> không đổi hành vi.
2. **Còn nhánh 400 không details khác?**
   - `postingClosed` (`job-applications.ts:213`) — chủ đích.
   - Captcha 400 -> `failWithKey(400, …, "captcha")` không details, nhưng hook nhận diện qua chữ "captcha" (`use-public-form.ts:91`) -> kind `captcha`, không phải expired. OK.
   - Validate thất bại -> `validateSubmission` luôn có ≥1 detail (`job-application-body.ts:103-115`); `jobPostingId` không phải field đã biết nhưng có message -> vào `details` tóm tắt, `issue.details.length > 0` -> không expired. OK.
   - **Còn lại:** pipeline `badInput` (`public-pipeline.ts:80, 90`) khi `reader.form()` ném (multipart hỏng) -> `localizePipelineFailure` trả `invalidInput` với `details: []` (`job-applications.ts:82`); và 400 không phải JSON từ proxy/CDN -> hook đi `failFromBareBadRequest`. Cả hai sẽ hiện panel "hết hạn". Với form thật (FormData do trình duyệt dựng) gần như không chạm được -> **không còn MAJOR**, nhưng tín hiệu vẫn là ngầm định (xem MINOR-A).
3. **Đổi shape lỗi CV không phá caller/test khác:** chỉ thêm phần tử vào mảng `details` (kiểu không đổi); integration test chỉ assert status/error; full suite PASS. OK.
4. **Lý do MINOR-4 hợp lệ:** `getEnv()` (`src/lib/env.ts:97-109`) `parseEnv(process.env)` toàn schema, ném `EnvValidationError` nếu bất kỳ biến nào sai -> đọc riêng `process.env.TURNSTILE_SITE_KEY` (giá trị công khai) cho trang công khai là có lý; comment `page.tsx:115` ghi rõ. Chấp nhận.
5. **MINOR-5:** nhánh huỷ chọn file xoá `cvError` (`ApplyForm.tsx:73-76`) + RTL test dòng 90. Đóng.
6. **Không có lỗi mới đáng kể;** không lộ dữ liệu ứng viên (message lỗi CV là chuỗi cố định theo locale, không echo tên file/nội dung).

## Responsive Checklist Gate (breakpoints 375/640/768/1024/1280/1536 — CSS/class math, không có browser)

Round 2 không đổi markup/class UI so với round 1 (chỉ logic `handleFileChange` + comment); kết quả giữ nguyên round 1.

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | `flex flex-col`; hàng file `min-w-0 truncate` + `shrink-0` (`ApplyForm.tsx:125-127`) |
| Mobile-first media query | OK | Chỉ `sm:w-fit` nút gửi, mặc định `w-full` |
| Grid auto-fit/minmax | N/A | Không dùng grid |
| Container không fixed px | OK | Không `w-[…px]` |
| Typography rem / heading fluid | OK | Token `text-body/text-small/text-h3` |
| Spacing theo scale | OK | `gap-2/3/5`, `p-4`, `px-3` |
| Media | N/A | Không ảnh/video mới |
| Touch target ≥ 44px | OK | Nút xoá `size-11`, link `min-h-11`, submit `size="lg"` |
| Nav hamburger | N/A | Không đụng nav |
| Table scroll wrapper | N/A | Không table |
| Không `100vh` | OK | Không dùng |
| prefers-reduced-motion | N/A | Không animation mới |
| Không che lỗi bằng overflow:hidden | OK | Chỉ `truncate` tên file (chủ đích) |

## Skill gates

| Gate | Kết quả | Bằng chứng |
|---|---|---|
| aislop | skip, không nằm trong verify command được allow cho reviewer | — |
| oxlint (anti-slop) | skip, oxlint not configured | ESLint PASS |
| ocr | skip, ocr không trong verify command được allow | — |
| AI-readable | OK (1 indicator: comment "duy nhất" hơi quá, xem MINOR-A) | `job-applications.ts` 262 dòng, `ApplyForm.tsx` 165 dòng; hằng số có tên; < 3 indicators |
| ai-friendly-web | N/A | không đổi robots/sitemap/llms |
| blitzstrike | skip, không có môi trường được phép | — |

## Findings

### [MINOR-A] "400 không details = hết hạn" vẫn là tín hiệu ngầm; comment nói "duy nhất" chưa chính xác tuyệt đối
- `job-applications.ts:58` + `ApplyForm.tsx:39` ghi `postingClosed` là 400 duy nhất không details; thực tế `localizePipelineFailure` vẫn trả `invalidInput` `details: []` khi multipart hỏng (`job-applications.ts:82`, nguồn `public-pipeline.ts:80,90`), và 400 non-JSON từ proxy cũng thành bare. Form thật hầu như không chạm -> không chặn PASS.
- Đề xuất (task sau / tuỳ chọn): đưa mã máy đọc được cho tin đóng (vd `code: "postingClosed"` hoặc detail `{ field: "jobPostingId" }`) và client chỉ hiện panel hết hạn theo tín hiệu đó; hoặc tối thiểu sửa comment thành "400 bare của form = postingClosed (trừ multipart hỏng, không xảy ra với FormData trình duyệt)".

### [MINOR-B] Task file mâu thuẫn về doc impact / contract
- `tasks/tami-website/layer-7-task-04.md` "Doc impact result: no doc impact (… hợp đồng API không đổi)" và Notes "(không đổi contract/shape)" — nhưng diff sửa `docs/API_SPEC.md` §3.2 và nội dung `details` của response lỗi CV. Sửa thành: "Doc impact: `docs/API_SPEC.md` §3.2 — lỗi CV kèm `details` field `cv`".
- "Verify commands + result" ghi "4 file lỗi do môi trường" — reviewer chạy 2 lần chỉ thấy 1 (`contrast.test.ts`); cập nhật cho đúng.

### [MINOR-C] (carry từ round 1 MINOR-1) Gap design-spec §3.4 (% upload, kéo-thả ≥ md) mới ghi "chờ user quyết" trong task file, chưa vào gap register
- Chấp nhận cho task này; primary/spec-validator cuối layer 7 cần đưa vào gap register hoặc hỏi user. Không tự hạ intent.

### [MINOR-D] (carry round 1 MINOR-2) `src/payload-types.ts` chỉ khác line-ending — không stage khi commit.

## Verdict

**✅ PASS** — MAJOR-1 đóng (server + test endpoint + RTL), MINOR-3/4/5 round 1 đã xử lý, không còn CRITICAL/MAJOR. Lint/typecheck/build PASS; `pnpm test` 2 lần ổn định (chỉ `contrast.test.ts` lỗi môi trường đã biết). MINOR-B nên sửa trong task file trước commit (không phải source).

## Residual risk
- Responsive chỉ kiểm bằng class/token, chưa render 375/768/1280 thật.
- Nhánh multipart hỏng / 400 non-JSON từ proxy vẫn hiện panel "hết hạn" (MINOR-A); không có test.
- aislop/ocr/blitzstrike không chạy; Turnstile widget thật chưa kiểm trong trình duyệt.
- Không tái hiện được "29 file lỗi chập chờn" builder báo; nếu xuất hiện lại trên CI cần điều tra riêng (có thể do tải song song DB/SeaweedFS).
