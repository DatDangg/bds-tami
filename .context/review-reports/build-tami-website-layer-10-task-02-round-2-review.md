Agent: reviewer

# Review: build tami-website · layer-10-task-02 · round 2

- Task: `tasks/tami-website/layer-10-task-02.md` (admin dịch: Dịch lại bằng AI, lọc trạng thái dịch, duyệt bản EN trang pháp lý, banner lỗi dịch, follow-up L9-T07)
- Code: worktree `D:/prj/bds-wt10-t02` (branch `wt/l10-t02`, base `ef39df4`, chưa commit). Bỏ qua `src/payload-types.ts` (chỉ EOL).
- Quyết định user 2026-10-18 cho MAJOR-1 round 1: AI dịch lại trang pháp lý thì đặt `hasEnglish=false` và `pending_review` (ẩn /en) tới khi admin duyệt; nút duyệt hiện theo status.
- **Review level: STRICT**
- **Reason:** luồng duyệt pháp lý BR-08 (quyền + audit), endpoint admin mới (authz/BOLA, rate limit, audit fail-closed), shared `withFieldAccess`/`translationGroup`/`queueTranslation`, job ghi DB có `SELECT … FOR UPDATE`, gửi dữ liệu ra dịch vụ AI.

## Blast radius

- `pages`: job `translate-content` (`saveEnglish` nhánh pages), hook `approveEnglish`, nút `ApproveEnglishButton`, trường `hasEnglish` sửa được trong admin; public: `/en/<trang pháp lý>`, hreflang (`buildLegalMetadata`), sitemap (`sitemap-data.ts:123-127`).
- Mọi collection dịch (news, projects, rentals, property-posts, services, job-postings, categories, developers) và 4 global: `saveEnglish` đổi từ "thử bật rồi bắt lỗi" sang "ghi rồi bật theo `missingEnglishFields`"; `lockRow`; `custom.englishRequiredFields`; `beforeList` filter; nút Dịch lại.
- API `POST /api/admin/translations/:collection/:id` (409/503 mới), rate limit key `admin-retranslate`.
- Docs: `docs/API_SPEC.md` §5.1, `docs/ARCHITECTURE.md` (bảng job).

## Verify commands + result (chạy trong `D:/prj/bds-wt10-t02`)

| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | 215/216 file PASS, **2280/2280 test PASS**. File fail duy nhất là `src/lib/contrast.test.ts` (0 test, lỗi môi trường CRLF của worktree đã biết). Lần này các file integration không lỗi kết nối DB nên không phải chạy lại riêng |
| `pnpm build` | PASS (exit 0) |

## Finding round 1: đã đóng chưa

| Round 1 | Trạng thái | Bằng chứng |
|---|---|---|
| MAJOR-1 (bản AI của trang pháp lý hiện ngay ở /en) | **Đóng theo quyết định user**, nhưng sinh ra lỗi mới (MAJOR-A bên dưới) | `translate-content-save.ts:218` `update({ hasEnglish: false })`; `translate-content.ts:298-308` làm mới `/en/<route>`; nút hiện theo `status === "pending_review"` (`ApproveEnglishButton.tsx:21`); test `retranslate.test.ts:300-327` (trang đã duyệt → dịch lại → false + pending_review + làm mới /en → duyệt lại → true + audit lần 2) |
| MINOR-1 (202 khi dịch đang tắt) | Đóng ở API, UI còn thiếu (MINOR-B) | `retranslate.ts:40-49,103-104` 409/503; test `retranslate.test.ts:212` |
| MINOR-2 (thiếu test audit fail-closed) | Đóng | `retranslate.test.ts:236` (500, không có job) |
| MINOR-3 (comment lỗi thời, ghi 2 lần) | Đóng | comment `translate-content-save.ts:198-201,219-221` khớp code; lần ghi thứ hai chỉ xảy ra khi cần bật `hasEnglish` (đã ghi lý do: slug `en` do hook sinh ở lần ghi đầu) |
| MINOR-4 (bản ghi trong thùng rác vẫn 202) | Đóng | `retranslate.ts:62-69` không còn `trash: true`; test `retranslate.test.ts:202` |
| MINOR-5 (banner chỉ ở dashboard, 13 request) | Còn tồn, đã chấp nhận | không đổi |

## Kiểm theo checklist được giao

