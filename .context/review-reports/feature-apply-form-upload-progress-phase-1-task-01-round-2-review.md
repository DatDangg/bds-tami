Agent: reviewer

# Review: feature-apply-form-upload-progress · phase-1-task-01 · round 2

- Task: `tasks/feature-apply-form-upload-progress/phase-1-task-01.md` (BL-005)
- Round 1: `.context/review-reports/feature-apply-form-upload-progress-phase-1-task-01-round-1-review.md` (FAIL: MAJOR-1, MAJOR-2, MINOR-1..3)
- Diff: working tree, branch `staging`, chưa commit. Dirty ngoài task (`.claude/**`, `.context/project-config.md`, `src/payload-types.ts`, `src/app/(payload)/admin/importMap.js`, các `spec/changes/2026-10-19-*` khác, `.context/runs/**`) không review.

## Review level: STRICT
**Reason:** giữ level của round 1. Task sửa hook dùng chung `usePublicForm` (LeadForm cũng dùng) và đổi đường upload file công khai (fetch sang XHR).

## Blast radius
- `src/components/careers/CvPicker.tsx`: nút "Chọn tệp" thêm `aria-invalid`, viền lỗi và outline khi focus. Thứ tự class error/dragging đã đổi. Chỉ dùng trong ApplyForm.
- `src/components/careers/ApplyForm.tsx`: dải tô trong nút gửi giờ là `aria-hidden`, progressbar `sr-only` chuyển ra ngoài nút, từ 100% nhãn trở về "Đang gửi…".
- `src/components/careers/ApplyForm.test.tsx`: thêm assert focus, mô tả, vị trí progressbar.
- Round 2 **không đổi** `use-public-form.ts`, `submit-helpers.ts` hay i18n so với lần đã review ở round 1. LeadForm và endpoint không đổi.

## Verify commands + result (`.context/project-config.md`)
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | 232 file / 2485 test: 2484 PASS, 1 FAIL. Test fail duy nhất là `src/endpoints/public/job-applications.test.ts` "vị trí hết hạn … -> 400". Test này đã fail từ trước và nằm ngoài phạm vi theo Verification Plan |
| `pnpm build` | PASS (exit 0) |

Không chạy trình duyệt (không có dev server và DB). Phần responsive/a11y xác minh bằng cách đọc CSS/class và code.

## Đóng finding round 1
| Finding | Trạng thái | Bằng chứng |
|---|---|---|
| MAJOR-1 focus rơi vào input sr-only | **Đã đóng** | `CvPicker.tsx:99-110`: nút đứng trước input trong DOM và mang `aria-invalid`. `use-public-form.ts:79-82` focus `[aria-invalid="true"]` đầu tiên trong `useEffect`, chạy sau khi render `status="idle"`, nên nút không còn `disabled` và `.focus()` có tác dụng. Đường này dùng cho cả lỗi client `cvMissing` và lỗi server 413/415/400 `details.cv` (`failWith` → `focusRequest`). Outline: `aria-invalid:focus:outline-2 outline-offset-2 outline-focus-ring`. Token `--color-focus-ring` có thật trong `@theme static` (`globals.css:48`), nên utility `outline-focus-ring` được sinh ra. Màu giống `:focus-visible` toàn cục (`globals.css:258-261`). Test `ApplyForm.test.tsx:129-133` assert `toHaveFocus` cho nút và mô tả "Vui lòng đính kèm CV." |
| MAJOR-2 progressbar lồng trong button | **Đã đóng** | `ApplyForm.tsx:133-139`: dải tô là `aria-hidden`. `:143`: `role="progressbar"` dạng `sr-only`, có `aria-label`/`valuenow`/`min`/`max`, nằm ngoài `<button>`. Test `:234-240` có `not.toContainElement(bar)`, kiểm `valuenow=42` và dải tô `width: 42%` |
| MINOR-1 < md không có viền lỗi | Đã đóng | `CvPicker.tsx:107` có `aria-invalid:border-error`. Class này không xung đột với `border-text` của variant outline vì khác variant, nên tailwind-merge giữ cả hai |
| MINOR-2 lỗi che highlight kéo | Đã đóng | `CvPicker.tsx:90-92`: `dragging` đứng sau `error`, nên tailwind-merge giữ `md:border-primary` |
| MINOR-3 đứng ở 100% | Đã đóng | `ApplyForm.tsx:87`: khi `>= 100`, nhãn hiện `tForm("submitting")`, progressbar vẫn báo 100. Test `:242-246` |

