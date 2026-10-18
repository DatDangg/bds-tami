Agent: reviewer

# Review: feature-apply-form-upload-progress · phase-1-task-01 · round 1

- Task: `tasks/feature-apply-form-upload-progress/phase-1-task-01.md` (BL-005)
- Change doc: `spec/changes/2026-10-19-apply-form-upload-progress.md` · design-spec §3.4
- Diff: working tree, branch `staging`, chưa commit

## Review level: STRICT

**Reason:** task sửa `usePublicForm`, hook dùng chung với `LeadForm`, và đổi đường upload file công khai (multipart CV, fetch sang XHR). Cả hai đều thuộc nhóm bắt buộc STRICT (shared hook + upload/file).

## Blast radius
- `src/components/forms/use-public-form.ts`: hook dùng chung cho `ApplyForm` và `LeadForm`. Option mới `trackUploadProgress` mặc định tắt, nên LeadForm vẫn đi nhánh `fetch` như cũ (đã đọc code, đường json không đổi).
- `src/components/forms/submit-helpers.ts`: thêm hàm mới `postWithUploadProgress`. Các hàm có sẵn không đổi.
- `src/components/careers/ApplyForm.tsx` + `CvPicker.tsx` (mới): ô CV, nút gửi, tiến trình upload. Dùng ở trang chi tiết tuyển dụng VI/EN.
- i18n `page.careerDetail.applyForm.*`: thêm 4 khoá ở cả VI và EN.
- Endpoint `POST /api/public/job-applications`, Turnstile và server: **không đổi**. Body multipart vẫn dựng bằng `buildMultipartBody`, cùng field.

## Verify commands + result (lấy từ `.context/project-config.md`)
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | 232 file / 2484 test: 2483 PASS, 1 FAIL. Test fail là `src/endpoints/public/job-applications.test.ts` "vị trí hết hạn … -> 400" (expected 400, received 200). Test này đã fail từ trước và nằm ngoài phạm vi (Verification Plan) |
| `pnpm build` | PASS (exit 0) |
| `spec/test-scope/current.json` | JSON hợp lệ; specVersion 1.7.0, scopeVersion 7, workItem/changeDoc/specUpdate đúng task |

Chưa kiểm trên trình duyệt (không khởi dev server + DB). Phần responsive xác minh bằng cách tính CSS/class.

## Responsive Checklist Gate (diff có đụng UI)
| Mục | KQ | Bằng chứng |
|---|---|---|
| Không cuộn ngang | OK | `CvPicker` dùng `flex flex-col`; nút Chọn tệp `w-full sm:w-fit`; hàng tên file `min-w-0 truncate` và `shrink-0`. Không có width cố định theo px |
| Mobile-first `min-width` | OK | Chỉ dùng prefix `sm:`/`md:`. Viền nét đứt + hint `hidden md:block` → < 768 chỉ có nút, đúng §3.4 |
| Grid auto-fit/minmax | N/A | Không có grid |
| Container không fixed px | OK | Không có |
| Font-size theo rem/token | OK | `text-small`, theo token |
| Heading fluid | N/A | Không có heading mới |
| Spacing theo scale | OK | `gap-1.5/3`, `px-4 py-5` (scale Tailwind) |
| Media (ảnh/video) | N/A | Không có |
| Touch target ≥ 44px | OK | Chọn tệp `size="md"` = `h-11` (44px); nút xoá `size-11`; nút gửi `lg` = `h-13` |
| Nav / Table | N/A | Không có |
| 100vh | N/A | Không dùng |
| prefers-reduced-motion | OK | `motion-reduce:transition-none` ở dải progress (`transition-[width]`) và ở vùng thả (`transition-colors`) |
| Không che lỗi bằng overflow:hidden | OK | `overflow-hidden` trên nút gửi chỉ để cắt dải tô theo bo góc, không che nội dung/lỗi |

Gate responsive: **PASS**. Phần chưa xác minh bằng mắt (highlight `data-dragging` ở 768/1280, độ tương phản dải tô `bg-primary-foreground/15` khi nút đang `disabled`) ghi ở Residual risk.

