# feature-listing-detail-redesign · phase-1-task-07 — Script điền dữ liệu cũ (phần Dự án) `pnpm backfill:listing-fields`

- Nguồn: BL-052 change doc "Chế độ chạy": trích từ nội dung có sẵn, chỉ điền ô trống, chạy DB dev, báo cáo cho admin soát; staging/prod chỉ khi user bảo.
- Spec: 1.46.0 khối BL-052 mục "Điền dữ liệu cũ (script, dev only)".
- Plan: phase 1 wave B (sau P1-T01). Phần Tin BĐS thêm ở P3-T05 (thiết kế script để mở rộng theo collection).
- Phụ thuộc: P1-T01.

## Classification / Risk
- Type: **ADDITIVE** (script).
- Risk: **HIGH** — bulk update dữ liệu (chỉ dev), phải có guard môi trường.
- Expected review level: **STRICT**.
- Blast radius: `scripts/backfill-listing-fields.ts` (hoặc theo vị trí script seed hiện có, vd `src/scripts/*` — xem `package.json` các lệnh `seed:*`), `package.json`, `docs/reports/`.

## Scope
1. Lệnh `pnpm backfill:listing-fields [--apply] [--collection projects]`: mặc định **dry-run** (không ghi), `--apply` ghi qua Payload Local API (không SQL trực tiếp, `overrideAccess` + context bỏ dịch tự động/revalidate nếu cần — theo mẫu seed sẵn có).
2. Guard: từ chối khi `NODE_ENV=production` hoặc host/tên DB không phải DB dev cục bộ (theo guard của các seed sẵn có — bài học BL-045 T08: guard phải chặn cả staging, không chỉ production); không publish/đổi trạng thái tin.
3. **Chỉ điền ô trống** (mảng rỗng / null), không ghi đè giá trị admin đã nhập; idempotent (chạy lại không đổi gì).
4. Trích Dự án (VI là nguồn; EN chỉ điền chữ localized khi có cách hợp lý, không thì để trống và ghi báo cáo):
   - `productTypes`: từ khoá trong tên, danh mục, `summary`, `overview` (rich text → text), `priceTable[].unitType` (vd "căn hộ", "chung cư" → apartment; "liền kề", "nhà phố" → townhouse; "biệt thự" → villa; "shophouse"; "đất nền"; "nghỉ dưỡng"/"resort"; "condotel"; "văn phòng"/"officetel" → office).
   - `featuredAmenities`: từ khoá trong overview / `amenities[].name` / `nearbyAmenities` (nhóm education → near_school, healthcare → near_hospital, shopping → near_mall, transport + "metro" → near_metro; "view sông/hồ" → water_view; "hồ bơi"/"gym"/"spa" → pool_gym_spa; "công viên" → green_park).
   - `products`: mẫu "<số> <loại> (… m²)" trong overview (vd "96 biệt thự đơn lập (200–360 m²)"); không chắc → không điền, chỉ ghi gợi ý trong báo cáo.
5. Báo cáo Markdown `docs/reports/backfill-listing-fields-<YYYY-MM-DD>.md`: tổng quan (số tin quét / điền / bỏ qua), bảng tin · trường · giá trị điền · đoạn nguồn (cắt ngắn) · độ tin cậy; mục "cần admin soát". Dry-run cũng xuất báo cáo (ghi rõ chế độ).
6. Test đơn vị cho bộ trích (từ khoá → giá trị, không điền ô đã có, idempotent) + test guard.
7. Chạy thật trên DB worktree (dữ liệu dev sao chép / seed) để kiểm; **primary** chạy `--apply` trên DB dev chính sau khi merge (không chạy staging/prod).

## Acceptance
- [ ] Dry-run không ghi DB (test); `--apply` chỉ điền ô trống; chạy lại không đổi.
- [ ] Guard chặn production/staging (test).
- [ ] Báo cáo sinh đúng định dạng; không chứa dữ liệu nhạy cảm (chỉ tên tin + trường + đoạn nội dung công khai).
- [ ] `pnpm typecheck` · `pnpm lint` · `pnpm test` PASS.

