# bug-api-error-name-minified · phase-1-task-01 — Admin prod: lỗi APIError hiện "An unknown error occurred." (BL-093)

- Change doc: `spec/changes/2026-10-28-api-error-name-minified.md` (BACKLOG BL-093, follow-up BL-088). User duyệt 2026-10-28 "ghi BL rồi làm luôn đi" (batch follow-up, không checkpoint lại phase plan).
- Phụ thuộc: không.
- Trạng thái: `done` — Reviewer STRICT PASS r1 (`.context/review-reports/bug-api-error-name-minified-phase-1-task-01-round-1-review.md`). Spec: no spec change (1.61.0), test-scope v95 (v94 archive). Doc impact: `no doc impact` (docs không mô tả xử lý lỗi REST/afterError).

## Classification / Risk
- Type: **BUG** (không đổi requirement; thông báo lỗi tiếng Việt đã có, chỉ bị mất ở build prod).
- Severity: medium (admin thấy lỗi chung chung, không biết vì sao bị chặn; hành vi chặn vẫn đúng).
- Root cause category: build production (minify) × logic `formatErrors` của Payload.
- Risk: **đỏ → STRICT** — đụng đường trả lỗi REST dùng chung mọi collection/endpoint (lỗi/quyền).
- Blast radius: mọi phản hồi lỗi REST `/api/**` (collection, global, custom endpoint) — chỉ khi lỗi là `APIError` public, không có `data`, `name` rỗng.
- Doc impact: dự kiến `no doc impact` (nếu `docs/DESIGN.md`/ARCHITECTURE có mục xử lý lỗi REST thì thêm 1 dòng as-built).
- Decision impact: không vá `node_modules`, không đổi cấu hình bundler (Next/SWC minify).

## Repro (change-request, 2026-10-28, build production)
`pnpm build` + `next start -p 3100`, DB local docker `tami-postgres` (dev), tài khoản test `bl088-admin@example.test` (script `C:\Users\datda\AppData\Local\Temp\claude\D--prj-bds\63d4447b-d14c-4607-9e86-5c6074d3103d\scratchpad\bl093\repro2.mjs <base> <pwFile>`; pwFile = `C:\Users\datda\AppData\Local\Temp\claude\D--prj-bds\e1147616-620e-4f50-9957-a1db82ede856\scratchpad\bl088\pw.txt` — KHÔNG in mật khẩu; script chỉ gửi DELETE sau khi đếm tham chiếu > 0 nên guard chắc chắn chặn, không mất dữ liệu):
- `DELETE /api/provinces/<01 có 126 phường>` → `409 {"errors":[{"message":"An unknown error occurred."}]}` (đúng phải là "Không xoá được tỉnh/thành đang có 126 phường/xã…").
- `DELETE /api/categories/<danh mục đang có dự án>` → `409 … "An unknown error occurred."`.
- `POST /api/staff/reset-password` thiếu password → `400 … "An unknown error occurred."` (đúng: "Thiếu mật khẩu mới.").
- Log server: `"err":{"type":"", …}` → `name` rỗng.
- Đối chứng cùng build: lỗi do Payload ném bằng **lớp con** (`AuthenticationError` 401, `Forbidden` 403, `NotFound` 404) vẫn hiện đúng chữ Việt → chỉ `new APIError(...)` trực tiếp bị mất `name`. `ValidationError` có `data` nên đi nhánh 1 của `formatErrors`, không bị ảnh hưởng. UI admin không đọc `errors[].name`.

## Root cause
`node_modules/payload/dist/errors/APIError.js`: `ExtendableError` gán `this.name = this.constructor.name`; build prod (Next 16 bundle + minify) làm tên lớp `APIError` thành `""`. `node_modules/payload/dist/utilities/formatErrors.js`: lỗi không có `data` → bỏ nhánh 1; nhánh `if (incoming.name)` sai → fallback `"An unknown error occurred."`. `routeError` (`payload/dist/utilities/routeError.js`) gọi `formatErrors` rồi mới chạy `collection.hooks.afterError` → `config.hooks.afterError` (hook được trả `{ response, status }` thay phản hồi). Dev không minify nên dev đúng. Payload tự ném `new APIError(` ở ~103 chỗ (58 file) — các lỗi đó cũng mất chữ ở prod.

## Thiết kế fix (decision)
So sánh:
| Cách | Phạm vi sửa | Ưu | Nhược |
|---|---|---|---|
| A. Helper `publicApiError()` gán `name` + thay ~10 điểm ném + lint cấm `new APIError` | 10 file + eslint | Chạy mọi đường (REST + local) | Lỗi `new APIError` do **Payload** ném vẫn hỏng; điểm ném mới phải nhớ dùng helper |
| B. **Một hook `config.hooks.afterError`** khôi phục message | 1 file mới + 1 dòng config | Sửa cho mọi lỗi REST public (repo + Payload + điểm ném sau này), không đổi call site | Chỉ đường REST (là đường duy nhất trả lỗi cho UI admin; GraphQL đã tắt) |
| C. Tắt `experimental.serverMinification` / giữ class name SWC | cấu hình bundler toàn app | Gốc rễ | Đổi build toàn app, ngoài phạm vi (user: dừng nếu cần) |

