Agent: reviewer

# Review — feature-header-footer-design-debt · phase-1-task-01 · round 2

- Task: `tasks/feature-header-footer-design-debt/phase-1-task-01.md` (BL-001). Round 1: FAIL (MAJOR-1 tràn 1280, MINOR-1 lệch tâm 768, MINOR-2 cache logo)
- Diff attempt 2: `src/components/layout/BrandLogo.tsx`, `src/components/layout/Header.tsx`, `src/components/layout/Header.test.tsx` (phần còn lại của task giữ nguyên như round 1)

## Review level
**STRICT**

## Reason
Component khung trang dùng chung cho mọi trang công khai (`/`, `/en`): header, menu toàn màn hình, footer. Có navigation và view model lấy từ CMS (logo, CTA).

## Blast radius
- `BrandLogo` (header 2 bản, `MobileMenu`, `Footer`): thêm `max-w-[7.5rem] object-contain object-left` cho mọi nơi dùng.
- `Header`: logo `xl:max-w-[6rem]`, CTA `max-w-[10rem]` + `span.truncate` + `title`.
- Không đổi view model, cache, schema hay API.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (eslint, không có lỗi) |
| `pnpm typecheck` | PASS |
| `pnpm vitest run src/components/layout` | PASS: 12 file / 82 test |
| `pnpm test` | 227/228 file, 2437/2438 test. Fail duy nhất là `job-applications.test.ts` "vị trí hết hạn … -> 400", đã fail từ trước và được chấp nhận |
| `pnpm build` | Không chạy lại. Builder báo PASS. Diff chỉ đổi className/JSX, typecheck PASS |
| Trình duyệt | Reviewer không có công cụ trình duyệt. Kiểm bằng phép tính CSS và số đo builder ghi ở mục "Attempt 2" |

## Kiểm trọng tâm round 2
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Chuyển `xl:max-w-[6rem]` từ BrandLogo sang `className` của Header không làm đổi CSS kết quả | OK | `cn` = `twMerge(clsx(...))` (`src/lib/utils.ts:27-28`). `max-w-[7.5rem]` (không variant) và `xl:max-w-[6rem]` (variant `xl`) thuộc hai nhóm xung đột khác nhau trong tailwind-merge 3, nên cả hai được giữ. Tailwind 4 sinh rule có variant `xl:` sau rule gốc, nên ở ≥ xl thì 6rem thắng. Kết quả class trên `<img>` giống lúc builder đo. `Header.test.tsx:77` xác nhận img có cả `max-w-[7.5rem]` lẫn `xl:max-w-[6rem]` |
| MAJOR-1: không chồng lấn ở 1280 có thanh cuộn | Đóng | Số đo thật ở `clientWidth` 1265 (có thanh cuộn) với CTA thật trong DB dev: khoảng trống giữa nav và logo/nút tìm là 24.6px (`/`) và 27.4px (`/en`). Tổ hợp xấu nhất (logo bị chặn 96px + CTA bị chặn 160px): 13.7px và 8.6px, vẫn ≥ 0. `docScrollW = clientWidth`. Phép tính CSS khớp: trước fix tổ hợp xấu nhất là −3.4px với logo 120px. Chặn logo xuống 96px được thêm 24px, nên còn khoảng +20.6px trước khi trừ phần đệm CTA `xl:px-4` (nhỏ hơn `lg:px-5`). Kết quả này khớp bậc độ lớn với 8.6px đo được. Logo và CTA giờ đều có chiều rộng tối đa, nên nội dung CMS không thể làm vượt mức này |
| CTA không tự co gây méo | OK | `buttonVariants` gốc có `shrink-0 whitespace-nowrap` (`button.tsx:8`). `max-w-[10rem]` tính cả padding (border-box). Span con là flex item có `overflow:hidden` nên min-width bằng 0 và ellipsis hoạt động. Cụm phải `xl:flex-none` |
| Tên truy cập CTA khi bị cắt chữ | OK | Chữ đầy đủ vẫn nằm trong DOM (`span`), chỉ bị cắt khi hiển thị, nên tên truy cập là nhãn đầy đủ. `title` hiện nhãn đầy đủ khi rê chuột. CTA trong menu toàn màn hình không bị cắt |
| Không regress logo tĩnh, footer, menu toàn màn hình | OK | Logo tĩnh 800×416: ở `h-10` rộng ≈ 76.9px, ở `lg:h-12` rộng ≈ 92.3px. Cả hai đều < 96px (6rem) và < 120px (7.5rem), nên không bị chặn và không đổi hình. Logo CMS quá ngang: `h-*` cố định + `max-w` → hộp nhỏ lại, `object-contain` giữ tỉ lệ, không méo. Footer (`self-start`) và MobileMenu chỉ chịu mức 7.5rem |
| MINOR-1 (768) | Đóng | Đo có CTA: lệch tâm −2.6px (`/`), 0px (`/en`). Không cuộn ngang |
| MINOR-2 (cache logo 60s) | Giữ là residual | Trong ngưỡng ARCHITECTURE §5.1. Không bắt buộc sửa |
| Acceptance task-01 | OK | 1 hàng ở ≥ xl. CTA theo locale, ẩn khi thiếu. Logo CMS có fallback. Menu mở được ở ≥ xl và không tự đóng. Test đã cập nhật. Lint, typecheck, test PASS (trừ fail đã có từ trước). Không có hạng mục của task-02 nào được tính |
| Surgical diff | OK | Attempt 2 chỉ chạm 3 file liên quan MAJOR-1/MINOR-1. Comment giải thích WHY. Không có refactor ngoài phạm vi |
| Khôi phục DB dev sau khi đo | Ghi nhận | Builder ghi đã trả `ctaButton` về `label: null, link: null` qua Local API, không reset hay seed. Reviewer không kiểm được DB (ngoài quyền) |

