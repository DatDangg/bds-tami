---
id: isfilled-empty-richtext
type: bug
status: done
created: 2026-10-19
backlog: BL-012
---

# `isFilled` coi richText chỉ có 1 đoạn rỗng là "đủ"

## Yêu cầu
BUG (review L10-T02 round 4). `isFilled` — kiểm trường EN bắt buộc, dùng chung mọi collection — coi richText (Lexical) chỉ có 1 paragraph rỗng là đã điền → bản EN trống vẫn qua 422 duyệt pháp lý và tự bật `hasEnglish`.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: admin Payload; trang pháp lý + mọi collection có kiểm trường EN bắt buộc
- Bước tái hiện: bản EN, trường richText chỉ còn 1 đoạn rỗng (xoá hết chữ) → duyệt EN / lưu
- Expected: coi là chưa điền → 422 khi duyệt pháp lý; không bật `hasEnglish`
- Actual: coi là đủ → duyệt qua / `hasEnglish` = true

## Acceptance (bắt buộc)
- [x] richText rỗng (không con, hoặc chỉ paragraph/heading không có text khác khoảng trắng/linebreak) → `isFilled` = false
- [x] richText có text thật, hoặc node nội dung không phải text (upload, block…) → true
- [x] Test hồi quy cho các ca trên + duyệt pháp lý 422 + không bật `hasEnglish`
- [x] `pnpm test`/lint/typecheck/build PASS
