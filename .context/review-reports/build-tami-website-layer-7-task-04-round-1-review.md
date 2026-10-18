Agent: reviewer

# Review — build/tami-website · layer-7-task-04 (form ứng tuyển S13) · round 1

- Worktree: `D:\prj\bds-wt-t04` (branch `wt/l7-t04` từ f29176c, chưa commit)
- Review level: **STRICT**
- Reason: form công khai + upload file (CV, dữ liệu cá nhân) gọi endpoint public; sửa hook dùng chung `use-public-form` (shared hook); đọc env Turnstile ở server. Task file ghi NORMAL nhưng blast radius thực tế rộng hơn (xem MINOR-3).
- Blast radius:
  - `src/components/careers/ApplyForm.tsx` (mới) + `ApplyForm.test.tsx` (mới)
  - `src/components/careers/ApplyFormSlot.tsx`, `JobDetail.tsx`, `src/app/(frontend)/[locale]/tuyen-dung/[slug]/page.tsx` (+ test)
  - `src/components/forms/use-public-form.ts` (shared: thêm tham số tuỳ chọn `additionalFields` cho `handleSubmit`; caller khác duy nhất là `use-public-form.test.tsx` gọi 2 tham số -> không vỡ)
  - `src/i18n/messages/vi.json`, `en.json` (thêm key `page.careerDetail.applyForm.*`)
  - `src/payload-types.ts` (chỉ khác line-ending, `git diff --stat` rỗng)
  - Phụ thuộc hợp đồng: `POST /api/public/job-applications` (`src/endpoints/public/job-applications.ts`, không sửa)

## Verify commands + result (cwd `D:\prj\bds-wt-t04`)

| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | 147/148 file PASS, 1564/1564 test PASS; file FAIL duy nhất `src/lib/contrast.test.ts` (đã biết: checkout CRLF của worktree, ngoài scope) |
| `pnpm build` | PASS (exit 0); `/[locale]/tuyen-dung/[slug]` là SSG/ISR (`generateStaticParams` trả `[]`) |
| `pnpm install --frozen-lockfile` | không chạy (lockfile không đổi) |

## Kiểm đặc biệt theo yêu cầu

1. **"400 không details = hết hạn" — SAI/giòn.** Endpoint trả 400 không `details` ở ÍT NHẤT 2 đường người dùng thật chạm được:
   - `processApplication` -> `failWithKey(400, …, "postingClosed")` (`job-applications.ts:207`) — đúng là hết hạn/không tồn tại/không published.
   - `storeCv` -> `failWithKey(400, …, "cvInvalid")` (`job-applications.ts:100`) — file có magic bytes PDF/DOCX hợp lệ nhưng cấu trúc hỏng (vd PDF bị cắt, thiếu xref/%%EOF). `failWithKey` mặc định `details = []`.
   - (Ít gặp) `inspectCv` 400 "cvMissing" khi file rỗng (`validate-file.ts:60`) — thực tế bị `validateSubmission` chặn trước; và `localizePipelineFailure` 400 `invalidInput` với `body.details ?? []` khi multipart hỏng.
   Hệ quả: ứng viên gửi CV hỏng sẽ thấy "Vị trí này đã hết hạn nhận hồ sơ." + link danh sách — sai trạng thái, không được bảo chọn file khác. Comment `ApplyForm.tsx:39` và task Notes (3) ghi "đường duy nhất server trả như vậy" là không đúng. -> MAJOR-1.
