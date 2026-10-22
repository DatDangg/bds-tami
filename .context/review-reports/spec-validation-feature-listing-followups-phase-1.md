Agent: spec-validator

# Spec Validation — feature/listing-followups (BL-055) · phase 1 · round 1 (phase review)

**Entry Mode:** full_docs (change doc + SPECIFICATIONS 1.50.0 + spec update + CHANGELOG + test-scope v66 + task T01–T03 + review r1 + code)
**Sources validated against:** `spec/changes/2026-10-22-listing-followups.md`, `SPECIFICATIONS.md:9,45,48,59-60` (diff working tree vs HEAD), `spec/updates/2026-10-22-listing-followups.md`, `spec/CHANGELOG.md:72`, `spec/test-scope/current.json` (v66), `tasks/feature-listing-followups/phase-1-task-0{1,2,3}.md`, `.context/review-reports/feature-listing-followups-phase-1-task-0{1,2,3}-round-1-review.md`, `docs/API_SPEC.md:208,216,234`, code `src/lib/content/legacy-category.ts`, `src/components/posts/PostListPage.tsx:129-141`, `src/components/rentals/RentalListPage.tsx:85-101`, `src/lib/projects/project-filters.ts:95-108`, `src/lib/backfill/property-posts.ts`, `vitest.config.ts:38-40`, `tests/integration/rental-search.test.ts:704-714`; git `33bdce6`, `e0a61b3`, `0cb9434`.

## Verdict: ✅ COMPLETE (PASS)

Không có ❌, không HIGH conflict, 0 ⚠️ ở mức requirement. Chỉ còn gap nhỏ loại (b) (ghi chú "chưa commit" đã lỗi thời trong 3 artifact spec) và follow-up (c) không chặn.

## Coverage Matrix (requirement ↔ task ↔ implementation ↔ spec)

