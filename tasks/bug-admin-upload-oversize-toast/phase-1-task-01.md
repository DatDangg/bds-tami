# bug-admin-upload-oversize-toast · phase-1-task-01 — Admin: ảnh > 10 MB hiện cùng lúc "An unknown error occurred" + "Successfully saved 1 files" (BL-088)

- Change doc: `spec/changes/archive/2026-10-27-admin-upload-oversize-toast.md` (BACKLOG BL-088, QA sheet dòng 10). User duyệt chạy batch BL-088..091 (auto proceed).
- Phụ thuộc: không.
- Trạng thái: `done` — Reviewer STRICT PASS r2 (`.context/review-reports/bug-admin-upload-oversize-toast-phase-1-task-01-round-2-review.md`; r1 FAIL dropzone kẹt khi thả toàn tệp quá cỡ). Spec: no spec change (1.59.0), test-scope v90. Doc impact: `no doc impact` (giới hạn đúng ERD §4.12; chỉ thêm chặn sớm ở client).

## Classification / Risk
- Type: **BUG** (admin upload; không đổi requirement — giới hạn 10/15/20 MB đã có ở ERD §4.12).
- Severity: medium. Root cause category: thư viện (Payload UI bulk upload) + build production (mất tên lớp lỗi).
- Risk: **MEDIUM/đỏ** — upload/file access + provider admin dùng chung mọi ô upload → **STRICT**.
- Blast radius: mọi đường chọn/kéo-thả tệp trong `/admin` (ô upload Dự án/Cho thuê/Tin BĐS/Tin tức/Dịch vụ/Trang chủ…, drawer tải nhiều tệp, màn tạo mới Ảnh/tệp, ảnh đại diện staff); thông báo lỗi REST của `inspectUpload` (media + private-files/CV).
- Doc impact: dự kiến `no doc impact` (hành vi giới hạn đúng ERD §4.12; nếu `docs/DESIGN.md`/ARCHITECTURE mô tả upload admin thì thêm 1 dòng as-built "admin chặn sớm ở client").
- Decision impact: không vá `node_modules`/`pnpm patch`; chặn sớm ở client, server vẫn là chốt chặn cuối.

## Repro (change-request, đã tái hiện 2026-10-28)
- Local, tài khoản admin test (`bl088-admin@example.test`, tạo bằng script tạm, không phải tài khoản thật) → `/admin/collections/projects/<id>` → tab Hình ảnh → "Tải lên" → chọn JPEG 11 MB → Lưu trong drawer.
- `next dev -p 3100`: REST `POST /api/media?locale=vi` → 413 `{"errors":[{"message":"File vượt quá 10MB."}]}` → toast "File vượt quá 10MB." + "Successfully saved 1 files"; drawer tự đóng; gallery không đổi (không tạo media).
- `pnpm build` + `next start -p 3100` (giống staging): REST → 413 `{"errors":[{"message":"An unknown error occurred."}]}` → toast **"An unknown error occurred."** + **"Successfully saved 1 files"** = đúng ảnh QA. Ảnh: `.context/review-reports/assets/bl088-before-prod-toasts.png`.
- Log server cả 2 lần: `⨯ Error: Body exceeded 1 MB limit.` (server action `form-state`); trình duyệt `ERR_CONNECTION_RESET` / `TypeError: Failed to fetch`.

