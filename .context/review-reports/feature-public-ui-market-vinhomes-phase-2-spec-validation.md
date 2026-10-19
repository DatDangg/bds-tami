Agent: spec-validator

# Spec validation: feature-public-ui-market-vinhomes (BL-020) · Phase 2 (trang chủ)
> Report do primary lưu (guard chặn ghi `.context/review-reports/**` trong worktree).

- Mode: phase review sau P2-T01..T05 (đều STRICT PASS). Scope `git diff e4fe9ec..HEAD` — `1070257`, `6b32bfe`, `5ca19aa`, `dcaa060`, `589efc2` (81 file).
- Nguồn: change doc (Acceptance, bảng #1–#11), README (Quyết định user 1–4), task P2-T01..T05, report cuối mỗi task (T01 r1, T02 r3, T03 r2, T04 r2, T05 r2), validation P1, `SPECIFICATIONS.md`, `docs/BRD.md`, `docs/ERD.md` §1.1/§4.15, `docs/DESIGN.md`, design-spec S01, design-tokens, migration `20261019_144259_homepage_market_blocks.ts`, `src/globals/homepage/blocks.ts`, `Homepage.ts`, `home-view.ts`, `src/hooks/homepage/*`, `Rentals.ts`, `News.ts`, `load-shell.ts`, `seed/sample/homepage.ts`. Chỉ đọc (git). Bằng chứng verify lấy từ report + build/runtime của primary.

## Verdict lần 1: GAPS FOUND
Không có lỗi code CRITICAL/MAJOR. Acceptance "Trang chủ đủ #1–#11" **chưa đủ**: "slider banner ưu đãi" của #3 chưa làm (GAP chờ user); homepage hiện có chỉ hiện Cho thuê/Tin tức sau khi admin thêm vào "Thứ tự khối" (bước triển khai). 4 gap docs (D1–D4). 3 quyết định cần user.

## Acceptance coverage
| # | Yêu cầu | Trạng thái | Bằng chứng |
|---|---|---|---|
| 1 | Thanh thông báo trên cùng, đóng được, CMS bật/tắt + chữ + link | Done | `blocks.ts:37-47` (mặc định tắt); `AnnouncementBar.tsx`, `HomeAnnouncementBar.tsx`, `PublicShell.tsx` (trên header, trong luồng); hash theo locale; script ẩn trước paint; chỉ `/`, `/en`. T02 r3: trình duyệt CLS 0, bảng route không đổi |
| 2 | Hero full màn hình, serif viết thường, nút cuộn | Done | P1 typography; `HeroSlider.tsx` nút cuộn tới `[data-hero-search]`; ảnh slide 1 `priority` |
| 3a | Ô tìm kiếm đè đáy hero + chip dự án | Done (ràng buộc) | `HeroSearch.tsx`: Cho thuê GET `/cho-thue?q=`; Dự án GET `/du-an?province=&status=` (không có tham số từ khoá); chip CMS ≤ 6, fallback `isFeatured`, `/en` chỉ dự án có EN |
| 3b | Slider banner ưu đãi | **MISSING — GAP mở** | design-spec S01 `:239` ghi GAP, lựa chọn (a)/(b)/(c) |
| 4 | Giới thiệu restyle | Done | `AboutBlock.tsx` ảnh bo 20px |
| 5 | "Mua từ chủ đầu tư" slider thẻ + "Xem thêm" | Done | `OffersSlider.tsx` (PostCard), "Xem thêm" → `/tin-bds` |
| 6 | Slider dự án lớn kính mờ + số liệu | Done | `ProjectsSlider.tsx` 464×600 `.glass-panel`; số liệu field sẵn có (quyết định 3); hồi quy select P2-T03 sửa ở `dcaa060`, runtime 0 `MISSING_MESSAGE` |
| 7 | "Đăng ký tham quan" ảnh tràn + 2 nút | Done | `layout/CtaBanner.tsx` `image` → fallback `backgroundImage`, scrim AA, nút 2 khi đủ nhãn + link |
| 8 (+#10) | Thuê nhà ở/kinh doanh: tab danh mục, slider tin | Done | `HomeRentals`/`RentalsTabs` ≤ 4 tab × ≤ 8 tin, cùng `SearchService` trang danh mục; ẩn trên homepage cũ tới khi admin thêm vào `blockOrder` |
| 9 | 3 thẻ dịch vụ trên ảnh | Done | `ServiceCard.tsx` bo 20px + kính (ảnh hưởng cả "Dịch vụ khác" — chủ đích) |
| 11 | Tin tức nền thương hiệu: intro + 3 bài | Done | `HomeNews.tsx` `.theme-dark-block`; cùng lưu ý `blockOrder` |
| A | Quản lý qua global Homepage (bật/tắt + thứ tự) | Done (phần lớn) | rentals/news trong `HOMEPAGE_BLOCKS` + `blockOrder`; thanh thông báo/ô tìm kiếm có bật/tắt, vị trí cố định |
| N1 | Responsive | Partial | 375 kiểm T02/T03; chưa kiểm 768/1280/1440 cho T04/T05, vuốt thật, nhãn tab dài 375 |
| N2 | VI/EN cùng bố cục | Done | test EN mọi component; `/en` ẩn tin/bài không có EN |
| N3 | Không CLS | Done theo thiết kế | aspect cố định; thanh thông báo CLS 0 đo T02; chưa Lighthouse toàn trang |
| N4 | Giữ LCP | Residual | ảnh LCP không đổi; thêm truy vấn server mỗi lần tái tạo ISR |
| M | Migration additive, versioned, down có tài liệu | Done | xem dưới |
| Dc | Docs as-built khớp code | Partial | D1–D4 |

## Migration `20261019_144259_homepage_market_blocks`
up chỉ additive: 2× `ALTER TYPE … ADD VALUE` (`rentals`, `news`); 7 cột `homepage` (nullable/default hằng); 6 cột varchar nullable `homepage_locales`; 2 cột uuid nullable `homepage_rels`; 3 FK trên cột rỗng (media `SET NULL`, categories/news `CASCADE` dòng rel) + 3 index → **không HIGH_RISK**. down sửa tay có tài liệu (comment `:30-31`, Decision log, ERD): xoá dòng blockOrder rentals/news + rels 3 path mới, rồi dựng lại enum. up → down → up PASS trên `tami_wt_bl020`; `migrations/index.ts` đăng ký đúng; `payload-types.ts` các task sau chỉ đổi JSDoc.

## Gaps
- **G1 [MISSING]** #3 "slider banner ưu đãi" — user chọn (a) dựng mới (schema + task + migration), (b) map vào slider Ưu đãi (khối 5) hoặc slide hero (chỉ docs), (c) bỏ khỏi phạm vi.
- **G2 [PARTIAL]** homepage hiện có (6 dòng `blockOrder`) không hiện Cho thuê/Tin tức — đã có mô tả admin `BLOCK_ORDER_NOTE` (`blocks.ts:12`), seed đủ 8 khối, bước triển khai ở P2-T04 Decision log `:35` → đưa vào spec/updates + release notes.
- **D1 [PARTIAL]** `docs/DESIGN.md:238` dòng trang chủ còn mô tả slider dự án cũ, thiếu thanh thông báo/ô tìm kiếm, thứ tự khối nên ghi "theo `blockOrder`".
- **D2 [PARTIAL]** `.context/design-spec.md:230,232,241` bảng khối S01: dòng 3 còn "Slider full-bleed | Eyebrow", dòng 5 "Lưới thẻ", ngân sách eyebrow.
- **D3 [PARTIAL]** `docs/ERD.md` §4.15: `:579` thiếu ngoại lệ tiêu đề tuỳ chọn rentals/news + còn "Header trong suốt … CHƯA làm"; `:577` "khi giao diện xong" → as-built; thiếu hook `createRevalidateHomepageOnListing`; `:497` thiếu `ctaBanner.image` trong danh sách chặn xoá media.
- **D4 [PARTIAL]** `loadShell` (`load-shell.ts:47`) đọc tag `global:homepage` ở mọi trang; hook listing (`revalidate-homepage-on-service.ts:48-60`) gọi `revalidateHomepage` → revalidate tag → **mỗi lần lưu tin cho thuê/tin tức đã xuất bản làm mới ISR toàn site**; dữ liệu rentals/news trang chủ không cache theo tag nên chỉ cần path `/vi` `/en`. Lựa chọn: ghi nhận hoặc thu hẹp hook chỉ path.

## Mâu thuẫn intent-doc (session chính xử lý trong spec delta)
| # | Intent | Vị trí | As-built | Mức |
|---|---|---|---|---|
| C1 | F1 khối trang chủ: Hero, Về TAMI, Dự án nổi bật, Dịch vụ, Ưu đãi nổi bật, Đối tác, banner CTA "Nhận tư vấn", Footer | `SPECIFICATIONS.md:51` | thêm thanh thông báo, ô tìm kiếm + chip, Cho thuê, Tin tức; CTA ảnh + nút 2 | MEDIUM |
| C2 | FR-PUB-01 danh sách khối | `docs/BRD.md:135` | như C1 | LOW (intent, chỉ đổi khi user duyệt) |
| C3 | "khối trang chủ chưa có bản EN thì ẩn khối ở `/en`" | `SPECIFICATIONS.md:174`, BRD BR-07 `:190` | rentals/news: thiếu tiêu đề EN → tiêu đề mặc định EN; chỉ ẩn khi 0 tin/bài có EN; không lộ chữ VI | MEDIUM — **user xác nhận (Q3)** |
| C4 | tối đa 1 section nội dung tối | design-tokens §0 (trước P2) | 2 (CTA + Tin tức) | LOW |
| C5 | ERD L9-T01 "khối cần title" | `docs/ERD.md:579` | ngoại lệ rentals/news | xem D3 |
| C6 | design-spec "không scroll cue" | S01.1 | có nút cuộn (`:249` đã ghi) | LOW |
| C7 | NFR-01 LCP/CLS | `SPECIFICATIONS.md:155` | khớp theo thiết kế; SQL mỗi lần tái tạo ISR tăng | LOW residual |
| C8 | #6 "số liệu (diện tích, mật độ, khởi công)" | change doc `:37` | diện tích đất / tổng căn / bàn giao (quyết định 3) | Đã giải quyết |
| C9 | #3 "tìm tin cho thuê/dự án" | change doc `:34` | tab Dự án chỉ lọc `province`/`status` | LOW — ghi spec/updates |

## Quyết định cần user (checkpoint Phase 2)
1. **Q1** GAP #3 "slider banner ưu đãi": (a) dựng mới · (b) map vào Ưu đãi/hero · (c) bỏ.
2. **Q2** homepage hiện có chưa có `rentals`/`news`: giữ "admin thêm vào Thứ tự khối sau deploy" (hiện tại, an toàn) hay tự thêm khối thiếu lúc render (đổi luật as-built, task mới). Không khuyến nghị data migration (bulk → HIGH_RISK).
3. **Q3** diễn giải `SPECIFICATIONS.md:174` cho Cho thuê/Tin tức: "bản EN" = các tin/bài có EN, tiêu đề khối fallback mặc định EN — xác nhận hay yêu cầu ẩn khối khi thiếu tiêu đề EN.
4. **Q4** (thông tin, đã quyết): ≤ 2 section nội dung tối; nút cuộn thay "không scroll cue"; thanh thông báo chỉ trang chủ nhưng đọc qua shell (tag `global:homepage`).

## Spec delta cho session chính (khi merge Phase 2)
1. `SPECIFICATIONS.md:51` (F1): thêm Thanh thông báo (chỉ trang chủ, mặc định tắt, đóng được, nhớ theo hash nội dung theo ngôn ngữ); Ô tìm kiếm đè đáy hero (Cho thuê `q`; Dự án `province` + `status`) + chip "Dự án được quan tâm" (≤ 6, fallback `isFeatured`); Cho thuê (≤ 4 tab danh mục × ≤ 8 tin còn trống, fallback danh mục có tin); Tin tức (intro + ≤ 3 bài, fallback 3 mới nhất); CTA "Đăng ký tham quan" ảnh + nút 2 tuỳ chọn. `rentals`/`news` tham gia `blockOrder`; thanh thông báo/ô tìm kiếm bật/tắt, vị trí cố định. Thêm/bỏ "slider banner ưu đãi" theo Q1.
2. `SPECIFICATIONS.md:174`: thêm điều khoản khối tiêu đề tuỳ chọn theo Q3.
3. `docs/ERD.md` §4.15 đã có field mới; builder sửa ghi chú as-built (D3).
4. `docs/API_SPEC.md`: không endpoint mới; shape global `homepage` thêm `announcementBar`, `heroSearch`, `rentals`, `news`, `ctaBanner.{image,secondaryLabel,secondaryLink}` (kiểm `:230` khi publish).
5. `spec/updates/<date>-public-ui-market-vinhomes-p2.md`:
   - **Migration** `20261019_144259_homepage_market_blocks` (additive, không HIGH_RISK): staging → verify → promote đúng migration lên prod; `down` xoá dòng blockOrder rentals/news + quan hệ mới.
   - **Bước bắt buộc sau deploy:** Admin → Trang chủ → "Thứ tự khối": thêm "Cho thuê", "Tin tức"; (tuỳ chọn) tiêu đề khối mỗi ngôn ngữ (trống → mặc định), intro, danh mục/bài chọn tay; (tuỳ chọn) bật thanh thông báo, ảnh CTA + nút 2.
   - **Đổi hành vi:** thanh thông báo trên header; nút cuộn hero; slider dự án thẻ 464×600 kính mờ + số liệu (bỏ eyebrow/tóm tắt/nút "Khám phá"); Ưu đãi thành slider, "Xem thêm" → `/tin-bds` (thay "Xem tất cả"); ServiceCard kính mờ (cả "Dịch vụ khác" `/dich-vu/[slug]`); `backgroundImage` CTA: trước phủ 20%, nay qua scrim như `image`.
   - **Luật thiết kế:** ≤ 2 section nội dung tối; nút cuộn.
   - **Cache:** tag `global:homepage` làm mới mọi trang công khai; lưu tin cho thuê/tin tức đã xuất bản làm mới trang chủ (D4 — xem kết quả sửa).
   - **i18n:** bỏ `page.home.projects.explore`, `page.home.offers.viewAll`; thêm `page.home.{rentals,news,search,announcement}.*`, `hero.scrollDown`.
   - GAP #3 + kết quả Q1–Q3.
6. `spec/CHANGELOG.md` + bump `spec_version`: MINOR (schema additive + hành vi hiển thị).
7. `spec/test-scope/current.json` (scopeVersion +1, risk **medium-high**: schema/migration + layout dùng chung mọi trang): migration up staging, homepage cũ giữ 6 khối, admin thêm rentals/news → hiện; thanh thông báo (bật/tắt, VI/EN, đóng + tải lại không nháy, đổi nội dung → hiện lại, chỉ `/` `/en`, điều hướng client bỏ thanh), header dính dưới thanh, skip link focus đầu; ô tìm kiếm (`?q=` cả không JS; `province`/`status`; ←/→/Home/End; chip fallback; `/en` chip có EN); nút cuộn; thẻ dự án badge + số liệu (thiếu thì ẩn); slider Ưu đãi + "Xem thêm"; Cho thuê (tab, "Xem thêm" theo danh mục, `/en`, rỗng → ẩn, publish/sửa/thuê/xoá tin → trang chủ làm mới); Tin tức (3 bài, intro, `/en`, tiêu đề trống → mặc định); CTA có/không ảnh (scrim AA, vòng focus trắng), nút 2 chỉ khi đủ nhãn + link, CTA `/dich-vu/[slug]` không đổi; ServiceCard kính; responsive 375/768/1280/1440; Lighthouse mobile `/`, `/en`; bảng route mọi route vẫn ● ISR.
8. BACKLOG/progress: BL-020 Phase 2 xong (`1070257`, `6b32bfe`, `5ca19aa`, `dcaa060`, `589efc2` + commit close-out docs); GAP #3 theo Q1; P3 sau checkpoint.

## File bảo vệ
`git diff --stat e4fe9ec..HEAD -- SPECIFICATIONS.md spec/ .context/progress.json docs/BRD.md` rỗng ✅. `src/app/(payload)/admin/importMap.js` chỉ khác xuống dòng — không commit ✅.

## Residual risk
LCP/CLS chưa đo lab toàn trang chủ; SQL mỗi lần tái tạo ISR tăng; chưa kiểm thiết bị thật (kính mờ Safari, vuốt, ServiceCard 21:9 md, CTA min 26rem, 768/1280/1440 cho T04/T05); `/en` `visibleCategory` tin tức phụ thuộc `hasEnglish` của danh mục khi `select: {category:true}`; `loadShell` chưa có unit test wiring; WARN "không xếp được job dịch" trong log integration chưa điều tra; seed đặt Tin tức sát CTA (chấp nhận); minor còn lại (mock `OffersSlider.test`, regex `load-shell-keys`, kiểu view input gắn select).

## Danh sách việc cho builder (close-out)
D1, D2, D3 (docs as-built); D4 (thu hẹp hook listing chỉ path hoặc ghi nhận). G1/G2/C3 chờ user Q1–Q3.

## Quyết định user tại checkpoint Phase 2 (2026-10-20) — primary ghi
- **Q1** GAP #3 "slider banner ưu đãi": (b) ánh xạ vào slider Ưu đãi (khối 5) — không dựng mới, không schema. G1 đóng theo ánh xạ; design-spec S01 cập nhật.
- **Q2** giữ bước triển khai admin thêm "Cho thuê", "Tin tức" vào "Thứ tự khối" (không auto-append, không data migration).
- **Q3** xác nhận: tiêu đề khối Cho thuê/Tin tức tuỳ chọn (trống → tiêu đề mặc định i18n, kể cả EN); khối chỉ ẩn ở `/en` khi không có tin/bài có bản EN → session chính ghi điều khoản này vào `SPECIFICATIONS.md:174` khi publish.
- Phase 3 **chưa** bắt đầu theo yêu cầu user.

## Verdict cuối Phase 2: PASS (G1 đóng theo Q1; G2 là bước triển khai; D1–D4 đã sửa ở 8e9fd08)
