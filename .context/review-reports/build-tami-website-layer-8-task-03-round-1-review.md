Agent: reviewer

# Review — build/tami-website · layer-8-task-03 · round 1

- Worktree: `D:\prj\bds-wt8-t03` (branch `wt/l8-t03`, base `ece17d8`, chưa commit)
- Task: `tasks/tami-website/layer-8-task-03.md` (S04 Danh sách Cho thuê + follow-up L7)

## Review level
**STRICT**

## Reason
Đổi hợp đồng API công khai (`GET /api/public/rentals`: thêm `available`, `ward` thiếu `province` → 400; `POST /api/public/job-applications`: thêm `code`), đổi helper dùng chung `fail()` / `usePublicForm`, SQL tìm kiếm có tham số mới, hook reindex trên provinces/wards/projects (chạy trong transaction admin), component dùng chung `RentalCard` (S04 + S07), test migration.

## Blast radius
- API: `/api/public/rentals` (schema `rentalSearchParamsSchema`, `rental-search-sql.ts`), `/api/public/job-applications`, envelope lỗi `fail()` (mọi endpoint, chỉ thêm khoá tuỳ chọn).
- Client: `usePublicForm` (mọi form công khai), `ApplyForm` (S13), `SimilarRentals` (S07), trang mới `/cho-thue` · `/en/for-rent`.
- Admin hooks: Provinces/Wards/Projects `afterChange` → `searchText` của rentals.
- Docs: `docs/API_SPEC.md` §2/§3.2/§3.3, `docs/ARCHITECTURE.md`.
- Không schema/migration mới.

