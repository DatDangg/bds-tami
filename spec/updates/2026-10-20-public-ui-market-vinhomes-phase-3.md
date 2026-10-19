# Spec Update — 2026-10-20 public-ui-market-vinhomes Phase 3 (trang danh sách + Tin tức)

**spec_version:** 1.18.0 → 1.19.0 (MINOR — bố cục/hành vi mới ở trang danh sách công khai + thêm 1 điểm thu lead `/tin-tuc`; không đổi schema/DB, migration, API endpoint, quyền, tham số URL)

**Trigger:** feature-update (Change Request BL-020, **Phase 3/5**). Change doc `spec/changes/2026-10-19-public-ui-market-vinhomes.md` (vẫn mở). Plan: `tasks/feature-public-ui-market-vinhomes/README.md`. Task `phase-3-task-01.md` … `phase-3-task-03.md`. Spec-validation phase 3: `.context/review-reports/feature-public-ui-market-vinhomes-phase-3-spec-validation.md` (GAPS FOUND C1–C4 → xử lý bằng delta này + close-out NewsCard/docs as-built).

> **Delta này chỉ là Phase 3/5.** P1 (tokens + header) ở 1.16.0 / scope v19, P2 (trang chủ) ở 1.17.0 / scope v20. Còn mở: **P4** chi tiết dự án (thẻ tư vấn dính, tin liên quan, CTA tham quan) · **P5** schema dự án (highlights, nearbyAmenities, priceTable, faqs).

## Đã làm (Phase 3)

| Task | Loại | Commit | Nội dung | Review |
|---|---|---|---|---|
| P3-T01 | MODIFY (UI) | `16c5e81` | Cho thuê: `ListSearchBar` dùng chung (từ khoá + Loại + Khoảng giá 4 mức + "Bộ lọc" Popover ≥ lg / Sheet < lg, badge lọc phụ) đè mép dưới `PageBanner size="compact"` 240px; "Có N kết quả" + sắp xếp cùng hàng (chung live draft); lưới 1/2/3/4; RentalCard thẻ trắng 20px; bỏ thanh lọc dính mobile; URL params giữ nguyên (golden test), form GET chạy không JS | STRICT FAIL r1 → PASS r2 |
| P3-T02 | MODIFY (UI) | `1511db5` | `/du-an` băng Tỉnh + Trạng thái + Lọc; `/tin-bds` (+ danh mục) banner compact + "Có N kết quả" + lưới 4 cột; `/tuyen-dung` banner compact + thẻ viền; ProjectCard/PostCard thẻ trắng 20px | STRICT PASS r1 |
| P3-T03 | MODIFY (UI) + lead | `0b95083` | Tin tức: pill danh mục (link, `aria-current`), trang 1 = Tin nổi bật 1+4 → hàng danh mục cấp 1 (≤ 6 hàng × ≤ 4 bài) + "Xem thêm" → "Tin khác" (`buildMoreNews`) → phân trang → form "Tư vấn nhu cầu" (`source=contact`); trang ≥ 2 lưới cũ; trang danh mục banner compact + 4 cột; `PageBanner overlap` | STRICT FAIL r1 → FAIL r2 → PASS r3 |
| close-out | UI + docs | (pending) | NewsCard thẻ trắng bo 20px trên nền sáng, prop `onDark` giữ thẻ phẳng trong suốt ở khối Tin tức trang chủ; docs as-built `docs/DESIGN.md`, `.context/design-spec.md` (§2.7, §3.2, S02, S08, S10); spec delta này | NORMAL PASS r1 |

## Quyết định agent (user ủy quyền 2026-10-20 — "tự quyết định đừng hỏi lại")

