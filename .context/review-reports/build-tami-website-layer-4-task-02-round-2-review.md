Agent: reviewer

# Review: build/tami-website, layer-4-task-02 (Globals site-settings / header / footer), round 2

- **Review level:** STRICT
- **Reason:** thêm migration (schema), quyền đọc theo từng field cho dữ liệu nội bộ, REST global công khai, cache dùng chung cho layout public, helper field dùng chung (`translation.ts`) mà các collection cũ cũng dùng.
- **Diff:** working tree so với HEAD `196c8ec` (tracked diff + untracked). Round 1 FAIL: MAJOR-1, MINOR-1..4.

## Blast radius
- REST `/api/globals/{site-settings,header,footer}` (khách / sale / admin), menu admin Payload.
- `src/fields/translation.ts`: `translationFields()` của các collection cũ (categories, developers…) gọi cùng `translationGroup()`. Lần này chỉ thêm `export`, thân hàm không đổi.
- `src/lib/content/get-globals.ts`: layout public của layer 5. Hiện chưa có file nào import.
- DB: migration mới `20261017_034248_globals_translation_group` thêm 6 enum, 21 cột nullable/có default, 6 index trên 3 bảng global.

## Verify commands + result (reviewer tự chạy)
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | exit 0, 68 file / 708 test PASS. Không có test skip: `globals.test.ts` chạy thật trên DB tạm |
| `pnpm build` | exit 0 |
| `pnpm payload migrate:status` | 9/9 Ran = Yes; `20261017_033508` batch 8, `20261017_034248` batch 9 |
| `git status --short` sau verify | 28 mục, giống lúc bắt đầu, không sinh file lạ |

Không chạy `migrate:create`, không db push/reset, không chạy `pnpm install` (diff không đụng `package.json`/lockfile).

## Kiểm tra các điểm round 1

**MAJOR-1: nhóm `translation` cho globals. ĐÃ ĐÓNG**
- `translationGroup()` được export (`src/fields/translation.ts:22`). Thân hàm không đổi, chỉ thêm `export` và sửa comment, nên schema và hành vi của collection cũ giữ nguyên. Bằng chứng: diff của file chỉ có 2 dòng đó; migration mới chỉ ALTER `site_settings`/`header`/`footer`; builder báo drift `migrate:create` không sinh file.
- Đã dùng ở `SiteSettings.ts:116`. Header và Footer có test bao phủ (`tests/integration/globals.test.ts:219-262`): admin ghi bị bỏ qua (status vẫn `none`), sale bị 403, khách POST bị 403, hệ thống (`overrideAccess`) ghi được, khách đọc được. Khớp PERMISSION §4 (`docs/PERMISSION.md:90`: "Chỉ đọc với tất cả (hệ thống ghi)").
- Migration `20261017_034248`: chỉ additive (CREATE TYPE, ADD COLUMN nullable/default, CREATE INDEX). `down` chỉ drop các đối tượng mới. Không destructive, không cần `HIGH_RISK_MIGRATION`. Migration cũ `20261017_033508` không bị sửa. `migrations/index.ts` đăng ký đúng thứ tự.
- Quyết định không thêm `hasEnglish` cho globals: chấp nhận. ERD §1.1 chỉ dùng `hasEnglish` làm cổng bật EN cho từng bài của collection. Header/footer/site-settings là khung layout, luôn render ở cả vi và en, nên cổng này không có nghĩa. Quyết định đã ghi vào as-built ERD §4.15 (`docs/ERD.md:513`) và comment code. Layer 4/5 vẫn cần xử lý fallback khi trường EN của global còn trống (xem Residual risk).
- `translation.lastError` công khai: PERMISSION §4 cho phép mọi người đọc `translation.*`. ERD §1.1 (`docs/ERD.md:49`) ràng buộc "không chứa nội dung bài". Hiện chưa có code nào ghi `lastError` (grep `src/` chỉ thấy định nghĩa field và payload-types). Diff này chưa lộ gì. Rủi ro nằm ở TranslationService sau này: nếu ghi nguyên văn lỗi của provider/SDK (stack, URL endpoint, request id, có thể kèm header hoặc khóa API), dữ liệu đó sẽ lộ qua REST public của cả collection lẫn global. Mức hiện tại: MINOR-A, gắn vào task TranslationService (layer 4).

**MINOR-1: `admin.hidden`. ĐÃ ĐÓNG**
`src/access/hideFromNonAdmin.ts:4` trả `user?.role !== "admin"`. Test `globals.test.ts:264-273` xác nhận admin → `false` (vẫn thấy), sale → `true`. `admin.hidden` chỉ ảnh hưởng UI/nav, không đụng access REST, nên không chặn admin và cũng không mở thêm quyền.

