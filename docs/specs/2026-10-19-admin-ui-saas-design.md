# Design: Làm lại giao diện admin (Payload) — gọn, hiện đại kiểu SaaS (BL-015)

- Change doc: `spec/changes/2026-10-19-admin-ui-saas-refresh.md` · Backlog: BL-015 · Class: **MODIFY (UI admin)**
- Trạng thái: ✅ **user duyệt 2026-10-19** ("ok theo đề xuất", §7 Đã chốt). Spec 1.11.0 (FR-ADM-19), task `tasks/feature-admin-ui-saas-refresh/`.
- Mock tĩnh: `docs/specs/2026-10-19-admin-ui-saas-mock.html` (mở trực tiếp bằng trình duyệt; nút đổi sáng/tối; 4 màn: Tổng quan, Danh sách, Form sửa, bảng nhóm menu).
- Phạm vi: chỉ `/admin` (Payload 3.91, `@payloadcms/ui` 3.91). Không đụng `src/app/(frontend)`, không đổi schema/DB, access control, API.
- Quan hệ với design-spec site public: `.context/design-spec.md` là của website công khai; tài liệu này là design riêng của admin (không gộp vào đó để khỏi lẫn hai bộ token).

---

## 0. Hiện trạng (khảo sát 2026-10-19)

