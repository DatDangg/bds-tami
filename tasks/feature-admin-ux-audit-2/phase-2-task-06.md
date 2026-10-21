# feature-admin-ux-audit-2 · phase-2-task-06 — Global Trang chủ gom 5 tab, mỗi khối thu gọn + "Hiện khối này trên web" (A14)

- Nguồn: `spec/changes/2026-10-21-admin-ux-audit-2.md` (BL-051, MODIFY) — giai đoạn 2. Báo cáo `docs/reviews/2026-10-21-admin-ux-audit-2.md` §2.6.1.
- Spec: `SPECIFICATIONS.md` F10, đoạn "Admin gọn — audit lần 2, giai đoạn 2 (BL-051)".
- Plan: GĐ2 = 1 phase / 6 task tuần tự (trùng importMap / payload.config / style admin). Coordinator 2026-10-21: làm cả GĐ2 trong lượt này, không dừng hỏi (user "tự làm tự quyết, đừng hỏi").
- Phụ thuộc: sau P2-T05.

## Classification / Risk
- Type: **MODIFY** (chỉ `admin` / component hiển thị / CSS; không schema/DB/access/API, không migration).
- Risk: **MEDIUM** — chỉ bố cục admin global Trang chủ; tab không tên giữ đường dẫn dữ liệu.
- Expected review level: **NORMAL**.
- Blast radius: `src/globals/Homepage.ts`, `src/globals/homepage/blocks.ts` (`enabledField` dùng chung).
- Doc impact: spec delta F10 GĐ2; dự kiến không đổi API/ERD.

## Scope
1. 14 tab hiện tại → 5 tab theo spec (Đầu trang & Banner · Giới thiệu & Uy tín · Sản phẩm & Tin nổi bật · Chuyển đổi & Bố cục · SEO & Đa ngôn ngữ). Tab **không** `name` → đường dẫn dữ liệu giữ.
2. Mỗi khối (group có tên) có tiêu đề tên khối và thu gọn được (bọc `collapsible` hoặc tương đương không đổi path); công tắc `enabledField` đổi nhãn "Hiển thị khối này" → "Hiện khối này trên web" (chỉ nhãn; kiểm nơi khác dùng chung `enabledField`). Không thêm field.
3. Kiểm `src/payload-types.ts` chỉ đổi chú thích (regen `pnpm generate:types` rồi diff), không cần migration. Trang chủ công khai render như cũ.
4. Test: 5 tab + danh sách path field global Trang chủ không đổi so với trước.

5. **Carry-over MINOR review P2-T05** (`src/fields/translation.ts`, `src/components/admin/TranslationSummary.tsx`): bỏ wrapper thừa `translationBlockFields` (export trực tiếp); tách nghĩa cờ `translationGroup(withActions)` (vd `translationDataGroup()` cho group ẩn + `translationGroup()` cho global) — không đổi path/hành vi; sửa JSDoc vị trí cũ trong `TranslationSummary.tsx`.
6. **Chứng minh không có diff schema** cho cả BL-051: chạy `pnpm payload migrate:create` (tên tạm) — nếu Payload báo không có thay đổi / sinh file rỗng thì xoá file tạm và ghi kết quả; nếu sinh thay đổi thật → DỪNG, ghi rõ, không commit migration.

