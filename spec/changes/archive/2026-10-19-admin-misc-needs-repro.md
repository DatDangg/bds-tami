---
id: admin-misc-needs-repro
type: bug
status: done
completed: 2026-10-20
created: 2026-10-19
---

# Admin: vỡ dấu tiếng Việt, tràn ngang mobile, toast "Fetching user failed" (bug #05 #10 #16) — cần tái hiện

## Hiện tượng
- #05 Văn bản trong Lexical hiển thị vỡ dấu kiểu `mặt bằ` `ng`, `tư vấ` `n`.
- #10 Form chi tiết admin ở 375px rộng 391–435px → cuộn ngang.
- #16 Chuyển trang nhanh bắn toast đỏ `Fetching user failed: Failed to fetch`.

## Đối chiếu code (chưa có root cause)
- #05: không có ký tự tổ hợp (NFD) nào trong `src/` → nghi do dữ liệu nhập/dán (NFD từ macOS/Word) hoặc do công cụ trích văn bản của người báo. Cần: id bản ghi + ảnh màn hình thật. Nếu xác nhận dữ liệu NFD → normalize NFC ở hook lưu (beforeChange).
- #10: cần collection/form cụ thể + phần tử gây tràn; **không** vá bằng `overflow-x: hidden` toàn cục (che lỗi, cắt nội dung).
- #16: toast nằm trong `AuthProvider` của Payload (`@payloadcms/ui` providers/Auth, `fetchFullUser`), không phải `SessionKeepAlive` → bắt AbortError trong KeepAlive **không** sửa được. Hướng: xác định request bị abort rồi cân nhắc patch-package / báo upstream.

## Thông tin tái hiện (user, 2026-10-20)
Ảnh minh chứng user nêu (`04_rentals_edit_desktop.png`, `02_account_mobile.png`, `04_rentals_edit_mobile.png`, `09_projects_edit_mobile.png`, `07_leads_edit_mobile.png`) **không có trong repo** — builder tự tái hiện trên dev.

### #05 Vỡ dấu Lexical
- Bản ghi: `rentals` id `0e6b861d-b775-4d73-bf39-c22ab100a609` — `http://localhost:3000/admin/collections/rentals/0e6b861d-b775-4d73-bf39-c22ab100a609`, ô "Mô tả — vi" (`description`).
- Từ vỡ: `mặt bằ` `ng`, `tầ` `ng 1-2`, `Tây Hồ` `,`, `tiề` `n lớn`, `Nội thấ` `t`, `tư vấ` `n`.
- Giả thuyết user: dữ liệu lưu NFD + font Lexical tách dấu thanh. **Cần xác minh**: query DB xem `description` có ký tự tổ hợp (U+0300–U+036F) không, và dữ liệu do seed hay nhập tay. Lưu ý mẫu vỡ toàn rơi vào chữ có dấu thanh trước phụ âm cuối → có thể là tách text node/format trong Lexical chứ không chỉ NFD.

### #10 Tràn ngang 375px
| Form | Rộng đo |
|---|---|
| `/admin/account` | 435px |
| `/admin/collections/rentals/[id]` | 431px |
| `/admin/collections/projects/[id]` | 411px |
| `/admin/collections/leads/[id]` | 391px |
- Giả thuyết user: `nav__header`, `nav__header-content`, controls header form có min-width cố định. **Cần xác minh** phần tử gây tràn bằng DevTools (scrollWidth từng node). Vẫn giữ luật: không vá bằng `overflow-x: hidden` toàn cục — sửa min-width/wrap của đúng phần tử.

### #16 Toast "Fetching user failed: Failed to fetch"
- Tái hiện: đăng nhập admin, bấm chuyển nhanh Dashboard → Cho thuê → Lead trong 1–2 giây.
- Giả thuyết user: `src/components/admin/SessionKeepAlive.tsx` gọi refresh token khi đổi route, request bị abort → AuthProvider của Payload bắt AbortError và bật toast. **Cần xác minh** request nào bị abort (Network tab) — đối chiếu ghi chú trên: toast phát ra từ `fetchFullUser` của AuthProvider; nếu chính KeepAlive kích hoạt request đó thì sửa ở KeepAlive (debounce/không refresh khi đổi route) là hợp lệ.

## Acceptance
- [x] Mỗi mục có bước tái hiện + root cause trước khi sửa.
- [x] #05: nội dung lưu dạng NFC, hiển thị đúng.
- [x] #10: không cuộn ngang ở 375px trên các form admin chính.
- [x] #16: chuyển trang nhanh không còn toast lỗi giả; lỗi mạng thật vẫn báo.

## Kết quả (2026-10-20, change-request — user ủy quyền tự quyết)
| Bug | Root cause | Fix | Commit | Review |
|---|---|---|---|---|
| #05 | Lexical (editor + diff) dùng `var(--font-serif)` = Georgia, thiếu glyph nguyên âm 2 dấu tiếng Việt trên Windows; dữ liệu đã NFC (0/32 dòng lệch) | admin `--font-serif: var(--font-body)` (Montserrat subset vietnamese) | d3b62fb | FAST PASS r1 |
| #10 | Payload 3.91: breadcrumb `.app-header__step-nav-wrapper` không co → nút ngôn ngữ/avatar tràn; `.payload-settings::before/::after` rộng 100% + 5×base ở màn tài khoản | wrapper `min-width:0; overflow-x:auto`; vạch kẻ `width:auto; right:-gutter` (không overflow-x:hidden toàn cục) | c961292 | NORMAL PASS r1 |
| #16 | Payload AuthProvider toast mọi lỗi mạng của `GET /api/staff/me` (mount); dashboard dùng `<a href>` → tải lại toàn trang, request mount bị huỷ khi bấm nhanh. Không phải SessionKeepAlive | link dashboard/banner → `next/link`; provider `NavigationToastGuard` ẩn toast khi trang đang rời đi | a8e98d8 | STRICT FAIL r1 → PASS r2 |

**Quyết định agent (user ủy quyền 2026-10-20):** không thêm hook normalize NFC (dữ liệu đã NFC); không patch node_modules; chấp nhận vạch kẻ màn tài khoản desktop ngắn hơn 36px; dashboard/danh sách tràn 375px tách thành BL-024.
**Spec:** 1.17.0 (không bump — bug thuần) · scope v21.
**Residual:** xem mục Residual risk trong `tasks/bug-admin-misc-needs-repro/phase-1-task-0{1,2,3}.md`.
