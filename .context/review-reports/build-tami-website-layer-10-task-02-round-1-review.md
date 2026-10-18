Agent: reviewer

# Review — build tami-website · layer-10-task-02 · round 1

- Task: `tasks/tami-website/layer-10-task-02.md` (admin dịch: retranslate, lọc trạng thái dịch, duyệt EN pháp lý, banner lỗi dịch + follow-up L9-T07)
- Code: worktree `D:/prj/bds-wt10-t02` (branch `wt/l10-t02`, base `ef39df4`, chưa commit). Bỏ qua `src/payload-types.ts` (chỉ EOL).
- **Review level: STRICT**
- **Reason:** endpoint admin mới (authz/BOLA, rate limit, audit fail-closed), gửi dữ liệu ra dịch vụ AI, đổi access/UI của field dùng chung (`withFieldAccess`), đổi shared hook `queueTranslation` + job ghi DB có SQL khoá dòng (`FOR UPDATE`), luồng duyệt pháp lý BR-08.

## Blast radius

- API mới `POST /api/admin/translations/:collection/:id` (`src/endpoints/admin/retranslate.ts`, đăng ký ở `src/payload.config.ts`).
- Shared: `src/collections/_shared/content-defaults.ts` (mọi collection nội dung: `beforeList` filter, `custom.englishRequiredFields`, `withFieldAccess` bỏ readOnly), `src/fields/translation.ts` (ui field `retranslateAction` trong nhóm `translation` của mọi collection/global dịch), `src/hooks/translation/enqueue-translation.ts` (`queueTranslation` dùng bởi hook tự dịch + job `rowChanged` + endpoint), `src/hooks/require-english-fields.ts` (tách predicate).
- Job `translate-content` (`src/jobs/translate-content-save.ts`: ghi 2 bước + `lockRow`).
- `pages`: hook `approveEnglish` (afterChange), nút `ApproveEnglishButton`.
- Admin UI: `TranslationStatusFilter` (list mọi collection dịch), `TranslationFailedBanner` (dashboard), `RetranslateButton`.
- Rate limit key mới `admin-retranslate` (Redis).

## Verify commands + result (chạy trong `D:/prj/bds-wt10-t02`)

| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` (full) | 211/216 file pass, 2221 test pass; fail: `src/lib/contrast.test.ts` (lỗi CRLF worktree đã biết) + 4 file integration (`access`, `jobs-email`, `media-upload`, `session-refresh`) fail ở `beforeAll` (Hook timed out / "database system is in recovery mode" — Postgres dùng chung) |
| rerun riêng `tests/integration/retranslate.test.ts` + `translate-content.test.ts` | **2 files / 39 tests PASS** |
| rerun riêng `access`, `jobs-email`, `session-refresh`, `media-upload` | **4 files / 55 tests PASS** (fail lúc full run là do môi trường DB) |
| `src/lib/translation/admin-ui.test.ts` | PASS |
| `pnpm build` | PASS (exit 0) |

## Kiểm theo checklist được giao

| Điểm | Kết quả | Bằng chứng |
|---|---|---|
| BOLA/authz retranslate | OK | `retranslate.ts:79` 401 (chưa login / `active!==true`); `:82-83` allowlist `TRANSLATABLE_COLLECTIONS`/`TRANSLATABLE_GLOBALS` + UUID → 404; `:88-89` quyền theo `access.update` thật của collection (Where gộp với `id`, `overrideAccess` chỉ cho truy vấn kiểm) / global (`=== true`, globals đều `update: isAdmin` — `src/globals/*.ts`) → 404 cùng message. Test: sale bài người khác 404 + cùng body với id không tồn tại; services/pages/global sale 404; leads/staff/audit-logs/job-applications 404 |
| Rate limit 30/giờ/user | OK | `rate-limit.ts:16`; `retranslate.ts:22-36` 429 + `Retry-After`, Redis lỗi 503; test có |
| Audit fail-closed | OK (thiếu test, MINOR-2) | `retranslate.ts:92-104` audit trước `queueTranslation`, lỗi → 500, không xếp job |
| Dữ liệu gửi AI chỉ collection được phép | OK | endpoint chặn allowlist; job `resolveTarget` (`translate-content.ts:151-155`) + chỉ bản đã xuất bản (`:166`) + `translationEnabled`/budget (`:159-162`) |
| `hasEnglish` bỏ readOnly không mở cho sale | OK | chỉ `pages` có `fieldAccess.hasEnglish.update: isAdmin` (`Pages.ts:63`), collection `pages` `update: isAdmin`; `withFieldAccess` chỉ bỏ readOnly khi có override `update`; test sale không bật được + news vẫn readOnly |
| Hook `approveEnglish` không kích hoạt sai | OK | `approve-english.ts:14-15` chỉ `update`, bỏ context job, chỉ false→true; không có seed/đường hệ thống nào ghi `hasEnglish: true` cho pages (grep `src`); chỉ gắn ở `pages` |
| `lockRow` FOR UPDATE đúng transaction | OK (residual risk) | `translate-content-save.ts:71-81` dùng `adapter.sessions[transactionID].db`, ném lỗi nếu không có transaction; tên bảng kiểm trong `adapter.tables` + `sql.identifier`, id là tham số; test giữ khoá ở transaction khác → job chờ, nhả khoá → dịch xong |
| `queueTranslation` nâng force không phá debounce | OK | `enqueue-translation.ts:70` chỉ ghi `input` khi `input.force`; lần lưu sau (không force) chỉ lùi `waitUntil`, giữ `force`; test "nâng lên force, không thêm job" |
| Filter 5 trạng thái dùng field có sẵn | OK | `admin-ui.ts:4-10` (`translation.status`/`enSource`/`viChangedAfterManual`) |
| Banner chỉ admin | OK | `TranslationFailedBanner.tsx:55-58,68` |
| API_SPEC §5.1 as-built | OK | khớp thứ tự/mã lỗi/allowlist/fail-closed/nâng force trong code |

## Responsive Checklist Gate (diff đụng UI admin — 4 component Payload admin, không có CSS/route public)

Không có browser; xác minh bằng đọc style inline.

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | Filter: `flex-wrap: wrap`, `select minWidth: 220` < 375; nút/banner không width cố định |
| Mobile-first / grid auto-fit / container không fixed px | N/A | không có grid/media query mới; layout do Payload admin |
| Font `rem` / heading `clamp` | N/A | không đặt font-size; kế thừa theme Payload |
| Media (img/video) | N/A | không có |
| Touch target ≥ 44px | OK | `minHeight: 44` ở `RetranslateButton.tsx:39`, `ApproveEnglishButton.tsx:51`, `TranslationStatusFilter.tsx:25` |
| Nav/table mobile | N/A | không đổi nav/table |
| 100vh / reduced-motion / overflow:hidden | N/A | không dùng |

## Skill gates

- `aislop`: skip — không nằm trong verify command được allow của reviewer (Claude gate chỉ cho verify commands profile).
- `oxlint` (anti-slop): skip, oxlint not configured (repo dùng ESLint — `pnpm lint` PASS).
- `ocr` (open-code-review): skip, ocr not installed / không trong allowlist.
- AI-readable: OK — hàm ≤ 50 dòng (`handleRetranslate` ~40), tên rõ, comment WHY; 1 comment lỗi thời (MINOR-3), vài dòng rất dài (`content-defaults.ts:150`, `retranslate.ts:82`) — < 3 indicators.
- ai-friendly-web: N/A (admin nội bộ).
- blitzstrike: skip — không có môi trường pentest được phép; đánh giá authz bằng code + integration test.

## Findings

### [MAJOR-1] Trang pháp lý đã duyệt: bản AI mới (dịch lại / tự dịch) hiện ngay ở `/en` không qua duyệt, nút duyệt bị ẩn — vi phạm BR-08 + AC6
- `src/jobs/translate-content-save.ts:20` (`if (ctx.target.slug === "pages") return update({});`) + `src/jobs/translate-content.ts:102` (`status: "pending_review"`): job ghi đè bản `en` đang LIVE nhưng giữ nguyên `hasEnglish = true`.
- `src/components/admin/ApproveEnglishButton.tsx:22` ẩn nút khi `hasEnglish === true`; `src/hooks/pages/approve-english.ts:15` chỉ chạy khi false→true → trạng thái kẹt `pending_review` mãi, không có đường duyệt, audit `content.approve_translation` không bao giờ ghi cho lần dịch mới.
- Kịch bản: admin duyệt Chính sách bảo mật EN (hasEnglish=true) → bấm "Dịch lại bằng AI" (endpoint mới mở cho `pages`) hoặc sửa bản VI → bản AI chưa duyệt hiển thị cho khách ở `/en`. BRD BR-08: "Trang pháp lý AI chỉ dịch nháp; admin duyệt rồi mới hiện ở `/en`". Gốc từ L9-T07 nhưng task này chịu trách nhiệm luồng duyệt pháp lý và vừa mở thêm đường kích hoạt (retranslate `force` cho `pages`, kể cả đè bản sửa tay đã duyệt).
- Fix đề xuất (chọn 1, cần ghi rõ quyết định): (a) job ghi bản AI cho `pages` thì đặt luôn `hasEnglish: false` (trong context job, `approveEnglish` bỏ qua) để trang về trạng thái chờ duyệt, nút hiện lại; hoặc (b) giữ bản EN đã duyệt, lưu bản AI ở chỗ nháp riêng và chỉ áp khi duyệt (lớn hơn, có thể cần schema). Đồng thời cho nút hiện khi `status === "pending_review"` theo trạng thái thật. Thêm integration test: page đã duyệt → job/retranslate → không hiện EN chưa duyệt + duyệt lại được + audit.

### [MINOR-1] Retranslate trả 202 "Đã xếp hàng dịch lại" khi dịch đang tắt
- `src/endpoints/admin/retranslate.ts:106-111`: không kiểm `isTranslationEnabled` / hạn mức = 0; job sẽ `skipped` (`translate-content.ts:159-162`) nhưng người dùng thấy thành công. Đề xuất: kiểm `translationEnabled` trước khi xếp, trả 409/503 với thông báo "Dịch tự động đang tắt".

### [MINOR-2] Thiếu test audit fail-closed của retranslate
- AC ghi rõ audit; `retranslate.ts:92-104` không có test "ghi audit lỗi → 500, không có job". Đề xuất: inject/làm hỏng `audit-logs` (như mẫu `ALTER TABLE ... RENAME` trong `translate-content.test.ts`) và assert 500 + số job không đổi.

### [MINOR-3] Comment lỗi thời + ghi 2 lần
- `src/jobs/translate-content-save.ts:10` vẫn ghi "bằng MỘT lần `update`" trong khi `saveEnglish` nay ghi 2 lần khi bật `hasEnglish` (`:24,31`) → thêm 1 version/bản ghi và chạy hook revalidate 2 lần mỗi lần dịch đầu. Sửa comment; cân nhắc tính `missingEnglishFields` trên dữ liệu ghi để gộp 1 lần nếu được.

### [MINOR-4] Retranslate bản ghi trong thùng rác vẫn 202 + audit
- `retranslate.ts:52` `trash: true` → bài đã xoá mềm vẫn qua, ghi audit, job sau đó `not_published`. Đề xuất bỏ `trash: true` (trả 404) cho khớp UI.

### [MINOR-5] Banner chỉ ở dashboard, 13 request mỗi lần mở
- `src/payload.config.ts:64` (`beforeDashboard`) + `TranslationFailedBanner.tsx:43-48`: admin vào thẳng list/form không thấy cảnh báo; mỗi lần mở dashboard gọi 9 collection + 4 global. Chấp nhận được cho FR-ADM-17; ghi nhận, cân nhắc 1 endpoint tổng hợp sau.

## Residual risk

- `lockRow`: thứ tự khoá job (dòng chính → bảng locales) giả định lần lưu của admin cũng khoá dòng chính trước (Payload `upsertRow` update bảng chính trước locales); chưa có test deadlock với lần lưu có hook ghi bảng khác trước — rủi ro thấp.
- Integration full-run bị ảnh hưởng bởi Postgres dùng chung (recovery mode); đã chạy lại riêng từng file đều PASS.
- UI responsive chỉ xác minh bằng đọc style (không có browser).

## Verdict

**FAIL** — còn 1 MAJOR (MAJOR-1, BR-08 trang pháp lý). MINOR-1…5 nên xử lý cùng vòng nếu gọn.
