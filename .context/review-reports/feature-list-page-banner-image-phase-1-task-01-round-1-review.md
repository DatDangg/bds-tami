Agent: reviewer

# Review — feature-list-page-banner-image · phase-1-task-01 · round 1

- Task: `tasks/feature-list-page-banner-image/phase-1-task-01.md` (BL-017, FR-ADM-20)
- Branch: `staging` (diff chưa commit)
- **Review level: STRICT**
- **Reason:** DB/schema/migration (`site_settings` thêm 6 cột + FK + index) và shared component (`PageBanner`, `CategoryListTemplate` dùng ở 5 trang danh sách + danh mục con).
- **Blast radius:** global `site-settings` (admin form, REST/GraphQL shape thêm `pageBanners`, `payload-types.ts`), bảng `site_settings` (migration), `PageBanner` biến thể Ảnh (scrim + màu mô tả; hiện chỉ các trang danh sách truyền `image`), trang `/du-an`, `/cho-thue` (+ danh mục), `/tin-bds` (+ danh mục), `/tin-tuc` (+ danh mục), `/tuyen-dung` (VI/EN), token CSS mới `--color-banner-scrim`. `--color-overlay` (hero, dialog, sheet) không đổi.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` (toàn bộ) | 256/257 file, 2674/2675 test PASS; 1 FAIL `tests/integration/media-upload.test.ts:145` (`GET /media/file/...` status ≠ 200) |
| `pnpm test tests/integration/media-upload.test.ts` (chạy lại riêng) | PASS 20/20 → lỗi flaky do tải song song (storage), file nằm ngoài diff, không liên quan task |
| `pnpm build` | skip: builder ghi dev server khác đang giữ `.next`; reviewer không chạy (residual) |
| `pnpm payload migrate` / `migrate:down` | reviewer không chạy DB (ngoài quyền). Đã kiểm SQL bằng cách đọc file: evidence up/down/up của builder trên DB dev nằm trong task file |

## Kiểm các điểm trọng tâm
- **Migration additive:** `migrations/20261019_082627_site_settings_page_banners.ts` up = 6 `ADD COLUMN ... uuid` (nullable), 6 FK → `media(id)` `ON DELETE set null`, 6 `CREATE INDEX`. Không DROP, không đổi type, không NOT NULL, không backfill → không phải HIGH_RISK. Down drop đúng 6 constraint, 6 index, 6 column theo đúng thứ tự (constraint → index → column). Snapshot `.json` có đủ 6 cột / 6 index / 6 FK (48 lần xuất hiện `page_banners`). `migrations/index.ts` thêm entry cuối, không sửa migration cũ. OK.
- **Schema:** `SiteSettings.ts` thêm tab "Ảnh banner" → group `pageBanners` (không `localized`), 6 `imageUpload` nhãn VI; không thêm access riêng → kế thừa global (khách đọc, admin sửa). `payload-types.ts` khớp. OK.
- **Fallback:** `resolvePageBanner` ảnh riêng → `default` → `undefined`; id chưa populate / media không url coi như không có. Unit test phủ 6 ca. OK.
- **Danh mục con dùng key cha:** Rental danh mục dùng lại `RentalListPage` (key `rentals`); News/Post danh mục dùng lại `NewsListPage`/`PostListPage` (key cố định `news`/`propertyPosts`). OK.
- **Lỗi đọc site-settings không 500:** `loadPageBanner` try/catch + `logger.warn` → `undefined` → biến thể Chữ. OK (chưa có test riêng, xem MINOR-2).
- **ISR/dynamic không đổi:** chỉ thêm 1 phần tử vào `Promise.all` sẵn có; `getSiteSettings` là `unstable_cache` (tag `global:site-settings`, 60 s); không thêm `cookies()`/`headers()`/`export const dynamic`. OK.
- **Scrim AA:** `--color-banner-scrim: rgb(10 12 16 / 0.6)` trên ảnh trắng → ≈ rgb(108,109,112), L ≈ 0.152 → chữ `#ffffff` ≈ 5.2:1 ≥ 4.5; mô tả đổi sang `text-on-dark` (#fff) vì `on-dark-muted` không đạt. `--color-overlay` vẫn 0.55 (test khoá). `bg-overlay` còn dùng ở HeroSlider/dialog/sheet không đổi. OK.
- **Ảnh priority / không CLS:** `ResponsiveImage priority sizes="100vw" decorative`, khung `h-[clamp(240px,42svh,440px)]` có sẵn. OK.
- **Không lẹm sang BL-020:** chiều cao banner, header trong suốt, băng tìm kiếm không đổi. OK.
- **Doc reconcile:** `docs/ERD.md` + `docs/ARCHITECTURE.md` thêm đoạn as-built đúng nội dung. OK.

