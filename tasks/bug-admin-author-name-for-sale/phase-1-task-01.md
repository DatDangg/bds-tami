# bug-admin-author-name-for-sale · phase-1-task-01 — Admin: "Người tạo" hiện "Chưa đặt tên - ID" với Sale (BL-082)

- Change doc: `spec/changes/2026-10-27-admin-author-name-for-sale.md` (BACKLOG BL-082, QA bug 7).
- Phụ thuộc: không.
- Trạng thái: `done` — Reviewer STRICT PASS r2 (`.context/review-reports/bug-admin-author-name-for-sale-phase-1-task-01-round-2-review.md`; r1 FAIL N+1). Spec: no spec change (1.59.0), test-scope v85. Doc impact: `docs/PERMISSION.md` §4. User duyệt sửa importMap.js 2026-10-27 ("ok làm đi"); commit chỉ dòng AuthorCell/AuthorField, dòng WardField BL-077 để ngoài.

## Classification / Risk
- Type: **BUG** (admin hiển thị; quyết định user 2026-10-27: hiện tên/email, KHÔNG mở hồ sơ staff khác).
- Risk: **HIGH** — auth/RBAC, lộ dữ liệu staff; `authorField()` dùng ở nhiều collection, gồm collection có API công khai.
- Expected review level: **STRICT**.
- Doc impact: tài liệu PERMISSION §4 nếu mô tả hiển thị author (as-built: Sale thấy tên/email người tạo, không đọc hồ sơ) — builder kiểm.

## Repro
- Sale 1 → `/admin/collections/rentals` cột Người tạo: "Chưa đặt tên - ID: e23c0ba2-…"; tin của chính mình hiện email.

## Root cause
`src/collections/Staff.ts:120` `read: selfOrAdmin` → khi Sale đọc collection, Payload populate `author` (`src/fields/author.ts`, `relationTo: "staff"`) theo access của `staff` → staff khác không đọc được → chỉ còn ID.

## Ràng buộc (quyết định user)
- GIỮ `Staff.access.read = selfOrAdmin`; Sale không mở được `/admin/collections/staff/<id khác>` hay `GET /api/staff/<id khác>`.
- Chỉ lộ tên hiển thị (fullName, fallback email) — không trường khác.
- Khách (không đăng nhập) / API công khai KHÔNG được thấy tên/email staff: field mới phải có `access.read` chỉ staff; kiểm REST/GraphQL/Local API + public queries của site (`src/lib/content/public-queries.ts` …).
- Admin không đổi hành vi.

## Thiết kế fix (đề xuất — builder kiểm, ghi Decision log)
- Ưu tiên giải pháp KHÔNG cần sửa `src/app/(payload)/admin/importMap.js` (dirty của việc khác) và KHÔNG sửa `src/collections/Rentals.ts`/`Projects.ts`/`PropertyPosts.ts` (dirty): vd thêm cạnh `authorField()` một field ảo chỉ đọc (vd `authorName`, `virtual: true`, `access.read` chỉ staff, `afterRead` lấy `fullName || email` của staff qua Local API `overrideAccess: true` + `select` tối thiểu, depth 0, cache theo request để tránh N+1 ở danh sách), hiển thị trong sidebar và làm cột danh sách.
- Nếu buộc phải sửa importMap.js hoặc file collection dirty → DỪNG, báo lại (không tự sửa).
- Kiểm `defaultColumns` của các collection nằm ở đâu; nếu ở file dirty → dừng báo.

## Files
- `src/fields/author.ts`, `src/collections/_shared/content-defaults.ts` (nếu cần), test (unit + integration access trên DB local tami-postgres 5433 đang chạy).

