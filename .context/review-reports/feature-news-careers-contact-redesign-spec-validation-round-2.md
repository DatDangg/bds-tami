Agent: spec-validator

# Spec validation (pre-plan): BL-054 `news-careers-contact-redesign`, round 2

- Mode: Spec validation (trước build). Spec 1.47.0. Ngày 2026-10-22.
- Nguồn: `SPECIFICATIONS.md` L63–76 (khối BL-054), `spec/updates/2026-10-22-news-careers-contact-redesign.md` (UPD), `spec/test-scope/current.json`, change doc `spec/changes/2026-10-21-news-careers-contact-redesign.md` (CD), 9 task `tasks/feature-news-careers-contact-redesign/*`, `src/lib/search/*` (đối chiếu F9). Round 1: `.context/review-reports/feature-news-careers-contact-redesign-spec-validation.md`.
- Không sửa source / spec / task. Không chạy verify command (pre-plan).

## Verdict

**PASS (round 2), kèm 1 việc phải sửa trước khi bàn giao test.**
- F1–F12 của round 1 đều đã đóng trong spec + task.
- Không có ❌ và không có mâu thuẫn HIGH với intent doc.
- Có 1 mục ⚠️ mới (N1): `spec/test-scope/current.json` chưa phát hành lại theo các sửa r1, nên một dòng trong đó trái với spec (F1). Mục này dưới ngưỡng FAIL (cần ≥ 3 ⚠️). Nó không chặn builder, vì builder đọc spec + task. Nhưng spec-publisher phải sinh lại test-scope trước khi bàn giao cho bên test.

## 1. Kiểm lại từng finding r1

| ID | Sửa ở (cite) | Status | Note |
|---|---|---|---|
| F1 Redis lỗi | SPEC L65 "Redis lỗi → **không đếm**… pipeline trả 503… beacon bỏ qua"; UPD L40; P1-T03 §1 L22, §4 L25 "Redis lỗi không cộng" | ✅ Đóng | Khớp `runPublicPipeline` fail-closed. **Còn sót ở test-scope (N1)** |
| F2 tags `/en` | SPEC L64 (5) "`/en` ẩn khối Chủ đề, dòng Thẻ:, bỏ qua `?tag=`"; P2-T01 §5 L29; P2-T02 §5 L25 | ✅ Đóng | NEEDS_USER (tag EN riêng) đã ghi là CR sau, không chặn |
| F3 tác giả | SPEC L64 (3) "nhãn thương hiệu TAMI HOMES", L67 "không đọc / hiện `staff`"; UPD L16; P2-T01 §3 L27; P2-T02 §1 L21 | ✅ Đóng | |
| F4 dịch khối | P1-T02 Blast radius L9 + Files L18 `lexical.ts`; §3 L28 (`skeletonOf`, không dịch id / relationship / select / blockType); `leaves.ts` đã bỏ | ✅ Đóng | ℹ️ `lexical.test.ts` mới chỉ có ở Blast radius, chưa vào Files. Acceptance L35 chỉ ghi "không làm mất / hỏng khối", chưa nói "không `invalid_output`". Không chặn: §3 và §4 đã đủ ý |
| F5 file chung wave B | P1-T03 Files L18–19 + L33; P1-T04 Files L18–19 + L32 ("thêm cuối, primary gộp") | ✅ Đóng | |
| F6 banner tư vấn tuyển dụng | SPEC L69 "→ banner tư vấn", L72 "giữ ở `/tuyen-dung` và `/tuyen-dung/[slug]`… (change doc: giữ nguyên)"; P2-T03 §5 L28; P2-T04 §4 L24 | ✅ Đóng (quyết định rõ) | Khác khuyến nghị r1 (bỏ banner) nhưng có căn cứ CD L18. Liên hệ vẫn không có banner (SPEC L73, P2-T05 §5 L27), nhất quán BL-045 |
| F7 mục BL-052 không áp dụng | SPEC L63 "Không áp dụng cho 5 màn này…"; UPD L68; P2-T01 §1 L25 | ✅ Đóng | P2-T03/T05 không nhắc riêng nhưng spec L63 đã phủ |
| F8 Zalo OA | SPEC L73 "giá trị hiển thị = `siteName`"; P2-T05 §2 L24 | ✅ Đóng | |
| F9 `q` không dấu | SPEC L64 (1), L69 "không thêm cột / migration"; P2-T01 §6 L30; P2-T03 §3 L26 | ✅ Đóng | ℹ️ `src/lib/search` chủ yếu viết cho rentals (`rental-search-sql.ts`, `searchText`). Phần dùng lại được là `normalizeSearchText` (`normalize.ts:7`) / `searchTerms` (`rental-search-sql.ts:20`). Điều cấm thêm cột đã rõ nên builder không lạc hướng. Mục tiêu p95 chưa ghi (không chặn) |
| F10 mục đích consent | SPEC L64 (5) chữ đồng ý "nhận bản tin qua email…"; P1-T04 §2 L23 | ✅ Đóng | NEEDS_USER (nội dung trang Chính sách bảo mật) ghi là việc mở, không chặn |
| F11 `pnpm build` | P1-T01 L41, P1-T03 L32, P1-T04 L31 (và mọi task khác) | ✅ Đóng | |
| F12 breadcrumb `/tuyen-dung` | SPEC L69 "breadcrumb trên ảnh"; P2-T03 §1 L24 | ✅ Đóng | |

