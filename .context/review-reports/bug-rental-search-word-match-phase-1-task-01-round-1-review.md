Agent: reviewer

# Review: bug-rental-search-word-match, phase-1-task-01, round 1 (BL-080)

- Review level: **STRICT**
- Reason: shared search service (list + count + facet cho `/cho-thue` và `search()`), input người dùng đi vào SQL/regex, đổi ORDER BY ảnh hưởng phân trang.
- Blast radius: `src/lib/search/rental-search-sql.ts` (`rentalConditions`, `rentalOrderBy`, `wordStartRegex`, `phraseRegex`, `phraseMatchExpression`), `src/lib/search/search-service.ts` (`search`, `listing`, `fetchRows`). Client: trang `/cho-thue` (vi/en), API search cho thuê. `news-search.ts` dùng chung `searchTerms`/`escapeLike` nhưng không đổi.
- Scope: chỉ `git diff -- src/lib/search/`. Các file dirty khác trong working tree bỏ qua theo chỉ định.

## Verify commands + result

| Command | Result |
|---|---|
| `pnpm typecheck` | PASS |
| `pnpm vitest run src/lib/search` | PASS, 76/76 |
| `pnpm eslint src/lib/search` | PASS (không lỗi) |
| `pnpm build` | PASS |
| `pnpm vitest run tests/integration/rental-search.test.ts` (DB tami 5433) | PASS, 48/48 (không có ca BL-080 trong file này) |
| Regex `~` trên Postgres thật (`docker exec tami-postgres psql -U tami -d tami`) | Ngữ nghĩa đúng: "can cho thue van phong" không khớp `can`+`ho` (f); "studio (can ho) q1" khớp (t); `ct-000012` khớp; `c\+\+\(a\)` khớp literal, `a\.b` không khớp "axb"; `\[a\.\*` hợp lệ; cụm `can[^[:alnum:]]+ho` khớp "can-ho", không khớp "can 2 ho". Collation `en_US.utf8`. |
| EXPLAIN (`enable_seqscan=off`) | `Bitmap Index Scan on rentals_locales_search_text_trgm_idx`, Index Cond gồm cả LIKE và `~`: index trigram vẫn dùng được. |
| Mô phỏng CTE của `fetchRows` trên data thật (`q=can ho`, limit 12) | **Lỗi**, xem finding [MAJOR] #1 |

## Responsive Checklist Gate
N/A: diff không đụng UI (chỉ `src/lib/search/*`).

## Skill gates
- aislop: OK, score 98 (`npx aislop scan --changes --json`), không có finding chặn trong các file search.
- oxlint (anti-slop): skip, oxlint not configured (không có `.oxlintrc.json`/`oxlint.json`). Đã chạy eslint trên file đổi: sạch.
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK. Dưới 3 indicator. Tên rõ, hàm ngắn, comment nói WHY.
- ai-friendly-web: N/A (thay đổi backend query, không đụng bề mặt public crawl).
- blitzstrike: skip, chưa cài / không có môi trường được phép. Đã soi injection thủ công: term luôn qua tham số `${}`, `alias` là union hằng nội bộ, regex escape đủ metachar ARE (`\ ^ $ . | ? * + ( ) [ ] { }`), pattern luôn bắt đầu bằng `(^|...)` nên không dính tiền tố `***:` / `***=` / `(?`. Không thấy SQLi hay regex injection.

## Findings

### [MAJOR] 1. Ưu tiên khớp cụm chỉ sắp lại TRONG một trang, không sắp trên toàn bộ kết quả. Acceptance "Sort mặc định: tin khớp nguyên cụm trước tin khớp rời" chưa đạt.
- `src/lib/search/search-service.ts:196`: CTE `page` gọi `rentalOrderBy(sort, "r")` **không truyền query**, nên `LIMIT/OFFSET` vẫn cắt theo newest thuần. Chỉ ORDER BY ngoài (`:218`) đọc `phrase_match`, tức là chỉ sắp lại 12 dòng đã chọn sẵn.
- Bằng chứng trên DB thật (tập khớp `can ho`, locale vi, cùng thứ tự sort với service): trang 1 (LIMIT 12 OFFSET 0) gồm 4 tin văn phòng không khớp cụm (ct-000092/091/087/086, đúng các tin "sàn văn phòng Xuân Diệu / Vinhomes" trong repro gốc), bị đẩy xuống cuối trang 1. Trong khi đó trang 2 (OFFSET 12) mở đầu bằng các tin khớp cụm `ct-000076`, `ct-000075`, `ct-000073`… Mô phỏng LIMIT 4: trang 1 chỉ có 4 tin văn phòng, không có tin "căn hộ" nào. Triệu chứng gốc của bug vẫn còn ở trang đầu khi các tin không khớp cụm là tin mới nhất.
- Áp dụng cho cả `search()` lẫn lưới `listing()` (`gridWhere`).
- Nhánh `alias === "r" ? phrase` trong `rentalOrderBy` (`rental-search-sql.ts:170`) chỉ được unit test gọi, production không dùng tới. Đây chính là dấu hiệu của lỗi này.
- Fix đề xuất: ở `:196` truyền cùng query cho ORDER BY trong CTE, ví dụ `rentalOrderBy(sort, "r", phrase === undefined ? undefined : relevanceQuery)`. Nếu muốn tránh tính regex 2 lần thì ORDER BY bằng tên cột output `"phrase_match"` (cách này cần đổi helper). Giữ `id DESC` làm khoá chốt để phân trang ổn định.

