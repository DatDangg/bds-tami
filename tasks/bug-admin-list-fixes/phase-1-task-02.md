# bug-admin-list-fixes · phase-1-task-02 — trường tìm kiếm danh sách Leads + Rentals (#03 #04)

- Change doc: `spec/changes/2026-10-19-admin-list-fixes.md` (BACKLOG BL-021, T2). Quyết định đã chốt: Lead tìm theo SĐT + Email; tin thuê tìm theo địa chỉ mở cho mọi tài khoản nội bộ (khớp `readExactAddress` — `isStaff`, `src/collections/Rentals.ts:88`).

## Classification / Risk
- Type: **MODIFY** (mở rộng ô tìm kiếm danh sách admin; không đổi API public/schema)
- Risk: **HIGH → STRICT** — tìm theo PII (SĐT/email lead, BR-32) và địa chỉ chính xác tin thuê (ERD §4.6). Ràng buộc: sale vẫn chỉ thấy lead được giao (`isAssignedOrAdmin` lọc tầng DB) → không dò được lead người khác bằng SĐT; khách không có admin UI, `searchText`/`address` vẫn chặn khách như cũ.
- Không migration: `phoneNormalized` đã có (+ index) từ hook `syncPhoneNormalized` (`src/hooks/leads/sync-phone-normalized.ts`, `src/lib/phone.ts` → E.164 `+84…`).

## Hiện trạng
- `src/collections/Leads.ts:200` `listSearchableFields: ["code", "fullName"]`.
- `src/collections/Rentals.ts` (admin ~dòng 124) chưa khai `listSearchableFields` → chỉ tìm theo `useAsTitle` (`title`).

## Fix (phạm vi)
- Leads: thêm `phone`, `email` vào `listSearchableFields`. Dán `0956789012` / `0956 789 012` / `+84956789012` (và `84956789012`) đều ra lead → khi từ khoá chuẩn hoá được bằng `normalizePhone` thì khớp thêm `phoneNormalized equals <E.164>` (đề xuất: hook `beforeOperation` cho `find`/`count` của leads mở rộng điều kiện `like` trên `phone` bằng `phoneNormalized`, hoặc tương đương — chọn cách đơn giản nhất, ghi lý do). Logic mở rộng là hàm thuần dùng lại được (T3 — export áp đúng cùng tập trường/toán tử).
- Rentals: `listSearchableFields: ["code", "title", "address"]`; gõ `CT-000089` hoặc tên đường ra tin.
- Kiểm thực tế toán tử `like` của adapter postgres (tách từ? hoa thường? dấu?) bằng integration test, không giả định.

## Acceptance
- [ ] Lead: `0956789012`, `0956 789 012`, `+84956789012` đều ra lead có SĐT đó (bất kể SĐT lưu dạng nào); email (một phần) ra lead; mã + họ tên vẫn tìm được.
- [ ] Sale tìm SĐT của lead KHÔNG được giao → không ra (integration test).
- [ ] Rentals: tìm `CT-000089` / tên đường ra tin; tiêu đề vẫn tìm được.
- [ ] Test (unit cho hàm thuần + integration với DB); `pnpm test` / `pnpm lint` / `pnpm typecheck` PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → escalate `architecture_review_needed`.

## Verification summary
- Leads: `listSearchableFields` = code, fullName, phone, email + hook `beforeOperation` (`src/hooks/leads/expand-phone-search.ts`, operation `read`/`count`) gọi hàm thuần `expandLeadPhoneSearch` (`src/lib/leads/phone-search.ts`): nhóm `or` có `phone like <từ khoá>` mà từ khoá `normalizePhone` được thì thêm `{ phoneNormalized: { equals: E.164 } }`. Không migration. Rentals: `listSearchableFields: ["code","title","address"]`.
- Nguồn: `node_modules/payload/dist/utilities/mergeListSearchAndWhere.js` (search -> `{ or: fields.map(f => ({ [f]: { like } })) }`, AND với where khác), dùng ở `@payloadcms/next/dist/views/List/index.js:121`. Hook operation của find là `read` (không phải `find`).
- Quan sát `like` (db-postgres): không phân biệt hoa thường, khớp chuỗi con, tách từ (mọi từ phải có, không cần đúng thứ tự); `phone` lưu nguyên văn nên `like` không khớp dạng gõ khác.
- Test: unit `phone-search.test.ts`; integration `leads.test.ts` (SĐT nhiều dạng, email, sale không dò được lead người khác/chưa giao, đã ẩn danh) + `rentals.test.ts` (mã, địa chỉ, tiêu đề): PASS. unit+ui PASS (Header focus-trap flaky khi chạy cả bộ, PASS khi chạy riêng), lint, typecheck PASS.

## Doc impact / Reconcile
- no doc impact (as-built): không đổi API/schema; tài liệu chưa mô tả tập trường tìm kiếm danh sách admin. Hành vi mới cần ghi ở spec delta khi publish (danh sách Leads tìm theo SĐT mọi dạng + email; Rentals theo mã/tiêu đề/địa chỉ).
## Review
- STRICT PASS round 1 — `.context/review-reports/bug-admin-list-fixes-phase-1-task-02-round-1-review.md`; MINOR-1 đã sửa, MINOR-2/3/4 ghi residual.
## Residual risk
- Tìm một phần SĐT không khớp SĐT lưu có dấu cách (chỉ `like` trên chuỗi gốc).
- REST gửi `OR`/`AND` chữ hoa không được mở rộng SĐT (ít kết quả hơn, không lộ dữ liệu).
- Đường `count` qua hook chưa có integration test riêng.
- Chạy cả bộ unit+ui: `Header.test.tsx` focus-trap flaky (PASS khi chạy riêng), ngoài scope.
