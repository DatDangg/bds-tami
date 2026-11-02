# bug-search-multiword-phrase · phase-1-task-01 — Từ khoá ≥ 2 từ phải khớp nguyên cụm (Cho thuê, Tin tức, Tuyển dụng) (BL-103)

- Change doc: `spec/changes/2026-11-02-search-multiword-phrase.md` (BACKLOG BL-103, QA sheet 30/10 bug 22).
- Phụ thuộc: không (xây trên BL-080 `wordStartRegex`/`phraseRegex`).
- Trạng thái: `done` — Reviewer STRICT PASS r1 (`.context/review-reports/bug-search-multiword-phrase-phase-1-task-01-round-1-review.md`). Spec: no spec change (1.61.0), test-scope v106. Doc impact: `docs/API_SPEC.md` (q Cho thuê / Tuyển dụng / Tin tức).

## Classification / Risk
- Type: **BUG** — tìm kiếm nhiều từ khớp lẻ từng từ rải rác; kỳ vọng khớp cụm (không đổi API contract/schema).
- Risk: **MEDIUM-HIGH** — truy vấn SQL công khai dùng chung danh sách + đếm + facet `/cho-thue` (`search-service.ts`), lọc tin tức (danh sách + trang danh mục), lọc tuyển dụng; input người dùng vào regex/SQL.
- Expected review level: **STRICT** (shared query, input người dùng vào SQL/regex).
- Blast radius: `src/lib/search/rental-search-sql.ts` (điều kiện `q`), `src/lib/news/news-search.ts` (`findFilteredNewsIds`), `src/lib/careers/job-filters.ts` (`matchesJobKeyword`), test tương ứng.
- Doc impact: `docs/API_SPEC.md` §3.3 (`q` Cho thuê) + bảng tham số Tin tức (`q`, ~dòng 461) + Tuyển dụng nếu có mô tả cách khớp. `docs/DESIGN.md`: không mô tả quy tắc từ khoá (grep 2026-11-02) → no impact.

## Repro (trước khi sửa)
- `/cho-thue?q=ba+đình` (VI, Khách): lẫn tin khu vực khác (QA sheet 30/10 dòng 22).

## Root cause
- `src/lib/search/rental-search-sql.ts:120` — mỗi từ của `searchTerms(q)` là `LIKE '%t%'` + `~ wordStartRegex(t)`, AND nhưng KHÔNG cần liền nhau → "ba đình" = `ba` + `dinh` khớp tin "Mỹ Đình" + "ba phòng ngủ", hoặc "gia đình". `phraseMatchExpression` chỉ dùng xếp hạng (BL-080), không lọc.
- `src/lib/news/news-search.ts:47` — mỗi từ `LIKE '%t%'` trên `unaccent(title || ' ' || excerpt)`, không ranh giới từ, không cụm → "quyết định", "bao"… khớp.
- `src/lib/careers/job-filters.ts:56` — `haystack.includes(term)` từng từ, không cụm, không đầu từ.

## Thiết kế fix (đề xuất — builder kiểm và chỉnh nếu có lý do, ghi Decision log)
1. **Quy tắc chung khi `q` có ≥ 2 từ (sau chuẩn hoá, ≤ 8 từ):** chuỗi phải chứa các từ **liền nhau đúng thứ tự gõ**, cách nhau bởi ký tự không phải chữ/số, từ đầu ở **đầu một từ** = đúng `phraseRegex(terms)` hiện có. (Từ cuối có thể là tiền tố: "ba di" khớp "ba dinh" — giữ như regex hiện tại.)
2. **Cho thuê:** ≥ 2 từ → giữ `LIKE '%t%'` cho từng từ (để planner dùng GIN trigram) + **một** điều kiện `rl."search_text" ~ phraseRegex(terms)` (thay cho các `wordStartRegex` từng từ — cụm đã bao hàm đầu-từ). 1 từ → không đổi (LIKE + wordStart). Điều kiện nằm trong `other` → đếm tổng / facet cùng WHERE như danh sách.
   - Xếp hạng BL-080 (`phraseMatchExpression` / `phrase_match`): nay mọi tin khớp đều chứa cụm nên vô dụng. Builder chọn: giữ (diff nhỏ nhất) hoặc gỡ nếu gọn và an toàn cho phân trang; ghi Decision log.
3. **Tin tức:** ≥ 2 từ → giữ `LIKE` từng từ + thêm `${haystack} ~ ${phraseRegex(terms)}` (haystack đã `lower(translate(...))`). 1 từ → không đổi (substring, theo acceptance "giữ hành vi hiện tại").
4. **Tuyển dụng:** ≥ 2 từ → regex JS tương đương (ranh giới = ký tự không phải chữ/số Unicode, vd `[^\p{L}\p{N}]` cờ `u`), escape metachar. 1 từ → không đổi (`includes`). Dùng chung `searchTerms` thay vì tự tách nếu tiện (cùng giới hạn 8 từ).
5. Mọi giá trị người dùng đi qua tham số `${}` (SQL) / escape regex (JS). Không đổi schema/migration.