## Root cause (đầy đủ — đã chứng minh, không spawn Explore)
1. **"Successfully saved"**: `node_modules/@payloadcms/ui/dist/elements/BulkUpload/FormsManager/index.js:361–405` nhánh `exceedsLimit` (status 413) gọi `getFormState(...)` để đếm lại lỗi. `formStateForServer` chỉ thay `file.value` bằng `{name}` nhưng các thuộc tính khác của field `file` (vd `initialValue`) vẫn giữ `File` 11 MB → React server action serialize cả tệp → body > 1 MB (`serverActions.bodySizeLimit` mặc định) → Next trả 413/reset → `ServerFunctionsProvider.getFormState` nuốt lỗi, trả `{state: null}` → `if (newState)` bỏ qua → `errorCount` giữ 0 → dòng 431–440 đếm là thành công → `toast.success("Successfully saved 1 files")` + đóng drawer, cùng lúc `toast.error(nonFieldErrors[0]?.message)` (dòng 405). Không có bản ghi media nào được tạo (server đã chặn).
2. **"An unknown error occurred."** thay vì "File vượt quá 10MB.": ở build production Payload được bundle + minify → `ExtendableError` gán `this.name = this.constructor.name` = `""` (log prod: `"type":""`, stack `Error: File vượt quá 10MB.`). `node_modules/payload/dist/utilities/formatErrors.js`: APIError không có `data` (ta truyền `undefined` → `null`) bỏ qua nhánh 1; nhánh `if (incoming.name)` sai vì name rỗng → trả fallback `'An unknown error occurred.'`. Dev không minify nên dev thấy đúng chữ tiếng Việt.
3. Dung lượng giới hạn đặt ở `src/lib/upload/validate-file.ts` `MEDIA_POLICY` (ảnh 10 MB, video 15 MB, PDF 20 MB) kiểm trong `createUploadGuard` (beforeOperation) theo MIME thật; trần request `MAX_UPLOAD_BYTES` 20 MB (busboy → 413 "File size limit has been reached", cũng đi nhánh `exceedsLimit` → cùng lỗi toast kép); nginx 25 MB.

## Thiết kế fix (chọn cách đơn giản, ít rủi ro; không vá thư viện)
1. **Tách hằng số dùng chung** không phụ thuộc Node: vd `src/lib/upload/media-limits.ts` export `MB`, `MEDIA_POLICY` (hoặc bảng `{mime: maxBytes}` + extension), `MAX_UPLOAD_BYTES`; `validate-file.ts` import/re-export từ đó (giữ API hiện tại `MEDIA_POLICY`, `PRIVATE_FILE_POLICY`, `MAX_UPLOAD_BYTES`, test cũ không đổi). Client import file này được (không `node:crypto`/`file-type`/`payload`).
2. **Chặn sớm ở client** — provider admin mới (vd `src/components/admin/UploadSizeGuard.tsx`, `"use client"`), đăng ký trong `src/payload.config.ts` `admin.components.providers` (cạnh `UploadButtonLabel`):
   - Listener **capture** trên `document` cho `change` của `input[type=file]` và `drop` (có `dataTransfer.files`), chạy trước listener gốc của React.
   - Mỗi tệp: giới hạn = `MEDIA_POLICY[file.type]?.maxBytes`; MIME lạ/không có trong bảng → dùng trần `MAX_UPLOAD_BYTES` (server vẫn trả 415 cho định dạng sai). `file.size > giới hạn` → loại.
   - Có tệp bị loại: `change` → gán lại `input.files` chỉ còn tệp hợp lệ (DataTransfer); không còn tệp nào → `stopImmediatePropagation` + `input.value = ""` (không gửi request). `drop` → `preventDefault` + `stopImmediatePropagation`; nếu còn tệp hợp lệ thì phát lại `drop` với DataTransfer đã lọc (hoặc, nếu không làm ổn định được, chặn cả lượt thả và nói rõ trong toast) — builder chọn cách ổn định, ghi lý do. Không để dropzone kẹt trạng thái "đang kéo".
   - **1 toast lỗi tiếng Việt** (`toast.error` từ `@payloadcms/ui`) gom các tệp bị loại, nêu tên + dung lượng + giới hạn theo loại, vd: `Ảnh “a.jpg” (11,0 MB) vượt giới hạn 10 MB. Hãy nén hoặc chọn tệp nhỏ hơn.`; nhiều tệp → 1 toast liệt kê. Nhãn loại: ảnh 10 MB / video 15 MB / PDF 20 MB.
   - Chỉ tác động trong admin (provider chỉ render ở `/admin`). Không đụng form công khai (nộp CV).
