Agent: reviewer

# Review — feature-rental-share-buttons-s09 · phase-1-task-01 · round 1

- **Review level:** NORMAL
- **Reason:** Một trang công khai (S09), không đụng API/schema/auth. `ShareButtons` dùng chung chỉ được refactor nội bộ: logic sao chép tách ra hook `useCopyLink`, còn props, markup và hành vi giữ nguyên (đã đối chiếu từng dòng diff, test tin tức không bị sửa). Vì vậy không cần nâng STRICT.
- **Blast radius:** `PostDetail` → route `/[locale]/tin-bds/[slug]` (VI/EN). `ShareButtons` (tin tức `tin-tuc/[slug]/page.tsx:140`, tuyển dụng `JobDetail.tsx:111`) chỉ đổi qua hook `use-copy-link.ts`, hành vi tương đương. `icons.ts` chỉ thêm 2 export. i18n chỉ thêm khoá `page.posts.share.{button,menu}`, đủ ở cả vi và en.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | 231/232 file, 2467/2468 test PASS. Test fail duy nhất là lỗi có sẵn ngoài scope: `src/endpoints/public/job-applications.test.ts` "vị trí hết hạn … → 400" |
| `pnpm build` | Reviewer không chạy lại; dựa vào evidence builder (route `● /[locale]/tin-bds/[slug]`). `page.tsx` không đổi, chỉ thêm client island → không có nguồn dynamic mới. CSS build hiện có trong `.next/static/chunks/*.css` đã sinh đúng `calc(50% - var(--container-text) …)` và `calc(100% + 1rem)` |
| Browser 375/768/1280 | Không có browser tool. Bước kiểm trình duyệt do change-request thực hiện sau; reviewer review theo code và tính toán CSS |

## Responsive Checklist Gate (chỉ phần diff)
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang | OK | Rail ≥ xl: lề trái cột chữ ở 1280 = 640−384 = 256px. Rail rộng ≈ 54px, dịch thêm −(100%+1rem) → nằm ở khoảng 186–240px, vẫn trong viewport. Menu < sm nằm trong luồng, `flex-col` |
| Mobile-first `min-width` | OK | `sm:hidden` / `hidden sm:block xl:hidden` / `hidden xl:block` |
| Mỗi mốc chỉ một cụm, bản ẩn ra khỏi cây a11y | OK | < sm chỉ có compact; sm–<xl chỉ có row; ≥ xl chỉ có rail. Ẩn bằng `display:none`. Menu dùng thuộc tính `hidden` và Tailwind v4 đặt `[hidden]{display:none!important}` nên thắng class `flex` |
| Typography rem/token | OK (MINOR-3) | `text-small` theo token; rail dùng `text-xs` thay vì token `text-xsmall` |
| Media | N/A | Ảnh bìa không đổi |
| Touch target ≥ 44px | OK | `min-h-11 min-w-11` và `size-11` |
| Focus-visible | OK | `focus-visible:outline-2 … outline-focus-ring` trên mọi nút và link |
| Menu < sm (`aria-expanded`/`aria-controls`, Esc trả focus, bấm ngoài đóng) | OK | `PostShare.tsx:93-110`, có test |
| Rail sticky ≥ xl: top so với header, z-index, đè nội dung | **FAIL** | Xem MAJOR-1 |
| 100vh / reduced-motion | N/A | Không có chuyển động mới, không dùng vh |

## Skill gates
- aislop: skip, chưa nằm trong danh sách verify command được phép chạy.
- oxlint (anti-slop): skip, oxlint chưa được cấu hình (repo dùng eslint, PASS).
- ocr: skip, ocr chưa được cài.
- AI-readable: OK. Tên rõ ràng; hàm ≤ 50 dòng (`CompactShare` khoảng 70 dòng tính cả JSX, chấp nhận được với component); file 162 dòng; comment ghi lý do (WHY). Dưới 3 indicator.
- ai-friendly-web: N/A, không đổi robots, sitemap hay llms.
- blitzstrike: N/A, không phải NORMAL nhạy cảm.

## Findings

### [MAJOR-1] Ảnh bìa đè lên rail ≥ xl: rail bị ảnh che khi cuộn qua ảnh bìa
- **Vị trí:** `src/components/posts/PostShare.tsx:133` (rail không có z-index), `src/components/posts/PostDetail.tsx:54-60` (rail đứng trước ảnh bìa trong DOM).
- **Nguyên nhân:**
  - Wrapper rail là `absolute`, con của nó là `sticky` + `translate`, cả hai đều z-index auto.
  - `ResponsiveImage` bọc ảnh bằng `div.relative overflow-hidden` (`ResponsiveImage.tsx`), cũng là phần tử positioned, z auto, và nằm **sau** rail trong DOM.
  - Theo thứ tự vẽ CSS, các phần tử positioned cùng mức z được vẽ theo thứ tự DOM, nên ảnh bìa được vẽ **đè lên** rail.
