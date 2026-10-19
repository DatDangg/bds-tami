# bug-admin-list-fixes · phase-1-task-01 — đổi "Trạng thái dịch" xoá bộ lọc khác (#01)

- Change doc: `spec/changes/2026-10-19-admin-list-fixes.md` (BACKLOG BL-021, T1)

## Classification / Risk
- Type: **BUG** (bộ lọc khác của danh sách bị mất khi đổi mục Trạng thái dịch — FR-ADM-18 yêu cầu giữ điều kiện khác)
- Risk: **MEDIUM** — helper dùng chung cho mọi danh sách có bộ lọc dịch (projects, rentals, property-posts, news, services, job-postings, pages, categories, developers). Không đổi schema/API, không migration.
- Phạm vi: CHỈ `src/lib/translation/admin-ui.ts` + test. **Không** sửa `src/components/admin/TranslationStatusFilter.tsx` (BL-016 đang sửa song song).

## Repro
Danh sách Cho thuê: thêm bộ lọc `Trạng thái = Đã xuất bản` + `Giá thuê >= 50.000.000` (WhereBuilder ghi URL `where[or][0][and][0]…`) → chọn một mục Trạng thái dịch → đổi sang mục khác → chỉ còn điều kiện dịch.

## Root cause (đã chứng minh bằng đọc code)
`src/lib/translation/admin-ui.ts:19-35` — `andEntries` chỉ tách được `{ and: [...] }` một khoá. WhereBuilder của Payload ghi `{ or: [{ and: [...] }] }` → cả cụm `or` thành 1 entry. Lần chọn đầu: kết quả `{ and: [{ or: [...] }, cond] }`. Lần đổi tiếp: entry `{ or }` chứa chuỗi `"translation.` (khi WhereBuilder đã gộp) hoặc dạng lồng khiến `isTranslationCondition` loại cả cụm → mất mọi điều kiện khác. `currentTranslationFilter` cũng không nhận mục đang chọn khi điều kiện nằm trong nhánh `or[i].and`. Test hiện chỉ phủ dạng `{ and }`.

## Fix (phạm vi)
- Chuẩn hoá `where` thành danh sách nhánh (mỗi nhánh = mảng điều kiện AND): `{ or: [{ and }...] }` → nhiều nhánh; `{ and }` / điều kiện phẳng → 1 nhánh.
- `withTranslationFilter`: trong **từng nhánh** bỏ điều kiện dịch (chỉ điều kiện lá có khoá `translation.*`, không loại cả cụm), thêm điều kiện của `key` vào từng nhánh. Giữ dạng đầu ra mà WhereBuilder hiểu (`{ or: [{ and }] }` khi đầu vào là dạng `or`; dạng `{ and }` giữ như cũ để test cũ vẫn đúng).
- `currentTranslationFilter`: trả `key` khi mọi nhánh đều chứa đúng điều kiện của `key`; ngược lại `""`.

## Acceptance
- [ ] Dạng `{ or: [{ and }] }` 1 nhánh và nhiều nhánh: đổi/bỏ mục dịch giữ mọi điều kiện khác, không mất nhánh.
- [ ] `currentTranslationFilter` nhận đúng mục ở mọi dạng (and, or-1-nhánh, or-nhiều-nhánh, phẳng).
- [ ] Test hồi quy viết TRƯỚC (fail trước fix, pass sau fix); test cũ vẫn pass.
- [ ] `pnpm test` / `pnpm lint` / `pnpm typecheck` PASS (build ở close-out cuối change).

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → escalate `architecture_review_needed`.

## Verification summary
- Files: `src/lib/translation/admin-ui.ts`, `src/lib/translation/admin-ui.test.ts`.
- Thiết kế: `toBranches` chuẩn hoá where thành các nhánh OR (mỗi nhánh = mảng điều kiện AND); `{ or: [{and}...] }` → nhiều nhánh, `{ and }`/phẳng → 1 nhánh. `withTranslationFilter` bỏ/thay điều kiện dịch trong từng nhánh (lọc điều kiện lá); đầu vào dạng `or` → đầu ra `{ or: [{ and }] }`, còn lại `{ and }` như cũ. `currentTranslationFilter` trả key khi mọi nhánh đều chứa điều kiện của key.
- Test trước fix: 3/10 FAIL (or 1 nhánh, or nhiều nhánh, phẳng/or-điều-kiện-trần); test cũ pass. Sau fix: 10/10 PASS.
- Verify: vitest unit+ui 1964 passed; `pnpm lint` sạch; `pnpm typecheck` sạch.

## Doc impact / Reconcile
- no doc impact: không đổi API/schema/ERD; FR-ADM-18 (giữ điều kiện khác khi lọc dịch) là intent sẵn có, code nay khớp.
## Review
- NORMAL PASS round 1 — `.context/review-reports/bug-admin-list-fixes-phase-1-task-01-round-1-review.md`; 2 MINOR đã sửa trong cùng commit (12/12 test).
## Residual risk
- Chưa thử trên trình duyệt việc WhereBuilder đọc lại `{ or: [{ and }] }` sau `refineListData` (dạng chuẩn của Payload, rủi ro thấp).
