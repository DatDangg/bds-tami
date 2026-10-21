# feature-admin-form-non-tech-friendly · phase-1-task-05 — Sửa 16 test hỏng ở bộ test đầy đủ do BL-042 (phase validation)

- Nguồn: `.context/review-reports/spec-validation-feature-admin-form-non-tech-friendly-phase-1.md` (R1–R3). Phụ thuộc: T01–T04 (đã commit). Trạng thái: `pending`.

## Classification / Risk
- Type: **MODIFY** (fix hồi quy test/nhãn do T01/T03/T04). Risk: **LOW-MEDIUM** — nhãn field `ui` + test tích hợp upload media. Review **NORMAL**.
- Blast radius: `src/fields/translation.ts` (`translationSummary`), `src/collections/Leads.ts` (`activitySummary`), `src/collections/Rentals.ts` (`codeBanner`), `tests/integration/media-upload.test.ts`.

## Quyết định
- D1 (R1) Đặt `label` tiếng Việt cho 3 field `ui` mới: `translationSummary` → "Tình trạng bản tiếng Anh", `activitySummary` → "Tóm tắt hoạt động", `codeBanner` → "Mã tin". Nếu nhãn làm hiện chữ thừa trên form (component tự render nhãn riêng) thì component không render `label` lần nữa. Test `tests/unit/admin-labels.test.ts` PASS mà không nới quy tắc test.
- D2 (R2) `tests/integration/media-upload.test.ts:171`: hành vi mới theo BL-042 = ảnh tải lên không alt → lưu 201 + alt tự điền từ tên file gốc (hoặc "Hình ảnh"). Viết lại test cho hành vi mới (khẳng định alt đã điền) + giữ một test khẳng định sửa ảnh cũ để trống alt (không tải file mới) vẫn bị chặn 400 nếu chạy được trong integration. Test tự dọn bản ghi/file đã tạo.
- D3 (R3) `media-upload.test.ts:145` 404: tìm root cause sau khi sửa R2 (nghi bản ghi do R2 tạo không được dọn / thứ tự). Chứng minh bằng chạy lại; nếu còn lỗi thì sửa đúng nguyên nhân (không skip test). Không để lại dữ liệu rác trong DB/S3 local.

## Verify
`pnpm test` (bộ đầy đủ, DB + S3 local có sẵn qua `.env.local`) → 0 fail; `pnpm typecheck`; `pnpm lint`.

## Verification summary
- D1: thêm `label` cho `translationSummary` ("Tình trạng bản tiếng Anh"), `activitySummary` ("Tóm tắt hoạt động"), `codeBanner` ("Mã tin"); component custom không render nhãn nên không hiện chữ thừa. `admin-labels.test.ts` giữ nguyên quy tắc, PASS.
- D2: `media-upload.test.ts` viết lại: ảnh mới trống alt → 201, alt = "a"; PATCH alt "" trên ảnh đó → 400 (validator vẫn là lưới an toàn); PDF vẫn không cần alt. Bản ghi tạo ra được đẩy vào `mediaIds` (afterAll dọn DB + S3). Trước đây test cũ nhận 201 mà không dọn → rác.
- D3 (R3) root cause: test chạy riêng file này PASS (R3 không tái hiện); lỗi chỉ ở full suite. Test chọn `sort: -createdAt` limit 1 = "media mới nhất toàn DB", mà `homepage.test.ts` (`insertMedia`) / `projects.test.ts` chèn thẳng bản ghi media KHÔNG có object S3, chạy song song → "mới nhất" có thể là bản ghi đó → `/media/file/<name>` 404. Sửa: ghim đúng filename file JPG test 1 vừa tải (`uploadedJpegFilename`). Không liên quan BL-042.
- Verify: `pnpm test` 333 files / 3422 tests, 0 fail; `pnpm typecheck` OK; `pnpm lint` 0 error (2 warning cũ ở tools/task-dashboard, ngoài scope).