| # | Requirement (change doc) | Task | Implementation / evidence | Spec 1.50.0 | Status |
|---|---|---|---|---|---|
| 1 | C-1: 308 `?category=<slug>` ở `/tin-bds` + `/cho-thue` **chỉ khi URL chỉ có `category`**, slug thật ở locale; slug lạ / kèm tham số giữ hành vi | T01 | `legacy-category.ts:17-23` (giá trị đầu, trim, ≤100, khoá khác rỗng không tính); `PostListPage.tsx:136` `!categorySlug && context && legacyCategoryOnly → permanentRedirect(postCategoryHref)`; `RentalListPage.tsx:86-92,96` `findRentalCategory` có thật → `permanentRedirect(categoryPath)`; route danh mục bỏ qua (`categorySlug ? null`). Test: `legacy-category.test.ts` 4 case, `PostListPage.test.tsx` / `RentalListPage.test.tsx` vi+en; curl dev 308/200 (T01 §Verification, review r1 bảng curl) | `SPECIFICATIONS.md:45` (`/cho-thue`) + `:48` (`/tin-bds`, noindex+canonical chỉ còn khi kèm tham số) + `:59`; API_SPEC `:216`, `:234` | ✅ |
| 2 | C-1 en path | T01 | `publicPath(..., locale)` theo `routing.ts`; unit test `/en/property-news/category/voucher`, `/en/for-rent/category/can-ho` | `:45`, `:48` ghi đúng `/en/for-rent/category/<slug>` · `/en/property-news/category/<slug>` | ✅ (308 thật ở `/en` chỉ unit test — residual đã ghi ở spec update + test-scope `verification.note`) |
| 3 | C-4: `/du-an` `priceMax=0` / `areaMax=0` = không giới hạn | T01 | `project-filters.ts:102` `parseBillion(rawMax) \|\| undefined`; `areaMax` **không tồn tại** trong `RawProjectParams` (`:9-24`) → chỉ áp `priceMax`; test 3 case | `:59` chỉ nói `priceMax=0` (đúng); spec update `:13` ghi rõ "`areaMax` ở `/du-an` không có tham số riêng — không đổi"; API_SPEC `:208` chỉ `priceMax`. `:48` `areaMax=0` là của `/tin-bds` (đúng, `post-filters.ts`) | ✅ không nói sai |
| 4 | C-5: đo EXPLAIN ANALYZE → đáng thì index; + ca `locale=en` số đếm tiện ích | T02 | Bảng đo 100k tin / 274.764 dòng amenities, 2 index thử, planner không dùng (326→339/330 ms; province 31 ms) → **không index**, dọn bench (T02 §C-5); test EN `rental-search.test.ts:704-714`; `git diff 16931d3..HEAD --stat -- migrations/` rỗng | `:59` (số đo + lý do), `:60` (test EN); spec update `:15`; test-scope `specRefNotes.C-5` | ✅ |
| 5 | C-6: GIST chỉ khi có lọc bản đồ | T02 | Grep `ST_DWithin\|radius\|bbox\|ST_Within` = 0 → bỏ qua, lý do ghi T02 §C-6 | `:59` "bỏ qua (chưa có lọc bản đồ / bán kính)" | ✅ |
| 6 | C-7: integration timeout `beforeAll` | T02 | `vitest.config.ts:40` `hookTimeout: 60_000` chỉ project `integration`; `pnpm test` ×2 419 file không timeout (T02 bảng verify) | `:60` "hookTimeout 60 s" | ✅ |
| 7 | C-8: gom `isOfferPost` → `hasPostOffer` | T02 | `property-posts.ts:4,48` dùng `hasPostOffer`; `isOfferPost` không còn; `PropertyPostSource.offer: PropertyPost["offer"]`; test ca `endAt` rác không skip | `:60` ghi rõ thay đổi hành vi có chủ ý (endAt không parse được không còn bị bỏ qua); `:57` (as-built BL-052 "bỏ qua mọi tin có ưu đãi") vẫn đúng vì định nghĩa "ưu đãi" nay = `hasPostOffer` | ✅ |
| 8 | Đo LCP bản build 6 trang | T03 | 6 trang × 1440/390 × 2 cách đo, max 420 ms, element hero `priority`/`fetchpriority=high` (`ResponsiveImage.tsx:87-89`); không đổi code; commit `0cb9434` | `:59` "≤ 420 ms … không follow-up"; spec update `:19` | ✅ |
| 9 | Intent docs không bị sửa; SPEC chỉ đổi khối as-built | — | `git diff 16931d3..HEAD --stat -- docs/BRD.md docs/PRD.md docs/USER_FLOW.md` rỗng; `git diff -U0 SPECIFICATIONS.md` chỉ hunk `:9` (version), `:45`, `:48`, `:59-60` (khối as-built BL-052/BL-055) | — | ✅ |
| 10 | test-scope v66 specRefs / impact / acceptance | — | `specRefs` trỏ `:45`, `:48`, `:43+:59`, `:59`, `:60`, NFR-01 — đúng dòng; `impact.direct` HTTP matrix khớp curl T01; `acceptance` 11 mục = acceptance T01+T02+T03; `migration: "không"` | — | ✅ |
| 11 | Verify tự chạy | — | `pnpm typecheck` PASS · `npx eslint` 14 file scope (10 T01 + 4 T02) exit 0 · `pnpm vitest run` 5 file scope: **5 file / 101 test PASS** (10,4 s) | — | ✅ |

## Cross-Document Conflicts

