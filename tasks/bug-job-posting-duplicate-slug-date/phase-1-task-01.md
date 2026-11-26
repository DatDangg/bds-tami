# bug-job-posting-duplicate-slug-date · phase-1-task-01 — "Tạo bản sao" giữ slug cũ + ngày xuất bản cũ (BL-128)

- Change doc: `spec/changes/2026-11-26-job-posting-duplicate-slug-date.md` (BACKLOG BL-128, QA 43, Thấp).
- Phụ thuộc: không.
- Trạng thái: `review_passed` — STRICT FAIL round 1 (2 MAJOR slug: khớp tiền tố, `rented` chưa publishedAt) → STRICT PASS round 2 (`.context/review-reports/bug-job-posting-duplicate-slug-date-phase-1-task-01-round-2-review.md`); MINOR: rental `rented`→`hidden` chưa từng `published` có thể đổi slug (follow-up); ERD §1.1 đã ghi lúc close-out. Spec 1.64.6 / scope v127.

## Classification / Risk
- Type: **BUG** (batch BL-125→129 user duyệt + auto proceed 2026-11-26; change doc: kiểm collection khác, cùng lỗi → sửa chung một chỗ).
- Severity: low.
- Risk: **HIGH-ish / STRICT** — field dùng chung `slugField`, `publishedAtField`, `statusField` của MỌI collection nội dung qua `withContentDefaults` (`src/collections/_shared/content-defaults.ts:101-105`: news, projects, rentals, property-posts, job-postings, services, developers; pages/categories `disableDuplicate`). Đụng URL công khai (slug) và trạng thái xuất bản. Không schema/migration.
- Expected review level: STRICT.
- Doc impact dự kiến: `docs/ERD.md` §1.1 dòng "Nhân bản bỏ slug…" (`:157`) + status/publishedAt; SPECIFICATIONS as-built PATCH.

## Root cause (đã xác định từ code)
1. **Ngày xuất bản:** `src/fields/published-at.ts:9-14` `stampFirstPublish` giữ giá trị đã có (`previousValue ?? value`), field không có `beforeDuplicate` (`:54-62`; bản hẹn giờ News `:20-26`, `:41-52` cũng vậy) → bản sao mang nguyên `publishedAt` của bản gốc (18/10 < ngày tạo 28/10). So với `src/fields/translation.ts:72-80` đã có `resetOnDuplicate(...)` cho từng field hệ thống.
2. **Trạng thái:** `src/fields/status.ts` (defaultValue `draft`, `:25`) không có `beforeDuplicate` → bản sao của tin đang `published` được tạo ngay ở trạng thái `published` (công khai ngay, nội dung trùng) — builder xác nhận bằng code Payload duplicate.
3. **Slug:** `src/fields/slug.ts:121,133` `dropSlugOnDuplicate` bỏ slug, nhưng Payload 3 "Duplicate" TẠO bản ghi ngay → `makeSlugHook` (`:61-106`) sinh slug từ tiêu đề CŨ (đã chép) + hậu tố (`truong-nhom-kinh-doanh-da-dong-3`). Khi admin đổi tiêu đề và lưu, form gửi lại slug đã lưu → `typed` = slug cũ → giữ nguyên ("Slug đã lưu mà request không gửi lại thì giữ nguyên… để URL ổn định", `:57-58`). ERD `docs/ERD.md:157` ghi ý định "Nhân bản bỏ slug mọi locale để sinh lại" nhưng thực tế sinh lại từ tiêu đề cũ.

