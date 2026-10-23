# feature-new-content-english · phase-1-task-02 — Gói EN: 3 dự án (Maison Privée, Astor 1, The Windsor Collection) + chủ đầu tư + danh mục + alt ảnh

- Nguồn: BL-072 · change doc `spec/changes/2026-10-23-new-content-english.md`. Chuẩn dịch = BL-064 (`seed/english/README.md` § Quy tắc dịch).
- Trạng thái: **pending** (plan đã duyệt 2026-10-23; chạy sau T01 PASS). **Phụ thuộc T01** (lệnh `english:pack`, định dạng gói). Chạy song song được với T03 (khác file dữ liệu).

## Classification / Risk
- Type: **ADDITIVE** (dữ liệu). Risk: **MEDIUM** — nội dung bán hàng/pháp lý công khai (giá, pháp lý, CSBH "dự kiến"), chỉ ghi DB dev ở task này.
- Expected review level: NORMAL (trọng tâm: chất lượng tiếng Anh, đủ đoạn, số/giá/tên riêng giữ, chữ "expected/tentative" của CSBH/giá dự kiến giữ nguyên nghĩa).

## Phối hợp song song với T03
- `english:pack` áp MỌI tệp trong gói (không lọc nhóm) → khi làm, dùng gói nháp riêng `seed/english/packs/tmp-bl072-t02/` (không commit, xoá khi xong); cuối task chép sang gói thật `2026-10-23-real-content/` các tệp của T02: `projects.json`, `developers.json`, `categories.json`, `media.json`. Không tạo/sửa `news.json` (của T03).

## Scope
1. Bản vi nguồn: DB dev (đã có 3 dự án). Trước khi export, đối chiếu vi dev với vi staging (tên `products[].type` sau `fix-data.ts`; T01 D6 đã gộp vào dữ liệu nguồn) — lệch → ghi residual, KHÔNG sửa vi staging. Export: `pnpm seed:english:export projects <scratch>.json` rồi lọc 3 khoá; tương tự `developers` (CapitaLand Development, Pristie, Ciputra Hanoi) và `categories` ("Căn hộ chung cư", "Nhà phố, biệt thự" — chép bản EN đã có ở `seed/english/data/categories.json` cho thống nhất; cộng danh mục tin "Pháp lý & Quy hoạch" — T02 sở hữu `categories.json` của gói, T03 không đụng).
2. Viết EN tay cho mọi lá: title, summary, overview, legalInfo, salesPolicy, scale.handoverTime, products[].type, amenities[].name/description, highlights, nearbyAmenities[].name, priceTable (chữ), faqs, floorPlans[].title, locationMedia.title, SEO (nếu vi có). Giữ số/giá (tỷ → billion VND, triệu/m² → million VND/m²), mã văn bản pháp lý (QĐ 1279/QĐ-UBND → Decision No. 1279/QĐ-UBND), tên riêng, tên thương hiệu thiết bị; "dự kiến" → "expected"/"tentative".
3. `seed/english/packs/2026-10-23-real-content/{projects,developers,categories}.json` + `media.json` cho mọi alt ảnh của 3 dự án (gallery, mặt bằng, tài liệu, ảnh tiện ích, ảnh vị trí; alt mô tả, không theo mẫu → liệt kê tường minh; ảnh bìa tin dùng lại ảnh dự án nên alt bìa nằm ở đây).
4. DB dev: dry-run → apply (confirm) → dry-run lại = `không đổi` 100%. Coverage `has_english` 3/3 dự án, 3/3 chủ đầu tư; alt EN mọi ảnh 3 dự án.
5. `/en` dev: `/en/projects`, 3 trang chi tiết EN — không còn chữ Việt ngoài tên riêng / địa chỉ (BL-065: địa chỉ giữ vi).
6. Verify: JSON hợp lệ, test seed/english PASS. **KHÔNG commit / stage.** Không đụng file của T03, BL-071, `spec/**`, `.context/**`.
7. `## Verification summary` (kết quả dry-run/apply/rerun, coverage, 3–5 cặp mẫu vi→en, residual). Report mở đầu `Agent: builder`.

## Acceptance
- [ ] 3 dự án + chủ đầu tư có EN đủ trường, `hasEnglish = true`; alt ảnh EN.
- [ ] Giá/số/tên riêng giữ; thuật ngữ thống nhất BL-064; CSBH/giá dự kiến vẫn ghi rõ "expected".
- [ ] Chạy lại không đổi; `vi` không đổi.