2. **`use-public-form`**: thay đổi additive (`{...collectFields(form), ...additionalFields}`), caller cũ không truyền tham số 3 -> hành vi không đổi; `retry()` đi qua `requestSubmit` -> lại vào `ApplyForm.handleSubmit` nên vẫn kèm `cv` từ state. OK.
3. **Ràng buộc client vs server**: đuôi `.pdf/.doc/.docx` (client, theo tên) vs magic bytes PDF/DOCX/x-cfb (server) — khớp tập định dạng; `5 * 1024 * 1024` khớp `PRIVATE_FILE_POLICY.maxBytes`; message ≤ 2000 khớp zod; fullName client chỉ min 2 (server max 120, không có maxLength client — chấp nhận, server gắn lỗi vào ô). Client không kiểm MIME — hợp lý vì server kiểm theo nội dung. OK.
4. **Lộ thông tin**: không log/echo dữ liệu ứng viên; sau success hook xoá `lastSubmit`; `cv` state bị unmount cùng form khi success. Chỉ `TURNSTILE_SITE_KEY` (công khai) được đọc ở server component và truyền xuống client; `TURNSTILE_SECRET_KEY` không bị chạm. OK.
5. **A11y**: label thật qua `FormField`, `aria-invalid` + `aria-describedby` (helper + lỗi) cho cả ô file khi lỗi client (`cvError`); focus ô lỗi đầu tiên (hook query `[aria-invalid="true"]` theo DOM); success `role="status"` + focus heading; lỗi `role="alert"`; nút xoá file có `aria-label` + icon `aria-hidden`, kích thước 44×44. OK.
6. **Site key ở server**: page không prerender lúc build (`generateStaticParams` -> `[]`), nên `process.env.TURNSTILE_SITE_KEY` đọc lúc render ISR runtime. OK (xem MINOR-4 về `getEnv`).

## Responsive Checklist Gate (diff đụng UI; breakpoints 375/640/768/1024/1280/1536 — kiểm bằng CSS/class math, không có browser)

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | Form `flex flex-col`; hàng file `flex … justify-between gap-3` với tên `min-w-0 truncate`, size/nút `shrink-0` -> co được ở 375; container `max-w-text px-gutter` (token), không width px cố định |
| Mobile-first media query | OK | Chỉ `sm:w-fit` cho nút gửi (mặc định `w-full`); không `max-width` query |
| Grid auto-fit/minmax | N/A | Không dùng grid trong diff |
| Container không fixed px | OK | Không có `w-[…px]` |
| Typography rem / heading fluid | OK | Dùng token `text-body`, `text-small`, `text-h3` (design tokens); không `px` font |
| Spacing theo scale | OK | `gap-2/3/5`, `p-4`, `px-3`, `pt-4`, `py-section-tight` |
| Media (ảnh/video) | N/A | Không có ảnh/video mới |
| Touch target ≥ 44px | OK | Nút xoá `size-11`; link fallback/expired `min-h-11`; nút submit `size="lg"`; ô file dùng `controlBase` của `FormField` (đã review ở L2) |
| Nav hamburger | N/A | Không đụng nav |
| Table scroll wrapper | N/A | Không có table |
| Không `100vh` | OK | Không dùng |
| prefers-reduced-motion | N/A | Không thêm animation mới |
| Không che lỗi bằng `overflow:hidden` | OK | Chỉ `truncate` cho tên file (chủ đích) |

Residual risk responsive: chưa render thật ở trình duyệt; kết luận dựa trên class/token. Kéo-thả ≥ md của design-spec §3.4 không làm (xem MINOR-1), không phải lỗi responsive.

## Skill gates

| Gate | Kết quả | Bằng chứng |
|---|---|---|
| aislop | skip, lệnh không nằm trong danh sách verify command được allow cho reviewer | — |
| oxlint (anti-slop) | skip, oxlint not configured | không có `.oxlintrc*`/`oxlint*.json` trong worktree; ESLint PASS |
| ocr (open-code-review) | skip, ocr không trong verify command được allow | — |
| AI-readable | OK (1 indicator: comment sai sự thật `ApplyForm.tsx:39`) | `ApplyForm.tsx` 164 dòng; hàm dài nhất là JSX render (~60 dòng tính cả markup, chấp nhận cho component); hằng số có tên (`CV_MAX_BYTES`, `CV_EXTENSION`); < 3 indicators |
| ai-friendly-web | N/A | task không đổi robots/sitemap/llms |
| blitzstrike | skip, không có môi trường được phép | — |

## Findings

