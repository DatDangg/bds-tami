Agent: reviewer

# Review — build/tami-website · layer-1-task-05 · round 1

- **Review level:** STRICT
- **Reason:** thư viện dùng chung cho hook/endpoint/job; quy định định dạng response API (`ok`/`fail`) cho mọi client; khoá chống trùng lead (BR-15); băm IP bằng secret (bảo mật/PII).
- **Blast radius:** `src/lib/slug.ts` (slug mọi collection + redirect BR-05), `src/lib/phone.ts` (`/api/public/leads`, `/api/public/job-applications`, `phoneNormalized` + index chống trùng), `src/lib/search/normalize.ts` (`rentals.searchText` + từ khoá `/cho-thue?q=`), `src/lib/http/response.ts` + `src/shared/types/api.ts` (mọi endpoint custom), `src/lib/security/ip-hash.ts` (`ipHash` ở leads/click-events/job-applications, rate limit). Diff chỉ thêm file mới, + `.context/progress.json`.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS — 21 file, 222 test. **Lưu ý:** `tests/integration/search-normalize.test.ts` bị `skipIf(!DATABASE_URL_TEST)`; script `vitest run` không nạp `.env.local` (vitest.config không có loadEnv) → test so khớp unaccent gần như chắc chắn **bị skip** khi chạy local |
| `pnpm build` | PASS (exit 0) |

## Responsive Checklist Gate
N/A — diff không đụng UI (chỉ có lib/type thuần).

## Skill gates
- aislop: skip, aislop chưa cấu hình/không nằm trong verify commands được cho phép
- oxlint (anti-slop): skip, oxlint chưa cấu hình (không có `.oxlintrc*`); eslint + tsc PASS
- ocr: skip, ocr chưa cài
- AI-readable: OK — tên rõ, mọi hàm < 50 dòng, mọi file < 40 dòng, comment giải thích lý do (WHY), không có indirection
- ai-friendly-web: N/A (nội bộ lib)
- blitzstrike: skip, không có môi trường

## Findings

### [MAJOR] M1 — Thu hẹp hợp đồng SĐT về chỉ di động mà spec không ghi — `src/lib/phone.ts:1-3`
`API_SPEC.md:71` (leads) ghi `phone` = "SĐT Việt Nam hợp lệ"; job-applications (`API_SPEC.md:86`) cũng dùng `phone`. BRD BR-15 và §luồng lead (BRD:258) không giới hạn là di động/Zalo. Comment "form lead chỉ thu số liên hệ di động/Zalo" là giả định do builder tự đặt, trong khi task ghi `Decision impact: NO`. Số cố định hợp lệ (`028 3823 4567`, `024…`, `0236…`, tức `0` + `2` + 9 chữ số) sẽ bị trả 400 → mất lead từ khách doanh nghiệp/văn phòng. Test `phone.test.ts:30` đang khoá cứng hành vi sai này.
**Fix:** nhận cả số cố định `2\d{9}` (regex vd `([235789]\d{8}|2\d{9})`, chuẩn hoá thành `+842…`), thêm case test số cố định HCM/HN/tỉnh; HOẶC nếu muốn chỉ nhận di động thì ghi decision log + gap/Change Request cho user duyệt, sửa API_SPEC. Không được để giả định nằm im trong code.

### [MAJOR] M2 — Chưa có bằng chứng cho AC "khớp `unaccent(lower())`"; mẫu `²` nhiều khả năng lệch — `src/lib/search/normalize.ts:9`, `tests/integration/search-normalize.test.ts:13,20`
Test tích hợp duy nhất chứng minh AC 3 bị skip khi chạy local (không có `DATABASE_URL_TEST` trong process env), nên "222 PASS" ở journal không kiểm chứng AC này. Ngoài ra `normalizeSearchText` dùng `NFD` (không đổi `²`→`2`), trong khi `slugify` dùng `NFKD`; file `unaccent.rules` của Postgres (sinh từ CLDR Latin-ASCII) đổi chữ số mũ/ký tự tương thích về ASCII → mẫu `"Studio 30m² view sông"` có khả năng FAIL khi CI có DB, làm đỏ CI sau khi commit.
**Fix:** chạy `pnpm test` với `DATABASE_URL_TEST` trỏ vào DB dev (docker, đã bật `unaccent`) và đưa output vào Feature Verification; nếu lệch thì dùng `NFKD` (hoặc map riêng) cho khớp Postgres, thêm case `²` vào unit test.

### [MINOR] m1 — `ipHash` đọc thẳng `process.env.PAYLOAD_SECRET`, không qua `getEnv()` — `src/lib/security/ip-hash.ts:8`
Không thống nhất với `src/lib/env.ts` (một nguồn validate). Vẫn fail-closed nên không có lỗ hổng. Dùng chung secret auth là **chấp nhận được** vì đã có tiền tố tách mục đích `ip-hash:v1:` (domain separation). Đánh đổi: xoay vòng `PAYLOAD_SECRET` (lúc lộ secret) làm đổi toàn bộ hash → mất liên tục thống kê/chống spam theo IP. **Fix:** mặc định lấy `getEnv().PAYLOAD_SECRET`; ghi rõ hệ quả khi xoay vòng secret vào docs/ARCHITECTURE (hoặc tách `IP_HASH_SECRET` nếu muốn xoay vòng độc lập).

### [MINOR] m2 — Chuẩn hoá IP chưa đủ — `src/lib/security/ip-hash.ts:10`
Chỉ có trim + lowercase: `::ffff:203.0.113.7` và `203.0.113.7`, hoặc IPv6 dạng đầy đủ và dạng rút gọn, sẽ ra hash khác nhau → rate limit theo `ipHash` bị lách được. **Fix:** chuẩn hoá bằng `net.isIP` + bỏ tiền tố IPv4-mapped (hoặc để caller đảm bảo, ghi trong JSDoc).

### [MINOR] m3 — `ok()` nhận mọi `status` — `src/lib/http/response.ts:4`
`fail()` có chặn 4xx/5xx còn `ok()` không chặn 2xx → có thể sinh `{success:true}` kèm mã 4xx. **Fix:** throw nếu `status` nằm ngoài 200–299, giống `fail()`.

## Checked OK
- `ok`/`fail` đúng shape `API_SPEC.md:35-36`; `details` mặc định `[]`; `fail()` không tự thêm stack/thông tin nội bộ (nội dung lộ ra hay không tuỳ caller truyền gì vào `error`/`details`).
- Slug: bỏ dấu tiếng Việt, `đ/Đ`→`d`, `.`→`-` (follow-up m3 có test `slug.test.ts:38-45`), cắt theo ranh giới từ, ≥10 case tiếng Việt, idempotent. Slug theo ngôn ngữ và tính duy nhất để cho hook (đúng scope).
- Phone: chuẩn hoá E.164 `+84…` khớp `ERD.md:396`; số chữ số full-width; ≥8 case; idempotent.
- ipHash: HMAC-SHA256, có test vector cố định, thiếu secret/IP rỗng thì throw.

## Verdict
**FAIL** — 2 MAJOR (M1, M2). Trả về builder: sửa M1 (hoặc ghi decision/CR) + bổ sung bằng chứng M2 (và sửa NFKD nếu lệch); MINOR tuỳ chọn.
