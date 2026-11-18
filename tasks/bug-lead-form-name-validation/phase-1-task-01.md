# bug-lead-form-name-validation · phase-1-task-01 — Form tư vấn nhận họ tên có ký tự đặc biệt hoặc toàn số (BL-123, QA 38 + 39)

- Change doc: `spec/changes/2026-11-17-lead-form-name-validation.md` (BACKLOG BL-123).
- Phụ thuộc: không.
- Trạng thái: `done` — STRICT PASS round 1 (`.context/review-reports/bug-lead-form-name-validation-phase-1-task-01-round-1-review.md`); 4 MINOR không chặn (dấu kết hợp đứng đầu/chồng nhiều vẫn qua; câu lỗi lặp 3 nơi; `.min(2)` thừa; gạch nối Unicode khác/ZWJ bị chặn theo luật). Chưa commit (user: "chưa commit").

## Classification / Risk
- Type: **BUG** (QA 38 + 39, cùng root cause → 1 task; thứ tự user duyệt 2026-11-17).
- Severity: low (dữ liệu lead bẩn, không mất dữ liệu).
- Risk: **MEDIUM** — đổi schema validate của 2 API công khai (`POST /api/public/leads`, `POST /api/public/job-applications`) + form dùng chung (LeadForm ở tin cho thuê / tin BĐS / dự án / liên hệ / tin tức / popup; ApplyForm). Không đổi DB/schema collection, không migration.
- Expected review level: **STRICT** (API contract/DTO validate dùng chung nhiều client, shared component).
- Doc impact dự kiến: `docs/API_SPEC.md` §3.1 (`fullName`) + §3.2 (`fullName`); SPECIFICATIONS (change-request ghi, as-built rule); spec-publisher bump.

## Luật họ tên (user chốt 2026-11-18 — không hỏi lại)
- Chuẩn hoá trước khi kiểm: `trim` + gộp mọi chuỗi khoảng trắng liên tiếp thành 1 dấu cách. Giá trị lưu/ gửi đi là bản đã chuẩn hoá (server).
- Chỉ cho phép: chữ cái mọi ngôn ngữ (`\p{L}`, kèm dấu kết hợp `\p{M}` để tiếng Việt dạng NFD vẫn qua), khoảng trắng, `'`, `-`, `.`.
  - Diễn giải được ghi rõ: chấp nhận thêm `’` (U+2019) như biến thể của `'` — bàn phím iOS tự đổi `'` thành `’` ("O’Brien"); không có thì tên hợp lệ bị chặn trên iPhone. Change-request báo user điểm này.
- Cấm: chữ số (mọi hệ số `\p{N}`), mọi ký tự khác (`@ # $ % & * ( ) _ + = , ; : ! ? / \ " < > [ ] { } | ~ ^` emoji, v.v.).
- Tối thiểu **2 ký tự chữ** (đếm `\p{L}`, không đếm dấu câu/khoảng trắng) → "A." / "-'" bị chặn, "An" qua.
- Độ dài tối đa giữ nguyên: lead 100, ứng tuyển 120 (tính trên bản đã chuẩn hoá).

## Root cause (đã chứng minh)
- Server: `src/shared/types/api.ts:81` `leadInputSchema.fullName = z.string().trim().min(2).max(100)` — chỉ kiểm độ dài, không kiểm bộ ký tự → "Nguyễn @An#" (11 ký tự) và "090777123" (9 ký tự) đều hợp lệ, `handleLead` (`src/endpoints/public/leads.ts:110`) tạo lead.
- Client: `src/components/leads/LeadForm.tsx:98` chỉ chặn `fullName.length < 2` → form gửi đi bình thường.
- Cùng lỗi ở form ứng tuyển: `src/shared/types/api.ts:35` (`jobApplicationFieldsSchema.fullName` `.trim().min(2).max(120)`) và `src/components/careers/ApplyForm.tsx:55` (`length < 2`) — cùng trường họ tên, cùng luật hợp lý → áp chung (acceptance change doc dòng 22).
- Server trả lỗi field chung chung: `src/endpoints/public/job-application-messages.ts:42` `fieldMessage` → "Giá trị không hợp lệ" cho mọi field ngoài consent.

## Thiết kế fix
1. **Một nguồn luật duy nhất** — module mới dùng được ở cả client và server (không import gì server-only), vd `src/lib/person-name.ts`:
   - `normalizePersonName(raw: string): string` (trim + gộp khoảng trắng).
   - `isValidPersonName(raw: string): boolean` (chuẩn hoá rồi kiểm regex bộ ký tự + ≥ 2 chữ cái).
   - `personNameSchema(max: number)` (zod): chuẩn hoá → min/max → refine `isValidPersonName`; output = bản chuẩn hoá. Đặt ở chỗ hợp lý (cùng module hoặc `src/shared/types/api.ts`), miễn client và server gọi chung một hàm luật.
2. `leadInputSchema.fullName = personNameSchema(100)`; `jobApplicationFieldsSchema.fullName = personNameSchema(120)`.
3. Client: `LeadForm.tsx` và `ApplyForm.tsx` validate bằng `isValidPersonName` (không tự viết regex riêng). Lỗi hiện dưới ô họ tên (`FormField error`, cơ chế hiện có), không gửi request.
4. i18n: đổi chuỗi `errors.fullName` hiện có của form lead (`vi.json`/`en.json` ~dòng 145) và form ứng tuyển (~dòng 873) thành câu nêu luật, vd
   - VI: "Họ tên chỉ gồm chữ cái, khoảng trắng và các dấu ' - . (ít nhất 2 chữ cái)."
   - EN: "Name may contain only letters, spaces and ' - . (at least 2 letters)."
   (Builder chỉnh câu cho tự nhiên; giữ 2 khoá như cũ, không tạo khoá thừa.)
