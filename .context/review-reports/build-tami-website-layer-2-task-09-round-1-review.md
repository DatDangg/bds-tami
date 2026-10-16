Agent: reviewer

# Review — build/tami-website layer-2-task-09 (bộ form dùng chung) — round 1

- **Review level:** STRICT
- **Reason:** Component/hook form dùng chung cho lead và ứng tuyển (shared foundation), có consent dữ liệu cá nhân (BR-30), chống spam Turnstile (BR-16) và upload CV (multipart). Đây là contract client↔API công khai mà nhiều màn sẽ dùng.
- **Blast radius:** `src/components/forms/*` (FormField, ConsentCheckbox, TurnstileWidget, FormStatus/FormErrorSummary, use-public-form, submit-helpers); `src/components/icons.ts` (thêm CheckCircle, WarningCircle, chỉ thêm export); `src/i18n/messages/{vi,en}.json` (khoá mới `form.*`, không đổi khoá cũ); `vitest.config.ts` (`server.deps.inline: ["next-intl"]`, chỉ trong project jsdom `src/**/*.test.tsx`, không ảnh hưởng project unit/integration). Ai dùng sau: layer-7-task-04 (lead form), layer-10-task-01 (form ứng tuyển), và các endpoint `POST /api/public/leads` / `job-applications` khi được viết.

## Verify commands + result

| Lệnh (từ `.context/project-config.md`) | Kết quả |
|---|---|
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS — 52 file / 516 test, có integration chạy trên Docker dev |
| `pnpm build` | PASS |

## Đối chiếu acceptance

| AC | Kết quả | Bằng chứng |
|---|---|---|
| Không tick consent thì không submit được, lỗi hiện đúng ngôn ngữ | OK | `use-public-form.ts:131`; test `use-public-form.test.tsx:72,86` (vi + en, fetch không được gọi) |
| Turnstile chỉ tải khi vào viewport/focus | OK | `TurnstileWidget.tsx:73-90`; test `TurnstileWidget.test.tsx:56,61,70,86` |
| `details` hiện cạnh đúng field, lỗi chung có `role="alert"`, thành công thì focus tiêu đề | Đạt một phần — xem MAJOR-1 | `use-public-form.ts:85-110`, `FormStatus.tsx:24-31`; test `:128,179` |
| Không dùng placeholder thay label | OK | `FormField.tsx:91-101`; `FormField.test.tsx:7` |

## Các điểm kiểm đặc biệt

1. **Contract.** JSON: `{...extra, ...fields, consent: true, turnstileToken, locale}` khớp API_SPEC §3.1 (dòng 75-79), `utm` là object đi qua `extra` vẫn giữ nguyên trong JSON. Multipart: `consent="true"`, `turnstileToken`, `locale`, `cv` khớp §3.2 (dòng 87). Bỏ input ẩn `cf-turnstile-response` (`submit-helpers.ts:13`) là đúng vì server đọc `turnstileToken`. Chưa có endpoint leads/job-applications nên chưa có schema zod của server để so; đã so với API_SPEC. Về BR-30 ("lưu thời điểm và nội dung đồng ý, tức phiên bản chính sách"): client không cần gửi thêm gì, server gắn thời điểm và phiên bản chính sách hiện hành khi lưu. Chấp nhận được; việc này phải được kiểm ở task endpoint (residual risk).
2. **"400 không có details nghĩa là captcha".** Theo `public-pipeline.ts`, 400 với `details: []` xảy ra ở 3 chỗ: captcha sai (`:80`), `readToken` ném lỗi do body hỏng (`:77`), `validate` ném lỗi (`:87`). Client của form này luôn gửi body đúng dạng nên hai trường hợp sau hiếm. Lỗi nặng hơn nằm ở `parseDetails`, xem MAJOR-1.
3. **Message trong details.** Client hiện thẳng message của server. Theo API_SPEC dòng 28 thì server phải trả message theo `locale`, nên việc dịch là trách nhiệm của endpoint (nếu để mặc định zod thì ra tiếng Anh, cần ghi vào task endpoint). Không có rủi ro XSS vì React escape text, không có `dangerouslySetInnerHTML`. Lỗi của field lạ được đưa vào tóm tắt (test `:136,153`).
4. **TurnstileWidget.** Tải script lười khi intersect (rootMargin 200px) hoặc `focusin`; tải 1 lần dùng chung cho mọi widget; render explicit; reset token sau mỗi lần submit; xử lý expired/error; cleanup gọi `remove` khi unmount. `interaction-only` hợp với "captcha ẩn" của BR-16. Trình duyệt không có IntersectionObserver thì tải ngay: chấp nhận được. Site key truyền qua prop từ server component: hợp lý vì site key không phải secret.
5. **use-public-form.** Có chống double-submit, 429 đổi `Retry-After` ra số phút, 413/415 gắn vào `fileField`, 503 và lỗi mạng có `role="alert"` kèm nút Thử lại, thành công thì `role="status"` và focus tiêu đề. `extra` của multipart chỉ nhận chuỗi; utm không dùng ở form ứng tuyển nên không mất dữ liệu, nhưng xem MINOR-3. PII còn giữ sau khi gửi thành công: xem MINOR-2.
6. **a11y.** Đạt — xem Responsive gate.
7. **vitest.config.** Thay đổi chỉ nằm trong project jsdom. Toàn bộ 52 file test vẫn PASS.
8. **Test.** Đa số test hành vi thật qua RTL, chạy với messages i18n thật. Nhánh file của `collectFields` (bỏ file `size === 0`) chưa có test vì jsdom không đọc được; mức MINOR. Thiếu test cleanup `remove` khi unmount và test details không có path.

