# Task 02: Bộ field + hook nội dung dùng chung (slug, SEO, status, author, hasEnglish, versions, xoá mềm, revalidate)

## Layer
3 — Bộ field nội dung dùng chung + giám sát app + Docker

Checkpoint: Không dừng hỏi user sau layer này (spec-validator cuối layer PASS là tự sang layer kế tiếp)

## Type
build (initial)

## Classification / Risk
- Work item type: BUILD (initial build `tami-website`)
- Priority: Must
- Scope: SHARED_FOUNDATION
- Review level expected: **STRICT** — shared hook/field cho mọi collection nội dung; RBAC field-level; cache revalidate
- Blast radius: src/fields/slug.ts (localized, tự sinh từ title theo từng locale, unique theo `_locale`); src/fields/seo.ts (`@payloadcms/plugin-seo` cấu hình); src/fields/status.ts, published-at.ts (tự gán khi xuất bản lần đầu, chỉ đọc ở Must); …
- Doc impact (dự kiến): ERD §1/§1.1 nếu quy ước trạng thái/slug khác thiết kế
- Decision impact: NO

## Requirements
- BR-02, BR-03, BR-04, BR-05 (sinh slug), BR-07
- FR-ADM-01…05 (nháp/xuất bản, lịch sử phiên bản)
- PERMISSION §3.1, §4
- ERD §1, §1.1, §4.14
- ARCHITECTURE §5.1 (revalidate ≤ 1 phút)

## Description
Factory dùng lại cho mọi collection nội dung để quy tắc chung nằm một chỗ.

## Dependencies
- `layer-1-task-02` Collection `staff` (auth) + hàm phân quyền `src/access/` (dùng kết quả của task này)
- `layer-1-task-03` Định tuyến song ngữ `next-intl` (vi mặc định, `/en`) + định dạng Intl (dùng kết quả của task này)
- `layer-1-task-05` Thư viện dùng chung: slug, SĐT, chuẩn hoá chữ không dấu, response helper, ipHash (dùng kết quả của task này)
- `layer-2-task-03` `audit-logs` + quản lý tài khoản sale (tạo, khoá, đặt lại mật khẩu) có audit (dùng kết quả của task này)

Mở khoá cho: `layer-4-task-01`, `layer-4-task-02`, `layer-4-task-03`, `layer-4-task-04`, `layer-5-task-01`, `layer-5-task-02`, `layer-5-task-03`, `layer-5-task-04`, `layer-6-task-02`, `layer-6-task-03`, `layer-7-task-01`, `layer-8-task-01`

## Acceptance Criteria
- [x] Slug tự sinh từ `title` của đúng locale khi trống; trùng trong cùng collection + locale → thêm hậu tố; sửa tay được
- [x] `publishedAt` tự gán lần đầu chuyển `published`, không cho sửa tay (mở ở task hẹn giờ)
- [x] `author` tự gán người tạo; chỉ admin đổi; `isFeatured` chỉ admin sửa (sale gửi lên bị bỏ qua/403)
- [x] Sale chỉ update/delete bản ghi của mình (A1); admin tất cả; xoá là xoá mềm, chỉ admin khôi phục/xoá hẳn, mỗi thao tác ghi audit
- [x] `hasEnglish` + `translation.*` chỉ đọc với mọi người ở Must (logic bật ở task dịch); hook `beforeValidate` chặn bật `hasEnglish` khi thiếu trường EN bắt buộc
- [x] Hook revalidate gọi cho cả đường dẫn VI và EN (theo `pathnames`), cho chi tiết + danh sách + trang chủ khi `isFeatured`
- [x] Document locking mặc định của Payload 3 bật (hai người sửa cùng bài)

