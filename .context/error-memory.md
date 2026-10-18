# Error Memory

## Purpose
Log errors encountered during development to prevent repeating the same mistakes.

## Format

```markdown
### Error {N}
- **Date:** YYYY-MM-DD
- **Task:** layer-{N}/task-{NN}
- **Error:** {Error message or description}
- **Root Cause:** {Why it happened}
- **Fix:** {How it was resolved}
- **Pattern:** {General lesson — applies to future tasks}
- **Prevention:** {How to avoid this in the future}
```

## Standing Rules (Pre-loaded)

These rules were learned from real bugs. Apply them to every task, not just when an error occurs.

### Rule 001 — Assert on shared contract, not implementation format
- **Pattern:** Tests that assert on backend response format (e.g. `expect(res.body.token)`) will pass even when the frontend can't parse the response — because they're locked to the current implementation, not the actual contract the client consumes.
- **Prevention:** Tests MUST assert on the shared contract: the same shape that the client-side `parse()` / type definition expects. If the client reads `body.data.token`, the test must assert `body.data.token`, not `body.token`.
- **Example fix:**
  ```js
  // ❌ Wrong — asserts implementation detail
  expect(res.body.token).toBeDefined();

  // ✅ Correct — asserts client contract
  expect(res.body.data.token).toBeDefined();
  expect(res.body.success).toBe(true);
  ```

### Rule 002 — All responses MUST go through shared helper (ok()/fail())
- **Pattern:** If one endpoint writes `res.json({token, user})` manually while all others use `ok({token, user})`, the format diverges silently. Tests pass, frontend breaks.
- **Prevention:** Never use `res.json()` directly for API responses. Always use the shared response helper (`ok()` / `fail()`). If the helper doesn't support a case, extend the helper — don't bypass it.
- **Enforcement:** Add a lint rule or grep check in CI: `res.json(` in route files should be flagged for review.

### Rule 003 — Write contract tests that simulate client parsing
- **Pattern:** Unit/integration tests only cover the server side. The client-side `parse()` function is never tested against real API responses, so format mismatches only surface in the browser.
- **Prevention:** For every auth/critical endpoint, write a contract test that:
  1. Calls the real endpoint
  2. Passes the raw response body through the client `parse()` function
  3. Asserts the parsed result matches expected shape
  ```js
  // Contract test example
  const res = await request(app).post('/auth/login').send(credentials);
  const parsed = parseLoginResponse(res.body); // actual client parser
  expect(parsed.token).toBeDefined();
  expect(parsed.user.id).toBeDefined();
  ```

## Entries

_Errors encountered during this project will be logged below._

## 2026-10-16 — Audit allowlist GHSA-vfj7-8cjw-p6xm (braces)
- `package.json` `pnpm.auditConfig.ignoreGhsas` bỏ qua advisory high `braces@3.0.3` (transitive sass/chokidar, build-time, chưa có bản vá).
- **Xem lại trước 2026-12-16**: có bản vá → gỡ khỏi allowlist.

## 2026-10-16 — Override endpoint Payload: không tự parse body (layer-1-task-02)
- Lỗi lặp 3 lần: override `POST /api/staff/reset-password` tự đọc JSON/formData → lệch parser của Payload (multipart `_payload`, file-first) → lách kiểm độ dài mật khẩu.
- Cách đúng: parse `req.clone()` bằng `addDataAndFileToRequest` (export từ `payload`) — cùng hàm handler mặc định dùng qua `wrapInternalEndpoints`; gắn lại `payload`, `routeParams` cho clone.
- `resetPassword` của Payload không chạy `beforeOperation` và `beforeValidate` nhận doc đã hash → kiểm plaintext phải ở endpoint.
- Residual: Local API `payload.resetPassword()` / GraphQL (đang tắt) không kiểm độ dài.

## 2026-10-16 — Public pipeline (layer-1-task-06), lưu ý cho task endpoint công khai
- `src/endpoints/_middleware/public-pipeline.ts` bọc `validate()` trong try/catch → MỌI lỗi thành 400 (log warn tên lỗi). Giữ `validate` chỉ parse + zod; KHÔNG đặt truy vấn DB/logic nghiệp vụ trong `validate` (bug thật sẽ thành "dữ liệu không hợp lệ"). Nếu cần, sửa pipeline: chỉ 400 cho SyntaxError/ZodError, còn lại ném tiếp.
- Nối endpoint vào pipeline phải truyền `remoteAddress` nếu có; prod bắt buộc `TRUST_CF_CONNECTING_IP=true` (xem layer-3-task-03).

## 2026-10-19 — Header 1 hàng ≥ xl tràn ở 1280 (feature-header-footer-design-debt phase-1-task-01, attempt 1)
- Review round 1 FAIL MAJOR-1: chỉ đo `scrollWidth` trong emulation không thanh cuộn (dư 17px) → bỏ sót chồng chéo; logo CMS + nhãn CTA không giới hạn rộng, menu `whitespace-nowrap` tràn đè logo/nút tìm mà không gây cuộn ngang.
- Cách đúng: giới hạn rộng phần tử từ CMS (logo `max-w` + `object-contain`, CTA `max-w` + `span.truncate` + `title`), đo bằng `getBoundingClientRect` khoảng cách giữa các cụm ở `clientWidth` có thanh cuộn (1280 → ~1265) với dữ liệu thật + tổ hợp xấu nhất.
