Agent: reviewer

# Review — build/tami-website · layer-9-task-07 · round 1

- Review level: **STRICT**
- Reason: nội dung được gửi ra ngoài tới Claude API; hook `afterChange`/`beforeChange` trên mọi collection nội dung (factory `withContentDefaults`) và 4 global dùng chung; chi phí/hạn mức; migration enum; job nền.
- Blast radius: `src/collections/_shared/content-defaults.ts` (mọi collection nội dung), `src/globals/{Header,Footer,Homepage,SiteSettings}.ts`, `src/fields/translation.ts` (beforeDuplicate), `src/jobs/translate-content.ts` + `src/jobs/index.ts`, `src/hooks/translation/*`, `src/lib/translation/{leaves,segments,job-input}.ts`, template email mới, migration `20261018_140000_translate_content` + `migrations/index.ts`, bảng `payload_jobs`/`payload_jobs_log` (enum), docs ARCHITECTURE §5.4 / ERD §1.1.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS — 213 file, 2275 test |
| `pnpm build` | PASS (exit 0) |

## Responsive Checklist Gate
N/A — diff không đụng UI (chỉ hook/job/collection config/email template).

## Skill gates
- aislop: skip, `aislop` chưa cài.
- oxlint (anti-slop): skip, oxlint not configured (eslint PASS).
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK — 1 indicator (`src/jobs/translate-content.ts` 308 dòng > 300); tên rõ ràng, hàm ≤ 50 dòng, comment nêu WHY, ARCHITECTURE §5.4/ERD đã cập nhật.
- ai-friendly-web: N/A (không phải thay đổi public web).
- blitzstrike: skip, chưa cài / không có môi trường được phép.

## Kiểm tra đặc biệt (tóm tắt)
- Allowlist PII: OK. `TRANSLATABLE_FIELDS` là allowlist theo field cấp cao nhất (`src/lib/translation/leaves.ts:13-27`); chỉ lấy text/textarea/richText localized; loại bỏ slug/scopeSlug/searchText/canonical; `leads`/`job-applications`/`staff`/`media` không nằm trong allowlist, job trả `not_allowed` (`translate-content.ts:237-241`, có integration test). Input job chỉ có định danh. Log chỉ có mã/slug/id, không có API key hay nội dung.
- Prompt injection / XSS: OK. Model chỉ trả text theo id segment; bản dịch được ghi vào đúng leaf path (không model nào chọn được field). `HTML_TAG_PATTERN = /<[a-z/!?]/i` vẫn chặn mọi chỗ mở thẻ/`</`/`<!--` mà nguồn không có; URL mới và `](` vẫn bị chặn. Text render qua React/Lexical text node nên đã được escape → cách nới này không mở lỗ XSS.
- Vòng lặp: OK (cờ context `translationJob` + bỏ qua `req.locale === "en"`).
- Debounce: OK — query JSON `input.kind/slug/docId` loại job đang processing/hasError/completed; bảng `payload-jobs` nhỏ (`deleteJobOnComplete`), không cần index. Có integration test trên Postgres.
- Migration: OK — additive `ADD VALUE IF NOT EXISTS`, chạy sau `130000_data_retention`, đã đăng ký trong index, down xoá các dòng của task rồi dựng lại enum, có test up→down→down→up.
- Budget: OK — budget `<= 0` thì bỏ qua êm trước khi đọc bản ghi/gọi API; budget > 0 mà bị vượt thì `failed` + email.
- Manual EN: OK — chỉ `force` mới dịch đè (có test). Slug: giữ slug EN đã có (có test: URL ổn định).
- `pages` → `pending_review`, không bật `hasEnglish`: OK (có test).

## Findings

