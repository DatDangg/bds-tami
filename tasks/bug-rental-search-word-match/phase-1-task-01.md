# bug-rental-search-word-match · phase-1-task-01 — Tìm kiếm Cho thuê khớp theo đầu từ + ưu tiên khớp nguyên cụm (BL-080)

- Change doc: `spec/changes/2026-10-27-rental-search-word-match.md` (BACKLOG BL-080, QA sheet 26/10 bug 1, mức Cao).
- Phụ thuộc: không.
- Trạng thái: `done` — Reviewer STRICT PASS r2 (`.context/review-reports/bug-rental-search-word-match-phase-1-task-01-round-2-review.md`; r1 FAIL). Spec: no spec change (1.59.0), test-scope v81. Doc impact: `docs/API_SPEC.md` §3.3.

## Classification / Risk
- Type: **BUG** (hành vi tìm kiếm sai so với kỳ vọng "khớp từ khoá"; không đổi API contract/schema).
- Risk: **MEDIUM-HIGH** — truy vấn SQL công khai dùng chung cho danh sách + đếm tổng + facet `/cho-thue` (`search-service.ts`), hiệu năng index trigram.
- Expected review level: **STRICT** (shared service, query dùng nhiều nơi, input người dùng vào SQL).
- Blast radius: `src/lib/search/rental-search-sql.ts` (điều kiện `q` + ORDER BY), `src/lib/search/search-service.ts` (nơi gọi `rentalOrderBy`), test liên quan.
- Doc impact: dự kiến `docs/API_SPEC.md` §3.3 (mô tả `q`: khớp đầu từ, sort mặc định ưu tiên khớp cụm) nếu tài liệu đang mô tả cách khớp; nếu không mô tả → `no doc impact`.

## Repro (trước khi sửa)
- `/cho-thue?q=can%20ho` (staging mock): 25 tin, đầu danh sách là sàn văn phòng Xuân Diệu, Vinhomes Cổ Loa… — "ho" khớp "c**ho**", "can" khớp "**can**" trong "cần".

## Root cause
`src/lib/search/rental-search-sql.ts:102` — mỗi từ thành `rl."search_text" LIKE '%term%'` (chuỗi con, AND, không ranh giới từ); `rentalOrderBy` (`:137`) sort mặc định chỉ theo mới nhất, không có độ liên quan. `searchText` đã chuẩn hoá không dấu (`normalize.ts`), nên "cần" → "can", "cho" chứa "ho".

## Thiết kế fix (đề xuất — builder kiểm và chỉnh nếu có lý do, ghi Decision log)
1. **Khớp đầu từ:** mỗi từ giữ `rl."search_text" LIKE '%term%'` (để planner vẫn dùng index trigram như cũ) **AND** thêm điều kiện ranh giới đầu từ, vd regex `rl."search_text" ~ ('(^|[^[:alnum:]])' || <term đã escape regex>)` (pg_trgm hỗ trợ cả `~`) hoặc tương đương. Ký tự trước từ có thể là đầu chuỗi, khoảng trắng hoặc dấu câu (`(`, `,`, `-`, `/`…). Escape đủ metachar regex + LIKE; giá trị luôn qua tham số `${}`.
2. **Mã tin (CT-0000xx):** vẫn tìm được bằng mã đầy đủ (vd `CT-000012`, `ct 000012`?) — kiểm `searchText` chứa mã dạng nào (`reindex-rental-search-text.ts`) và đảm bảo các dạng người dùng hay gõ vẫn khớp.
3. **Độ liên quan:** khi `q` có ≥ 2 từ và `sort` mặc định (`newest`/không truyền), tin chứa nguyên cụm (các từ liền nhau đúng thứ tự, ranh giới đầu từ) xếp trước, sau đó mới newest + id. `price_asc`/`price_desc` giữ nguyên thứ tự giá. Đảm bảo phân trang (cả nhánh alias `page` ở `search-service.ts:213`) không lặp/sót: khoá sort ổn định.
4. Tổng đếm + facet dùng cùng điều kiện WHERE (không lệch danh sách).
5. Không đổi schema/migration nếu tránh được.

## Files
- `src/lib/search/rental-search-sql.ts`, `src/lib/search/search-service.ts` (nếu cần truyền `q` cho ORDER BY), test `src/lib/search/*.test.ts`.
- KHÔNG đụng các file dirty của việc khác: `src/collections/Rentals.ts`, `src/collections/Projects.ts`, `src/collections/PropertyPosts.ts`, `src/fields/ward-in-province.ts`, `package.json`, `pnpm-lock.yaml`, `.gitignore`, `.claude/settings.json`, `src/app/(payload)/admin/importMap.js`, `tools/*`.

