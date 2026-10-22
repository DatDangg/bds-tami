# feature-seed-english-data · phase-1-task-02 — Dữ liệu EN viết sẵn: Dự án (61 bản ghi, 3 đã có EN từ seed mẫu)

- Nguồn: BL-064 · change doc `spec/changes/2026-10-22-seed-english-data.md`. Spec delta: `SPECIFICATIONS.md` F12 bullet "Dữ liệu dev song ngữ (BL-064…)".
- **Phụ thuộc T01** (đã PASS): bộ máy `seed/english/`, định dạng + quy tắc ở `seed/english/README.md`, export `pnpm seed:english:export`, áp `pnpm seed:english <collection>` — đọc README + Verification summary của `tasks/feature-seed-english-data/phase-1-task-01.md` TRƯỚC khi làm.
- **AUTO PROCEED** (user "tự quyết, đừng hỏi"): không hỏi; chỗ mơ hồ tự chọn rồi ghi vào Verification summary.
- Chạy SONG SONG với task dữ liệu khác (T02/T03/T04) trên cùng working tree + cùng DB dev: CHỈ đụng `seed/english/data/<collection>.json` của: projects (và chính task file này); chỉ chạy `pnpm seed:english` có lọc collection của mình. KHÔNG sửa bộ máy `seed/english/*.ts` — thấy bug bộ máy → ghi vào Verification summary (BLOCKED nếu chặn), không tự sửa.

## Classification / Risk
- Type: **MODIFY** (chỉ dữ liệu seed dev). Risk: **LOW** — file JSON dữ liệu, ghi DB dev locale `en`.
- Expected review level: FAST/NORMAL (reviewer tự chọn; trọng tâm: chất lượng tiếng Anh, đủ bản ghi/đủ đoạn, không đổi vi, idempotent).

## Scope
1. Export bản vi: `pnpm seed:english:export` cho projects ra thư mục scratch/tạm (KHÔNG commit file export).
2. Viết bản EN **tay** (tiếng Anh tự nhiên, đúng thuật ngữ BĐS: apartment, townhouse, villa, shophouse, handover, land use right certificate / pink book, fully furnished…) cho MỌI bản ghi: title, summary, overview (richtext), legalInfo, salesPolicy, scale.handoverTime, SEO meta title/description, location media title, mọi mảng localized (amenities, nearbyAmenities, faqs, floorPlans, highlights, priceTable, products …) — liệt kê đủ từ export. Tên riêng (tên dự án, chủ đầu tư, địa danh, tên đường) theo quy ước ở README T01; giá/số/đơn vị giữ (tỷ → billion VND, triệu → million VND, m² giữ). Không bỏ đoạn, không tóm tắt — dịch đủ từng chuỗi (giữ đúng số phần tử mảng chuỗi richtext). Không dùng API AI lúc seed; không gọi job dịch.
3. Ghi `seed/english/data/<collection>.json` đúng định dạng README; mỗi bản ghi đủ trường bắt buộc EN để bật `hasEnglish`.
4. Chạy `pnpm seed:english projects` 2 lần trên DB dev → lần 2 không đổi gì; `missing` / `mismatched` = 0 (hoặc giải thích từng bản ghi).
5. Coverage SQL sau khi chạy (`select count(*) filter (where has_english), count(*) from <table>`) → 100% (trừ bản ghi giải thích được); alt EN ảnh của các bản ghi (cơ chế D7).
6. Kiểm `/en` (dev :3000): trang danh sách EN của collection (route theo `src/i18n/routing.ts`) có data, số đếm danh mục/tiện ích đúng; mở 1–2 trang chi tiết EN: tiếng Anh, không còn chữ Việt ngoài tên riêng.
7. Verify: test seed/english liên quan PASS (`pnpm test` lọc theo đường dẫn), JSON parse hợp lệ. Không đổi `.ts` → không cần typecheck/build (ghi lý do).
8. **KHÔNG commit / stage.** Không đụng file ngoài scope (danh sách cấm ở T01 §Scope 10, cộng file dữ liệu của task khác).
9. Ghi `## Verification summary` cuối file (số bản ghi, kết quả 2 lần chạy, coverage trước/sau, 2–3 cặp mẫu vi→en, residual) rồi trả report mở đầu `Agent: builder`.