## Retry / Escalation
3 attempt fail → `architecture_review_needed`.

## Verification summary

**Đã làm (chưa commit/stage).** Gói thật `seed/english/packs/2026-10-23-real-content/`: `projects.json` (3 dự án, EN đủ mọi lá có ở vi: title/summary/overview/legalInfo/salesPolicy/scale.handoverTime/products/amenities/highlights/nearbyAmenities/priceTable/faqs/floorPlans/locationMedia.title; độ dài mảng richText giữ đúng), `developers.json` (3 tên riêng, EN = giữ nguyên), `categories.json` ("Căn hộ chung cư" → Apartments, "Nhà phố, biệt thự" → Townhouses and villas đúng bản BL-064; "Pháp lý & Quy hoạch" → Legal & Planning), `media.json` (82 alt: gallery 44 + ảnh tiện ích 3 + mặt bằng 31 + ảnh vị trí 2 + 2 tài liệu của Maison Privée; alt ảnh bìa tin dùng lại ảnh dự án nên nằm trong đó). Không tạo/sửa `news.json` (của T03, đã có ở gói khi chạy lần cuối). Gói nháp `tmp-bl072-t02/` đã xoá. Không đụng file ngoài scope. Phụ: không dịch SEO (vi nguồn không có `seo.*`).

**Quy ước dịch.** Quý 4/2029 → Q4 2029; "dự kiến" → "expected" (CSBH: "Expected developer policy, subject to change."; FAQ "Expected in Q4 2029."); tỷ/triệu → "N million VND"; số 8.087 m² → 8,087 m² (theo kiểu BL-064); mã văn bản giữ (Decision No. 1279/QĐ-UBND…); tên riêng/địa danh giữ dấu (Nam Thăng Long, Phú Thượng, Bình Minh, Phương Đông…); tòa M/P → Tower M/P; tầng → Level/Floor; thương hiệu thiết bị giữ.

**Kiểm đối chiếu vi.** Script so khoá + độ dài mảng với export vi dev: 0 thiếu/dư/lệch. Vi dev vs staging (`products[].type`): `projects-data.mjs` (nguồn vi staging sau fix-data, T01) khớp tên rút gọn 3/3 dự án với dev — không lệch.

**Lệnh + kết quả (chỉ DB dev 127.0.0.1:5433/tami).**
- Dry-run gói nháp: `Tổng: sẽ ghi 89, không đổi 1, bỏ qua 1, thiếu bản vi 0` (1 bỏ qua = "Căn hộ chung cư", xem residual; 1 không đổi = "Nhà phố, biệt thự" đã có đúng EN BL-064).
- Apply (`ENGLISH_PACK_CONFIRM=tmp-bl072-t02`): `đã ghi 89, không đổi 1, bỏ qua 1, thiếu bản vi 0`, exit không lỗi dữ liệu (chỉ có warn "Không làm mới được cache trang công khai (ngoài ngữ cảnh Next)" do hook revalidate khi chạy ngoài Next — vô hại, như BL-064).
- Dry-run lại: `sẽ ghi 0, không đổi 90, bỏ qua 1, thiếu bản vi 0` (82/82 alt "không đổi").
- Dry-run gói thật `2026-10-23-real-content` (đã có `news.json` của T03): `sẽ ghi 0, không đổi 98, bỏ qua 1, thiếu bản vi 0`.
- Coverage SQL: projects `has_english` 3/3; developers 3/3; danh mục "Pháp lý & Quy hoạch" en = "Legal & Planning"; "Căn hộ chung cư" cả 2 scope en = "Apartments" (từ BL-064). `vi` không đổi (engine không ghi vi).
- `pnpm exec vitest run tests/unit/english-pack-plan.test.ts tests/unit/seed-english-format.test.ts` → 2 files, 33 tests PASS. JSON của 5 tệp gói hợp lệ.

**/en dev (localhost:3000).** `/en/projects`, `/en/projects/maison-privee|astor-1|the-windsor-collection` đều 200 (lần gọi đầu 3 trang chi tiết trả 500 thoáng qua do dev server vừa biên dịch lại sau revalidate; gọi lại 200, không tái hiện). Quét chữ có dấu việt trong text hiển thị: chỉ còn tên riêng (Phương Đông, Hòa Bình, Hoàn Kiếm, Nội Bài, Thăng Long…), số hiệu văn bản (QĐ-UBND, QĐ-BCA), và địa chỉ/tỉnh (BL-065 giữ vi: "Phường Phú Thượng, Hà Nội", "Ô CT07-CT1, KĐT Nam Thăng Long…"). Alt ảnh: chỉ chứa "Privée" (tên riêng).

