Agent: reviewer

# Review: build tami-website · layer-10-task-02 · round 4

- Task: `tasks/tami-website/layer-10-task-02.md` (admin dịch: Dịch lại bằng AI, lọc trạng thái dịch, duyệt bản EN trang pháp lý, banner lỗi dịch)
- Code: worktree `D:/prj/bds-wt10-t02` (branch `wt/l10-t02`, base `ef39df4`, chưa commit). Chỉ review diff của worktree; bỏ qua `src/payload-types.ts` (chỉ EOL).
- Builder attempt 4 theo quyết định user: (1) trang pháp lý bị AI dịch lại → `hasEnglish=false` + `pending_review` tới khi admin duyệt; (2) admin duyệt được MỌI bản EN pháp lý khi `hasEnglish` còn tắt (bản AI hoặc nhập tay, cả khi dịch tắt), thiếu trường EN → 422.
- **Review level: STRICT**
- **Reason:** luồng duyệt pháp lý BR-08 (authz admin, audit fail-closed), endpoint admin mới, hook chặn ghi `pages` áp cho mọi đường ghi (form/REST/Local API), shared `withContentDefaults` / `translationGroup` / `queueTranslation` / `missingEnglishFields`, job dịch ghi DB có `SELECT … FOR UPDATE`.

## Blast radius

- `pages`: `guardEnglishApproval` (beforeChange), `approveEnglish` (afterChange: audit + status `done`), endpoint `POST /api/admin/translations/pages/:id/approve`, nút `ApproveEnglishButton`; public `/en/<trang pháp lý>`, hreflang, sitemap, footer EN.
- Mọi collection dịch + 4 global: `saveEnglish` (ghi rồi bật `hasEnglish` theo `missingEnglishFields`), `lockRow`, `custom.englishRequiredFields`, filter `beforeList`, nút Dịch lại, banner dashboard.
- API: `POST /api/admin/translations/:collection/:id` (không đổi so với round 3), `POST /api/admin/translations/pages/:id/approve` (đổi điều kiện 409, thêm 422).
- Docs: `docs/API_SPEC.md` §5.1, §5.2; `docs/ARCHITECTURE.md` (bảng job).

## Verify commands + result (chạy trong `D:/prj/bds-wt10-t02`)

| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | 215/216 file PASS, **2288/2288 test PASS** (round 3 có 2283, thêm 5 test duyệt EN). Integration chạy với DB, không có test skipped. File fail duy nhất là `src/lib/contrast.test.ts` (0 test, lỗi CRLF đã biết, đã sửa trên staging ở BL-004) |
| `pnpm build` | PASS (exit 0) |

## Finding round 3: đã đóng chưa

| Round 3 | Trạng thái | Bằng chứng |
|---|---|---|
| MAJOR-H (EN viết tay / dịch tắt không duyệt được) | **Đóng** | `src/endpoints/admin/approve-english.ts:29`: 409 chỉ khi `hasEnglish === true`, không còn điều kiện `pending_review`. Nút hiện khi admin + `hasEnglish !== true` (`ApproveEnglishButton.tsx:38`). `approveEnglish` chuyển `done` từ mọi status (`src/hooks/pages/approve-english.ts:40-52`). Test: `tests/integration/retranslate.test.ts:398-406` (status `none`, EN nhập tay → 200, audit, `done`), `:424-434` (`translationEnabled=false` → vẫn 200) |
| MINOR-F (thiếu test audit fail-closed + xoá mềm) | **Đóng** | `retranslate.test.ts:436-448` (đổi tên bảng `audit_logs` → 500, `hasEnglish` false, status vẫn `pending_review`, 0 audit); `:450-455` (xoá mềm → 404) |
| MINOR-G (thiếu EN → 500; thông báo UI chung chung) | **Đóng** | Endpoint kiểm trước `missingEnglishFields` → `422` kèm `details[{path}]` (`approve-english.ts:31-39`); test `:408-422` (thiếu `content` → `[content]`; trống hết → `[title, content]`; không đổi gì, 0 audit). UI map theo mã 422/409/401/403/404 (`ApproveEnglishButton.tsx:10-16`), 422 nêu tên trường. API_SPEC §5.2 có ghi 422 |

## Kiểm theo checklist được giao

