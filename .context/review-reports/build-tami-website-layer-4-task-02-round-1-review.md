Agent: reviewer

# Review: build/tami-website, layer-4-task-02 (Globals site-settings / header / footer), round 1

- **Review level:** STRICT
- **Reason:** schema + migration mới, field-level read access cho dữ liệu nội bộ (email nhận thông báo, glossary dịch), cache public (`unstable_cache` + `revalidateTag`) dùng chung cho layout mọi trang.
- **Diff:** working tree vs HEAD `196c8ec` (tracked diff + untracked listed in git status).

## Blast radius
- Global REST `/api/globals/{site-settings,header,footer}` (khách / sale / admin), trang admin Payload.
- `src/lib/content/get-globals.ts` → layout công khai vi/en (header/footer/nút nổi/GA), các task layer-5 dùng (`layer-5-task-02/05/06/07/08`, `layer-9-task-07`).
- Hook `pages` (task services-pages) sẽ ghi `privacyPolicyVersion`; TranslationService (layer 4) sẽ đọc `translationGlossary`/`translationEnabled` và ghi `translation.*`.
- DB: 17 bảng mới + 1 enum (migration `20261017_033508_globals_site_header_footer`).

## Verify commands + result (reviewer tự chạy)
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | exit 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm test` | 68 file / 695 test PASS (exit 0) |
| `pnpm build` | exit 0 |
| `pnpm payload migrate:status` | 8/8 migration Ran = Yes, `20261017_033508_globals_site_header_footer` batch 8 |
| `git status --short` sau verify | không sinh file lạ |

Không chạy `migrate:create` lại (không tạo migration vào repo), không db push/reset.

## Kiểm tra trọng tâm

**Rò rỉ trường nội bộ (`notificationEmails`, `translationGlossary`, `translationEnabled`)**
- REST khách/sale: field `access.read: isAdmin` + global `afterRead` `stripInternalFields` xoá khoá (`src/globals/SiteSettings.ts:29-33`). `GlobalAfterReadHook` của Payload 3.91 nhận `overrideAccess` (`node_modules/payload/dist/globals/config/types.d.ts:91-103`), nên đọc hệ thống vẫn thấy đủ. OK.
- `?locale=all`: hook xoá khoá ở cấp gốc nên không phụ thuộc locale. `?depth`: chỉ populate `media` (logo/favicon), không có trường nội bộ. `?draft`/versions: global không bật `versions` nên không có endpoint versions. `?select`: field access vẫn áp. Suy luận từ code, chưa có test (xem MINOR-3).
- GraphQL: `graphQL: { disable: true }` (`src/payload.config.ts:64`). OK.
- Sale trong admin: đọc với `overrideAccess: false` + user sale → field access ẩn. Có test (`tests/integration/globals.test.ts:123`).
- Cache `get-globals`: chỉ đọc qua `readPublicGlobal` (`overrideAccess: false`, không user, `src/lib/content/read-global.ts:13`); key `["global", slug, locale]` không phụ thuộc user nên không thể trả bản admin cho khách. OK.
- `payload-types` (`SiteSetting`) có kiểu của trường nội bộ nhưng chỉ import `type` (bị xoá khi compile), không lộ runtime.

**Revalidate / Next 16.4.2**
- `revalidateTag(tag: string, profile: string | CacheLifeConfig)` (`next/dist/server/web/spec-extension/revalidate.d.ts:13`) → `revalidateTag(tag, { expire: 0 })` đúng API. Payload lưu qua route handler `/api/[...slug]` nên gọi được ngoài server action.
- `unstable_cache(cb, keyParts, { tags, revalidate })` vẫn có ở Next 16.4.2 (`unstable-cache.d.ts:7`). Một tag cho mỗi global, key có locale nên phủ cả vi/en. Header/footer chỉ lấy từ `unstable_cache`, nên không cần `revalidatePath` layout. Layout `/[locale]` hiện là SSG (`● /vi`, `/en`), nên layer 5 vẫn phải để trang dùng được tag này (ghi ở residual risk).

**Kiểm tra URL** (`src/lib/content/nav-link.ts:30-45`, WHATWG `new URL`)
- `JAVASCRIPT:alert(1)` → protocol được chuyển thành chữ thường `javascript:` → chặn. Tab/newline chèn giữa (`java\tscript:`) bị parser bỏ đi → vẫn chặn. Khoảng trắng đầu/cuối: trim trước khi kiểm. `//evil.com` → `new URL` ném lỗi khi không có base → chặn. Đường dẫn tương đối `/x` → chặn. `http:/x` → **được nhận** (parser chuẩn hoá thành `http://x/`); không phải XSS, xem MINOR-4.
- `resolveNavLink` trả `null` khi khoá lạ hoặc protocol nguy hiểm. Đúng.

**Migration**: chỉ CREATE TYPE/TABLE/INDEX, FK đều trên bảng mới tạo; `down` chỉ DROP bảng/enum mới. Không destructive, không cần `HIGH_RISK_MIGRATION`. `geometry(Point)` cần PostGIS: image dev/staging/prod/CI đều là `postgis/postgis:17-3.5`, `docker/postgres/init.sql` tạo extension. OK.

**Các lựa chọn Builder tự quyết**: ctaButton group `{label localized, link}`, contactBlock textarea localized, socialLinks.platform select 8 giá trị (enum, nhãn dịch ở UI theo ERD §1.1), GA4 `^G-[A-Z0-9]{4,}$`, mapLocation `point`. Đều hợp lý và khớp ERD §1.1 (chữ localized; select/toạ độ dùng chung). Chấp nhận.

