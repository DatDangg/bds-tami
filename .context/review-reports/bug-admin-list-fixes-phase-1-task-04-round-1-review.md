Agent: reviewer

# Review — bug-admin-list-fixes · phase-1-task-04 · round 1

> Ghi bởi primary thay reviewer (hook `guard.mjs` chặn reviewer ghi `.context/review-reports/**` trong worktree). Tóm lược trung thực report reviewer trả về.

- **Review level:** STRICT
- **Reason:** hook `beforeOperation` mới trong `withContentDefaults` đổi locale mặc định của REST đọc cho 9 collection; đổi config field dùng chung (seo, translation, slug) cho 5 collection.
- **Blast radius:** REST `find`/`findByID` không `?locale` trên projects, rentals, property-posts, news, categories, developers, services, pages, job-postings → trường localized trả VI thay vì `null`. WhereBuilder admin 5 collection. Không ảnh hưởng Local API (`createLocalReq.js:70-71` đã đặt defaultLocale), trang public, endpoint tuỳ biến, preview, job dịch; `findVersions`/`count`/`findDistinct` không phải `read` nên hook bỏ qua.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm vitest run src/lib/admin src/lib/translation` | PASS 98/98 |
| `pnpm vitest run tests/integration/{projects,rentals,content-defaults,public-queries,locale-counterpart,translate-content}.test.ts` | PASS 6 file / 138 test |
| `pnpm lint` | PASS |
| `pnpm typecheck` | PASS |

## Checks
1. Hook chỉ `read`, chỉ khi `req.locale` rỗng; `en`/`all`/locale lạ giữ nguyên; không đặt `fallbackLocale` (BR-07 giữ). `find.js:37`/`findByID.js:32` đọc `req.locale` sau `beforeOperation` → an toàn. MINOR: populate depth>0 từ collection ngoài hook có thể để `req.locale='vi'` trên req dùng chung — chấp nhận được.
2. Collection localized ngoài hook: chỉ Media (không dùng làm bộ lọc quan hệ) → residual. Provinces/wards/staff không localized.
3. `disableListFilter` chỉ WhereBuilder đọc (`@payloadcms/ui` `Condition/index.js`), server không đọc → không chặn T1/T3/quyền. Điều kiện `translation.*` từ T1 hiện thành hàng disabled trong panel Bộ lọc.
4. Bảng giữ/ẩn khớp change doc (Leads ẩn fullName/phone/email — đã tìm qua ô tìm kiếm T2; rentals ẩn address — T2 tìm được, lọc vị trí qua tỉnh/phường).
5. Test: integration REST không locale → VI, `vi`/`en`/`all` không đổi, `find` → VI (fail khi tắt hook); unit so tập trường lọc từng collection với bảng.

## Findings
- [MINOR] `list-filter.ts:9-15` JSDoc của `hideTechnicalListFilters` đặt trên hằng → **đã sửa**.
- [MINOR] mảng `["address","scale"]` thiếu dấu cách; import `list-filter` sai thứ tự ABC ở `Projects.ts` → **đã sửa**.
- [MINOR] helper test `filterablePaths` bỏ tiền tố tab có tên → **đã sửa** (thêm tiền tố như hàm thật).

## Verdict
✅ PASS

## Residual risk
- Media localized vẫn `null` khi REST không locale (không ảnh hưởng bộ lọc hiện tại).
- Hàng `translation.*` disabled trong panel Bộ lọc — primary đã kiểm trình duyệt: nút xoá hàng hoạt động, dropdown "Trạng thái dịch" về "Tất cả", điều kiện khác giữ nguyên.
- `id` / "Đã Xoá Lúc" của Payload vẫn trong danh sách lọc.
- Tìm không dấu trong bộ lọc quan hệ chưa làm (tuỳ chọn).
