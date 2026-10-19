# Spec Update — 2026-10-20 public-ui-market-vinhomes Phase 5 (schema dự án + khối nội dung mở rộng)

**spec_version:** 1.20.0 → 1.21.0 (MINOR — thêm field tuỳ chọn cho dự án + 4 khối công khai mới + JSON-LD `FAQPage`; không đổi API endpoint, quyền, nguồn lead, URL)

**BRD:** 1.7 → **1.8** (FR-PUB-03 thêm điểm nổi bật, tiện ích xung quanh (khoảng cách), bảng giá theo loại căn, câu hỏi thường gặp; FR-PUB-15 thêm `FAQPage`). Lý do: thêm phạm vi nội dung công khai (khác P4 thuần hiển thị). User duyệt 4 nhóm ngày 2026-10-19 (`tasks/feature-public-ui-market-vinhomes/README.md` quyết định #4), giao agent quyết phần còn lại ngày 2026-10-20.

**Trigger:** feature-update (Change Request BL-020, **Phase 5/5 — phase cuối**). Change doc `spec/changes/2026-10-19-public-ui-market-vinhomes.md`. Plan: `tasks/feature-public-ui-market-vinhomes/README.md`. Task `phase-5-task-01.md`, `phase-5-task-02.md`. Spec-validation: `.context/review-reports/feature-public-ui-market-vinhomes-phase-5-spec-validation.md` (GAPS FOUND: HIGH F2 :66/:68/:70, MED F11 / Ngoài phạm vi / BRD, LOW F12 → xử lý bằng delta này; docs as-built §4 + MINOR-1..5 sửa ở close-out, review `...-phase-5-closeout-round-1-review.md` PASS).

> Các phase trước: P1 1.16.0 / v19, P2 1.17.0 / v20, P3 1.19.0 / v23, P4 1.20.0 / v24. Sau phase này BL-020 không còn phase build nào.

## Đã làm (Phase 5)

| Task | Loại | Commit | Nội dung | Review |
|---|---|---|---|---|
| P5-T01 | ADDITIVE (schema) | `e7d0c81` | `projects`: `highlights` (≤ 8), `nearbyAmenities` (≤ 40), `priceTable` (≤ 30) + `priceUpdatedAt`, `faqs` (≤ 20) — tab admin "Nội dung mở rộng", tất cả tuỳ chọn; chữ localized vào `TRANSLATABLE_FIELDS.projects`; migration `20261019_215847_project_detail_market_blocks`; regen types; ERD §4.5 | STRICT PASS r1 |
| P5-T02 | ADDITIVE (UI + SEO) | `5b8ae10` | `ProjectHighlights`, `NearbyTabs` (+ `LazyMap` prop `markers`), `PriceTable`, `ProjectFaq` + JSON-LD `FAQPage`; khối Pháp lý gộp `legalInfo` + Tài liệu PDF; thanh mục con 11 mục; `RentalCard` prop `imageSizes` | STRICT PASS r1 |
| close-out | fix + docs | (commit chứa file này) | MINOR-1 giá 0 = chưa nhập; MINOR-2 `#documents` mở + cuộn Pháp lý thu gọn (cả bấm lại, bỏ qua Ctrl/Cmd-click, tôn trọng reduced motion); MINOR-3 panel tab focus được; test bổ sung; ERD / design-spec S03 as-built; spec delta này + BRD 1.8 | NORMAL PASS r1 |

## Quyết định agent (user ủy quyền 2026-10-20)

1. Giới hạn hàng: nổi bật ≤ 8, tiện ích xung quanh ≤ 40, bảng giá ≤ 30, hỏi đáp ≤ 20.
2. Bắt buộc **trong hàng**: `highlights.title`, `nearbyAmenities.name`, `priceTable.unitType`, `faqs.question`, `faqs.answer`; `nearbyAmenities.category` mặc định "other". Không thêm vào `englishRequiredFields`.
3. `highlights.icon` là text (như `amenities.icon`), lưu nhưng giao diện dùng icon chung.
4. `priceUpdatedAt` chỉ ngày, ẩn khỏi "Thêm bộ lọc" admin; hiện `dd/MM/yyyy`.
5. Thứ tự khối / thanh mục con: Tổng quan · Nổi bật · Vị trí · Tiện ích · Mặt bằng · Pháp lý · Chính sách · Giá · Thư viện · Tin liên quan · Hỏi đáp (trống tự ẩn); nhãn "Nổi bật / Giá / Hỏi đáp" (EN "Highlights / Pricing / FAQ").
6. "Chính sách bán hàng" giữ khối riêng cạnh Pháp lý; Tài liệu PDF thành mục con trong Pháp lý, giữ neo `#documents` cho nút ở hero.
7. Tiện ích xung quanh là tab theo nhóm trong khối Vị trí + điểm trên bản đồ sẵn có (`LazyMap` `markers`, không thêm thư viện); không có toạ độ dự án → chỉ danh sách.
8. Bảng giá rút gọn ("3 tỷ – 4 tỷ"); thiếu giá → "Liên hệ"; một đầu → "Từ … / Đến …"; **0 = chưa nhập** (close-out MINOR-1).
9. FAQ `<details>` + JSON-LD `FAQPage` theo ngôn ngữ trang, không fallback.
10. < lg thẻ "Tư vấn 1:1" nằm cuối cột chính (sau Hỏi đáp); "Tin liên quan" sau Thư viện.
11. BRD bump 1.8 (khác P4): thêm nhóm nội dung công khai mới.

## Requirements (SPECIFICATIONS.md)

- **F2 "Chi tiết"** (HIGH): liệt kê thêm điểm nổi bật, tiện ích xung quanh, pháp lý kèm tài liệu PDF, bảng giá theo loại căn, tin liên quan, câu hỏi thường gặp.
- **F2 "Bố cục chi tiết (BL-020 P4 + P5)"** (HIGH): viết lại theo thứ tự 11 mục; < lg thẻ tư vấn cuối cột chính; Tài liệu trong Pháp lý (`#documents` vẫn chạy, mở khối thu gọn); Tin liên quan sau Thư viện.
- **F2 "Khối nội dung mở rộng (BL-020 P5)"** (HIGH, thay câu tương lai "khu, giá & quỹ căn … thuộc P5"): 4 nhóm + giới hạn, bắt buộc trong hàng, `priceUpdatedAt`, quy tắc giá, FAQ + JSON-LD, Pháp lý không field mới, `/en` bỏ hàng thiếu chữ EN, tab admin "Nội dung mở rộng", tất cả tuỳ chọn.
- **F11** (MED): JSON-LD thêm `FAQPage`.
- **F12** (LOW): hàng mới có chữ vi/en riêng + dịch AI; hàng thiếu EN ẩn ở `/en`; dự án `enSource = manual` không tự dịch hàng mới.
- **Ngoài phạm vi** (MED): + "quỹ căn chi tiết từng căn; phân khu dự án".
- Dòng trạng thái: "BL-020 còn mở P5" → "BL-020 đã build đủ P1–P5".

## Schema / Migration / API

- Schema `projects` (+ `_projects_v`): 4 mảng + `priceUpdatedAt` (chi tiết `docs/ERD.md` §4.5 as-built BL-020 P5-T01).
- Migration **`20261019_215847_project_detail_market_blocks`** — **ADDITIVE**, không HIGH_RISK: 4 enum, 16 bảng mới (mảng + `_locales`, cả bản version), 2 cột `price_updated_at` nullable; FK `ON DELETE CASCADE`; `DROP` chỉ ở `down`. Cần PostGIS (đã bật từ `20261017_125429_projects`). Không backfill — dự án cũ không hiện khối mới tới khi admin nhập. up/down/up PASS trên DB worktree.
- API: không endpoint mới; REST `projects` trả thêm field (chỉ thêm). Quyền: không đổi.

## Deploy (không phải requirement)

1. Staging: deploy code → `payload migrate` → kiểm 1 dự án có nhập đủ 4 khối (VI + EN) + tab admin "Nội dung mở rộng" lưu được, dự án cũ lưu/xuất bản EN không lỗi.
2. Promote **đúng migration đã test** lên prod (không `db push`, không clone data).
3. **Deploy gộp BL-020**: cùng migration P2 `20261019_144259_homepage_market_blocks` + bước admin P2 (thêm "Cho thuê" / "Tin tức" vào "Thứ tự khối" trang chủ).
4. Merge về `staging`: main checkout có `src/payload-types.ts` sửa chưa commit → xung đột với types regen ở `e7d0c81`; reconcile / regen sau merge.

## Hành vi bị thay thế

| Trước | Sau (BL-020 P5) |
|---|---|
| Thanh mục con 8 mục, Tài liệu là khối riêng | 11 mục (thêm Nổi bật, Giá, Hỏi đáp); Tài liệu nằm trong Pháp lý, `#documents` vẫn dùng được |
| < lg thẻ tư vấn sau Tài liệu; Tin liên quan sau Tài liệu | < lg thẻ tư vấn cuối cột chính (sau Hỏi đáp); Tin liên quan sau Thư viện |
| Không có nổi bật / tiện ích xung quanh / bảng giá / FAQ | 4 khối tuỳ chọn, ẩn khi trống |
| JSON-LD chi tiết dự án chỉ `RealEstateListing` | Thêm `FAQPage` khi có hỏi đáp (theo ngôn ngữ trang) |

## Ảnh hưởng

- Trang công khai `/du-an/<slug>` + `/en/projects/<slug>`; admin `projects` (tab mới); dịch AI (`TRANSLATABLE_FIELDS.projects`).
- Component: `ProjectDetail`, `ProjectHighlights`, `NearbyTabs`, `ProjectLocation`, `LazyMap` (prop `markers`), `PriceTable`, `ProjectFaq`, `LegalPolicy`, `Documents`, `RentalCard` (prop `imageSizes`), `json-ld.ts`.

**Residual:** sửa dự án ở locale EN khi hàng chưa có chữ EN sẽ chặn lưu (như `amenities`); marker bản đồ không focus bàn phím (danh sách tab thay thế); LCP/CLS chưa đo Lighthouse/PSI trên staging (trang dự án nặng hơn); `scrollIntoView` prototype stub trong test không khôi phục (vô hại).

**Scope sinh:** `spec/test-scope/current.json` scopeVersion 25
