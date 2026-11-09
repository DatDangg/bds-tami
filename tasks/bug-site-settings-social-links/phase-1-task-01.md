# bug-site-settings-social-links · phase-1-task-01 — Mạng xã hội: Link trang bắt buộc + chặn trùng (BL-108 + BL-109, QA 27/28)

- Change docs: `spec/changes/2026-11-05-site-settings-social-link-validation.md` (BL-108) + `spec/changes/2026-11-05-site-settings-social-duplicate.md` (BL-109) — gộp 1 task vì cùng field `site-settings.socialLinks`.
- Phụ thuộc: không.
- Trạng thái: `done` — NORMAL PASS round 2 (`.context/review-reports/bug-site-settings-social-links-phase-1-task-01-round-2-review.md`; r1 FAIL: path index chuỗi → kiểm trùng là dead code + mất validate select mặc định). Comment sai về onChange (r2 MINOR) đã sửa lúc close-out.

## Classification / Risk
- Type: **BUG** (validate phía server; schema/DB không đổi).
- Severity: medium.
- Risk: **MEDIUM** — global `site-settings` dùng chung (footer, liên hệ, JSON-LD `sameAs`…); thêm validate có thể chặn lưu bản ghi production đang có dữ liệu trùng (admin phải sửa trước khi lưu tab khác cùng global) → ghi Residual risk + kiểm dữ liệu dev.
- Expected review level: NORMAL (STRICT nếu builder đụng hook/access).
- Doc impact dự kiến: `no doc impact` (không đổi schema/API) — builder xác nhận.

## Root cause (đã chứng minh)
- BL-108: `validateHttpUrl` (`src/globals/SiteSettings.ts:18`) là validate tuỳ biến → thay validate mặc định của Payload nên bỏ mất kiểm `required`; giá trị rỗng trả `true`. Thêm mới để trống: `url` undefined → DB NOT NULL lỗi → toast "Unknown error". Sửa bản ghi cũ xoá link: `""` lưu được. `validateHttpUrl` cũng có thể đang dùng ở field khác (không required) — builder grep, KHÔNG làm field không-required thành bắt buộc.
- BL-109: array `socialLinks` (`src/globals/SiteSettings.ts:130-145`) không có validate trùng.

## Thiết kế fix (quyết định user 2026-11-09)
1. `url` (BL-108): validate kiểm `options.required` (hoặc validate riêng cho field này) → trống / chỉ khoảng trắng báo **"Vui lòng nhập Link trang"** ở cả lần thêm mới lẫn sửa; vẫn giữ kiểm http(s) hiện có. Không còn "Unknown error".
2. Trùng (BL-109): validate ở mức array `socialLinks` (hoặc ở từng field `platform`/`url` dùng `siblingData` + `data`) —
   - **Trùng nền tảng**: mỗi nền tảng tối đa 1 dòng, **trừ "other" (Khác)** được nhiều dòng.
   - **Trùng link sau chuẩn hoá** (mọi nền tảng kể cả "other"): bỏ `www.` ở host, host không phân biệt hoa thường, bỏ `/` cuối path (vd `https://www.instagram.com/tamihomes.test/` ≡ `https://instagram.com/tamihomes.test`). Đặt hàm chuẩn hoá thuần, có unit test (giữ path/query nguyên hoa thường).
   - Lỗi tiếng Việt **tại dòng bị trùng** (dòng xuất hiện sau), vd "Nền tảng Instagram đã có ở dòng 1." / "Link trang trùng với dòng 1." — ưu tiên validate ở field con để lỗi hiện dưới đúng ô (Payload gắn lỗi theo path `socialLinks.<i>.platform` / `.url`), đã có cơ chế mở tab + focus ô lỗi (BL-058).
3. Server-side (chạy cả API/Local API). Không thêm unique index DB (không migration).

