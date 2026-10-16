Agent: reviewer

# Review: build/tami-website layer-2-task-09 (bộ form dùng chung), round 2

- **Review level:** STRICT
- **Reason:** Đây là component/hook form dùng chung cho form lead và form ứng tuyển (shared foundation). Nó gồm consent dữ liệu cá nhân (BR-30), chống spam Turnstile (BR-16), upload CV qua multipart và contract client với API public. Round 1 FAIL vì MAJOR-1 (báo nhầm lỗi validate thành lỗi captcha).
- **Blast radius:** `src/components/forms/*` (submit-helpers, use-public-form, TurnstileWidget, FormStatus/FormErrorSummary, FormField, ConsentCheckbox và test). `src/components/icons.ts` chỉ thêm export `CheckCircle` và `WarningCircle`. `src/i18n/messages/{vi,en}.json` chỉ thêm khoá `form.*`. `vitest.config.ts` thêm `server.deps.inline: ["next-intl"]`, chỉ áp cho project jsdom. Nơi sẽ dùng: layer-7-task-04 (form lead), layer-10-task-01 (form ứng tuyển), endpoint `POST /api/public/leads` và `POST /api/public/job-applications`. Bỏ qua `src/payload-types.ts` theo yêu cầu.

## Verify commands + result

| Lệnh (`.context/project-config.md`) | Kết quả |
|---|---|
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS: 52/52 file, 524/524 test, có integration chạy trên Docker dev. Stack trace trong log là lỗi mà test integration cố tình gây ra, không có test fail. |
| `pnpm build` | PASS (exit 0) |

## Kiểm lại MAJOR-1 (400 validate bị báo nhầm là captcha): ĐÃ SỬA

- `submit-helpers.ts:61-74` `parseDetails`: item có `path: []` (lỗi zod ở root) hoặc chỉ có `{message}` (dạng của `click-events.ts:31,36`) giờ được giữ với `field: ""`. Vì `""` không nằm trong `known`, `use-public-form.ts:105` đưa message vào tóm tắt. Item không có cả tên field lẫn message thì bỏ, đúng như mong muốn. Test: `use-public-form.test.tsx:302-318`.
- `use-public-form.ts:107-109,90-96`: 400 không parse được detail nào thì gọi `failFromBareBadRequest(body.error)`. Captcha chỉ được nhận khi message khớp `/captcha/i`. Không khớp thì hiện `body.error`; không có `error` thì hiện `errors.generic`. Test: `:270`, `:280`, `:291`.
- **So với server thực tế:** `public-pipeline.ts:80` trả cố định `fail(400, "Xác thực captcha không thành công")`. Pipeline không dịch theo locale, nên ở `/vi` hay `/en` server đều trả đúng chuỗi tiếng Việt này. Chuỗi luôn chứa "captcha" nên luôn khớp. Khi khớp, client hiện bản dịch của chính nó (`form.captcha.failed`), nên người dùng `/en` thấy tiếng Anh. Nếu sau này server dịch sang tiếng Anh ("Captcha verification failed") thì vẫn khớp. Nếu server đổi sang câu không có chữ "captcha" (vd "Xác minh chống spam…") thì client hiện nguyên message của server với kind `validation`. Ý nghĩa vẫn đúng, chỉ mất nhãn captcha. Như vậy client xuống cấp an toàn, không báo nhầm.
- **Có lỗi khác chứa "captcha" bị nhận nhầm không:** Các 400 khác của pipeline là `:77` "Yêu cầu không hợp lệ", `:87` và `:89` "Dữ liệu không hợp lệ", đều không chứa "captcha". Lỗi validate có `details` (kể cả lỗi zod về field `turnstileToken`) đi nhánh `details` và không bao giờ qua regex, vì regex chỉ chạy khi không có detail nào. 413/415/429/503 không đi qua nhánh này. Hiện chưa có đường nào nhận nhầm.
- **Độ bền:** Đủ cho hiện tại. Nhận diện captcha bằng regex trên message là cách tạm, vì API chưa có mã lỗi máy đọc được. Xem MINOR-R2-2.

## Kiểm lại các MINOR của round 1

