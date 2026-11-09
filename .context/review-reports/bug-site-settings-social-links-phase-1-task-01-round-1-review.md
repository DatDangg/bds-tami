Agent: reviewer

# Review — bug-site-settings-social-links · phase-1-task-01 · round 1 (BL-108 + BL-109)

- Review level: **NORMAL**
- Reason: validate server-side cho 1 array field của global `site-settings`; không đụng schema/migration/auth/access/hook. Shared global nhưng chỉ thêm validate field con.
- Blast radius: `src/globals/SiteSettings.ts` (global `site-settings`, field `socialLinks.platform` / `socialLinks.url`), file mới `src/globals/site-settings/social-links.ts` (+ test). Ảnh hưởng mọi lần lưu global site-settings (admin + REST/Local API). Không đổi payload-types/DB.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/globals` | PASS — 5 files, 30 tests |
| `pnpm typecheck` | PASS (tsc --noEmit, không lỗi) |
| `pnpm exec eslint src/globals/SiteSettings.ts src/globals/site-settings/social-links.ts src/globals/site-settings/social-links.test.ts` | PASS (exit 0) |

## Findings

### [CRITICAL] Kiểm trùng (BL-109) không bao giờ chạy trong Payload thật — path segment là string, không phải number
- `src/globals/site-settings/social-links.ts` `rowIndexFromPath`: `path?.find((segment) => typeof segment === "number")`.
- Payload 3.91 truyền path dạng **chuỗi đã split**:
  - Server save: `node_modules/.../payload/dist/fields/hooks/beforeChange/promise.js:34` `const pathSegments = path ? path.split('.') : [];` → `path: pathSegments` (dòng 120) → `["socialLinks", "1", "platform"]`.
  - Admin form-state (validate khi onChange/submit): `@payloadcms/ui/dist/forms/fieldSchemasToFormState/iterateFields.js:66` cũng `path.split('.')`.
- Hệ quả: index luôn `-1` → `slice(0, Math.max(-1, 0))` = `[]` → cả `createValidatePlatform` lẫn phần trùng link của `validateSocialUrl` **luôn trả true**. Repro (3) "2 Instagram cùng link → lưu được" vẫn còn nguyên. Chỉ phần BL-108 (required) hoạt động.
- Test là false-confidence: helper `run` trong `social-links.test.ts` truyền `path: ["socialLinks", index, name]` với `index` là number — không phải contract thật.
- Fix: parse segment số cả dạng string, vd `const seg = path?.[1]; const i = typeof seg === "number" ? seg : Number.parseInt(String(seg), 10);` (hoặc tìm segment đầu khớp `/^\d+$/` sau `"socialLinks"`); sửa test truyền path dạng string (`["socialLinks", "1", "url"]`) đúng như Payload, thêm 1 case number nếu muốn giữ tương thích. Nên thêm test tích hợp nhẹ gọi `field.validate` qua config đã sanitize hoặc Local API nếu có DB.

### [MAJOR] Custom validate trên select `platform` làm mất validate mặc định (kiểm giá trị thuộc options)
- `src/globals/SiteSettings.ts:142` thêm `validate: createValidatePlatform(...)`. Payload chỉ gán validate mặc định khi `field.validate === undefined` (`payload/dist/fields/config/sanitize.js:153-159`), nên kiểm "giá trị nằm trong options" của select bị bỏ.
- Hệ quả: API/Local API gửi `platform: "foo"` không còn bị chặn 400 ở tầng validate → rơi xuống DB enum → lỗi 500/"Unknown error" (đúng loại lỗi task đang muốn loại bỏ). Regression nhỏ về exposure (admin UI chỉ chọn được option hợp lệ) nhưng là mất guard server có sẵn.
- Fix: trong validator kiểm `labels`/`SOCIAL_PLATFORMS` chứa `value` (báo "Nền tảng không hợp lệ"), hoặc gọi validator `select` mặc định của Payload trước rồi mới kiểm trùng.

### [MINOR] Evidence repro chưa kiểm chứng được nhánh trùng
- Task ghi `Status: PASS (unit-level)` nhưng unit test dùng contract path sai (xem CRITICAL) → evidence BL-109 không chứng minh bug đã hết. Sau fix cần test với path dạng string thật.

### Đánh giá 2 điểm builder tự thêm ngoài spec
- Coi `http://` ≡ `https://` khi so trùng: **hợp lý**, cùng một trang đích; phù hợp tinh thần quyết định user (chuẩn hoá để bắt link trùng "chỉ khác hình thức"). Chấp nhận, đã ghi Residual risk — nên ghi thêm vào change doc/spec delta khi close-out.
- Giữ query/hash: **hợp lý** (vd `facebook.com/profile.php?id=…` phân biệt tài khoản theo query). Hash hiếm có nghĩa nhưng giữ là phía an toàn (không chặn nhầm). Chấp nhận.

### Các điểm kiểm theo yêu cầu
- Lỗi gắn đúng dòng (path index): **FAIL** — xem CRITICAL (thông báo "dòng N" tính đúng nếu index đúng; lỗi trả từ validate field con nên Payload gắn vào `socialLinks.<i>.platform|url` — OK về cơ chế).
- `zaloUrl`/`fanpageUrl` không bị thành bắt buộc: **OK** — vẫn dùng `validateHttpUrl`; có test `zalo.validate("") === true`.
- Validate khi `options.data` thiếu / partial update: **OK** — Payload truyền `data: deepMergeWithSourceArrays(doc, data)` (promise.js:114) nên có đủ mảng; field ngoài phạm vi submit bị bỏ validate (`isOutsideSubmittedFieldScope`). `asRows` chịu được `data` undefined. Không crash.
- onChange: admin chạy validate qua form-state server (cùng contract path string) → hiện tại trùng **không** hiển thị lỗi (CRITICAL). Sau fix, mọi row được revalidate mỗi lần build form-state nên lỗi dòng sau tự cập nhật khi sửa dòng trước.
- BL-108 required: **OK** — trống/khoảng trắng/undefined → "Vui lòng nhập Link trang", vẫn kiểm http(s).

## Responsive Checklist Gate
N/A — diff không đụng UI (route/component/CSS); chỉ config validate server.

## Skill gates
- aislop: skip — chưa chạy trong phạm vi verify command được cấp cho round này.
- oxlint (anti-slop): skip — không nằm trong verify command được giao; eslint file đổi PASS.
- ocr (open-code-review): skip, ocr not installed / không trong allowlist.
- AI-readable: OK — file 64 dòng, hàm < 20 dòng, tên rõ, hằng số có tên, comment nêu WHY. 0–1 indicator.
- ai-friendly-web: N/A — không public-facing.
- blitzstrike: N/A — không phải STRICT.

## Surgical diff
OK — chỉ 2 dòng ở `SiteSettings.ts` + file mới; trace về task.

## Residual risk
- Dữ liệu staging/prod có dòng trùng/url rỗng sẽ chặn lần lưu global kế tiếp (builder đã ghi).
- Chưa có xác nhận admin UI / Local API thật.

## Verdict: ❌ FAIL
Phải sửa trước round 2: (1) CRITICAL parse index từ path string + test dùng path string; (2) MAJOR khôi phục kiểm option hợp lệ cho `platform`.