## Skill gates
| Gate | KQ | Bằng chứng |
|---|---|---|
| aislop | skip, aislop not installed | `command -v aislop` không có |
| oxlint (anti-slop) | skip, oxlint not configured | Không có `.oxlintrc.json`; repo dùng `eslint .` và đã PASS |
| ocr (open-code-review) | skip, ocr not installed | — |
| AI-readable | OK | Hàm ngắn (`postWithUploadProgress` ~22 dòng; handler của `CvPicker` < 10 dòng), file ≤ 220 dòng, comment giải thích WHY, không có magic number mới (5MB là const đã có), indirection ≤ 2. Có 0 indicator |
| ai-friendly-web | N/A | Task là component form, không đụng `robots.txt`/`sitemap.xml`/`llms.txt` (vẫn có trong build output) |
| blitzstrike | skip | Không cài, không có môi trường pentest được phép. Server và endpoint không đổi; validate client chỉ là tiện ích, server vẫn kiểm file |
| impeccable / frontend-checklist | Có finding a11y | Xem MAJOR-1, MAJOR-2 |

## Kiểm theo các điểm được giao
- **XHR wrapper chuyển thành Response** (`submit-helpers.ts:60-82`): OK. Status 200–599 được bọc thành `Response` (body `responseText || null`, nên 204 không throw). Header `Retry-After` được copy sang. Status 0, `onerror`, `ontimeout`, `onabort` đều reject `TypeError` → đi vào nhánh `network` dùng chung. `upload.onprogress` được gắn trước `send()`. Phần xử lý 400/413/415/429/503/5xx dùng chung `failFromBody`, không nhân bản logic.
- **Double-submit:** `inFlightRef` giữ nguyên, nút `disabled` khi submitting. OK.
- **Reset progress:** `finally` gọi `setUploadPercent(null)` cho mọi kết quả: thành công, lỗi HTTP, lỗi mạng. Đã có test cho lỗi HTTP và lỗi mạng. OK.
- **File thả vào khi đang submitting:** `handleDrop` gọi `preventDefault` rồi return nếu `disabled`, nên trình duyệt không mở file. Đã có test. OK.
- **File sai không bị gửi qua FormData:** `CvPicker.handleChange` đặt `value = ""` ngay sau khi chọn. `collectFields` bỏ qua file rỗng (`size > 0`). File chỉ đi vào body qua `additionalFields` từ state `cv`, và `acceptCv` đặt `cv = null` khi file sai. Đã có test cho file 6MB và file sai đuôi (không gọi API). Retry dùng `requestSubmit` nên vẫn lấy file từ state `cv`. OK.
- **LeadForm không đổi:** không truyền option → điều kiện `!isJson && trackUploadProgress` sai → `fetch` với cùng headers/body như cũ. Có test "không bật option thì vẫn dùng fetch, không tạo XMLHttpRequest". OK.
- **Input sr-only + tabIndex -1:** label và `aria-invalid`/`aria-describedby` vẫn đúng. Nhưng focus khi có lỗi không hợp lệ, xem MAJOR-1.

## Findings

### [MAJOR-1] Lỗi ở ô CV: focus rơi vào input file ẩn (sr-only), người dùng bàn phím không thấy focus (WCAG 2.4.7, hồi quy so với input native trước đây)
- `src/components/careers/CvPicker.tsx:99-113` (input `sr-only`, `tabIndex={-1}`, mang `aria-invalid`) kết hợp `src/components/forms/use-public-form.ts:81` (`querySelector('[aria-invalid="true"]')?.focus()`).
- Khi họ tên/SĐT/email hợp lệ mà CV lỗi, focus "ô lỗi đầu tiên" theo design-spec §3.3 rơi vào input 1px bị clip. Các trường hợp: thiếu CV (`errors.cvMissing`), 413/415, 400 `details` field `cv`. Không có focus ring nhìn thấy, và nút "Chọn tệp" không có trạng thái nào báo đang focus. Trước task, input file native hiển thị được nên focus thấy được. Test "thiếu CV" (`ApplyForm.test.tsx:120`) không kiểm focus, nên không phát hiện.
- **Cách sửa đề xuất (chọn 1):**
  (a) Hiện focus ring trên nút khi input được focus. Đặt input trước nút với class `peer`, thêm `peer-focus-visible:ring-…`/`peer-focus:ring-…` vào nút. Hoặc thêm `has-[input:focus]:ring-…` lên wrapper.
  (b) Đặt `aria-invalid` lên nút "Chọn tệp" (nút đã có `aria-describedby` tới lỗi), để `querySelector` tìm thấy nút trước input. Khi đó input không mang `aria-invalid` nữa, hoặc nút đứng trước input trong DOM (thứ tự hiện tại đã như vậy).
  Thêm test: submit thiếu CV thì `document.activeElement` là phần tử nhìn thấy được (nút Chọn tệp) hoặc có ring.