## Kiểm regression (theo câu hỏi được giao)
- **`aria-invalid` hợp lệ trên button không?** Về mặt kỹ thuật thì không chuẩn. ARIA 1.2 đã bỏ `aria-invalid` khỏi nhóm thuộc tính global, và role `button` không có trong danh sách role hỗ trợ. Một số AT sẽ không đọc "invalid" trên nút. Tuy vậy, nội dung lỗi vẫn được đọc qua `aria-describedby`, đã có test `toHaveAccessibleDescription`. Ở đây thuộc tính này chủ yếu được dùng làm mốc cho `querySelector` của hook. Xem MINOR-A. Không chặn PASS.
- **Hai phần tử cùng aria-invalid/describedby: đọc lỗi 2 lần?** Khi dùng Tab/focus thì không, vì input có `tabIndex=-1` nên chỉ nút nhận focus và lỗi được đọc 1 lần. Khi duyệt bằng virtual cursor thì có: trình đọc màn hình gặp nút, rồi input (vẫn trong cây a11y), rồi đoạn helper/lỗi, nên đọc lặp. Xem MINOR-B. Không chặn PASS.
- **Token `outline-focus-ring`:** có thật, đã nêu ở trên.
- **Outline hiện cả khi click chuột vào nút đang lỗi:** biến thể là `focus:` chứ không phải `focus-visible:`. Builder đã ghi lý do có chủ ý: focus do code gọi `.focus()` không chắc khớp `:focus-visible`. Chỉ là hiển thị, chấp nhận được.
- **LeadForm / hook:** round 2 không đổi gì. Test "không bật option thì dùng fetch" vẫn PASS.

## Responsive Checklist Gate (diff đụng UI, chỉ xét thay đổi round 2 + phần đã xét ở round 1)
| Mục | KQ | Bằng chứng |
|---|---|---|
| Không cuộn ngang | OK | Progressbar mới là `sr-only` (1px, clip), không chiếm layout. Nút vẫn `w-full sm:w-fit` |
| Mobile-first `min-width` | OK | Chỉ dùng prefix `sm:`/`md:`. Viền lỗi trên nút áp ở mọi cỡ, viền nét đứt chỉ từ `md:` |
| Grid auto-fit/minmax | N/A | Không có grid |
| Container không fixed px | OK | Không có |
| Font-size rem/token | OK | `text-small`, `text-button` (token) |
| Heading fluid | N/A | Không có heading mới |
| Spacing theo scale | OK | Scale Tailwind |
| Media | N/A | Không có |
| Touch target ≥ 44px | OK | Chọn tệp `h-11`, xoá `size-11`, gửi `h-13`. Outline offset không làm đổi kích thước |
| Nav / Table | N/A | Không có |
| 100vh | N/A | Không dùng |
| prefers-reduced-motion | OK | `motion-reduce:transition-none` trên dải tô và vùng thả. Ngoài ra còn có rule toàn cục `globals.css:265` |
| Không che lỗi bằng overflow:hidden | OK | `overflow-hidden` của nút gửi chỉ cắt dải tô. Lỗi CV nằm ngoài nút |

Gate responsive: **PASS**. Phần chưa xem bằng mắt ghi ở Residual risk.

## Skill gates
| Gate | KQ | Bằng chứng |
|---|---|---|
| aislop | skip, aislop not installed | Giống round 1 |
| oxlint (anti-slop) | skip, oxlint not configured | Repo dùng `eslint .`, PASS |
| ocr | skip, ocr not installed | — |
| AI-readable | OK | `CvPicker.tsx` 153 dòng, `ApplyForm.tsx` 146 dòng, các hàm < 50 dòng, comment nêu WHY (WCAG 2.4.7, ARIA presentational children), không có magic number mới. Có 0 indicator |
| ai-friendly-web | N/A | Component form, không đụng robots/sitemap/llms |
| blitzstrike | skip | Không cài. Round 2 chỉ sửa markup/a11y, không đụng server |
| impeccable / frontend-checklist | OK (có MINOR) | Focus nhìn thấy được, viền lỗi theo §3.3, progressbar đọc được. Xem MINOR-A..D |

