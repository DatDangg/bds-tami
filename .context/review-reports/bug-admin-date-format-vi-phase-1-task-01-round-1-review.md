Agent: reviewer

# Review — bug-admin-date-format-vi · phase-1-task-01 · round 1 (BL-076)

- **Review level:** STRICT
- **Reason:** config admin dùng chung cho mọi field `type: "date"` (~38 field sau khi trải translation group, 15 file sửa + 1 module mới), đụng BL-091 (Tin tức hẹn giờ) và custom Cell/Notice của Tuyển dụng.
- **Blast radius:** ô nhập ngày (form/cột phải), ô danh sách (DateCell ưu tiên `field.admin.date.displayFormat` hơn `config.admin.dateFormat`), picker giờ (`timeFormat`) ở mọi collection/global admin. Không đổi schema/DB/API (chỉ `admin.*`).

## Root cause — xác minh độc lập
- `@payloadcms/ui@3.91.0/dist/elements/DatePicker/DatePicker.js`: `dateFormat = customDisplayFormat`, thiếu thì hard-code `default→"MM/dd/yyyy"`, `dayAndTime→"MMM d, yyy h:mm a"`, `timeOnly→"h:mm a"`, `dayOnly→"MMM dd"`, `monthOnly→"MMMM"`; `timeFormat` mặc định `"h:mm aa"`. Khớp root cause trong task.
- `DateCell` (`elements/Table/DefaultCell/fields/Date/index.js`): `dateFormat = date?.displayFormat || config.admin.dateFormat` → sau fix ô danh sách dùng định dạng của field. Đúng như task mô tả.
- `onChange` chỉ set giờ 12:00 cho `dayOnly/default/monthOnly` và `setMilliseconds(0)` nếu format không có `SSS` → đổi displayFormat không đổi giá trị lưu (ISO).

## Coverage
- Grep `type: "date"` / `DateField` trong `src/`: mọi field đều đi qua `adminDate(...)` (Leads qua `dateTimeInAdmin`, PropertyPosts qua `dayOnly`).
- Test quét `ADMIN_COLLECTIONS` + `ADMIN_GLOBALS` liệt kê 38 field (verbose run), gồm `news.publishedAt`, `job-postings.deadline`, `rentals.rentedAt`, mọi `translation.translatedAt`, header/footer/homepage/site-settings.
- `pickerAppearance` giữ nguyên từng field: dayOnly→dayOnly, dayAndTime→dayAndTime; field trước không khai (`Staff.lastLoginAt`, `ClickEvents.aggregatedAt`, `JobApplications.anonymizedAt`, `translatedAt`) → `"default"` = mặc định Payload.
- BL-091: `publishedAtField({ scheduled: true })` chỉ đổi `date`, giữ `components: SCHEDULED_COMPONENTS`, access/hook không đổi; `published-at.test.ts` + `ScheduledPublishDisplay.test.tsx` PASS.
- JobPostings `deadline`: `components.Cell` / `afterInput` giữ nguyên.
- Schema: builder báo `generate:types` không diff; diff chỉ đụng `admin.date` (không phải cột DB) → hợp lý.

## Verify commands + result
- `pnpm exec vitest run src/fields/admin-date.test.ts src/fields/published-at.test.ts src/components/admin/ScheduledPublishDisplay.test.tsx` → 3 file, 57 test PASS.
- `pnpm lint` → exit 0.
- `pnpm typecheck` → exit 0.
- Full suite / e2e: không chạy (theo chỉ dẫn); dựa evidence change-request (e2e "07" 10 passed / 2 skipped / 0 failed; browser probe gõ "30/11/2026 09:15" parse đúng).

## Responsive Checklist Gate
N/A — chỉ đổi config định dạng ngày của Payload admin, không đổi layout/CSS/component.

## Skill gates
- aislop: skip, `aislop` không cài.
- oxlint (anti-slop): skip, oxlint not configured (không có `.oxlintrc.json`); `pnpm lint` (eslint) PASS.
- ocr: skip, ocr not installed.
- AI-readable: OK — module 30 dòng, tên rõ, comment nói WHY (Payload bỏ qua `admin.dateFormat`), không magic/indirection. 0 indicator.
- ai-friendly-web: N/A (admin nội bộ).
- blitzstrike: N/A (không đụng auth/input/API).

## Findings
- **[MINOR] Mất giờ ở ô danh sách cho timestamp dùng appearance `default`** — `src/collections/Staff.ts:177` (`lastLoginAt`), `src/collections/JobApplications.ts:111` (`anonymizedAt`). Trước fix, DateCell rơi về global `dd/MM/yyyy HH:mm` (có giờ); nay `displayFormat: "dd/MM/yyyy"` → cột "Đăng nhập gần nhất" (khi user bật cột) chỉ còn ngày. Form vẫn như trước (chỉ ngày). Không phải cột mặc định nên không chặn. Đề xuất (tuỳ chọn, task sau): dùng `adminDate("dayAndTime")` cho 2 field readOnly timestamp này (đồng bộ với `Leads.anonymizedAt`), hoặc chấp nhận và ghi vào task. Tương tự các field `dayOnly` ở danh sách nay bỏ giờ "12:00" vô nghĩa — đây là cải thiện.
- **[MINOR] Thứ tự import** — `src/collections/JobPostings.ts:2` và `src/collections/projects/market-blocks.ts:2` chèn `import { adminDate } from "../fields/admin-date"` giữa import `payload` và `payload/shared` (nhóm package) thay vì nhóm relative bên dưới (như `../fields/form-hints`, `../../fields/listing-field-helpers`). Lint không bắt; sửa cho đồng bộ style.
- **[MINOR] Test regex `/MMM|a/`** (`src/fields/admin-date.test.ts:55`) chặn mọi chữ `a` thường — đúng mục tiêu (token AM/PM), nhưng không chặn `h` (12h không AM/PM). Có thể thêm `expect(...).not.toMatch(/h/)` cho chặt. Không chặn.

Không có CRITICAL/MAJOR.

## Residual risk
- Gõ tay ngày ở field `dayOnly` theo `dd/MM/yyyy` chỉ được probe cho dayAndTime (publishedAt) — react-datepicker parse theo cùng `dateFormat`, rủi ro thấp.
- Field Payload tự thêm (`createdAt`, `updatedAt`, `deletedAt`) vẫn dùng global `VN_DATE_TIME_FORMAT` — không đổi.

## Verdict
✅ PASS (3 MINOR, không chặn — khuyến nghị sửa MINOR import ordering trước commit).