## Quy ước song song (spec-validation r1 F2/F6)
- i18n: chỉ thêm key trong **namespace riêng của task** (ghi tên namespace trong báo cáo), thêm vào **cuối** object namespace đó ở `src/i18n/messages/vi.json` + `en.json`; không sắp xếp lại / format lại file. Primary gộp xung đột khi merge.
- Không sửa file thuộc task song song cùng wave (xem mục Plan / Blast radius); cần thì ghi vào báo cáo để primary chuyển.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Quyết định (builder)
- **Vị trí & cấu trúc:** lõi thuần ở `src/lib/backfill/` (test được), CLI mỏng `scripts/backfill-listing-fields.ts` chạy `payload run` như các `seed:*`. Mỗi collection là một `BackfillAdapter` (`types.ts`: `collection`, `label`, `fields`, `plan(payload)`), đăng ký trong `BACKFILL_ADAPTERS` (`run.ts`). **P3-T05:** thêm `src/lib/backfill/property-posts.ts` (adapter) + 1 dòng vào `BACKFILL_ADAPTERS`; runner, báo cáo, guard, CLI không phải sửa.
- **Lệnh:** `"backfill:listing-fields": "payload run scripts/backfill-listing-fields.ts --"`. `payload run` chỉ chuyển tham số vị trí (`args._`) cho script, nên phải có `--` ở cuối để `--apply` / `--collection` tới được script (đã thử thật). Tham số lạ (vd `--aply`) → báo lỗi, không chạy.
- **Guard `checkBackfillEnvironment` (chặt hơn `checkSeedEnvironment`, không có cờ mở staging):** cho chạy chỉ khi đủ cả: `NODE_ENV` ≠ `production`; `APP_ENV` trống hoặc `development|dev|local`; có `DATABASE_URL` đọc được dạng URL, không trùng `DATABASE_URL_STAGING` / `DATABASE_URL_PROD`; host DB ∈ `localhost`, `127.0.0.1`, `::1`. Lý do từ chối không in chuỗi kết nối. Chạy staging/prod (khi user bảo) cần sửa code có chủ đích.
- **Ghi:** Payload Local API `update` từng tin, `locale: "vi"`, `overrideAccess`, context `translationJob: true` (không xếp job dịch AI); chỉ gửi các ô đang trống, không gửi `status` (không publish / đổi trạng thái). Revalidate ngoài Next chỉ log cảnh báo (như seed). Lỗi một tin → ghi vào báo cáo, chạy tiếp.
- **Chỉ ô trống:** `productTypes` / `featuredAmenities` / `products` = `null` hoặc mảng rỗng. Idempotent: lần sau ô đã có giá trị → bỏ qua.
- **Trích (VI là nguồn):** độ tin cậy **cao** = tên, danh mục, `priceTable[].unitType`, `amenities[]`, nhóm `nearbyAmenities` (education/healthcare/shopping/park; transport chỉ khi tên có metro/tàu điện); **trung bình** = `summary`, `overview` → mọi giá trị trung bình vào mục "Cần admin soát". Loại trừ cụm dễ nhầm: "căn hộ khách sạn" (chỉ condotel), "nhà phố thương mại" (shophouse), "văn phòng bán hàng/đại diện/giao dịch/công ty/chủ đầu tư/tư vấn", "hồ bơi" ≠ view hồ; "nghỉ dưỡng" chỉ tính khi đi sau danh từ loại hình (khu/biệt thự/căn hộ/đô thị/tổ hợp/quần thể/dự án/bất động sản) — bỏ lời quảng cáo kiểu "thiên đường nghỉ dưỡng".
- **`products`:** chỉ điền khi trong cùng câu có "<số> [căn|lô] <loại> [≤2 chữ] … <a>[–<b>] m²" (số kiểu VN `1.200`, `493,9`; bỏ số giống năm 1990–2100 khi không có "căn/lô"; diện tích ngược / > 100.000 → bỏ); trùng loại → lấy lần đầu; tối đa 8. Thiếu diện tích, hoặc dạng "<loại>: a – b m²" (không có số lượng) → chỉ ghi **gợi ý**. Diện tích một giá trị → `areaFrom`, `areaTo` để trống.
- **EN:** `productTypes` / `featuredAmenities` là select (không localized). `products[].type` localized: chỉ ghi `vi`, bản EN để trống + ghi nhắc trong báo cáo ("nhập tay hoặc Dịch lại bằng AI") — không gọi Claude API từ script.
- **Báo cáo:** `docs/reports/backfill-listing-fields-<YYYY-MM-DD>.md` (ngày giờ VN; chạy lại cùng ngày ghi đè), cả dry-run (ghi rõ chế độ). Chỉ có tên tin (+ "(nháp)" nếu chưa xuất bản), trường, giá trị, đoạn nội dung admin đã nhập; không id, không thông tin môi trường.
- Không thêm i18n key, không migration, không phụ thuộc mới.