## Findings

Không có CRITICAL hay MAJOR. Các MINOR dưới đây không chặn PASS.

### [MINOR-A] `aria-invalid` trên `<button>` không thuộc thuộc tính được hỗ trợ cho role button (ARIA 1.2)
- `src/components/careers/CvPicker.tsx:105`. AT có thể bỏ qua trạng thái "invalid", nhưng lỗi vẫn được đọc qua `aria-describedby`. Cách đặt này chủ yếu phục vụ mốc focus của `usePublicForm`.
- Đề xuất (task sau, nếu muốn chuẩn hơn): cho hook nhận mốc focus riêng, ví dụ `[aria-invalid="true"], [data-invalid-focus]`. Hoặc giữ nguyên và chấp nhận, vì không gây hại.

### [MINOR-B] Lỗi/helper bị lộ 2 lần khi duyệt bằng virtual cursor
- `CvPicker.tsx:105-106` và `:122-123`: cả nút và input sr-only đều có `aria-invalid` và cùng `aria-describedby`. Trong browse mode, trình đọc màn hình đọc helper/lỗi ở nút, ở input, rồi ở chính các đoạn `<p>`.
- Đề xuất: bỏ `aria-describedby` trên input (giữ label để `getByLabelText` và `required` vẫn chạy). Cũng có thể cân nhắc bỏ `aria-invalid` trên input sau khi chuyển các test `getByLabelText(/CV/)…aria-invalid` sang kiểm trên nút.

### [MINOR-C] Tên truy cập của nút chỉ là "Chọn tệp", không có ngữ cảnh "CV"
- `CvPicker.tsx:99-110`. Khi focus lỗi rơi vào nút, trình đọc màn hình chỉ đọc "Chọn tệp, nút". Ngữ cảnh chỉ đến từ câu lỗi trong description.
- Đề xuất: thêm `id` cho label và đặt `aria-labelledby={`${labelId} ${buttonTextId}`}` trên nút, để đọc thành "CV, Chọn tệp".

### [MINOR-D] Thiếu test focus cho lỗi CV đến từ server (413/415/400 `details.cv`)
- `ApplyForm.test.tsx:381`, `:392` chỉ assert `aria-invalid` trên input. Đọc code thấy đường focus giống hệt lỗi client (`failWith` → `focusRequest` → effect sau render idle), nên rủi ro thấp.
- Đề xuất: thêm `await waitFor(() => expect(chooseFile).toHaveFocus())` vào 1 case 413.

## Surgical diff
Các thay đổi round 2 chỉ nằm trong 3 file được nêu và mọi dòng đều trace về các finding của round 1. Không có refactor ngoài lề. Comment mới nêu lý do (WHY).

## Residual risk
- Chưa xem trên trình duyệt ở 375/768/1280: outline lỗi khi focus bằng code, highlight `data-dragging` ≥ md, độ tương phản dải tô 15% trên nút disabled.
- Chưa kiểm với screen reader thật: cách đọc `aria-invalid` trên button (MINOR-A), việc đọc lặp ở browse mode (MINOR-B), và progressbar ngoài nút không có live region (người dùng phải tự điều hướng tới mới nghe được %). Acceptance cho phép dùng progressbar, nên đạt.
- Test endpoint `job-applications` fail sẵn (phụ thuộc ngày) vẫn còn, ngoài phạm vi.

## Verdict: ✅ PASS
Hai MAJOR và ba MINOR của round 1 đã đóng đúng, có test đi kèm. Không có regression mức MAJOR. Lint, typecheck và build PASS. Test chỉ còn 1 fail đã có từ trước và ngoài phạm vi. Các MINOR-A..D có thể xử lý ở task sau hoặc để nguyên.
