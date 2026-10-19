# Spec Update — 2026-10-19 public-ui-market-vinhomes Phase 2 (trang chủ kiểu market)

**spec_version:** 1.16.0 → 1.17.0 (MINOR — thêm khối/hành vi trang chủ mới; schema global `homepage` thêm field + migration additive; không đổi API endpoint, quyền)

**Trigger:** feature-update (Change Request BL-020, **Phase 2/5**). Change doc `spec/changes/2026-10-19-public-ui-market-vinhomes.md` (vẫn mở, `status: in_progress`). Plan: `tasks/feature-public-ui-market-vinhomes/README.md`. Task `phase-2-task-01.md` … `phase-2-task-05.md`. Spec-validation phase 2: `.context/review-reports/feature-public-ui-market-vinhomes-phase-2-spec-validation.md` (GAPS FOUND → **PASS** sau close-out D1–D4 + quyết định user Q1–Q3).

> **Delta này chỉ là Phase 2/5.** Phase 1 (tokens + header) đã phát hành ở 1.16.0 / scope v19. Còn mở: **P3** trang danh sách + tin tức (banner ~240px, băng tìm kiếm gọn, lưới 4 cột, tin tức hàng theo danh mục + form tư vấn) · **P4** chi tiết dự án (thẻ tư vấn dính, tin liên quan, CTA tham quan) · **P5** schema dự án (highlights, nearbyAmenities, priceTable, faqs). Phase 3 chưa bắt đầu — chờ user duyệt.

## Đã làm (Phase 2)

| Task | Loại | Commit | Nội dung | Review |
|---|---|---|---|---|
| P2-T01 | ADDITIVE (schema) | `4f48764` | Global `homepage`: group `announcementBar` (enabled mặc định tắt, text localized, link), `heroSearch` (enabled, placeholder localized, `chipProjects` ≤ 6), `rentals` (enabled, title localized, `categories` ≤ 4 scope `rental` — kiểm ở server), `news` (enabled, title, intro localized, `posts` ≤ 3); `ctaBanner` thêm `image`, `secondaryLabel` (localized), `secondaryLink`; `blockOrder` thêm `rentals`, `news`; field chữ mới vào danh sách dịch AI; xoá media đang là `ctaBanner.image` bị chặn 409. Migration `20261019_144259_homepage_market_blocks` | STRICT PASS r1 (+ MINOR-1..4) |
| P2-T02 | ADDITIVE (UI) | `b2fe4e4` | Thanh thông báo trên cùng chỉ `/` `/en` (trên header, trong luồng, đóng được, nhớ theo hash chữ+link theo ngôn ngữ, script inline giấu trước paint, mọi route giữ ISR); nút cuộn hero; ô tìm kiếm đè đáy hero (Cho thuê `?q=`, Dự án `?province=&status=`) + chip dự án | STRICT FAIL r1 → r2 → PASS r3 (r2 build 9 route ● → ƒ, bỏ slot `@banner`) |
| P2-T03 | MODIFY (UI) | `4b7ab7e` | Slider Dự án nổi bật thẻ lớn 464×600 kính mờ (`.glass-panel`) + badge + số liệu field sẵn có; Ưu đãi thành slider PostCard + "Xem thêm" → `/tin-bds`; hook `use-snap-slider` + `SliderArrow` | STRICT FAIL r1 → PASS r2 |
| P2-T04 | ADDITIVE (UI) | `4058ae4` | Khối Cho thuê (tab danh mục ≤ 4 × ≤ 8 RentalCard, "Xem thêm" theo danh mục) + khối Tin tức (khối tối, intro + 3 NewsCard); tiêu đề khối tuỳ chọn; hook làm mới trang chủ khi tin cho thuê/tin tức công khai đổi; seed 8 khối + mô tả admin "khối chỉ hiện khi có trong Thứ tự khối"; sửa hồi quy select dự án thiếu `salesStatus`/`scale` | STRICT FAIL r1 → PASS r2 |
| P2-T05 | MODIFY (UI) | `1be4209` | CTA "Đăng ký tham quan" ảnh tràn viền (`image` → fallback `backgroundImage`, scrim `--color-banner-scrim`, focus trắng) + 2 nút pill (nút phụ khi đủ nhãn + link); ServiceCard bo 20px chữ trên kính; ảnh Giới thiệu bo 20px | STRICT FAIL r1 → PASS r2 |
| close-out | fix + docs | `2391bb6` | Hook listing chỉ làm mới path `/vi` `/en` (không còn invalidate tag `global:homepage` → không làm mới ISR toàn site); docs as-built DESIGN.md, design-spec S01, ERD §4.12/§4.15; spec-validation phase 2 | NORMAL PASS r1 |
| checkpoint | docs | `fb360ab` | User chốt Q1–Q3; spec-validation PASS | — |

