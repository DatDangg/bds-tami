Agent: reviewer

# Review — feature-listing-detail-redesign · phase-1-task-04 · round 1

- Worktree: `D:\prj\bds\.claude\worktrees\agent-aa441cd64eabae529` (branch `worktree-agent-aa441cd64eabae529`, base 6fa7d26, chưa commit). `src/payload-types.ts` chỉ đổi EOL, bỏ qua.
- **Review level: STRICT**
- **Reason:** query công khai `/du-an` viết lại toàn bộ (bỏ đường SQL, luôn quét bộ nhớ), đổi chữ ký `ProjectPageQuery` (`provinceId` → `provinceIds`) và kiểu trả về (`ProjectListResult`), parse tham số URL mới, `ProjectCard` dùng chung (trang chủ, "Dự án tương tự", lưới), quy tắc công khai `/en`.
- **Blast radius:** `src/lib/projects/{project-filters,project-queries,project-view,project-price}.ts`; `ProjectListPage` (chỉ caller của `listPublicProjects`), `ProjectSortControl`, `ProjectCard` (lưới `/du-an`, `ProjectsSlider` trang chủ, SimilarProjects / thẻ chi tiết), `ProjectSpotlightContent` (mới, chưa gắn trang); i18n namespace `projectCard` (vi/en).

## Verify commands + result (chạy trong worktree)
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS — 0 error, 2 warning có sẵn ở `tools/task-dashboard/server.mjs` |
| `pnpm test src/lib/projects src/components/projects src/components/home src/i18n` | PASS — 27 file / 279 test |
| `pnpm test tests/integration/projects.test.ts tests/integration/homepage` | PASS — 3 file / 64 test (log revalidate ngoài Next là log có sẵn của test env, không fail) |

## Kiểm tra trọng tâm (STRICT)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Parse đa giá trị (`a,b` + khoá lặp), dedupe, trần 50 tỉnh, slug cũ một giá trị | OK | `project-filters.ts` `listValues` + `parseProjectFilters` (`provinceSlugs` sort + slice) |
| Giá trị lạ type/feature bị bỏ, thứ tự ổn định theo danh sách | OK | `pickKnown` theo `PROPERTY_TYPES`/`PROJECT_FEATURES` |
| Giá: chỉ chữ số, kẹp ≤ 50, min>max đổi chỗ, mép (0 / 50) không lên URL | OK | `parsePriceRange`, `projectQueryString` (priceMin>0, priceMax<50). `priceMax=0` giữ → rỗng (đã ghi Quyết định) |
| Serialize ổn định, `,` không mã hoá, không làm hỏng `q` chứa `%2C` | OK | `"%252C"` không chứa chuỗi `%2C` → `replaceAll` an toàn |
| `hasFilterParams` tính tham số mới → noindex | OK | single + multi lists |
| Facet "trừ chính chiều đó" mọi chiều (category/province/status/developer/type/feature), keyword + price luôn áp | OK | `computeFacets` dùng `matcher(predicates, except)`; unit test L159/L175 + integration "số đếm theo chiều" |
| Category theo cấp 1 (con tính vào cha), `all` = tab Tất cả | OK | `rootCategoryId` dùng `category.parent` (populate depth 1; repo không có `defaultPopulate` nên doc đầy đủ) |
| Danh sách tỉnh: chỉ tỉnh có ≥1 dự án công khai, sắp total giảm dần, hoà sortOrder | OK | `provinceFacets(scanned, …)` |
| Nổi bật ≤5, mới nhất trước bất kể sort, chỉ trang 1, loại khỏi lưới mọi trang | OK | `listPublicProjects` L517–526; unit L195/L210 |
| `totalDocs` gồm nổi bật; `totalPages` trên phần còn lại; notFound trang vượt | OK | `totalDocs: matched.length`; `ProjectListPage` `page > 1 && page > totalPages`; empty state theo `totalDocs` |
| Giá hiệu lực: min priceTable >0 trước, fallback priceFromVnd >0, null | OK | `project-price.ts` khớp SPECIFICATIONS Quyết định 6 |
| Sort giá null cuối cả asc/desc | OK | `compareByPrice` + unit L90/L95 |
| Quy tắc công khai `/en` (hasEnglish) | OK | cả scan và `cardsByIds` đều qua `findPublicList` |
| Quét ≤1000 + cảnh báo trần | OK | `SCAN_MAX_PAGES=20 × 50`, `logger.warn` giữ |
| Trang chủ giữ thẻ cũ | OK | `ProjectsSlider` truyền `variant="home"`; markup home = CardFooter + CardPin như BL-045; test biến thể |
| ProjectListPage tạm vẫn đúng | OK | nổi bật đặt đầu lưới trang 1 (không mất dự án), carry params mới qua chip/sort/pagination |
| A11y thẻ: cả thẻ một link, không lồng link, không tim, token | OK | `ProjectCard` một `<Link>`; "+n" có sr-only; Spotlight hai link riêng không lồng, có sr-only tên dự án; token có trong `globals.css` |