## Thiết kế fix (sửa chung ở field dùng chung)
- `statusField`: `beforeDuplicate` → `"draft"` (bản sao không tự công khai).
- `publishedAtField` (cả bản thường và bản `scheduled` của News): `beforeDuplicate` → `null`; xuất bản lần đầu sau đó `stampFirstPublish` đóng dấu thời điểm mới.
- Slug theo tiêu đề mới: trong `makeSlugHook`, khi update mà (a) bản ghi **chưa từng xuất bản** (`originalDoc.publishedAt` trống và `originalDoc.status !== "published"`), (b) slug gửi lên trùng slug đã lưu (người dùng không tự sửa slug), (c) slug đã lưu là slug **tự sinh** từ tiêu đề đã lưu (= `slugify(originalDoc[sourceField])` hoặc dạng có hậu tố `-N` của nó), và (d) tiêu đề đổi → sinh lại từ tiêu đề mới (vẫn qua `findFreeSlug` để unique). Bản đã xuất bản (có URL công khai) giữ nguyên luật cũ (URL ổn định). Builder có thể chọn cách tương đương nếu Payload có cờ "đang duplicate" dùng được, nhưng phải bao trường hợp "lưu bản sao lần sau với tiêu đề mới".
- Kiểm `src/hooks/create-slug-redirect.ts`: đổi slug của bản chưa từng xuất bản KHÔNG được tạo redirect rác (nếu hook hiện tạo redirect cho mọi lần đổi slug → chặn cho bản chưa xuất bản, hoặc báo lý do không cần).
- Field hệ thống khác của job-postings (hạn nộp `deadline`, đã đóng, đếm/ứng tuyển…) và các collection khác (`rentals` mã `code` đã sinh mới — ERD:344; `isFeatured`, view count…): builder liệt kê field hệ thống nào bị chép sai khi nhân bản; chỉ sửa field **hệ thống** rõ ràng sai (trạng thái, ngày xuất bản, đếm); field nội dung người nhập (deadline, lương…) giữ để admin sửa. Ghi danh sách vào task.
- Locale EN: slug EN đã bị bỏ khi nhân bản + `hasEnglish=false` (translation.ts) — giữ nguyên; luật sinh lại slug áp dụng theo từng locale.

## Files
- Đã sửa: `src/fields/status.ts`, `src/fields/published-at.ts`, `src/fields/slug.ts` (+ `src/hooks/create-slug-redirect.ts` nếu cần).
- Test: `src/fields/slug.test.ts`, `src/fields/published-at.test.ts`, `src/fields/status.test.ts` (mới). `create-slug-redirect.ts` không đổi.
- KHÔNG đụng: `src/jobs/close-job-postings.ts`, `src/jobs/*`, `src/payload-types.ts` và mọi file bẩn có sẵn ngoài scope; `.context/runs/*`. Không migration.

## Acceptance
- [ ] Bản sao: `status = draft`, `publishedAt` trống; xuất bản lần đầu → ngày = lúc xuất bản (≥ ngày tạo).
- [ ] Bản sao đổi tiêu đề → Lưu → slug theo tiêu đề mới (unique, hậu tố nếu trùng).
- [ ] Bản đã xuất bản đổi tiêu đề → slug KHÔNG đổi (luật cũ, URL ổn định).
- [ ] Bản nháp người dùng tự sửa slug → giữ slug người dùng.
- [ ] Áp dụng chung news / projects / rentals / property-posts / job-postings / services / developers (field dùng chung).
- [ ] Test FAIL trước / PASS sau; `pnpm vitest run src/fields src/hooks src/collections`, `pnpm typecheck`, eslint file đổi PASS.

## Verification Plan
- Test-first: unit test hook `beforeDuplicate` của status/publishedAt; unit test `makeSlugHook` với `originalDoc` chưa xuất bản/đã xuất bản, slug tự sinh/tự sửa (mock `req.payload.find`).
- Integration Payload/DB skip (không Docker) → ghi residual.

## Retry / Error Memory
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.
- Attempt 2 sau review round 1 FAIL: (1) bỏ so khớp `startsWith` tiền tố → khớp chính xác `slugify`/`suffixedSlug`; (2) "chưa công khai" = status ∈ {draft, hidden} và không có publishedAt (không chỉ `!== published`, tránh `rented`); (3) cập nhật doc comment `makeSlugHook`. Thêm 4 test (slug rút gọn giữ, slug dài cắt + hậu tố sinh lại, `rented` giữ, `hidden` sinh lại).