1. Cho thuê: "Loại" = danh mục `category`; "Khoảng giá" = select 4 mức gợi ý (< 5tr · 5–10tr · 10–20tr · > 20tr) đặt cặp `priceMin`/`priceMax` như chip cũ; khoảng tự nhập hiện "Khoảng giá tuỳ chọn".
2. "Bộ lọc" mở Popover ≥ lg (có nút Đóng) / Sheet < lg; badge đếm Tỉnh, Phường, Diện tích, Phòng ngủ, Nội thất + khoảng giá tự nhập.
3. Sắp xếp chuyển xuống hàng "Có N kết quả", dùng chung bản nháp lọc; **bỏ thanh lọc dính đáy mobile** (thay bằng băng tìm kiếm đầu trang).
4. Banner compact 240px chỉ ở trang danh sách (+ danh mục / khu vực); đệm đáy chỉ khi có băng tìm kiếm đè (`overlap`); pháp lý / liên hệ / dịch vụ / 404 giữ cỡ mặc định.
5. `/du-an`: băng = Tỉnh + Trạng thái + nút Lọc — không ô từ khoá (danh sách dự án không có `q`), không "Bộ lọc" (không có lọc phụ); đổi ô chọn không tự gửi (WCAG 3.2.2).
6. `/tin-bds`: **không dựng băng tìm kiếm** (không có lọc sẵn; thêm tham số mới = ngoài phạm vi) — chỉ banner compact + "Có N kết quả" (tính cả bài nổi bật) + lưới 4 cột. Lệch change doc §43 → chấp nhận, ghi ở F4.
7. `/tuyen-dung`: banner compact + thẻ viền, giữ bộ lọc cũ.
8. ProjectCard / PostCard thẻ trắng bo 20px áp mọi nơi dùng (slider Ưu đãi trang chủ, "Dự án khác", bài liên quan).
9. Tin tức: tab danh mục = pill **link** (`aria-current`), không ARIA tabs; trang 1 cấu trúc như F5; hàng danh mục gồm bài của danh mục con, tối đa 6 hàng, không loại trùng giữa hàng; "Tin khác" = 4 bài mới nhất chưa hiện + lưới trang 1 cũ, trừ bài ở "Tin nổi bật" (không bài nào mất khỏi phân trang).
10. Form "Tư vấn nhu cầu" (LeadForm `source=contact`) ở mọi trang `/tin-tuc` (kể cả `?page=N`), không ở trang danh mục, chi tiết tin không đổi (không form).
11. NewsCard: đổi sang thẻ trắng bo 20px trên nền sáng cho đồng bộ (close-out); khối Tin tức nền tối trang chủ giữ thẻ trong suốt (`onDark`).

## Requirements (SPECIFICATIONS.md)

- **C1 — F5 Tin tức thu lead** (HIGH): "Không thu lead" → form "Tư vấn nhu cầu" nguồn `contact` ở cuối mọi trang `/tin-tuc` / `/en/news`; trang danh mục + chi tiết tin tức không form. **F9** thêm nguồn `/tin-tuc`.
- **C2 — FR-ADM-20**: bỏ "Ngoài phạm vi (BL-020, Phase 3)"; mô tả banner gọn 240px cho trang danh sách + danh mục/khu vực, đệm đáy ~3rem chỉ khi có băng tìm kiếm đè (Cho thuê, Dự án), trang khác giữ cỡ mặc định.
- **C3 — §Giao diện / F2 / F3 / F4**: no-JS thêm Cho thuê (từ khoá + Loại không cần JS; Khoảng giá + "Bộ lọc" cần JS); thẻ trắng 20px + lưới 4 cột ≥ xl; F3 bố cục băng tìm kiếm + "Bộ lọc" popover/sheet + badge + sắp xếp ở hàng kết quả + bỏ thanh lọc dính mobile; F2 `/du-an` Tỉnh + Trạng thái + Lọc; F4 `/tin-bds` không băng tìm kiếm, banner compact + "Có N kết quả" + 4 cột.
- **C4 — F5 cấu trúc trang tin**: trang 1 Tin nổi bật 1+4 → hàng danh mục cấp 1 (≤ 6 × ≤ 4) + "Xem thêm" → "Tin khác" → phân trang → form; trang ≥ 2 lưới; trang danh mục banner compact + 4 cột không form; NewsCard thẻ trắng trên nền sáng, trong suốt trên nền tối trang chủ.
- **Không đổi:** tham số URL (tên/giá trị/`page`) của Cho thuê, Dự án, Tin BĐS, Tin tức, Tuyển dụng; phân trang + offset; canonical; quy tắc `noindex`; metadata; sitemap.

