# bug-first-user-avatar-upload · phase-1-task-01 — Ẩn "Ảnh đại diện" ở `/admin/create-first-user` (chưa đăng nhập)

- Nguồn: BL-069 · change doc `spec/changes/2026-10-23-first-user-avatar-upload.md`.
- Không đổi schema (field `avatar` giữ nguyên, chỉ thêm `admin.condition`), không migration, không đổi requirement (as-built PATCH).
- **AUTO PROCEED** (user 2026-10-23): change-request tự quyết phương án đơn giản nhất thoả acceptance.

## Classification / Risk
- Type: **BUG** · severity **low** (màn dùng 1 lần/môi trường; staging + production đã tạo admin xong).
- Scope: 1 field admin UI của collection `staff` (auth collection).
- Root cause category: UI hiện thao tác mà access control chắc chắn từ chối (field condition thiếu).
- Expected review level: **STRICT** (chạm auth collection / quyền tạo media — phải xác nhận KHÔNG nới access).
- Blast radius: `src/collections/Staff.ts` (field `avatar`) + test mới. Form sửa/tạo staff khi đã đăng nhập phải giữ nguyên trường.
- Doc impact: dự kiến `no doc impact` (builder Grep nhanh `docs/DESIGN.md` / `docs/ERD.md` xem có câu mô tả form create-first-user/avatar không).
- Decision impact: none.

## Root cause (file:line đã có — không spawn Explore)
`src/collections/Staff.ts:164-170` — field `avatar` (`type: "upload"`, `relationTo: "media"`) không có `admin.condition` → Payload hiện cả ở màn `/admin/create-first-user` (chưa có `req.user`). Tải ảnh mới từ ô này gọi `POST /api/media`, mà `Media.access.create = isStaff` (`src/access/isStaff.ts:8`, `user?.active === true`) → không có user → 403 "Bạn không có quyền thực hiện thao tác này." (log `tami-app` 07:36:28 / 07:37:29 UTC 2026-10-23).

## Quyết định (AUTO PROCEED)
1. Thêm `admin: { condition: (_data, _siblingData, { user }) => Boolean(user) }` cho field `avatar` (Payload 3.91 `Condition` nhận `{ user }` ở tham số 3). Chưa đăng nhập → field ẩn; đã đăng nhập (mọi vai trò) → hiện như cũ. Giữ comment ngắn lý do (Media.create cần isStaff).
   - Nên tách hàm điều kiện thành export có tên (vd `showWhenLoggedIn` / `avatarCondition` trong Staff.ts hoặc helper nhỏ) để test thẳng — builder chọn cách tối giản.
2. **KHÔNG** đổi `Media.access.create`, `isStaff`, hay access của Staff.
3. Không xử lý riêng "form bị xoá trắng sau submit lỗi mật khẩu ngắn" — đó là hành vi mặc định của Payload create-first-user, ngoài acceptance (ghi Residual). Hết lỗi media thì không còn nguyên nhân mất form do avatar.

## Scope
1. Sửa theo § Quyết định.
2. Test (vitest, TDD — fail trước, pass sau), vd `src/collections/staff-avatar-condition.test.ts`:
   - Tìm field `avatar` trong `Staff.fields`; có `admin.condition`.
   - `condition({}, {}, { user: null/undefined, ... })` → `false` (màn create-first-user).
   - `condition({}, {}, { user: { id, role: "admin", active: true } })` → `true`; sale → `true`.
   - Field vẫn `type: "upload"`, `relationTo: "media"`, giữ `filterOptions` ảnh.
   - (khuyến nghị) khẳng định `Media.access.create` vẫn từ chối khi không có user (không nới quyền).
3. Không sửa intent docs.
4. Verify (`.context/project-config.md`): `pnpm typecheck` · `pnpm lint` · `pnpm test` · `pnpm build`. Nếu có thể, kiểm runtime nhanh rằng condition chạy với `user` null ở create-first-user (không bắt buộc trình duyệt — DB staging/prod đã có admin).

## Acceptance (từ change doc)
- [x] Màn `/admin/create-first-user` không còn ô "Ảnh đại diện" (`admin.condition` theo `user` đăng nhập); form sửa/tạo staff khi đã đăng nhập vẫn có trường này như cũ.
- [x] Không nới quyền tạo media cho người chưa đăng nhập.
- [x] Test cho điều kiện hiển thị trường.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Repro Verification

| Mục | Expected | Actual before fix | Actual after fix | Evidence | Status |
|---|---|---|---|---|---|
| Ô "Ảnh đại diện" ở `/admin/create-first-user` | Ẩn khi chưa đăng nhập; hiện khi đã đăng nhập | `Staff.avatar` không có `admin.condition` → luôn hiện, upload gọi `POST /api/media` → 403 | `condition({}, {}, { user: null })` = `false`, user admin/sale = `true` | `src/collections/staff-avatar-condition.test.ts` (2/4 test FAIL trước fix, 4/4 PASS sau) | PASS (mức unit; chưa kiểm trình duyệt vì staging/prod đã có admin) |

## Verification summary

- Fix: `src/collections/Staff.ts` field `avatar` thêm `admin.condition: (_d, _s, { user }) => Boolean(user)` (+2 dòng). `Media.access.create` / `isStaff` / access Staff KHÔNG đổi (test khẳng định `Media.create` từ chối khi không có user).
- Test mới: `src/collections/staff-avatar-condition.test.ts` (4 test). Trước fix: 2 fail (condition undefined); sau fix: 4 pass.
- `pnpm typecheck`: PASS. `pnpm test`: 4532/4532 PASS. `pnpm build`: PASS.
- `pnpm lint`: FAIL có sẵn, 8 lỗi (6 `no-explicit-any`, 1 `prefer-const`, 1 `no-require-imports` — số đếm do reviewer r1 đính chính) trong thư mục untracked/gitignored ngoài scope (`.import-tmp/*`, `.local-seed/*`), số lỗi giống hệt khi không có thay đổi; `eslint` riêng 2 file scope: sạch.
- Doc impact: `no doc impact` (Grep `docs/DESIGN.md`/`docs/ERD.md`: ERD chỉ ghi `avatar` upload rel→media, schema không đổi).
- Residual: form create-first-user bị xoá trắng sau lỗi mật khẩu ngắn là hành vi mặc định của Payload, ngoài acceptance. Chưa kiểm runtime trình duyệt.

## Review
- Round 1 (2026-10-23): **STRICT PASS** — `.context/review-reports/bug-first-user-avatar-upload-phase-1-task-01-round-1-review.md`. 3 MINOR mở: (1) không có user → validate `avatar` bị bỏ qua (rủi ro rất thấp, không nới quyền); (2) số đếm lint đã đính chính ở trên; (3) `pnpm lint` quét `.local-seed/` gitignored — đề xuất task riêng.
- Doc impact: `no doc impact` (`docs/ERD.md` chỉ ghi avatar upload → media; schema không đổi).
