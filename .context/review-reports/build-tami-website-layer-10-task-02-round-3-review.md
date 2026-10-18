Agent: reviewer

# Review: build tami-website · layer-10-task-02 · round 3

- Task: `tasks/tami-website/layer-10-task-02.md` (admin dịch: Dịch lại bằng AI, lọc trạng thái dịch, duyệt bản EN trang pháp lý, banner lỗi dịch, follow-up L9-T07)
- Code: worktree `D:/prj/bds-wt10-t02` (branch `wt/l10-t02`, base `ef39df4`, chưa commit). Chỉ review diff của worktree; bỏ qua `src/payload-types.ts` (chỉ EOL).
- Builder attempt 3: endpoint `POST /api/admin/translations/pages/:id/approve`, hook `guardEnglishApproval` (beforeChange), `hasEnglish` của pages readOnly lại.
- **Review level: STRICT**
- **Reason:** luồng duyệt pháp lý BR-08 (quyền + audit fail-closed), 2 endpoint admin mới (authz/BOLA, rate limit), hook chặn ghi trên `pages` áp cho mọi đường ghi (form/REST/Local API), shared `withContentDefaults`/`translationGroup`/`queueTranslation`, job ghi DB có `SELECT … FOR UPDATE`.

## Blast radius

- `pages`: hook mới `guardEnglishApproval` (beforeChange, chặn mọi lần bật `hasEnglish` không có cờ `req.context.approveEnglish`), `approveEnglish` (afterChange, audit + `done`), endpoint duyệt, nút `ApproveEnglishButton`; public `/en/<trang pháp lý>`, hreflang, sitemap, footer EN trỏ trang pháp lý.
- Mọi collection dịch + 4 global: `saveEnglish` (ghi rồi bật theo `missingEnglishFields`), `lockRow`, `custom.englishRequiredFields`, `beforeList` filter, nút Dịch lại, banner dashboard.
- API: `POST /api/admin/translations/:collection/:id`, `POST /api/admin/translations/pages/:id/approve`; rate limit key `admin-retranslate`.
- Script seed: `scripts/seed-pages.ts` → `seed/pages` tạo trang nháp, không đặt `hasEnglish` (không bị guard ảnh hưởng). Không có migration/script nào khác ghi `hasEnglish` (Grep `scripts/**`, `src/migrations/**`).
- Docs: `docs/API_SPEC.md` §5.1, §5.2 (mới), `docs/ARCHITECTURE.md` (bảng job).

## Verify commands + result (chạy trong `D:/prj/bds-wt10-t02`)

| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | 215/216 file PASS, **2283/2283 test PASS**, không có test skipped (integration chạy với DB). File fail duy nhất `src/lib/contrast.test.ts` (0 test, lỗi môi trường CRLF đã biết) |
| `pnpm build` | PASS (exit 0) |

## Finding round 2: đã đóng chưa

| Round 2 | Trạng thái | Bằng chứng |
|---|---|---|
| MAJOR-A (form cũ `hasEnglish=true` tự duyệt bản AI) | **Đóng** | `src/hooks/pages/approve-english.ts:16-20` giữ `originalDoc.hasEnglish` khi `data.hasEnglish === true`, giá trị đang lưu khác true, không có cờ `approveEnglish`. Cờ chỉ đặt trong Local API của endpoint (`src/endpoints/admin/approve-english.ts:30-39`). REST không đặt được `req.context`: `node_modules/payload/dist/utilities/createPayloadRequest.js:55` khởi tạo `context: {}`; handler REST update không nhận context từ body/query. Test: `tests/integration/retranslate.test.ts:328-347` (Local API form + REST PATCH → vẫn false, không audit), `:349-372` (đã duyệt → job hạ → form cũ lưu `hasEnglish: true` → vẫn false → duyệt bằng lệnh → true + audit lần 2), `services-pages.test.ts:353-354` |
| MINOR-B (UI không báo dịch tắt khi 409/503) | Đóng | `src/lib/translation/admin-ui.ts:65-66` |
| MINOR-C (chỉ làm mới /en) | Đóng | `src/jobs/translate-content.ts:274-277` trả cả `/en` và `/vi`; test `retranslate.test.ts:358` |
| MINOR-D (thiếu test trang đã duyệt + sửa VI) | Đóng | `retranslate.test.ts:374-382` |
| MINOR-E (diff ngoài phạm vi API_SPEC) | Đóng | `git diff docs/API_SPEC.md` chỉ còn dòng thêm (§5.1 as-built, §5.2) |