## Intent doc — `docs/BRD.md` 1.6 → 1.7

- Ghi chú "Đăng tin BĐS ≠ Tin tức" (`docs/BRD.md` ~:121): bài tin tức vẫn không có form; trang danh sách `/tin-tuc` có form "Tư vấn nhu cầu" chung (nguồn `contact`).
- **BR-10** (~:201): nguồn "form liên hệ chung" gồm trang Liên hệ và form "Tư vấn nhu cầu" cuối `/tin-tuc` — cùng nguồn `contact`.
- **Căn cứ sửa intent:** form tư vấn cuối trang Tin tức nằm trong change doc §Tin tức (`spec/changes/2026-10-19-public-ui-market-vinhomes.md`) mà **user đã duyệt 2026-10-19**; các quyết định còn lại user **giao agent 2026-10-20** ("tự quyết định đừng hỏi lại"). Đây là sửa intent qua Change Request, không phải hợp thức hoá code.

## Schema / Migration / API

- Schema/DB: **không đổi**, không migration.
- API: không endpoint mới; form `/tin-tuc` gọi `POST /api/leads` hiện có với `source=contact` (không `sourceId`) — đúng contract `docs/API_SPEC.md` (rate limit, Turnstile, consent, chống trùng 7 ngày theo SĐT + nguồn, admin giao vì `contact` không tự giao BR-12).
- Quyền: không đổi.

## Hành vi bị thay thế

| Trước | Sau (BL-020 P3) |
|---|---|
| Banner trang danh sách cỡ mặc định | Banner compact 240px cố định; đệm đáy chỉ khi có băng đè |
| Cho thuê: thanh lọc đầy đủ + thanh lọc dính đáy mobile, sắp xếp trong thanh lọc | Băng tìm kiếm gọn + "Bộ lọc" popover/sheet + badge; sắp xếp ở hàng kết quả; bỏ thanh dính |
| Lưới 3 cột (≥ lg/xl) | Lưới 4 cột ≥ xl |
| RentalCard/ProjectCard/PostCard/NewsCard không khung | Thẻ trắng bo 20px viền (NewsCard trên nền tối trang chủ giữ trong suốt) |
| Tin tức: 1 bài lớn + 3 bài hàng + lưới 3 cột; "Không có form" | Tin nổi bật 1+4 → hàng danh mục → Tin khác → phân trang → form tư vấn (`contact`) |

**Cache:** mọi route vẫn ISR như cũ (form là island client).

## Ảnh hưởng

- Trang công khai VI/EN: `/cho-thue` (+ `/danh-muc/[c]`, trang khu vực), `/du-an`, `/tin-bds` (+ danh mục), `/tuyen-dung`, `/tin-tuc` (trang 1, `?page=N`, danh mục) và `/en/...` tương ứng.
- Component dùng chung: `PageBanner`, `CategoryListTemplate`, `ListSearchBar`, `RentalCard`, `ProjectCard`, `PostCard`, `NewsCard` (cả slider Ưu đãi, "Dự án khác", bài liên quan, khối Tin tức trang chủ).
- Lead: thêm điểm vào nguồn `contact` từ `/tin-tuc` (admin giao, email thông báo như form liên hệ).

**Residual:** CLS/LCP chưa đo trên trình duyệt (2 ảnh `priority`/trang Tin tức); h1 EN dài trong banner 240px ở 375px; thiết bị thật (Popover/Sheet, Safari) chưa kiểm.

**Scope sinh:** `spec/test-scope/current.json` scopeVersion 23
