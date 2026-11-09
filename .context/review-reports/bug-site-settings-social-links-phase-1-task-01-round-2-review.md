Agent: reviewer

# Review — bug-site-settings-social-links · phase-1-task-01 · round 2 (BL-108 + BL-109)

- Review level: **NORMAL**
- Reason: chỉ thêm validate server cho field con của array `socialLinks` trong global `site-settings`; không đụng schema/migration/auth/access/hook/API shape. Global dùng chung nhưng thay đổi giới hạn ở validate 2 field.
- Blast radius: `src/globals/SiteSettings.ts` (field `socialLinks.platform`, `socialLinks.url`), `src/globals/site-settings/social-links.ts` (mới), unit test mới, integration test mới. Ảnh hưởng mọi lần lưu global `site-settings` (admin, REST, Local API). Không đổi payload-types/DB. `zaloUrl`/`fanpageUrl` vẫn dùng `validateHttpUrl` (không bắt buộc).

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/globals` | PASS — 5 files, 33 tests |
| `pnpm typecheck` | PASS (tsc --noEmit, không lỗi) |
| `pnpm exec eslint src/globals/SiteSettings.ts src/globals/site-settings/social-links.ts src/globals/site-settings/social-links.test.ts tests/integration/site-settings-social-links.test.ts` | PASS (exit 0) |
| `pnpm vitest run --project integration tests/integration/site-settings-social-links.test.ts` | Không chạy được — `ECONNREFUSED 127.0.0.1:5433` (Postgres dev tắt). Chạy 1 lần, không retry. |

## Đóng finding round 1
### [CRITICAL r1] path index dạng chuỗi — ĐÃ ĐÓNG
- `social-links.ts:42-45` `rowIndexFromPath` nhận segment `number` hoặc chuỗi `/^\d+$/`.
- Đối chiếu Payload 3.91 khi lưu: `payload/dist/fields/hooks/beforeChange/promise.js:34` `path.split('.')` → `path: pathSegments` (dòng 120), `...field` (dòng 110, nên có `options`/`required`), `data` là doc đã merge → path `["socialLinks","1","platform"]` → index 1 → kiểm trùng chạy thật.
- Unit test giờ mặc định truyền path chuỗi (`social-links.test.ts:14`) + 1 case path số (dòng 50-54) → đúng contract thật, hết false-confidence.

### [MAJOR r1] mất validate mặc định của select — ĐÃ ĐÓNG
- `social-links.ts:67` gọi `select` từ `payload/shared` (`validations.js:625-658`: giá trị không thuộc `options` → `validation:invalidSelection`). Test dòng 55-58 chứng minh `"myspace"` bị chặn.
- `url`: `social-links.ts:53` gọi thêm `text` mặc định (`validations.js:6`, kiểm maxLength/defaultMaxTextLength) sau khi tự kiểm required + http(s). Validate mặc định text được giữ.

### Điểm kiểm theo yêu cầu
- Thông báo tiếng Việt gắn dòng sau: OK — chỉ so với `slice(0, index)` (dòng trước), dòng đầu hợp lệ, dòng sau báo "Nền tảng Instagram đã có ở dòng 1." / "Link trang trùng với dòng 1." (test 59-63, 69-73). Lỗi trả từ field con nên Payload gắn theo `socialLinks.<i>.platform|url`.
- "Khác" nhiều dòng: OK — `MULTI_ROW_PLATFORM` bỏ qua kiểm trùng nền tảng nhưng vẫn kiểm trùng link (test 64-73).
- BL-108: trống/khoảng trắng/undefined → "Vui lòng nhập Link trang" (test 31-33); vẫn kiểm http(s).

## Findings

### [MINOR] onChange trong admin KHÔNG truyền `path` → lỗi trùng chỉ hiện khi bấm Lưu; comment sai
- `src/globals/site-settings/social-links.ts:39-40` ghi "Payload 3.x truyền path dạng chuỗi … cả lúc lưu lẫn onChange admin" — không đúng: `@payloadcms/ui/dist/forms/fieldSchemasToFormState/addFieldStatePromise.js:119-134` gọi `validate(value, { ...field, id, data: fullData, siblingData, req, … })` **không có `path`** → `rowIndexFromPath(undefined) = -1` → kiểm trùng trả `true` khi build form-state.
- Hệ quả: lưu bị chặn đúng (server beforeChange có path) và lỗi hiện dưới ô sau khi Lưu; nhưng không có cảnh báo trước khi Lưu, và lần rebuild form-state kế tiếp (sửa ô bất kỳ) có thể xoá lỗi trùng đang hiển thị dù dữ liệu vẫn trùng (Lưu lại thì báo lại). Không vi phạm acceptance (yêu cầu server-side, chặn + lỗi tại dòng sau), nên MINOR.
- Đề xuất (tuỳ chọn, task sau): khi không có path, suy chỉ số dòng bằng `siblingData.id` so với `data.socialLinks[i].id`; tối thiểu sửa comment cho đúng ("onChange admin không truyền path → chỉ kiểm trùng khi lưu").

### [MINOR] Integration test chưa chạy được
- `tests/integration/site-settings-social-links.test.ts` đúng hướng (Local API `updateGlobal`, `overrideAccess: false`, fixture `buildGlobalsTestConfig` có `Staff` + `createSiteSettings`), nhưng ECONNREFUSED — chưa có bằng chứng end-to-end. Cần chạy khi có DB trước/khi close-out nếu được.

## Repro closure (bug task)
- Status trong task: `PASS (unit-level)`. Evidence kiểm chứng được: unit test dùng đúng contract path/options mà Payload truyền khi lưu (đã đối chiếu `beforeChange/promise.js:34,110,120`), chạy lại PASS 33/33. Nhánh (1) trống, (2) xoá link, (3) trùng Instagram đều có test. Chấp nhận; end-to-end Local API ghi Residual risk.

## Responsive Checklist Gate
N/A — diff không đụng UI (route/component/CSS); chỉ validate server.

## Skill gates
- aislop: skip — không nằm trong verify command được giao cho round này.
- oxlint (anti-slop): skip — không trong verify command được giao; eslint file đổi PASS, typecheck PASS.
- ocr (open-code-review): skip, ocr not installed / không trong allowlist.
- AI-readable: OK — file 74 dòng, hàm ngắn, tên rõ, hằng số có tên, comment nêu WHY; 1 indicator nhẹ (comment dòng 39-40 không chính xác) < 3.
- ai-friendly-web: N/A — không public-facing.
- blitzstrike: N/A — không phải STRICT.

## Surgical diff
OK — `SiteSettings.ts` chỉ +1 import, +1 `validate` cho `platform`, đổi `validate` của `url`; còn lại file mới thuộc task.

## Residual risk
- Integration `updateGlobal` chưa chạy (Postgres 5433 tắt).
- Admin UI: lỗi trùng chỉ hiện sau Lưu, có thể biến mất khi sửa ô khác trước lần Lưu kế (xem MINOR 1). Chưa xác nhận bằng UI thật.
- Dữ liệu staging/prod đang trùng/url rỗng sẽ chặn lần lưu global kế tiếp tới khi admin sửa.
- http ≡ https và giữ query/hash khi so trùng: suy luận ngoài spec, cần ghi vào spec delta khi close-out.

## Verdict: ✅ PASS
CRITICAL/MAJOR round 1 đã đóng thật, đối chiếu với node_modules. Còn 2 MINOR (comment onChange sai + integration chưa chạy), không chặn.
