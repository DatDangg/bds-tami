Agent: reviewer

# Review — bug-careers-search-scroll-top · phase-1-task-01 · round 1 (BL-089)

- Review level: **NORMAL**
- Reason: một component trang công khai (`/tuyen-dung`) cùng một client component lá mới. Không đụng API, schema, auth, tenant hay shared hook. `Input` (ui) chỉ được dùng lại, không bị sửa. Có liên quan focus/a11y nên không chọn FAST.
- Blast radius: `src/components/careers/JobFilters.tsx` (chỉ trang tuyển dụng dùng bộ lọc này), `src/components/careers/JobKeywordInput.tsx` (mới, chỉ JobFilters dùng), `src/components/careers/JobFilters.test.tsx`. Không có consumer nào khác.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/components/careers` | PASS: 3 files, 50 tests |
| `pnpm typecheck` (`tsc --noEmit`) | PASS, không có lỗi |
| `pnpm exec eslint` trên 3 file đổi | PASS, không có output |
| `pnpm test` | 84 FAIL / 4574 pass / 13 skip (12 file fail / 432 pass). Toàn bộ 12 file fail nằm ở `tests/integration/*` (click-events, data-retention, health, job-applications, leads-export, media-upload, news-views, newsletter, private-file-download, rate-limit, rental-search, retranslate). Log có `ECONNREFUSED` và các test ghi "Redis thật"/"Redis + S3 thật". Đúng như builder báo: lỗi do hạ tầng Redis/S3 không chạy, không file nào trong `src/components/careers` fail. |
| `pnpm build` | Không chạy (tránh ghi đè `.next` khi máy có thể đang chạy dev server). Task file cũng không ghi kết quả build → Residual risk |

## Acceptance
- Scroll giữ nguyên: `<Form … scroll={false}>`. Bằng chứng Playwright của builder: 1920: 207→207, 390: 1252→1252 (trước fix về 0). Ảnh `bl089-after-390.png` cho thấy ô tìm và kết quả nằm trong khung nhìn. OK
- URL giữ tham số / no-JS: vẫn là `next/form` GET, `name="province"`, `name="q"`, hidden `category` không đổi. SSR render `defaultValue={keyword}` nên no-JS vẫn có từ khoá. OK
- Focus: bỏ `key` nên không còn remount. Builder đo được: bấm nút thì focus ở BUTTON, Enter thì focus ở `#job-filter-q`. Unit test khoá `after === input` và `toHaveFocus()`. OK
- Back/chip nạp lại ô: effect phụ thuộc `[keyword]`, gán `input.value` khi khác. Test rerender từ "tu van" sang "sale" PASS. Back về `/tuyen-dung` thì ô rỗng (bằng chứng builder). OK
- Test FAIL trước / PASS sau: hợp lý. Với code HEAD, test 1 thấy `scroll` là undefined nên fail. Test 2: `key` đổi làm input remount, nên `after !== input` và fail. Mock `next/form` chỉ giữ className/action/aria-label và bỏ các prop khác, nhưng các test cũ vẫn PASS nên mock không làm mất hành vi đang được test. OK

## Edge cases JobKeywordInput
- Effect chỉ chạy khi `keyword` đổi, và lần mount. Khi người dùng gửi đúng từ đang gõ thì `input.value === keyword` nên không làm gì, caret không nhảy. OK
- SSR/hydration: server và client cùng `defaultValue={keyword}`, không có thuộc tính nào phụ thuộc client, nên không mismatch. OK
- Ref: `Input` là function component spread `...props` từ `ComponentProps<"input">`, cách React 19 nhận ref như prop. `ref` đặt trước spread, còn `ref`/`defaultValue`/`value` đã bị `Omit` khỏi props nên không bị ghi đè. Typecheck PASS. OK

## Responsive Checklist Gate
Diff chỉ đổi hành vi (prop `scroll`, cơ chế đồng bộ ô). Class/layout giữ nguyên: `className` của ô và form không đổi.
- Layout / Typography / Media / Touch / Viewport: N/A. Không có thay đổi CSS/markup layout. Ảnh after 390 không có tràn ngang, mọi thứ như cũ.

## Skill gates
- aislop: skip, chưa cấu hình trong profile. Diff nhỏ (≈25 dòng), không có pattern slop.
- oxlint (anti-slop): skip, oxlint chưa cấu hình. Thay bằng eslint PASS.
- ocr: skip, ocr chưa cài.
- AI-readable: OK. Tên rõ ràng, hàm ≤ 10 dòng, comment nêu lý do (WHY) chứ không chỉ mô tả code, không có magic number. Cập nhật docstring JobFilters là đủ, luồng chính không đổi nên không cần README/ARCHITECTURE. Số indicator = 0.
- ai-friendly-web: N/A. Không đổi crawl surface.
- blitzstrike: N/A. NORMAL, không có input/auth mới.

## Findings
- **[MINOR-1]** `src/components/careers/JobKeywordInput.tsx:18-21`: effect cũng chạy ở lần mount (hydrate). Nếu người dùng gõ vào ô SSR trước khi JS hydrate xong thì `input.value !== keyword` và chữ vừa gõ bị ghi đè bằng `keyword`. Cách cũ dùng `key` không gây lỗi này. Cửa sổ thời gian rất ngắn nên không chặn PASS. Fix đề xuất: lưu keyword trước đó trong ref (`const prev = useRef(keyword)`) và chỉ gán khi `prev.current !== keyword`, rồi cập nhật `prev`.
- **[MINOR-2]** Residual chứ chưa phải lỗi: nếu trang chuẩn hoá `q` (vd trim) trước khi truyền `keyword`, thì sau Enter với "tu van " effect sẽ gán "tu van" vào ô đang focus, caret về cuối. Không mất focus. Không sửa.
- **[MINOR-3]** Acceptance có mục `pnpm build PASS` nhưng Repro Verification/Decision log không có bằng chứng build. Builder nên ghi kết quả build vào task file khi close-out.

## Ghi nhận form tương tự (không yêu cầu sửa trong task này)
- `src/components/listing/ListingHero.tsx:59-74`: **cùng root cause cả hai mặt**. `<Form>` không có `scroll={false}` nên sau tìm thì về đầu trang. Ảnh hưởng thật nhỏ vì form nằm trong hero ở đầu trang, scrollY thường đã gần 0, chỉ nhảy khi người dùng đã cuộn ra xa hero rồi focus lại ô. Ô `q` có `key={search.value ?? ""}` nên Enter làm đổi `q`, input remount và **focus rơi về body**. Đây là lỗi a11y thật, giống BL-089. Đề xuất task riêng: dùng lại `JobKeywordInput`, nên đổi thành component chung, vd `UrlSyncedInput` trong `components/ui` hoặc `listing`, kèm `scroll={false}`.
- `src/components/news/NewsSortControl.tsx:25-27`: **không cùng root cause khi có JS**. Có JS thì điều hướng qua `useListingFilterNav` (`scroll:false`). `<Form>` chỉ là đường fallback no-JS, mà no-JS thì luôn tải trang mới. Không có ảnh hưởng thực tế.

## Residual risk
- Không tự chạy Playwright. Hành vi scroll/focus trong trình duyệt dựa vào số đo và ảnh của builder (`bl089-{before,after}-{1920,390}.png`) cộng với unit test.
- `pnpm build` chưa được xác minh (xem MINOR-3).

## Verdict
**PASS**: không có CRITICAL/MAJOR. Repro Verification `PASS` có bằng chứng kiểm chứng được (unit test FAIL trước/PASS sau, số đo Playwright và ảnh).