## Tests cần viết
- Integration trên một collection test nội bộ (`tests/fixtures/test-content`): slug vi/en, trùng slug, author/isFeatured field access, xoá mềm + khôi phục + audit
- Unit: hàm map collection → đường dẫn vi/en cho revalidate

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-3-task-02-round-<R>-review.md`

## Migration
- Không tạo bảng thật (collection test chỉ dùng trong test, không vào config production). Nếu cần bảng dùng chung thì migration additive.

## Retry / Error Memory
- Attempt: 2 (sửa theo reviewer round 1 FAIL: M1 + m1-m4, m6)
- Last failure type: n/a (attempt 1 xanh; lỗi gặp khi build đã xử lý trong attempt: Local API ghi đè `req.locale` khi hook đọc locale khác, xem `src/lib/payload/preserve-request-locale.ts`)
- Round 1 FAIL M1: `revalidatePath` nhận URL công khai (`/du-an/x`, `/en/projects/x`) nên không trúng cache Next vì trang render dưới segment `[locale]` (route table `●/vi`, `●/en`) và `proxy.ts` chỉ rewrite URL công khai. Sửa: `internalPath` sinh `/${locale}${khoá pathnames}` (`/vi/du-an/x`, `/en/du-an/x`, home `/vi` `/en`); chọn đường dẫn cụ thể thay vì pattern `"page"` vì biết chính xác slug cần làm mới (không xoá cả nhóm trang). Test unit + integration assert đường dẫn nội bộ, thêm test kiểm segment `[locale]` tồn tại.
- Round 1 minor đã sửa: m1 truy vấn trùng slug bằng tiền tố `SLUG_MAX_LENGTH-4` (ứng viên bị cắt vẫn nằm trong kết quả; test slug 80 ký tự); m2 locale `all` ném APIError 400 rõ ràng (test); m3 option `fieldAccess` trong `withContentDefaults` để ghi đè access trường dùng chung (unit test), `collection.access` vẫn ghi đè cấp collection; m4 một nguồn `denyAll` (`src/access/denyAll.ts`) và `ContentDoc` (`src/hooks/content-doc.ts`); m6 test audit lỗi → xoá mềm/xoá hẳn rollback (spy `payload.create` cho audit-logs).
- Residual / follow-up (m5, m7, không chặn): tách `content-defaults.test.ts` theo describe khi quá dài; slug unique theo phạm vi cho `categories`; Lexical rỗng (root + paragraph rỗng) vẫn tính là đã điền trong `require-english-fields`; `CONTENT_ROUTES` chưa có `pages`/`categories` (factory ném lỗi sớm nếu thiếu); kiểm UI nút "chuyển vào thùng rác" cho sale ở layer 4; trang chi tiết thật chưa tồn tại dưới `[locale]` nên chưa quan sát được revalidate trên cache Next thật.
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: 7/7 đạt ở mức builder (chờ reviewer): slug (6 test), publishedAt (3), author/isFeatured (3), quyền theo bản ghi + xoá mềm/khôi phục/xoá hẳn + audit (5), hasEnglish chỉ đọc + chặn bật khi thiếu EN (3), revalidate vi/en (3), versions/trash/lock (3)
- Verify commands + result: `pnpm install --frozen-lockfile` OK · `pnpm lint` 0 lỗi/0 cảnh báo · `pnpm typecheck` OK · `pnpm test` 63 file / 609 test PASS (gồm integration `tests/integration/content-defaults.test.ts` 29 test chạy DB thật Postgres 5433, DB tạm, và unit `content-paths.test.ts` + `slug.test.ts`) · `pnpm build` OK
- Reviewer verdict: round 1 FAIL (M1 revalidate theo URL public) → attempt 2 → **STRICT PASS round 2** (`.context/review-reports/build-tami-website-layer-3-task-02-round-2-review.md`). Residual MINOR: n1 `slug.ts:41` `like` = ILIKE %prefix% (contains, pagination:false) → chậm với slug ngắn, nên đổi equals base OR like "head-"; n2 `content-defaults.ts:49-55` `fieldAccess` với giá trị `undefined` ghi đè deny-all thành mở quyền → lọc undefined + throw tên field lạ TRƯỚC khi `pages` dùng option (layer 4+); n3 test m6 purge xoá bản chưa trong thùng rác + rejects.toThrow không kiểm message. Chưa kiểm revalidate trên cache Next thật (route chi tiết ở layer 4)
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: `docs/ERD.md` §4.14 (as-built): nhóm `seo` tự khai báo thay vì plugin-seo; ghi bộ field dùng chung + xoá mềm bằng `trash`. Không đổi intent docs, không đổi API_SPEC/PERMISSION (không đổi hợp đồng). Không đổi schema production (không migration).
- Decision log: seo group tự định nghĩa theo ERD §4.14 (không dùng @payloadcms/plugin-seo); revalidatePath theo path nội bộ `/{locale}{pathnames key}` (không pattern, không tag)

## Commit / Tracking
- Commit gợi ý: `feat(layer-3): task-02 kit` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-3/task-02` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [x] Code written (chỉ trong scope)
- [x] Tests added + pass
- [x] Check commands pass (theo `.context/project-config.md`)
- [x] Reviewer độc lập PASS (mức STRICT)
- [x] `.context/progress.json` updated
- [x] Doc Impact reconciled, hoặc ghi `no doc impact`
- [x] Committed

## Files to Create/Modify
- src/fields/slug.ts (localized, tự sinh từ title theo từng locale, unique theo `_locale`)
- src/fields/seo.ts (`@payloadcms/plugin-seo` cấu hình)
- src/fields/status.ts, published-at.ts (tự gán khi xuất bản lần đầu, chỉ đọc ở Must)
- src/fields/author.ts (tự gán, chỉ admin đổi), is-featured.ts (chỉ admin)
- src/fields/translation.ts (`hasEnglish` + group `translation`, chỉ đọc)
- src/collections/_shared/content-defaults.ts (versions `maxPerDoc: 20`, `trash: true`, access isAuthorOrAdmin/publishedOnly)
- src/hooks/revalidate-content.ts (revalidateTag/Path cả vi + en)
- src/hooks/audit-content-delete.ts (`content.delete/restore/purge`)

## Notes
- Mọi collection nội dung sau đều phải dùng factory này; reviewer kiểm tra không có bản sao logic.
- Chưa đăng ký redirect khi đổi slug (task redirects-slug).
- Đọc trước khi code: `SPECIFICATIONS.md` v1.2.2, design doc `docs/specs/2026-10-16-tami-website-design.md`, tài liệu ghi ở Requirements; UI: `.context/design-spec.md` + `skills/react-nodejs/design-tokens.md`.