### [MAJOR] 2. Test cho thấy an toàn giả, không bắt được finding #1.
- `src/lib/search/search-service.test.ts:113`: chỉ assert ORDER BY **ngoài** (regex neo `$`), không kiểm ORDER BY bên trong CTE trước `LIMIT`. Repro Verification ghi "Status: PASS (mức SQL render + mô phỏng regex JS). Chưa chạy trên Postgres thật". Bằng chứng này không chứng minh được thứ tự giữa các trang.
- Fix đề xuất: (a) unit test assert SQL của CTE chứa `ORDER BY (rl."search_text" ~ $n) DESC, r."published_at"` **trước** `LIMIT`. (b) Thêm ca integration trong `tests/integration/rental-search.test.ts` với số tin khớp > `limit`: các tin khớp rời mới hơn tin khớp cụm, rồi kiểm trang 1 toàn tin khớp cụm, trang 2 không lặp/sót (gộp id 2 trang = tập đầy đủ, không trùng). Thêm 1 ca `can ho` không trả tin chỉ có "cần/cho" trên Postgres thật (hiện chỉ test bằng regex JS mô phỏng).

### [MINOR] 3. Thẻ nổi bật (`listing`, `:125`) vẫn sort newest thuần, không ưu tiên cụm.
Đây là quyết định có ghi Decision log và hợp lý: giữ khớp với `featuredIdsQuery`. Ghi lại để QA biết: tin nổi bật khớp rời có thể đứng trên lưới khớp cụm. Không chặn.

### [MINOR] 4. Doc impact chưa ghi.
Task dự kiến `docs/API_SPEC.md` §3.3 (mô tả `q` khớp đầu từ + sort ưu tiên cụm), nhưng Repro Verification/close-out chưa có dòng doc impact hay `no doc impact`. Xử lý ở close-out.

## Đã kiểm đạt
- Khớp đầu từ không dấu: đúng trên Postgres (`[^[:alnum:]]` dưới en_US.utf8; `search_text` đã bỏ dấu nên ký tự ngoài ASCII không ảnh hưởng thực tế).
- Giữ `LIKE '%term%'` cạnh `~`: EXPLAIN dùng GIN trigram.
- Đếm tổng/facet dùng cùng điều kiện: điều kiện từ khoá nằm trong `other`, nên `rentalWhere` / `count` / `filterConditions` đều có.
- Mã tin `ct-000012` và `ct 000012` vẫn khớp.
- Sort giá không bị đụng (`price_asc`/`price_desc` return sớm).
- Escape regex/LIKE an toàn, tham số hoá đầy đủ.
- Surgical diff: mọi dòng trace về BL-080.

## Residual risk
- Không chạy được app/browser. Bằng chứng finding #1 là truy vấn mô phỏng đúng cấu trúc CTE + điều kiện WHERE từ khoá. Mô phỏng bỏ qua điều kiện public/status/locale đầy đủ, nhưng ORDER BY/LIMIT trong CTE là cấu trúc được đọc trực tiếp từ `search-service.ts:196`.
- Term 1–2 ký tự (`ho`): trigram không thu hẹp được nhiều. Hành vi này đã có từ trước, không do diff gây ra.

## Verdict: FAIL

Danh sách cho builder:
1. `search-service.ts:196`: truyền query vào `rentalOrderBy` của CTE để ưu tiên cụm trước khi `LIMIT/OFFSET`.
2. Thêm test assert ORDER BY trong CTE + integration test thật trên Postgres: phân trang qua > `limit` tin, cụm trước, không lặp/sót, và `can ho` không khớp "cần…cho".
3. Close-out ghi doc impact (`docs/API_SPEC.md` §3.3 hoặc `no doc impact` kèm lý do).
