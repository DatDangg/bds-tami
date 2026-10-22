# seed/english — dữ liệu tiếng Anh viết sẵn cho DB dev (BL-064)

Seed dev (`pnpm seed --sample`, `scripts/seed-scraped.ts`) chỉ tạo nội dung tiếng Việt. Thư mục này thêm bản **EN viết tay, cố định, commit trong repo** cho mọi bản ghi seed và global công khai, để `/en` có nội dung thật. Không gọi AI lúc seed.

- Chạy: `pnpm seed:english` (mọi nhóm) hoặc `pnpm seed:english projects news` (chỉ vài nhóm; nhóm = tên collection · `globals` · `media`). Tham số là **vị trí**, vì `payload run` nuốt cờ `--x`.
- Cũng chạy ở bước cuối của `pnpm seed --sample` và cuối `scripts/seed-scraped.ts`.
- **Chỉ DB dev** (spec BL-064): `checkSeedEnvironment` (`src/lib/rentals/sample-amenities.ts`) chặn `APP_ENV=production`, `NODE_ENV=production`, `DATABASE_URL` trùng `DATABASE_URL_STAGING`/`DATABASE_URL_PROD`; thêm chặn `APP_ENV=staging` và KHÔNG nhận `ALLOW_STAGING_SEED`. `pnpm seed:english` bị chặn → báo lỗi, exit 1; bước trong `pnpm seed --sample` / `seed-scraped` thì bỏ qua kèm log "bỏ qua: không phải DB dev" (không làm hỏng phần còn lại của seed).
- Idempotent: chạy lại cho kết quả y hệt, bản ghi đã khớp không bị ghi (không sinh version/revision rác), không nhân bản ghi.
- Chỉ ghi locale `en` (không bao giờ `vi`), kèm `context.translationJob = true` nên **không xếp job dịch AI** và không bị coi là "sửa tay".
- Bản ghi được bật `hasEnglish = true` khi bản EN đủ trường bắt buộc; `translation = { status: "done", enSource: "manual", sourceHash: <hash bản vi hiện tại> }` (`manual`: job dịch AI không bao giờ dịch đè). Trang pháp lý (`pages`) coi như EN đã duyệt (ghi kèm cờ duyệt `approveEnglish`).
- Slug EN **không** nằm trong dữ liệu: hook `slugField` sinh từ tiêu đề EN ở lần ghi đầu, các lần sau giữ nguyên.

## Tệp dữ liệu

`seed/english/data/<nhóm>.json`, thiếu tệp = nhóm đó bị bỏ qua (có log). Nhóm collection: `categories`, `developers`, `services`, `job-postings`, `pages`, `projects`, `rentals`, `property-posts`, `news`. Ngoài ra `globals.json`, `media.json`.

### Collection

```jsonc
{
  "<tên/tiêu đề vi của bản ghi, đúng như trong DB>": {
    "title": "Hand-written English title",
    "summary": "…",
    "overview": ["Text node 1 ", "text node 2", "Text node 3"],   // richText: MẢNG chuỗi (xem dưới)
    "amenities.0.name": "Swimming pool",                          // hàng của array: chỉ số hàng (bản vi) thay id
    "amenities.0.description": "…",
    "scale.handoverTime": "Q4 2027",                              // group: nối bằng dấu chấm
    "seo.metaTitle": "…"
  }
}
```

- Khoá bản ghi = `name` (`categories`, `developers`) hoặc `title` (còn lại) của bản `vi`, bản chưa xoá mềm. Nhiều bản ghi trùng tên (vd danh mục "Căn hộ chung cư" ở 2 scope) cùng nhận một mục dữ liệu.
- Khoá trường = đường dẫn trường nối bằng `.`; hàng của `array`/`blocks` viết bằng **chỉ số hàng 0-based của bản vi** (thứ tự hàng hiện tại). Hàng array dùng chung hai ngôn ngữ (id giữ nguyên) nên không tạo hàng mới, không mất hàng vi.
- Chỉ các trường chữ localized trong allowlist dịch (`src/lib/translation/leaves.ts` `TRANSLATABLE_FIELDS`: `text`/`textarea`/`richText`) mới có mặt. `slug`, `searchText`… không có.
- Mỗi mục chỉ cần liệt kê trường muốn ghi; trường không liệt kê giữ nguyên EN hiện tại. Mục có BẤT KỲ lỗi (khoá lạ, sai kiểu, richText lệch số ô chữ, chuỗi rỗng) → **bỏ cả bản ghi**, ghi cảnh báo, exit code 1; không ghi nửa vời.
- Khoá không có bản ghi vi (đã đổi tên/xoá) → cảnh báo `thiếu bản vi`, không lỗi.
- Trường EN bắt buộc để bật `hasEnglish` (`englishRequiredFields`; `slug` tự sinh): categories/developers `name` · services `title` `summary` `content` · job-postings `title` `description` `requirements` · pages `title` `content` · projects `title` `summary` `overview` · rentals `title` `description` · property-posts, news `title` `excerpt` `content`. Thiếu (tính trên EN hiện tại + dữ liệu sắp ghi, `slug` bỏ qua vì hook sinh) → bỏ cả bản ghi TRƯỚC khi ghi, không ghi gì + cảnh báo.

### richText (Lexical)

