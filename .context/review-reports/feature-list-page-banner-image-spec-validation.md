Agent: spec-validator

# Spec validation (pre-build) — BL-017 `feature-list-page-banner-image` (ADDITIVE)

- Mode: **Spec validation** (trước build, round 1)
- Nguồn: `SPECIFICATIONS.md:77,82` (F10 / FR-ADM-20), `spec/changes/2026-10-19-list-page-banner-image.md`, `.context/design-spec.md` §2.7 (`:122-125`), S04 (`:338`), S05 (`:368`), S12 (`:491`), S15 (`:535`), §6 (`:584`), §6.3 (`:616`), `docs/DESIGN.md:304`, `docs/ERD.md:550` (§4.15), `docs/PERMISSION.md:57`, `tasks/feature-list-page-banner-image/phase-1-task-01.md` (Quyết định 1–9), `spec/changes/2026-10-19-public-ui-market-vinhomes.md` (BL-020), `.context/project-config.md:35-42,84`.
- Code tham chiếu: `src/globals/SiteSettings.ts`, `src/components/layout/PageBanner.tsx`, `src/components/templates/CategoryListTemplate.tsx:19,95`, `src/components/rentals/RentalListPage.tsx:118`, `src/components/careers/JobListPage.tsx:63`, `src/hooks/translation/enqueue-translation.ts:132-134`.

## Verdict: ✅ PASS (kèm 2 mục ⚠️ LOW về doc intent cho change-request sửa, không chặn build)

Không có ❌, không có conflict HIGH, 2 ⚠️ (< 3). Acceptance của change doc, FR-ADM-20 và task khớp nhau. Phạm vi không lấn sang BL-020.

## Ma trận coverage (acceptance ↔ FR-ADM-20 ↔ task)

| # | Requirement (change doc) | FR-ADM-20 (`SPECIFICATIONS.md:82`) | Task | Status | Note |
|---|---|---|---|---|---|
| A1 | Global Cài đặt website có ảnh mặc định + ảnh riêng từng trang danh sách công khai, nhãn VI | Có: group "Ảnh banner trang danh sách", `default` + Dự án/Cho thuê/Đăng tin BĐS/Tin tức/Tuyển dụng, upload `media` | QĐ1 (group `pageBanners`, 6 upload qua `imageUpload`, tab VI), Acceptance 1 (kèm test quét nhãn FR-ADM-19) | ✅ | Key khớp design-spec §6.3 `:616` (`default, projects, rentals, propertyPosts, news, careers`). `imageUpload` có sẵn `SiteSettings.ts:52-58` |
| A2 | Ảnh riêng → biến thể Ảnh; fallback mặc định; không có cả hai → biến thể Chữ | Có, cùng thứ tự | QĐ5 (resolver thuần + unit test 4 case, kể cả id chưa populate), QĐ6, Acceptance 2, 7 (đọc lỗi → Chữ) | ✅ | `PageBanner.tsx:18` đã rẽ nhánh theo `image`; biến thể Chữ giữ nguyên (QĐ8) |
| A3 | Trang danh mục con dùng ảnh danh sách cha | Có (`/<loại>/danh-muc/[category]`) | QĐ6, Acceptance 3 | ✅ | Khớp design-spec S05 `:368`. Danh mục render qua cùng component (`CategoryListTemplate`, `RentalListPage`) nên tự nhiên |
| A4 | Chữ trên ảnh đạt AA (scrim), không CLS, ảnh `priority` (LCP); VI/EN cùng ảnh | Có | QĐ7 (scrim riêng, không đổi `--color-overlay` toàn cục, test contrast cả h1 lẫn mô tả trên ảnh trắng), Acceptance 4–5 | ✅ | Task đã phát hiện đúng lỗi AA hiện tại: `PageBanner.tsx:22` `bg-overlay` 0.55 + mô tả `text-on-dark-muted` (`:25`) không đạt trên ảnh sáng. Khung `h-[clamp(...)]` + `priority` + `sizes="100vw"` đã có (`:20-21`) |
| A5 | Không đổi quyền/schema ngoài field mới; migration versioned nếu cần | Có ("schema chỉ thêm field upload mới, additive; không đổi quyền/API khác") | QĐ2 (kế thừa `access: { read: () => true, update: isAdmin }` — `SiteSettings.ts:71`), QĐ3 (migration additive), Acceptance 6 | ✅ | Khớp `docs/PERMISSION.md:57` (site-settings: khách đọc phần công khai, chỉ admin sửa) |
| A6 | Phạm vi trang: "Tin tức, Cho thuê, Dự án, Dịch vụ, Tuyển dụng, Tin đăng…" | 5 trang + loại trừ Liên hệ và chi tiết dịch vụ | QĐ1 ("Không có `contact`"), Hiện trạng ("Không có trang danh sách Dịch vụ") | ✅ | Xem § Phạm vi Liên hệ / Dịch vụ |
| A7 | Doc reconcile | — | QĐ9 (ERD §4.15 thêm `pageBanners` + migration; builder không sửa intent docs) | ✅ (chờ build) | `docs/ERD.md:550` chưa có `pageBanners` — đúng vì chưa build |