### [MAJOR-1] Lỗi "CV hỏng" (400 `cvInvalid`) bị hiển thị thành "vị trí đã hết hạn"
- `src/components/careers/ApplyForm.tsx:102` — `expired = issue?.kind === "validation" && issue.details.length === 0 && Object.keys(form.fieldErrors).length === 0` coi mọi 400 không `details` (không phải captcha) là hết hạn.
- Server trả 400 không `details` cả cho `cvInvalid` (`src/endpoints/public/job-applications.ts:100`, qua `failWithKey` mặc định `details = []` ở dòng 54-55), ngoài `postingClosed` (dòng 207).
- Comment `ApplyForm.tsx:39` ("đường duy nhất server trả như vậy") và task Notes (3) sai; không có test cho nhánh này.
- Fix đề xuất (chọn 1, ưu tiên a):
  a. Server: trả `cvInvalid` kèm `details: [{ field: "cv", message: applicantMessage(locale, "cvInvalid") }]` (hook sẵn có sẽ gắn lỗi vào ô CV + focus). Thêm test endpoint khẳng định `cvInvalid` có detail `cv` và `postingClosed` là 400 duy nhất không `details`; cập nhật `docs/API_SPEC.md` §3.2 nếu bảng lỗi có ghi shape.
  b. Hoặc đưa tín hiệu máy đọc được cho hết hạn (vd detail `{ field: "jobPostingId" }` / mã lỗi) và client chỉ hiện panel hết hạn theo tín hiệu đó; 400 trơn còn lại hiện `issue.message` (server đã dịch theo locale).
  - Thêm RTL test: 400 `{ error: "CV bị lỗi…", details: [] }` (hoặc shape mới) KHÔNG hiện "Vị trí này đã hết hạn…"; sửa comment dòng 39.

### [MINOR-1] Lệch design-spec §3.4 tự quyết, chưa ghi gap/decision
- `ApplyForm.tsx:159-161`: không có thanh tiến trình upload "%" (spec §3.4 dòng 165) và không có vùng kéo-thả ≥ md (dòng 163). Builder ghi lý do trong Notes nhưng task để `Decision impact: NO`, không ghi gap register. Đề xuất: ghi gap (vd `docs/changes/TECHNICAL_REQUIREMENT_GAPS.md` hoặc Decision log) để spec-validator cuối layer xử lý; không tự hạ intent.

### [MINOR-2] `src/payload-types.ts` chỉ đổi line-ending
- `git diff --stat` rỗng nhưng file ở trạng thái `M`. Không stage vào commit task (drive-by noise).

### [MINOR-3] Task file chưa cập nhật Blast radius / Files to Modify
- `tasks/tami-website/layer-7-task-04.md:16,80-82` chỉ liệt kê `ApplyForm.tsx` + page; diff còn đụng shared hook `use-public-form.ts`, `ApplyFormSlot.tsx`, `JobDetail.tsx`, i18n vi/en. Cập nhật để trace đúng.

### [MINOR-4] Đọc `process.env` trực tiếp thay vì `getEnv()`
- `src/app/(frontend)/[locale]/tuyen-dung/[slug]/page.tsx:116` — `getEnv()` (`src/lib/env.ts:62`) đã khai `TURNSTILE_SITE_KEY: nonEmpty`. Không phải lỗi bảo mật (site key công khai); cân nhắc dùng `getEnv()` cho nhất quán, hoặc giữ nguyên nếu chủ đích tránh throw khi env thiếu (ghi rõ trong comment).

### [MINOR-5] `handleFileChange` không xoá `cvError` khi người dùng huỷ hộp chọn file
- `ApplyForm.tsx:73-76`: nhánh `!file` chỉ `setCv(null)`; lỗi loại/cỡ trước đó còn hiện. Nhỏ, tuỳ chọn.

## Verdict

**❌ FAIL** — 1 MAJOR (MAJOR-1: sai trạng thái lỗi do giả định "400 không details = hết hạn" không đúng với endpoint thật). Lint/typecheck/build PASS; test PASS trừ `contrast.test.ts` (môi trường, ngoài scope). Builder sửa MAJOR-1 (+ test) và xử lý MINOR-1/2/3 trước round 2.

## Residual risk
- Responsive chỉ kiểm bằng class/token, chưa render ở 375/768/1280 thật.
- aislop/ocr/blitzstrike không chạy (không được allow / không có môi trường).
- Chưa kiểm Turnstile widget thật trong trình duyệt (test mock widget).