EN = **mảng chuỗi theo thứ tự các ô chữ (text node)** của cây `vi`, duyệt theo thứ tự tài liệu (kể cả chữ trong khối chèn của tin tức, `src/blocks/news/text-fields.ts`). Engine nhân bản cây `vi` rồi chỉ thay `text` từng ô nên heading/list/link/in đậm/ảnh giữ nguyên. Bản vi đã đổi làm số ô chữ lệch → bản ghi bị bỏ + cảnh báo (xuất lại bằng `seed:english:export`). Một đoạn có chữ đậm/link gồm nhiều ô liên tiếp: dịch từng ô, giữ khoảng trắng đầu/cuối ô.

### globals.json

Cùng định dạng nhưng khoá ngoài = slug global (`homepage`, `site-settings`, `header`, `footer`), khoá trong = đường dẫn trường như trên. Global không có `hasEnglish`.

### media.json

`{ "<alt vi>": "<alt en>" }` cho ảnh có alt không theo mẫu. Alt theo mẫu được **sinh tự động** (tiêu đề EN của dự án/cho thuê/tin BĐS/tin tức đã có EN): `<tiêu đề vi> - ảnh N` → `<tiêu đề EN> - photo N`, `- ảnh bổ sung N` → `- additional photo N`, `- ảnh bìa` → `- cover image`. Ảnh chưa suy ra được thì log `chưa có EN` (chạy lại sau khi có tiêu đề EN).

## Thêm dữ liệu cho một nhóm (quy trình)

1. Xuất bản vi ở đúng định dạng: `pnpm seed:english:export projects seed/english/data/projects.json` (hoặc `globals`). Thêm đối số cuối `missing` để chỉ xuất trường EN còn trống/còn tiếng Việt (bỏ bản ghi đã đủ). Chỉ đọc DB.
2. Thay chuỗi vi bằng chuỗi EN, **giữ nguyên khoá và độ dài mảng richText**. Có thể xoá trường không muốn ghi.
3. `pnpm seed:english projects` — đọc log `ghi N, không đổi N, thiếu bản vi N, lệch/lỗi N`; chạy lần 2 phải ra `ghi 0`.
4. Kiểm coverage (SQL dưới), xem `/en`.

### Quy tắc dịch

- Tiếng Anh tự nhiên, thuật ngữ BĐS chuẩn: căn hộ chung cư = apartment, nhà phố = townhouse, biệt thự = villa, khu đô thị = urban area, chủ đầu tư = developer, sổ hồng = pink book (land-use certificate), bàn giao = handover, pháp lý = legal status.
- **Giữ nguyên** tên riêng: dự án, thương hiệu, địa danh, tên người, tên đường (giữ nguyên dấu tiếng Việt trong tên riêng: "Phát Đạt Group", "Việt Úc"; tên tỉnh/thành theo bản hiện có; chỉ bỏ tiền tố loại hình như "Tập đoàn" khi tên đã có "Group"). "TAMI HOMES", "TAMI REAL ESTATE" luôn giữ.
- Giữ số, đơn vị, giá (VND, m², tỷ/triệu → "billion/million VND" nhất quán trong cả bản ghi).
- Công ty: "Công ty Cổ phần …" → "… JSC", "Công ty TNHH …" → "… Co., Ltd.", "Tập đoàn X Group" → "X Group" (không thêm "Corporation" thừa), "Tập đoàn X" → "X Group"/"X Corporation" tuỳ tên.
- Không để dấu tiếng Việt trong chữ thường của EN ngoài tên riêng (`export … missing` dùng đúng tiêu chí này để báo "còn tiếng Việt" nên cũng liệt kê tên riêng có dấu như "Phát Đạt Group" — bỏ qua các dòng đó).

## SQL đếm coverage (DB dev)

```sql
-- docker exec tami-postgres psql -U tami -d tami
select 'projects' c, count(*) filter (where has_english) en, count(*) total from projects where deleted_at is null
union all select 'rentals', count(*) filter (where has_english), count(*) from rentals where deleted_at is null
union all select 'property_posts', count(*) filter (where has_english), count(*) from property_posts where deleted_at is null
union all select 'news', count(*) filter (where has_english), count(*) from news where deleted_at is null
union all select 'services', count(*) filter (where has_english), count(*) from services where deleted_at is null
union all select 'job_postings', count(*) filter (where has_english), count(*) from job_postings where deleted_at is null
union all select 'categories', count(*) filter (where has_english), count(*) from categories where deleted_at is null
union all select 'developers', count(*) filter (where has_english), count(*) from developers where deleted_at is null
union all select 'pages', count(*) filter (where has_english), count(*) from pages where deleted_at is null;

-- ảnh có alt EN / tổng ảnh
select (select count(*) from media_locales where _locale = 'en' and coalesce(alt, '') <> '') as alt_en, (select count(*) from media) as media;
```

(Bản ghi đã xoá mềm (`deleted_at is not null`) nên loại khỏi cả hai vế khi đếm.)

## Cấu trúc code

- `format.ts` — định dạng dữ liệu, hàm thuần (khoá lá, ghép richText, so sánh, alt) · test `tests/unit/seed-english-format.test.ts`.
- `apply.ts` — áp dữ liệu vào collection/global bằng Local API (`overrideAccess`, locale `en`, context job).
- `media.ts` — alt EN của media. `export.ts` — xuất định dạng dữ liệu. `index.ts` — `runSeedEnglish` (đọc tệp, log, chặn môi trường không phải dev).
- Test tích hợp trên DB tạm với collection `projects` thật: `tests/integration/seed-english.test.ts`.
- Dựa trên `collectLeaves` / `buildEnglishWrite` của job dịch (`src/lib/translation/leaves.ts`) nên "trường nào dịch được" chỉ định nghĩa ở một nơi.