## Kiểm tra theo yêu cầu

### 1. Gap/conflict acceptance ↔ FR-ADM-20 ↔ task
Không có gap chức năng. Ghi nhận nhỏ (không tính ⚠️):
- Change doc ghi sai path `src/components/templates/PageBanner.tsx` (`change doc:20`); thực tế `src/components/layout/PageBanner.tsx`. Task đã ghi đúng path → không ảnh hưởng build.
- Task bổ sung đúng điều change doc chưa nêu: `RentalListPage.tsx:118` dùng `PageBanner` trực tiếp (không qua template) nên phải truyền `image` riêng; `JobListPage.tsx:63` đã gọi `getSiteSettings` (dùng lại, không thêm query).

### 2. Lấn phạm vi BL-020
**Không lấn.** FR-ADM-20 ghi rõ "Ngoài phạm vi (BL-020): chiều cao ~240px, băng tìm kiếm dưới banner, header trong suốt trên banner ảnh". Task QĐ8 giữ nguyên chiều cao `clamp(240px,42svh,440px)`, không đụng header/băng tìm kiếm/biến thể Chữ. Change doc dòng 16-17 (cập nhật BL-020) chỉ là ghi chú chuyển giao; acceptance của BL-017 không chứa các mục đó → nhất quán.
- Residual (đã biết, không phải gap): design-spec §2.7 `:125` "Header trên trang có banner ảnh: biến thể Trong suốt" sẽ chưa đúng sau BL-017 cho tới khi BL-020 làm. FR-ADM-20 đã defer rõ ràng; task QĐ8 yêu cầu ghi Residual → chấp nhận.

### 3. Loại trừ Liên hệ / Dịch vụ
**Hợp lý.**
- Dịch vụ: không có route danh sách (chỉ `/dich-vu/[slug]`); chi tiết dịch vụ là S14 dùng hero `services.coverImage` (design-spec §6.3 `:617`), không phải page banner danh sách. Ghi "Dịch vụ" trong change doc không có đích để áp.
- Liên hệ: không phải trang danh sách; "…" trong change doc không chốt. Design-spec §6.3 `:616` đã ghi `contact` (S15) "chưa làm". Dù vậy đây là diễn giải của change-request → mục **tuỳ chọn** user xác nhận (xem § Điểm cần user quyết), không chặn.
- Trang `/cho-thue/khu-vuc/[province]` (S06, banner Chữ) chưa có route trong `src/app` (Glob rỗng) → không bị `RentalListPage` kéo theo ảnh.

### 4. Quy tắc EN (Spec § Quy tắc biên, F12)
**Không bị ảnh hưởng.** F12 (`SPECIFICATIONS.md:89`): quan hệ/ảnh dùng chung, chỉ trường chữ localized. `pageBanners` không localized (QĐ1, FR-ADM-20) → VI/EN cùng ảnh; ảnh banner là decorative `alt=""` (design-spec §1.3 `:41`, `PageBanner.tsx:21` `decorative`) nên không cần `alt` EN. Quy tắc biên `:173` (global thiếu EN → ẩn/fallback) chỉ áp cho chữ của header/footer/homepage, không áp cho upload.
- Residual (builder kiểm, không phải gap): `site-settings` có `enqueueTranslation.globalAfterChange` (`enqueue-translation.ts:132-134`, `SiteSettings.ts:75`) → lưu chỉ đổi ảnh banner vẫn có thể xếp job dịch như mọi lần lưu global hiện nay (hành vi có sẵn, không đổi bởi BL-017). Builder xác nhận job không dịch/không tốn chi phí khi không có trường localized đổi, ghi vào Verification summary.

