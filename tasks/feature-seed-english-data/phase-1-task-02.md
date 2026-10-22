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
