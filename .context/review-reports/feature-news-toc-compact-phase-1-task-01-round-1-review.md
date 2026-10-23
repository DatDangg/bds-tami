Agent: reviewer

# Review — feature-news-toc-compact · phase-1-task-01 · round 1 (BL-067)

> Report ghi bởi change-request nguyên văn từ completion report của reviewer (guard hook chặn reviewer ghi vào `.context/review-reports/**` trong worktree).

- **Review level:** NORMAL
- **Reason:** MODIFY chỉ đụng UI, giới hạn ở trang chi tiết tin tức (một client component có hành vi cuộn + layout sticky). Không đụng auth, API, schema hay tenant. `DetailAsideFit` / `DETAIL_ASIDE_STICKY_CLASS` dùng chung chỉ được dùng, không sửa, nên không bắt buộc STRICT.
- **Blast radius:**
  - `NewsToc.tsx`: `TocLinks` dùng chung cho `NewsTocSidebar` ≥ lg và `NewsTocDisclosure` < lg; kích thước tách theo `numbered`.
  - `NewsArticleSidebar.tsx`: khối dính.
  - `tin-tuc/[slug]/page.tsx:148`: cột lưới.
  - Test news, doc as-built `.context/design-spec.md` S11 + `docs/DESIGN.md`.
  - Route ảnh hưởng: `/tin-tuc/[slug]`, `/en/news/[slug]`. Không đổi i18n, data hay API.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm typecheck` | PASS |
| `npx eslint` 5 file code/test bị đụng | PASS (0 output) |
| `npx vitest run src/components/news` | PASS — 8 files / 98 tests |
| Integration / dev server / visual | skip — worktree không có `.env.local`; theo brief không chạy DB/dev server |

## Đối chiếu § Quyết định / Acceptance
1. **Cột trái 16rem / xl 18rem, gap-x-12 giữ — OK.**
   - Bề rộng chữ mục cấp 2: ~186px (16rem), ~218px (18rem); trước đây ~156px.
   - Thân bài ở 1024 còn ~672px.
2. **Mục gọn hơn — OK.**
   - Nhánh `numbered`: `min-h-8 py-1.5 leading-snug` (32px ≥ 24px, đạt WCAG 2.5.8), số tròn `size-6`, `gap-2.5`.
   - Thẳng hàng đúng: mép chữ cấp 2 = 2px + (1rem−2px) = 1rem, khớp nhãn `px-4`.
   - Cấp 3 = 3.125rem, khớp mép chữ cấp 2.
   - Bản gập vẫn `min-h-11 py-2`, có test.
3. **Flex / max-h / sticky — OK (theo tính toán CSS).**
   - Viewport đủ cao: chiều cao đo được `--detail-aside-h` ≤ 100dvh − top − 1rem, nên `min()` trả về `--detail-aside-top` và khối dính trên, không nhảy.
   - Viewport thấp (< ~528px): khối cao 26rem và dính theo đáy như trước.
   - ResizeObserver bắt được khi max-h (theo dvh) đổi.
   - `nav` là flex item `hidden lg:block` + `lg:min-h-0` + `overflow-y-auto`, nên co và cuộn riêng.
   - Thẻ tư vấn `shrink-0`.
   - `max-h` có tiền tố `lg:`, nên < lg không đổi.
   - `--detail-aside-top` được kế thừa từ `DetailAsideFit`.
4. **Tự cuộn mục active — OK.** Effect không đổi; `nav` vẫn `relative` và giờ có chiều cao giới hạn bởi flex.
5. **Phần cần giữ — OK.** Link `#id`, `aria-current`, số `aria-hidden`, reduced-motion, focus ring, `print:hidden`, thứ tự DOM đều giữ. `/en` dùng cùng component, không có nhánh theo locale.
6. **Doc as-built — OK, khớp code.** Phần BL-062 trong DESIGN.md vẫn ghi 15rem nhưng đã bị dòng BL-067 phủ.

## Responsive Checklist Gate (xác minh bằng tính toán CSS)
- Không horizontal scroll: OK (lưới chỉ áp dụng từ lg).
- Mobile-first: OK (mọi thay đổi gắn `lg:` / `xl:`).
- Grid/container: OK.
- Font rem: OK.
- Touch target: OK (< lg 44px; ≥ lg con trỏ 32px).
- Nav mobile: OK (bản gập không đổi).
- 100vh: OK (`100dvh`).
- Reduced-motion: OK.
- overflow:hidden: OK (không dùng).

## Skill gates
- aislop: skip, chưa cài. · oxlint: skip, chưa cấu hình (eslint sạch). · ocr: skip, chưa cài. · AI-readable: OK. · ai-friendly-web / blitzstrike: N/A.

## Findings
- **[MINOR-1]** `src/components/news/NewsToc.tsx:68`: `text-[0.6875rem]` là giá trị lẻ, không phải token (token nhỏ nhất `--text-xsmall` = 0.75rem). Đề xuất dùng `text-xsmall`, hoặc ghi lý do vào design-spec.
- **[MINOR-2]** `src/components/news/NewsToc.tsx:150`: `lg:shrink` thừa (flex-shrink mặc định đã là 1), có thể bỏ.
- **[MINOR-3]** `src/components/news/NewsToc.test.tsx:76`: assert `pl-[calc(` quá lỏng. Nên assert đúng chuỗi `pl-[calc(1rem-2px+1.5rem+0.625rem)]`.

## Residual risk
- Acceptance 1 (~8–10 heading đọc trọn ở 1440 và 1280) chưa kiểm bằng mắt. Ước tính 1440×900: danh sách còn ~480px, 10 mục 1–2 dòng vừa sát. 1280×800: ~380px, 8 mục vừa; 10 mục toàn 2 dòng sẽ cuộn riêng (vẫn dùng được nhờ tự cuộn mục active). Nên đo `nav.scrollHeight` vs `clientHeight` với bài thật.
- Viewport desktop < ~512px: header cố định có thể đè vài px ở đỉnh khối dính — có từ trước, không phải hồi quy.
- Test chỉ kiểm class (jsdom không tính layout).

## Verdict
**PASS** — không có CRITICAL/MAJOR; 3 MINOR tuỳ chọn; cần kiểm nhanh bằng mắt cho Acceptance 1.