## Responsive Checklist Gate (diff đụng UI: ProjectCard, ProjectSpotlightContent)
Không có browser cho reviewer → xác minh bằng CSS/markup; builder báo 375px không tràn ngang (dev `-p 3104`).
- Layout không tràn ngang: OK — `min-w-0` + `truncate` ở giá/địa chỉ, tag `flex-wrap`; lưới `/du-an` không đổi (ngoài scope).
- Mobile-first: OK — `sm:` min-width (`p-4 sm:p-5`, `dl grid-cols-2 sm:grid-cols-3`).
- Grid auto-fit/minmax: OK (theo quy ước Tailwind breakpoint của repo; `dl` tối đa 3 ô ngắn, 2 cột ở 375 vừa).
- Typography rem/clamp: OK — `text-xsmall` (0.75rem), `text-h3` clamp, `text-body`/`text-small` token.
- Media: OK — dùng `ResponsiveImage` + `aspect-[11/10]` sẵn có, `sizes` giữ.
- Touch target ≥44px: OK — cả thẻ là link; Spotlight dùng `buttonVariants` sẵn có.
- Nav / table: N/A.
- 100vh / reduced-motion / overflow-hidden che lỗi: N/A / không thêm animation mới (`overflow-hidden` ở khung ảnh có sẵn để zoom).

## Skill gates
- aislop: skip, `aislop` không cài trong môi trường.
- oxlint (anti-slop): skip, oxlint not configured (không có `.oxlintrc*`); eslint 0 error.
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK — 1 indicator (file `project-queries.ts` 414 dòng > 300); hàm mới ≤ 50 dòng, không magic number (hằng có tên + JSDoc), không indirection sâu. <3 → không FAIL.
- ai-friendly-web: N/A (không đổi robots/sitemap/llms; noindex tham số giữ).
- blitzstrike: skip, không cài / không môi trường được phép. Input URL đã được whitelist/regex/kẹp, không SQL (lọc bộ nhớ), id lạ bỏ qua.

## Findings
**CRITICAL:** không có.
**MAJOR:** không có.

**[MINOR] m1 — `src/lib/projects/project-queries.ts` 414 dòng (> 300; base 249).** Đề xuất: tách phần lọc/đếm thuần (`buildPredicates`, `matcher`, `countBy`, `provinceFacets`, `computeFacets`, `rootCategoryId`, types `FacetCounts`/`ProjectFacets`) sang `src/lib/projects/project-list-facets.ts` (không phụ thuộc Payload, test dễ hơn).

**[MINOR] m2 — Hiệu năng: `scanPublicProjects` luôn chạy cho mọi request `/du-an`, kể cả trang sạch (trước là 1 truy vấn SQL phân trang), `depth: 1` populate ĐẦY ĐỦ `developer` + `category` + `province` + `ward` cho mỗi dự án (project-queries.ts `PROJECT_SCAN_FIELDS` ~L332–345, scan ~L382).** Chấp nhận được với ~61 dự án (2 truy vấn), nhưng chưa đo p95 ≤ 500ms. Đề xuất (không chặn): dùng `populate: { developers: { id: true }, categories: { id/parent/slug } … }` để giảm payload, và ghi số đo p95 ở P1-T05.

**[MINOR] m3 — Spec lệch nhau về thứ tự giá:** `spec/updates/2026-10-21-listing-detail-redesign.md:17` ghi "`priceFromVnd` > 0, không thì min `priceTable`", trong khi dòng 38 của cùng file và `SPECIFICATIONS.md:42` (Quyết định 6) ghi priceTable trước. Code theo Quyết định 6 (đúng). Không thuộc diff task — đề xuất primary/spec-publisher sửa dòng 17 cho khớp.

**[MINOR] m4 — `?priceMin=0` / `?type=xyz` (giá trị bị bỏ khi parse) vẫn bật noindex (`hasFilterParams`).** Hành vi bảo thủ, canonical vẫn về trang sạch; chỉ ghi nhận, không cần sửa.

## Residual risk
- Chưa đo p95 thực (m2). Responsive xác minh bằng CSS math + báo cáo builder, chưa tự xem 375/768/1280. `ProjectSpotlightContent` chưa gắn trang (P1-T05 ghép) nên layout thực tế chưa kiểm. Không chạy toàn bộ `pnpm test` (chỉ phạm vi được giao).

## Verdict
✅ **PASS** — không có CRITICAL/MAJOR; 4 MINOR (m1 nên xử lý ở task kế/close-out, m3 chuyển spec-publisher).