## Verification summary (Builder)
- DB worktree `tami_wt52_p1t07` (bản sao `pg_dump` của DB dev `tami`, chỉ đọc `tami`), Redis DB 6; `pnpm payload migrate` → không còn migration chờ.
- Dry-run: `Dự án: quét 61, sẽ điền 54` — DB không đổi (bảng `projects_product_types` / `projects_featured_amenities` / `projects_products` vẫn 0 dòng, `--apply` ngay sau đó vẫn tìm thấy 54 tin cần điền).
- `--apply`: `quét 61, đã điền 54, lỗi 0` → `productTypes` 52 tin (133 giá trị), `featuredAmenities` 26 tin (58 giá trị), `products` 2 tin (6 dòng, chỉ locale vi). 61 dự án vẫn `published` (không đổi trạng thái).
- Chạy lại `--apply --collection projects`: `đã điền 0, lỗi 0` (idempotent).
- Guard chạy thật: `APP_ENV=staging`, `NODE_ENV=production`, `DATABASE_URL` host `postgres` → đều từ chối, exit 1.
- Báo cáo mẫu: `docs/reports/backfill-listing-fields-2026-10-21.md` (lần `--apply` trên DB worktree vừa khôi phục lại từ bản sao).
- Test: `src/lib/backfill/{guard,projects,run}.test.ts` — 24 test PASS (từ khoá → giá trị, nguồn/độ tin cậy, cụm loại trừ, không ghi đè, products/gợi ý, dry-run không gọi `update`, `--apply` chỉ gửi ô trống + locale vi + context dịch + không `status`, chạy lại không đổi, lỗi ghi không dừng lượt, parse tham số, định dạng báo cáo, guard chặn prod/staging/host lạ/không lộ mật khẩu).
- `pnpm typecheck` PASS · `pnpm lint` PASS (0 lỗi; 2 cảnh báo có sẵn ở `tools/task-dashboard/server.mjs`) · `pnpm test`: 371/373 file PASS (3672 test); 2 file integration `jobs-email`, `media-upload` lỗi ở hook `beforeAll` (timeout SMTP giả / SeaweedFS khi nhiều worktree chạy cùng lúc) — chạy riêng 2 file: 25/25 PASS. Không file nào import `src/lib/backfill`.

