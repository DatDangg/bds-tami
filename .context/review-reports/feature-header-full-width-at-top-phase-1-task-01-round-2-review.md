Agent: reviewer

# Review — feature-header-full-width-at-top · phase-1-task-01 · round 2 (BL-025, MODIFY)

- Review level: **NORMAL**
- Reason: delta nhỏ (thêm 1 khung bọc `{children}` + cập nhật 2 test) trên nền đã review STRICT ở round 1; không đổi chiều cao, offset, listener hay CSS toàn cục.
- Blast radius: `src/components/layout/HeaderFrame.tsx` (khung nội dung mới), `HeaderFrame.test.tsx`, `Header.test.tsx`. Consumer của `--header-offset`/`.site-header` không bị ảnh hưởng (chiều cao `<header>` vẫn `h-(--header-offset)`). Không đổi API/schema/data.
- Phạm vi: `git diff -- src/components/layout "src/app/(frontend)/globals.css"`; các file dirty khác nằm ngoài phạm vi.

## Verify commands + result

| Command | Result |
|---|---|
| `pnpm vitest run src/components/layout src/lib/contrast.test.ts src/components/home` | PASS: 26 file / 237 test |
| `pnpm lint` | PASS: 0 lỗi, 2 cảnh báo có sẵn ở `tools/task-dashboard/server.mjs` (ngoài phạm vi) |
| `pnpm typecheck` | PASS |

## Kiểm phần thay đổi (MINOR #1 của round 1)

- **Bố cục**: thanh (`flex h-full items-center`) → khung (`mx-auto flex h-full w-full max-w-[84rem] items-center`) → hàng (`Header.tsx:46` `flex h-16 w-full … lg:h-18 px-3 md:px-5 lg:px-6 xl:px-5`). Thanh có chiều cao xác định (lấy theo header) nên `h-full` của khung tính được; `items-center` giữ hàng 64/72px căn giữa dọc trong thanh phẳng 80/104px. Đệm ngang vẫn nằm trong hàng ở cả hai trạng thái. OK.
- **Hết nhảy ngang**: ở ≥ 84rem + lề, trạng thái phẳng có khung = 84rem căn giữa, trạng thái đã cuộn có thanh = 84rem căn giữa, nên khung không đổi vị trí và không còn lệch ~288px ở 1920. Ở 1280 vẫn lệch 16px (giảm từ 1280 xuống 1248, như round 1 đã chấp nhận). OK.
- **Chiều cao / offset**: không đổi (`h-(--header-offset)`, `p-0` / `data-[scrolled]:p*`). Không gây CLS. OK.
- **pointer-events**: khung thừa hưởng `auto` từ thanh, vùng lề của header vẫn `none`. OK.
- **Tràn ngang**: khung dùng `w-full` + `max-w` (rem), không có độ rộng cố định bằng px. 375/768/1280 ở trạng thái phẳng: khung lần lượt 375/768/1280; ở trạng thái đã cuộn bằng độ rộng thanh (359/752/1248). OK.
- **Test**: `HeaderFrame.test.tsx` lấy phần tử chứa text làm khung (khẳng định `mx-auto w-full max-w-[84rem]`) và `parentElement` làm thanh. `Header.test.tsx` đi theo thanh → khung → hàng `h-16 lg:h-18`. Cả hai bám đúng cấu trúc DOM mới, có ý nghĩa. Giới hạn: chỉ khẳng định class (residual giữ nguyên như round 1).
- Các điểm round 1 (hydration, listener passive + rAF + cleanup, specificity của variant, reduced-motion, contrast) không bị delta đụng tới; test vẫn PASS.

## Responsive Checklist Gate (diff đụng UI)

Không có trình duyệt nên xác minh bằng CSS math ở 375 / 768 / 1280.

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | Khung `w-full max-w-[84rem]` ≤ thanh ≤ viewport (số liệu ở trên) |
| Mobile-first media query | OK | Delta không thêm breakpoint; phần còn lại chỉ dùng `md:`/`lg:` (min-width) |
| Grid auto-fit/minmax | N/A | Không có grid |
| Container không fixed px | OK | `max-w-[84rem]` (rem) |
| Typography rem/clamp | N/A | Không đổi chữ |
| Spacing theo scale | OK | Đệm hàng theo scale Tailwind, không đổi |
| Media | N/A | — |
| Touch target ≥ 44px | OK | Hàng 64/72px, `min-h-11`/`min-w-11` không đổi |
| Nav mobile hamburger | OK | MobileMenu < xl không đổi |
| Table scroll | N/A | — |
| Không `100vh` đơn thuần | OK | Không dùng vh |
| `prefers-reduced-motion` | OK | Khung không có transition; header/thanh giữ `motion-reduce:transition-none` |
| Không che lỗi bằng `overflow:hidden` | OK | Không thêm overflow |

## Skill gates

- `aislop`: bỏ qua, không có trong danh sách verify command được phép.
- `oxlint`: bỏ qua, oxlint chưa cấu hình (ESLint qua `pnpm lint` 0 lỗi).
- `ocr`: bỏ qua, ocr chưa cài.
- AI-readable: OK. Comment trên khung giải thích lý do (WHY); file khoảng 50 dòng; 0 indicator.
- ai-friendly-web: N/A. blitzstrike: N/A.

## Findings

- **[MINOR]** `src/components/layout/HeaderFrame.tsx:42-45`: `max-w-[84rem]` giờ lặp ở 2 chỗ (`group-data-[scrolled]:max-w-[84rem]` trên thanh và trên khung). Hai giá trị phải luôn bằng nhau thì mới không nhảy ngang. Comment `84rem = …` (dòng 42) vẫn ghi "thanh nổi rộng hơn nội dung một chút", đúng với container trang nhưng chưa nhắc ràng buộc khung = thanh. Đề xuất (tuỳ chọn): gom thành 1 token/biến CSS, hoặc bổ sung comment rằng 2 giá trị phải bằng nhau. Không chặn PASS.
- MINOR #2 của round 1 (test chỉ kiểm chuỗi class, chưa đo CSS thật) vẫn là residual, không chặn.

Không có CRITICAL / MAJOR.

## Residual risk

- Chưa đo trên trình duyệt: bounding của khung trước/sau cuộn ở 1280/1920, chiều cao `.site-header` thực tế 80/104.

## Verdict

✅ **PASS**