### [MAJOR-1] Lost update: job ghi lại toàn bộ field cấp cao nhất từ bản `en` đọc TRƯỚC khi gọi API, ghi đè thay đổi song song (row array, link, ảnh không localized)
- `src/jobs/translate-content.ts:139` đọc `english` trước `service.translate` (dòng 144, có thể chạy nhiều lô, mất hàng chục giây). Sau đó `src/lib/translation/leaves.ts:200-203` (`buildEnglishWrite`) clone NGUYÊN `englishDoc[top]` (vd `columns` của footer, `navItems` của header, `hero`/`partners` của homepage, `amenities`/`floorPlans` của projects, group `seo`). Rồi `saveEnglish` (`translate-content.ts:106-124`) ghi lại các giá trị cũ đó.
- Array/group ở các field này KHÔNG localized (chỉ field con localized, vd `Footer.ts:21-27`, `Projects.ts:72-83`), nên cấu trúc row và các field con không localized (link `navLinkField`, icon, upload ảnh) dùng chung cho cả 2 locale. Nếu admin lưu trong lúc job đang chạy (job đang processing nên lần lưu đó xếp job mới, không chặn job cũ), lần ghi của job sẽ xoá row vừa thêm / khôi phục row vừa xoá / trả link hoặc ảnh về giá trị cũ một cách im lặng. Job sau chỉ dịch lại phần chữ, còn thay đổi không phải chữ thì mất hẳn. Đây là mất dữ liệu trên global dùng chung (header/footer/homepage).
- Cách sửa đề xuất: ngay trước khi ghi, đọc lại bản ghi (vi `updatedAt`, hoặc version) và so với giá trị đã đọc lúc job bắt đầu; nếu đã đổi thì bỏ lần ghi này (`row_changed`, job mới đã được xếp sẽ dịch lại). Hoặc đọc lại bản `en` ngay trước `update` và dựng `buildEnglishWrite` trên bản mới đó (khoảng hở còn vài ms), tốt nhất là đặt trong transaction có khoá dòng. Thêm integration test: sửa thứ tự row / link không localized giữa lúc gọi API (client giả có hook) rồi assert thay đổi đó vẫn còn sau khi job ghi.

### [MINOR-1] Email "vượt hạn mức" gửi 1 lần cho mỗi bản ghi chứ không phải 1 lần mỗi tháng
- `src/jobs/translate-content.ts:219-226`: chỉ chống trùng theo trạng thái của từng bản ghi. Khi hết hạn mức tháng, N bài đã xuất bản được lưu sẽ gửi N email cho mọi admin. Đề xuất chống trùng theo `monthKey` (vd một dòng/cờ trong `translation-usage` hoặc khoá theo tháng).

### [MINOR-2] Nhánh `row_changed` đã trả tiền nhưng không ghi lại trạng thái nào
- `src/jobs/translate-content.ts:149-150`: API đã gọi xong và chi phí đã ghi, nhưng không cập nhật `translation.*` gì cả và cũng không log. Đề xuất ghi log ở mức warn (chỉ slug/id) và cân nhắc kiểm tra row có còn không TRƯỚC khi gọi API.

### [MINOR-3] Câu "lỗi hook dịch không bao giờ làm hỏng lần lưu" không đúng với lỗi ở mức câu lệnh DB trên Postgres
- `src/hooks/translation/enqueue-translation.ts:101-107` nuốt lỗi, nhưng các query chạy trong transaction của request (`req`). Trên Postgres, một câu lệnh lỗi sẽ làm hỏng (abort) cả transaction, nên các hook sau và lần commit vẫn lỗi. Docs ARCHITECTURE §5.4 khẳng định điều ngược lại. Đề xuất: sửa lại câu trong docs cho đúng, hoặc xếp job ngoài transaction / dùng savepoint.

### [MINOR-4] Nhận diện sửa tay EN có thể báo nhầm khi chuỗi rỗng được gửi lên
- `src/hooks/translation/detect-manual-en.ts:37-39`: nếu bản `en` gốc không có giá trị (null nên không thành leaf) mà form gửi `""`, hash sẽ khác, bản ghi bị coi là `manual` và từ đó không được tự dịch nữa. Đề xuất bỏ qua các cặp mà cả hai bên đều rỗng (`isFilled`). Ngược lại, xoá trắng một trường EN cũng không được nhận diện (chỉ duyệt các key của `after`).

### [MINOR-5] Kích thước file
- `src/jobs/translate-content.ts` có 308 dòng, vượt giới hạn 300. Đề xuất tách `recordFailure`/`notifyBudgetExceeded`/`adminEmails` ra module riêng.

### Ghi chú (không chặn)
- Task file (`## Migration`) vẫn ghi "không tạo migration", trong khi primary đã yêu cầu tạo → cập nhật task file lúc close-out.

## Residual risk
- Chưa kiểm được trên runner thật rằng `job.totalTried` có đúng ngữ nghĩa "số lần đã chạy" và `JobCancelledError` có thật sự ngăn retry trong phiên bản Payload đang dùng (test gọi trực tiếp `translateContent`; test runner ở dòng 481 chỉ đi đường budget 0).
- Chưa rà toàn bộ việc tách segment trong rich text (L4-T04, ngoài diff) xem URL của link node có bị gửi đi hay không.
- Grep tìm array/blocks localized chỉ dùng pattern gần đúng; không thấy trường hợp nào (với array localized, `walkRows` không truyền `inheritedLocalized` xuống con).

## Verdict
**FAIL** — còn 1 MAJOR (MAJOR-1: lost update / mất dữ liệu trên global dùng chung). Các MINOR nên sửa cùng vòng này.
