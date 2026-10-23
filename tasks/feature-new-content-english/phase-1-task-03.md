# feature-new-content-english · phase-1-task-03 — Gói EN: 8 tin tức pháp lý/quy hoạch thật + danh mục "Pháp lý & Quy hoạch"

- Nguồn: BL-072 · change doc `spec/changes/2026-10-23-new-content-english.md`. Chuẩn dịch = BL-064.
- Trạng thái: **pending** (plan đã duyệt 2026-10-23; chạy sau T01 PASS). **Phụ thuộc T01**. Song song được với T02 (alt ảnh bìa thuộc T02 vì bìa dùng lại ảnh dự án).

## Classification / Risk
- Type: **ADDITIVE** (dữ liệu). Risk: **MEDIUM** — nội dung pháp lý; dịch sai hiệu lực văn bản = thông tin sai cho khách.
- Expected review level: NORMAL (trọng tâm: văn bản dự thảo vẫn ghi rõ "draft"/"not yet in force", số hiệu/ngày văn bản giữ đúng, đủ đoạn).

## Scope
1. Export `news` từ DB dev, lọc 8 khoá (tiêu đề vi theo `seed/content/2026-10-23/news/*.md`).
2. EN tay: title, excerpt, content (richText — đúng số ô chữ, kể cả danh sách sinh từ bảng markdown), tags nếu là chữ localized, SEO nếu vi có. Số hiệu văn bản giữ (Nghị quyết 254/2025/QH15 → Resolution No. 254/2025/QH15; Nghị định 54/2026/NĐ-CP → Decree No. 54/2026/NĐ-CP), ngày theo dạng EN thống nhất, "dự thảo" → "draft (not yet adopted)".
3. `seed/english/packs/2026-10-23-real-content/news.json` (T03 chỉ sở hữu tệp này). Danh mục "Pháp lý & Quy hoạch" do T02 ghi trong `categories.json`; alt ảnh bìa do T02 (`media.json`). Khi làm dùng gói nháp `seed/english/packs/tmp-bl072-t03/` chỉ chứa `news.json` (không commit, xoá khi xong), cuối task chép sang gói thật.
4. DB dev: dry-run → apply → dry-run lại `không đổi`. Coverage `has_english` 8/8 tin (danh mục tin có EN sau khi T02 áp).
5. `/en` dev: `/en/news`, 2–3 tin EN (gồm "Dự thảo Luật Đất đai") — không lẫn tiếng Việt ngoài tên riêng/số hiệu văn bản; khung liên hệ cuối bài EN.
6. Verify như T02. **KHÔNG commit / stage.**
7. `## Verification summary`; report mở đầu `Agent: builder`.