## Repro Verification
- Original repro: Admin › Tuyển dụng › "…" → Tạo bản sao → đổi tiêu đề → Lưu: slug `truong-nhom-kinh-doanh-da-dong-3`, ngày xuất bản 18/10 < ngày tạo 28/10.
- Expected: slug theo tiêu đề mới; ngày xuất bản mới.
- Actual before fix: bản sao mang nguyên `publishedAt` + `status` của bản gốc (Payload `beforeDuplicate` không có hook ở status/publishedAt); slug sinh từ tiêu đề cũ rồi giữ nguyên khi đổi tiêu đề + lưu. 6 test mới FAIL trước fix.
- Actual after fix: bản sao `status = draft`, `publishedAt = null` (xuất bản lần đầu đóng dấu mới); bản nháp chưa từng xuất bản có slug tự sinh + đổi tiêu đề → slug theo tiêu đề mới (qua findFreeSlug); bản đã xuất bản / đã từng có ngày xuất bản / slug tự sửa giữ nguyên.
- Evidence: `pnpm vitest run src/fields src/hooks src/collections` 43 file / 372 test PASS; `pnpm typecheck` PASS; eslint file đổi sạch. Payload (node_modules/payload/dist/duplicateDocument + fields/hooks/beforeDuplicate): hook field `beforeDuplicate` chạy cho MỌI field (không qua access, không cờ "duplicate" trong context), trả `undefined` = giữ giá trị cũ (field không localized) / bỏ (localized) → status trả "draft", publishedAt trả `null`. Bản sao tạo ngay qua create nên slug sinh từ tiêu đề cũ → xử lý ở lần update bằng `shouldRegenerateFromNewTitle` (slug.ts). `create-slug-redirect.ts` chỉ chạy khi doc/previousDoc công khai → bản nháp đổi slug không tạo redirect: KHÔNG cần sửa.
- Status: PASS (unit; integration DB skip)

## Residual risk
- Integration Payload/DB (duplicate thật qua admin) chưa chạy (không Docker); luồng suy ra từ mã Payload.
- Heuristic "slug tự sinh" (attempt 2, khớp CHÍNH XÁC): `slugify(titleCũ)` hoặc `suffixedSlug(slugify(titleCũ), N)` (N từ hậu tố `-N` ≥ 2, tính cả cắt ngắn); không còn so tiền tố nên slug người dùng tự rút gọn được giữ. Slug người dùng tình cờ trùng đúng dạng tự sinh vẫn bị sinh lại (chỉ bản chưa từng công khai).
- Điều kiện "chưa từng công khai" (attempt 2): status lưu ∈ {`draft`,`hidden`} VÀ không có publishedAt; `published`, `rented` (Cho thuê, công khai) hoặc có publishedAt thì giữ slug.
- Field hệ thống chép sai khi nhân bản (kiểm theo collection dùng chung): `status` (đã sửa → draft), `publishedAt` (đã sửa → null). Đã có sẵn/không cần sửa: `slug` (bỏ), `hasEnglish`/`translation` (translation.ts resetOnDuplicate), `code` Cho thuê (sinh mới khi create, ERD:344). Giữ vì là nội dung người nhập: `deadline`, lương, `isFeatured`. Không có bộ đếm lượt xem trên các collection nội dung (chỉ bảng NewsViewsDaily riêng). Job-postings không có field "đã đóng" riêng: hết hạn suy ra từ `deadline` (nội dung người nhập, giữ) nên bản sao tin đã hết hạn vẫn hiện hết hạn cho tới khi admin sửa hạn nộp.

## Doc / Decision Impact
- `docs/ERD.md:157` (đang bẩn sẵn — KHÔNG sửa, close-out xử lý riêng dòng) + SPECIFICATIONS as-built PATCH qua spec-publisher.
