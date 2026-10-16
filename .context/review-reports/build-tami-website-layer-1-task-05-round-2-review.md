Agent: reviewer

# Review — build/tami-website · layer-1-task-05 · round 2

- **Review level:** STRICT
- **Reason:** thư viện dùng chung (shape response API cho mọi endpoint, khoá chống trùng lead BR-15 theo SĐT, băm IP bằng secret / rate limit, chuẩn hoá tìm kiếm khớp Postgres).
- **Blast radius:** `src/lib/phone.ts` (leads / job-applications, `phoneNormalized` + index chống trùng), `src/lib/security/ip-hash.ts` (`ipHash` ở leads/click-events/job-applications, rate limit), `src/lib/http/response.ts` + `src/shared/types/api.ts` (mọi endpoint custom), `src/lib/search/normalize.ts` (`searchText` + từ khoá `/cho-thue?q=`), `src/lib/slug.ts`. Diff: chỉ thêm file mới + `.context/progress.json`.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS: 21 file, 235 test, 0 skipped |
| `vitest run` 3 file mục tiêu, `--reporter=verbose` | PASS 49/49; `✓ \|integration\| tests/integration/search-normalize.test.ts > ... unaccent(lower()) ... 34ms`, **chạy thật, không bị skip** (có cả mẫu `Studio 30m² view sông`) |
| `pnpm build` | PASS (exit 0) |

## Responsive Checklist Gate
N/A: diff không đụng UI.

## Skill gates
- aislop: skip, không nằm trong verify commands được phép
- oxlint: skip, oxlint chưa cấu hình; eslint + tsc PASS
- ocr: skip, ocr chưa cài
- AI-readable: OK (hàm ngắn, comment giải thích lý do, không có indirection)
- ai-friendly-web: N/A (lib nội bộ)
- blitzstrike: skip, không có môi trường

## Round-1 closure
- **M1, đã đóng:** `phone.ts:3` `^(?:\+84|0084|84|0)([35789]\d{8}|2\d{9})$`. Nhận số cố định `0`+`2`+9 số (028/024/0236…) → `+842…`; từ chối `0212345678` (thiếu số), `028381234567` (thừa số), `+84 028…` (lẫn tiền tố), `011…`. Di động vẫn đúng 9 số. Hai nhánh không mơ hồ: di động bắt đầu bằng 3/5/7/8/9, cố định bắt đầu bằng 2, độ dài khác nhau. Có test cho cả số HCM, HN và tỉnh (0236).
- **M2, đã đóng:** integration test chạy thật với DB và PASS cho toàn bộ mẫu, kể cả `²`.
- **m1:** đã ghi chú hệ quả khi xoay vòng secret trong JSDoc (`ip-hash.ts:26-27`); vẫn đọc `process.env` trực tiếp. Chấp nhận được.
- **m2, đã đóng phần lớn:** IPv4-mapped dạng chấm thập phân → IPv4; IPv6 được đưa về dạng rút gọn qua `URL`, có `try/catch`, nên zone id hoặc chuỗi lạ không làm ném lỗi; chuỗi không phải IP vẫn băm được; IP rỗng thì throw (đúng ý đồ).
- **m3, đã đóng:** `ok()` chặn status ngoài 2xx (`response.ts:5-7`).

## Findings
### [MINOR] n1 — IPv4-mapped viết dạng hex chưa gộp về IPv4 — `src/lib/security/ip-hash.ts:9-14`
Regex IPv4-mapped được kiểm **trước** bước rút gọn qua URL, nên `::ffff:cb00:7107` hoặc `0:0:0:0:0:ffff:203.0.113.7` (URL serialize thành `::ffff:cb00:7107`) ra hash khác với `203.0.113.7`. Thực tế IP lấy từ header proxy hầu như luôn ở dạng chấm thập phân, nên rủi ro thấp. **Fix (tuỳ chọn):** rút gọn IPv6 trước, rồi đổi `::ffff:xxxx:yyyy` sang IPv4 sau.

### [MINOR] n2 — `2\d{9}` nhận cả đầu `020x`/`021x` chưa được cấp — `src/lib/phone.ts:3`
Chỉ là dễ dãi về định dạng, không phải nhận nhầm số di động; không ảnh hưởng khoá chống trùng. Không cần sửa.

## Verdict
✅ **PASS**: không còn CRITICAL/MAJOR. M1 và M2 đã đóng, có bằng chứng tự chạy được. Hai MINOR còn lại không chặn.
