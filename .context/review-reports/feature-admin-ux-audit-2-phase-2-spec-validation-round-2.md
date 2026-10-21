Agent: spec-validator

# Spec validation (pre-plan): feature-admin-ux-audit-2, phase 2 (BL-051 GĐ2), round 2

- Mode: Spec validation, re-check of the round-1 findings (`feature-admin-ux-audit-2-phase-2-spec-validation.md`)
- Inputs: `SPECIFICATIONS.md:75`, `:134` (updated), `tasks/feature-admin-ux-audit-2/phase-2-task-01..06.md` (updated), code at the paths cited below
- Verdict: **PASS (conditional)**. No ❌, no HIGH conflict, 1 ⚠️, which is below the fail threshold. One MEDIUM item (R2-1) must be fixed in P2-T01 before the builder starts A12. Otherwise A12's own acceptance line "sale, dòng của mình: có Xoá" cannot pass.

## Round-1 findings: re-check

| ID | Fix claimed | Evidence | Status |
|---|---|---|---|
| F1 Pages Nhân bản | excluded via `disableDuplicate` | `SPECIFICATIONS.md:134` (A12 "không có ở collection tắt nhân bản — Trang pháp lý `disableDuplicate`"); P2-T01 §2 and acceptance line 22 | ✅ closed |
| F2 row-level rule | collection permission AND per-row author rule; Vietnamese error on server deny; test | `:134` A12; P2-T01 §2 and acceptance line 22 | ⚠️ closed for Sửa. New conflict for Xoá, see R2-1 |
| F3 default column / sale saved columns | shown by default (stated exception to the BL-039 default-columns rule); sale with saved columns accepted | `:134` A12 "hiện mặc định … ngoại lệ của câu BL-039 … chấp nhận" | ✅ closed |
| F4 payload-types comment diff | allowed for A10/A14 | `:134` A10 + A14; P2-T04 line 22; P2-T06 lines 23-24 | ✅ closed. P2-T06 line 18 still says "Kiểm `payload-types.ts` không đổi", which contradicts its lines 23-24 (R2-2, LOW) |
| F5 hasEnglish read-only | reworded | `:134` A11 "vẫn **chỉ đọc**, hệ thống bật như cũ — không thành công tắc sửa được"; matches `src/fields/translation.ts:29,32` | ✅ closed |
| F6 Pages approve button | in the same block | `:134` A11 "(Trang pháp lý) nút 'Duyệt bản tiếng Anh'" | ✅ closed in spec. P2-T05 scope is not re-quoted in its task text (LOW, the spec governs) |
| F7 A11 scope | every collection using the shared translation helper | `:134` A11 "nội dung + Danh mục + Chủ đầu tư…" | ✅ closed |
| F8 line-75 reference | points to the "Thứ tự các khối" field | `SPECIFICATIONS.md:75`; field label is "Thứ tự các khối" at `src/globals/Homepage.ts:246`; P2-T06 decisions | ✅ closed |
| F9 no new flags | noted | P2-T06 "Quyết định" line 32 | ✅ closed |
| F10 trash view | in spec | `:134` A12 "ẩn ở chế độ xem Thùng rác" | ✅ closed |

## New findings

### R2-1 — MEDIUM — A12 "Xoá" for sale: the list permission says no, the per-row rule says yes
- Spec `:134` and P2-T01 §2 require Xoá to show only when the Payload collection permission allows delete (`useAuth().permissions`, "delete→Xoá") **and** the per-row author rule passes. Acceptance line 22 expects a sale user to see Xoá on their own rows.
- Code: `src/collections/_shared/content-defaults.ts:80-83`
  ```ts
  const deleteAccess: Access = (args) => {
    const isSoftDelete = args.data?.deletedAt != null;
    return isSoftDelete ? isAuthorOrAdmin(args) : isAdmin(args);
  };
  ```
  Payload computes collection-level permissions without `data`, so this resolves to `isAdmin` → `permissions.collections.<slug>.delete` is `false` for sale. The server would still allow a sale user to soft-delete (move to Thùng rác) their own row. The UI rule as written would hide Xoá from sale everywhere.
- Fix in P2-T01 (and one clause in spec A12), pick one:
  - (a) For soft delete, show Xoá when the per-row rule matches (`rowData.author` = current user, or admin). Do not gate on `permissions.delete`, because that flag reflects hard delete only.
  - (b) Keep the AND rule and change the acceptance to "sale không có Xoá ở danh sách". This matches Payload's own view, if Payload also hides trash there for sale. The builder should check this in the browser and record it.
  The builder must record which one was used and why in the task's "Quyết định" section.
- Services and Pages have admin-only `create/update/delete` (`Services.ts:41`, `Pages.ts:34`). Sale sees no buttons there. Consistent.

### R2-2 — LOW — P2-T06 step 3 contradicts its own acceptance
`phase-2-task-06.md:18` says "Kiểm `src/payload-types.ts` không đổi". Lines 23-24 allow a comment-only diff. Align step 3 to "chỉ đổi chú thích". This does not block; the acceptance line governs.

### R2-3 — INFO (residual risk) — `author` must be present in `rowData`
The per-row rule reads `author` from the list row without fetching. This works if the list query returns full documents, which is Payload 3.91's default when the select-API option is off. `author` may arrive as an ID or as a populated object, depending on `depth`. P2-T01's tests should cover both shapes.

## Conflict check against the remaining FR-ADM-19 text
No new silent contradictions. The BL-039 default-columns exception is now explicit. The A13 consequence for sale is now explicit and accepted. A11 now agrees with BL-042: `hasEnglish` stays read-only and the hidden system fields are kept.

## Conditions to proceed
1. R2-1: decide (a) or (b) in P2-T01, plus one clause in spec A12, before the builder implements A12.
2. R2-2: one-word fix in P2-T06 step 3 (optional).
