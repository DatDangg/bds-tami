Agent: reviewer

# Review: bug-rental-search-word-match, phase-1-task-01, round 2 (BL-080)

- Review level: **STRICT**
- Reason: shared search service (list + count + facet cho `/cho-thue`, API `GET /api/public/rentals`), input người dùng đi vào SQL/regex, ORDER BY ảnh hưởng phân trang. Round 1 FAIL.
- Blast radius: `src/lib/search/rental-search-sql.ts` (`rentalConditions`, `rentalOrderBy`, `wordStartRegex`, `phraseRegex`, `phraseMatchExpression`), `src/lib/search/search-service.ts` (`search`, `listing`, `fetchRows`). Client: `/cho-thue` (vi/en), Sheet bộ lọc mobile (đếm), API public rentals. `news-search.ts` dùng chung `searchTerms`/`escapeLike` nhưng không đổi. Doc: `docs/API_SPEC.md` §3.3.
- Scope: `git diff -- src/lib/search/ tests/integration/rental-search.test.ts docs/API_SPEC.md`. Các file dirty khác bỏ qua theo chỉ định.

## Verify commands + result

| Command | Result |
|---|---|
| `pnpm typecheck` | PASS |
| `pnpm vitest run src/lib/search tests/integration/rental-search.test.ts` (DB tami 5433) | PASS, 7 file, 130/130 |
| `pnpm eslint` 5 file đổi | PASS, exit 0 |
| `pnpm build` | PASS, exit 0 |
| `pnpm bench:rentals-search` (100.000 tin, DB dev, guard localhost, tự xoá `BENCH-*`) | ĐẠT. TỔNG p50 24.0ms, p95 80.6ms (ngưỡng 500ms). Các kịch bản đi qua nhánh cụm: "q nhiều từ có dấu" p95 14.0ms, "tiếng Anh + q" (`ho boi`, limit 48) p95 47.5ms, "q + giá + sort" p95 11.9ms. "q 1 từ" p95 102.5ms (cao nhất, vẫn xa ngưỡng). Khớp số đã ghi trong docs (≈80ms). |
| `pnpm lint` toàn repo / `pnpm test` toàn bộ | Không chạy lại: lint fail do `playwright-report/**`, integration S3 fail do SeaweedFS. Cả hai ngoài scope, đã ghi ở task. |

## Xác minh finding round 1

| R1 | Trạng thái | Bằng chứng |
|---|---|---|
| [MAJOR] 1: CTE cắt trang theo newest thuần | **Đã sửa** | `search-service.ts` `fetchRows`: `rentalOrderBy(sort, "r", relevantQuery)` trong CTE trước `LIMIT/OFFSET`, ORDER BY ngoài đọc `page."phrase_match"`. `relevantQuery` chỉ có khi `sort === "newest"` và q ≥ 2 từ. `search()` và lưới `listing()` truyền `params.q`. Thẻ nổi bật giữ newest thuần, khớp `featuredIdsQuery` (NOT IN), nên lưới không lặp/sót tin nổi bật. |
| [MAJOR] 2: test an toàn giả | **Đã sửa** | Unit `search-service.test.ts`: assert phần trước `SELECT page.*` chứa `ORDER BY (rl."search_text" ~ $n) DESC, r."published_at" ... LIMIT $n OFFSET $n`. Integration Postgres thật (describe "BL-080"): 2 tin cụm cũ hơn + 3 tin rời mới hơn. `limit 2` trang 1 = đúng 2 tin cụm, ghép 3 trang = 5 id không trùng/sót, "Cần cho thuê mặt bằng" không khớp `can ho`/`ho thue`, sort giá đúng, `listing()` total 5 + trang 1 là tin cụm, mã tin đầy đủ và dạng `ct xxxxxx` vẫn ra. Dữ liệu test đọc lại khớp: "ho kinh doanh can thue can goc", "ho gia dinh tim can nho", "ho ngheo can nha cap bon" đều khớp đầu từ nhưng không có cụm "can ho" liền nhau; mô tả "mo ta", tỉnh "hue", phường "vinh ninh" không chứa từ bắt đầu bằng "ho". Builder ghi bỏ fix CTE thì 2 ca integration FAIL. Tôi không chạy lại thí nghiệm này (không sửa source), nhưng ca trang 1 = tin cụm với tin rời mới hơn về cấu trúc bắt buộc phải fail khi CTE sort newest. |
| [MINOR] 3: thẻ nổi bật newest thuần | Giữ nguyên, chấp nhận | Decision log + test `listing` xác nhận. |
| [MINOR] 4: doc impact | **Đã sửa** | `docs/API_SPEC.md` §3.3 as-built cập nhật (khớp đầu từ, `LIKE` + `~`, ưu tiên cụm trước khi cắt trang). Task ghi doc impact. Không đổi ERD/schema. |