## Kiểm theo checklist được giao

| Điểm | Kết quả | Bằng chứng |
|---|---|---|
| Form/REST/Local API không bật được `hasEnglish` pages ngoài endpoint | OK | như MAJOR-A ở trên; create cũng bị ép về false (`originalDoc` undefined → `?? false`) |
| Client không đặt được `req.context` qua REST | OK | `createPayloadRequest.js:55` (`context: {}`); `createLocalReq.js:5-18` chỉ merge context từ Local API |
| Endpoint: authz chỉ admin | OK | `approve-english.ts` (endpoint) `:22-23` 401 → 403 trước khi đọc DB (không dò được id); update dùng `user: req.user, overrideAccess: false` nên vẫn qua access collection + field (`hasEnglish.update = isAdmin`), không bypass |
| Endpoint: id validation | OK | `:24` UUID regex → 400; `findByID` không `trash` → trang xoá mềm 404 |
| Endpoint: audit fail-closed | OK (code), **chưa có test** (MINOR-F) | update dùng `req` của request → `initTransaction`; `writeAuditLog` (`src/lib/audit/write-audit-log.ts:36-52`) ném lỗi trong afterChange → Payload `killTransaction` → `hasEnglish` rollback, endpoint 500 |
| Guard không chặn seed/migration hợp lệ | OK | `scripts/seed-pages.ts` → `seedLegalPages` tạo trang nháp, không đặt `hasEnglish`; không có migration/script khác ghi field này |
| Guard không ảnh hưởng collection khác | OK | hook chỉ gắn trong `src/collections/Pages.ts:33`; test news vẫn tự bật (`retranslate.test.ts:384-389`) |
| Job dịch không bị guard chặn | OK | job chỉ ghi `hasEnglish: false` cho pages (`translate-content-save.ts:194`); guard bỏ qua mọi giá trị khác true |
| Docs khớp code | OK, thiếu 1 mã lỗi (MINOR-G) | API_SPEC §5.2 thứ tự 401 → 403 → 400 → 404 → 409 → 200 khớp `handleApproveEnglish`; ARCHITECTURE mô tả guard + endpoint khớp |

## Responsive Checklist Gate (diff có UI admin: 4 component Payload admin, không có CSS/route public mới)

Không có browser; xác minh bằng đọc style inline. Round 3 chỉ đổi hành vi gọi API của `ApproveEnglishButton`, không đổi layout.

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | `ApproveEnglishButton.tsx` khối `flex column`, nút `alignSelf: flex-start`, không width cố định; filter `flex-wrap`, `minWidth: 220` < 375 |
| Mobile-first / grid auto-fit / container không fixed px | N/A | không có grid/media query mới; layout do Payload admin |
| Font `rem` / heading `clamp` | N/A | không đặt font-size, dùng class theme Payload |
| Media | N/A | không có |
| Touch target ≥ 44px | OK | `minHeight: 44` ở `ApproveEnglishButton.tsx` (nút), `RetranslateButton.tsx`, `TranslationStatusFilter` |
| Nav/table mobile | N/A | không đổi |
| 100vh / reduced-motion / overflow:hidden | N/A | không dùng |

## Skill gates