| Hạng mục | Hiện trạng | Nguồn |
|---|---|---|
| Style | Chỉ ghi đè palette `success` (màu nhấn #8C6733, đã tính contrast sáng/tối), font Montserrat, nút primary, logo sáng/tối. Nền/viền/bo góc/bóng là Payload mặc định (xám thuần, radius 3–4–8px, input viền `elevation-150` ≈ 1.26:1) | `src/app/(payload)/custom.scss` |
| Dashboard | Lưới card collection mặc định + `beforeDashboard: TranslationFailedBanner` | `src/payload.config.ts` |
| Sidebar | Không collection nào có `admin.group` → mọi mục nằm chung nhóm "Collections"/"Globals", thứ tự theo mảng `collections` (Staff, Media, PrivateFiles, AuditLogs, …) | `payload.config.ts` |
| Nhãn | **0/21 collection có `labels`**, 4/4 global có `label`. **489/489 field hiển thị không có `label`** (quét config: 373 field ở 21 collection + 116 field ở 4 global, chưa tính collection `redirects` của plugin — bảng §0.1). 255 option select **đều đã có nhãn** (object `{label, value}`). 13 array/blocks thiếu `labels`/`RowLabel` | quét bằng script (vitest đọc config thô) |
| Danh sách | Mọi collection đã có `defaultColumns` + `useAsTitle` (trừ `private-files` không có `useAsTitle`). Chưa có badge trạng thái, chưa có thumbnail tuỳ biến | config |
| Form | 0 `tabs`, 0 `collapsible`, 0 `row`. Đã đẩy một số field sang sidebar (tổng 63 field `position: sidebar`) | config |
| Nhãn tiếng Việt sẵn có | `COLLECTION_LABELS` / `GLOBAL_LABELS` ở `src/lib/translation/admin-ui.ts` (9 collection + 4 global) — dùng lại làm nguồn nhãn collection để không lệch | code |

### 0.1. Field thiếu label theo collection/global (field hiển thị, không tính `admin.hidden: true`)

| Collection/global | Field | Array thiếu labels | Ghi chú |
|---|---:|---|---|
| projects | 51 | amenities, floorPlans | nhiều group (`scale`, `seo`, `translation`) |
| rentals | 49 | — | group `rentalTerms` |
| property-posts | 37 | — | group `offer` |
| job-postings | 32 | — | |
| leads | 31 | — | group `utm` |
| news | 26 | — | |
| services | 23 | — | |
| categories | 21 | — | |
| pages | 21 | — | |
| developers | 16 | — | |
| job-applications | 12 | — | |
| lead-activities | 8 | — | |
| wards | 8 | legacyNames | |
| audit-logs, staff | 7 + 7 | — | |
| provinces | 6 | — | |
| click-events, click-stats-daily, translation-usage | 5 + 5 + 5 | — | |
| media | 3 | — | |
| private-files | 0 | — | upload thuần, chỉ cần `labels` collection |
| redirects (plugin) | (chưa quét — field do plugin sinh; override qua `overrides.fields`) | — | |
| **global** homepage | 54 | hero.slides, about.stats, blockOrder | |
| site-settings | 30 | socialLinks, notificationEmails, translationGlossary | |
| header | 17 | navItems, navItems.children | |
| footer | 15 | columns, columns.links | |
| **Tổng** | **489** | **13** | |

Lưu ý: phần lớn field dùng chung (`slug`, `status`, `publishedAt`, `author`, `isFeatured`, `hasEnglish`, `translation.*`, `seo.*`) sinh từ `src/collections/_shared/content-defaults.ts` và `src/fields/*` → gắn nhãn một lần ở đó phủ được khoảng 15 field × 8 collection nội dung. Số nhãn thực phải viết tay ước ~260–280.

---

## 1. Design tokens admin

Nguyên tắc: **trung tính ấm (stone), nhiều khoảng trắng, màu nhấn TAMI tiết chế** (chỉ dùng cho: nút chính, link, focus, mục menu đang chọn, số liệu cần chú ý). Không gradient, không màu nhấn làm nền diện rộng.

Cách áp: tokens khai báo là biến `--admin-*` trong `custom.scss`, rồi **map vào biến của Payload** (`--theme-elevation-*`, `--theme-bg`, `--theme-input-bg`, `--style-radius-*`, `--theme-border-color`) riêng cho sáng và tối (giống cách đã làm với `--theme-success-*`: Payload tự đảo thang ở dark, nên ghi đè thẳng `--theme-elevation-*` theo từng theme thay vì `--color-base-*`).

### 1.1. Màu — sáng

| Token | Giá trị | Dùng cho | Contrast (WCAG 2.2, đã tính) |
|---|---|---|---|
| `--admin-canvas` | `#F7F7F5` | nền app (sau card/bảng) | — |
| `--admin-surface` | `#FFFFFF` | card, bảng, form, sidebar phải | — |
| `--admin-surface-hover` | `#FAF9F7` | hover dòng bảng | chữ chính 16.62 |
| `--admin-nav-bg` | `#FBFBFA` | sidebar trái | — |
| `--admin-border` | `#E7E5E4` | đường chia trang trí (không phải biên điều khiển) | 1.26 (trang trí — không yêu cầu) |
| `--admin-border-strong` | `#8F8984` | **viền input/select/checkbox**, biên điều khiển | 3.45 / surface ≥ 3 ✅ |
| `--admin-text` | `#1C1917` | chữ chính, số thống kê | 17.49 / surface, 16.30 / canvas ✅ |
| `--admin-text-muted` | `#57534E` | nhãn phụ, header cột bảng | 7.63 / surface, 7.11 / canvas ✅ |
| `--admin-text-subtle` | `#6B6560` | mô tả field, placeholder, meta | 5.74 / surface, 5.36 / canvas ✅ |
| `--admin-accent` | `#8C6733` | nút chính, link, focus ring | link 5.12 / surface, 4.77 / canvas ✅; chữ trắng trên nút 5.12 ✅ |
| `--admin-accent-hover` | `#7A5A2C` | hover nút chính | chữ trắng 6.31 ✅ |
| `--admin-accent-soft` | `#F8F3EB` | nền mục menu đang chọn, badge accent | chữ `#6A4E26` 6.96 ✅ |
| `--admin-focus` | `#8C6733` 2px + offset 2px | focus-visible mọi điều khiển | 5.12 ✅ |

### 1.2. Màu — tối

| Token | Giá trị | Contrast |
|---|---|---|
| `--admin-canvas` | `#121110` | — |
| `--admin-surface` | `#1A1918` | — |
| `--admin-surface-hover` | `#222120` | chữ chính 14.73 ✅ |
| `--admin-nav-bg` | `#161514` | — |
| `--admin-border` | `#2E2C2A` | trang trí 1.26 |
| `--admin-border-strong` | `#6E6862` | 3.19 / surface ✅ (≥ 3) |
| `--admin-text` | `#F5F5F4` | 16.09 / surface, 17.29 / canvas ✅ |
| `--admin-text-muted` | `#A8A29E` | 6.96 / surface, 7.48 / canvas ✅ |
| `--admin-text-subtle` | `#8F8984` | 5.08 / surface, 5.46 / canvas ✅ |
| `--admin-accent` | `#E0BF89` | 10.02 / surface; chữ `#141414` trên nút 10.51 ✅ |
| `--admin-accent-hover` | `#EBD2A8` | chữ `#141414` 12.56 ✅ |
| `--admin-accent-soft` | `#2A2013` | chữ `#EBD2A8` 10.89 ✅ |
| `--admin-focus` | `#E0BF89` | 10.02 ✅ |

Tối dùng **viền thay bóng** (bóng không đọc được trên nền tối).

### 1.3. Badge trạng thái (chữ / nền — sáng · tối)

| Tone | Sáng | Contrast | Tối | Contrast | Dùng cho |
|---|---|---:|---|---:|---|
| neutral | `#44403C` / `#F0EFED` | 8.94 | `#D6D3D1` / `#2E2C2A` | 9.34 | `draft`, `spam`, `rented`, `handed_over`, đã ẩn |
| success | `#166534` / `#E7F5EC` | 6.34 | `#86EFAC` / `#12301E` | 10.19 | `published`, `won`, `hired`, `selling` |
| warning | `#854D0E` / `#FDF3DC` | 6.21 | `#FCD34D` / `#3A2A08` | 9.62 | `new` (lead/hồ sơ), `scheduled`, `reviewing`, chưa phân công |
| danger | `#9F1239` / `#FDECEF` | 7.03 | `#FDA4AF` / `#3B1219` | 8.63 | `lost`, `rejected`, dịch lỗi |
| info | `#1E4E8C` / `#E8F0FB` | 7.25 | `#93C5FD` / `#132A4A` | 7.99 | `contacted`, `consulting`, `interview`, `upcoming` |
| accent | `#6A4E26` / `#F8F3EB` | 6.96 | `#EBD2A8` / `#2A2013` | 10.89 | nổi bật (`isFeatured`) |

Badge luôn có **chữ** (không chỉ màu) + chấm tròn 6px cùng tone; mapping value → tone đặt ở **một** file (`src/components/admin/status-tones.ts`) để test được. Danh sách value cuối cùng lấy từ `CONTENT_STATUSES`, `LEAD_STATUSES`, `APPLICATION_STATUSES`, `SALES_STATUSES`, trạng thái rentals.

### 1.4. Bo góc, bóng, khoảng cách, chiều cao

| Token | Giá trị | Map vào Payload |
|---|---|---|
| `--admin-radius-s` | 6px | `--style-radius-s` (input, nút, badge = 999px riêng) |
| `--admin-radius-m` | 8px | `--style-radius-m` (popup, dropdown) |
| `--admin-radius-l` | 12px | `--style-radius-l` (card, bảng, panel) |
| `--admin-shadow-sm` | `0 1px 2px rgba(28,25,23,.06)` | card thống kê, bảng (sáng) |
| `--admin-shadow-md` | `0 1px 3px rgba(28,25,23,.08), 0 8px 24px rgba(28,25,23,.06)` | dropdown, popup (sáng) |
| Tối | `none` + viền `--admin-border` | |
| Spacing | thang 4px: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 | gutter trang 32px desktop / 20px tablet / 16px mobile (`--gutter-h`) |
| Control height | 36px (input, select, nút thường) · 40px nút chính header · **44px vùng chạm < 768px** | |
| Dòng bảng | 48px (thoải mái, mặc định) | |
| Sidebar trái | 256px (`--nav-width`) | |
| Max width form | nội dung chính 760px + sidebar phải 320px | |

### 1.5. Typography (Montserrat — giữ `--font-body` hiện có)

| Vai trò | Size / line-height / weight |
|---|---|
| Tiêu đề trang (H1 list/edit) | 24 / 32 / 600 |
| Tiêu đề khối, tên card | 16 / 24 / 600 |
| Chữ thường, ô bảng, input | 14 / 20 / 400 |
| Nhãn field | 13 / 18 / 500 (`--admin-text`) |
| Mô tả field, meta, header cột | 12–13 / 18 / 400–500 (`--admin-text-subtle` / `muted`); header cột **không in hoa toàn bộ** |
| Nhóm menu (eyebrow) | 12 / 16 / 600, `--admin-text-subtle` |
| Số thống kê | 28 / 36 / 600, `font-variant-numeric: tabular-nums` |

### 1.6. Ràng buộc kỹ thuật (bắt buộc cho builder)

1. Mọi chỗ Payload dùng `--theme-elevation-*` làm **màu chữ** (mô tả field, placeholder, ô trống "&lt;Không có&gt;", ngày cập nhật…) phải đạt ≥ 4.5:1 sau khi map; mọi biên điều khiển (input/select/checkbox/radio/upload dropzone) ≥ 3:1. Đề xuất map:
   - Sáng: `elevation-0 #FFF`, `50 #F7F7F5`, `100 #EFEEEC`, `150 #E7E5E4`, `200 #D6D3D1`, `250 #C4C0BC`, `300 #A8A29E`, `350 #8F8984`, `400 #6E6862` (5.50), `450 #625C57`, `500 #57534E`, `600 #44403C`, `800 #292524`, `1000 #0C0A09` (các bậc lẻ nội suy).
   - Tối: `elevation-0 #1A1918`, `50 #222120`, `100 #292524`, `150 #36322F`, `200 #44403C`, `250 #4A4642`, `300 #57534E`, `350 #6E6862` (3.19), `400 #A8A29E` (6.96), `450 #B0ABA6`, `500 #C4C0BC`, `800 #EFEEEC`, `1000 #FFFFFF`.
   - Viền input ghi đè riêng sang `--admin-border-strong` (Payload mặc định dùng `elevation-150` ≈ 1.26:1).
2. CSS ngoài `@layer` (như hiện tại) để thắng `payload-default`; **không** dùng `!important` trừ chỗ logo đã có.
3. Không đổi `--base` / `--base-body-size` của Payload (đổi sẽ dịch toàn bộ spacing nội bộ, dễ vỡ) — chỉnh cỡ chữ ở selector cụ thể.
4. Test contrast tự động: một test unit đọc bảng token (TS const xuất cho cả SCSS-doc lẫn test) và assert ngưỡng — để giữ số liệu trên không trôi.

---

## 2. Sidebar — nhóm theo nghiệp vụ

Dùng `admin.group` (chuỗi tiếng Việt) + **sắp xếp lại mảng `collections`/`globals`** trong `payload.config.ts` (Payload xếp nhóm theo thứ tự xuất hiện; đổi thứ tự mảng không đổi schema/migration). Mục ẩn theo quyền giữ nguyên `admin.hidden` hiện có.

| # | Nhóm | Mục (thứ tự) | Ai thấy |
|---|---|---|---|
| — | **Tổng quan** (link dashboard, mặc định của Payload) | | mọi người |
| 1 | **Khách hàng** | Khách hàng tiềm năng (`leads`) · Lịch sử chăm sóc (`lead-activities`) | admin, sale |
| 2 | **Nội dung** | Dự án · Cho thuê · Tin bất động sản · Tin tức · Dịch vụ · Trang pháp lý | admin, sale (Dịch vụ/Trang pháp lý: sale chỉ đọc theo quyền hiện có) |
| 3 | **Tuyển dụng** | Tin tuyển dụng (`job-postings`) · Hồ sơ ứng tuyển (`job-applications`) | tin: admin+sale · hồ sơ: admin |
| 4 | **Thư viện** | Ảnh & tệp (`media`) · Tệp riêng tư (`private-files`) | ảnh: mọi người · tệp riêng: admin |
| 5 | **Danh mục** | Danh mục (`categories`) · Chủ đầu tư (`developers`) · Tỉnh/thành (`provinces`) · Phường/xã (`wards`) | mọi người (sửa: admin) |
| 6 | **Website** (globals + redirect) | Cấu hình chung · Trang chủ · Đầu trang · Chân trang · Chuyển hướng 301 (`redirects`) | admin |
| 7 | **Hệ thống** | Nhân viên (`staff`) · Nhật ký thao tác (`audit-logs`) · Lượt bấm liên hệ (`click-events`) · Thống kê lượt bấm theo ngày (`click-stats-daily`) · Chi phí dịch AI (`translation-usage`) | admin (sale chỉ thấy "Nhân viên" = hồ sơ của mình, như quyền hiện tại) |

**As-built (T03):** nhóm + thứ tự ở `src/components/admin/admin-groups.ts` (`ADMIN_NAV_GROUPS`, plugin chạy cuối). Payload 3.91 luôn xếp collection trước global trong cùng nhóm → nhóm Website thực tế: Chuyển hướng 301 · Cấu hình chung · Trang chủ · Đầu trang · Chân trang.

Câu hỏi mở: `lead-activities` nên ẩn khỏi menu (xem trong form lead) hay giữ? `click-events` (dữ liệu thô) có cần hiện không? → §7.

**Icon:** Payload 3.91 không hỗ trợ icon cho mục nav qua config; muốn có phải thay cả `admin.components.Nav` (component tự viết, phải tự xử lý quyền/ẩn/active/collapse/mobile) → rủi ro cao, bảo trì khi nâng Payload. **Đề xuất: không icon ở menu** (nhóm + khoảng trắng đã đủ phân cấp); icon chỉ dùng ở card dashboard + lối tắt (component của mình). → hỏi user §7.

Style sidebar: nền `--admin-nav-bg`, nhãn nhóm 12/600 `text-subtle`, mục 14/500 cao 36px bo 6px; đang chọn = nền `accent-soft` + chữ `#6A4E26` (tối `#EBD2A8`) + vạch 3px trái màu accent; hover = nền `elevation-100`.

---

## 3. Màn Tổng quan (dashboard)

Thay view dashboard mặc định bằng `admin.components.views.dashboard.Component` (Server Component). Số liệu lấy bằng **Local API `payload.count({ collection, where, req, overrideAccess: false })`** → tự áp quyền của người đang đăng nhập (sale chỉ đếm được lead được giao / bài của mình); collection user không có quyền `read` → **không render** thẻ đó (kiểm bằng `req.payload.config` + `permissions` của `getAccessResults`, không chỉ ẩn bằng CSS).

### 3.1. Bố cục (desktop ≥ 1024)

```
┌ Header: "Chào buổi sáng, <tên>" (H1 24/600) · ngày hôm nay · [＋ Tạo mới ▾] ─────────────┐
│ [Cảnh báo dịch lỗi — TranslationFailedBanner giữ nguyên, restyle thành alert danger]    │
├─ Thẻ số liệu (4 cột, 2 cột tablet, 1 cột mobile) ────────────────────────────────────────┤
│ Lead mới (24h/7 ngày) │ Lead chưa phân công │ Hồ sơ ứng tuyển mới │ Tin đang hiển thị      │
├─ Lối tắt tạo nội dung (chip/nút phụ, theo quyền create) ────────────────────────────────┤
├─ 2 cột: [Lead mới nhất — 5 dòng, badge trạng thái, người phụ trách] │ [Bạn sửa gần đây] ──┤
├─ Danh mục quản lý: nhóm nghiệp vụ (giống sidebar), mỗi nhóm 1 card liệt kê mục + số bản ghi ┤
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2. Thẻ số liệu đề xuất (chốt với user §7)

| Thẻ | Admin | Sale | Truy vấn (`count`, không tải bản ghi) | Click → |
|---|---|---|---|---|
| Lead mới | toàn bộ `status = new` | lead được giao `status = new` | leads where status=new | list leads lọc sẵn |
| Lead chưa phân công | `status=new` & `assignedTo` không tồn tại | ẩn | | list lọc sẵn |
| Lead đang chăm sóc | — | `contacted`+`consulting` của mình | | list lọc |
| Hồ sơ ứng tuyển mới | `job-applications status=new` | ẩn (không có quyền) | | list lọc |
| Nội dung đang hiển thị | published của 4 loại (dự án, cho thuê, tin BĐS, tin tức) | bài của mình | 4 lần `count` | — |
| Bài nháp của tôi | tuỳ chọn | `status=draft` & author = mình | | list lọc |

Thẻ: card `surface` bo 12px, nhãn 13/500 muted, số 28/600, dòng phụ 12 subtle ("+3 so với hôm qua" chỉ khi rẻ — mặc định **không** làm so sánh để tránh truy vấn thêm). Số cần chú ý (chưa phân công > 0) hiện badge warning.

### 3.3. Quan hệ với FR-ADM-14 (L13-T01 của initial build) — ⚠️ chồng lấn

`tasks/tami-website/layer-13-task-01.md` (Should, chưa làm) đã lên kế hoạch dashboard đầy đủ: endpoint `GET /api/admin/dashboard` (API_SPEC §4) + lead theo trạng thái/nguồn/sale/khoảng thời gian, lượt bấm hotline/Zalo/fanpage, bài dịch lỗi/chờ duyệt, chi phí dịch tháng, STRICT review.
**Đề xuất:** BL-015 làm **khung dashboard + thẻ đếm nhanh + lối tắt + danh sách gần đây** (chỉ `count`/`find limit 5` qua Local API, không endpoint mới, không đổi API). L13-T01 sau đó **cắm thêm** khối thống kê (biểu đồ theo nguồn/sale, lượt bấm, chi phí dịch) vào khung này qua endpoint của nó. Ghi chú này vào L13-T01 khi user duyệt. Phương án khác: dời toàn bộ dashboard sang L13-T01 (BL-015 bỏ T04). → hỏi user §7.

---

## 4. Màn danh sách (list view)

- Header trang: H1 + mô tả ngắn 1 dòng (`admin.description` collection, tiếng Việt) + nút "Tạo mới" primary bên phải; thanh tìm kiếm + nút Cột/Bộ lọc gom một hàng, cao 36px.
- Bảng: card `surface` bo 12px, viền `--admin-border`; header cột 12/500 muted nền `canvas`, **dính trên** khi cuộn; dòng 48px, hover `surface-hover`; cột tiêu đề 14/500 màu text (link accent chỉ khi hover); số/tiền căn phải `tabular-nums`; ngày dạng `19/10/2026 14:05`.
- **Thumbnail**: cột đầu 40×40 bo 6px `object-fit: cover` cho collection có ảnh đại diện: `projects` (ảnh đầu `gallery` hoặc `seo.ogImage` — chốt field), `rentals` (`gallery[0]`), `property-posts` / `news` (`cover`), `media` (sẵn của Payload). Làm bằng `admin.components.Cell` trên field ảnh, ảnh dùng size nhỏ nhất (`thumbnail`) của Media, `loading="lazy"`, alt rỗng (trang trí, tiêu đề đã ở cột kế).
- **Badge trạng thái**: `admin.components.Cell` cho các field select trạng thái (`status`, `salesStatus`, lead `status`, application `status`, translation status) dùng chung component `StatusBadge` + `status-tones.ts`.
- `defaultColumns` rà lại (đề xuất ở mock): bỏ cột kỹ thuật khỏi mặc định (vd `assigneeInactive` → gộp thành badge "Sale đã nghỉ" cạnh tên người phụ trách).
- Phân trang + "Số dòng/trang" giữ Payload, chỉ restyle. Trạng thái rỗng: minh hoạ đơn giản + nút "Tạo &lt;tên&gt; đầu tiên".
- Mobile < 768: bảng cuộn ngang trong card (Payload mặc định), cột tiêu đề dính trái; header trang xếp dọc.
- `TranslationStatusFilter` (BL-016) nằm ở hàng bộ lọc này — xem §8.

## 5. Form sửa (edit view)

Nguyên tắc: **chỉ dùng tab không tên, `row`, `collapsible`** — không bọc field vào `group`/`tabs` có `name` (đổi đường dẫn dữ liệu → migration). Các group đã có tên (`seo`, `translation`, `scale`, `rentalTerms`, `offer`, `utm`) giữ nguyên, chỉ đặt vào tab.

### 5.1. Khung chung collection nội dung (dự án, cho thuê, tin BĐS, tin tức, tuyển dụng, dịch vụ)

| Vùng | Nội dung |
|---|---|
| Header | Tiêu đề bài + badge trạng thái + breadcrumb; nút "Lưu nháp" (phụ) / "Xuất bản" (primary) như Payload |
| Tab **Nội dung** | tiêu đề, danh mục, tóm tắt, nội dung richText |
| Tab **Thông tin** (tên theo loại: "Thông tin dự án" / "Thông tin căn") | giá, diện tích, vị trí, quy mô… dùng `row` 2 cột |
| Tab **Hình ảnh** | cover, gallery, mặt bằng, tài liệu |
| Tab **SEO** | group `seo` |
| Tab **Bản dịch** | group `translation` (chỉ đọc) + nút "Dịch lại bằng AI" / "Duyệt bản EN" hiện có |
| Sidebar phải (320px) | Trạng thái · Ngày xuất bản · Tác giả · Nổi bật · Đường dẫn (slug) · Có bản tiếng Anh |

Mỗi field có `label` tiếng Việt; field khó hiểu có `admin.description` (1 câu, 12px subtle). Nhãn hàng array dùng `RowLabel` hiện giá trị chính (vd "Tầng 12 – 2PN", "Facebook").

### 5.2. Leads

Tab **Khách hàng** (họ tên, SĐT, email, lời nhắn — chỉ đọc với sale) · Tab **Nguồn** (source, bài liên quan, UTM, pageUrl, referrer) · Tab **Lịch sử chăm sóc** (join `activities`). Sidebar: Trạng thái · Lý do không thành (khi `lost`) · Người phụ trách + `LeadAssigneeWarning` · các mốc thời gian (chỉ đọc).

### 5.3. Globals

`homepage`: tab theo khối (Hero · Giới thiệu · Dự án nổi bật · Dịch vụ · Ưu đãi · Đối tác · Kêu gọi · Thứ tự khối · SEO · Bản dịch). `site-settings`: tab Thông tin công ty · Liên hệ & mạng xã hội · Email nhận thông báo · Dịch tự động · Kỹ thuật (GA, phiên bản chính sách).

Mobile < 768: sidebar phải xuống dưới (Payload mặc định), tab cuộn ngang.

---

## 6. Responsive (gate reviewer)

| Breakpoint | Sidebar trái | Dashboard thẻ | Bảng | Form |
|---|---|---|---|---|
| ≥ 1280 | mở cố định 256px | 4 cột | đầy đủ | 2 cột (main + sidebar 320) |
| 1024–1279 | mở | 4 cột (thu hẹp) | đầy đủ | 2 cột |
| 768–1023 | thu gọn, mở bằng nút | 2 cột | cuộn ngang | 1 cột, sidebar xuống dưới |
| < 768 | drawer toàn màn | 1 cột | cuộn ngang, cột tiêu đề dính | 1 cột, vùng chạm 44px |

Ảnh trước/sau (Acceptance): Tổng quan, danh sách Dự án, danh sách Lead, form Dự án, form Lead, Cấu hình chung — sáng + tối, 1440 và 390px.

---

## 7. Câu hỏi cần user quyết (xem report của change-request)

Q1 Thẻ số liệu dashboard · Q2 Dashboard: khung ở BL-015 + số liệu sâu ở L13-T01 hay dời hẳn · Q3 Nhóm sidebar / ẩn `lead-activities`, `click-events` · Q4 Icon menu · Q5 Ảnh đại diện cột thumbnail của `projects` · Q6 Mật độ bảng · Q7 Gộp/tách BL-016.

**Đã chốt (user 2026-10-19: "ok theo đề xuất"):**
- Q1: thẻ số liệu như §3.2 (admin: lead mới, lead chưa phân công, hồ sơ ứng tuyển mới, nội dung đang hiển thị; sale: lead mới giao cho mình, lead đang xử lý, bản nháp của mình, tin đang đăng). **Không** có số "so với hôm qua".
- Q2: (a) BL-015 T04 làm khung dashboard + thẻ đếm nhanh; L13-T01 sau này cắm biểu đồ/lượt bấm/chi phí dịch vào khung.
- Q3: duyệt 7 nhóm §2 như thiết kế, không ẩn mục nào (giữ `lead-activities`, `click-events` — quyền xem giữ nguyên như hiện tại). *(Không có đề xuất riêng → giữ nguyên thiết kế, thay đổi tối thiểu.)*
- Q4: không icon menu; icon chỉ trên dashboard.
- Q5: thumbnail `projects` = ảnh đầu `gallery` (nhất quán với `rentals`). *(Không có đề xuất riêng → chọn theo nhất quán.)*
- Q6: dòng bảng 48px.
- Q7: tách BL-016 như §8 — style select admin vào BL-015 T01.
- Song song: cho phép T01 ∥ T02 và T04 ∥ T05 (worktree riêng, DB test riêng).

## 8. Overlap BL-016 (`spec/changes/2026-10-19-select-dropdown-styling.md`)

BL-016 sửa `TranslationStatusFilter` sang `SelectInput` của Payload + Select TAMI cho site public. BL-015 T01 restyle react-select của Payload (viền `border-strong`, bo 6px, menu `shadow-md`, option hover `elevation-100`, chọn = `accent-soft`). Đề xuất **tách**: BL-016 giữ phần site public + đổi component `TranslationStatusFilter`; phần "style select field admin" của BL-016 **chuyển sang BL-015 T01** (một nguồn style). Thứ tự: BL-015 T01 trước, BL-016 phần admin sau (để `SelectInput` nhận style mới). Phần public của BL-016 độc lập, chạy song song được.

---

## 9. Phase/task plan đề xuất (chờ duyệt — chưa tạo file task)

Một phase (`tasks/feature-admin-ui-saas-refresh/phase-1-task-NN.md`), 6 task. Mọi task: không migration (kiểm `pnpm payload migrate:create --dry-run`/so `payload-types.ts` + schema không đổi), verify `pnpm lint · typecheck · test · build`, ảnh trước/sau sáng+tối 1440/390.

| Task | Nội dung | File đụng chính | Phụ thuộc | Review | Song song |
|---|---|---|---|---|---|
| **T01** Style chung + tokens | Token `--admin-*` sáng/tối, map `--theme-elevation-*`/radius/input/border; restyle nút, input, react-select (gộp phần "style select admin" của BL-016), card, bảng, tab, alert; restyle `TranslationFailedBanner`; test contrast tự động | `src/app/(payload)/custom.scss`, `src/components/admin/admin-tokens.ts` (+ `.test.ts`) | — | NORMAL (shared CSS toàn admin) | ∥ T02 |
| **T02** Việt hoá nhãn + test quét | `labels` 21 collection (+ redirects qua `overrides`), `label` ~489 field (ưu tiên field dùng chung trong `_shared`/`src/fields`), `labels`/`RowLabel` 13 array, `admin.description` collection; dùng lại `COLLECTION_LABELS`; test unit quét config: không field hiển thị nào thiếu label, mọi collection có `labels` | `src/collections/**`, `src/globals/**`, `src/fields/**`, `src/collections/_shared/content-defaults.ts`, `redirects-plugin.ts`, `tests/unit/admin-labels.test.ts` | — | NORMAL (nhiều file, không logic) | ∥ T01 |
| **T03** Sidebar nhóm | `admin.group` + sắp lại mảng `collections`/`globals` theo §2; ẩn mục theo Q3 | `src/payload.config.ts`, `src/collections/*.ts` (1 dòng/collection), globals | T02 (cùng file) | FAST/NORMAL | sau T02 |
| **T04** Dashboard | `views.dashboard.Component` server: thẻ đếm (`payload.count`, `overrideAccess:false`), lối tắt theo quyền `create`, lead mới nhất + bạn sửa gần đây, card nhóm; giữ banner dịch lỗi; test integration admin vs sale (sale không thấy thẻ/lối tắt collection không có quyền, số đếm đúng phạm vi) | `src/components/admin/dashboard/*`, `src/payload.config.ts`, `importMap.js` | T01, T03 | **STRICT** (phân quyền) | ∥ T05 |
| **T05** List view | `StatusBadge` + `status-tones.ts` (+ test mapping đủ mọi value), `ThumbnailCell`, rà `defaultColumns`, mô tả collection | `src/components/admin/StatusBadge.tsx`, `ThumbnailCell.tsx`, collections chính | T01, T02 (T03 nếu cùng file → làm sau T03) | NORMAL | ∥ T04 |
| **T06** Form layout | tab không tên/`row`/`collapsible` cho projects, rentals, property-posts, news, job-postings, services, leads, homepage, site-settings; sidebar phải; `RowLabel` | collections + globals chính, `src/components/admin/row-labels/*` | T02, T05 (cùng file) | **STRICT** (rủi ro đổi đường dẫn dữ liệu → phải chứng minh không migration + integration test lưu/đọc giữ nguyên) | cuối |

Thứ tự: **T01 ∥ T02 → T03 → T04 ∥ T05 → T06 → phase review** (spec-validator + ảnh trước/sau). Song song chỉ khi user cho phép (worktree riêng, theo memory "parallel independent tasks").

Spec delta (sau khi user duyệt design): thêm mục "Giao diện admin" vào `SPECIFICATIONS.md` (token AA sáng/tối, nhóm menu, nhãn tiếng Việt đầy đủ, dashboard theo quyền) → **MINOR** `1.10.0 → 1.11.0` + `spec/updates/2026-10-19-admin-ui-saas-refresh.md` + `spec/test-scope/current.json` (spec-publisher).