## Attempt 2 (reviewer r1 FAIL — `.context/review-reports/feature-listing-detail-redesign-phase-1-task-07-round-1-review.md`)
Thay các điểm tương ứng ở "Quyết định (builder)" phía trên:
- **F1 (MAJOR) — báo cáo không bao giờ ghi đè:** tên `docs/reports/backfill-listing-fields-<YYYY-MM-DD>-<HHmm>-<apply|dry-run>.md` (giờ VN); ghi bằng cờ `wx` (`writeBackfillReport`), trùng phút → hậu tố `-2`, `-3`… Quyết định đơn giản: dry-run vẫn ghi file (để xem trước) nhưng bị gitignore (`docs/reports/backfill-listing-fields-*-dry-run*.md` trong `.gitignore`); chỉ báo cáo `--apply` được commit. Test: tên theo chế độ/giờ VN, dry-run sau apply cùng phút không đè, apply lần 2 ra `-2`.
- **F2 — tin chưa xuất bản:** `DocPlan.isPublic`; báo cáo ghi `(chưa xuất bản) id \`<id>\`` + trường + giá trị, đoạn nguồn thay bằng "(ẩn — tin chưa xuất bản)" ở cả bảng chi tiết lẫn mục cần soát. Áp dụng chung cho mọi adapter (P3-T05 chỉ cần đặt `isPublic`). Test.
- **F3 — guard so chuẩn hoá:** khi có `DATABASE_URL_STAGING` / `DATABASE_URL_PROD`, chuẩn hoá (host chữ thường, port mặc định 5432, tên DB chữ thường) → trùng **tên DB** hoặc trùng **host:port** đều chặn (chặn tunnel `localhost:<port>/tami_prod`); biến có mặt nhưng không đọc được dạng URL → chặn. Đánh đổi: dev đặt biến staging/prod trong `.env.local` mà DB dev trùng tên DB staging (vd cùng `tami`) sẽ bị chặn — cố ý (an toàn hơn), lý do in rõ. Test.
- **F4 — đếm tách:** "Không điền — mọi ô đã có giá trị" vs "Không điền — có ô trống nhưng không trích được"; cột trường đổi thành "Ô trống, không trích được". Test chạy lại sau apply (2 vs 1).
- **F5 — tách `planProject`:** `planProductTypes` / `planFeaturedAmenities` / `planProducts` (mỗi hàm ≤ 25 dòng) + vòng `FIELD_PLANNERS`; `planProject` còn ~18 dòng. Hành vi giữ nguyên (test cũ PASS).

### Verification summary (Builder, attempt 2)
- DB worktree `tami_wt52_p1t07` dựng lại sạch từ `pg_dump` mới của `tami` (chỉ đọc `tami`) → `pnpm payload migrate` (không còn migration chờ) → 3 bảng mới 0 dòng, 61 dự án `published`.
- `pnpm backfill:listing-fields --apply` một lần: `quét 61, đã điền 54, lỗi 0` → **báo cáo mẫu `docs/reports/backfill-listing-fields-2026-10-21-2233-apply.md`**.
- Dry-run ngay sau: `sẽ điền 0` (idempotent), sinh `…-2233-dry-run.md` riêng (gitignored, đã xoá), báo cáo apply giữ nguyên (md5 trước/sau trùng).
- `pnpm vitest run src/lib/backfill`: 3 file, 29 test PASS · `pnpm typecheck` PASS · `pnpm lint` 0 lỗi (2 cảnh báo có sẵn ở `tools/task-dashboard/server.mjs`).

## Review
- Round 1 FAIL (F1 báo cáo apply bị ghi đè) → attempt 2; **Round 2 STRICT PASS** — `.context/review-reports/feature-listing-detail-redesign-phase-1-task-07-round-2-review.md`. MINOR N1 (dòng ghi lỗi vẫn tính vào "Đã điền") → P3-T05; N2 (.env.example staging/prod cùng tên DB `tami` → guard chặn nếu dev chép) — giữ, an toàn hơn.

## Verification summary (close-out)
- Acceptance: **PASS**. typecheck · lint 0 error · vitest src/lib/backfill 29 PASS. Chạy thật trên DB dev chính: primary sau merge (báo cáo `docs/reports/backfill-listing-fields-<ngày>-<giờ>-apply.md`).