- `aislop`: skip, không nằm trong verify command được allow của reviewer.
- `oxlint` (anti-slop): skip, oxlint not configured (repo dùng ESLint, `pnpm lint` PASS).
- `ocr`: skip, ocr not installed / không trong allowlist.
- AI-readable: OK. Hàm ngắn (`handleApproveEnglish` ~20 dòng, `guardEnglishApproval` 4 dòng), tên rõ, comment nêu lý do. Còn vài dòng rất dài (`Pages.ts:56`, `content-defaults.ts:146`). Dưới 3 indicator.
- ai-friendly-web: N/A (admin nội bộ).
- blitzstrike: skip, không có môi trường pentest được phép; authz đánh giá bằng code + integration test (`retranslate.test.ts:318-326`).

## Findings

### [MAJOR-H] Trang pháp lý có bản EN viết tay (hoặc khi dịch AI tắt) không có đường nào để bật `hasEnglish`: AC1 chỉ đạt một phần
- `src/endpoints/admin/approve-english.ts:28-30` trả 409 nếu `translation.status !== "pending_review"`. Nút chỉ hiện khi `status === "pending_review"` (`src/components/admin/ApproveEnglishButton.tsx:21`). Guard mới (`src/hooks/pages/approve-english.ts:16-20`) chặn thêm cả REST/Local API, nên đường bật bằng REST của admin trước task này cũng mất.
- `status` chỉ thành `pending_review` khi job AI ghi bản dịch. Sửa tay bản EN (`src/hooks/translation/detect-manual-en.ts:58-61`) chỉ đổi `enSource = manual`, không đổi `status` (mặc định `none`). Hệ quả:
  1. `site-settings.translationEnabled = false`, hoặc hạn mức tháng = 0 (staging, theo ARCHITECTURE: job bỏ qua êm): trang pháp lý **không bao giờ** có `/en`. "Dịch lại bằng AI" trả 409, nên cũng không vòng qua được.
  2. Admin dán bản EN do luật sư duyệt (Q5 trong BRD đang chờ, đúng kịch bản này): `enSource = manual`, `status = none` → 409, không xuất bản được. Cách vòng duy nhất là bấm AI dịch đè lên bản luật sư, duyệt, rồi dán lại.
- AC1 ghi "Admin bật được `pages.hasEnglish` trong UI … chỉ qua nút Duyệt bản EN" không kèm điều kiện "chỉ sau khi AI dịch". BR-07 cho phép bật khi "nhân viên sửa tay đủ trường bắt buộc". BR-08 (pháp lý) chỉ yêu cầu admin duyệt. Admin tự viết rồi bấm duyệt vẫn thoả BR-08.
- Test không có case trang pháp lý không qua AI (`retranslate.test.ts:276-281` luôn đặt sẵn `pending_review`).
- Fix đề xuất: endpoint nhận cả bản EN chưa bật, không chỉ `pending_review`. Cụ thể: 409 chỉ khi `hasEnglish === true`; đủ trường EN thì để hook `requireEnglishFields` kiểm (xem MINOR-G về mã lỗi). Nút hiện khi `hasEnglish !== true` và admin. `approveEnglish` đã xử lý đúng: chỉ chuyển `done` khi đang `pending_review`, audit luôn ghi. Thêm integration test: trang `status = none`, `enSource = manual`, EN đủ → duyệt 200 + audit. Thêm test EN thiếu nội dung → lỗi 4xx, không audit. Nếu user muốn giữ hạn chế "chỉ duyệt bản AI" thì cần ghi quyết định đó vào task/AC và nêu đường xuất bản EN pháp lý khi tắt dịch.

### [MINOR-F] Thiếu test audit fail-closed cho endpoint duyệt
- Code đúng (audit trong cùng transaction, lỗi → rollback, 500) nhưng chưa có test, khác với retranslate (`retranslate.test.ts:236`). Đề xuất: cho `audit-logs` lỗi (như cách test retranslate làm), gọi duyệt → 500, `hasEnglish` vẫn false, `status` vẫn `pending_review`. Nên thêm 1 case trang đã xoá mềm → 404.

