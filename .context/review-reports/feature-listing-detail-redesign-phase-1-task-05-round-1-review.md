Agent: reviewer

# Review — feature-listing-detail-redesign · phase-1-task-05 · round 1

- Worktree: `D:\prj\bds\.claude\worktrees\agent-a637a4b9ec6b8f842` (branch `worktree-agent-a637a4b9ec6b8f842`, base 73543c7, chưa commit)
- Task: `tasks/feature-listing-detail-redesign/phase-1-task-05.md` · Spec 1.46.0 BL-052 "Trang danh sách (khung chung)", "`/du-an`" · Design `docs/specs/listing-detail-redesign/list-du-an.webp`
- `payload-types.ts` / `importMap.js`: chỉ đổi EOL, bỏ qua.

## Review level
**STRICT**

## Reason
Trang công khai chính (SEO canonical/noindex, JSON-LD), tham số URL dùng chung (`listingHref` trong `src/components/listing/*` cũng dùng cho Cho thuê ở P2), hook dùng chung `useListingFilterNav` + `RangeSliderFacet`, query dùng chung `findPublicList` (option `populate` mới), refactor `project-queries.ts` (facet / predicate), đổi helper giá của trang chi tiết dự án.

## Blast radius
- `/du-an`, `/en/projects` (page + metadata).
- `src/components/listing/listing-params.ts` (`listingHref` — mọi trang danh sách dùng hook lọc), `use-listing-filter-nav.ts` (thêm `generation`, additive), `RangeSliderFacet.tsx` (commit ngay khi thả con trỏ).
- `src/lib/content/public-queries.ts` (`populate` tuỳ chọn, chỉ spread khi truyền — nơi khác không đổi hành vi).
- `src/lib/projects/project-queries.ts` (scan + card populate thu hẹp; `findOtherProjects` của trang chi tiết dùng `PROJECT_CARD_POPULATE`), `project-list-facets.ts` (mới, di chuyển nguyên văn).
- `src/lib/projects/project-detail-view.ts` (`displayPriceFromVnd` → `effectivePriceFromVnd`).
- Xoá `ProjectFilters.tsx` (Grep: không còn import nào trong `src`).

## Verify commands + result (chạy trong worktree, DB `tami_wt52_p1t05`)
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS — 0 error, 2 warning có sẵn ở `tools/task-dashboard/server.mjs` (ngoài diff) |
| `vitest run src/components/projects src/components/listing src/lib/projects src/lib/content src/i18n` | PASS — 39 file / 381 test |
| `vitest run tests/integration/projects.test.ts` | PASS — 36 test (log revalidate Next ngoài request scope là nhiễu có sẵn, không fail) |
| `pnpm build` | PASS (exit 0) |