**Mẫu vi → en.**
1. `Hệ tiện ích 68 hạng mục được trải trên nhiều tầng…` → "The 68 amenities are spread across many levels: a garden and arrival lobby on level 1, a dedicated Wellness Suite floor on level 2…"
2. `Chính sách dự kiến của chủ đầu tư, có thể thay đổi.` → "Expected developer policy, subject to change."
3. `Quyết định số 1279/QĐ-UBND ngày 23/03/2026 của UBND TP Hà Nội chấp thuận điều chỉnh nhà đầu tư.` → "Decision No. 1279/QĐ-UBND dated 23/03/2026 of the Hanoi People's Committee approving the adjustment of the investor."
4. `Mặt bằng căn hộ 2BR+ tòa M, DTXD 106 m², DTSD 98 m²` → "2BR+ apartment floor plan, Tower M, gross floor area 106 m², net floor area 98 m²"
5. `Khoảng 25.000 – 30.000 đ/m²/tháng; miễn phí quản lý 36 tháng…` → "About 25,000 – 30,000 VND/m²/month; 36 months of free management fees under the current policy."

**Residual / quyết định cho change-request.**
- Engine `exactly-1-match`: "Căn hộ chung cư" tồn tại ở 2 scope trên dev (và nhiều khả năng cả staging/prod) → `bỏ qua: khoá trùng` ở MỌI lần chạy gói (exit 1 do có bản bị bỏ). Trên dev đã có EN "Apartments" từ BL-064 nên không ảnh hưởng hiển thị; trên staging/prod (chưa chạy BL-064) hai danh mục này sẽ không có EN từ gói — cần quyết: cho phép khoá trùng cùng một EN, hoặc bỏ khoá khỏi gói và dịch tay trong admin. Giữ khoá trong gói để dry-run luôn nhắc việc này; engine KHÔNG sửa.
- Chưa render các tab lazy (mặt bằng/bảng giá) bằng trình duyệt thật; kiểm qua HTML SSR + dữ liệu DB. Dev DB chưa phản ánh slug EN trên staging (hook sinh theo tiêu đề EN: `maison-privee`, `astor-1`, `the-windsor-collection` — trùng slug vi).
- `/en` trình bày địa chỉ/tỉnh bằng tiếng Việt là hành vi BL-065, không thuộc task.

### Fix round 1
Reviewer round 1 PASS, 6 nhóm MINOR (báo cáo `.context/review-reports/feature-new-content-english-phase-1-task-02-round-1-review.md`), đã sửa trong `projects.json` + `media.json` (độ dài mảng richText giữ nguyên):
1. "on receipt of the Certificate" → "…the ownership certificate (pink book)" (Maison salesPolicy[2], Astor salesPolicy[3]).
2. Maison legalInfo[0] → "approving the change of investor".
3. Astor salesPolicy[9] → "0% interest for 24 months (until no later than 31/03/2029)".
4. Astor overview[3] + faqs.2.answer → "fully finished with built-in fittings"; một thuật ngữ cho "bàn giao thô" = "shell condition" (Astor đã dùng; Windsor overview + faqs.2 đổi từ "rough-built structure"). `seed/english/data` chưa có thuật ngữ này nên chọn "shell condition".
5. Windsor amenities.6.name → "Floating stage & musical fountain".
6. media: 3 ảnh phân khu Windsor → "Site plan of subdivision …"; "Whisky lounge" → "Wine lounge"; "Elevator lobby on a residential floor with stone cladding".
Ghi chú: "Astor legalInfo[1] Investor" giữ nguyên (reviewer: không cần đổi).

Chạy (chỉ DB dev): dry-run → 12 bản ghi "EN đã có, khác gói" (3 project + 9 alt; chính là bản gói cũ của chúng ta) → `ENGLISH_PACK_CONFIRM=2026-10-23-real-content pnpm english:pack 2026-10-23-real-content apply overwrite` (overwrite chỉ dùng vì EN cũ là phiên bản trước của chính gói này trên dev): `đã ghi 12, không đổi 88, bỏ qua 0`, exit 0 → dry-run lại: `sẽ ghi 0, không đổi 100, bỏ qua 0, thiếu bản vi 0`, exit 0. "Căn hộ chung cư" hiện khớp ở cả 2 scope (engine T01 đã sửa khoá trùng), residual cũ về khoá trùng đã đóng trên dev. `news.json` và engine không đụng; không commit/stage.