## Quyết định user (checkpoint Phase 2, 2026-10-20)

| # | Câu hỏi | Quyết định |
|---|---|---|
| Q1 | GAP #3 "slider banner ưu đãi" của market | **(b)** ánh xạ vào slider Ưu đãi (khối 5) — không dựng khối mới, không thêm schema |
| Q2 | Bản ghi trang chủ có sẵn (6 khối `blockOrder`) chưa có `rentals`/`news` | **Giữ bước admin** thêm "Cho thuê", "Tin tức" vào "Thứ tự khối" sau deploy — không auto-append lúc render, không data migration |
| Q3 | "khối chưa có bản EN thì ẩn ở `/en`" áp cho Cho thuê/Tin tức | Tiêu đề khối **tuỳ chọn** (trống → tiêu đề mặc định i18n, kể cả EN); khối chỉ ẩn ở `/en` khi không có tin/bài nào có bản EN |

## Requirements

- SỬA **SPECIFICATIONS.md F1 (Trang chủ)**: thêm đoạn "Bố cục kiểu market (BL-020 Phase 2)" — thanh thông báo, nút cuộn + ô tìm kiếm đè hero + chip dự án, slider dự án kính mờ + số liệu, slider Ưu đãi (= slider banner ưu đãi, Q1), khối Cho thuê, khối Tin tức, CTA ảnh + nút phụ, ServiceCard kính, `rentals`/`news` trong `blockOrder` + bước admin (Q2), làm mới trang chủ khi tin công khai đổi.
- SỬA **SPECIFICATIONS.md quy tắc biên "Globals chưa có bản tiếng Anh"**: thêm ngoại lệ tiêu đề tuỳ chọn cho Cho thuê/Tin tức (Q3).

## Schema / Migration

Migration `migrations/20261019_144259_homepage_market_blocks.ts` — **additive, không HIGH_RISK**:
- `ALTER TYPE enum_homepage_block_order_block ADD VALUE 'rentals'`, `'news'`
- `homepage` + cột: `announcement_bar_enabled` (default false), `announcement_bar_link`, `hero_search_enabled` (default true), `rentals_enabled` (default true), `news_enabled` (default true), `cta_banner_image_id` (FK media `ON DELETE SET NULL`), `cta_banner_secondary_link`
- `homepage_locales` + cột: `announcement_bar_text`, `hero_search_placeholder`, `rentals_title`, `news_title`, `news_intro`, `cta_banner_secondary_label`
- `homepage_rels` + cột `categories_id`, `news_id` (FK cascade) + 3 index
- `down` sửa tay: xoá dòng `blockOrder` rentals/news + rels path `rentals.categories`, `news.posts`, `heroSearch.chipProjects` rồi dựng lại enum cũ. up → down → up PASS trên DB worktree.
- Flow: staging deploy → verify → promote đúng migration lên prod. Không seed/reset staging/prod.

**Field CMS mới (Admin → Trang chủ):** tab "Thanh thông báo" (Hiển thị khối này · Nội dung thông báo · Liên kết) · tab Hero thêm nhóm "Ô tìm kiếm ở hero" (Hiển thị · Chữ gợi ý · Dự án gợi ý (chip) ≤ 6) · tab "Cho thuê" (Hiển thị · Tiêu đề khối · Danh mục cho thuê hiển thị ≤ 4, chỉ scope Cho thuê) · tab "Tin tức" (Hiển thị · Tiêu đề khối · Giới thiệu ngắn · Bài viết hiển thị ≤ 3) · Kêu gọi hành động thêm "Ảnh minh hoạ" · "Chữ trên nút phụ" · "Liên kết của nút phụ" · "Thứ tự khối" thêm lựa chọn "Cho thuê", "Tin tức".

