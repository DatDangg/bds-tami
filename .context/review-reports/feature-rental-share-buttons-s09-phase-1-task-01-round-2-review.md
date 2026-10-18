Agent: reviewer

# Review — feature-rental-share-buttons-s09 · phase-1-task-01 · round 2

- **Review level:** NORMAL
- **Reason:** Round 2 chỉ kiểm phần sửa theo round 1: class Tailwind (z-index, pointer-events, hidden), đổi thứ tự DOM của rail, đổi token chữ, đổi `title`. Không đụng API, schema, auth hay dữ liệu. `ShareButtons` dùng chung không bị sửa thêm so với round 1 (vẫn chỉ tách hook `useCopyLink`, props và markup giữ nguyên). Không có lý do nâng STRICT.
- **Blast radius:**
  - `PostDetail.tsx` → route `/[locale]/tin-bds/[slug]` (VI/EN).
  - `PostShare.tsx` (mới) chỉ dùng ở trang này.
  - `ShareButtons` (tin tức `tin-tuc/[slug]/page.tsx`, tuyển dụng `JobDetail.tsx`) không đổi thêm ở round 2.
  - `src/app/(payload)/admin/importMap.js` và `src/payload-types.ts` hiện "modified" nhưng `git diff` không có nội dung (chỉ khác line ending CRLF/LF). Không thuộc task và không ảnh hưởng gì.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | 231/232 file, 2468/2469 test PASS. Test fail duy nhất có sẵn từ trước, ngoài scope: `src/endpoints/public/job-applications.test.ts` "vị trí hết hạn … → 400" |
| `pnpm build` | Reviewer không chạy lại. Builder báo PASS, route `├ ● /[locale]/tin-bds/[slug]` vẫn ●, CSS có `z-index:var(--z-raised)`. Round 2 chỉ đổi class và thứ tự JSX, không thêm nguồn dynamic (`headers`/`searchParams`/`useSearchParams`) nên không đổi chế độ render |
| Browser 375/768/1280 | Không có evidence trình duyệt: dev server preview không chạy được (permission) và DB local không có bài đã xuất bản. Reviewer kiểm theo code và tính toán CSS (xem Residual risk) |

## Đóng finding round 1
| Finding | Trạng thái | Bằng chứng |
|---|---|---|
| MAJOR-1: ảnh bìa vẽ đè rail ≥ xl | **Đã đóng** | `PostShare.tsx:138` wrapper rail có `z-(--z-raised)` (= 10, `globals.css:160`). Ảnh bìa (`div.relative` trong `ResponsiveImage`, z auto) giờ nằm dưới rail. Test `PostShare.test.tsx:123` |
| MINOR-1: wrapper rỗng tạo khoảng trống ≥ xl | **Đã đóng** | `PostShare.tsx:42` có `xl:hidden`. Test `PostShare.test.tsx:106-109` |
| MINOR-2: rail đứng trước `h1` theo thứ tự Tab | **Đã đóng** | `PostDetail.tsx` đặt `<PostShareRail>` sau `</header>`, vẫn nằm trong wrapper `relative`. `page.test.tsx` assert `header` đứng trước `rail` trong DOM |
| MINOR-3: dùng `text-xs` mặc định | **Đã đóng** | `PostShare.tsx:150` dùng `text-xsmall` (token `globals.css:75`). Test `PostShare.test.tsx:129` |
| MINOR-4: `title` hiện tiêu đề bài | **Đã đóng** | `PostShare.tsx:102,106,147,150` dùng `t("facebook")`/`t("zalo")`. `PostShareRail` props còn `Pick<…,"url">`. `ShareButtons` không đổi. Test `PostShare.test.tsx:128` |

## Kiểm regression
- **pointer-events:**
  - Wrapper `pointer-events-none`, cụm sticky `pointer-events-auto` (`PostShare.tsx:138,143`).
  - `pointer-events` là thuộc tính kế thừa, nên các `<a>`/`<button>` con nhận `auto` và vẫn bấm được.
  - `pointer-events` không ảnh hưởng focus hay Tab, nên thao tác bàn phím giữ nguyên.
  - Hộp của wrapper không có nền, nên dù có z 10 cũng không che ảnh bìa bằng hình ảnh, và không chặn click vào ảnh.
