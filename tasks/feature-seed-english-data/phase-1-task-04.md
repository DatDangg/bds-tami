# feature-seed-english-data · phase-1-task-04 — Dữ liệu EN viết sẵn: Tin tức (24)

- Nguồn: BL-064 · change doc `spec/changes/2026-10-22-seed-english-data.md`. Spec delta: `SPECIFICATIONS.md` F12 bullet "Dữ liệu dev song ngữ (BL-064…)".
- **Phụ thuộc T01** (đã PASS): bộ máy `seed/english/`, định dạng + quy tắc ở `seed/english/README.md`, export `pnpm seed:english:export`, áp `pnpm seed:english <collection>` — đọc README + Verification summary của `tasks/feature-seed-english-data/phase-1-task-01.md` TRƯỚC khi làm.
- **AUTO PROCEED** (user "tự quyết, đừng hỏi"): không hỏi; chỗ mơ hồ tự chọn rồi ghi vào Verification summary.
- Chạy SONG SONG với task dữ liệu khác (T02/T03/T04) trên cùng working tree + cùng DB dev: CHỈ đụng `seed/english/data/<collection>.json` của: news (và chính task file này); chỉ chạy `pnpm seed:english` có lọc collection của mình. KHÔNG sửa bộ máy `seed/english/*.ts` — thấy bug bộ máy → ghi vào Verification summary (BLOCKED nếu chặn), không tự sửa.

## Classification / Risk
- Type: **MODIFY** (chỉ dữ liệu seed dev). Risk: **LOW** — file JSON dữ liệu, ghi DB dev locale `en`.
- Expected review level: FAST/NORMAL (reviewer tự chọn; trọng tâm: chất lượng tiếng Anh, đủ bản ghi/đủ đoạn, không đổi vi, idempotent).

## Scope
1. Export bản vi: `pnpm seed:english:export` cho news ra thư mục scratch/tạm (KHÔNG commit file export).
2. Viết bản EN **tay** (tiếng Anh tự nhiên, đúng thuật ngữ BĐS: apartment, townhouse, villa, shophouse, handover, land use right certificate / pink book, fully furnished…) cho MỌI bản ghi: title, excerpt, content (richtext — dài, ~88k ký tự vi), tags (nếu localized), SEO — liệt kê đủ từ export. Tên riêng (tên dự án, chủ đầu tư, địa danh, tên đường) theo quy ước ở README T01; giá/số/đơn vị giữ (tỷ → billion VND, triệu → million VND, m² giữ). Không bỏ đoạn, không tóm tắt — dịch đủ từng chuỗi (giữ đúng số phần tử mảng chuỗi richtext). Không dùng API AI lúc seed; không gọi job dịch.
3. Ghi `seed/english/data/<collection>.json` đúng định dạng README; mỗi bản ghi đủ trường bắt buộc EN để bật `hasEnglish`.
4. Chạy `pnpm seed:english news` 2 lần trên DB dev → lần 2 không đổi gì; `missing` / `mismatched` = 0 (hoặc giải thích từng bản ghi).
5. Coverage SQL sau khi chạy (`select count(*) filter (where has_english), count(*) from <table>`) → 100% (trừ bản ghi giải thích được); alt EN ảnh của các bản ghi (cơ chế D7).
6. Kiểm `/en` (dev :3000): trang danh sách EN của collection (route theo `src/i18n/routing.ts`) có data, số đếm danh mục/tiện ích đúng; mở 1–2 trang chi tiết EN: tiếng Anh, không còn chữ Việt ngoài tên riêng.
7. Verify: test seed/english liên quan PASS (`pnpm test` lọc theo đường dẫn), JSON parse hợp lệ. Không đổi `.ts` → không cần typecheck/build (ghi lý do).
8. **KHÔNG commit / stage.** Không đụng file ngoài scope (danh sách cấm ở T01 §Scope 10, cộng file dữ liệu của task khác).
9. Ghi `## Verification summary` cuối file (số bản ghi, kết quả 2 lần chạy, coverage trước/sau, 2–3 cặp mẫu vi→en, residual) rồi trả report mở đầu `Agent: builder`.

## Acceptance
- [ ] Mọi bản ghi news có EN + `hasEnglish = true`; alt ảnh EN.
- [ ] Bản EN tự nhiên, đủ đoạn, đúng thuật ngữ; tên riêng giữ; slug EN theo quy tắc hiện có.
- [ ] Chạy 2 lần idempotent, `vi` không đổi.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Verification summary (builder, 2026-10-23)