| Conflict | Source A | Source B | Impact |
|---|---|---|---|
| Trạng thái commit T03 | `spec/updates/…listing-followups.md:5` + `spec/CHANGELOG.md:72` + `spec/test-scope/current.json` `status`/`statusNote`/`reviewResults[2]`/`verification.note`: "T03 … chưa commit" | `git log`: T03 đã commit `0cb9434` trên `staging` | LOW — artifact spec viết trước khi primary commit T03; cần cập nhật SHA trước khi commit spec (spec files hiện còn dirty trong working tree) |
| Câu "link cũ `?category=` lọc + đánh dấu tab, canonical" | `docs/DESIGN.md:241,243`, `.context/design-spec.md:236` (as-built UI) | `SPECIFICATIONS.md:45,48` + API_SPEC (308 khi chỉ có `category`) | LOW — câu vẫn đúng cho URL kèm tham số; builder + reviewer chốt `no doc impact`. Không phải mâu thuẫn requirement, chỉ thiếu ghi chú "BL-055: URL chỉ có `category` → 308" ở 2 file mô tả màn hình |

Không có HIGH conflict.

## Gaps

### (a) Code cần sửa
Không có.

### (b) As-built cần ghi vào spec / artifact
- **[PARTIAL]** Ghi chú lỗi thời "T03 chưa commit" ở `spec/updates/2026-10-22-listing-followups.md:5`, `spec/CHANGELOG.md:72`, `spec/test-scope/current.json` (`status`, `statusNote`, `reviewResults[2]`, `verification.note`) → cập nhật `0cb9434` khi primary close-out (spec files chưa commit nên sửa được trước commit; không cần bump version).
- **[PARTIAL — tuỳ chọn]** `docs/DESIGN.md:241,243` và `.context/design-spec.md:236`: thêm 1 mệnh đề "(BL-055: URL chỉ có `category` → 308 sang trang danh mục)" để mô tả màn hình không gây hiểu nhầm là luôn 200. Không chặn (SPEC + API_SPEC đã là nguồn contract).

### (c) Backlog follow-up (không thuộc BL-055)
- Kiểm 308 thật ở `/en/property-news?category=` / `/en/for-rent?category=` trên staging có danh mục bản EN (residual T01 + test-scope risk (1)).
- `legacyCategorySlug` (`post-list-metadata.ts:29-30`, `slice` không trim) vs `legacyCategoryOnly` (trim, >100 → null) — hợp nhất về `firstText` (reviewer T01 MINOR; fail-safe, không sai hành vi).
- `amenityCounts` 100k tin ~330 ms do Sort external merge `count(DISTINCT)` — hướng `count(*)` / `EXISTS` / `work_mem` (T02 residual; trong NFR-01 ≤ 500 ms).
- Ảnh hero `/tin-bds` và tin chi tiết chỉ có bản 800 px (nội dung CMS) — nhắc editor upload ≥ 1600 px (reviewer T03 MINOR).
- LCP chưa đo cold start / `/en` / Lighthouse mobile throttle (T03 residual) — kiểm lại trên staging có mạng thật.

## Missing Edge Cases
Không phát hiện thêm ngoài những ca đã có test: khoá rỗng `&q=`, khoá lạ `utm_*` có giá trị, slug > 100 ký tự, khoá lặp `category=[x,y]`, route danh mục kèm `?category=`, slug chưa có bản EN ở `/en`, `priceMin=5&priceMax=0`, `priceMin=0&priceMax=0`, `endAt` rác / voucher chỉ khoảng trắng.

## Non-functional Gaps
Không. C-5 kết luận có số đo trong NFR-01; LCP có số đo; migration gate: không có migration (đúng `migration: "không"`).

## Verdict Reasoning
Cả 7 mục C-1, C-4..C-8 và LCP đều có quyết định rõ (làm / không làm kèm số đo + lý do) ghi ở task, spec update, `SPECIFICATIONS.md:59-60` và test-scope v66; code khớp as-built (308 điều kiện, en path, `priceMax=0`, `hasPostOffer`, `hookTimeout`); `areaMax` không bị nói sai cho `/du-an`; intent docs không đổi; không migration; verify tự chạy PASS (typecheck, eslint scope, 5 test file / 101 test). Gap còn lại chỉ là chú thích trạng thái commit lỗi thời trong artifact spec (sửa khi close-out) và follow-up backlog không chặn → **COMPLETE / PASS**.