## Responsive Checklist Gate
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang / không chồng 375 | OK | CTA `hidden` < md. Diff attempt 2 không đổi gì ở mức < md. Logo 77px < 120px |
| Không cuộn ngang / lệch tâm 768 | OK | Đo −2.6px / 0px, không cuộn ngang |
| Không tràn / không chồng 1280 | OK | Xem MAJOR-1 ở trên: khoảng trống ≥ 8.6px trong tổ hợp xấu nhất, có thanh cuộn |
| Mobile-first `min-width` | OK | Chỉ dùng tiền tố tăng dần |
| Container không dùng px cố định | OK | Không đổi (`max-w-container`, `px-gutter`) |
| Typography/spacing dùng rem | OK | Giới hạn mới dùng `rem` (7.5rem, 6rem, 10rem) |
| Media giữ tỉ lệ | OK | `w-auto` + `max-w` + `object-contain`, có `width`/`height` thật |
| Touch target ≥ 44px | OK | CTA `min-h-11` giữ nguyên. Link logo `min-h-11 min-w-11` |
| Nav mobile | OK | Nút Menu có ở mọi breakpoint |
| Table / `100vh` / reduced-motion | N/A | Không đổi |
| Không che lỗi bằng `overflow:hidden` | OK | `truncate` chỉ đặt trên nhãn CTA, kèm tên đầy đủ (DOM + `title`) và nhãn trọn trong menu. Không che phần tràn của layout |

## Skill gates
| Gate | Kết quả |
|---|---|
| aislop | skip: không có trong danh sách verify command được phép chạy |
| oxlint (anti-slop) | skip: oxlint chưa được cấu hình (repo dùng eslint, `pnpm lint` PASS) |
| ocr | skip: ocr chưa cài |
| AI-readable | OK: 0 indicator. Hàm ngắn, comment nêu lý do kèm số đo |
| impeccable / frontend-checklist | OK |
| ai-friendly-web | N/A: không đổi robots/sitemap/llms |
| blitzstrike | skip: không có môi trường. Diff không có bề mặt bảo mật mới |

## Findings

### [MINOR-1] Bằng chứng tổ hợp xấu nhất dựa trên DOM giả lập
- Vị trí: task file, mục "Attempt 2"
- Con số 8.6px ở `/en` có được khi chèn logo 3:1 và CTA 160px bằng DOM, không phải logo thật upload qua CMS. Phép tính CSS ở trên khớp với con số này, nên không chặn PASS.
- Nhãn 7 mục menu cũng lấy từ CMS và không có giới hạn chiều rộng. Đây là rủi ro có từ L5, không do task này gây ra. Ghi residual (ngoài scope).

### [MINOR-2] Cache logo tới 60s (chuyển từ round 1)
- Vị trí: `src/components/layout/load-shell.ts:63-64`. Chỉ ghi residual, không bắt buộc sửa.

## Residual risk
- Reviewer chưa kiểm bằng trình duyệt. Kết luận responsive dựa trên phép tính CSS cộng với số đo builder ghi lại.
- Nhãn mục menu từ CMS dài hơn hiện tại có thể làm hàng 1280 hết chỗ. Ngoài scope; đề xuất tạo task riêng nếu cần.
- Không xác minh được việc builder đã khôi phục DB dev.
- Reviewer không chạy lại `pnpm build`.

## Verdict
**PASS**: 0 CRITICAL, 0 MAJOR. MAJOR-1 của round 1 đã đóng: logo và CTA từ CMS đều có chiều rộng tối đa, và số đo có thanh cuộn ở 1265px còn ≥ 8.6px trong tổ hợp xấu nhất. Không regress logo tĩnh, footer hay menu toàn màn hình. Responsive gate không có mục FAIL.
