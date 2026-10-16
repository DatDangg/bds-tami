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
- [ ] Slug tự sinh từ `title` của đúng locale khi trống; trùng trong cùng collection + locale → thêm hậu tố; sửa tay được
- [ ] `publishedAt` tự gán lần đầu chuyển `published`, không cho sửa tay (mở ở task hẹn giờ)
- [ ] `author` tự gán người tạo; chỉ admin đổi; `isFeatured` chỉ admin sửa (sale gửi lên bị bỏ qua/403)
- [ ] Sale chỉ update/delete bản ghi của mình (A1); admin tất cả; xoá là xoá mềm, chỉ admin khôi phục/xoá hẳn, mỗi thao tác ghi audit
- [ ] `hasEnglish` + `translation.*` chỉ đọc với mọi người ở Must (logic bật ở task dịch); hook `beforeValidate` chặn bật `hasEnglish` khi thiếu trường EN bắt buộc
- [ ] Hook revalidate gọi cho cả đường dẫn VI và EN (theo `pathnames`), cho chi tiết + danh sách + trang chủ khi `isFeatured`
- [ ] Document locking mặc định của Payload 3 bật (hai người sửa cùng bài)

## Tests cần viết
- Integration trên một collection test nội bộ (`tests/fixtures/test-content`): slug vi/en, trùng slug, author/isFeatured field access, xoá mềm + khôi phục + audit
- Unit: hàm map collection → đường dẫn vi/en cho revalidate

## Verification Plan
- Commands (`.context/project-config.md`): `pnpm install --frozen-lockfile` · `pnpm lint` · `pnpm typecheck` · `pnpm test` · `pnpm build`
- Reviewer report path: `.context/review-reports/build-tami-website-layer-3-task-02-round-<R>-review.md`

## Migration
- Không tạo bảng thật (collection test chỉ dùng trong test, không vào config production). Nếu cần bảng dùng chung thì migration additive.

## Retry / Error Memory
- Attempt: 0
- Last failure type: n/a
- Error memory entry: none
- Escalation: none (3 attempt fail → `architecture_review_needed`)

## Feature Verification
- Acceptance criteria: pending
- Verify commands + result: pending
- Reviewer verdict: pending
- Spec Validator verdict (layer close): pending

## Doc / Decision Impact
- Doc impact result: pending (dự kiến: ERD §1/§1.1 nếu quy ước trạng thái/slug khác thiết kế)
- Decision log: pending

## Commit / Tracking
- Commit gợi ý: `feat(layer-3): task-02 kit` + trailer theo `.agent/workflows/state-commit.md` §2.8
- 1 task = 1 commit; SHA nằm trong git history (không backfill vào file này)
- Progress: `.context/progress.json` → `inProgressTask` = `layer-3/task-02` khi bắt đầu, chuyển vào `completedTasks` khi PASS

## DoD (Definition of Done)
- [ ] Code written (chỉ trong scope)
- [ ] Tests added + pass
- [ ] Check commands pass (theo `.context/project-config.md`)
- [ ] Reviewer độc lập PASS (mức STRICT)
- [ ] `.context/progress.json` updated
- [ ] Doc Impact reconciled, hoặc ghi `no doc impact`
- [ ] Committed

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