| Điểm | Kết quả | Bằng chứng |
|---|---|---|
| MAJOR-A round 2 (form cũ `hasEnglish=true` tự duyệt) không tái phát | OK | `guardEnglishApproval` không đổi (`hooks/pages/approve-english.ts:16-20`). Cờ `approveEnglish` chỉ đặt ở `approve-english.ts:49` (endpoint). Test vẫn xanh: `retranslate.test.ts:328-347` (Local API + REST PATCH → false, 0 audit), `:349-372` (đã duyệt → AI dịch lại → hạ false → form cũ gửi true → vẫn false → duyệt bằng lệnh → audit lần 2). Nới điều kiện 409 không mở đường mới vì guard nằm ở beforeChange, độc lập với endpoint |
| Authz endpoint | OK | 401 (chưa đăng nhập/khoá) → 403 (không phải admin) trước mọi lần đọc DB (`:23-24`), nên không dò được id. Update dùng `user: req.user, overrideAccess: false` (`:45-47`), vẫn qua access trường `hasEnglish.update = isAdmin`. Đọc EN bằng `overrideAccess: true` chỉ sau khi đã qua 403 |
| Audit fail-closed | OK | Update dùng `req` của request → cùng transaction; `writeAuditLog` ném lỗi trong afterChange → rollback, 500. Có test (`:436-448`) |
| 422 | OK | như MINOR-G |
| 409 | OK | `:29`; test `:315` |
| Không hồi quy collection khác | OK | Hook chỉ gắn ở `src/collections/Pages.ts:33-34`; `saveEnglish` vẫn bật `hasEnglish` cho collection khác khi đủ trường (`translate-content-save.ts:198-205`); test news `retranslate.test.ts:457-462`; toàn bộ test suite xanh |
| Docs khớp code | OK, còn 1 comment cũ (MINOR-J) | API_SPEC §5.2 thứ tự 401 → 403 → 400 → 404 → 409 → 422 → 200 khớp `handleApproveEnglish`; nêu duyệt mọi bản EN, `done` kể cả từ `none`, AI dịch lại hạ `hasEnglish` + làm mới `/en` + `/vi`. ARCHITECTURE cập nhật tương ứng |
| AC task file khớp quyết định user | OK | AC1 (dòng 39): bật chỉ qua nút duyệt, giữ readOnly, guard. AC6 (dòng 44): duyệt khi `hasEnglish` tắt (AI `pending_review`, sửa tay/dán, kể cả khi dịch tắt) → true + audit + `done`; 422; 409; sale 403. Quyết định (1) (AI dịch lại → false + `pending_review`) có trong `translate-content-save.ts:192-194` + test `:349-382`, được mô tả ở API_SPEC/ARCHITECTURE, nhưng AC không ghi riêng (xem MINOR-K) |

## Responsive Checklist Gate (diff có UI admin: 4 component Payload admin, không có CSS/route public mới)

Không có browser; xác minh bằng đọc style inline. Round 4 chỉ đổi điều kiện hiện nút, chữ mô tả và thông báo lỗi của `ApproveEnglishButton`, không đổi layout.

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | `ApproveEnglishButton.tsx:58` khối `flex column`, nút `alignSelf: flex-start`, không width cố định; câu lỗi 422 dài nằm trong `<p>`, tự xuống dòng |
| Mobile-first / grid auto-fit / container không fixed px | N/A | không có grid/media query mới; layout do Payload admin |
| Font `rem` / heading `clamp` | N/A | không đặt font-size, dùng class theme Payload |
| Media | N/A | không có |
| Touch target ≥ 44px | OK | `minHeight: 44` (`ApproveEnglishButton.tsx:62`) |
| Nav/table mobile | N/A | không đổi |
| 100vh / reduced-motion / overflow:hidden | N/A | không dùng |
| A11y | OK | lỗi có `role="alert"`, nút có `aria-busy` |

## Skill gates

- `aislop`: skip, không nằm trong verify command được allow của reviewer.
- `oxlint` (anti-slop): skip, oxlint not configured (repo dùng ESLint, `pnpm lint` PASS).
- `ocr`: skip, ocr not installed / không trong allowlist.
- AI-readable: OK. `handleApproveEnglish` ~30 dòng, `approveEnglish` ~27 dòng, tên rõ, comment nêu lý do. Có 1 comment lỗi thời (MINOR-J) và vài dòng rất dài (`Pages.ts:56`, `content-defaults.ts:146`). Dưới 3 indicator.
- ai-friendly-web: N/A (admin nội bộ).
- blitzstrike: skip, không có môi trường pentest được phép; authz đánh giá bằng code + integration test (`retranslate.test.ts:318-326`).

## Findings