## Responsive Checklist Gate (diff đụng UI: `PageBanner`, `globals.css`)
Không có browser; xác minh bằng đọc CSS. Phạm vi chỉ thay đổi trong diff (scrim + màu mô tả + việc các trang bắt đầu truyền ảnh).
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | Section `overflow-hidden`, ảnh `absolute inset-0`, nội dung `w-full max-w-container px-gutter`; diff không thêm chiều rộng cố định |
| Mobile-first / grid / container không fixed px | N/A | Diff không thêm media query/grid |
| Typography rem / heading fluid | OK | Dùng token sẵn có `text-h1`, `text-lead`; không thêm font-size px |
| Spacing theo scale | OK | `gap-4`, `px-gutter` sẵn có |
| Media max-width/aspect-ratio/srcset | OK | `ResponsiveImage` fill khung cao cố định, srcset từ cỡ đã sinh (`listCandidates`), `sizes="100vw"` |
| Touch target ≥ 44px | N/A | Không thêm phần tử tương tác |
| Nav / table mobile | N/A | Không đụng |
| Không dùng 100vh | OK | `42svh` trong `clamp()` |
| prefers-reduced-motion | N/A | Không có animation mới |
| Không che lỗi bằng overflow:hidden | OK | `overflow-hidden` có sẵn từ trước, chỉ để cắt ảnh nền |

Residual: chưa xem thật ở 375/768/1280 với ảnh thật; trên mobile banner ảnh 42svh (min 240px) đẩy nội dung xuống, đã ghi thuộc BL-020.

## Skill gates
| Gate | Kết quả |
|---|---|
| aislop | skip: không nằm trong verify commands được allow cho reviewer |
| oxlint (anti-slop) | skip, oxlint not configured (repo dùng eslint, `pnpm lint` PASS) |
| ocr (open-code-review) | skip, ocr not installed / không trong lệnh allow |
| AI-readable | OK: tên rõ (`resolvePageBanner`, `loadPageBanner`, `PageBannerKey`), hàm ngắn, indirection 2 bước, không magic number ngoài token CSS có comment lý do; docs as-built đã cập nhật. 0 indicator |
| ai-friendly-web | N/A: không đổi robots/sitemap/llms, chỉ đổi giao diện banner |
| blitzstrike | N/A: không phải auth/API public/input mới (field chỉ admin ghi) |

## Findings
**[CRITICAL]** không có.

**[MAJOR]** không có.

**[MINOR]**
1. `src/lib/content/page-banner.ts:11` — `usableImage` trả nguyên doc `media` đã populate rồi đưa vào `ResponsiveImage` (client component, `"use client"`), nên RSC payload chứa cả doc: `filename`, `mimeType`, `filesize`, `sizes.og`, `createdAt`... `uploadedBy` đã bị bỏ nhờ field access `isStaff` + `overrideAccess: false`, nên không lộ PII. Nhưng như vậy lệch với mẫu whitelist `toPublicImage` (url/alt/width/sizes) mà repo dùng cho client component (`post-view.ts`, `rental-view.ts`, `home-view.ts`). Đề xuất: map về `{ url, alt, width, sizes: { thumb, card, large } }` trong resolver (hoặc dùng lại `toPublicImage`).
2. `src/lib/content/load-page-banner.ts:14-19` — nhánh lỗi (getSiteSettings ném lỗi → `undefined` + `logger.warn`) là một tiêu chí nghiệm thu ("đọc lỗi → không 500") nhưng chưa có test: các test cấp trang mock luôn cả `loadPageBanner`. Đề xuất: thêm `load-page-banner.test.ts` mock `get-globals` reject → kết quả `undefined` và có gọi `logger.warn`.
3. `NewsListPage`/`PostListPage` chưa có test cấp trang cho banner (builder đã ghi lý do). Rủi ro thấp vì key bị kiểm kiểu qua union `PageBannerKey` và prop đi qua `CategoryListTemplate` đã có test ở 2 trang khác.
4. Xoá media đang làm banner: FK `SET NULL` ở DB, nhưng cache `global:site-settings` (60 s) có thể vẫn giữ URL cũ → ảnh vỡ tối đa ~60 s. Chấp nhận được với quyết định ERD (không chặn xoá). Chỉ ghi residual, không cần sửa.

## Residual risk
- `pnpm build` chưa chạy (builder lẫn reviewer); `lint` + `typecheck` + test đã phủ phần lớn.
- Migration up/down chỉ có evidence của builder trên DB dev; reviewer chỉ đọc SQL (additive, đúng).
- Responsive/contrast mới kiểm bằng tính toán, chưa chạy trình duyệt với ảnh thật.
- `tests/integration/media-upload.test.ts` flaky khi chạy toàn bộ song song (chạy riêng thì PASS), ngoài phạm vi task. Nên tách task riêng nếu còn lặp lại.
- Kết luận "lưu ảnh banner không xếp job dịch" của builder đến từ đọc code (`leaves.ts`), reviewer không kiểm lại bằng job thật.

## Verdict
✅ **PASS**: không có CRITICAL/MAJOR. Còn 4 MINOR, có thể làm sau hoặc gộp vào lần sửa kế tiếp.
