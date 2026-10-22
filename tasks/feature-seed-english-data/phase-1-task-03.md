# feature-seed-english-data · phase-1-task-03 — Dữ liệu EN viết sẵn: Cho thuê (32) + Tin BĐS (38)

- Nguồn: BL-064 · change doc `spec/changes/2026-10-22-seed-english-data.md`. Spec delta: `SPECIFICATIONS.md` F12 bullet "Dữ liệu dev song ngữ (BL-064…)".
- **Phụ thuộc T01** (đã PASS): bộ máy `seed/english/`, định dạng + quy tắc ở `seed/english/README.md`, export `pnpm seed:english:export`, áp `pnpm seed:english <collection>` — đọc README + Verification summary của `tasks/feature-seed-english-data/phase-1-task-01.md` TRƯỚC khi làm.
- **AUTO PROCEED** (user "tự quyết, đừng hỏi"): không hỏi; chỗ mơ hồ tự chọn rồi ghi vào Verification summary.
- Chạy SONG SONG với task dữ liệu khác (T02/T03/T04) trên cùng working tree + cùng DB dev: CHỈ đụng `seed/english/data/<collection>.json` của: rentals property-posts (và chính task file này); chỉ chạy `pnpm seed:english` có lọc collection của mình. KHÔNG sửa bộ máy `seed/english/*.ts` — thấy bug bộ máy → ghi vào Verification summary (BLOCKED nếu chặn), không tự sửa.

## Classification / Risk
- Type: **MODIFY** (chỉ dữ liệu seed dev). Risk: **LOW** — file JSON dữ liệu, ghi DB dev locale `en`.
- Expected review level: FAST/NORMAL (reviewer tự chọn; trọng tâm: chất lượng tiếng Anh, đủ bản ghi/đủ đoạn, không đổi vi, idempotent).

## Scope
1. Export bản vi: `pnpm seed:english:export` cho rentals property-posts ra thư mục scratch/tạm (KHÔNG commit file export).
2. Viết bản EN **tay** (tiếng Anh tự nhiên, đúng thuật ngữ BĐS: apartment, townhouse, villa, shophouse, handover, land use right certificate / pink book, fully furnished…) cho MỌI bản ghi: title, description/content (richtext), excerpt, priceNote, các trường chữ localized khác, SEO — liệt kê đủ từ export. Tên riêng (tên dự án, chủ đầu tư, địa danh, tên đường) theo quy ước ở README T01; giá/số/đơn vị giữ (tỷ → billion VND, triệu → million VND, m² giữ). Không bỏ đoạn, không tóm tắt — dịch đủ từng chuỗi (giữ đúng số phần tử mảng chuỗi richtext). Không dùng API AI lúc seed; không gọi job dịch.
3. Ghi `seed/english/data/<collection>.json` đúng định dạng README; mỗi bản ghi đủ trường bắt buộc EN để bật `hasEnglish`.
4. Chạy `pnpm seed:english rentals property-posts` 2 lần trên DB dev → lần 2 không đổi gì; `missing` / `mismatched` = 0 (hoặc giải thích từng bản ghi).
5. Coverage SQL sau khi chạy (`select count(*) filter (where has_english), count(*) from <table>`) → 100% (trừ bản ghi giải thích được); alt EN ảnh của các bản ghi (cơ chế D7).
6. Kiểm `/en` (dev :3000): trang danh sách EN của collection (route theo `src/i18n/routing.ts`) có data, số đếm danh mục/tiện ích đúng; mở 1–2 trang chi tiết EN: tiếng Anh, không còn chữ Việt ngoài tên riêng.
7. Verify: test seed/english liên quan PASS (`pnpm test` lọc theo đường dẫn), JSON parse hợp lệ. Không đổi `.ts` → không cần typecheck/build (ghi lý do).
8. **KHÔNG commit / stage.** Không đụng file ngoài scope (danh sách cấm ở T01 §Scope 10, cộng file dữ liệu của task khác).
9. Ghi `## Verification summary` cuối file (số bản ghi, kết quả 2 lần chạy, coverage trước/sau, 2–3 cặp mẫu vi→en, residual) rồi trả report mở đầu `Agent: builder`.