## Responsive Checklist Gate
N/A: diff không đụng UI (chỉ `src/lib/search/*`, integration test, doc).

## Skill gates
- aislop: OK. R1 score 98. R2 chỉ thêm 1 tham số + test, không có pattern slop mới. Không chạy lại scan.
- oxlint (anti-slop): skip, oxlint not configured. Thay bằng eslint trên file đổi: sạch.
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK, 0 indicator. `fetchRows` khoảng 40 dòng (dưới 50). Tên rõ. Comment nói WHY (vì sao nổi bật không truyền query).
- ai-friendly-web: N/A (backend query, không đổi bề mặt crawl).
- blitzstrike: skip, chưa cài / không có môi trường được phép. Soi thủ công: mọi term và regex qua tham số `${}`. `alias` là hằng nội bộ. `escapeRegex` thoát đủ metachar ARE. Pattern luôn bắt đầu `(^|`, không dính tiền tố director `***:`. Không thấy SQLi/regex injection. `q` ≤ 100 ký tự, ≤ 8 từ, nên chi phí regex có giới hạn.

## Findings

### [MINOR] 1. Regex cụm tính 2 lần mỗi dòng ứng viên trong CTE
`src/lib/search/search-service.ts` (`fetchRows`): cột `${phrase} AS "phrase_match"` và ORDER BY trong CTE (`rentalOrderBy(sort, "r", relevantQuery)`) mỗi bên sinh một tham số `$n` riêng. Vì vậy Postgres không gộp được 2 biểu thức. Bench vẫn rất xa ngưỡng nên không chặn. Nếu muốn tối ưu sau: trong CTE dùng `ORDER BY "phrase_match" DESC, ...` (tên cột output), khi đó nhánh `alias === "r"` có thể bỏ.

### [MINOR] 2. Test unit regex dùng engine JS mô phỏng
`rental-search-sql.test.ts` `toJsRegex` thay `[^[:alnum:]]` bằng `[^a-z0-9]`. Giờ đã có integration Postgres thật bao các ca chính, nên đây chỉ là ghi chú, không chặn.

Không còn CRITICAL/MAJOR.

## Bug repro closure
- Repro gốc (`can ho` ra "cần…cho", tin văn phòng mới nhất đứng đầu) đã được chứng minh hết bằng integration test chạy trên Postgres thật (tôi chạy lại: PASS), cộng unit SQL render. Status Repro Verification: PASS, có evidence kiểm chứng được.

## Residual risk
- Không chạy app/browser, không kiểm `/cho-thue` trên staging. Hành vi hiển thị dựa trên service đã test.
- `[[:alnum:]]` phụ thuộc collation DB (local `en_US.utf8`). `search_text` đã bỏ dấu nên rủi ro thấp. Staging nên dùng cùng collation.
- Bench chỉ đo `BENCH_METHOD=search`, chưa đo `listing` (lưới + nổi bật + facet). R1/R2 không đổi facet. Lưới chỉ thêm 1 biểu thức sort.
- Term 1–2 ký tự: trigram không thu hẹp được nhiều. Hành vi này có từ trước, regex chỉ lọc thêm.

## Verdict: PASS
