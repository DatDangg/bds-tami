Agent: reviewer

# Review: bug-project-detail-layout-fixes, phase-1-task-01, round 1 (BL-071)

- **Review level:** NORMAL
- **Reason:** Đây là bug layout, gói trong khối Tổng quan chi tiết Dự án. `DetailStatCards` là component dùng chung theo tên, nhưng Grep cho thấy trong `src` chỉ `ProjectOverview.tsx:66` dùng nó. `formatAreaRange` có đúng 2 nơi gọi, cả hai chỉ để hiển thị trong UI. Không đụng auth, API, schema hay SEO text, nên không cần nâng lên STRICT.
- **Blast radius:**
  - `src/components/detail/DetailStatCards.tsx`: chỉ thẻ Sản phẩm của Dự án dùng. Cho thuê và Tin BĐS không dùng `DetailStatCards` (Grep), nên không bị ảnh hưởng.
  - `src/components/projects/ProjectOverview.tsx`: bố cục Tổng quan.
  - `src/lib/projects/project-detail-view.ts` `formatAreaRange` có 2 nơi gọi:
    - `ProjectOverview.tsx:58`: `note` của thẻ.
    - `ProjectDetail.tsx:83`: ô "Diện tích" của `DetailSpecBar`. Ở đây chuỗi có thể nằm trong `dd[title]`, và NBSP trong title không gây hại.
  - Không có chỗ nào dùng chuỗi này cho JSON-LD, meta, llms, sitemap, export/CSV hay so khớp chuỗi. Grep `formatAreaRange` trên toàn `src` chỉ ra 2 nơi trên.

## Verify commands + result

| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | PASS (tsc --noEmit, không lỗi) |
| `pnpm vitest run src/components/detail src/components/projects src/lib/projects` | PASS, 22 file / 231 test |
| `pnpm lint` (eslint .) | PASS, không có output lỗi |
| `pnpm build` | Không chạy theo chỉ thị (dev server đang giữ `.next`). Rủi ro thấp: diff chỉ đổi className, TSX và một hàm format thuần, typecheck đã PASS. Class arbitrary `sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]` là literal tĩnh nên Tailwind scan được. Chưa xác minh build → Residual risk |

Đã kiểm byte: `project-detail-view.ts` và test dùng đúng U+00A0 (`302 240`) trước "m²". `formatArea` (`src/lib/format.ts:17`) trả " m²" với khoảng trắng thường, nên `replace(/ m²$/, " m²")` có tác dụng. Test `formatAreaRange` khẳng định chuỗi NBSP và pass.

## Root cause / fix closure

- Root cause đúng với code trước fix: ≥ xl chia `11fr/9fr`, rồi `xl:grid-cols-3` trong cột khoảng 320px, nên mỗi thẻ chỉ khoảng 99px, kèm `break-words`. Builder đã chứng minh con số này qua file:line.
- Fix chặn đúng chỗ:
  - Wrapper chỉ còn `grid gap-4`, không còn chia cột ≥ xl (`ProjectOverview.tsx:64`).
  - Bỏ hẳn `columns`, `xl:grid-cols-3`, `xl:col-span-3` và nhánh `xl:text-h2-sm/h3`.
  - Grep `columns=\{3\}` không còn kết quả trong `src`. Không có call site nào bị sót, và typecheck sẽ bắt nếu còn truyền prop.
- Tính lại theo CSS:
  - ≥ xl, nội dung khoảng 728px: 4 × 176 + 36 = 740 > 728, nên được **3 cột khoảng 235px**. Khớp số đo của builder.
  - 375px: < sm `minmax(8.5rem)`, nên **2 cột** như cũ.
  - 768px: nội dung khoảng 640px, nên 3 cột khoảng 206px.
- Repro Verification ghi status PASS cho cả 4 dòng, kèm số đo JS. Ảnh chụp chưa lưu. Phần cơ chế (hết 3 cột cố định, có NBSP) kiểm chứng được qua diff, test tự động và phép tính CSS ở trên, nên chấp nhận được. Phần hình ảnh thật ghi vào Residual risk.