**Đã làm** (không commit/stage; chỉ đụng `seed/english/data/news.json` + task file; không sửa `.ts` bộ máy):
- `seed/english/data/news.json`: 24/24 bản ghi news (kể cả 2 bản `draft`), trường `title`, `excerpt`, `content` (richText = mảng chuỗi, 1.415–5.698 ký tự/bài, đủ số ô chữ 1–56 mỗi bài, khớp export từng bài, không bỏ/gộp đoạn). Bản vi export bằng `pnpm seed:english:export news <scratch>`: chỉ có 3 trường (không có tags/SEO localized trong news). Viết tay từng bài ra scratch rồi gộp bằng script kiểm số phần tử + trường + chuỗi rỗng + chữ Việt thừa.
- Quy ước: tên riêng giữ dấu (The Crown Đại Hoàng Sơn Bắc Ninh, Tân Tiến, Hùng Vương, Vĩnh Tuy, UDIC, Phạm Ngọc Thiên Ân, tên phố/phường); "Công ty Cổ phần Đại Hoàng Sơn" → "Đại Hoàng Sơn JSC"; "Tổng công ty ... UDIC – Công ty TNHH Một thành viên" → "UDIC Urban Infrastructure Development Investment Corporation – One Member Co., Ltd."; tỷ → "VND 1,106.2 billion"; sổ hồng → pink book; mệnh Thủy/Hỏa/Thổ/Kim → Water/Fire/Earth/Metal element. Các phần tử "Xem thêm" cuối bài dùng đúng tiêu đề EN của bài liên quan (nhất quán); 4 dòng liên kết tới bán/cho thuê biệt thự/shophouse The Crown dịch thành "Villas/Shophouses for Sale/Rent at …" (chưa biết T03 đặt tên EN nào, không phụ thuộc). Mẫu viết tắt "m2" → "m²".

**Chạy trên DB dev (127.0.0.1:5433/tami)**
- `pnpm seed:english news` lần 1: `ghi 24, không đổi 0, thiếu bản vi 0, lệch/lỗi 0`. Lần 2 và 3: `ghi 0, không đổi 24, thiếu bản vi 0, lệch/lỗi 0`. (Log kèm nhiều cảnh báo `static generation store missing in revalidatePath/revalidateTag` từ hook revalidate chạy ngoài ngữ cảnh Next — chỉ cảnh báo, không ảnh hưởng ghi dữ liệu; hành vi có sẵn của bộ máy, không sửa.)
- Ngoài `news`, đã chạy thêm `pnpm seed:english media` 1 lần (lọc nhóm media, idempotent, chỉ ghi alt en) vì alt ảnh bìa theo mẫu `<tiêu đề vi> - ảnh bìa` chỉ sinh ở nhóm media: `ghi 217, không đổi 264, chưa có EN 0` (217 gồm alt của cả các nhóm T02/T03 đã có tiêu đề EN, không chỉ news). Alt EN 22/22 ảnh bìa news, vd "THE STRUCTURE OF A PERFECT HOME - cover image".

**Coverage (hasEnglish / tổng, bỏ xoá mềm)**: news 0/24 → 24/24 · media alt EN 264/481 → 481/481 (sau media; trước đó 264) · `news_locales` locale vi vẫn 24 dòng, tiêu đề vi các bài mẫu (vd bài draft "TAMI ra mắt website mới") giữ nguyên.

**Kiểm /en (tự `pnpm dev`, đã dừng sau khi xong)**: `/en/news` 200, trang đầu hiển thị 16 liên kết bài (DB có 22 bài published; phần còn lại ở trang sau/khối khác, chưa duyệt từng trang) với tiêu đề + excerpt EN (slug EN từ hook, cắt dài, vd `/en/news/udic-riverside-2-vinh-tuy-developer-reputation-and-capability`), chuyên mục EN (Lifestyle/Market/TAMI News); chuỗi còn dấu Việt trên trang chỉ là tên riêng (Đại Hoàng Sơn, Bắc Ninh, Tân Tiến, Hùng Vương, Vĩnh Tuy, Hà Nội...). Chi tiết `/en/news/udic-riverside-2-vinh-tuy-developer-reputation-and-capability` và `/en/news/secrets-to-a-beautiful-home-with-3-magic-paint-colors` 200: nội dung, breadcrumb "Back to …", "Home", heading EN; bài thứ hai 0 chuỗi tiếng Việt; bài đầu chỉ còn tên riêng/địa danh. Trang vi `/vi/tin-tuc/bo-tri-can-ho-121-m2-co-3-phong-ngu` 200, còn nguyên chữ vi. 2 bài `draft` ("TAMI ra mắt website mới", "Thị trường căn hộ dịch vụ quý này") có EN trong DB nhưng không hiện công khai (draft ở cả hai ngôn ngữ — hành vi đúng).

**Verify**: JSON parse OK; `pnpm vitest run tests/unit/seed-english-format.test.ts` 7/7 PASS. Không đổi `.ts` → không typecheck/lint/build.

**Mẫu vi → en**
- "Phí bảo trì bảo dưỡng The Crown Đại Hoàng Sơn Bắc Ninh và quỹ dự phòng kiên cố hóa tài sản" → "Maintenance Fees at The Crown Đại Hoàng Sơn Bắc Ninh and the Reserve Fund That Keeps Assets Solid"
- "Giá bán UDIC Riverside 2 Vĩnh Tuy - Thông tin chi tiết" → "UDIC Riverside 2 Vĩnh Tuy Selling Price - Detailed Information"
- "Kiểm tra sổ hồng UDIC Riverside 2 Vĩnh Tuy: Xác minh người đứng tên và quyền chuyển nhượng căn hộ." → "Check the pink book of UDIC Riverside 2 Vĩnh Tuy: Verify the named holder and the right to transfer the apartment."

**Residual**
- Văn phong bài Crown vốn là văn mẫu quảng cáo; bản EN giữ giọng đó, không biên tập lại nội dung.
- Slug EN do hook cắt ~80 ký tự (không phải lỗi dữ liệu).
- Chưa kiểm cache revalidate ở staging (chỉ dev).