| Điểm | Kết quả | Bằng chứng |
|---|---|---|
| Luồng pháp lý: dịch lại (force) | OK | như trên |
| Luồng pháp lý: tự dịch khi sửa bản Việt | OK (code), test gián tiếp | cùng nhánh `saveEnglish` (`translate-content-save.ts:218`) cho mọi job của `pages`, không phân biệt `force`; test `translate-content.test.ts:~436` (trang mới tự dịch → false + pending_review + chỉ làm mới `/en/chinh-sach-bao-mat`). Chưa có test "trang ĐÃ duyệt + sửa VI, không force" (MINOR-D) |
| Chuyển ngôn ngữ / hreflang / sitemap không trỏ /en khi `hasEnglish=false` | OK (theo code sẵn có, không đổi trong diff) | `LegalPage.tsx:16-29` chỉ thêm `en` khi `hasEnglish === true`; `sitemap-data.ts:127`; `legal-page.ts:12,17` (`findPublicOne` theo locale, chú thích ẩn bản chưa duyệt). Cache trang `vi` có thể còn trỏ /en tối đa ~60 giây (MINOR-C) |
| Không hồi quy collection khác (vẫn bật `hasEnglish`) | OK | `translate-content-save.ts:222-229`: ghi xong, `missingEnglishFields` dựa trên bản đã lưu (có slug `en` vừa sinh) rồi mới bật; test "developers … bật hasEnglish" và các test news trong `translate-content.test.ts` PASS; `hasEnglish` của news vẫn readOnly (`retranslate.test.ts:340-345`) |
| Hook `approveEnglish` không kích hoạt sai | OK khi chạy đúng luồng, **có đường bị kích hoạt ngoài ý muốn** (MAJOR-A) | `approve-english.ts:14-15` bỏ qua create/context job, chỉ khi false → true; job đặt false trong context job nên không ghi audit; lần ghi lồng `status: done` mang context job nên không xếp job, không lặp |
| API_SPEC / ARCHITECTURE khớp code | OK | API_SPEC §5.1 as-built: thứ tự 401 → 404 allowlist/UUID → 429/503 → 404 quyền → 409/503 dịch tắt → audit fail-closed 500 → 202, xoá mềm 404, nâng force: khớp `retranslate.ts:91-126`. ARCHITECTURE: pages `hasEnglish=false` + nút theo status + `lockRow` + `missingEnglishFields`: khớp |
| BOLA / rate limit / audit | OK | không đổi so với round 1 (đã PASS); 409 kiểm SAU bước quyền (`retranslate.ts:100-104`) nên không dùng để dò bài |

## Responsive Checklist Gate (diff có UI admin: 4 component Payload admin, không có CSS/route public mới)

Không có browser; xác minh bằng đọc style inline. Round 2 chỉ đổi điều kiện hiển thị của `ApproveEnglishButton`, không đổi layout.

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | nút/thông báo dạng `flex column`, không width cố định; filter `flex-wrap`, `minWidth: 220` < 375 |
| Mobile-first / grid auto-fit / container không fixed px | N/A | không có grid/media query mới; layout do Payload admin |
| Font `rem` / heading `clamp` | N/A | không đặt font-size, dùng theme Payload |
| Media | N/A | không có |
| Touch target ≥ 44px | OK | `minHeight: 44` ở `ApproveEnglishButton.tsx:50`, `RetranslateButton.tsx:39`, `TranslationStatusFilter` |
| Nav/table mobile | N/A | không đổi |
| 100vh / reduced-motion / overflow:hidden | N/A | không dùng |

## Skill gates

- `aislop`: skip, không nằm trong verify command được allow của reviewer.
- `oxlint` (anti-slop): skip, oxlint not configured (repo dùng ESLint, `pnpm lint` PASS).
- `ocr`: skip, ocr not installed / không trong allowlist.
- AI-readable: OK. Hàm ngắn (`handleRetranslate` ~40 dòng, `saveEnglish` ~28), tên rõ, comment giải thích lý do. Còn vài dòng rất dài (`retranslate.ts:94`, `content-defaults.ts:110`, `Pages.ts:60`). Dưới 3 indicator.
- ai-friendly-web: N/A (admin nội bộ).
- blitzstrike: skip, không có môi trường pentest được phép; authz đánh giá bằng code + integration test.

## Findings

### [MAJOR-A] Form admin còn giữ giá trị cũ `hasEnglish = true` sẽ "duyệt" lại bản AI chưa ai đọc (vẫn vi phạm BR-08), kèm audit duyệt sai
- `src/jobs/translate-content-save.ts:218` hạ `hasEnglish` xuống false ở server. Nhưng `hasEnglish` của `pages` sửa được trong form admin (`content-defaults.ts:86-92` bỏ readOnly). Form admin của Payload gửi toàn bộ giá trị field khi Lưu, nên form đang mở vẫn mang `hasEnglish: true` từ lúc tải. Field không localized, admin có quyền `update`, nên giá trị này không bị loại.
- Lần lưu tiếp theo từ form đó: `approveEnglish` (`src/hooks/pages/approve-english.ts:15`) thấy previous false → true, ghi audit `content.approve_translation` gán cho admin và chuyển `pending_review` → `done` (`:26-37`). Bản AI chưa duyệt hiện ở `/en`, dù admin không hề bấm duyệt.
- Hai kịch bản thực tế:
  1. Admin bấm "Dịch lại bằng AI" trong form trang pháp lý. `RetranslateButton.tsx:28-29` không refresh form, job chạy ngay (`NO_DEBOUNCE_MS`). Sau đó admin bấm Lưu (vd sửa `version`/`effectiveDate`).
  2. Admin sửa nội dung VI rồi Lưu, vẫn ở lại form. Khoảng 1 phút sau job tự dịch chạy và đặt false. Admin nâng `version`/`effectiveDate` (thao tác hay đi kèm khi sửa văn bản pháp lý) rồi Lưu. Lần lưu này không đổi chữ nên không xếp job mới để hạ lại `hasEnglish`.