## Findings

### [MAJOR-1] `parseDetails` bỏ các lỗi không có `path`/`field`, nên lỗi validate bị báo nhầm thành "captcha lỗi"
- `src/components/forms/submit-helpers.ts:54-55`: `name = Array.isArray(path) ? path[0] : path`. Các item sau đều bị `continue` bỏ qua:
  - zod issue ở cấp root, `path: []`. Đây là kết quả của `.refine`/`.superRefine` liên trường trên object.
  - `{ message }` không có path. Chính codebase đang dùng dạng này: `src/endpoints/public/click-events.ts:31,36` ("Nội dung quá lớn", "Nội dung không phải JSON").
- Sau đó `use-public-form.ts:94-97` thấy cả `errors` lẫn `details` đều rỗng nên báo "Xác minh chống spam không thành công". Message của server (đã dịch theo locale, API_SPEC dòng 28) bị nuốt, còn người dùng được hướng dẫn sai và sẽ bấm gửi lại mãi. Nhánh `else if (message) details.push(message)` ở `use-public-form.ts:92` vì vậy không bao giờ nhận được các message không có field.
- **Fix đề xuất:**
  - (a) `parseDetails` giữ lại item có `message` dù không có field/path (vd `field: ""`) để chúng vào tóm tắt.
  - (b) Khi 400 không parse được detail nào: nếu `body.error` là chuỗi thì hiện nó (server đã dịch theo locale), chỉ dùng `captcha.failed` làm fallback. Tốt hơn nữa là thống nhất một mã máy đọc được cho lỗi captcha với endpoint, ghi vào API_SPEC §2 khi làm endpoint.
  - (c) Thêm test RTL cho `details: [{ path: [], message }]` và `details: [{ message }]`.

### [MINOR-1] Nút "Thử lại" gửi lại bản chụp dữ liệu cũ
`use-public-form.ts:142,163-165`: `retry()` gửi `lastSubmit.fields`. Nếu người dùng sửa ô sau khi bị lỗi rồi bấm Thử lại thì dữ liệu cũ được gửi đi mà không báo gì. Đề xuất: `retry` gọi `formElement?.requestSubmit()` để đọc lại form hiện tại, chỉ giữ `lastSubmit` cho luồng `submit()` trực tiếp.

### [MINOR-2] PII (và Blob CV) còn nằm trong state sau khi gửi thành công
`use-public-form.ts:64,121`: `lastSubmit` chứa họ tên, SĐT, file CV và vẫn tồn tại khi `status = "success"`. Đề xuất `setLastSubmit(null)` khi thành công.

### [MINOR-3] Multipart âm thầm bỏ `extra` không phải chuỗi
`submit-helpers.ts:35-37`: vd `jobPostingId` là number (id Postgres của Payload) sẽ bị rơi mất, server trả 400. Đề xuất: number/boolean thì `String(value)`, giá trị khác thì ném lỗi khi dev hoặc ghi rõ trong type (`Record<string, string | number | boolean>`).

### [MINOR-4] Chống double-submit dựa vào closure của state
`use-public-form.ts:129`: `status` là giá trị lúc render. Test chỉ chứng minh nút đã disabled ở lần bấm thứ hai. Nên dùng `useRef` cờ in-flight để chặn chắc chắn, kể cả khi form gọi `submit()` trực tiếp.

### [MINOR-5] `loadTurnstile` giữ promise bị reject mãi khi `onload` chạy mà không có `window.turnstile`
`TurnstileWidget.tsx:28`: nhánh này không xoá `scriptPromise` như `onerror` (`:31`). Đề xuất xử lý giống `onerror`.