## 2. Phát sinh mới

**N1 ⚠️ (MINOR–MAJOR, không chặn build): `spec/test-scope/current.json` chưa phản ánh các sửa r1.**
- L101: `"Redis (dedupe lượt xem) — lỗi Redis không được gây 5xx"` **trái** với SPEC L65 và P1-T03 §1 (Redis lỗi → pipeline trả 503, không đếm). Bên test viết case theo dòng này sẽ báo FAIL nhầm.
- L71, L75: còn ghi "tác giả · ngày", chưa nói rõ đây là nhãn thương hiệu "TAMI HOMES", không phải tên nhân viên (F3).
- L73, L77: "Chủ đề" / "Thẻ:" chưa ghi `/en` ẩn và bỏ qua `?tag=` (F2).
- L87: thẻ Zalo OA chưa ghi giá trị hiển thị là `siteName` (F8).
- L82 / L85: chưa có breadcrumb `/tuyen-dung` (F12) và banner tư vấn ở 2 màn tuyển dụng (F6).

Đề xuất: chạy `spec-publisher` sinh lại `current.json` (tăng `scopeVersion`) từ SPEC L63–76, rồi mới bàn giao test. Làm được song song với wave A.

**ℹ️ (không tính ⚠️): UPD còn vài dòng tóm tắt chưa sửa**, nhưng mục "Sửa sau spec-validation r1" (L67–68) đã ghi phần sửa:
- L15: "Chủ đề" chưa ghi `/en` ẩn.
- L18: thiếu breadcrumb.
- L20: Zalo OA chưa ghi `siteName`.

Nên sửa ngay tại các dòng này cho gọn, không bắt buộc.

Không thấy mâu thuẫn mới giữa SPEC ↔ UPD ↔ task. Thứ tự phụ thuộc, migration gate (chỉ P1-T01 tạo migration) và quy ước gộp song song vẫn như round 1.

## 3. Gap list

| ID | Mức | Sửa ở | Task / bước |
|---|---|---|---|
| N1 | ⚠️ | `spec/test-scope/current.json` L71, L73, L75, L77, L82, L85, L87, L101 (sinh lại qua spec-publisher) | spec-publisher, trước khi bàn giao test |
| (ℹ️) | note | UPD L15, L18, L20 | change-request (tuỳ chọn) |
| (ℹ️) | note | P1-T02 Files thêm `lexical.test.ts`; Acceptance thêm "không `invalid_output`" | P1-T02 (tuỳ chọn) |

Residual risk:
- Không chạy verify command (pre-plan).
- NEEDS_USER F2 (tag EN riêng) và F10 (nội dung trang Chính sách bảo mật) vẫn còn mở và cần báo user.
