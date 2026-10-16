Agent: spec-validator

# Spec Validation Report — TAMI (/start bước 1b, round 2, vòng cuối)

**Entry Mode:** full_docs (dự án mới, no app code: bỏ đối chiếu code)
**Spec:** `SPECIFICATIONS.md` spec_version 1.2.1 (từ 1.2.0)
**Nguồn:** round 1 `.context/review-reports/spec-validation-round-1.md`; delta `spec/updates/2026-10-16-lam-ro-spec-validation-r1.md`; `git diff` working tree của SPECIFICATIONS.md, BRIEF.md, docs/BRD.md, ERD.md, PERMISSION.md, API_SPEC.md, ARCHITECTURE.md, DESIGN.md, INDEX.md, spec/CHANGELOG.md.
**Phạm vi đã chốt với user:** B5 và N14 để bước brainstorm xử lý. Mục "Quy tắc biên" là giả định ⚠️ có chủ đích. "Câu hỏi mở" (Q1, Q4–Q7, tên miền, khối homepage và màn của DESIGN) chuyển sang bước design/go-live. Các mục này không chặn.

## Verdict: ✅ PASS

Đủ 4 finding chặn còn hiệu lực (B1–B4). B5 được hoãn theo quyết định của user. Không còn ❌, không có mâu thuẫn HIGH mới. Còn 4 ghi chú LOW mới, không chặn.

## Trạng thái finding round 1

| ID | Finding | Status | Evidence |
|---|---|---|---|
| B1 | Thiếu mục NFR | Resolved | SPEC §Non-functional Requirements :142-157 (NFR-01…10, LGL-01…04, tham chiếu BRD §5, §6) |
| B2 | Phạm vi đăng bài của Sale | Resolved | SPEC :130; BRD :77; BRIEF :28; PERMISSION :11 khớp ma trận PERMISSION :37-43; ERD :320, :342 |
| B3 | Thiếu collection `pages` | Resolved | ERD §4.9b :322-342 (`kind`, route cố định, không có `author`/`slug`); ERD :38 bỏ `slug` khỏi điều kiện `hasEnglish` cho `pages`; route khớp BRD :95, :114, DESIGN :224 |
| B4 | Tìm kiếm trên header | Resolved | SPEC :55; DESIGN :233 (`/cho-thue?q=` · `/en/for-rent?q=`); ERD :543; dùng tham số `q` sẵn có ở API_SPEC :97 |
| B5 | project-config: db_tool, migration, pnpm, secrets | Deferred (brainstorm) | Theo quyết định của user. Phải xong trước bước graph |
| N1 | BRIEF dẫn BRD v1.4 | Resolved | BRIEF :13 |
| N2 | INDEX / DESIGN ghi sai phiên bản, trạng thái | Resolved | INDEX :15; DESIGN :16 |
| N3 | Chi tiết FR/BR còn thiếu trong SPEC | Resolved | SPEC :52 (phân trang, thư viện ảnh), :55 (trường tin thuê, p95, tối thiểu 3 ảnh khớp ERD :246), :58 (BR-06), :73 (BR-11/13/14), :76 (chặn xoá danh mục, ≤ 10MB, ≤ 1 phút), :85 (≤ 10 phút, lọc trạng thái dịch) |
| N4 | Stack thiếu bản đồ, analytics | Resolved | SPEC :36-37 |
| N5 | Câu chữ NFR-09 (OSS / SaaS miễn phí), cookie consent | Partial | SPEC :156 đã làm rõ, cookie consent đưa vào Q7 (:181). BRIEF :38 và BRD :235 vẫn viết "chỉ dùng mã nguồn mở, tự host". Mức LOW, xem M2 |
| N6 | Audit log không thống nhất | Resolved | ARCH :265; PERMISSION §6 :110; enum ERD :456 (`content.purge`, `staff.reset_password`) |
| N7 | Hai đường phân công lead | Resolved | API_SPEC :121, :138 (chỉ hook `leads.afterChange`); SPEC :73; khớp PERMISSION :85, ERD :432 |
| N8 | DESIGN thiếu màn khu vực/danh mục; hero video, lối tắt, CTA | Deferred (design) | SPEC Câu hỏi mở :183 |
| N9 | Ký hiệu U của slug; `searchText` localized | Resolved | ERD :116, :254, :540. Còn trùng chú thích ký hiệu, xem M1 |
| N10 | Edge case | Resolved (giả định ⚠️) | SPEC §Quy tắc biên :159-169. Lead từ tin `rented` khớp API_SPEC :69 và ERD :29. Sale bị khoá khớp ERD :419 |
| N11 | Số lượng admin | Resolved | SPEC :130; PERMISSION :10 |
| N12 | Thiếu mục Câu hỏi mở | Resolved | SPEC :171-183 |
| N13 | Mức ưu tiên Must/Should/Could | Resolved | SPEC :46, khớp BRD :173 và các dòng Should |
| N14 | Breakpoint project-config lệch DESIGN | Deferred (brainstorm/design) | Không đổi trong round này |

