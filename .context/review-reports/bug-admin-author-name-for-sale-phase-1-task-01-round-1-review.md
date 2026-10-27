Agent: reviewer

# Review — bug-admin-author-name-for-sale · phase-1-task-01 · round 1 (BL-082)

- Review level: **STRICT**
- Reason: auth/RBAC (Staff.read = selfOrAdmin phải giữ), lộ dữ liệu staff (tên/email) qua API công khai, shared field `authorField()` dùng ở nhiều collection (rentals, projects, property-posts, news, job-postings), API response shape mới (`authorName`).
- Blast radius: `src/fields/author.ts` (mọi collection qua `withContentDefaults`), `src/collections/_shared/content-defaults.ts`, REST/GraphQL/Local API của 5 collection nội dung, admin list + edit view (AuthorCell/AuthorField), `importMap.js` (2 import + 2 map của BL-082; dòng WardField BL-077 ngoài scope), `payload-types.ts`, `docs/PERMISSION.md` §4. Collection omit `author` (Developers, Categories, Pages, Services) bỏ cả `authorName` vì cùng khóa `"author"` trong `buildSharedFields`.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm vitest run src/components/admin src/fields src/lib/admin src/collections` | PASS — 95 files / 800 tests |
| `pnpm vitest run tests/integration/author-name.test.ts tests/integration/access.test.ts` | PASS — 2 files / 31 tests (DB local, không skip) |
| `pnpm eslint <8 file đổi/mới>` | PASS (exit 0, không cảnh báo) |
| `pnpm build` | PASS (exit 0) |
| Migration | Không chạy `migrate:create` (lệnh tạo file migration vào source — reviewer không được ghi source; không xác nhận được cờ dry-run). Lập luận: `virtual: true` không sinh cột trong schema drizzle của Payload; diff không có file `src/migrations/*`; integration test dựng DB mới bằng schema của config PASS. Ghi residual risk. |

## Kiểm theo yêu cầu
1. **Khách/API công khai**: REST/GraphQL bị chặn bởi `access.read: isStaff` (isStaff = `user?.active === true`). Local API không user (overrideAccess mặc định) → hook trả `undefined` ngay đầu (`req.user?.active !== true`) nên field không có giá trị. Grep `src/lib` và `src/app`: không có `payload.auth(` / `draftMode(` / truyền `user:` ở query trang công khai; không endpoint custom nào `req.payload.find*` 5 collection rồi trả ra ngoài. ISR/unstable_cache/sitemap đều render không user → không thể cache tên staff. Search SQL thô không đọc field ảo. **OK**.
2. **Sale không đọc hồ sơ staff khác**: `Staff.read` không đổi; test REST `/api/staff/<khác>` 403/404 + Local API reject; doc tin của người khác không chứa email người tạo khi có fullName. Chỉ lộ `fullName || email` (đúng quyết định user). **OK**.
3. **Inactive/khoá**: hook + `isStaff` đều đòi `active === true`. Chưa có test riêng cho sale bị khoá (MINOR-3).
4. **N+1/cache**: cache theo `req.context` → không rò giữa request/user (giá trị không phụ thuộc người gọi). **NHƯNG không khử trùng truy vấn đồng thời** — xem MAJOR-1.
5. **Admin**: AuthorField `!readOnly` → `RelationshipField` mặc định; `author.access` create/update vẫn `isAdmin`; Sale readOnly → chữ thường, không link. `authorName` create/update `denyAll`, test ghi đè bị bỏ qua. **OK**.
6. **Collection**: đăng ký trong cặp `["author", [authorField(), authorNameField()]]` → mọi collection có author được áp, omit `author` bỏ cả hai. **OK**.
7. **payload-types**: chỉ thêm `authorName?: string | null` (5 interface) + `authorName?: T` (5 Select). **OK**.
8. **Test**: phần lớn có ý nghĩa; GraphQL test yếu (MINOR-2), thiếu test dedupe truy vấn (đi kèm MAJOR-1).

## Responsive Checklist Gate
Diff có đụng UI admin (AuthorCell/AuthorField) nhưng chỉ đổi nội dung chữ trong cell/ô sidebar có sẵn, dùng lại class `tami-readonly-field` (`_forms.scss:276`) như LeadFormDisplay; không thêm layout/CSS/media.
- Layout (horizontal scroll/grid/container): N/A — không đổi CSS/layout.
- Typography/Spacing: N/A — dùng lại class sẵn có.
- Media: N/A.
- Touch/Interaction: N/A — chữ chỉ đọc, không thêm control; cell vẫn bọc `LinkedCell` như các cột khác.
- Viewport/A11y: N/A — không có 100vh/animation mới.
Residual: không chạy browser; builder báo đã kiểm trình duyệt thật (sale + admin).

## Skill gates
- aislop: skip, `aislop` không cài.
- oxlint (anti-slop): skip, oxlint not configured (không có `.oxlintrc*`); eslint PASS thay thế.
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK — tên rõ (`computeAuthorName`, `authorNameField`), hàm ngắn (< 20 dòng), indirection ≤ 2, comment giải thích WHY (overrideAccess bỏ qua field access), doc PERMISSION cập nhật. 0 indicator.
- ai-friendly-web: N/A — admin nội bộ.
- blitzstrike: skip, không cài/không môi trường pentest được phép; đã thay bằng kiểm tay đường REST/GraphQL/Local API.

## Findings

### [MAJOR-1] Cache theo request không chặn N+1 thật — mỗi dòng vẫn 1 truy vấn staff
`src/fields/author.ts:23-27`
```ts
if (!cache.has(author)) {
  const staff = await req.payload.findByID({ ... });
  cache.set(author, ...);
}
```
Payload chạy `afterRead` cho các doc **song song** (`node_modules/payload/dist/collections/operations/find.js:233` `await Promise.all(result.docs.map(async (doc)=>afterRead(...)))`). Mọi hook kiểm `cache.has` trước khi truy vấn đầu tiên kịp `cache.set` → danh sách 10–100 dòng cùng người tạo vẫn bắn 10–100 `findByID`. Decision log ghi "1 truy vấn/người tạo" là không đúng; yêu cầu review (4) không đạt.
Fix: cache **Promise** thay vì giá trị, vd
```ts
const cache = (req.context.authorName ??= new Map<string, Promise<string | null>>()) as Map<string, Promise<string | null>>;
let pending = cache.get(author);
if (!pending) {
  pending = req.payload.findByID({ ... }).then((s) => s?.fullName || s?.email || null);
  cache.set(author, pending);
}
return pending;
```
và thêm test: find nhiều tin cùng author với user staff (depth 0 hoặc Sale đọc tin người khác), spy `payload.findByID` (collection staff) đếm đúng 1 lần/author.

### [MINOR-2] Test GraphQL có thể pass rỗng
`tests/integration/author-name.test.ts:145-155` chỉ kiểm body không chứa "Sale Hai" — nếu query sai tên/GraphQL tắt/lỗi schema thì vẫn pass. Assert thêm `status 200`, không có `errors`, `data.JobPosting.id === jobByOther` và `authorName` null.

### [MINOR-3] Thiếu test staff bị khoá
Chưa có case user `active: false` (Local API `user` khoá, `overrideAccess: false`) → `authorName` vắng. Logic đúng theo code nhưng là nhánh bảo mật chính của hook; nên khoá bằng test.

### [MINOR-4] Residual — migration chưa kiểm bằng công cụ
Chưa chạy `payload migrate:create` (sẽ ghi file source). Builder nên chạy `pnpm payload migrate:create` trên DB đã migrate tới HEAD để xác nhận "No schema changes" (rồi không giữ file nếu rỗng) và ghi evidence vào task.

## Repro closure
Repro Verification `Status: PASS`, evidence integration test 6 PASS (reviewer chạy lại PASS) + kiểm trình duyệt của builder. Bug gốc được chứng minh đã hết ở tầng dữ liệu; phần hiển thị cell/field có unit test. Chấp nhận.

## Verdict: FAIL
Lý do: MAJOR-1 (cache không khử N+1 đồng thời, trái claim thiết kế + yêu cầu review). Bảo mật/RBAC đạt. Sau khi sửa MAJOR-1 (+ test đếm truy vấn) và MINOR-2/3 nên sửa cùng, round 2 có thể FAST/NORMAL trên phạm vi `src/fields/author.ts` + test.