## Kiểm theo trọng tâm
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Khớp design (hero + Tìm nhanh, tab icon + số, sidebar đủ nhóm, nổi bật slider, "N dự án phù hợp" + sắp xếp, lưới 3 cột ≥ lg, phân trang, Tìm hiểu thêm + FAQ, dải lợi ích, banner) | OK | `ProjectListPage.tsx:154-218`, `ProjectListBody.tsx:49-106,136-158`; grid `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (:199); so ảnh `list-du-an.webp`. Không có tim. |
| Số đếm "trừ chính chiều đó" | OK | `project-list-facets.ts:166-177` (di chuyển nguyên văn từ `project-queries.ts`, đối chiếu diff từng dòng) |
| Mọi lọc qua searchParams; form GET không JS; khoá lặp | OK | test `HTML server: form GET…` (ProjectListPage.test.tsx:256); `hasFilterParams` dùng `listValues` cho province/type/feature |
| Hook gọi 1 lần + reset/generation (n1–n3) | OK | `ProjectListBody.tsx:137-138` (một hook, `key={generation}`, `onClear={reset}` cả Sidebar + Sheet); `use-listing-filter-nav.ts` `setGeneration`; `RangeSliderFacet.tsx` `fromPointer`; test `listing-filter-reset.test.tsx:55,68,91` |
| canonical/noindex + FAQ JSON-LD chỉ trang sạch | OK | `ProjectListPage.tsx:139,214,226-244`; test :158, :278, :286 |
| `?category=` đánh dấu tab (cả cấp 2 → tab cha) | OK | `loadCategoryContext` :57-64, `buildTabs` :80-94; test :199, :206 |
| EN đủ nhãn | OK | vi/en thêm cùng bộ key cuối `page.projects`; test :239 |
| `project-list-facets.ts` + populate hẹp + `findPublicList` populate | OK | `public-queries.ts:89` chỉ spread khi có; scan populate đủ trường cho predicate/facet (tỉnh slug/name/shortName/sortOrder, phường name, danh mục parent); card populate đủ cho `provinceLabel` + `visibleCategory` (slug/name/hasEnglish); integration PASS |
| Helper giá duy nhất | OK | `projectPriceFromVnd` xoá, `project-detail-view.ts:311` dùng `effectivePriceFromVnd`; test giữ nguyên kỳ vọng (:196-202) |
| File xoá ProjectFilters | OK | Grep `ProjectFilters` trong `src`: không còn import |
| listing-params comma không mã hoá an toàn | OK | `replaceAll("%2C", ",")` chạy sau `URLSearchParams.toString()`: `%` literal thành `%25` nên `%2C` gốc của người dùng thành `%252C`, không bị đổi; `q=a,b` đọc lại vẫn là một giá trị (test thêm) |

## Responsive Checklist Gate (375 / 768 / 1280)
Không có browser trong quyền reviewer → xác minh bằng CSS math + evidence builder (task §Verification: 375 `scrollWidth = 375`, 768 EN 2 cột, 1440 khớp design).
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không tràn ngang | OK | Thân: `grid w-full max-w-container px-gutter` 1 cột < lg; cột phải `min-w-0`; evidence builder 375 |
| Mobile-first / min-width | OK | `md:` / `lg:` / `xl:` (min-width) ở `ProjectListBody.tsx:140`, `ProjectListPage.tsx:199` |
| Grid không cột cố định px | OK | 1/2/3 cột theo breakpoint; cột lọc `16rem`/`17.5rem` (rem) + `minmax(0,1fr)` chỉ ≥ lg |
| Container không fixed px | OK | `max-w-container` token |
| Font rem / heading fluid | N/A | Không thêm style chữ mới (dùng token `text-small` có sẵn) |
| Media max-width / sizes | OK | `GRID_CARD_SIZES` theo cột lọc (:71); LCP = ảnh hero; `priority` thẻ đầu chỉ khi không hero ảnh + không nổi bật |
| Touch target ≥ 44px | OK (kế thừa) | Ô lọc / chip / Sheet là component P1-T02 đã review; diff không đổi kích thước |
| Nav/bộ lọc mobile | OK | < lg nút "Bộ lọc" + badge mở `FilterSheet` (:150) |
| Table scroll | N/A | Không có bảng |
| 100vh / reduced-motion / overflow:hidden | N/A | Diff không thêm |

## Skill gates
- aislop: `skip, aislop not installed` (không có trong PATH).
- oxlint (anti-slop): `skip, oxlint not configured` (không có `.oxlintrc.json`); ESLint PASS 0 error.
- ocr (open-code-review): `skip, ocr not installed`.
- AI-readable: OK — 1 indicator (hàm `ProjectListPage` ~113 dòng, chủ yếu JSX lắp ráp); < 3 → không FAIL. Comment chủ yếu WHY; tên rõ.
- ai-friendly-web: N/A — không đổi robots/sitemap/llms; metadata giữ canonical/noindex đúng.
- blitzstrike: skip — không có môi trường được phép; input chỉ là searchParams đã whitelist/đối chiếu (slug tỉnh, id chủ đầu tư phải có trong danh sách; không SQL thô — lọc ở bộ nhớ).

## Findings
### [CRITICAL]
Không có.

### [MAJOR]
Không có.

### [MINOR]
1. **Icon tab shophouse đoán sai** — `src/components/projects/project-category-icon.ts:11,14`: nhóm `HouseLine` có từ khoá `"house"` đứng TRƯỚC nhóm `Storefront`, nên slug `shophouse` (và `shophouses`) khớp `"house"` → icon nhà phố thay vì `Storefront`; nhóm Storefront không bao giờ đạt được với slug chứa "shophouse". Tương tự `"land"` khớp cả `island`/`highland`. Fix: đưa nhóm `shophouse` lên trước nhóm nhà phố (hoặc so theo từng đoạn slug tách `-`), thêm case `shophouse` vào `project-category-icon.test.ts`.
2. **Hàm `ProjectListPage` ~113 dòng** — `src/components/projects/ProjectListPage.tsx:107-220` vượt ngưỡng 50 dòng/hàm. Phần lớn là JSX lắp ráp nên chấp nhận được; có thể tách `buildResults(...)` (EmptyState / lưới / phân trang :189-211) và phần dựng `spotlight`/`sort` thành helper nhỏ nếu sửa tiếp.
3. **Key i18n cũ bỏ ngỏ** — `page.projects.sortLabel`, `chips.*` (vi/en :310-317) không còn ai dùng sau khi xoá `ProjectFilters` / đổi sang `sortBy` (builder ghi rõ giữ để tránh xung đột merge). Đề xuất dọn ở task close-out phase.

## Residual risk
- Không tự chạy browser: so ảnh 1440 / 390, VI + EN, không JS dựa trên evidence builder (task §Verification) + test `renderToString`.
- Đo p95 chỉ có số "sau" (không baseline cùng máy); số đo đều ≪ ngân sách 500ms.
- Back/forward trong cửa sổ ≤ 300ms khi bàn phím thanh trượt đang chờ commit vẫn có thể bắn commit cũ (builder ghi nhận, chấp nhận đánh đổi để không mất focus).

## Verdict
✅ **PASS** — không CRITICAL/MAJOR; 3 MINOR có thể xử lý trong task kế tiếp hoặc close-out.