### [MINOR-G] Bản EN thiếu trường bắt buộc: endpoint trả 500, API_SPEC §5.2 không ghi; nút báo một câu chung cho mọi lỗi
- `requireEnglishFields` ném `ValidationError` trong `update` → bị `catch` chung → `fail(500)` (`approve-english.ts` endpoint `:44-49`). Lỗi do dữ liệu của người dùng mà trả 500 (và ghi log error) là sai mã. Đề xuất: bắt `ValidationError` → 400/422, ghi vào §5.2.
- `ApproveEnglishButton.tsx:7,28-30`: 403/404/409/500 đều hiện "Kiểm tra bản EN đã đủ tiêu đề và nội dung". Đề xuất map theo mã giống `retranslateMessage` (409 → "Bản EN không ở trạng thái chờ duyệt / đã duyệt, tải lại trang").

### [MINOR-I] Duyệt không gắn với phiên bản bản dịch admin đã xem
- Endpoint duyệt bản `pending_review` hiện có trong DB lúc bấm, không phải bản admin đã mở xem. Nếu một admin khác bấm "Dịch lại" hoặc sửa VI trong lúc form đang mở, lần duyệt sẽ duyệt bản AI mới mà admin chưa đọc. Khả năng thấp vì pages chỉ admin sửa. Đề xuất (tuỳ chọn): gửi kèm `translation.translatedAt` trong form, endpoint so khớp, khác → 409.

### [MINOR-5 round 1] Banner chỉ ở dashboard, 13 request mỗi lần mở: còn tồn, đã chấp nhận.

## Residual risk

- Dữ liệu cũ `hasEnglish = true` + `pending_review` (nếu L9-T07 đã tạo trên staging): nút hiện, endpoint trả 409 (`hasEnglish` đã true), field readOnly nên admin không gỡ được; nút hiện mãi kèm câu báo lỗi sai lý do. Khả năng thấp vì staging đặt hạn mức = 0. Nếu sửa MAJOR-H theo hướng đề xuất thì nên thêm nhánh: `hasEnglish === true` + `pending_review` → chỉ chuyển `done` + audit; hoặc một lệnh dọn dữ liệu một lần.
- Sau khi duyệt, nút gọi `router.refresh()`. Form Payload thay state khi `initialState` đổi (`@payloadcms/ui/dist/forms/Form/index.js:641-653`). Nếu form KHÔNG nạp lại (chưa kiểm bằng browser) thì form còn `hasEnglish = false` cũ, lần Lưu sau sẽ hạ trang đã duyệt về false: guard cho phép true → false. Hướng lỗi này là ẩn (an toàn với BR-08), không phải lộ. Đề xuất builder kiểm tay một lần.
- Cờ `approveEnglish` được merge vào `req.context` của request duyệt và vẫn nằm trên `req` sau đó (`createLocalReq` merge). Hiện endpoint không ghi gì thêm nên không bị lợi dụng. Cần lưu ý nếu sau này thêm thao tác ghi `pages` khác dùng cùng `req`.
- `lockRow` giữ như round 1/2 (thứ tự khoá giả định lần lưu admin khoá dòng chính trước).
- UI responsive chỉ xác minh bằng đọc style; không chạy app.

## Verdict

**FAIL**. MAJOR-A round 2 đã đóng thật: guard chặn mọi đường ghi, REST không đặt được context, có test form/REST. MINOR-B..E đã đóng. Verify PASS. Tuy vậy, cách đóng MAJOR-A lại tạo ra MAJOR-H: chỉ bản AI `pending_review` mới duyệt được, nên trang pháp lý viết tay hoặc lúc tắt dịch không bao giờ có `/en`, và AC1 chỉ đạt một phần. Nếu user chủ động chọn giữ hạn chế này thì cần ghi quyết định vào task/AC. Khi đó MAJOR-H hạ xuống thành ghi nhận, các MINOR-F/G nên sửa cùng vòng.