## Acceptance
- [ ] 8 tin có title/excerpt/content EN đủ đoạn, `hasEnglish = true`; danh mục tin có EN.
- [ ] Tin dự thảo ghi rõ "draft"; số hiệu/ngày văn bản đúng bản vi.
- [ ] Chạy lại không đổi; `vi` không đổi.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Verification summary (builder, 2026-10-23)
- Output: `seed/english/packs/2026-10-23-real-content/news.json` (8 tin; title + excerpt + content; export chỉ liệt kê 3 trường này, không có tags/SEO localized). Số ô richText khớp export: 137 / 85 / 97 / 104 / 108 / 128 / 141 / 115. Đã kiểm tự động khoảng trắng đầu/cuối từng ô + URL khớp bản vi (phát hiện và sửa 3 ô lệch: Luật Quy hoạch ô 23-24, Bảng giá ô 97-99, NĐ 54 ô 50-51).
- Gói nháp `tmp-bl072-t03` (chỉ `news.json`): dry-run `sẽ ghi 8` → `ENGLISH_PACK_CONFIRM=tmp-bl072-t03 ... apply` `đã ghi 8, bỏ qua 0, thiếu bản vi 0` → dry-run lại `sẽ ghi 0, không đổi 8`. Gói nháp đã xoá; tệp chép sang gói thật. DB dev only. (Cảnh báo `revalidatePath ... ngoài ngữ cảnh Next` khi apply là log thường của hook, không ảnh hưởng.)
- Coverage dev: 8/8 tin có `has_english = t`; toàn bảng `news` 32/32 `has_english`.
- Render `/en/news` 200; `/en/news/<slug>` 3 tin (Draft Land Law, Decree 54, Hanoi Master Plan) 200, chữ EN, danh mục hiển thị "Legal & Planning" (T02 đã áp), khung "Need real estate advice? ... Get advice" cuối bài EN. Tiếng Việt còn lại chỉ là tên riêng/số hiệu văn bản (Nghị định `NĐ-CP`, `QĐ-UBND`, địa danh, Tami/Maison Privée...). Chưa chụp ảnh responsive (task dữ liệu).
- Verify: JSON hợp lệ; `vitest run tests/unit/english-pack-plan.test.ts tests/unit/seed-english-format.test.ts` → 2 file, 33 test pass.
- Mẫu vi → en: 
  1. "Đây là dự thảo, chưa phải luật." → "This is a draft, not yet law." (+ "As of 23 October 2026, the National Assembly had **not yet voted to adopt it**.")
  2. "Nghị quyết 254/2025/QH15 ... 01/01/2026" → "Resolution No. 254/2025/QH15 ... 1 January 2026"
  3. "Ngày 09/02/2026, Chính phủ ban hành Nghị định số 54/2026/NĐ-CP" → "On 9 February 2026, the Government issued Decree No. 54/2026/NĐ-CP"
  4. "Chủ đầu tư ... khoản tiền lũy tiến" → "progressive payment that increases with the length of the violation"; "Sở Quy hoạch – Kiến trúc" → "Department of Planning and Architecture"
  5. "cực Sông Hồng" → "Red River pole"; "Hồ Tây" → "West Lake (Hồ Tây)" lần đầu
- Quy ước dịch: ngày "D Month YYYY"; hai bài dự thảo (Luật Đất đai, Luật KDBĐS) giữ rõ "draft / not yet law / not yet voted / not yet in force"; URL, số hiệu, tên người/địa danh giữ nguyên; "KDBĐS" → "Real Estate Business Law".
- Residual: slug EN tự sinh (vd `decree-no-54-2026-nd-cp-what-s-new-on-social-housing-...`, hơi xấu do dấu nháy) — do hook, không đổi engine. Chưa chạy trên staging/prod (đúng phạm vi); cần backup + runbook khi áp lên đó. Đối soát lần cuối với gói thật đầy đủ (cùng T02) làm ở bước tích hợp.

### Fix round 1
Áp 5 phát hiện nhỏ của reviewer round 1 vào `seed/english/packs/2026-10-23-real-content/news.json` (số ô giữ nguyên 137/85/97/104/108/128/141/115, kiểm bằng script trước khi ghi):
1. NĐ 54 ô 62: "gives priority" → "may give priority".
2. NQ 254 ô 91 "until 1 March 2027" → "through 28 February 2027"; ô 105 tương tự ("Implemented through 28 February 2027").
3. Quy hoạch Thủ đô ô 59: "district level" → "area level".
4. Thống nhất "Law on Real Estate Business" (bảng bài Luật KDBĐS và các ô khác; "Draft Law on Real Estate Business (amended)"); không còn "Real Estate Business Law".
5. NQ 254 tiêu đề mục 4: "4. Certificates (red book), parcel splitting and merging".
DB dev: dry-run gói thật `không đổi 100, bỏ qua 0` exit 0 (DB dev đã có bản mới, nghi do phiên khác/T02 chạy apply đồng thời; kiểm DB có "may give priority"). Tôi không chạy thêm apply overwrite. Không đụng tệp gói khác/engine.