3. **Giữ thông báo server ở production**: `reject()` trong `validate-file.ts` gán `error.name = "APIError"` trước khi throw (comment ngắn: build prod minify làm `constructor.name` rỗng → `formatErrors` trả "An unknown error occurred."). Lưới an toàn khi tệp lọt client (đổi đuôi, gọi API trực tiếp): 413/415/400 vẫn ra chữ tiếng Việt. KHÔNG sửa các `new APIError` khác trong repo (ngoài scope — ghi follow-up).
4. `importMap.js`: chạy `pnpm generate:importmap` (hoặc thêm tay đúng 2 dòng import + map cho `UploadSizeGuard`). File đang dirty (WardField BL-077): **giữ nguyên** dòng của việc khác; change-request sẽ stage riêng hunk của task.

## Files
- Mới: `src/lib/upload/media-limits.ts`, `src/components/admin/UploadSizeGuard.tsx` (+ `UploadSizeGuard.test.tsx`), test cho `reject` name (trong `src/lib/upload/validate-file.test.ts`).
- Sửa: `src/lib/upload/validate-file.ts`, `src/payload.config.ts` (providers), `src/app/(payload)/admin/importMap.js` (chỉ dòng UploadSizeGuard).
- KHÔNG đụng file dirty của việc khác: `.claude/settings.json`, `.gitignore`, `package.json`, `pnpm-lock.yaml`, `src/collections/Projects.ts`, `src/collections/PropertyPosts.ts`, `src/collections/Rentals.ts`, `src/fields/ward-in-province.ts`, `tools/*`, `spec/changes/BACKLOG.md`, change doc chưa track trong `spec/changes/`. Không revert/stash/checkout.

## Acceptance Criteria
- [ ] Ảnh > 10 MB (và video > 15 MB, PDF > 20 MB, tệp bất kỳ > 20 MB) chọn qua "Tải lên"/"Thêm tệp"/kéo-thả/màn tạo Ảnh, tệp: **không gửi `POST /api/media`**, không thêm vào danh sách ảnh, không tạo media.
- [ ] Chỉ **1** toast lỗi tiếng Việt nêu rõ giới hạn; **không** có "Successfully saved"/"An unknown error occurred".
- [ ] Chọn nhiều tệp lẫn lộn: tệp hợp lệ vẫn vào drawer/tải lên bình thường; tệp quá cỡ bị loại + báo trong cùng 1 toast.
- [ ] Ảnh ≤ 10 MB vẫn tải lên bình thường ở Dự án (gallery), Cho thuê, Tin BĐS, Tin tức (ảnh bìa/ô upload) — cùng provider.
- [ ] REST gọi trực tiếp (vượt client) ở build production vẫn trả `"File vượt quá 10MB."` (không còn "An unknown error occurred.").
- [ ] Hằng số dung lượng 1 nguồn duy nhất (server + client).
- [ ] typecheck · test · eslint file đổi · build PASS.