### [MAJOR-2] `role="progressbar"` nằm trong `<button>`: theo ARIA, con của button là presentational, nên có thể không đọc được với AT thật (acceptance a11y "tiến trình đọc được")
- `src/components/careers/ApplyForm.tsx:129-143`. Role `button` có "Children Presentational: True" (WAI-ARIA 1.2), nên trình duyệt/AT tuân chuẩn có thể bỏ semantics của progressbar con. Nút còn `disabled` trong lúc gửi, nên phần text "Đang gửi… 42%" thay đổi trên phần tử không focus và không được thông báo. Test jsdom/testing-library (`getByRole("progressbar")`) pass vì không mô phỏng luật này, nên đây là false confidence.
- **Cách sửa đề xuất:** để dải tô trong nút `aria-hidden="true"` (chỉ còn vai trò thị giác). Đặt một `role="progressbar"` (`sr-only`, cùng `aria-valuenow/min/max/label`) hoặc một vùng `aria-live="polite"` báo theo bước (vd 25/50/75/100%) **bên ngoài** `<button>`, ngay sau nút. Cập nhật test để tìm progressbar ngoài nút (vd `expect(button).not.toContainElement(bar)`).

### [MINOR-1] < md ô CV lỗi không có viền `--color-error`
- `CvPicker.tsx:91`: `error && "md:border-error"` chỉ áp từ md. < md chỉ có icon + message, nút Chọn tệp không đổi màu viền. Design-spec §3.3 "Lỗi trường: Viền --color-error". Đề xuất: khi có `error`, thêm viền lỗi cho nút Chọn tệp (vd `border-error`).

### [MINOR-2] ≥ md đang kéo vào ô có lỗi thì không thấy highlight
- `CvPicker.tsx:90-91`: `md:border-error` đứng sau `md:border-primary` trong `cn`, và tailwind-merge giữ class sau, nên khi đang có lỗi thì viền highlight lúc kéo bị lỗi đè. Đề xuất: đổi thứ tự (`dragging` sau `error`) hoặc dùng `error && !dragging`.

### [MINOR-3] Nút có thể đứng ở "Đang gửi… 100%" khá lâu
- Upload xong nhưng server còn xử lý (lưu file/scan) thì nhãn vẫn là 100%. Không sai spec. Có thể cân nhắc trở về nhãn "Đang gửi…" khi `percent === 100`. Không chặn PASS.

## Surgical diff / code quality
- Mọi dòng trong scope đều trace về task. Phần tách `CvPicker` có lý do (giữ `ApplyForm` gọn) và được ghi trong decision log. `formatFileSize` chỉ chuyển chỗ, không đổi logic. Không có refactor ngoài lề.
- `test-utils.ts` có import `vitest` nhưng chỉ test dùng đến, nên không vào bundle (build PASS). Tên file theo ngoại lệ trong `runtime-dependencies.test.ts`.
- Security: không thêm endpoint. XHR same-origin. Validate client chỉ là UX, server vẫn kiểm. Không có XSS (tên file render dạng text).
- Spec: F6 + spec_version 1.7.0, CHANGELOG, `spec/updates/…` và test-scope đều nhất quán. Doc impact: không có (API/schema không đổi).

## Residual risk
- Chưa xem trên trình duyệt ở 375/768/1280: highlight kéo-thả, tương phản dải tô 15% trên nút disabled, và hành vi thả thật (chỉ test bằng `fireEvent.drop` trong jsdom).
- Chưa kiểm với screen reader thật cách đọc progressbar (lý do của MAJOR-2).
- Test fail sẵn ở endpoint job-applications (phụ thuộc ngày) vẫn còn, ngoài phạm vi.

## Verdict: ❌ FAIL

Còn 2 MAJOR a11y (focus vô hình khi CV lỗi; progressbar lồng trong button). Builder sửa MAJOR-1 và MAJOR-2 (nên kèm MINOR-1/2) và thêm test như đề xuất, rồi review round 2.