## Acceptance
- [ ] `can ho` / `căn hộ` không trả tin chỉ chứa "cần", "cho" mà không có từ bắt đầu bằng "can"+"ho"; khớp đầu từ, vẫn không dấu.
- [ ] Sort mặc định: tin khớp nguyên cụm trước tin khớp rời; sort giá vẫn theo giá.
- [ ] Vẫn dùng index trigram (giữ điều kiện LIKE indexable); đếm tổng/facet khớp danh sách; mã tin vẫn tìm được.
- [ ] Test tái hiện fail trước / pass sau cho các ca trên. `pnpm typecheck` · `pnpm test` · `pnpm lint` · `pnpm build` PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Decision log
- 2026-10-27 (change-request): root cause có sẵn file:line trong change doc → không spawn Explore.
- 2026-10-27 (builder): giữ đề xuất. Regex `~` thay vì `y`/`m` (không phụ thuộc `m` coi "_"/số là ký tự từ); `[^[:alnum:]]` cho ký tự trước từ. `phrase_match` tính trong CTE trang (`page.*`) để ORDER BY ngoài đọc cột thay vì lặp regex; alias "r" (nhánh truy vấn con nổi bật) tính trực tiếp nhưng `featuredIdsQuery` không truyền `q` — thẻ nổi bật luôn newest thuần, khớp tập đã loại khỏi lưới (tránh lệch khi > 5 nổi bật). Chỉ sort `newest` mới ưu tiên cụm. Không đổi schema/migration, không đụng `news-search`.

## Repro Verification
- Original repro: `/cho-thue?q=can ho` — "ho" khớp "c**ho**", "can" khớp "cần" (searchText bỏ dấu); sort mặc định chỉ newest.
- Expected: mỗi từ là ĐẦU một từ trong `search_text`; sort mặc định đặt tin chứa nguyên cụm "can ho" trước; sort giá giữ; đếm/facet cùng WHERE; mã tin vẫn tìm được.
- Actual before fix: điều kiện chỉ `LIKE '%can%' AND LIKE '%ho%'` (test mới import `wordStartRegex`/`phraseRegex` và gọi `rentalOrderBy(..., query)` không tồn tại → FAIL trước fix).
- Actual after fix: mỗi từ sinh `LIKE '%t%'` + `~ '(^|[^[:alnum:]])t'`; sort mặc định + q ≥ 2 từ `ORDER BY phrase_match DESC, published_at DESC, id DESC`.
- Evidence: `rental-search-sql.test.ts` (+10 ca: LIKE giữ + regex đầu từ, "can cho thue …" không khớp, "ct-000012"/"ct 000012" khớp, escape metachar, cụm đúng thứ tự, ORDER BY r/page, sort giá/q 1 từ không đổi, `other` = 4 điều kiện cho 2 từ) và `search-service.test.ts` (+3 ca: CTE có `phrase_match`, đếm cùng điều kiện, nổi bật không bị ảnh hưởng). `vitest src/lib/search` 76/76 PASS. typecheck PASS; build PASS; eslint `src/lib/search` sạch.
- Status: PASS (mức SQL render + mô phỏng regex JS). Chưa chạy trên Postgres thật.
- Residual risk: (1) DB tami (127.0.0.1:5433) không chạy nên chưa EXPLAIN / chạy `~` thật; `[[:alnum:]]` trong Postgres phụ thuộc locale/collation DB (ký tự ngoài ASCII trong search_text hiếm, đã bỏ dấu) — reviewer/QA nên kiểm trên staging: `can ho` + EXPLAIN dùng GIN trigram. (2) `pnpm test` có 60 file integration fail `ECONNREFUSED 127.0.0.1:5433` (cần DB), unit pass 100%; `pnpm lint` fail do quét `playwright-report/**` (file minified, ngoài scope), eslint `src/lib/search` sạch. (3) Cụm ưu tiên cho phép dấu câu giữa các từ ("can-ho", "can, ho"). (4) `news-search.ts` dùng chung `searchTerms`/`escapeLike` nhưng KHÔNG đổi (ngoài scope).

### Round 2 (sau reviewer STRICT r1 FAIL)
- MAJOR 1 đã sửa: `fetchRows` truyền `relevantQuery` cho cả ORDER BY TRONG CTE (`rentalOrderBy(sort, "r", relevantQuery)` trước LIMIT/OFFSET) lẫn ORDER BY ngoài; r1 chỉ sắp lại trong trang đã cắt theo newest. Áp dụng cho `search()` và lưới `listing()`; thẻ nổi bật vẫn newest thuần.
- Test: unit (`search-service.test.ts`) kiểm ORDER BY trong CTE có `phrase_match` regex trước `LIMIT/OFFSET`. Integration thật (`tests/integration/rental-search.test.ts`, describe "BL-080", DB tami 5433): 5 tin khớp `can ho` (2 cụm cũ hơn, 3 rời mới hơn) + 1 tin "Cần cho thuê" → `limit 2` trang 1 = đúng 2 tin cụm (toàn cục), ghép 3 trang = 5 tin không lặp/sót, tin "cần…cho" không khớp, sort giá theo giá, `listing()` cùng total, mã tin `CT-xxxxxx` và `ct xxxxxx` vẫn ra. Đã kiểm: bỏ fix CTE thì 2 ca integration FAIL; có fix thì PASS.
- EXPLAIN trên DB tami (`enable_seqscan=off`): `LIKE '%can%' AND ~ '(^|[^[:alnum:]])can'` → Bitmap Index Scan `rentals_locales_search_text_trgm_idx` (cả hai điều kiện trong Index Cond). Chỉ 64 dòng nên planner mặc định có thể seq scan; chưa đo trên dữ liệu lớn.
- Verify: `vitest src/lib/search tests/integration/rental-search.test.ts` 130/130 PASS; typecheck PASS; build PASS; eslint file đổi sạch.
- Doc impact: `docs/API_SPEC.md` §3.3 as-built có mô tả cách khớp `q` → đã cập nhật (khớp đầu từ, `~` ranh giới từ, sort mặc định ưu tiên cụm trước khi cắt trang). Không đổi ERD/schema.
