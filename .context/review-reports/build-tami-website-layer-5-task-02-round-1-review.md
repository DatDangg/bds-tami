Agent: reviewer

# Review — build/tami-website · layer-5-task-02 · round 1

- Task: `tasks/tami-website/layer-5-task-02.md` (services + pages pháp lý + đồng bộ `privacyPolicyVersion`, + AC slugField `beforeDuplicate` chuyển từ L5-T01)
- Diff: working tree vs HEAD `2db5a79` (tracked + untracked). Ngoài scope: `.context/progress.json`, `.context/runs/*`, `tasks/tami-website/layer-5-task-01.md`.

## Review level
**STRICT**

## Reason
Schema + migration mới (8 bảng + enum + FK + 2 cột trên `payload_locked_documents_rels`); quyền chỉ admin (PERMISSION §3.1/§4); `consentVersion` (dữ liệu cá nhân, BR-30) ghi bằng `overrideAccess`; sửa field dùng chung `slugField` (ảnh hưởng mọi collection nội dung); mở allowlist truy vấn công khai.

## Blast radius
- `src/fields/slug.ts` (shared): mọi collection dùng `withContentDefaults` có slug — hiện `developers`, `services`; `categories`/`pages` có `disableDuplicate: true` nên hook không chạy.
- `src/collections/{Services,Pages}.ts`, `src/hooks/pages/*`, global `site-settings.privacyPolicyVersion` (consentVersion của form lead/hồ sơ ở layer sau).
- `src/lib/content/public-queries.ts` (`PublicCollectionSlug` + services, pages), `content-paths.ts` (`LEGAL_PAGE_ROUTES`), export `isFilled`/`isPubliclyVisible` (không đổi hành vi).
- DB: migration `20261017_092524_services_pages` (additive).
- Seed: `seed/pages.ts`, `seed/sample/services.ts`, scripts + `package.json`.

## Verify commands + result (tự chạy lại)
| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | OK |
| `pnpm lint` | OK (0 lỗi) |
| `pnpm typecheck` | OK |
| `pnpm test` | 79 files / 857 tests PASS |
| `pnpm build` | OK |
| `pnpm payload migrate:status` | skip — không nằm trong verify commands được allow (project-config: migration không auto-allow). Dựa vào: đọc file migration (up chỉ CREATE TABLE/TYPE/INDEX + ADD COLUMN nullable + ADD FK trên bảng mới / cột mới; không DROP/đổi type/SET NOT NULL trên dữ liệu cũ) + evidence builder (applied batch 11, `migrate:create` lần 2 không sinh file) |

## Responsive Checklist Gate
N/A — diff không đụng route/component/CSS (chỉ collection/hook/seed/migration backend).

## Skill gates
- aislop: skip, `aislop` không cài trong môi trường.
- oxlint (anti-slop): skip, oxlint not configured (không có `.oxlintrc.json`); thay bằng `pnpm lint` (eslint) + `pnpm typecheck` PASS.
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK — tên rõ (`lockPageKind`, `syncPrivacyPolicyVersion`, `createRevalidatePage`, `requiredByLocale`), các hàm ngắn (< 50 dòng), file < 300 dòng (trừ file test/migration sinh tự động), comment giải thích WHY (BR-30, transaction, overrideAccess), không magic number, ERD §4.9b đã cập nhật. 0 indicator.
- ai-friendly-web: N/A (không đụng trang public).
- blitzstrike: skip, không cài/không có môi trường pentest được phép.

