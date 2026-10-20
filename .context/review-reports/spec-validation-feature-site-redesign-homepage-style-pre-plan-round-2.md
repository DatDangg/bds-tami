# Spec Validation — feature-site-redesign-homepage-style (pre-plan) — Round 2

Agent: spec-validator · Change: BL-045 (MODIFY) · Date: 2026-10-21 · Mode: spec validation (pre-plan, round 2)
Round 1: `.context/review-reports/spec-validation-feature-site-redesign-homepage-style-pre-plan.md` (FAIL, G1–G17) — giữ nguyên, không gộp.

## Scope

- Spec delta sửa lại: `SPECIFICATIONS.md:23–36` (khối BL-045), `:240–248` (BL-045-Q1..Q9).
- Xác minh tên mới được nêu: `--color-dark-deep` (`src/app/(frontend)/globals.css:38`), `--text-small` (`:90`), `src/lib/contrast.test.ts`, `src/components/media/VideoFacade.tsx`, `services.summary` (`src/collections/Services.ts:48`), `TableOfContents` (`src/components/legal/TableOfContents.tsx`), `ContactDetails` giờ làm việc i18n (`src/components/contact/ContactDetails.tsx:56–57`) — đều có thật.
- Không sửa source/spec.

## Đối chiếu gap round 1

| Gap R1 | Trạng thái | Evidence |
|---|---|---|
| G1 MAJOR bộ lọc Cho thuê | **Đã xử lý** | `:26`: Khu vực (tỉnh) · Mức giá · Diện tích · **Phòng ngủ** (`bedrooms`, ghi lý do lệch chữ) · Nội thất · Tiện ích **chọn nhiều** AND · nút "Bộ lọc" + badge mở Popover/Sheet (phường + khoảng tự nhập) · `ActiveFilters` + "Xoá bộ lọc" ở hàng kết quả; quy tắc không JS khớp `url-params.ts:36,44–46`. Còn MINOR R2-1. |
| G2 MAJOR mục chi tiết | **Đã xử lý (đề xuất + Q7)** | `:28`: danh sách đích Dự án / Cho thuê, không "Tiến độ", bỏ "Thư viện", Lân cận trong Vị trí; dải thông số map `scale.landAreaM2`, `scale.totalUnits`, developer, `handoverTime` (`Projects.ts:72–76,142`); giá trống → "Liên hệ". Chốt ở Q7 (`:246`). Còn MINOR R2-2. |
| G3 MAJOR `DetailLayout` dùng chung | **Đã xử lý** | `:28` "`DetailLayout` giữ biến thể một thẻ"; `:30` Bài viết rời `DetailLayout` (nền `--color-bg`, header thường) + Tin BĐS chi tiết giữ BL-032 tới Q4. |
| G4 nhãn thay thế | Đã xử lý | `:23` "Khối này thay các điểm bố cục tương ứng…" + đánh dấu khi publish. |
| G5 banner tư vấn | Đã xử lý | `:35` nguồn `homepage.ctaBanner` không phụ thuộc `enabled`, thiếu chữ → i18n, nút `/lien-he` / `#lead-form`; `:28` + Q8 CTA chi tiết dự án; `:34` Dịch vụ chữ trái. |
| G6 eyebrow §1.6 / Doc impact | Đã xử lý | `:23` thay ngân sách eyebrow; `:36` Doc impact. |
| G7 dải 4 ý Tuyển dụng | Đã đưa thành Q9 (`:248`) | Câu hỏi user, chưa có mặc định — xem R2-4. |
| G8 a11y | Đã xử lý | `:24` cách đo AA (4.5:1, không tính bóng, ảnh sáng thật, scrim token, test như `contrast.test`); `:28` ảnh lớn (mũi tên/ảnh nhỏ `aria-label`, bộ đếm `aria-hidden`, không autoplay, ←/→, Video qua Dialog/VideoFacade); `:26` pager. |
| G9 chiều cao hero | Đã xử lý | `:25` 440/360, 340/280; `:28` `min(78vh,640px)`/480. |
| G10 nhóm chữ hero | Đã xử lý | `:25` liệt kê trang, đổi nhãn group, ngoại lệ BR-07, hero không ảnh `--color-dark-deep`. |
| G11 "Loại căn hộ" | Đã xử lý | `:26` đổi "Phòng ngủ" có lý do. |
| G12 lọc Tuyển dụng | Đã xử lý | `:31` "lệch mockup: giữ bộ lọc hiện có" + vị trí. |
| G13 Liên hệ | Đã xử lý | `:32` giữ trường lead, không ô "Nhu cầu"; giờ làm việc i18n. |
| G14 Chính sách | Đã xử lý | `:33` `TableOfContents`, không "Mục N"; `:25` mô tả = dòng phiên bản/hiệu lực. |
| G15 scrim | Đã xử lý | `:23` scrim token overlay sẵn có. |
| G16 CTA Bài viết | Đã xử lý | `:30` nút → `/lien-he`, không form; tags giữ. |
| G17 Điểm mạnh `/du-an` | Đã xử lý | `:26` dùng component + `homepage.strengths`, cờ mới `site-settings` (mặc định bật), số cột theo component trang chủ. |