## Files
- `src/lib/search/rental-search-sql.ts`, `src/lib/news/news-search.ts`, `src/lib/careers/job-filters.ts` + test: `src/lib/search/rental-search-sql.test.ts`, `src/lib/careers/job-filters.test.ts`, test news (unit nếu có chỗ hợp lý; integration `tests/integration/news.test.ts` / `tests/integration/rental-search.test.ts` nếu DB tami 127.0.0.1:5433 chạy — port đang mở 2026-11-02).
- KHÔNG đụng file dirty của việc khác: `docs/*`, `src/endpoints/admin/*`, `src/endpoints/public/newsletter.ts`, `src/hooks/leads/*`, `src/jobs/*`, `src/lib/revalidate/*`, `src/lib/translation/*`, `tools/*`, `package.json`, `pnpm-lock.yaml`, `.gitignore`, `.claude/settings.json`, `.context/design-spec.md`, `spec/changes/BACKLOG.md` (change-request tự cập nhật).

## Acceptance
- [ ] `/cho-thue?q=ba đình` (có/không dấu, hoa/thường) chỉ trả tin có cụm "ba dinh" liền nhau ở ranh giới từ; tin "Mỹ Đình" + "ba phòng ngủ" / "gia đình" không khớp.
- [ ] `/tin-tuc?q=ba đình` (+ trang danh mục) không khớp bài chỉ chứa "quyết định"/"gia đình"/"bao"…; cùng quy tắc cụm + đầu-từ.
- [ ] `/tuyen-dung?q=<2 từ>` cùng quy tắc cụm + đầu-từ trên tên vị trí.
- [ ] Từ khoá 1 từ giữ hành vi hiện tại; đếm tổng/facet khớp danh sách.
- [ ] Test hồi quy cả 3 trang (ca "ba đình" vs "Mỹ Đình" + "ba phòng ngủ" / "gia đình"), fail trước / pass sau.
- [ ] `pnpm typecheck` · `pnpm test` (phần liên quan) · `pnpm lint` (file đổi) · `pnpm build` PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Decision log
- 2026-11-02 (change-request): root cause có sẵn file:line trong change doc → không spawn Explore. User duyệt "ok, làm luôn ở đây" (auto proceed phase plan).
- 2026-11-02 (builder): thêm `keywordConditions(terms)` trong `rental-search-sql.ts`: ≥ 2 từ = `LIKE` từng từ (giữ trigram) + MỘT `~ phraseRegex`; 1 từ = LIKE + `wordStartRegex` như cũ. Tin tức dùng lại `phraseRegex` (+ `LIKE` từng từ như cũ); Tuyển dụng dùng regex JS Unicode (`[^p{L}p{N}]`, cờ `u`) trên `normalizeSearchText` (cùng chuẩn hoá, cùng giới hạn 8 từ).
- Xếp hạng BL-080 (`phraseMatchExpression`/`phrase_match` ở `search-service.ts`): GIỮ (diff nhỏ nhất, không đụng CTE phân trang) — nay vô hại vì mọi tin khớp đều chứa cụm (sắp theo phrase_match = hằng, rồi newest + id). Có thể gỡ sau như dọn dẹp riêng (tiết kiệm 1 regex/dòng trong ORDER BY).
- Test cũ mã hoá ngữ nghĩa AND rời rạc được cập nhật sang cụm: BL-080 unit/integration (số đếm 5 → 2, phân trang), `news.test.ts` ("dong ANH zq54" → "dong ANH"), `job-postings.test.ts` (`tu van <marker>` → `<marker>` / cụm liền), `search-service.test.ts` (2 → 1 điều kiện `~`).

## Repro Verification
- Original repro: `/cho-thue?q=ba đình` lẫn tin khu vực khác.
- Expected: chỉ tin chứa cụm "ba đình" liền nhau ở đầu từ.
- Actual before fix: với mã HEAD, các test hồi quy mới FAIL (8 test: unit rental-search-sql ×2, job-filters, integration rental-search ×4, news ×1 — vd "ba rong"/"pho dinh" khớp tin "Nhà phố Ba Đình rộng"; "căn hộ" khớp tin chỉ có "căn … hộ" rời; news "dong zq54" khớp).
- Actual after fix: các test đó PASS; 1 từ không đổi.
- Evidence: vitest unit (rental-search-sql, search-service, job-filters) + integration DB tami (rental-search, news, job-postings, projects) = 16 file / 246 test PASS; `pnpm test` toàn bộ: lần chạy đầu 3 file fail do test cũ (đã sửa) + `projects.test.ts` seed (flaky khi chạy song song, PASS khi chạy lại riêng); `pnpm typecheck` PASS; eslint src/lib/{search,news,careers} + 3 test integration sạch; `pnpm build` PASS.
- Status: PASS
- Residual risk: (1) cụm tin tức có thể vắt qua ranh giới tiêu đề/tóm tắt (haystack nối bằng khoảng trắng) — chấp nhận. (2) `phrase_match` ORDER BY còn tính regex thừa cho tin đã khớp. (3) Từ khoá nhiều từ gõ sai thứ tự giờ không có kết quả (đúng spec). (4) Chưa kiểm bằng trình duyệt; kiểm qua DB thật.