## Acceptance
- [ ] Mọi bản ghi rentals property-posts có EN + `hasEnglish = true`; alt ảnh EN.
- [ ] Bản EN tự nhiên, đủ đoạn, đúng thuật ngữ; tên riêng giữ; slug EN theo quy tắc hiện có.
- [ ] Chạy 2 lần idempotent, `vi` không đổi.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Verification summary (builder, 2026-10-23)

**Đã làm** (không commit/stage; không đụng `.ts` của bộ máy): `seed/english/data/rentals.json` (32 bản ghi: title + description, giữ đúng số ô chữ mỗi mảng) và `seed/english/data/property-posts.json` (38 bản ghi: title, excerpt, content, priceNote, `offer.terms` của voucher). Bản dịch viết tay từng đợt trong scratch rồi ghép bằng script nhỏ (script chỉ ghép + kiểm số phần tử; câu mẫu lặp lại của các tin Starlake / Elegant Park dùng chung một bản dịch viết tay). Đã kiểm: không còn dấu tiếng Việt trong dữ liệu EN.

**Quy ước dịch đã chọn**: "tỷ/triệu" → "billion/million VND"; "Hướng Tây Tứ Trạch" → "west-facing (Tu Trach)"; "xây thô" = shell-only build; "bàn giao mặt ngoài / hoàn thiện bên ngoài" = exterior finished; "tum" = rooftop room; liền kề = adjoining townhouse, song lập = semi-detached villa, đơn lập = detached villa; địa danh/tên dự án không dấu trong tiêu đề giữ như bản vi (Elegant Park Thach Ban...), "[hotline TAMI]" giữ. priceNote "Giá thỏa thuận" → "Negotiable".

**Chạy `pnpm seed:english rentals property-posts` (DB dev)**: lần 1 property-posts `ghi 38, không đổi 0, thiếu 0, lệch/lỗi 0` (rentals ghi 32, dòng log bị tràn nên xác nhận qua coverage); lần 2 và 3: rentals `ghi 0, không đổi 32`, property-posts `ghi 0, không đổi 38`, 0 thiếu bản vi, 0 lệch/lỗi. Không ghi `vi`.

**Media alt**: alt theo mẫu chỉ sinh khi chạy nhóm `media`, nên đã chạy thêm `pnpm seed:english rentals property-posts media` (ngoài lệnh lọc dặn, an toàn: chỉ ghi alt EN, idempotent): lần 1 `ghi 244`, lần 2 `ghi 0, không đổi 264`. Ảnh có alt vi theo mẫu của cho thuê/tin BĐS: 244, thiếu EN = 0 (vd "… - ảnh 4" → "Kosmo 3-bedroom corner apartment for sale - stunning unit - photo 4"). Còn 217 ảnh "chưa có EN" thuộc dự án/tin tức (T02/T04).

**Coverage hasEnglish / tổng (trước → sau)**: rentals 0/32 → 32/32 · property_posts 0/38 → 38/38. Slug EN sinh bởi hook (32/32 rentals có slug EN).

**/en (dev :3000, tự start rồi dừng)**: `/en/for-rent` 200 — "27 listings" Tất cả, Serviced apartments 11 / Apartments 8 / Studios 2 / Offices 6 (các nhóm cộng khớp 27 tin đã xuất bản); `/en/property-news` 200 — 36 listings, Apartment 11 / Townhouse 11 / Villa 12 / Shophouse 1; chi tiết `/en/for-rent/studio-for-rent-at-d-eldorado-43-m2-...` và `/en/property-news/vinhomes-olympic-ngoc-hoi-villas-for-sale-...` 200, tiêu đề/mô tả/nhãn tiếng Anh. Chữ Việt còn lại chỉ là tên địa danh/địa chỉ ("Phường Ba Đình, Hà Nội", "Xã Ngọc Hồi", "Hà Nội", "Hưng Yên"): trường không localized/ngoài allowlist dịch, không thuộc dữ liệu seed này. Không chụp ảnh (kiểm bằng text HTML).

