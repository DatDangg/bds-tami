Agent: reviewer

# Review: feature-rentals-reindex-background-job, phase-1-task-01, round 2

- **Review level:** STRICT
- **Reason:** Giữ mức của round 1. Task có DB migration (enum Payload Jobs), job nền mới, hook afterChange chạy trong transaction lưu của 3 collection công khai, field ảo gắn access riêng. Attempt 2 đổi doc mà hook afterChange trả về, tức đổi response của API update (REST/GraphQL/Local).
- **Blast radius:** response update của `provinces`/`wards`/`projects` (admin form, REST, GraphQL, Local API); chuỗi hook afterChange của `projects` (`withContentDefaults`: audit → revalidate → slug redirect → enqueueTranslation → reindex → revalidateHomepage); field ảo `searchReindexPending` (access read + afterRead); component admin `SearchReindexPendingWarning`; integration test có mock một phần `rentalsInScope`.

## Verify commands + result

| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | 239/240 file, 2523/2524 test PASS. 1 fail có sẵn, không tính: `src/endpoints/public/job-applications.test.ts` "vị trí hết hạn … → 400" |
| `pnpm vitest run --project integration tests/integration/rentals-reindex-job.test.ts tests/integration/rentals-reindex-job-migration.test.ts tests/integration/translate-content-migration.test.ts` | PASS 3 file / 6 test (tăng 1 test so với round 1: update trả cờ) |
| `pnpm build` | PASS (exit 0) |

Không chạy migrate reset, db push hay seed.

## Kiểm theo trọng tâm round 2

1. **Fix MAJOR-1 khớp thứ tự hook của Payload 3.91:** trong `node_modules/payload/dist/collections/operations/utilities/update.js` thứ tự là `afterRead - Fields` → `afterRead - Collection` → `afterChange - Fields` → `afterChange - Collection` (`result = await hook(...) || result`) → `return result`. Sau afterChange collection không còn bước afterRead hay lọc access nào. Vì vậy doc `{ ...doc, searchReindexPending: true }` mà hook trả về chính là `json.doc` của response. Form admin dựng lại từ doc này (round 1 đã dẫn `@payloadcms/ui/dist/views/Edit/index.js`), nên cảnh báo hiện ngay sau khi lưu. Integration chứng minh qua `payload.update` với admin (`byAdmin.searchReindexPending === true`).
2. **Không lộ cờ cho người không phải admin:** `markSearchReindexPending` (`src/fields/search-reindex-pending.ts:48-51`) chỉ gắn cờ khi `outcome === "queued"` **và** `isAdmin({ req })`. Đây cũng là predicate của access `read` (dòng 63) và afterRead (dòng 36), nên đã đồng nhất (MINOR-3 đã xử lý).
   - Provinces và Wards chỉ admin được update.
   - Projects: `update: isAuthorOrAdmin` (`content-defaults.ts:154`, PERMISSION dòng 39 "Mình"), nên sale sửa được dự án của mình. Khi sale đổi tên dự án có > 500 tin, job vẫn được xếp, nhưng doc trả về **không** có cờ. Unit test projects/wards/provinces (nhánh `sale`) và integration (`bySystem` không có user → `undefined`) đều chứng minh điều này.
   - Khách không update được. Local API dùng `overrideAccess` mà không có user thì không có cờ.
   - Response JSON công khai không có key này.
3. **Không làm mất thay đổi của hook afterChange khác:** hàm trả về bản sao nông (`{ ...doc }`) và giữ đủ key. Với Provinces và Wards, đây là hook afterChange duy nhất. Với Projects, hook reindex đứng sau audit/revalidate/slug-redirect/enqueueTranslation (`content-defaults.ts:167-174`), nên không ghi đè gì của các hook đó. Hook duy nhất chạy sau nó là `revalidateHomepage.afterChange`: hook này chỉ đọc field của doc, và một key thừa không ảnh hưởng. Audit chạy trước nên cũng không bị ảnh hưởng. Doc gốc không bị mutate (có unit test).
4. **Mock một phần trong integration test không rò sang file khác:** `vi.mock` có phạm vi module của từng file test. `vitest.config.ts` không tắt `isolate`, nên giữ mặc định là mỗi file một môi trường. Cờ `overThreshold.on` được tắt trong `finally`. Mock chỉ thay `rentalsInScope`, các export khác lấy từ `importOriginal`. Riêng test runner dùng `reindexRentalSearchText` thật, nên đường dựng lại vẫn được kiểm bằng code thật.
5. **MINOR-1:** câu cảnh báo trong component đã bỏ con số 500 (`SearchReindexPendingWarning.tsx:14`).
6. **Rà lại toàn diff** (src, migrations, tests; bỏ `.claude/**`, `.context/project-config.md`, `.context/runs/**` và các spec/changes khác): so với round 1 chỉ đổi 3 hook, `search-reindex-pending.ts`, component, test và tài liệu. Migration, job, `reindex-in-hook.ts` và jobsConfig không đổi. Không thấy regression.