## Kiểm theo yêu cầu primary
1. **slugField `beforeDuplicate`** (`src/fields/slug.ts:108-123`): trả `undefined` cho mọi locale → `beforeValidate` sinh lại từ tiêu đề + hậu tố (`phan-phoi-2`, `vinhomes-2`; test `services-pages.test.ts:206-231`). Không ảnh hưởng `categories` (scopeSlug) vì `Categories.ts:25 disableDuplicate: true`; `pages` cũng `disableDuplicate`. Bản gốc giữ nguyên slug (test dòng 220-221). Slug locale khác (en) của bản sao bị để trống chứ không lộ/đổi sai — xem MINOR-3.
2. **Quyền**: `Services.ts:38`, `Pages.ts:27` ghi đè `create/update/delete: isAdmin` (ghi đè cả `deleteAccess` → sale không xoá mềm được). Đọc vẫn `makePublishedOnly`. Test: sale create/update/delete/soft-delete → 403 (Local `overrideAccess:false`; REST dùng cùng access functions). Khách: chỉ published, EN cần `hasEnglish` (test dòng 355-390). OK.
3. **pages kind khoá**: DB UNIQUE `pages_kind_idx`, field `access.update: denyAll`, `lockPageKind` ép lại cả khi `overrideAccess` (test 273-278); kind trùng với bản xoá mềm vẫn bị chặn (267-271). OK.
4. **Privacy sync BR-30**: `versions.drafts: false` (`content-defaults.ts:139`) → `_v` chỉ là lịch sử phiên bản, không có bản nháp riêng; afterChange luôn là bản đang lưu, nên chỉ trạng thái `published` thật mới ghi. `kind` unique → tối đa 1 bản privacy. Ghi cùng `req` (cùng transaction), bỏ qua khi version không đổi, gỡ xuất bản/ẩn/xoá giữ nguyên (đã ghi ERD §4.9b). Khôi phục từ thùng rác bản published → đồng bộ lại (hợp lệ). `privacyPolicyVersion` vẫn denyAll khi sửa tay (test 346). OK.
5. **siteName chặn publish privacy**: xem MINOR-1 (fail-safe, không lệch consent → không MAJOR).
6. **`hasEnglish` readOnly UI**: xem MINOR-2 — nút duyệt EN cho pages thuộc `layer-10-task-02` AC dòng 41 ("admin bấm duyệt → hasEnglish=true"), field access đúng theo AC của task này → MINOR.
7. **Revalidate pages**: `revalidate-page.ts` dùng `LEGAL_PAGE_ROUTES` (khoá `pathnames` `/chinh-sach-bao-mat`, `/dieu-khoan-su-dung`) → `/vi/...`, `/en/...`; chạy khi doc hoặc previousDoc đang công khai + afterDelete. Test 318. OK.
8. **Seed prod**: `seedLegalPages` chỉ tạo nháp, bỏ qua kind đã có (kể cả trash), không ghi đè — an toàn prod. `seed-sample-services` không có guard production — MINOR-4.
9. **Migration khớp config**: additive; down chuẩn. OK (migrate:status không chạy được, xem Residual risk).

## Findings

### [CRITICAL]
Không có.

### [MAJOR]
Không có.

### [MINOR]
- **MINOR-1** `src/hooks/pages/sync-privacy-version.ts:22-29` — Nếu `site-settings` chưa từng lưu `siteName` (môi trường mới), `updateGlobal` lỗi validate → cả thao tác xuất bản privacy bị rollback với thông báo về `siteName` khó hiểu cho admin đang ở màn Pages. Hành vi fail-safe (không có consentVersion lệch), nên không chặn. Đề xuất: bắt lỗi và ném `ValidationError` rõ ("Cần nhập Tên website trong Cài đặt chung trước khi xuất bản chính sách bảo mật"), hoặc ghi vào runbook go-live thứ tự: điền site-settings trước khi publish privacy.
- **MINOR-2** `src/fields/translation.ts:17` (`admin.readOnly: true`) + `src/collections/Pages.ts:60` — field access cho admin đúng, nhưng checkbox `hasEnglish` vẫn disabled trong admin UI → admin chỉ bật được qua API. Đã có chủ ở `layer-10-task-02` (nút duyệt bản dịch). Đề xuất: ghi rõ phụ thuộc này trong task file (Residual) để L10-T02 không quên; hoặc `withFieldAccess` tắt `admin.readOnly` khi override `update`.
- **MINOR-3** `src/fields/slug.ts:112` / test `services-pages.test.ts:217-219` — bản sao chỉ sinh lại slug của locale request (`vi`); slug `en` để `null`. Với Duplicate qua admin (`overrideAccess:false`) `hasEnglish` bị strip (create denyAll) nên an toàn; nhưng Duplicate bằng Local API `overrideAccess:true` từ bản có `hasEnglish=true` có thể tạo bản `hasEnglish=true` + slug en rỗng (đi vòng hook kiểm EN?). Hiện không có caller nào. Đề xuất: thêm assert `slugs.en` (null) và `hasEnglish === false` trên bản sao để khoá hành vi.
- **MINOR-4** `scripts/seed-sample-services.ts:1` — chỉ có comment "Không chạy ở production", không guard. Hậu quả nhỏ (3 bản nháp không công khai). Đề xuất: thoát sớm khi `NODE_ENV==="production"`/`APP_ENV==="production"` trừ khi có cờ rõ.
- **MINOR-5** (residual builder, ghi nhận) — Services không làm mới thẻ ở trang chủ khi lưu; services/pages không có `publishedAt` → FR-ADM-16 phải loại trừ (đã ghi Decision log). Trang chủ chưa tồn tại (layer 6) → theo dõi ở task trang chủ.

## Residual risk
- Không tự chạy `migrate:status`/drift check (không trong allowlist) — dựa vào đọc file migration + evidence builder.
- Không chạy admin UI/browser: MINOR-2 xác minh bằng đọc config.
- Dockerfile chưa COPY `seed/` (builder nêu; thuộc AC L6-T01).

## Verdict
**PASS** — không CRITICAL/MAJOR; 8/8 AC có code + test, verify commands PASS. Các MINOR đề xuất xử lý/ghi nhận, không chặn commit.