- **Thứ tự z (lớp nào vẽ trên lớp nào):**
  - Rail 10 nằm dưới mọi lớp trên trang: `--z-sticky` 20, header dính `HeaderFrame.tsx:41` (30), submenu `DesktopNav` (30), `FloatingContact` (40), cookie (45), `MobileMenu`/sheet (50), dialog/Lightbox (60), SkipLink (70).
  - Wrapper `relative` trong `PostDetail` không tạo stacking context (không có z, transform hay isolate), nên rail so z trực tiếp với header trong cùng ngữ cảnh: header che được rail và rail không đè header, menu, nút liên hệ nổi hay dialog.
  - `top-24` (96px) nằm dưới header h-16/lg:h-18, nên ở trạng thái nghỉ rail cũng không chạm header.
- **Sticky sau khi đổi thứ tự DOM:**
  - Cha trực tiếp của phần tử sticky là wrapper `absolute inset-y-0`, cao bằng vùng `relative` (header → ảnh bìa → nội dung/thư viện ảnh). Thứ tự trong DOM không đổi hộp của nó.
  - Wrapper không đặt `top`, nên nó bắt đầu ở mép trên vùng `relative` (vị trí tĩnh khi `top: auto` cùng `inset-y-0` → top:0). Rail vẫn dính từ đầu bài và dừng trước form lead.
- **`ShareButtons` của tin tức/tuyển dụng:** `git diff` không đổi thêm ở round 2. `news-components.test.tsx` và `post-components.test.tsx` PASS nguyên vẹn trong `pnpm test`.

## Responsive Checklist Gate (chỉ phần diff)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang | OK | Ở 1280, rail nằm khoảng x = 186–240 (lề trái cột chữ là 256, trừ đi bề rộng rail và 1rem), vẫn trong viewport. Menu < sm nằm trong luồng, xếp `flex-col` |
| Mobile-first `min-width` | OK | `sm:hidden` / `hidden sm:block xl:hidden` / `hidden xl:block`. Wrapper ngoài có thêm `xl:hidden` |
| Mỗi mốc chỉ một cụm hiển thị | OK | < sm: chỉ compact. sm–<xl: chỉ row. ≥ xl: chỉ rail. Cụm ẩn dùng display none |
| Typography rem/token | OK | `text-small`, `text-xsmall` đều là token |
| Media | N/A | Ảnh bìa không đổi |
| Touch target ≥ 44px | OK | `min-h-11 min-w-11` / `size-11` |
| Nav/table | N/A | Không có nav hay table mới |
| Rail sticky ≥ xl: top, z-index, đè nội dung | OK (theo CSS math) | Xem mục Kiểm regression |
| 100vh / reduced-motion | N/A | Không dùng vh, không có chuyển động mới |
| Che lỗi bằng overflow:hidden | OK | Không dùng |

## Skill gates
- aislop: skip, chưa nằm trong danh sách verify command được phép chạy.
- oxlint (anti-slop): skip, oxlint chưa được cấu hình (repo dùng eslint, PASS).
- ocr: skip, ocr chưa được cài.
- AI-readable: OK, dưới 3 indicator.
  - Tên rõ ràng; z-index dùng token, không có magic number.
  - Doc comment ghi lý do (WHY).
  - File `PostShare.tsx` 164 dòng.
- ai-friendly-web: N/A, không đổi robots, sitemap hay llms.
- blitzstrike: N/A, không phải task STRICT nhạy cảm.

## Findings
Không có CRITICAL, MAJOR hay MINOR mới.

Nhận xét không chặn PASS:
- `PostShare.tsx:102,106`: link Facebook/Zalo trong menu < sm đã có chữ hiển thị, vậy mà vẫn kèm `aria-label`/`title` lặp lại nội dung. Điều này vô hại vì nhãn là câu hành động đầy đủ. Không cần sửa.

## Residual risk
- Chưa có evidence trình duyệt ở 375/768/1280, nhất là cảnh cuộn qua ảnh bìa ở 1280. Kết luận z-order, sticky và pointer-events dựa trên quy tắc CSS và giá trị token, chưa soi bằng mắt.
- Nên kiểm tay khi có một bài Đăng tin BĐS đã xuất bản trên staging. Cần xác nhận ở 1280: rail nằm trên ảnh bìa, rail trượt dưới header dính, và bấm được nút rail.

## Verdict
**PASS.** MAJOR-1 và MINOR-1..4 của round 1 đã đóng đúng, không thấy regression. Lint, typecheck và test PASS (fail sẵn ngoài scope không tính). Residual risk duy nhất là thiếu kiểm trình duyệt, đã ghi ở trên.