### 5. Migration gate
**Áp dụng** (`db_tool: other`, `migration_required: true` — `project-config.md:38-39`). Task QĐ3 đúng gate: `payload migrate:create`, chỉ `ADD COLUMN ..._id` nullable + FK `ON DELETE SET NULL` + index trên `site_settings`, không DROP/đổi type/NOT NULL/backfill, không sửa migration cũ, commit `.ts` + `.json` + `index.ts`. FK trên cột mới toàn NULL không thuộc "FK trên data cũ" → **không HIGH_RISK_MIGRATION**.
- Lưu ý vận hành: `project-config.md:84` ghi `migration: pnpm payload migrate  # KHÔNG auto-allow`. Task QĐ3 yêu cầu chạy trên **DB dev**. Nếu builder bị permission chặn → ghi `Blocked` + in SQL vào Verification summary, không đổi biến thể lệnh (Tool Loop Guard). Tuyệt đối không chạy với `DATABASE_URL_STAGING/PROD`.
- Xoá media đang làm banner: FK `SET NULL` → trang tự rơi về ảnh mặc định / biến thể Chữ (không lỗi). Khác `homepage` có guard 409 (`docs/ERD.md:571`); FR-ADM-20 không yêu cầu guard → chấp nhận, không thêm requirement.

## Gaps / findings

| # | Mức | Loại | Nội dung | Nguồn | Ai xử lý |
|---|---|---|---|---|---|
| G1 | ⚠️ LOW | [PARTIAL] doc intent lệch | Design-spec S04 Cho thuê vẫn ghi "Page banner **Chữ** gọn (padding `--space-section-tight` × 0.6)" trong khi FR-ADM-20 + §6.3 `:616` (liệt kê S04) cho Cho thuê dùng biến thể Ảnh khi có `pageBanners.rentals`/`default` | `.context/design-spec.md:338` vs `SPECIFICATIONS.md:82`, `design-spec.md:616` | **change-request** sửa câu S04 (vd "Page banner §2.7: Ảnh nếu có `pageBanners.rentals`/`default`, không thì Chữ gọn"). Builder **không** sửa (QĐ9) |
| G2 | ⚠️ LOW | stale note | Ghi chú duyệt §6 "**Không** làm `pageBanners`" mâu thuẫn §6.3 cùng file ("đã làm (BL-017, FR-ADM-20)"); thêm nữa §6.3 ghi "**đã làm**" khi chưa build (nên là "làm ở BL-017" như `docs/DESIGN.md:304`) | `.context/design-spec.md:584`, `:616` | **change-request** thêm "(đã đổi 19/10/2026: làm ở BL-017)" vào `:584` và đổi "đã làm" → "làm ở BL-017" ở `:616` (hoặc để nguyên tới close-out rồi xác nhận) |

Không có [MISSING].

## Điểm cần user quyết vs builder tự xử lý

**User quyết (tuỳ chọn, không chặn build):**
- U1. Có muốn ảnh banner cho trang **Liên hệ** (S15) không? Hiện FR-ADM-20 loại trừ dựa trên diễn giải "trang danh sách"; nếu muốn → thêm key `contact` qua `/change` sau (additive, không phá). Mặc định giữ loại trừ.

**Change-request (primary) xử lý trước/cùng build:** G1, G2 (chỉ sửa câu trong intent doc, không đổi requirement).

**Builder tự xử lý (trong phạm vi task):**
- Chọn tab đặt group (tab mới "Ảnh banner" hoặc tab có sẵn), ghi decision log (QĐ1).
- Cách làm scrim riêng + màu mô tả để ≥ 4.5:1 trên ảnh trắng, test contrast (QĐ7).
- Truyền `image` cho `RentalListPage.tsx:118` (không qua template) và `bannerImage` cho 4 trang qua `CategoryListTemplate`; đọc `getSiteSettings` có try/catch (QĐ6); không đổi ISR/dynamic.
- Ghi Residual: header trong suốt / chiều cao 240px / băng tìm kiếm thuộc BL-020 (QĐ8).
- Kiểm hook dịch khi lưu chỉ đổi ảnh (§4 Residual); chạy migrate trên DB dev hoặc ghi `Blocked` (§5).
- Doc reconcile as-built `docs/ERD.md` §4.15 (+ ARCHITECTURE nếu có mục liên quan) (QĐ9).

## Residual risk
- Biến thể Ảnh cao tới `42svh` đẩy bộ lọc/kết quả Cho thuê (S04 density 5) xuống trên mobile cho tới khi BL-020 hạ ~240px — chấp nhận theo FR-ADM-20, ghi nhận để BL-020 xử lý.
- Spec publisher đã chạy (`spec/updates/2026-10-19-list-page-banner-image.md`, `spec/CHANGELOG.md`); không kiểm nội dung `spec/test-scope/current.json` trong lần validate này.