## Trạng thái finding round 1

| Finding | Trạng thái |
|---|---|
| MAJOR-1 cảnh báo không hiện ngay sau lưu | **Đã sửa**: `markSearchReindexPending` + 3 hook; có unit test cho cả 3 hook và integration qua `payload.update`; Decision log đã gạch câu sai và ghi lại |
| MINOR-1 ghi cứng 500 trong text | **Đã sửa**: bỏ con số |
| MINOR-2 job lỗi cuối hoặc kẹt `processing` | **Chưa sửa, chấp nhận**: đã ghi Residual risk (2) của task, đề xuất làm ở task sau |
| MINOR-3 điều kiện admin lệch access | **Đã sửa**: access read, afterRead và mark cùng dùng `isAdmin` (gồm cả `active`); có test cho admin inactive |

## Responsive Checklist Gate

Diff UI chỉ có 1 đoạn `<p role="status">` trong form admin Payload. Attempt 2 chỉ đổi nội dung chữ.
- Layout: **N/A**. Đoạn văn inline, không width cố định, không grid.
- Typography/Spacing: **OK**. Dùng class `field-description` của Payload, không có font-size px riêng.
- Media: **N/A**.
- Touch/Interaction: **N/A**. Không có phần tử tương tác.
- Viewport/A11y: **OK**. Không dùng `100vh`, không animation, không `overflow:hidden`; có `role="status"`.
- Residual: chưa xem bằng browser ở 375/768/1280. Theo CSS math thì chữ tự xuống dòng, không tràn ngang.

## Skill gates

- aislop: **skip**, aislop chưa cài (round 1: `command not found`).
- oxlint (anti-slop): **skip**, oxlint chưa cấu hình; eslint (`pnpm lint`) PASS.
- ocr (open-code-review): **skip**, ocr chưa cài.
- AI-readable: **OK**. Tên rõ, hàm ngắn, indirection ≤ 2 bước, không còn magic number trong text, docblock giải thích lý do (WHY). Có 0–1 indicator (xem MINOR-A), dưới ngưỡng 3.
- ai-friendly-web: **N/A** (chỉ thay đổi admin nội bộ).
- blitzstrike: **skip**, không có môi trường pentest. Lộ cờ cho người không phải admin đã kiểm qua code, unit test và integration.

## Findings

### [MINOR-A] Decision log còn mô tả cũ về điều kiện admin
- `tasks/feature-rentals-reindex-background-job/phase-1-task-01.md:51` vẫn ghi afterRead "chỉ chạy truy vấn khi `req.user.role = admin`". Code hiện tại dùng `isAdmin` (admin **và** `active`), đúng như dòng 55 đã ghi. Đề xuất: sửa câu ở dòng 51 cho khớp, hoặc trỏ sang dòng 55. Không ảnh hưởng hành vi.

### [MINOR-2] (từ round 1, còn mở và đã chấp nhận)
- `src/fields/search-reindex-pending.ts:14`: job lỗi cuối thì cảnh báo tắt, job kẹt `processing` thì cảnh báo hiện mãi. Đã ghi Residual risk; đề xuất làm ở task sau.

Không có CRITICAL hay MAJOR.

## Residual risk

- Chưa kiểm form admin bằng browser. Kết luận "form hiện cảnh báo ngay" dựa trên code Payload (`update.js` + Edit view dựng form từ `json.doc`) và integration Local API, chưa có e2e REST hay admin.
- Lần lưu > 500 tin sẽ thất bại nếu DB chưa chạy migration mới. Builder chủ đích chọn vậy và đã ghi rõ.

## Verdict

**PASS**. MAJOR-1, MINOR-1 và MINOR-3 đã sửa và có test. MINOR-2 được chấp nhận là residual. Còn 1 MINOR tài liệu (MINOR-A) không chặn. Mọi verify command PASS, ngoại trừ 1 fail có sẵn ngoài scope.