## Responsive Checklist Gate (diff đụng UI, kiểm bằng CSS math, không có browser)

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không cuộn ngang | OK | Grid `auto-fill minmax(...,1fr)`, `li min-w-0`, không có bề rộng px cố định. Lưới thông tin vẫn `columns={2}` như trước |
| Mobile-first (`min-width`) | OK | Base 8.5rem, `sm:` (min-width) 11rem |
| Grid `auto-fit`/`minmax` | OK | `auto-fill minmax(8.5rem/11rem,1fr)`. Đã bỏ cột cố định `xl:grid-cols-3` |
| Container không fixed px | OK | Không thêm width px |
| Font `rem` / token | OK | `text-h2`, `text-small`, `text-xsmall` là token có sẵn. Đã bỏ biến thể thu cỡ |
| Spacing theo scale | OK | `gap-3`, `p-4`, `gap-4` không đổi |
| Media | N/A | Diff không có ảnh hoặc video |
| Touch target ≥ 44px | N/A | Thẻ không có phần tử tương tác |
| Nav mobile / table | N/A | Không đụng |
| `100vh` / reduced-motion / `overflow:hidden` | OK | Không dùng `100vh` hay animation, không che tràn bằng `overflow:hidden` |

## Skill gates

| Gate | Kết quả |
|---|---|
| aislop | skip: không có trong verify commands được allow |
| oxlint (anti-slop) | skip: repo dùng eslint, chưa có oxlint config. `pnpm lint` PASS |
| ocr | skip: ocr not installed / không trong allow list |
| AI-readable | OK: 0 indicator. Tên rõ (`formatAreaUnbreakable`), hàm ngắn, không có magic number mới ngoài token rem đã ghi doc, comment ghi WHY (BL-071). Docs as-built đã cập nhật |
| ai-friendly-web | N/A: không đổi robots, sitemap hay llms. NBSP không vào text SEO |
| blitzstrike | N/A: không phải task nhạy cảm bảo mật |

## Docs

- `.context/design-spec.md:242` và `docs/DESIGN.md:277`: phần as-built mô tả đúng code. Ghi rõ mục thay thế BL-056, các mốc 8.5rem/11rem, NBSP, và trường hợp không có sản phẩm thì dùng `auto`.
- Không đụng intent docs (BRD, PRD, SPECIFICATIONS).

## Findings

- **[CRITICAL]** Không có.
- **[MAJOR]** Không có.
- **[MINOR]** Acceptance ghi "375px / 768px vẫn như cũ". Ở 768px, lưới trước đây theo `minmax(8.5rem)` cho khoảng 4 thẻ/hàng, nay theo `sm:minmax(11rem)` cho 3 thẻ/hàng khoảng 206px. Thay đổi này có chủ đích, đã ghi trong design-spec, và đọc dễ hơn, nhưng lệch với câu chữ của acceptance. Đề xuất ghi chú vào task hoặc change doc khi close-out. Không cần sửa code.
- **[MINOR]** `tasks/bug-project-detail-layout-fixes/phase-1-task-01.md:5` vẫn ghi "Trạng thái: pending — chờ duyệt plan" và các checkbox Acceptance chưa tick. Cập nhật khi close-out.
- **[MINOR]** `src/components/detail/DetailBlocks.test.tsx:58-66` và `project-detail.test.tsx` (test BL-071) khẳng định qua chuỗi className, nên gắn với cách cài đặt. Chấp nhận được trong jsdom vì không đo được layout. Không chặn.
- **[MINOR]** Với khoảng diện tích, chỉ "m²" được dính vào số. Chuỗi "50 – 120 m²" vẫn có thể ngắt ở hai bên dấu "–". Acceptance chỉ yêu cầu "m²" đi cùng số, nên vẫn đạt.

## Residual risk

- Chưa chạy `pnpm build`.
- Chưa có ảnh chụp ở 375, 768, 1440 và 1920. Repro dựa trên số đo JS của builder cộng với phép tính CSS của reviewer.
- The Windsor Collection và Maison Privée (6–7 loại sản phẩm) chưa kiểm riêng. Có cùng cấu trúc nên rủi ro thấp: 3 cột × 2–3 hàng.

## Verdict: PASS

Không có finding CRITICAL hoặc MAJOR. Repro status là PASS, và cơ chế fix kiểm chứng được qua diff, test và phép tính CSS.
