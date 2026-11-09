---
id: admin-validation-error-english-toast
type: bug
status: done
created: 2026-11-06
---

# Lỗi validate trong admin hiện toast tiếng Anh "The following field is invalid: …" (BL-113)

## Yêu cầu
Admin chỉ bật tiếng Việt (`src/payload.config.ts` i18n `vi`), nhưng mọi lỗi do hook của dự án ném ra bằng
`new ValidationError({...})` đều hiện toast tiếng Anh, kèm thông báo tiếng Việt dưới field → người dùng thấy
2 thông báo, 1 Anh 1 Việt, tưởng là 2 lỗi.

## Bối cảnh / tái hiện (bug)
- Màn/route/role: production https://tamihomes.vn/admin → Staff → Create New, role admin.
- Bước tái hiện: tạo Staff với mật khẩu < 10 ký tự → Save.
- Expected: 1 thông báo tiếng Việt (vd toast "Trường sau không hợp lệ: Mật khẩu" + lỗi dưới field "Mật khẩu tối thiểu 10 ký tự.").
- Actual (screenshot user 2026-11-06, form "Nhân viên mới", mật khẩu 7 ký tự): CHỈ có toast tiếng Anh
  `The following field is invalid: password`; dưới ô "Mật khẩu mới" KHÔNG hiện thông báo
  `Mật khẩu tối thiểu 10 ký tự.` → người dùng không biết vì sao lỗi. Cần kiểm vì sao lỗi field `password`
  (auth field) không gắn vào ô trên form; cách chắc nhất là đưa luôn lý do vào message toast.

## Root cause (đã chứng minh bằng code)
`node_modules/payload/dist/errors/ValidationError.js`: `constructor(results, t)` — không truyền `t` thì message
lấy cứng `en.translations.error.followingFieldsInvalid_one`. Các chỗ ném trong dự án đều không truyền `req.t`
(và không truyền `label`, nên hiện tên path `password` thay vì nhãn):
- `src/collections/Staff.ts:32` (độ dài mật khẩu)
- `src/hooks/categories/validate-tree.ts:69`
- `src/hooks/leads/lead-activity-hooks.ts:45`
- `src/hooks/leads/sync-phone-normalized.ts:38`
- `src/hooks/require-english-fields.ts:101`
- `src/hooks/staff/last-admin-guard.ts:61`, `:108`

## Rà soát toàn bộ (2026-11-06, đọc code — chưa chạy trình duyệt)

| # | Chỗ | Lỗi gì | Toast | Lý do tiếng Việt có thấy không |
|---|-----|--------|-------|-------------------------------|
| 1 | `Staff.ts:32` tạo/đổi mật khẩu < 10 ký tự | `password` | EN `…invalid: password` | **Không** (đã thấy qua screenshot — ô mật khẩu auth không nhận lỗi) |
| 2 | `last-admin-guard.ts:61` hạ role / tắt active admin cuối | `role`/`active` | EN `…invalid: role` | Có thể (dưới ô) — cần kiểm |
| 3 | `last-admin-guard.ts:108` sửa/xoá hàng loạt chạm admin | path `where` | EN `…invalid: where` (vô nghĩa) | **Không** — không có ô `where` |
| 4 | `require-english-fields.ts:101` bật hasEnglish thiếu bản EN | trường EN (title, …) | EN `…invalid: title, …` | **Dễ không** — lỗi gắn bản `en`, người dùng thường đang ở tab `vi` |
| 5 | `sync-phone-normalized.ts:38` sửa thông tin khách của lead đã ẩn danh | fullName/phone/… | EN | Có thể (dưới ô) |
| 6 | `validate-tree.ts:69` danh mục quá 2 cấp / khác scope | `parent` | EN `…invalid: parent` | Có thể (dưới ô) |
| 7 | `lead-activity-hooks.ts:45` mã lead sai | `lead` | EN | Có thể (ít gặp từ UI) |
| 8 | `delete-cv-and-audit.ts:21` xoá hồ sơ ứng tuyển khi S3 lỗi | `throw new Error` (500) | EN **`Something went wrong.`** — Payload giấu message | **Không** |

Không bị: các `APIError(..., 4xx, …, true)` tiếng Việt (xoá media/phường/tỉnh/tin tuyển dụng đang dùng,
slug locale all, siteName thiếu) — hiện nguyên message tiếng Việt. `Forbidden(req.t)` — đã dịch.

## Acceptance (bắt buộc)
- [ ] 8 chỗ trên: toast tiếng Việt, nêu thẳng lý do (không chỉ tên path kỹ thuật như `password`/`where`).
- [ ] #8: đổi sang `APIError` tiếng Việt public (vd "Không xoá được CV trên kho lưu trữ, thử lại sau").
- [ ] Mọi `new ValidationError` trong `src/` truyền `req.t` (và `req` / `label` để hiện nhãn tiếng Việt) → toast tiếng Việt.
- [ ] Repro tạo Staff mật khẩu 9 ký tự: không còn chuỗi tiếng Anh trên màn hình, và người dùng thấy rõ lý do "Mật khẩu tối thiểu 10 ký tự." (dưới ô hoặc trong toast).
- [ ] Ô "Mật khẩu mới" ghi sẵn gợi ý "Tối thiểu 10 ký tự" để không phải đoán.
- [ ] Test unit cho ít nhất 1 hook khẳng định message không chứa "The following field".

## Ghi chú
Chỉ đổi hiển thị lỗi, không đổi luật validate (mật khẩu vẫn tối thiểu 10 ký tự).