**Chọn B** — đơn giản nhất, hẹp (chỉ chạm phản hồi đúng ca hỏng), không đổi mã HTTP, không đụng bundler/node_modules.

Hook `src/hooks/restore-public-error-message.ts` (tên builder có thể chỉnh), `CollectionAfterErrorHook`/`AfterErrorHook` cấp config:
- Điều kiện (không so chuỗi fallback, chỉ xét thuộc tính lỗi = đúng ca `formatErrors` rơi về fallback): `error instanceof APIError` && `!error.name` && `error.isPublic === true` && `error.data == null` && `typeof error.message === "string" && error.message !== ""`.
- Khi khớp: trả `{ response: { ...result, errors: [{ message: error.message }] } }` (giữ `stack` nếu `debug`); **không** trả `status` (giữ `err.status` của routeError). Không khớp → `return` (undefined) để giữ nguyên phản hồi.
- Lỗi không public (500/`isPublic:false`) giữ nguyên (không lộ message nội bộ).
- Đăng ký `hooks: { afterError: [restorePublicErrorMessage] }` trong `src/payload.config.ts`.
- `src/lib/upload/validate-file.ts` `reject()`: bỏ dòng `error.name = "APIError"` + comment (dùng cách chung). Endpoint nộp CV dùng `instanceof APIError` + `status`, không phụ thuộc `name`.
- Không sửa các điểm ném khác (Provinces, Staff, slug, guard-delete…) — hook phủ hết. Không đụng file dirty BL-076..078.

## Files
- Mới: `src/hooks/restore-public-error-message.ts` + `.test.ts`.
- Sửa: `src/payload.config.ts` (thêm `hooks.afterError`), `src/lib/upload/validate-file.ts` (bỏ gán name), `src/lib/upload/validate-file-prod-name.test.ts` (chuyển sang kiểm qua hook, hoặc xoá + gộp vào test hook — builder chọn, ghi lý do).
- CẤM sửa/stage: `.claude/**`, `.gitignore`, `package.json`, `pnpm-lock.yaml`, `src/app/(payload)/admin/importMap.js`, `src/collections/{Projects,PropertyPosts,Rentals}.ts`, `src/fields/ward-in-province.ts`(+test), `src/components/admin/WardField*`, `tools/**`, `tests/e2e/admin/`, `playwright.config.ts`, `docs/content-intake/`, `docs/testing/`, `spec/changes/**`. Không revert/stash/checkout. Không commit.

## Acceptance Criteria
- [ ] Build prod: `DELETE /api/provinces/<có phường>` → 409 + "Không xoá được tỉnh/thành đang có … phường/xã…"; `DELETE /api/categories/<đang dùng>` → 409 + chữ Việt; `POST /api/staff/reset-password` thiếu password → 400 "Thiếu mật khẩu mới.".
- [ ] Mã HTTP không đổi; hành vi chặn không đổi (dữ liệu còn nguyên).
- [ ] Lỗi 401/403/404 Payload, `ValidationError` (vd reset-password mật khẩu < 10 ký tự → "Mật khẩu tối thiểu 10 ký tự.") vẫn như trước.
- [ ] Lỗi 500/không public không bị lộ message.
- [ ] Upload > 10 MB REST vẫn "File vượt quá 10MB." ở prod (validate-file dùng cách chung).
- [ ] Test khoá: mô phỏng `name = ""` → qua `formatErrors` + hook → đúng message; ca không public/có data/có name → hook không đổi phản hồi.

## Verification Plan
- Test-first: test hook (mô phỏng minify bằng `error.name = ""`) FAIL trước khi có hook → PASS sau; test kiểu `routeError` thật nếu dựng được (`formatErrors` + hook). Cập nhật `validate-file-prod-name.test.ts` (sau khi bỏ gán name, test cũ sẽ FAIL — chuyển sang kiểm qua hook).
- Commands: `pnpm typecheck`, `pnpm lint` (toàn repo — gate), `pnpm test` (integration cần docker tami-postgres 5433 / tami-redis 6381 / tami-seaweedfs 8333 đang chạy; fail do môi trường ghi rõ), `pnpm build`.
- Build prod: `pnpm build` + `pnpm exec next start -p 3100` (KHÔNG dùng 3000), chạy `repro2.mjs` + `repro.mjs` (cùng thư mục scratchpad bl093) → lưu output `repro-after*.txt` cạnh `repro-before*.txt`; thêm 1 ca upload 11 MB REST (`big-11mb.jpg` ở scratchpad bl088) → 413 chữ Việt; ca ValidationError reset-password mật khẩu ngắn. Dừng server sau khi đo (Stop-Process PID đang LISTEN 3100).