**MINOR-2: `server-only`. ĐÃ THÊM, còn rủi ro nhỏ (MINOR-B)**
- Gói `server-only` không có trong `node_modules` và `package.json`. Next 16.4.2 có alias nội bộ thật: `node_modules/next/dist/build/create-compiler-aliases.js:232-240` map `server-only$` sang `next/dist/compiled/server-only/{empty,index}` (thư mục có `empty.js`, `index.js`). Turbopack cũng có import map tương tự. Khi file được bundle qua `next build`, import được resolve lúc build, nên `next start` và image production (code đã bundle) không cần gói npm.
- Chưa được chứng minh: `pnpm build` PASS nhưng hiện chưa route nào import `get-globals.ts`, nên build chưa thực sự resolve import này. Bằng chứng thật chỉ có khi layer 5 dùng tới.
- Sẽ vỡ ngoài Next: bất kỳ runtime Node thuần nào import file này (vitest, `payload run <script>`, worker jobs chạy CLI) sẽ ném `Cannot find module 'server-only'`. Hiện chưa có chỗ nào như vậy (test dùng `read-global.ts`, đã tách riêng có chủ đích). Xem MINOR-B.

**MINOR-3: test biến thể REST. ĐÃ ĐÓNG**
`globals.test.ts:206-217` cho khách GET với `?locale=all|en`, `?depth=2|0`, 2 biến thể `?select[...]`, `?draft=true`. Mỗi ca kiểm tên khoá và giá trị nội bộ không xuất hiện trong JSON. Các test này chạy thật (không skip).

**MINOR-4: trim. ĐÃ ĐÓNG**
`src/hooks/trim-text.ts:4`: chỉ trim khi là string, giá trị khác trả nguyên. Trim là idempotent nên giá trị hợp lệ đã sạch giữ nguyên. Chạy ở `beforeValidate`, trước validate, nên giá trị lưu và giá trị được validate là một. Test `globals.test.ts:310-325` phủ zaloUrl, socialLinks[].url, navItems.link (khoá trang), ctaButton.link. `http:/x` vẫn được nhận như round 1 (không phải XSS). Chấp nhận.

## Regression
- Collection cũ: `translationFields()` vẫn trả `[hasEnglishField(), translationGroup()]` như trước. Toàn bộ 708 test PASS.
- `src/access/index.ts`: chỉ thêm 1 export.
- Không thấy regression.

## Responsive Checklist Gate
N/A. Diff không đụng route, component hay CSS (chỉ có config global Payload, hook, lib server và migration).

## Skill gates
| Gate | Kết quả |
|---|---|
| aislop | skip, `aislop` not installed (như round 1) |
| oxlint (anti-slop) | skip, oxlint not configured. ESLint + tsc PASS |
| ocr (open-code-review) | skip, ocr not installed |
| AI-readable | OK. Tên rõ (`translationGroup`, `hideFromNonAdmin`, `trimText`), hàm ngắn, comment nêu WHY. 0 indicator. ERD as-built đã cập nhật |
| ai-friendly-web | N/A (không đụng route public) |
| blitzstrike | skip, không có môi trường/không cài |

## Findings

### [MINOR-A] `translation.lastError` công khai qua REST: cần ràng buộc nội dung ở nơi ghi
- Định nghĩa field: `src/fields/translation.ts:41`. Hiện chưa có code ghi field này, nên diff không lộ gì.
- Cách xử lý: thêm vào AC của task TranslationService (layer 4) điều kiện "`lastError` chỉ lưu mã/nhãn lỗi đã làm sạch (vd `provider_timeout`, `quota_exceeded`, HTTP status), không lưu message thô, stack, URL, header hay khóa". Có thể kèm test. Nếu muốn chặn ngay ở schema, dùng field `access.read: isAdmin` cho `lastError`/`model`/`sourceHash` trong `translationGroup()`. Cách này áp cho cả collection và global, đổi hành vi so với PERMISSION §4 ("chỉ đọc với tất cả"), nên phải đi qua Change Request. Không chặn task này.

### [MINOR-B] `import "server-only"` dựa vào alias của Next, gói không có trong dependencies
- `src/lib/content/get-globals.ts:1`. Chạy đúng trong bundle Next (`create-compiler-aliases.js:232-240`). Import file này từ Node thuần (vitest, `payload run`, job CLI) sẽ ném `Cannot find module 'server-only'`.
- Cách xử lý: thêm `server-only` vào `dependencies` (gói rất nhỏ; Next vẫn ưu tiên alias của nó), hoặc ghi rõ trong comment đầu file rằng chỉ import file này từ code do Next bundle; job/script phải dùng `read-global.ts`. Không chặn task này.

Không có CRITICAL hay MAJOR.

## Residual risk
- Chưa có consumer nào của `get-globals.ts`, nên alias `server-only` và `revalidateTag` → làm mới layout SSG `/vi`, `/en` chưa được kiểm trong Next runtime thật. Layer 5 cần e2e: lưu header → trang public đổi, và build có import `get-globals`.
- Globals không có `hasEnglish`. Layer 5 hoặc TranslationService cần quy tắc fallback khi trường EN của global còn trống (vd `siteName` en). Localization fallback của Payload có thể đã xử lý, nhưng chưa có AC ghi rõ.
- Không có `pnpm install --frozen-lockfile` (diff không đổi deps).

## Verdict
✅ **PASS**. MAJOR-1 đã đóng (group `translation` trên cả 3 global, migration additive applied batch 9, test quyền đầy đủ, ERD as-built cập nhật). MINOR-1..4 của round 1 đã xử lý. Còn 2 MINOR không chặn (MINOR-A gắn vào task TranslationService, MINOR-B tùy chọn). Verify lint/typecheck/test/build/migrate:status đều PASS do reviewer tự chạy.