## Bảng kiểm A1–A8 (round 2)

| Mục | Kết quả | Ghi chú |
|---|---|---|
| A1 Change doc + DECISIONS #1–#6 | PASS | Như round 1; không mất mục nào sau sửa. |
| A2 Token/element có thật | PASS | Tên mới nêu ở round 2 đều xác minh được (Scope). |
| A3 Khớp mockup / lệch có lý do | PASS với MINOR | Mọi lệch đã ghi lý do (Phòng ngủ, lọc Tuyển dụng, Nhu cầu, Mục N, Tiến độ/Thư viện). R2-2. |
| A4 Schema | PASS | Additive: ảnh Liên hệ/Pháp lý, nhóm chữ hero localized, cờ Điểm mạnh `/du-an`; migration versioned. |
| A5 Hành vi giữ nguyên | PASS với MINOR | Lọc Cho thuê giữ đủ tham số; Dự án chưa chốt Q1 → không dựng phần đó. R2-1. |
| A6 A11y | PASS | Xem G8. |
| A7 Mâu thuẫn spec cũ | PASS với MINOR | Có câu thay thế + Doc impact; R2-3. |
| A8 Câu hỏi mở | PASS | Q1–Q9 là quyết định user; R2-4 về mặc định. |

## Gap còn lại (round 2)

| # | Mức | Mô tả | Đề xuất |
|---|---|---|---|
| R2-1 | MINOR | Badge nút "Bộ lọc" theo F3 (`:106`) đếm tỉnh, phường, diện tích, phòng ngủ, nội thất, khoảng tự nhập — nay tỉnh/diện tích mốc/phòng ngủ/nội thất/tiện ích đã ra hàng 3, chưa định nghĩa lại badge đếm gì (và tỉnh có còn lặp trong Popover không). | Ghi: badge chỉ đếm lọc nằm trong Popover (phường, khoảng giá/diện tích tự nhập); Popover không lặp các ô đã ở hàng 3. |
| R2-2 | MINOR | Thứ tự mục Dự án đề xuất đặt **Bảng giá trước Pháp lý/Chính sách** — hiện tại Pháp lý · Chính sách · Giá (`:93`); mockup không có mục giá nên không phải lý do mockup. | Ghi lý do đổi thứ tự hoặc giữ thứ tự cũ; nêu trong Q7. |
| R2-3 | MINOR | Danh sách `/tin-bds` + danh mục: `:23` thay "banner 240px" chung, nhưng chỉ chi tiết Tin BĐS có mặc định "giữ BL-032 tới Q4"; danh sách Tin BĐS khi chưa chốt Q4 chưa rõ (giữ banner 240px hay hero thấp). Nút phụ `tel:` của CTA "Đăng ký tham quan" (F2) bị bỏ khi thay banner chung — chưa ghi. | Ghi "danh sách Tin BĐS giữ nguyên tới Q4"; ghi giữ/bỏ nút `tel:` trong Q8. |
| R2-4 | MINOR (residual) | Q2, Q3, Q5, Q6, Q9 chưa có hành vi mặc định trong spec → task của Tin tức trang 1, Bài viết (mục lục), chi tiết Tuyển dụng/Dịch vụ, aside Cho thuê, dải 4 ý Tuyển dụng phụ thuộc trả lời. | Không chặn chia task: plan đặt các task này sau checkpoint duyệt plan (chốt Q1–Q9 cùng lúc duyệt plan), task nền tảng không phụ thuộc chúng. |

Không còn gap MAJOR, không có HIGH conflict, không ❌.

## Verdict

**PASS với MINOR (round 2)** — G1–G17 của round 1 đã xử lý (G7 chuyển thành Q9). Spec đủ để chia task. 4 MINOR (R2-1..R2-4) nên bổ sung khi duyệt plan. Q1–Q9 phải được user chốt ở checkpoint duyệt plan trước khi builder làm các task phụ thuộc.