Không có CRITICAL/MAJOR.

### [MINOR-J] Comment trường ảo lỗi thời
- `src/collections/Pages.ts:55` (dòng thêm trong diff): "nút "Duyệt bản EN" (chỉ admin, chỉ khi bản dịch AI đang chờ duyệt)". Hành vi mới là hiện khi `hasEnglish` còn tắt, với cả bản nhập tay. Fix: sửa thành "chỉ admin, khi `hasEnglish` còn tắt".

### [MINOR-K] AC chưa ghi quyết định (1) của user thành tiêu chí riêng
- `tasks/tami-website/layer-10-task-02.md:44` nói về duyệt, nhưng không có dòng "trang pháp lý đã duyệt bị AI dịch lại (force hoặc tự dịch khi sửa bản Việt) → `hasEnglish=false` + `pending_review`, làm mới `/en` + `/vi`". Code, test và docs đã đúng. Fix: thêm một câu vào AC6 hoặc một AC mới để task file ghi đủ quyết định user.

### [MINOR-L] Kiểm "đủ trường" ở endpoint và hook là hai lần đọc riêng
- `approve-english.ts:31-39` đọc EN ngoài transaction rồi mới `update`. Nếu EN bị xoá giữa hai bước, hook `requireEnglishFields` ném `ValidationError` → bị `catch` chung → 500 thay vì 422 (`:65-67`). Hướng lỗi là an toàn (không bật), khả năng rất thấp vì pages chỉ admin sửa. Tuỳ chọn: bắt `ValidationError` trong handler → 422.

### [MINOR-I round 3] Duyệt không gắn với phiên bản EN admin đã xem: còn tồn
- Nay áp cho cả bản nhập tay: endpoint duyệt bản EN đang ở DB lúc bấm, không phải bản trên form. Nếu admin đã sửa EN trên form nhưng chưa Lưu rồi bấm duyệt, bản cũ ở DB được xuất bản. Đề xuất (tuỳ chọn): câu mô tả cạnh nút nhắc "Lưu bản EN trước khi duyệt", hoặc gửi `updatedAt` để endpoint so khớp (khác → 409).

### [MINOR-5 round 1] Banner chỉ ở dashboard, 13 request mỗi lần mở: còn tồn, đã chấp nhận.

## Residual risk

- `isFilled` (`src/hooks/require-english-fields.ts:6-14`, có sẵn, không thuộc diff) coi richText là đủ khi `root.children.length > 0`. Lexical khi xoá trắng thường còn 1 paragraph rỗng, nên bản EN `content` "trống" vẫn qua 422 và được duyệt. Predicate này cũng dùng cho mọi collection. Ngoài scope, đề xuất task riêng (kiểm có text node không rỗng).
- Sau khi duyệt bản nhập tay, admin sửa tiếp bản EN thì `hasEnglish` vẫn true và nội dung mới hiện ngay, không qua duyệt lại (chỉ bản AI mới bị hạ về false). Chấp nhận được vì chỉ admin sửa `pages` và admin cũng là người duyệt. Nếu BR-08 đòi duyệt lại mọi thay đổi EN thì cần một quyết định riêng.
- Trang đã duyệt từ bản nhập tay có status `done` dù không có `sourceHash`/`translatedAt`. Filter "Chưa dịch" (`admin-ui.ts:5`) sẽ không còn liệt kê trang này. Chỉ là hiển thị.
- `router.refresh()` sau khi duyệt: chưa kiểm bằng browser việc form nạp lại `hasEnglish` (như round 3). Nếu form không nạp lại, lần Lưu sau có thể hạ trang về false. Hướng lỗi này ẩn trang, không lộ bản chưa duyệt.
- Cờ `approveEnglish` vẫn nằm trên `req.context` sau lần duyệt (như round 3). Hiện endpoint không ghi gì thêm.
- UI responsive chỉ xác minh bằng đọc style; không chạy app.

## Verdict

**PASS**. MAJOR-H, MINOR-F, MINOR-G đã đóng, mỗi cái có integration test. MAJOR-A round 2 không tái phát: guard và các test form/REST không đổi và vẫn xanh. Endpoint đúng thứ tự authz 401 → 403 → 400 → 404 → 409 → 422, audit fail-closed có test. Collection khác không hồi quy. Docs khớp code. AC khớp quyết định user. Verify PASS (lint, typecheck, build; test 2288/2288, chỉ lỗi CRLF đã biết). Các MINOR J/K/L/I nên sửa khi tiện, không chặn.