- Test chỉ cover luồng đúng (`retranslate.test.ts:300-327`). Không có test lần lưu có `hasEnglish: true` cũ.
- Fix đề xuất: duyệt chỉ được tính khi là hành động duyệt rõ ràng. Ví dụ hook `beforeChange` của `pages` (bỏ qua context job): nếu `originalDoc.hasEnglish !== true`, `originalDoc.translation.status === "pending_review"`, `data.hasEnglish === true` mà request không phải lệnh duyệt → giữ `data.hasEnglish = originalDoc.hasEnglish`. Lệnh duyệt có thể là endpoint riêng `POST /api/admin/pages/:id/approve-english` (admin, audit) mà nút gọi tới, hoặc một dấu hiệu server kiểm được, như token = `translation.translatedAt` của bản đang chờ. Nếu vẫn giữ AC "admin bật được trong UI" bằng ô tick thì ô tick cũng phải đi qua cùng kiểm tra. Thêm integration test: trang đã duyệt → job hạ false → `update({ version: "1.1", hasEnglish: true })` không có lệnh duyệt → vẫn false, `pending_review`, không có audit mới.

### [MINOR-B] UI không báo "dịch đang tắt" khi API trả 409/503
- `src/lib/translation/admin-ui.ts:59-66`: 409/503 rơi vào câu chung "Không thể dịch lại lúc này. Thử lại sau.", nên mục đích của MINOR-1 round 1 (báo rõ dịch đang tắt) chưa tới được người dùng. Đề xuất: map 409 → "Dịch tự động đang tắt (Cài đặt chung / hạn mức)", 503 → "chưa cấu hình / tạm lỗi", kèm unit test trong `admin-ui.test.ts`.

### [MINOR-C] Job chỉ làm mới `/en` của trang pháp lý; trang `vi` cache cũ còn hreflang/chuyển ngôn ngữ trỏ /en
- `src/jobs/translate-content.ts:297-301` (`legalEnglishPaths` chỉ trả đường dẫn `en`). Hook `revalidatePage` chạy trong process `jobs`, mà `revalidateWithNext` không có tác dụng ngoài Next (ARCHITECTURE), nên trang `vi` giữ `alternates.languages.en` tới khi hết `revalidate = 60` của layout (`[locale]/layout.tsx:20`). Ảnh hưởng ≤ 60 giây. Đề xuất: trả cả `internalPath(route, "vi")`.

### [MINOR-D] Thiếu test "trang đã duyệt + sửa VI (job không force)"
- Code dùng chung nhánh với dịch lại nên rủi ro thấp. Nên thêm 1 case cho đúng quyết định user ("kể cả tự dịch khi sửa bản Việt").

### [MINOR-E] Diff ngoài phạm vi trong `docs/API_SPEC.md`
- Dòng as-built L9-T03 (giao lead) bị đổi dù nội dung hiển thị như cũ (có thể khác whitespace/EOL). Đề xuất bỏ thay đổi đó cho diff gọn.

### [MINOR-5 round 1] Banner chỉ ở dashboard, 13 request mỗi lần mở: còn tồn, đã chấp nhận.

## Residual risk

- MAJOR-A suy ra từ hành vi gửi form của Payload admin (gửi cả field không đổi) cộng với access của `hasEnglish`. Reviewer không chạy app/browser để tái hiện. Cần một integration test như đề xuất để chốt.
- Dữ liệu cũ dạng `hasEnglish = true` + `pending_review` (nếu có từ L9-T07 trên staging): nút hiện nhưng PATCH true → true không kích hoạt hook, nên nút không bao giờ ẩn. Khả năng thấp vì staging đặt hạn mức = 0.
- `lockRow`: giữ như round 1 (thứ tự khoá giả định lần lưu admin khoá dòng chính trước).
- UI responsive chỉ xác minh bằng đọc style.

## Verdict

**FAIL**: MAJOR-1 round 1 đã đóng theo quyết định user, MINOR-1..4 đã đóng. Nhưng luồng mới để lộ đường duyệt ngầm qua form admin còn giữ giá trị cũ (MAJOR-A, BR-08). MINOR-B..E nên sửa cùng vòng.
