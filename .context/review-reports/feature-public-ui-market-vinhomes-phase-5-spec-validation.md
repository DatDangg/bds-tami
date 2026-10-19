Agent: spec-validator

# Spec validation: feature-public-ui-market-vinhomes (BL-020) · Phase 5 (schema dự án + UI) + nghiệm thu toàn change
> Report do primary lưu (guard chặn ghi `.context/review-reports/**` trong worktree). Nội dung theo báo cáo spec-validator.

- Scope: worktree `D:/prj/bds/.claude/worktrees/bl020-p3p5`, commit e7d0c81 (P5-T01 schema + migration, STRICT PASS r1), 5b8ae10 (P5-T02 UI, STRICT PASS r1) trên 2e2fe8f (spec 1.20.0 / scope v24). Chỉ đọc.

## Verdict lần 1: GAPS FOUND
Code không thiếu: P5 khớp quyết định user #4. Còn mở toàn bộ là việc close-out: spec delta P5 (SPECIFICATIONS + BRD), docs as-built cũ, MINOR reviewer, và acceptance cuối (LCP/CLS chưa đo).

## 1. Coverage P5
| # | Yêu cầu | Nguồn | Trạng thái | Bằng chứng |
|---|---|---|---|---|
| 1 | Schema đúng 4 nhóm | README:41, change doc:56 | ✅ | `src/collections/projects/market-blocks.ts`; ERD:224-228 |
| 2 | Quỹ căn từng căn ngoài phạm vi | README:41 | ✅ không làm | chỉ `priceTable` theo loại căn |
| 3 | Pháp lý dùng `legalInfo` + `documents` | README:41 | ✅ | `ProjectDetail.tsx:67-83`, giữ `#documents` |
| 4 | Field mới tuỳ chọn, dự án cũ lưu được, không thêm `englishRequiredFields` | task 01 | ✅ | ERD:242; integration |
| 5 | Chữ localized vào danh sách dịch AI | task 01:19 | ✅ | `leaves.ts` `TRANSLATABLE_FIELDS.projects` |
| 6 | Migration additive, versioned, up/down/up | task 01, AGENTS | ✅ | `up` chỉ CREATE TYPE/TABLE + 2 ADD COLUMN nullable (:141-142); DROP chỉ ở `down` (:195-216); migration mới nhất, không xung đột thứ tự |
| 7 | Nổi bật lưới thẻ, ẩn khi trống | task 02:14 | ✅ | `ProjectHighlights.tsx` |
| 8 | Bản đồ + tab tiện ích quanh (a11y), marker khi có toạ độ | task 02:14 | ✅ | `NearbyTabs.tsx`, `LazyMap.tsx` `markers`; MINOR-3 mở |
| 9 | Bảng giá cuộn ngang, ngày cập nhật, "Liên hệ" | task 02:14 | ✅ | `PriceTable.tsx`; MINOR-1 mở (0 → "Từ 0 ₫") |
| 10 | FAQ `details` + JSON-LD `FAQPage` theo ngôn ngữ, không fallback | task 02:14 | ✅ | `ProjectFaq.tsx:16`, `json-ld.ts:260-265`; test :253-291 |
| 11 | Thứ tự menu neo, mục trống ẩn | task 02:15 | ✅ (11 mục) | `visibleSections`; i18n VI/EN |
| 12 | Docs design-spec S03, DESIGN.md | task 02:16 | ⚠️ một phần | §4 |
| 13 | Carry-over MINOR | task 02 | ✅ | review T02 |
| 14 | Spec delta + publish (1.21.0 / v25) | AGENTS Feature 3b | ❌ chưa (close-out) | change doc:67 P5 `pending` |

## 2. Acceptance change doc (:91-97)
| Mục | Trạng thái |
|---|---|
| Tokens + DESIGN + design-spec, AA | Done (P1) |
| Header nổi, ≥ xl không nút Menu | Done (P1) |
| Trang chủ #1–#11 | Done (P2, Q1/Q2; bước admin thêm Cho thuê/Tin tức vào Thứ tự khối) |
| Trang danh sách 240px + băng tìm kiếm + 4 cột | Done (P3) |
| Tin tức hàng danh mục + form tư vấn | Done (P3) |
| Chi tiết dự án thẻ tư vấn dính + tin liên quan; schema tách phase | Done (P4 + P5) |
| **Responsive mobile, VI/EN cùng bố cục, không CLS, giữ LCP** | **PARTIAL → residual**: responsive gate mọi task (375/768/1024/1280), VI/EN cùng component, hero `priority` khung cố định; CLS chỉ đo thanh thông báo (P2-T02 r3); LCP/Lighthouse chưa chạy phase nào; P5 làm trang dự án nặng hơn. Khuyến nghị: Lighthouse/PSI mobile trên staging cho `/`, `/cho-thue`, `/du-an`, `/du-an/[slug]`, `/tin-tuc` + `/en`, hoặc tick kèm residual rõ. |