**Bước bắt buộc sau deploy (Q2):** Admin → Trang chủ → "Thứ tự khối": thêm "Cho thuê", "Tin tức". Tuỳ chọn: tiêu đề khối mỗi ngôn ngữ, intro, danh mục/bài chọn tay; bật thanh thông báo; ảnh CTA + nút phụ.

**API:** không endpoint mới. Shape global `homepage` (REST/Local API) thêm `announcementBar`, `heroSearch`, `rentals`, `news`, `ctaBanner.{image,secondaryLabel,secondaryLink}`. Quyền không đổi (global chỉ admin sửa).

## Hành vi bị thay thế

| Trước | Sau (BL-020 P2) |
|---|---|
| Slider dự án: eyebrow, tóm tắt, nút "Khám phá" (`page.home.projects.explore`) | Thẻ 464×600 kính mờ: tên, tỉnh, badge, số liệu; bỏ eyebrow/tóm tắt/nút |
| Ưu đãi nổi bật: lưới thẻ + "Xem tất cả" (`page.home.offers.viewAll`) | Slider PostCard + "Xem thêm" → `/tin-bds` |
| CTA: nền đen / `backgroundImage` phủ 20%, 1 nút | `image` → fallback `backgroundImage`, cả hai qua scrim AA; nút phụ tuỳ chọn |
| ServiceCard chữ trên ảnh | Bo 20px, chữ trên khung kính (cả "Dịch vụ khác" ở `/dich-vu/[slug]`) |
| design-spec S01.1 "không scroll cue" | Có nút cuộn xuống ô tìm kiếm |
| design-tokens §0 ≤ 1 section nội dung tối | ≤ 2 (CTA + Tin tức) |

**i18n:** bỏ `page.home.projects.explore`, `page.home.offers.viewAll`; thêm `page.home.{rentals,news,search,announcement}.*`, `page.home.offers.{viewMore,slide,previous,next}`, `hero.scrollDown`.

**Cache:** thanh thông báo đọc ở layout qua tag `global:homepage` (sửa global `homepage` làm mới mọi trang công khai — như trước); lưu/ẩn/xoá tin cho thuê, tin tức đang/vừa công khai chỉ làm mới path `/vi` `/en` (close-out D4). Mọi route vẫn ● ISR.

**Intent doc:** `docs/BRD.md` FR-PUB-01 (danh sách khối) chưa có các khối mới — intent doc, không tự sửa (C2, cần user duyệt nếu muốn đồng bộ).

## Ảnh hưởng

- Trang chủ `/` và `/en`: mọi khối; layout công khai (`PublicShell`, `load-shell`) đọc thêm dữ liệu thanh thông báo.
- Admin global Trang chủ (tab mới, field mới, validate danh mục scope Cho thuê, chặn xoá media ảnh CTA).
- Collection `rentals`, `news`: hook afterChange/afterDelete làm mới trang chủ.
- `/dich-vu/[slug]` "Dịch vụ khác" (ServiceCard), `PostCard`, `NewsCard` dùng chung.
- Dịch AI global `homepage`: thêm field chữ mới.

**Residual:** LCP/CLS chưa đo Lighthouse toàn trang chủ; thêm truy vấn SQL mỗi lần tái tạo ISR trang chủ; chưa kiểm thiết bị thật (kính mờ Safari, vuốt slider, ServiceCard 21:9 ở md, CTA min 26rem); 768/1280/1440 chưa kiểm cho T04/T05; nhãn tab dài ở 375; `/en` tin tức phụ thuộc `hasEnglish` danh mục; `loadShell` chưa có unit test wiring; WARN "không xếp được job dịch" trong log integration chưa điều tra; seed đặt Tin tức sát CTA.

**Scope sinh:** `spec/test-scope/current.json` scopeVersion 20