## Files
- Sửa: `src/globals/SiteSettings.ts` (+ helper chuẩn hoá có thể ở `src/lib/content/` hoặc `src/globals/site-settings/`), test mới (vd `src/globals/site-settings/social-links.test.ts`).
- KHÔNG đụng: file bẩn ngoài scope, `src/payload-types.ts`, migration.

## Acceptance
- [ ] Thêm mới dòng để trống Link trang → lỗi "Vui lòng nhập Link trang" tại ô, không "Unknown error".
- [ ] Sửa bản ghi cũ xoá Link trang → bị chặn cùng thông báo.
- [ ] 2 dòng Instagram (cùng hoặc khác link) → chặn, lỗi tiếng Việt tại dòng thứ hai.
- [ ] 2 dòng "Khác" link khác nhau → lưu được; 2 dòng "Khác" link trùng sau chuẩn hoá → chặn.
- [ ] Link trùng chỉ khác `www.` / `/` cuối / hoa thường host → chặn.
- [ ] Test hồi quy (fail trước / pass sau) cho từng nhánh + hàm chuẩn hoá; nếu được, test qua Local API `updateGlobal` site-settings.
- [ ] `pnpm typecheck`, `pnpm lint`, vitest liên quan PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Repro Verification
- Original repro: Cài đặt chung > Mạng xã hội — (1) thêm mới trống Link → "Unknown error"; (2) sửa xoá Link → lưu được; (3) 2 Instagram cùng link → lưu được.
- Expected: trống Link -> lỗi "Vui lòng nhập Link trang" tại ô; 2 dòng cùng nền tảng (trừ Khác) hoặc cùng link sau chuẩn hoá -> lỗi tiếng Việt tại dòng sau.
- Actual before: validate tuỳ biến trả true khi rỗng (mất kiểm required) -> "Unknown error" / lưu "" ; không có kiểm trùng.
- Actual after: validateSocialUrl (url) + createValidatePlatform (platform) trong `src/globals/site-settings/social-links.ts`, nối ở `SiteSettings.ts`; zaloUrl/fanpageUrl vẫn dùng validateHttpUrl (không bắt buộc). Attempt 2: `rowIndexFromPath` đọc chỉ số dòng cả khi path là chuỗi ("1", dạng Payload 3.x thật truyền); platform gọi thêm validate mặc định `select` (giá trị lạ -> invalidSelection), url gọi thêm `text` mặc định (maxLength).
- Evidence: `src/globals/site-settings/social-links.test.ts` (path chuỗi là mặc định, +1 case path số, +platform lạ/rỗng); `pnpm vitest run src/globals` 33 PASS; `pnpm typecheck` sạch; eslint file đổi sạch. Integration end-to-end qua Local API `updateGlobal`: `tests/integration/site-settings-social-links.test.ts` (4 test: trống, trùng nền tảng, trùng link chuẩn hoá, nhiều "Khác" lưu được) — **CHƯA chạy được** (Postgres ECONNREFUSED 127.0.0.1:5433, Docker tắt), cần chạy `pnpm vitest run --project integration tests/integration/site-settings-social-links.test.ts` khi có DB.
- Status: PASS (unit-level), integration chưa chạy

## Residual risk
- Dữ liệu staging/prod đang có dòng trùng nền tảng/link hoặc url rỗng -> lần lưu global kế tiếp bị chặn tới khi admin sửa; chưa kiểm dữ liệu dev.
- Chuẩn hoá cũng bỏ khác biệt http/https (coi cùng link) và giữ query/hash; suy luận thêm ngoài spec.
- Chỉ số dòng lấy từ `options.path` (Payload 3.91); chưa xác nhận bằng admin UI thật rằng lỗi gắn đúng ô.
- Test integration updateGlobal đã viết nhưng chưa chạy được (không có DB); chưa chứng minh end-to-end tự động.
- Ghi chú quyết định cho change-request ghi spec: link http và https coi là CÙNG link khi so trùng; query/hash được giữ khi so (khác query = khác link).

## Doc impact
`no doc impact` (không đổi schema/API/payload-types; chỉ validate server).