## 3. Mâu thuẫn spec delta P5 phải sửa
| Mức | Vị trí | Vấn đề | Sửa |
|---|---|---|---|
| HIGH | `SPECIFICATIONS.md:70` | Còn "Phần cần schema mới (khu, giá & quỹ căn, highlights, tiện ích lân cận, bảng giá, FAQ) thuộc BL-020 P5" (tương lai) + "khu", "quỹ căn" không làm | Đoạn "Khối nội dung mở rộng (BL-020 P5)": 4 nhóm + giới hạn (≤ 8/40/30/20), bắt buộc trong hàng, `priceUpdatedAt`, pháp lý = `legalInfo` + PDF; **phân khu và quỹ căn từng căn ngoài phạm vi** |
| HIGH | `:66` (F2 "Chi tiết") | Thiếu 4 khối | Thêm |
| HIGH | `:68` "Bố cục chi tiết (BL-020 P4)" | (a) menu 8 mục vs 11; (b) "< lg thẻ sau Tài liệu" sai — aside sau Hỏi đáp (`ProjectDetail.tsx:124-127`); (c) "Tin liên quan sau Tài liệu" → sau Thư viện (:117-123); (d) Tài liệu nay trong Pháp lý | Viết lại theo thứ tự P5 + quy tắc FAQ/giá/tiện ích quanh |
| MED | `:101` (F11) | JSON-LD thiếu `FAQPage` | Thêm |
| MED | `:117` (Ngoài phạm vi) | Chưa ghi | "quỹ căn chi tiết từng căn; phân khu dự án" |
| LOW | `:105` (F12) | Chưa ghi: hàng thiếu chữ EN ẩn ở `/en`; dự án `enSource=manual` không dịch AI hàng mới | 1 câu |
| MED | `docs/BRD.md:138` FR-PUB-03 | P5 thêm 4 khối nội dung công khai mới (thay đổi phạm vi, khác P4) | **BRD 1.8**: thêm "điểm nổi bật, tiện ích xung quanh (khoảng cách), bảng giá theo loại căn, câu hỏi thường gặp" — qua CR (user ủy quyền P3–P5) |
| MED | `docs/BRD.md:150` FR-PUB-15 | schema.org thiếu `FAQPage` | Cùng bump |
| — | `docs/API_SPEC.md` | không mô tả field dự án | no doc impact |

## 4. Docs as-built cũ
1. `docs/ERD.md:242` cuối câu "Chưa hiển thị ở giao diện công khai (P5-T02)" → trỏ S03.
2. `.context/design-spec.md` S03: :351 "< lg `aside` nằm dưới Tài liệu"; :362 (10b) "sau Tài liệu, trước thẻ Tư vấn ở < lg" (code: sau Thư viện); :363 (11) "< lg nằm dưới Tài liệu"; :353 đánh số "3b" sau mục 4 → "4b".
3. `ProjectDetail.tsx:126` comment "(đúng chỗ form cũ)" hơi cũ.
4. `docs/DESIGN.md:240` khớp.

## 5. MINOR mở (close-out P5)
MINOR-1 `project-detail-view.ts:180` nhận 0 · MINOR-2 `LegalPolicy.tsx` "Tải tài liệu" khi Pháp lý thu gọn · MINOR-3 `NearbyTabs.tsx` panel `tabIndex` · MINOR-4 wording design-spec · MINOR-5 thiếu test.

## 6. Migration / deploy
- `20261019_215847_project_detail_market_blocks` ADDITIVE, không HIGH_RISK, cần PostGIS (đã bật ở `20261017_125429_projects`). Staging `payload migrate` → kiểm trang + tab admin "Nội dung mở rộng" → promote đúng migration lên prod. Không backfill; dự án cũ không hiện khối mới tới khi nhập nội dung.
- Deploy gộp BL-020: migration này + `20261019_144259_homepage_market_blocks` (P2) + bước admin P2 (thêm Cho thuê/Tin tức vào Thứ tự khối).
- Rủi ro merge: main checkout `staging` có `src/payload-types.ts` sửa chưa commit → xung đột với types regen ở e7d0c81; reconcile/regen sau merge.
- Residual: sửa dự án ở locale EN khi hàng chưa có chữ EN sẽ chặn lưu (như `amenities`); marker bản đồ không focus bàn phím; LCP/CLS chưa đo.

## Xử lý (primary, quyết định agent — user ủy quyền 2026-10-20)
- MINOR-1..5 + docs as-built §4 → builder close-out.
- Spec delta §3 → spec-publisher 1.21.0 / scope v25 + **BRD 1.8** (FR-PUB-03, FR-PUB-15).
- Acceptance cuối: đo LCP/CLS lab trên bản build production của worktree (`pnpm start`) qua PerformanceObserver; Lighthouse/PSI mobile trên staging ghi residual (cần deploy, ngoài phạm vi phiên này).