## Verify commands + result (chạy trong worktree)
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` (toàn bộ, 1 lần) | PASS — 162 file / 1788 test |
| `pnpm test -- <23 file liên quan>` | PASS — 23 file / 309 test (log WARN `revalidatePath` ngoài ngữ cảnh Next là có sẵn, không phải lỗi) |
| `pnpm build` | PASS (exit 0); `/[locale]/cho-thue` cùng mẫu `force-dynamic` như `/du-an`, `/tuyen-dung`, `/tin-tuc` |

## Kiểm đặc biệt
- **SQL tham số hoá:** `wardCondition` (`rental-search-sql.ts:553-556`) đưa `ward`/`province` qua `${}`; `available` thêm hằng `r."status" = 'published'` (không có input người dùng); `categoryCondition` thêm `t."deleted_at" IS NULL`. Không nối chuỗi. OK.
- **`available` không lộ tin:** chỉ THU HẸP thêm trên `publicConditions` (vẫn `published|rented`, chưa xoá mềm, `en` cần `hasEnglish`); `false`/thiếu = hành vi cũ. Schema chỉ nhận `true|false|boolean`. OK.
- **`ward` → 400:** đổi hành vi có ghi API_SPEC §3.3 + as-built. Client nội bộ không vỡ: trang gọi `SearchService` trực tiếp sau `parseRentalFilters` (bỏ ward thiếu province) + `dropUnknownSlugs` (bỏ ward khi province lạ); Sheet đếm dùng cùng `parseRentalFilters`. Link chia sẻ cũ `/cho-thue?ward=x` không 400 (trang khoan dung). Không có client ngoài được ghi nhận. Chấp nhận.
- **job-applications `code`:** `postingClosed` vẫn giữ `details: []` nên JS cũ (dựa "400 không details") vẫn chạy → tương thích ngược với L7-T04. `usePublicForm` chỉ đi nhánh mới khi có `code`. Test endpoint + ApplyForm cập nhật. OK.
- **XSS / open redirect qua chip/link:** mọi href = `listPath` (nội bộ, `publicPath`) + `URLSearchParams` từ giá trị đã qua zod; nhãn chip lấy từ DB/i18n, React escape; `q` hiện qua `t(..., {query})` text node. Không có `dangerouslySetInnerHTML`, không href tuỳ ý. OK.
- **noindex/canonical:** gốc / 1 danh mục / 1 tỉnh (+page) index, canonical tự thân, không hreflang khi có lọc; tổ hợp sâu / đổi sort → `noindex, follow`, canonical về gốc sạch. Đúng AC. Ngoại lệ slug lạ → xem MINOR-1.
- **Reindex có ngưỡng 500:** log `{source, scope(id), rentals, limit}` — không PII. Rủi ro dữ liệu cũ: chỉ khi một tỉnh/phường/dự án có > 500 tin VÀ bị đổi tên; tỉnh trước task này hoàn toàn không có hook (không lùi), phường/dự án > 500 tin là bất thường ở quy mô hiện tại; có lệnh bù `pnpm reindex:rentals-search`. **Đánh giá: chấp nhận được, không cần migration + job ngay**, nhưng phải được theo dõi (MINOR-2).
- **RentalCard chung:** `searchCardToRentalCardData` chỉ map trường whitelist của DTO (thumbnail đã chọn ở SQL L7-T02); nhánh doc Payload vẫn qua `withCoverImages` quyền khách (`overrideAccess:false`, `select`), nay thêm `locale` + `fallbackLocale:false` và tối đa 3 ảnh ứng viên. Không lộ thêm dữ liệu. OK.
- **D2 tin tương tự ±30%:** có test tích hợp; fallback khi < 4. Xem MINOR-4.

## Responsive Checklist Gate (diff đụng UI; không có browser → kiểm bằng CSS/class)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang document | OK | Hàng chip `overflow-x-auto` cục bộ (`RentalListPage.tsx:116`), thanh dính `min-w-0 flex-1` + nút + sort `w-32` ≈ 343px khả dụng ở 375; builder đo `scrollWidth=375` trên build thật (chưa tự xác minh — residual) |
| Mobile-first min-width | OK | Tailwind `sm:/lg:/2xl:` (min-width) |
| Grid | OK | `sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4` theo breakpoint token của DESIGN.md (quy ước dự án, không phải cột px cố định) |
| Container không px cố định | OK | `max-w-container w-full px-gutter` |
| Font rem / heading fluid | OK | token `text-h3/h4/small` (design-tokens) |
| Spacing theo scale | OK | `gap-*`, `pb-section-tight` token |
| Ảnh max-width + aspect-ratio | OK | `aspect-[4/3] w-full overflow-hidden` + `ResponsiveImage` có `sizes` |
| srcset/sizes ảnh quan trọng | OK | `sizes=...`, `priority` cho thẻ đầu (LCP) |
| Video/embed | N/A | không có |
| Touch ≥ 44px | OK | `min-h-11` chip, link, nút; Button chuẩn |
| Nav mobile | OK | lọc < lg là thanh dính + Sheet (`lg:hidden` / `hidden lg:block`) |
| Table | N/A | không có |
| 100vh | OK | Sheet `h-[90svh]` |
| prefers-reduced-motion | OK (kế thừa) | Sheet là shadcn dùng chung; diff không thêm animation mới |
| Không che lỗi bằng overflow:hidden | OK | `overflow-hidden` chỉ ở khung ảnh |

## Skill gates
- aislop: **skip, aislop not installed**
- oxlint (anti-slop): **skip, oxlint not configured** (không có `.oxlintrc*`); ESLint PASS
- ocr (open-code-review): **skip, ocr not installed**
- AI-readable: **OK** — 1 indicator (hàm `RentalListPage` ~57 dòng); hằng số đã đặt tên (`SYNC_REINDEX_LIMIT`, `COVER_CANDIDATES`, `SIMILAR_PRICE_TOLERANCE`, `MAX_SUGGESTIONS`); ARCHITECTURE cập nhật lib/search, lib/rentals; < 3 indicators
- ai-friendly-web: **N/A** cho task này (robots/sitemap/llms thuộc L8-T05)
- blitzstrike: **skip, not installed / không có môi trường được phép**

## Rủi ro merge với staging (L8-T01 `7581ee1`, L8-T04 `ce01ba1`)
- File chồng nhau: `docs/ARCHITECTURE.md` (hunk 106/126 vs 184/343 — tách xa), `src/i18n/messages/{vi,en}.json` (T03 chèn quanh dòng 233, T04 quanh 210 — cách > 3 dòng context, khả năng merge sạch nhưng phải kiểm JSON hợp lệ sau rebase), `src/lib/content/resolve-missing-page.test.ts` (T04 chèn ở dòng ~95, T03 thêm cuối file — tách được).
- `resolve-missing-page.ts`, `news-queries.ts` chỉ đổi phía staging — không xung đột text.
- Test G27 "trang động thiếu rule": staging đã có `/tin-bds/[slug]` + `/tin-bds/danh-muc/[category]` trong `MISSING_PAGE_RULES` → sau khi gộp test vẫn xanh. Phải chạy lại `pnpm test` sau rebase (không chỉ tin kết quả worktree).
- Đổi tên `page.rentalDetail.similar.*` → `page.rentals.card.*`: T04 không đụng namespace rentals → không đụng.

## Findings

### CRITICAL
Không có.

### MAJOR
Không có.

### MINOR
1. **`src/components/rentals/RentalListPage.tsx:248-265`** — metadata tính `noindex` từ tham số THÔ (trước `dropUnknownSlugs`): `?province=bat-ky` / `?category=bat-ky` cho trang index, canonical tự thân, nhưng nội dung = danh sách không lọc → vô số URL index trùng nội dung trang gốc. Fix: chạy `dropUnknownSlugs` (hoặc tra slug) trong `buildRentalListMetadata`, slug lạ → canonical về gốc/noindex.
2. **`src/lib/search/reindex-in-hook.ts:18-28`** — phần "job nền tự bù" chỉ ghi trong task file này, chưa có task/backlog nào mang theo (grep `tasks/` chỉ ra chính L8-T03). Admin cũng không nhận phản hồi trên UI khi bị hoãn (chỉ log). Fix lúc close-out: đăng ký follow-up (task có migration enum `task_slug`) vào graph/backlog + gap register; cân nhắc trả cảnh báo cho admin.
3. **`src/lib/content/resolve-missing-page.test.ts` (block mới, `/[[a-z]+]/`)** — regex là lớp ký tự `[[a-z]` + `]` literal, đúng tình cờ; không bắt catch-all `[...slug]` hay tham số có `-`/hoa. Fix: `/\[(\.\.\.)?[A-Za-z0-9_-]+\]/`.
4. **`src/lib/rentals/rental-queries.ts:429-430`** — khi dải giá ra 1-3 tin, truy vấn fallback THAY THẾ hoàn toàn nên các tin khớp giá có thể bị đẩy ra. Đúng chữ D2 nhưng kém chất lượng gợi ý; đề xuất ưu tiên tin khớp giá rồi bù bằng tin cùng danh mục + tỉnh (loại trùng).
5. **`src/components/rentals/RentalListPage.tsx:95-152`** — hàm ~57 dòng (> 50). Tách phần nav chip loại hình thành component.
6. **`docs/ARCHITECTURE.md:89`** — cây `components/rentals/` chưa liệt kê component mới (RentalCard, RentalFilters, RentalFilterSheet, ActiveFilters, FilterFields, SortSelect, RentalListPage...).
7. **`src/lib/search/rental-search-sql.ts:553-554`** — nhánh `province === undefined` không còn đường tới qua API (schema chặn); giữ lại thì nên ghi rõ là chỉ cho code gọi trực tiếp, hoặc bỏ để không ngầm lọc ward theo slug toàn quốc.

## Residual risk
- Không chạy được browser: chưa tự xác minh `scrollWidth ≤ 375`, Sheet, focus `?q=`; dựa vào class + test RTL + ghi nhận kiểm tay của builder.
- Build hiển thị `●` cho `/[locale]/cho-thue` dù `force-dynamic`; cùng mẫu với `/du-an` đã chạy ở layer trước và builder kiểm build thật — rủi ro thấp.
- Dữ liệu `searchText` cũ khi đổi tên khu vực/dự án > 500 tin cho tới khi chạy lệnh bù (MINOR-2).
- Lệch nhãn tỉnh `name` (S04) vs `shortName` (S07) — builder đã ghi, cần đổi DTO, ngoài phạm vi.
- Cần chạy lại toàn bộ verify sau khi rebase lên staging (i18n JSON, test G27).

## Verdict
**PASS** — không có CRITICAL/MAJOR; 7 MINOR chuyển builder/close-out (ưu tiên MINOR-1, MINOR-2).