## Verification Plan
- Unit/UI (test-first, FAIL trên HEAD → PASS sau): `UploadSizeGuard.test.tsx` (jsdom): change với tệp quá cỡ → listener React/bubble không nhận, input rỗng, `toast.error` 1 lần đúng chữ; tệp hợp lệ → đi qua nguyên vẹn; lẫn lộn → chỉ còn tệp hợp lệ; drop tương tự; MIME lạ dùng trần 20 MB. `validate-file.test.ts`: lỗi từ `inspectUpload` có `name === "APIError"` và `formatErrors(err)` (từ `payload`) trả đúng message ngay cả khi mô phỏng `constructor.name` rỗng (hoặc kiểm `name` được gán tường minh).
- Commands (`.context/project-config.md`): `pnpm typecheck`, `pnpm test` (integration cần Postgres 5433 + Redis 6381 + SeaweedFS 8333 — change-request đã `docker start tami-redis tami-seaweedfs`; fail do môi trường ghi rõ, không tính fail task), `pnpm exec eslint <file đổi>`, `pnpm build`.
- Trình duyệt thật (Playwright Edge, port **3100** — 3000 là dự án khác; dừng server sau khi đo): script mẫu `C:\Users\datda\AppData\Local\Temp\claude\D--prj-bds\e1147616-620e-4f50-9957-a1db82ede856\scratchpad\bl088\repro.mjs` (args: `<dir> <tag> <file> <projectId>`; tài khoản test `bl088-admin@example.test`, mật khẩu ở `...\scratchpad\bl088\pw.txt` — KHÔNG in ra, KHÔNG commit; tệp mẫu `big-11mb.jpg`, `small.jpg` cùng thư mục; project `fbcdc4ca-899e-4e45-8ae8-fcff41cf8253`). Đo trên **build production** (`pnpm build` + `next start -p 3100`): 11 MB → không có REQ POST /api/media, 1 toast tiếng Việt; small.jpg → 201 + ảnh vào gallery (không bấm Lưu dự án — không đổi dữ liệu; nếu lỡ thêm thì gỡ khỏi gallery, không xoá media). Thử thêm 1 ô upload đơn (ảnh bìa Tin tức hoặc Cho thuê) + màn `/admin/collections/media/create`. Ảnh `.context/review-reports/assets/bl088-after-*.png`.

## Retry / Error Memory
- Attempt 1: reviewer r1 FAIL (MAJOR-1: drop toàn tệp quá cỡ bị nuốt → Dropzone kẹt `dragging` vì trình duyệt không bắn dragleave sau drop; pointer-events: none làm "Chọn tệp"/"Tải lên" không bấm được).
- Attempt 2: root cause = chỉ handler `drop` của Dropzone gọi `setDragging(false)`. Fix: luôn phát lại drop (có thể RỖNG, cờ REDISPATCHED) → Dropzone gỡ dragging, không addFiles; + paste, toạ độ, làm tròn lên. Tests FAIL→PASS (30 test).
- Attempt 0. ≥3 attempt fail → `architecture_review_needed`.
- Đã biết: getFormState server action > 1 MB (không sửa — client chặn trước nên không đi nhánh `exceedsLimit`).

## Doc / Decision Impact
- Doc: dự kiến `no doc impact` (hoặc 1 dòng as-built nếu có mô tả upload admin).
- Follow-up đề xuất (ngoài scope, change riêng): các `new APIError(...)` khác (delete guards 409 Provinces/Wards/Categories/JobPostings/Media, Staff 400, slug 400, privacy 400) và `Forbidden` cũng mất message ở build production vì cùng cơ chế name rỗng → người dùng thấy "An unknown error occurred.". Cách sửa chung (vd `afterError` hook hoặc helper tạo lỗi có name) cần quyết định riêng.

## Repro Verification
| Repro | Expected | Actual before | Actual after | Evidence | Result |
|---|---|---|---|---|---|
| Dự án → Hình ảnh → Tải lên JPEG 11 MB → Lưu (build prod) | 1 toast lỗi tiếng Việt nêu 10 MB, không request, không "Successfully saved" | 413 "An unknown error occurred." + "Successfully saved 1 files" | Build prod: 11 MB jpeg → không gửi request upload, đúng 1 toast "Ảnh “big-11mb.jpg” (11,0 MB) vượt giới hạn 10 MB. Hãy nén hoặc chọn tệp nhỏ hơn."; không "Successfully saved"/"unknown error"; small.jpg vào drawer bình thường; REST trực tiếp 413 "File vượt quá 10MB." | `bl088-before-prod-toasts.png` / `bl088-after-gallery-big.png`, `-gallery-small.png`, `-media-create.png`, `-project-single.png` | PASS (chờ reviewer) |
| Drop giả (DataTransfer + dragenter/dragover/drop) ảnh 11 MB lên dropzone drawer và dropzone ô gallery (build prod) | 1 toast tiếng Việt, không POST /api/media, dropzone không kẹt dragging, "Chọn tệp"/"Tải lên" bấm được | (r1) dropzone kẹt dragging | đúng 1 toast; không upload request; class `dropzone` không còn `dragging`; "Chọn tệp" mở filechooser; "Tải lên" mở drawer; drop lẫn lộn (11 MB + 1 KB): 1 toast | `bl088-after-drop-big.png`, `-drop-mixed.png`, `-drop-field.png`, `-drop-field-click.png` | PASS (chờ reviewer) |