## Acceptance
- [ ] Admin Trang chủ có 5 tab đúng nhóm; mỗi khối thu gọn có công tắc "Hiện khối này trên web"; lưu được; trang chủ công khai không đổi.
- [ ] Danh sách đường dẫn dữ liệu global Trang chủ y hệt trước (test), `payload-types.ts` chỉ đổi chú thích, không migration.
- [ ] Không đổi schema (`src/payload-types.ts` chỉ được đổi chú thích sinh từ mô tả/nhãn; không migration), access, API.
- [ ] Sáng/tối, 375px + 1280px không tràn ngang; vùng bấm ≥ 44px; không phá GĐ1 (e83a86b, b7f762c, d641351) và BL-050 (827ea1c).
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` PASS; `pnpm generate:importmap` nếu thêm component.

## Verify
- Lệnh từ `.context/project-config.md`; trình duyệt dev server `tami-dev` (`.claude/launch.json`); tài khoản test `@example.test`, xoá theo id sau khi kiểm, không ghi mật khẩu ra chat/commit.

## Quyết định
- (change-request) Không thêm cờ bật/tắt mới (vd Banner) dù change doc cho phép migration additive: spec giữ "không migration" cho cả BL-051; Banner là khối bắt buộc đầu trang. Mô tả hướng dẫn tắt khối cũ (SPEC dòng 75) nay nằm ở ô "Thứ tự các khối" trong tab "Chuyển đổi & Bố cục".
- (builder) Cơ chế: `homepageTabs()` trong `src/globals/Homepage.ts` dựng 5 tab KHÔNG tên bằng `formTabs`; mỗi group khối bọc trong `collapsible` KHÔNG tên (`homepageBlock`) có tiêu đề = tên khối. Vỏ không tên nên đường dẫn dữ liệu / hook / validate / API giữ nguyên (test so sánh đủ 97 đường dẫn trước-sau).
- (builder) Nhãn của chính group trong collapsible đặt `label: false` để tiêu đề không lặp (collapsible đã có tên khối). Quét nhãn `tests/unit/admin-labels.test.ts` đòi mọi field có tên phải có nhãn → sửa quét: group `label: false` chỉ hợp lệ khi cha trực tiếp là collapsible có nhãn (thêm 2 ca âm tính vào test "kiểm âm tính").
- (builder) "Thứ tự các khối" (`blockOrder`) KHÔNG bọc collapsible, đặt cuối tab "Chuyển đổi & Bố cục": nó điều khiển cả trang chứ không phải một khối, và mô tả hướng dẫn tắt khối ngoài mockup nằm ở chính ô này nên không được giấu sau thanh thu gọn; giữ nhãn mảng nên thông báo lỗi validate vẫn nêu đúng tên ô.
- (builder) Khối đầu mỗi tab mở sẵn (`initCollapsed: false`), các khối sau thu gọn — tab "Sản phẩm & Tin nổi bật" có 5 khối dài nên thu gọn mặc định để lướt được.
- (builder) `enabledField` chỉ đổi nhãn "Hiển thị khối này" → "Hiện khối này trên web" (name/kiểu/mặc định giữ). Nơi dùng chung: chỉ Trang chủ (11 khối có công tắc); không global/collection khác dùng. `BLOCK_ORDER_NOTE` và mô tả `blockOrder` sửa chữ theo tên mới ("Thứ tự các khối", tab "Chuyển đổi & Bố cục", "Hiện khối này trên web") — chỉ mô tả, không field mới.
- (builder) Carry-over A11: `translationBlockFields` export trực tiếp (bỏ wrapper `translationActionFields`); tách `translationGroup()` (global, hiện trong form, có tóm tắt + nút) và `translationDataGroup()` (collection nội dung, ẩn cả nhóm) trên một hàm dựng nội bộ `buildTranslationGroup(showInForm)`; `translationFields()` dùng `translationDataGroup()`. Không đổi path/hành vi. JSDoc `TranslationSummary` cập nhật vị trí (khối cột phải + tab "SEO & Đa ngôn ngữ").
- (builder) CSS: `.collapsible__toggle` min-height 44px ở ≤767px (`_forms.scss`) vì thanh tiêu đề Payload mặc định cao 40px (ảnh hưởng mọi collapsible trong admin ở mobile, chỉ cao hơn chút).


## Verification summary (Builder)
- `pnpm typecheck`: PASS (không lỗi). `pnpm lint`: 0 error, 2 warning có sẵn ở `tools/task-dashboard/server.mjs` (không thuộc task).
- `pnpm test`: 361 file PASS, 3639 test PASS (lần chạy cuối; lần đầu 1 FAIL ở `tests/unit/admin-labels.test.ts` do group `label: false` → đã sửa quét như mục Quyết định). Test mới: `src/globals/Homepage.test.ts` (5 test: 5 tab không tên đúng nhãn; 97 đường dẫn dữ liệu y hệt trước — so ngược với danh sách ghi từ `HEAD`; khối collapsible theo từng tab + khối đầu mở/sau thu gọn + group `label: false`; 11 công tắc nhãn "Hiện khối này trên web"; `blockOrder` còn hướng dẫn); `tests/unit/admin-labels.test.ts` thêm 2 ca âm tính cho quy tắc `label: false`.
- `pnpm generate:types` + diff: `src/payload-types.ts` chỉ đổi chú thích (4 dòng: mô tả `blockOrder` và 3 dòng "Khối chỉ hiện khi có trong mục…") và THỨ TỰ thuộc tính của `Homepage`/`HomepageSelect` theo thứ tự khối mới; so tập dòng đã sắp xếp trước/sau (bỏ CRLF) chỉ khác đúng 4 dòng chú thích đó → không đổi kiểu. (git báo 69+/69- do đổi chỗ khối.)
- `pnpm payload migrate:create` (tên tạm, 2 lần): "No schema changes detected" (hộp hỏi tạo migration trống để mặc định N) → không sinh file, `git status` không có migration. `generate:importmap`: không thêm component → không chạy.
- Trình duyệt (dev `tami-dev`, tài khoản `@example.test` tạo tạm rồi xoá + xoá script tạm): global Trang chủ có đúng 5 tab; mỗi tab các khối là collapsible có tiêu đề (khối đầu mở, sau thu gọn), nhãn công tắc "Hiện khối này trên web"; nội dung khối hiện khi mở. 375px (tối) và 1280px (sáng/tối): `scrollWidth` = `innerWidth` ở cả 5 tab, thanh tiêu đề khối 44px ở 375px (sau sửa CSS). Lưu thật: tắt "Đối tác" → lưu → API `partners.enabled=false` → bật lại → lưu → `true`; `/vi` trả 200, độ dài HTML 198640 trước và sau (đo ngay sau lưu có lúc ngắn hơn do làm mới cache, đo lại về đúng 198640). Băm JSON global khác trước chỉ vì `updatedAt` đổi sau 2 lần lưu.
- Gap: bản chụp JSON gốc không giữ nên "dữ liệu y nguyên" dựa vào test đường dẫn + vòng bật/tắt một công tắc; `translation.*` sau lưu không đổi trạng thái (status `none`, enSource `manual` như đang có). Chưa soi lại UI sáng ở 375px (chỉ tối), sáng chỉ ở 1280px.

## Residual risk
- Thấp. Nếu Payload bản sau đổi cách vẽ nhãn group `false` thì tiêu đề khối vẫn nằm ở collapsible. CSS min-height 44px áp mọi collapsible admin ở mobile.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Review
- Round 1: `.context/review-reports/feature-admin-ux-audit-2-phase-2-task-06-round-1-review.md` — **NORMAL, PASS**. MINOR mở (không chặn, để lại): (1) `Homepage.ts` 310 dòng > 300 → nên tách helper sang `src/globals/homepage/`; (2) JSDoc `blocks.ts:43` còn tên "Thứ tự khối"; (3) tên test nhắc "group/array"; (4) `PATHS_BEFORE_A14` nên ghi nguồn commit `e2c2473`.

## Verification summary (close-out)
- Acceptance: **PASS**. Reviewer **PASS r1**. `pnpm typecheck` PASS · `pnpm lint` 0 error · `pnpm test` 361 files / 3639 PASS. `pnpm payload migrate:create`: "No schema changes detected" (cả BL-051). `payload-types.ts`: 4 dòng chú thích + đổi thứ tự.

## Doc impact
- Spec delta F10 GĐ2 + câu hướng dẫn SPEC dòng 75. Không đổi API/ERD.