## Acceptance
- [ ] Mọi bản ghi projects có EN + `hasEnglish = true`; alt ảnh EN.
- [ ] Bản EN tự nhiên, đủ đoạn, đúng thuật ngữ; tên riêng giữ; slug EN theo quy tắc hiện có.
- [ ] Chạy 2 lần idempotent, `vi` không đổi.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Verification summary
- **Dữ liệu**: `seed/english/data/projects.json` — 58 bản ghi (đủ title, summary, overview richText đúng số ô chữ, scale.handoverTime, amenities name/description, nearbyAmenities name, floorPlans title, products type, legalInfo/salesPolicy của mẫu). Bỏ qua có chủ đích 3 dự án mẫu đã có EN từ `seed/sample` (Sample Saigon Riverside / West Lake / Hanoi Central) — README cho phép; 3 dự án mẫu còn lại (Đà Nẵng, Thủ Đức, Hải Phòng) và 55 dự án scraped được dịch tay. Không dùng AI/API dịch lúc seed. SEO meta, location media title, faqs, highlights, priceTable rỗng ở bản vi nên không có khoá để dịch. Chuỗi lặp lại (tiện ích, khoảng cách lân cận, thời hạn bàn giao) dùng bảng thuật ngữ nhất quán ("Quý IV/2027" → "Q4 2027", "Đã bàn giao" → "Handed over", "Trường liên cấp" → "K-12 school", "Trung tâm thành phố" → "City centre" — khớp bản EN của seed mẫu). Tiền tệ: "tỷ đồng" → "VND … billion", "nghìn tỷ" → "trillion"; tên riêng/địa danh/chủ đầu tư giữ dấu ("Phát Đạt Group", "Sông Hồng Future Group JSC"…). Quy ước tiêu đề: tên chung có thể dịch ("Khu đô thị Chi Đông Mê Linh" → "Chi Đông Urban Area Mê Linh", "Dự án mẫu …" → "Sample …"), tên thương hiệu giữ nguyên.
- **Chạy `pnpm seed:english projects` (DB dev)**: lần 1 `ghi 58, không đổi 0, thiếu bản vi 0, lệch/lỗi 0`; lần 2 `ghi 0, không đổi 58, thiếu bản vi 0, lệch/lỗi 0`. Có log warn "static generation store missing in revalidatePath" (revalidate ngoài ngữ cảnh Next — chạy qua `payload run`, vô hại, không phải lỗi dữ liệu).
- **Coverage hasEnglish / tổng (trước → sau)**: projects 3/61 → 61/61. Media alt EN (toàn bộ) 264/481 trước khi task này chạy lần 1 → 481/481 (gồm cả đợt chạy T03/T04 cùng lúc); alt theo mẫu của ảnh dự án `<tiêu đề vi> - ảnh N` → 461/461 có EN, vd "Starlake The Prime Tây Hồ Tây - ảnh bổ sung 3" → "… - additional photo 3".
- **Draft/versions**: projects không dùng draft Payload (`status` = trạng thái nghiệp vụ, cột `status`); `_projects_v` 359 dòng, tất cả `published`; 61 dự án giữ `status = published`, bản vi không đổi (không có dòng `projects_locales` vi nào bị rỗng).
- **/en (dev :3000, tự start bằng preview rồi stop; cổng 3000 lúc đầu do server khác chiếm, sau đó tự thoát)**: `/en/projects`, `/en/projects/forestia-lake-me-linh`, `/en/projects/q-terra-quy-nhon` đều 200; danh sách có đủ dự án, tên tiện ích/thời hạn bàn giao tiếng Anh. Chữ Việt còn lại chỉ ở trường KHÔNG localized nên engine không ghi được (ngoài allowlist `TRANSLATABLE_FIELDS`): `projects.address` (vd "Mặt đường Vạn Hạnh, phường Việt Hưng, Hà Nội", "xã Mê Linh, huyện Mê Linh…") và `nearbyAmenities.distance` ("15 phút"), cộng tên tỉnh/chủ đầu tư/tên riêng. Dữ liệu vi khác trong bản ghi (SEO…) rỗng.
- **Verify**: JSON parse hợp lệ; script gộp kiểm đủ khoá + đúng số phần tử richText + không còn từ tiếng Việt thường (chỉ tên riêng) → 0 vấn đề; `pnpm exec vitest run tests/unit/seed-english-format.test.ts` PASS (7). Không đổi `.ts` → không typecheck/build; không chạy test integration (DB tạm, tránh đụng các builder chạy song song).
- **Cặp mẫu vi → en**: "Hồ bơi tràn bờ" → "Infinity pool"; "Quý IV/2027" → "Q4 2027"; "Chủ đầu tư: Công ty TNHH Đầu tư Quy Nhơn 68." → "Developer: Quy Nhơn 68 Investment Co., Ltd."; "Mức đầu tư: Khoảng 4.988 tỷ đồng" → "Investment: About VND 4,988 billion".
- **Residual**: (1) `address`/`distance` không localized còn tiếng Việt trên `/en` (cần task riêng/đổi schema nếu muốn); (2) bản vi gốc có placeholder "[hotline TAMI]" trong 2 chuỗi (Noble Palace Tây Hồ, Masterise Thủy Nguyên) — giữ nguyên trong EN vì khớp ô chữ; (3) 3 dự án mẫu giữ EN cũ từ seed/sample; (4) engine không lỗi.