## Retry / Error Memory
- Attempt 0. ≥3 attempt fail → `architecture_review_needed`.

## Repro Verification
| Repro | Expected | Actual before | Actual after | Evidence | Result |
|---|---|---|---|---|---|
| Build prod `DELETE /api/provinces/<01>` | 409 chữ Việt | 409 "An unknown error occurred." | 409 "Không xoá được tỉnh/thành đang có 126 phường/xã. Hãy xoá hoặc chuyển các phường/xã trước." | `scratchpad/bl093/repro-after2.txt` | PASS |
| Build prod `DELETE /api/categories/<đang dùng>` | 409 chữ Việt | 409 "An unknown error occurred." | 409 "Không xoá được danh mục đang có nội dung sử dụng. Hãy chuyển nội dung sang danh mục khác trước." | `repro-after2.txt` | PASS |
| Build prod reset-password thiếu password | 400 "Thiếu mật khẩu mới." | 400 "An unknown error occurred." | 400 "Thiếu mật khẩu mới." | `repro-after2.txt` | PASS |

## Log
- 2026-10-28 (change-request): tái hiện trên build prod, root cause như trên, chọn cách B.
- 2026-10-28 (builder, attempt 1): hook `src/hooks/restore-public-error-message.ts` + test (8 ca, FAIL khi chưa có module -> PASS), đăng ký `hooks.afterError` trong `src/payload.config.ts`, `reject()` bỏ gán name, `validate-file-prod-name.test.ts` kiểm qua hook. typecheck PASS, `pnpm lint` toàn repo exit 0, `pnpm test` 454 file/4760 test PASS, build PASS; build prod 3100: 409/409/400 trả chữ Việt, 413 upload chữ Việt, 401/403/404 không đổi (`scratchpad/bl093/repro-after*.txt`).
- 2026-10-28 (reviewer r1): STRICT PASS, 3 MINOR: (1) thứ tự import payload.config — change-request đã sửa (eslint + typecheck PASS); (2) `data != null` chặt hơn `formatErrors` (truthy) — giữ, nghiêng an toàn; (3) test không đi qua routeError thật — bằng chứng prod thay, follow-up tuỳ chọn.
- 2026-10-28 (change-request close-out): no doc impact; spec-publish no spec change (1.61.0) / test-scope v95; BACKLOG BL-093 done + archive change doc.

## Residual risk
- Đường không phải REST (server function `buildFormState`/`buildTableState` gọi `formatErrors`) không qua `afterError` — hiếm gặp lỗi `new APIError` trực tiếp ở đó.
- 2026-10-28 (builder, attempt 1): test-first `src/hooks/restore-public-error-message.test.ts` FAIL (module chưa có) -> thêm hook `src/hooks/restore-public-error-message.ts` + đăng ký `hooks.afterError` trong `src/payload.config.ts`; bỏ `error.name = "APIError"` ở `validate-file.ts` `reject()`; `validate-file-prod-name.test.ts` chuyển sang kiểm qua `formatErrors` + hook (giữ file, vì vẫn khoá được đường upload 413 end-to-end ở mức unit). Verify: typecheck OK, lint toàn repo exit 0, test 454 file/4760 PASS, build OK. Build prod :3100 (đã dừng): repro-after2/repro-after/repro-after3 trong scratchpad bl093; upload 11MB REST -> 413 "File vượt quá 10MB."; 401/403/404 như cũ.
- (change-request đính chính phát hiện của builder, đo lại build prod 2026-10-28 `scratchpad/bl093/probe-ve.mjs`): reset-password mật khẩu ngắn trả 400 `{"errors":[{"name":"o","data":{"collection":"staff","errors":[{"path":"password","message":"Mật khẩu tối thiểu 10 ký tự."}]},"message":"The following field is invalid: password"}]}` — **có `data`** (nhánh 1 `formatErrors` chạy đúng; `name` bị minify thành "o"), field error tiếng Việt nằm trong `data.errors` cho UI admin tô ô. Payload ValidationError nội bộ (POST categories rỗng) cũng có `data` + message tiếng Việt. Hook không chạm ca này (có data) → không đổi so với trước. Residual nhỏ, có sẵn: `message` cấp trên của ValidationError do repo ném (không truyền `req.t`) là tiếng Anh "The following field is invalid: …" — UI admin hiển thị lỗi theo field nên ảnh hưởng thấp; follow-up tuỳ chọn.