## Log
- 2026-10-28 (change-request): tái hiện dev + prod, root cause 1–3 ở trên.
- 2026-10-28 (builder): thêm `src/lib/upload/media-limits.ts` (hằng số dùng chung), `UploadSizeGuard` (capture change/drop; drop lẫn lộn phát lại drop đã lọc) đăng ký providers + importMap (2 dòng), `reject()` gán name "APIError". Test FAIL→PASS (`validate-file-prod-name.test.ts` mô phỏng name rỗng; `UploadSizeGuard.test.tsx`). typecheck/eslint/pnpm test (446 file, 4680 test)/build PASS. Trình duyệt thật trên build prod (port 3100): gallery + media/create + ô tài liệu dự án đều chặn 1 toast; REST 413 giữ chữ Việt. Không tìm thấy ô upload đơn ở Tin tức/Cho thuê (không có nút "Tải lên"), nên ô đơn được đo qua `/admin/collections/media/create`.
- 2026-10-28 (builder, attempt 2 sau reviewer r1 FAIL): MAJOR-1 drop toàn tệp quá cỡ nay phát lại drop RỖNG (cờ REDISPATCHED) để Dropzone Payload gỡ "dragging"; MINOR-1 thêm listener paste (capture); MINOR-2 drop phát lại giữ toạ độ/phím bổ trợ; MINOR-4 làm tròn lên (10 MB + 1 byte → 10,1 MB). Verify attempt 2: typecheck PASS (sửa lỗi TS2339 ở redispatchDrop), vitest src/lib/upload + UploadSizeGuard 30/30, eslint PASS, build PASS, trình duyệt prod như bảng Repro.

- Attempt 2 verify: typecheck, eslint, vitest UploadSizeGuard (10 test) + src/lib/upload, pnpm build PASS. Build prod 3100, drop DragEvent tổng hợp 11 MB lên dropzone drawer: 1 toast, không request upload multipart, dropzone không còn class dragging, "Chọn tệp" vẫn mở file chooser; drop lẫn lộn → chỉ ok.jpg vào drawer. Ảnh `bl088-after-drop-big.png`, `bl088-after-drop-mixed.png`.

## Residual risk
- MINOR-3 (không code): giới hạn client theo MIME khai báo, server theo magic bytes → JPEG đổi đuôi .mp4 (10–15 MB) hoặc avif MIME rỗng (10–20 MB) lọt client và gặp 413 (message tiếng Việt nhờ reject(), nhưng toast "Successfully saved" kép vẫn có thể hiện). `private-files` (trần 5 MB) bị client kiểm theo MEDIA_POLICY nên PDF 5–20 MB lọt client rồi 413. Hiếm; đề xuất follow-up nếu cần.
- 2026-10-28 (change-request close-out): r2 STRICT PASS (2 MINOR mới chấp nhận: dán chữ kèm ảnh quá cỡ bị chặn cả lượt; drop kiểm bằng sự kiện tổng hợp). Doc impact: no doc impact. Spec publish: no spec change (1.59.0), test-scope v90 (v89 archive). importMap: commit chỉ 2 dòng UploadSizeGuard (dòng WardField BL-077 để ngoài, stage bằng git apply --cached).
