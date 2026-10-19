Agent: reviewer

# Review — bug-admin-list-fixes · phase-1-task-01 · round 1

> Ghi bởi primary thay reviewer: hook `guard.mjs` chặn reviewer ghi `.context/review-reports/**` khi chạy trong worktree (path tương đối `.claude/worktrees/<wt>/...` không khớp glob). Nội dung nguyên văn report reviewer trả về.

- **Review level:** NORMAL
- **Reason:** helper thuần, không đổi auth/schema/API/DB, 1 caller, có unit test.
- **Blast radius:** `src/lib/translation/admin-ui.ts` (`withTranslationFilter`, `currentTranslationFilter`) → `TranslationStatusFilter.tsx` (không sửa) → bộ lọc "Trạng thái dịch" mọi danh sách admin có nhóm `translation`.

## Verify commands + result
- `pnpm vitest run src/lib/translation/admin-ui.test.ts` → 10/10 PASS
- `pnpm lint` → clean
- `pnpm typecheck` → clean

## Behavior checks
- `{ or: [{ and }] }` 1/nhiều nhánh: áp/đổi/bỏ mục dịch đúng trên mọi nhánh, không mất nhánh/điều kiện.
- `currentTranslationFilter`: chỉ trả key khi mọi nhánh chứa điều kiện; đúng cho `{and}`, phẳng, `{or:[phẳng]}`.
- Dạng cũ (`{ and }`, phẳng, `undefined`) giữ đầu ra `{ and }` — test cũ pass.
- Where lỗi do code cũ sinh ra (`{ and: [{ or }, cond] }`): coi là 1 nhánh, giữ cụm `or`, thay `cond` đúng.
- Test hồi quy fail trước fix (suy luận trên code cũ, khớp builder báo 3/10 fail).

## Findings
- [MINOR] `admin-ui.ts:17` `isTranslationCondition` stringify cả entry → cụm lồng chứa `translation.*` lẫn điều kiện khác bị bỏ cả cụm (trái task file "chỉ bỏ điều kiện lá"). Không ảnh hưởng dạng WhereBuilder chuẩn.
- [MINOR] thiếu test where lồng do code cũ sinh ra.

## Verdict
✅ PASS

## Residual risk
- Chưa chạy trình duyệt xác nhận WhereBuilder đọc lại `{ or: [{ and }] }` sau `refineListData` (rủi ro thấp — dạng chuẩn của Payload).

## Primary follow-up sau PASS (cùng commit)
- Sửa cả 2 MINOR: `isTranslationCondition` chỉ nhận điều kiện lá có mọi khoá `translation.*`; thêm 2 test (where lồng cũ, cụm lồng lẫn điều kiện). `admin-ui.test.ts` 12/12 PASS, `pnpm typecheck` sạch, `eslint src/lib/translation` sạch.