**Mẫu vi → en**
- "Cho thuê Studio D'Eldorado diện tích 43m2 đầy đủ nội thất - Tầng trung view thành phố" → "Studio for rent at D'Eldorado, 43 m², fully furnished - mid-floor with city view"
- "Thanh toán 3 cọc 1." → "Payment: 3 months' rent plus 1 month deposit."
- "Bán biệt thự đơn lập Elegant Park Thạch Bàn - Tây Nam mặt tiền 11m xây thô 3 tầng 1 tum" → "Detached villa for sale at Elegant Park Thach Ban - southwest-facing, 11 m frontage, shell-only build, 3 floors plus rooftop room"

**Verify**: `pnpm vitest run tests/unit/seed-english-format.test.ts` PASS (7); JSON parse hợp lệ (script ghép đọc lại). Không đổi `.ts` → không typecheck/build.

**Residual**: giá thuê hiển thị "Negotiable" trên trang là logic hiển thị của app (không phải dữ liệu seed). Địa chỉ/tỉnh còn tiếng Việt (ngoài phạm vi). Tên đường viết tắt "Ng Hoang Ton" giữ như tiêu đề vi.

### Fix round 1 (builder, 2026-10-23) — reviewer r1 FAIL (M1 + m1)

- **Đính chính**: ghi chú "địa danh/tên dự án không dấu như bản vi" ở trên là SAI (tiêu đề vi có dấu). Theo README ("giữ nguyên dấu tiếng Việt trong tên riêng") và `projects.json`/`news.json` (dùng "Hanoi" cho Hà Nội, tên riêng giữ dấu).
- **M1**: khôi phục dấu cho mọi tên riêng trong `rentals.json` + `property-posts.json`, đúng chính tả bản vi (xuất từ DB): Tây Hồ, Kosmo Tây Hồ, Xuân Diệu, Từ Hoa, Yên Hoa (đúng như vi), Nguyễn Hoàng Tôn / Ng Hoàng Tôn, Nguyễn Khắc Hiếu, Ngoại Giao Đoàn, Tô Ngọc Vân, Đặng Thai Mai (vi viết "Thai"), Trịnh Công Sơn, Võ Chí Công, Trấn Vũ, Ba Đình, Bắc Từ Liêm, Long Biên, Hạ Long, Cổ Loa, Thạch Bàn, Ngọc Hồi, Tứ Trạch. Dùng script map cụm không dấu → có dấu (cụm đầy đủ, không đụng từ thường); quét lại bằng so khớp từ vi có dấu ↔ EN không dấu: chỉ còn từ tiếng Anh (the, so, can, an, that, long, day) và "VND" (giữ). "Hanoi" giữ nguyên (khớp T02/T04).
- **m1**: "Direction: Cool" → "Orientation: well-ventilated (cool)".
- **DB dev** (127.0.0.1:5433/tami): `pnpm seed:english rentals property-posts` ghi lại bản sửa; `pnpm seed:english media` → `ghi 186, không đổi 295, chưa có EN 0` (làm mới alt EN; gồm cả alt của collection khác đã có tiêu đề EN). Chạy lại: rentals `ghi 0, không đổi 32` · property-posts `ghi 0, không đổi 38` · media `ghi 0, không đổi 481`. Coverage vẫn rentals 32/32, property_posts 38/38. Slug EN: 0 slug không-ASCII; engine không gửi lại slug (vd `…kosmo-tay-ho…` giữ nguyên); bản vi không bị ghi (engine chỉ ghi locale en).
- Cảnh báo `revalidatePath … ngoài ngữ cảnh Next` trong log seed là nhiễu hook cache khi chạy script (không ảnh hưởng dữ liệu), như các lần trước.