### [MINOR-6] `expired-callback` gọi `reset` thủ công trùng với `refresh-expired: "auto"` mặc định của Turnstile
`TurnstileWidget.tsx:112-115`. Vô hại, nhưng nên chọn một cách: đặt `"refresh-expired": "manual"` hoặc bỏ lời gọi `reset`.

### [MINOR-7] Vài chỗ nhỏ khác
- `FormStatus.tsx:64`: `key={detail}` sẽ trùng nếu server trả 2 message giống nhau. Nên dùng index hoặc khử trùng.
- Thiếu test cleanup `remove` khi unmount (`TurnstileWidget.tsx:126-130`) và test nhánh file `size === 0` của `collectFields` (`submit-helpers.ts:17`).

## Responsive Checklist Gate (diff đụng UI)

Không có browser trong môi trường review. Phần dưới xác minh bằng class/CSS; layout cụ thể ở 375/768/1280 sẽ được xác minh ở task ráp form (layer-7-task-04, layer-10-task-01).

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang | OK | Control `w-full min-w-0` (`FormField.tsx:40`); khung `flex flex-col`; không có width px cố định |
| Mobile-first / grid | N/A | Primitive không có grid hay media query |
| Font rem / heading fluid | OK | Dùng token `text-small`/`text-body`/`text-h3` (layer-1 tokens), không có `px` trong diff |
| Media | N/A | Không có ảnh/video |
| Touch ≥44px | OK | Input/select/file `h-12` (48px); checkbox `size-5` + `after:-inset-3` = 44px (`ui/checkbox.tsx:17`); link hotline `min-h-11`. Link chính sách `min-h-6` là link inline trong câu, được miễn theo WCAG 2.5.8; ghi residual so với §1.4 |
| Nav/table | N/A | — |
| 100vh / reduced-motion / overflow hidden | OK | Không dùng `100vh`, không dùng `overflow:hidden`; transition dùng token duration |

## Skill gates

- **impeccable / frontend-checklist:** OK. Label hiển thị, `*` kèm chữ ẩn, `aria-describedby` nối helper và lỗi, `aria-invalid`, tóm tắt lỗi `role="alert"`, thành công `role="status"` và focus `h2[tabIndex=-1]`, icon kèm `aria-hidden`, link mở tab mới có chú thích sr-only. Nút gửi không disable khi chưa tick consent, đúng §3.3. Contrast của token error/accent-text đã duyệt ở layer-1 (residual).
- **security:** OK, trừ MAJOR-1 (đây là lỗi correctness, không phải bảo mật). Không có XSS (React escape, không dùng `dangerouslySetInnerHTML`). Link `_blank` có `rel="noopener noreferrer"`. Site key công khai, không lộ secret. Token chỉ dùng 1 lần, reset sau mỗi submit. Kiểm MIME/size thật ở server thuộc task endpoint.
- **responsive-web:** OK (xem gate trên).
- **aislop:** skip, aislop chưa cài.
- **oxlint (anti-slop):** skip, chưa cấu hình oxlint. ESLint + tsc PASS.
- **ocr (open-code-review):** skip, ocr chưa cài.
- **AI-readable:** OK. Có 1 indicator nhẹ: `TurnstileWidget` khoảng 80 dòng thân hàm, nhưng chia thành các effect rõ ràng. Không có magic number không giải thích (200px có comment), comment giải thích WHY. Dưới 3 indicator.
- **ai-friendly-web:** N/A (primitive nội bộ, không phải trang public mới).
- **blitzstrike:** skip, chưa có endpoint public để pentest trong task này.

## Doc impact

No doc impact: không đổi API/schema/flow. Khi làm task endpoint nên ghi rõ vào API_SPEC §2 cách client phân biệt lỗi captcha (xem MAJOR-1b).

## Residual risk

- Schema zod của server cho leads/job-applications chưa tồn tại. Contract mới chỉ so với API_SPEC. Endpoint phải nhận `consent` boolean `true` (JSON) và chuỗi `"true"` (multipart), trả message theo `locale`, và lưu thời điểm + phiên bản chính sách (BR-30).
- Message captcha của pipeline đang hard-code tiếng Việt (`public-pipeline.ts:80`), ngoài scope task này. Client đang dùng message tự dịch của mình.
- Chưa kiểm được trên browser thật ở 375/768/1280 và contrast thực tế.

## Verdict

FAIL — 1 MAJOR (MAJOR-1). Các MINOR nên sửa cùng lượt, nhất là MINOR-1/2/3 vì nhỏ và nằm trong cùng file.