| MINOR round 1 | Kết quả | Bằng chứng |
|---|---|---|
| 1. Thử lại gửi bản chụp cũ | ĐÃ SỬA | `use-public-form.ts:180-183`: có `formElement` thì gọi `requestSubmit()`, sự kiện submit chạy lại `handleSubmit` của consumer nên `extra` đi theo closure. Chỉ khi chưa có form (luồng `submit()` trực tiếp) mới dùng `lastSubmit`. Test `:320-337` sửa ô rồi Thử lại, body gửi đi mang giá trị mới. |
| 2. PII còn trong state sau thành công | ĐÃ SỬA | `use-public-form.ts:134`: `setLastSubmit(null)` khi `response.ok`. |
| 3. Multipart bỏ `extra` không phải chuỗi | ĐÃ SỬA | `submit-helpers.ts:33-39`: number/boolean dùng `String`, object dùng JSON, null/undefined bị bỏ. Khớp API_SPEC §3.2 (dòng 87): `jobPostingId` là field multipart dạng chuỗi, nên `12` thành `"12"`. `utm` không có trong §3.2; nếu có thì gửi dạng chuỗi JSON (xem residual). Test `:368-380`. |
| 4. Chống double-submit dựa vào closure | ĐÃ SỬA | `inFlightRef` (`:67,143,156,166`) chỉ được đọc/ghi trong handler, không đọc trong render, nên không vi phạm `react-hooks/refs` (lint PASS). Cờ được bật sau các nhánh return sớm (validate, consent, token) nên không bị kẹt. `finally` (`:165-170`) luôn tắt cờ, kể cả khi `send` ném lỗi (`catch` ở `:163`) hoặc fetch bị abort, vì abort cũng ném rồi đi vào `catch`. Test `:339` (gọi `submit()` 2 lần liền nhau) và `:352`. |
| 5. `loadTurnstile` cache promise bị reject | ĐÃ SỬA | `TurnstileWidget.tsx:28-34`: `fail()` gỡ thẻ script, đặt `scriptPromise = null` rồi reject; dùng chung cho `onload` thiếu `window.turnstile` và `onerror`. Handler gắn trên thẻ script đã bị gỡ nên không rò listener. Test `:131` và `:141`. |
| 6. `expired-callback` reset trùng | ĐÃ SỬA | `:113` chỉ gọi `onToken(null)`; auto-refresh mặc định của Turnstile tự xin token mới. Test `:99`. |
| 7. `key` trùng ở FormStatus, thiếu test | ĐÃ SỬA (phần lớn) | `FormStatus.tsx:63`: lọc trùng bằng `[...new Set(details)]` nên `key={detail}` là duy nhất. Đã có test unmount gọi `remove` (`TurnstileWidget.test.tsx:155`). Nhánh file `size === 0` của `collectFields` vẫn chưa test được vì jsdom không hỗ trợ; residual, không chặn PASS. |

## Không regression

Các điểm đạt ở round 1 vẫn được test bảo vệ và vẫn PASS:
- Consent chặn submit: `use-public-form.ts:145`, test `:83`, `:97` (vi và en).
- Turnstile tải lười khi vào viewport hoặc focus, tải 1 lần, render explicit, gỡ widget khi unmount: `TurnstileWidget.tsx:74-129`, test `:56-163`.
- `details` gắn `aria-invalid`/`aria-describedby` và focus ô lỗi đầu tiên: test `:139`.
- Thành công thì focus tiêu đề: `FormStatus.tsx:24-31`, test `:190`.
- 413/415/429/503 và lỗi mạng: test `:225`, `:236`, `:248`.
- Link chính sách theo locale: test `:108`.
- Touch target 44px: class không đổi (`h-12`, `min-h-11`, checkbox có `after:-inset-3`).

Thêm một kiểm tra luồng: sau khi Thử lại, token cũ đã bị xoá ở `finally`. Nếu Turnstile chưa cấp token mới thì form chặn ở bước captcha và không gọi API (test `:258-261`). Đây là hành vi đúng.

## Findings

Không có CRITICAL hay MAJOR.

### [MINOR-R2-1] Tên test không còn khớp hành vi
`src/components/forms/use-public-form.test.tsx:248` vẫn ghi "nút Thử lại gửi lại cùng dữ liệu", nhưng Thử lại giờ đọc lại form hiện tại. Đề xuất đổi tên test, vd "…có nút Thử lại, token cũ không dùng lại".

### [MINOR-R2-2] Nhận diện captcha dựa vào nội dung message (cách tạm)
`src/components/forms/submit-helpers.ts:90-92`. Hiện đúng với `public-pipeline.ts:80`, nhưng phụ thuộc vào câu chữ của server. Đề xuất cho task endpoint (leads / job-applications): thêm mã lỗi máy đọc được, vd `code: "captcha_failed"`, vào API_SPEC §2, sau đó client so mã thay vì dùng regex. Không chặn PASS vì nếu message đổi thì client vẫn hiện thông báo trung tính, không hiện sai.