5. Server: `fieldMessage(locale, "fullName")` trả câu cụ thể theo locale (cùng nội dung bước 4) thay "Giá trị không hợp lệ" — lỗi từ API vẫn map vào ô họ tên (`usePublicForm` đã map `details[].field`). Gọi thẳng API với tên sai → 400, không tạo lead/hồ sơ.

## Files
- Mới: `src/lib/person-name.ts` (+ `src/lib/person-name.test.ts`).
- Sửa: `src/shared/types/api.ts`, `src/components/leads/LeadForm.tsx`, `src/components/leads/LeadForm.test.tsx`, `src/components/careers/ApplyForm.tsx`, `src/components/careers/ApplyForm.test.tsx`, `src/endpoints/public/job-application-messages.ts`, `src/endpoints/public/leads.test.ts`, test endpoint ứng tuyển (nếu có file test tương ứng), `src/i18n/messages/vi.json`, `src/i18n/messages/en.json`, `docs/API_SPEC.md` (§3.1/§3.2 dòng `fullName`).
- ⚠ Working tree đang bẩn bởi BL-119/121/122 chưa commit (gồm `vi.json`, `en.json`, `progress.json`, SPECIFICATIONS, CHANGELOG, test-scope, docs/*). Chỉ sửa đúng đoạn BL-123; **không** revert/format lại phần khác; không `git checkout`/`stash`/`reset`. Baseline: `.context/runs/.bl123-baseline-status.txt`.
- KHÔNG đụng: `.context/runs/*`, `progress.json`, `SPECIFICATIONS.md`, `spec/**` (change-request/spec-publisher lo), collection `leads`/`job-applications` (admin nhập tay không thuộc scope).

## Acceptance
- [x] "Nguyễn @An#" và "090777123" bị chặn ở client (lỗi dưới ô họ tên, không gọi fetch) và ở API (400, `details` có `field: "fullName"`, không tạo lead) — VI + EN.
- [x] "Nguyễn Văn A", "O'Brien", "Anne-Marie", "Lê Thị Ngọc Ánh" qua (client + API); thêm "J. R. Smith", tên dạng NFD có dấu, "  Nguyễn   Văn  A  " lưu thành "Nguyễn Văn A".
- [x] Bị chặn thêm: "A", "A.", "Nguyễn 2", "An_", emoji.
- [x] ApplyForm + `POST /api/public/job-applications` cùng luật (test client + server).
- [x] Lỗi tiếng Việt / tiếng Anh theo locale.
- [x] Test hồi quy FAIL trước fix / PASS sau fix (ghi lại).
- [x] `pnpm typecheck`, `pnpm lint` (hoặc eslint file đổi), `pnpm vitest run` phạm vi `src/lib/person-name* src/components/leads src/components/careers src/endpoints/public src/shared src/i18n` PASS.
- [x] Ảnh lỗi dưới ô trên dev local (`pnpm dev`, form `/lien-he`, 1 ảnh "Nguyễn @An#" + 1 ảnh "090777123") → `.context/review-reports/assets/bl123-*.png`. Không chạy được dev/DB → ghi `Residual risk`, không chặn task.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Repro Verification
- Original repro: `/lien-he` (1920), họ tên "Nguyễn @An#" / "090777123" + SĐT hợp lệ + đồng ý → Gửi → được chấp nhận.
- Expected: lỗi dưới ô họ tên, không gửi; API gọi thẳng trả 400.
- Actual before fix: test hồi quy chạy trước khi nối luật vào schema/form: 17 test FAIL (leads.test.ts, job-applications.test.ts: API trả 200 cho "Nguyễn @An#" / "090777123" và lưu tên chưa chuẩn hoá "Nguyễn   Văn  A"; LeadForm.test.tsx + ApplyForm.test.tsx: form vẫn gọi API, không có lỗi dưới ô họ tên). `person-name.test.ts` đã PASS vì module luật đã tạo trước bước nối.
- Actual after fix: `pnpm vitest run src/lib/person-name src/components/leads src/components/careers src/endpoints/public src/shared src/i18n` = 20 files / 300 tests PASS; `pnpm typecheck` PASS; eslint các file đổi sạch. Dev local `/lien-he` (DOM): "Nguyễn @An#" và "090777123" -> ô họ tên aria-invalid=true + lỗi "Họ tên chỉ gồm chữ cái, khoảng trắng và các dấu ' - . (ít nhất 2 chữ cái)."; không gửi request.
- Evidence: lệnh trên; ảnh dev local 1920 (change-request chụp bằng Playwright + Edge): `.context/review-reports/assets/bl123-p1t01-vi-special-1920.png`, `bl123-p1t01-vi-digits-1920.png`, `bl123-p1t01-en-special-1920.png` — ô họ tên `aria-invalid=true`, câu lỗi đúng locale, 0 request `POST /api/public/leads`.
- Status: PASS

## Residual risk
- Ảnh đã bổ sung sau review (xem Evidence).
- Client chỉ trim (collectFields), không gộp khoảng trắng giữa tên; server mới gộp khi lưu. Khớp luật (server là nguồn chuẩn hoá).
- Dấu `’` (U+2019) được chấp nhận ngoài `'` (iOS).
- Chuỗi lỗi luật họ tên ở server nằm trong `PERSON_NAME_RULE_MESSAGE` (`src/lib/person-name.ts`) và lặp lại ở i18n JSON (2 form) — 3 nơi cùng 1 nội dung; cố ý (server không dùng next-intl).

## Doc impact
- `docs/API_SPEC.md` §3.1/§3.2 `fullName` (builder). SPECIFICATIONS + spec publish: change-request / spec-publisher.