## Acceptance
- [ ] Sale xem danh sách + màn sửa các collection có `author`: thấy tên (fallback email), không còn "Chưa đặt tên - ID".
- [ ] Sale vẫn không truy cập được hồ sơ/API staff khác; chỉ lộ tên/email hiển thị. Khách/API công khai không thấy.
- [ ] Admin không đổi. Test access + hiển thị (integration). typecheck · test · eslint · build PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Decision log
- 2026-10-27 (builder): theo mẫu Leads.assigneeName. `authorField()` thêm `admin.components.Cell/Field` (AuthorCell, AuthorField); field ảo `authorNameField()` (virtual, afterRead `computeAuthorName`, access read isStaff, create/update denyAll) đăng ký cạnh author trong content-defaults ⇒ mọi collection dùng `author` được áp, không sửa file collection nào. Hook CHỈ tính khi `req.user.active===true` vì Local API mặc định overrideAccess:true bỏ qua access.read của field (trang công khai không user ⇒ không lộ). Tra staff overrideAccess + select {fullName,email}, cache theo req.context (1 truy vấn/người tạo). AuthorField: admin (không readOnly) ⇒ RelationshipField mặc định; chỉ đọc ⇒ chữ từ authorName (form tạo mới: tên chính mình). authorName dùng Field `LeadHiddenField` có sẵn để ở trong form state mà không vẽ. Không test "chưa đặt tên" vì staff.fullName required (fallback email là phòng thủ). form-layout.test cập nhật thêm "authorName". generate:types chỉ thêm authorName (payload-types.ts không dirty trước đó). importMap: thêm 2 dòng import + 2 dòng map (AuthorCell, AuthorField); LeadHiddenField đã có sẵn; giữ nguyên dòng WardField BL-077.
- Round 2 (reviewer r1 FAIL): MAJOR-1 cache `computeAuthorName` giờ lưu Promise (afterRead chạy song song); mục reject bị xoá khỏi cache; test spy `payload.findByID`: danh sách ≥5 dòng/2 người tạo ⇒ đúng 2 lần tra staff. MINOR-2: GraphQL qua `handleEndpoints` trả 404 (route GraphQL tách khỏi endpoint) và config thật có `graphQL.disable: true` ⇒ thay bằng test khẳng định config thật tắt GraphQL. MINOR-3: test staff `active:false` không nhận authorName (Local API overrideAccess). MINOR-4: `pnpm payload migrate:create author_name_check` không tạo file nào (`git status migrations` sạch; virtual field không có cột DB) ⇒ không có thay đổi schema; không có file thừa để xoá. Verify: typecheck, unit/ui 800 PASS, integration author-name + access 33 PASS, eslint, build PASS.
- Doc impact: docs/PERMISSION.md §4 hàng author (as-built) đã cập nhật.
- 2026-10-27 (change-request): root cause có file:line → không spawn Explore. Quyết định user trong change doc.

## Repro Verification
- Original repro: Sale 1 mở `/admin/collections/rentals` cột Người tạo (và form sửa, ô Người tạo).
- Expected: tên (fallback email) của người tạo, không "Chưa đặt tên - ID".
- Actual before fix: "Chưa đặt tên - ID: …" cho tin của staff khác (RelationshipProvider gọi /api/staff bằng quyền Sale, read: selfOrAdmin).
- Actual after fix: trình duyệt thật (dev server, sale test): cột hiện "Test admin" 10/10 dòng; ô Người tạo ở form sửa hiện "Test admin" (chữ thường, không link). Admin: vẫn là ô chọn quan hệ (#field-author), không đổi.
- Evidence: tests/integration/author-name.test.ts (6 PASS: sale đọc authorName của người khác; GET /api/staff/<khác> 403/404; khách REST/GraphQL/Local API không có authorName/tên/email; admin populate nguyên hồ sơ; authorName chỉ đọc); AuthorCell/AuthorField unit PASS.
- Status: PASS

## Blocked (change-request 2026-10-27)
- Xác minh cơ chế: cột danh sách dùng `RelationshipProvider` của `@payloadcms/ui@3.91.0` (`dist/elements/Table/RelationshipProvider/index.js`) — **trình duyệt tự gọi** `GET /api/staff?where[id][in]=…` bằng quyền của user → Sale bị `read: selfOrAdmin` chặn → cell hiện "untitled - ID". Ô Người tạo ở màn sửa cũng nạp option qua API staff. ⇒ `afterRead`/field ảo phía server KHÔNG sửa được cột `author` (cột lấy từ client), còn thêm cột mới thì phải đổi `defaultColumns` ở `Rentals.ts`/`Projects.ts`/`PropertyPosts.ts` (dirty) + `News.ts`/`JobPostings.ts`.
- Cách sửa giữ đúng quyết định user (không nới `Staff.read`): khai `admin.components.Cell` + `admin.components.Field` cho `author` ngay trong `src/fields/author.ts` (server component tra `fullName || email` bằng Local API `overrideAccess` + `select` tối thiểu, chỉ khi `req.user` là staff), áp cho mọi collection qua `authorField()` mà không sửa file collection. Payload bắt buộc đăng ký component trong `src/app/(payload)/admin/importMap.js` (sinh bằng `payload generate:importmap`) — file đang dirty (WardField của BL-077).
- Có thể commit tách hunk importMap như BACKLOG (blob HEAD + chỉ dòng BL-082 qua `git update-index --cacheinfo`), working tree giữ cả dòng BL-077 — cần user đồng ý vì ràng buộc batch là "dừng nếu buộc sửa file dở".