- **Tính ở 1280:**
  - Gutter = 0.6rem + 1.7vw ≈ 31px.
  - Ảnh bìa (max-w-5xl) chiếm khoảng x = 128+31 = 159 → 1121.
  - Rail chiếm khoảng x = 186 → 240, tức nằm trọn trong bề ngang ảnh.
  - Ở 1536 và 1920 cũng trùng (ảnh tràn 128px − gutter mỗi bên, rail cần khoảng 70px).
- **Hậu quả:** Khi cuộn, rail dính `top-24` lướt qua ảnh 16:9 (cao khoảng 550px) và bị ảnh che hoàn toàn. Như vậy rail không còn "dính suốt phần đầu bài" theo S09/acceptance. Builder đặt `bg-surface` với giả định rail nằm trên ảnh, nhưng giả định này sai.
- **Fix đề xuất:** Thêm z-index token trên wrapper rail, ví dụ `z-(--z-raised)` (10). Giá trị này phải thấp hơn `--z-header` (30) để header sticky vẫn che rail khi cần. Có thể bổ sung test assert class z trên rail. Sau khi sửa, kiểm trình duyệt ở 1280 bằng cách cuộn qua ảnh bìa.

### [MINOR-1] Wrapper rỗng ở ≥ xl vẫn tạo thêm khoảng gap
- **Vị trí:** `PostShare.tsx:41`.
- **Mô tả:** Ở ≥ xl, `div.flex.flex-col.gap-2` của `PostShare` vẫn hiển thị (cả hai con đều `display:none`). Nó vẫn là một flex item trong header `gap-4`, nên dưới ngày đăng có thêm 16px trống.
- **Fix đề xuất:** Thêm `xl:hidden` cho wrapper ngoài.

### [MINOR-2] Thứ tự Tab ở ≥ xl: rail đứng trước `h1`
- **Vị trí:** `PostDetail.tsx:55`.
- **Mô tả:** Ở ≥ xl, rail nằm trước `<header>` trong DOM, nên người dùng bàn phím hoặc trình đọc màn hình gặp các nút chia sẻ trước tiêu đề `h1`.
- **Fix đề xuất:** Có thể đặt `PostShareRail` sau `<header>` trong wrapper `relative` (rail là `absolute inset-y-0` nên vị trí trong DOM không ảnh hưởng hình ảnh). Nếu giữ nguyên thì cần ghi lý do.

### [MINOR-3] Rail dùng class mặc định thay vì token dự án
- **Vị trí:** `PostShare.tsx:146`.
- **Mô tả:** Glyph Zalo trên rail dùng `text-xs` (mặc định Tailwind) thay vì token dự án `text-xsmall`.
- **Fix đề xuất:** Đổi sang `text-xsmall`.

### [MINOR-4] `title` của link chia sẻ hiện tiêu đề bài khi hover
- **Vị trí:** `PostShare.tsx:99,102,140,143`.
- **Mô tả:** `title={title}` trên các link icon của rail làm tooltip hiện tiêu đề bài thay vì hành động (ví dụ "Chia sẻ lên Facebook"). Code chép theo `ShareButtons` nên vẫn nhất quán.
- **Fix đề xuất:** Với rail chỉ có icon, nên dùng `title={t("facebook")}`. Không bắt buộc.

### Điểm đã kiểm OK
- `navigator.share` được gọi đồng bộ trong click handler (không có `await` nào trước đó) nên còn user gesture.
- `AbortError` được so theo `name`, khớp với cách tạo `DOMException` khác realm.
- Lỗi khác ngoài huỷ → mở menu.
- Bấm nút khi menu đang mở → đóng menu (toggle).
- Link ngoài có `target="_blank" rel="noopener noreferrer"`; URL được `encodeURIComponent`, có test với `?x=1&y=2`.
- Khi không có URL gốc, chỉ còn nút sao chép.
- Footer chia sẻ cuối bài đã bỏ.
- Rail nằm trong wrapper bao header → hết nội dung/thư viện ảnh, không bao form lead hay bài liên quan.
- `top-24` (96px) nằm dưới header sticky (h-16/lg:h-18).
- Test có ý nghĩa thực (hành vi, aria, focus, clipboard, vị trí DOM), không phải snapshot. Test tin tức không bị sửa. `page.test.tsx` chỉ thay assertion group đơn bằng test vị trí đầy đủ hơn.

## Verdict
**FAIL**, do còn MAJOR-1: z-order làm ảnh bìa che rail ≥ xl. Builder sửa MAJOR-1 (nên sửa kèm MINOR-1). Round 2 kiểm lại, kèm kiểm trình duyệt ở 1280.
