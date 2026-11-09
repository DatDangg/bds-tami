Agent: reviewer

# Review: bug-zalo-share-blank-page · phase-1-task-01 · round 1 (BL-105)

- Review level: **NORMAL**
- Reason: Đây là component UI dùng chung (`ShareButtons`), nhưng task không đụng auth, tenant, schema, API contract hay dữ liệu. Root cause đã được chứng minh trong change doc, và logic có test hồi quy. Không có risk đỏ nào bắt buộc phải review STRICT.
- Blast radius: `src/components/news/ShareButtons.tsx` được dùng ở 3 nơi:
  - chi tiết tin tức, biến thể `icons` (gồm hero `on-dark`);
  - tuyển dụng, biến thể `default`;
  - menu dự phòng của `src/components/detail/DetailShareButton.tsx` (Dự án / Cho thuê / Tin BĐS). Menu này chỉ mở khi trình duyệt không có Web Share, nên luôn đi nhánh nút Zalo sao chép link.
  
  Thêm 2 key i18n mới `page.news.share.zaloCopied` và `page.news.share.native`, có cả bản vi và en.
- Scope đã review: `git diff` của 4 file: `ShareButtons.tsx`, `news-components.test.tsx`, cùng `vi.json` và `en.json` (chỉ 2 key trên). Các file bẩn khác trong working tree nằm ngoài scope nên không review.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm vitest run src/components/news src/components/detail src/i18n` | **PASS**: 21 file, 185 test |
| `npx eslint src/components/news/ShareButtons.tsx src/components/news/news-components.test.tsx` | **PASS** (exit 0, không có output) |
| `pnpm typecheck` | Không chạy lại. Builder báo lỗi duy nhất nằm ở `src/globals/site-settings/social-links.test.ts`, là việc của một task khác chạy song song, ngoài scope. Diff của task này không đổi type export nào. |
| Kiểm tra `sp.zalo` | Đọc toàn bộ `ShareButtons.tsx`: chuỗi này chỉ còn trong comment dòng 51. Test khẳng định `not.toContain("sp.zalo.me")`. |

## Đối chiếu quyết định user (spec/changes/2026-11-05-zalo-share-blank-page.md)
| Quyết định | Code hiện tại | Đánh giá |
|---|---|---|
| Bỏ hẳn `sp.zalo.me/plugins/share`, không dùng SDK hay OA ID | Đã xoá thẻ `<a>` tới Zalo. Không tải script nào. | OK |
| Có `navigator.share` thì hiện nút "Chia sẻ" mở menu chia sẻ của hệ điều hành | Dòng 97-106 gọi `navigator.share({ title, url })`. Huỷ (AbortError) bị nuốt, có test ở dòng 267. | OK |
| Không có `navigator.share` thì nút "Chia sẻ qua Zalo" sao chép link và hiện thông báo | Dòng 107-112 là `<button>`, dùng `useCopyLink` thứ hai. Vùng status nhìn thấy được, kể cả ở biến thể `icons` khi `zaloActive`. Tự ẩn sau 3s. Lỗi clipboard hiện `copyFailed`. | OK |
| Câu thông báo "Đã sao chép liên kết — dán vào Zalo…" | Builder đổi "—" thành ":". `src/i18n/messages-check.test.ts:8` thật sự cấm gạch dài, nên đây là ràng buộc của repo, không phải tự ý đổi. Nghĩa câu giữ nguyên. | Chấp nhận. Nên báo user khi close-out. |
| Khi có Web Share, gộp nút Zalo và nút "thêm" thành 1 nút | Biến thể `icons` có 1 nút ShareNetwork (aria-label "Chia sẻ qua ứng dụng khác"). Nút "thêm" riêng không còn. | Đúng như task đề xuất ("builder gộp cho gọn") |
| Áp dụng mọi nơi có nút Zalo | Biến thể `default` (tuyển dụng) trên thiết bị có Web Share hiện nút "Chia sẻ" thay Zalo. `DetailShareButton` không đổi gì. | Khớp quyết định "Mobile: nút Chia sẻ". OK |
| Không lệch hydrate | `useCanNativeShare` trả `false` ở server, nên server render nút Zalo. | OK |

## Responsive Checklist Gate
Không có browser. Phần dưới xác minh bằng CSS/class.

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang | OK | Container là `flex flex-wrap`. Thông báo Zalo ở biến thể `icons` dùng `w-full`, nên xuống dòng riêng chứ không đẩy ngang. Không thêm width `px` cố định nào. |
| Mobile-first / grid | N/A | Diff không có media query hay grid. |
| Typography rem / token | OK | Dùng token `text-small` sẵn có, không thêm font-size `px`. |
| Media | N/A | Không có ảnh hay video. |
| Touch target ≥ 44px | OK | Nút mới dùng lại `ACTION_CLASS` (`min-h-11 min-w-11`) và `ICON_CLASS` / `ICON_ON_DARK_CLASS` (`size-11`). |
| Nav mobile / table | N/A | Không áp dụng. |
| 100vh / reduced-motion / overflow-hidden | N/A | Không thêm animation, không dùng `100vh`, không dùng `overflow:hidden`. |
| Tương phản tone on-dark | OK (theo code) | Status dùng `text-on-dark` khi `onDark`, `text-text-secondary` ở các trường hợp còn lại. |

Residual risk: chưa soi bằng mắt bố cục hero tối ở 375/768/1280 khi thông báo hiện ra. Dòng thông báo `w-full` sẽ đẩy nội dung bên dưới xuống trong 3s. Đây là thay đổi do người dùng bấm, chấp nhận được.

## Skill gates
- aislop: skip, không có trong verify commands được allow. Đọc tay không thấy dấu hiệu AI-slop đáng kể, chỉ một fragment thừa (xem m2).
- oxlint (anti-slop): skip, chưa cấu hình oxlint (không có `.oxlintrc.json`). ESLint PASS.
- ocr (open-code-review): skip, ocr chưa được cài.
- AI-readable: OK. Có 2 indicator nhỏ: comment JSDoc `variant` lỗi thời (m3) và fragment thừa (m2). Ngưỡng FAIL là 3 nên chưa tới. Hàm component khoảng 80 dòng, chủ yếu là JSX; trước diff đã khoảng 75 dòng.
- ai-friendly-web: N/A, task không liên quan crawl/SEO.
- blitzstrike: N/A, không phải review STRICT. Link mới không nhận input người dùng; URL chỉ được ghi vào clipboard.

## Findings
**CRITICAL:** không có.
**MAJOR:** không có.

**[MINOR] m1 — Thông báo Zalo che mất thông báo sao chép thường.**
- Vị trí: `src/components/news/ShareButtons.tsx:54-62`.
- Lỗi: nếu bấm Zalo rồi bấm "Sao chép liên kết" trong vòng 3s, status vẫn hiện "dán vào Zalo" vì `zaloActive` được ưu tiên.
- Mức ảnh hưởng: thấp, vì cả hai đều sao chép cùng một URL.
- Cách sửa đề xuất (tùy chọn): lấy thông báo theo hành động bấm gần nhất. Có thể giữ 1 state `lastAction`, hoặc dùng 1 `useCopyLink` kèm loại thông báo.

**[MINOR] m2 — Fragment thừa sau khi xoá thẻ `<a>` Zalo.**
- Vị trí: `ShareButtons.tsx:82-96`.
- Lỗi: `<>…</>` giờ chỉ bọc một phần tử.
- Cách sửa: bỏ fragment.

**[MINOR] m3 — JSDoc của prop `variant` đã lỗi thời.**
- Vị trí: `ShareButtons.tsx:14-15`.
- Lỗi: vẫn ghi `+ nút "thêm" Web Share API`, trong khi nút này nay thay cho Zalo.
- Cách sửa: cập nhật một dòng mô tả.

**[MINOR] m4 — Test Web Share của biến thể `icons` chưa khẳng định hết hành vi gộp nút.**
- Vị trí: `news-components.test.tsx:267`.
- Thiếu: test chưa khẳng định nút Zalo biến mất trong biến thể `icons`. Tên test vẫn gọi là "nút 'thêm'".
- Cách sửa: thêm `expect(queryByRole("button", { name: "Chia sẻ qua Zalo" })).toBeNull()`.

**[MINOR] m5 — Trình duyệt desktop có Web Share sẽ không thấy nút Zalo sao chép link.**
- Phạm vi: Chrome trên Windows/ChromeOS và Safari trên macOS đều có `navigator.share`. Người dùng ở các trình duyệt này sẽ nhận menu chia sẻ của hệ điều hành, không có nút Zalo sao chép link.
- Đánh giá: đây không phải lỗi so với quyết định, vì user định nghĩa mobile/desktop theo việc có API hay không. Đây là residual risk, nên báo user khi close-out.

**[MINOR] m6 — `.context/design-spec.md` (khoảng dòng 553 và 608) vẫn mô tả Zalo là link.**
- Hiện trạng: builder đã ghi đề xuất sửa vào task, nhưng chưa sửa vì file đang bẩn ngoài scope.
- Việc cần làm: primary nên reconcile khi close-out, hoặc tạo follow-up.

## Bug repro closure
- Repro status của builder: PASS.
- Có thể kiểm chứng qua test hồi quy, gồm 3 điểm:
  - không còn link Zalo hay chuỗi `sp.zalo.me` trong DOM;
  - nhánh desktop sao chép đúng URL, thông báo nhìn thấy được, và báo lỗi khi clipboard lỗi;
  - nhánh Web Share gọi `navigator.share` với đúng `title` và `url`.
- Đối chiếu với root cause: root cause nằm ở chính endpoint Zalo đã chết. Endpoint này đã bị xoá khỏi code, nên evidence ở mức unit/jsdom là đủ để đóng bug.
- Residual risk: chưa thử share sheet thật trên thiết bị mobile.

## Verdict: PASS
Không có CRITICAL hay MAJOR. Các MINOR m1-m4 có thể sửa kèm nếu tiện, không chặn commit. m5 và m6 cần báo user hoặc reconcile doc khi close-out.