### [MINOR-R2-3] Ở `/en`, 400 không có detail sẽ hiện message tiếng Việt của server
`use-public-form.ts:95` hiện thẳng `body.error`. Pipeline đang hard-code tiếng Việt ở `public-pipeline.ts:77,87,89`, nên trang `/en` có thể hiện "Dữ liệu không hợp lệ". Lỗi gốc nằm ở server: API_SPEC dòng 28 yêu cầu server trả message theo `locale`. Phần này ngoài scope task, cần xử lý ở task endpoint hoặc pipeline. Trường hợp này hiếm, vì client luôn gửi body đúng dạng.

### [MINOR-R2-4] AI-readable: kích thước hàm/file
- `usePublicForm` (`use-public-form.ts:52-200`) dài khoảng 148 dòng, vượt mức 50 dòng/hàm. Thân hook được chia thành các hàm con ngắn, đặt tên rõ (`failWith`, `failFromBareBadRequest`, `failFromBody`, `send`, `submit`, `retry`), mỗi hàm ≤ 25 dòng.
- `use-public-form.test.tsx` dài 382 dòng, vượt mức 300 dòng/file. Đây là file test.
- Mới có 1 indicator, dưới ngưỡng FAIL (≥3). Có thể tách `failFromBody` cùng các hàm con ra khỏi hook, và tách test thành `use-public-form.errors.test.tsx`, khi ráp form ở layer-7.

## Responsive Checklist Gate (diff đụng UI)

Không có browser trong môi trường review. Phần dưới được xác minh bằng class/CSS. Round 2 không đổi layout; chỉ đổi cách lọc trùng ở `FormStatus` và logic.

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang | OK | Control dùng `w-full min-w-0`, khung `flex flex-col`, nhóm nút `flex-wrap`, không có width px cố định |
| Mobile-first / grid | N/A | Primitive không có grid hay media query |
| Font rem / heading fluid | OK | Dùng token `text-small`, `text-body`, `text-h3`; không có `px` trong diff |
| Media | N/A | Không có ảnh hay video; icon kèm `aria-hidden` |
| Touch ≥44px | OK | Input `h-12`; checkbox mở vùng chạm bằng `after:-inset-3`; link hotline `min-h-11`; link chính sách là link inline trong câu, được miễn theo WCAG 2.5.8 (residual như round 1) |
| Nav/table | N/A | Không có |
| 100vh / reduced-motion / overflow hidden | OK | Không dùng `100vh` hay `overflow:hidden`; transition dùng token |

## Skill gates

- **aislop:** skip, aislop chưa cài.
- **oxlint (anti-slop):** skip, oxlint chưa được cấu hình. ESLint và tsc PASS.
- **ocr (open-code-review):** skip, ocr chưa cài.
- **AI-readable:** OK. Có 1 indicator (MINOR-R2-4). Comment giải thích WHY; magic number `200px` có comment.
- **ai-friendly-web:** N/A. Đây là primitive nội bộ, không thêm trang public.
- **blitzstrike:** skip. Task này chưa có endpoint public để pentest.
- **security:** OK. Không có `dangerouslySetInnerHTML`; message của server được React escape. PII được xoá khỏi state sau khi gửi thành công. Token Turnstile chỉ dùng 1 lần. Site key là thông tin công khai.

## Doc impact

No doc impact: task này không đổi API, schema hay flow. Đề xuất cho task endpoint: ghi vào API_SPEC §2 mã lỗi captcha (MINOR-R2-2), và ghi rằng nếu multipart nhận object (vd `utm`) thì gửi dạng chuỗi JSON.

## Residual risk

- Schema zod của endpoint leads/job-applications chưa có, nên contract mới chỉ được đối chiếu với API_SPEC. Endpoint phải:
  - nhận `consent` là `true` (JSON) và `"true"` (multipart);
  - parse được `jobPostingId` dạng chuỗi;
  - trả message theo `locale`;
  - lưu thời điểm và phiên bản chính sách (BR-30).
- Message của pipeline đang hard-code tiếng Việt (MINOR-R2-3).
- Nhánh file `size === 0` của `collectFields` chưa test được trên jsdom.
- Chưa kiểm được trên browser thật ở 375/768/1280 và contrast thực tế. Sẽ xác minh ở task ráp form.

## Verdict

PASS. MAJOR-1 đã sửa và có test bảo vệ. 7 MINOR của round 1 đã sửa. Không có regression. Cả 5 verify command đều PASS. Còn 4 MINOR không chặn, nên làm ở task endpoint hoặc khi ráp form.