## Responsive Checklist Gate
N/A. Diff không đụng route, component hay CSS (chỉ có config Payload global, lib server-side và migration).

## Skill gates
| Gate | Kết quả |
|---|---|
| aislop | skip, `aislop` not installed |
| oxlint (anti-slop) | skip, oxlint not configured (không có `.oxlintrc.json`); ESLint + tsc PASS |
| ocr (open-code-review) | skip, ocr not installed |
| AI-readable | OK: tên rõ, hàm ngắn (dài nhất ~65 dòng là factory config khai báo, không phải logic), không magic number (`CACHE_SECONDS` có tên + lý do), comment giải thích WHY. 0 indicator |
| ai-friendly-web | N/A (không đụng route public) |
| blitzstrike | skip, không có môi trường/không cài |

## Findings

### [MAJOR-1] Ba global thiếu nhóm `translation` (ERD §1.1, PERMISSION §4, phần Description của task)
- `src/globals/SiteSettings.ts:57-113`, `src/globals/Header.ts:16-31`, `src/globals/Footer.ts:14-29`. Migration `migrations/20261017_033508_globals_site_header_footer.ts` cũng không có cột `translation_*`.
- ERD §1.1 (`docs/ERD.md:39`) ghi: group `translation` "đi kèm `hasEnglish` trên các collection trên **và các global `homepage`, `header`, `footer`, `site-settings`** (BR-08)". PERMISSION §4 (`docs/PERMISSION.md:90`) có quy tắc "Mọi nội dung + globals | `translation.*`". Phần Description của task (`tasks/tami-website/layer-4-task-02.md:29`) ghi "có bản EN và **nhóm `translation`**". Builder vẫn đánh dấu AC "Trường đúng ERD" là `[x]`, và ghi chú as-built ERD §4.15 không nhắc tới thiếu sót này.
- Hậu quả: TranslationService (layer 4) không có chỗ lưu `status/enSource/sourceHash/...` cho globals, nên phải thêm migration sau và mở lại task đã đóng.
- Cách sửa: thêm `translationGroup` của `src/fields/translation.ts` (đang private, chỉ export `translationFields()` gồm cả `hasEnglish`) vào cả 3 global. Có thể export riêng `translationGroup()`, hoặc dùng `translationFields()` nếu muốn có `hasEnglish` (ERD chỉ bắt buộc `hasEnglish` cho collection; ghi rõ quyết định vào ERD as-built). Sau đó chạy `pnpm payload migrate:create` để tạo migration mới. Migration chưa commit, chỉ mới apply trên dev; nếu muốn gộp vào migration hiện tại thì phải `migrate:down` batch 8 trên dev trước, không sửa tay file đã apply. Bổ sung test: khách/admin không sửa được `translation.*`, hệ thống (`overrideAccess`) ghi được. Cân nhắc có nên công khai `translation.lastError`/`model`/`sourceHash` qua global REST công khai không. Collection hiện cũng đang công khai các trường này, nên muốn chặn thì phải làm thống nhất ở `translation.ts`.

### [MINOR-1] Sale vẫn thấy 3 global trong admin nav, trong khi PERMISSION §3.2 ghi Sale = "—"
- `access.read: () => true` (`SiteSettings.ts:52`, `Header.ts:14`, `Footer.ts:12`). Không lộ thêm dữ liệu (sale chỉ thấy phần công khai, giống khách; update 403). Nhưng màn admin của sale có mục "Cấu hình chung/Menu/Chân trang" ở dạng chỉ đọc. Đề xuất: `admin: { hidden: ({ user }) => user?.role !== "admin" }`, hoặc ghi chú lệch vào PERMISSION §3.2 (code thắng thì phải cập nhật doc trong cùng task).

### [MINOR-2] `get-globals.ts` không có chặn import phía client
- `src/lib/content/get-globals.ts:1`. Đề xuất thêm `import "server-only";` để không ai import nhầm vào client component (kéo `@payload-config` vào bundle).

### [MINOR-3] Test chưa phủ các biến thể truy vấn REST
- `tests/integration/globals.test.ts:104-141`: chưa có ca khách `GET ?locale=all`, `?depth=2`, `?select[notificationEmails]=true`. Code hiện tại đúng theo phân tích ở trên, nhưng đây là ranh giới bảo mật nên nên có test để chống regression.

### [MINOR-4] Giá trị URL lưu nguyên văn, không chuẩn hoá
- `src/lib/content/nav-link.ts:41-43`, `src/globals/SiteSettings.ts:7-10`: validate trên bản đã trim nhưng lưu bản gốc (có khoảng trắng), và nhận dạng lệch như `http:/x`. Không gây XSS (browser chuẩn hoá giống `new URL`). Đề xuất `beforeValidate`/`beforeChange` để trim, hoặc lưu `new URL(v).href`, cho dữ liệu sạch.

## Residual risk
- Chưa chạy thật Next runtime để thấy `revalidateTag` làm mới layout SSG `/vi`, `/en`. Unit/integration chỉ kiểm hook có được gọi. Layer 5 cần test e2e: lưu header → trang công khai đổi trong ≤ 1 lần tải.
- Phân tích rò rỉ qua `?locale=all`/`?select` là suy luận từ code và kiểu Payload, chưa có test (MINOR-3).

## Verdict
❌ **FAIL**: 1 MAJOR (MAJOR-1: thiếu nhóm `translation` trên globals theo ERD §1.1 / PERMISSION §4 / phần Description của task). Phần field-level access, cache, revalidate và migration additive đều đạt. Builder sửa MAJOR-1 (kèm migration mới và test), các MINOR nên xử lý cùng lượt.