## Kiểm tra mâu thuẫn mới

| Cặp | Kết quả |
|---|---|
| Quyền Sale: SPEC ↔ BRD ↔ BRIEF ↔ PERMISSION ↔ ERD | ✅ khớp |
| `pages`: ERD §3 ↔ §1 ↔ §1.1 ↔ §4.9b ↔ PERMISSION :43, :89 ↔ BRD/DESIGN route | ✅ khớp |
| Phân công lead: API_SPEC ↔ PERMISSION ↔ ERD ↔ SPEC | ✅ khớp |
| Audit: ARCH ↔ PERMISSION §6 ↔ enum ERD | ✅ khớp |
| Tìm kiếm: SPEC ↔ DESIGN ↔ ERD §6 ↔ API_SPEC | ✅ khớp |
| Giờ hành chính: SPEC :164 ↔ ARCH :182 (job 10 phút/lần) | ✅ không mâu thuẫn |
| NFR-09: SPEC :156 ↔ BRIEF :38, BRD :235, ARCH :13 | ⚠️ LOW (M2) |

## Ghi chú mới (LOW, không chặn)

- **M1** `docs/ERD.md:116` và `:118`: hai dòng chú thích ký hiệu R/U/I nằm liền nhau. Nên gộp làm một dòng.
- **M2** `BRIEF.md:38` và `docs/BRD.md:235` vẫn viết "chỉ dùng phần mềm mã nguồn mở, tự host". SPEC :156 thì cho dùng SaaS gói miễn phí (Cloudflare, Brevo, GA4…). Chưa sai vì BRD :235 chỉ hạn chế dịch vụ **trả phí**, nhưng nên đồng bộ câu chữ BRIEF. BRD là intent doc nên chỉ sửa khi user duyệt.
- **M3** `docs/BRD.md:186` (BR-04 "Mỗi nội dung có người đăng (`author`)") khác với ERD :320 và :342, nơi `services` và `pages` không có `author`. Không ảnh hưởng quyền vì cả hai collection chỉ admin sửa. Nên ghi ngoại lệ khi có Change Request kế tiếp.
- **M4** Hẹn giờ xuất bản (SPEC :168, mức Could) có 2 chỗ chưa đồng bộ:
  - Quy tắc đọc công khai ở ERD :29 chưa có điều kiện `publishedAt ≤ now`.
  - Danh sách job ở ARCH §5.4 (quanh :182) chưa có job revalidate chạy mỗi phút.

  Bước graph cần xử lý khi xếp FR-ADM-16 vào layer.
- **M5** ERD :336 coi `pages.version` (bản `privacy` đã xuất bản) là nguồn của `site-settings.privacyPolicyVersion` (ERD :487). Hiện có hai nơi lưu cùng một giá trị nhưng chưa ghi cơ chế đồng bộ (hook hay nhập tay). Nên chốt ở bước graph/builder.
- Ghi nhận thêm: delta `spec/updates/2026-10-16-lam-ro-spec-validation-r1.md:6` dẫn nguồn round 1 là `.context/review-reports/spec-validation.md`, nhưng file round 1 thực tế là `spec-validation-round-1.md`. Report này (round 2) được ghi tại `spec-validation.md` theo yêu cầu của primary.

## Residual risk
- B5 (cấu hình DB/migration) chưa xong thì migration gate vẫn bị tắt. Brainstorm phải chốt trước graph.
- Session 8 giờ không hoạt động phụ thuộc cơ chế làm mới token (SPEC :131). Đã ghi residual risk trong spec.

## Verdict Reasoning
PASS: B1–B4 đã xử lý, có dẫn nguồn và nhất quán giữa 9 tài liệu. B5, N8, N14 hoãn theo phạm vi user đã chốt. Không có ❌ và không có mâu thuẫn HIGH. Chỉ còn 1 ⚠️ partial (N5) và 5 ghi chú LOW. Có thể chuyển sang bước 2 (brainstorm).
