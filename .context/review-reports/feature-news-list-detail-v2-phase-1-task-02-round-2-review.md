Agent: reviewer

# Review: feature-news-list-detail-v2 · phase-1-task-02 · round 2 (BL-062, chi tiết Tin tức v2)

- **Review level:** STRICT
- **Reason:** Phạm vi giống round 1: có schema + migration (`site_settings_locales.news_detail_contact_note`) và đụng component dùng chung (`ShareButtons`, `NewsCard`, `Breadcrumb` overlay, khung dính `DetailAsideFit`). Attempt 2 thêm `src/lib/translation/prompt.ts`, là system prompt dùng cho mọi bản dịch tự động.
- **Blast radius:** Giống round 1, cộng thêm:
  - `globals.css` `.news-prose`: chỉ trang `/tin-tuc/[slug]` và `/en/news/[slug]`.
  - `NewsArticleHero`, nhãn "Chia sẻ:" của `ShareButtons` (chỉ khi `tone="on-dark"`; mặc định không đổi).
  - `prompt.ts` `ALWAYS_KEEP`: system prompt của mọi lần tự dịch VI→EN (mọi collection/global) có thêm "TAMI REAL ESTATE" trong câu "Keep these brand names unchanged".

## Verify commands + result

| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` | **PASS** (`tsc --noEmit`, không lỗi) |
| `npx eslint src/components/news src/components/layout/Breadcrumb.tsx src/components/layout/Breadcrumb.test.tsx "src/app/(frontend)/[locale]/tin-tuc/[slug]/page.tsx" src/globals/SiteSettings.ts src/lib/translation/leaves.ts src/lib/translation/prompt.ts` | **PASS**, exit 0, 0 lỗi |
| `pnpm test` (đủ bộ, dev server :3000 vẫn chạy) | **PASS**: 422/422 file, 4430/4430 test, exit 0. Lần chạy này không có lỗi integration nào. |
| `npx vitest run tests/integration/{leads-public,jobs-email,media-upload,job-applications}.test.ts` (chạy riêng) | **PASS**: 4/4 file, 51/51 test |
| `pnpm build` | **skip**: dev server :3000 đang dùng `.next`, chạy build sẽ ghi đè. Attempt 1 builder báo PASS. Attempt 2 chỉ đổi class Tailwind, 1 selector CSS và 1 phần tử mảng; typecheck và test đã chạy lại PASS. |

### Các lỗi integration chập chờn builder báo: không liên quan diff
- 4 file builder nêu: `leads-public`, `jobs-email`, `media-upload`, `job-applications`.
  - Không file nào chạm news, `newsDetail` hay translation.
  - `leads-public.test.ts:138` và `job-applications.test.ts:164` có `updateGlobal` `site-settings` để đặt email thông báo. Đó là trường khác. Cột mới là nullable và migration đã chạy, nên không ảnh hưởng.
- Reviewer chạy đủ bộ 1 lần: PASS 100%. Chạy riêng 4 file: PASS 51/51.
- Kết luận: lỗi do tải / tranh chấp DB-S3 khi chạy song song cùng dev server, **không do BL-062**.

## Kiểm lại findings round 1

| Finding | Trạng thái | Bằng chứng |
|---|---|---|
| MAJOR-1: `h2` từ mục 02 bị thụt | **FIXED** | Chi tiết bên dưới bảng. |
| MINOR-1: chữ hero `/90` | **FIXED** | `NewsArticleHero.tsx`: sapo, tác giả, ngày / phút đọc đều `text-on-dark` đặc. `ShareButtons.tsx:65` nhãn on-dark là `text-on-dark`. Cận xấu nhất 5.07:1 ≥ 4.5 (chữ trắng 100% trên nền ≈ rgb(114,110,103)). |
| MINOR-2: `Breadcrumb` đổi display | Chấp nhận | Builder đã đính chính câu mô tả trong Attempt 2. |
| MINOR-3: sapo bị clamp | **FIXED** | Sapo dùng `max-lg:line-clamp-4`, nên ≥ lg không cắt. |
| Residual dịch "TAMI REAL ESTATE" | Đã giảm rủi ro | Xem đánh giá `prompt.ts` bên dưới. |

**Chi tiết MAJOR-1:**
- Selector mới ở `globals.css:458-461`, trong `@media (min-width: 48rem)`: `.news-prose > h2 ~ :not(h2), .news-prose > h2 ~ ul.list-disc { margin-inline-start: 3.25rem }`.
- Tính specificity:
  - `h2 ~ :not(h2)` = (0,1,2), nên `h2` không bao giờ nhận margin. Mọi số tròn nằm ở cùng rãnh: `::before` absolute ở 0, `h2` padding 3.25rem.
  - `h2 ~ ul.list-disc` = (0,2,2), thắng `.news-prose > ul.list-disc { margin-inline-start: 0 }` (0,2,1). Vì vậy `ul` cũng thụt.
- Không còn rule `margin-inline` nào khác trong khối `.news-prose`.
- Ảnh `assets/bl062-p1t02-mid-1440.jpg`: số "04" nằm ở rãnh. Chữ tiêu đề, đoạn văn và ✓ của `ul` thẳng hàng một cột.
- Số đo builder: 1440 badge 393 / chữ 445 / nội dung 445; 768 là 23 / 75 / 75, cả 5 mục. Số đo khớp phép tính CSS.

## `prompt.ts` (thêm "TAMI REAL ESTATE" vào `ALWAYS_KEEP`): chấp nhận
- Chỉ thêm 1 phần tử vào danh sách thương hiệu đã có. Không tạo cơ chế mới, không đổi API.
- Thay đổi trực tiếp xử lý residual round 1: nếu bản dịch đổi chuỗi "TAMI REAL ESTATE" thì link thương hiệu ở `/en` sẽ mất.
- Tác động lên dịch máy toàn site: chỉ thêm 1 tên thương hiệu cần giữ nguyên. Đây là chữ thương hiệu thật của công ty (hero và khung liên hệ đều dùng), nên đúng mục đích BR-08.
- Test `translation-service.test.ts:106` chỉ assert "TAMI HOMES". Chưa có assert cho chuỗi mới, ghi MINOR-B.

## Findings

### [MINOR-A] `design-spec.md` as-built chưa cập nhật theo attempt 2
- **Vị trí:** `.context/design-spec.md:598`. Dòng này vẫn ghi `sapo text-on-dark/90 (≤ 4 dòng)`.
- **Code hiện tại:** sapo dùng `text-on-dark` đặc, chỉ clamp 4 dòng ở < lg.
- **Cách sửa:** Đổi thành "sapo `text-on-dark` (< lg tối đa 4 dòng, ≥ lg không cắt)". Có thể ghi thêm "chữ nhỏ hero / 'Chia sẻ:' dùng `text-on-dark` đặc". Sửa ở close-out, không chặn.

### [MINOR-B] Chưa có test cho "TAMI REAL ESTATE" trong system prompt
- **Vị trí:** `src/lib/translation/translation-service.test.ts:106`.
- **Cách sửa:** Thêm `expect(calls[0]!.system).toContain("TAMI REAL ESTATE")` để giữ hồi quy cho link thương hiệu ở `/en`. Không chặn.

Không có finding CRITICAL / MAJOR. Không thấy regression do attempt 2:
- `ShareButtons` `tone` mặc định giữ `text-text-muted`.
- Icon "đã chép" on-dark dùng `text-primary`. Đây là đồ hoạ trang trí, kèm thông báo qua `aria-live`.

## Responsive Checklist Gate (diff đụng UI; chỉ xét phần đổi ở attempt 2, phần còn lại giữ kết quả round 1)
Kiểm bằng CSS math và ảnh builder. Reviewer không có browser.

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không tràn ngang | OK | Margin 3.25rem chỉ áp ≥ 48rem, trong cột `minmax(0,1fr)`. Builder đo `scrollWidth === clientWidth` ở 1440 / 768 / 390. |
| Mobile-first `min-width` | OK | `@media (min-width: 48rem)`, `max-lg:` chỉ dùng cho clamp sapo. |
| Grid `auto-fit`/`minmax` | OK | Không đổi so với round 1. |
| Container không fixed px | OK | rem / `max-w-container`. |
| Font rem / heading fluid | OK | Token `--text-h3` / `--text-lead`. |
| Spacing scale | OK | Rãnh 3.25rem thống nhất. |
| Media `max-width` / `aspect-ratio` | OK | Không đổi. |
| Touch ≥ 44px | OK | Nút chia sẻ `size-11`, không đổi. |
| Nav mobile | N/A | Không đổi header. |
| Table scroll wrapper | N/A | Không đổi. |
| Không dùng `100vh` thuần | OK | Không đổi (`100dvh`). |
| `prefers-reduced-motion` | OK | Chỉ có `transition-colors`. |
| Không che lỗi bằng `overflow:hidden` | OK | Clamp sapo < lg là quyết định nội dung, không phải che tràn. Hero `overflow-hidden` chỉ dùng để cắt ảnh nền. |

## Skill gates
- **aislop:** skip, chưa cài.
- **oxlint (anti-slop):** skip, oxlint chưa cấu hình. ESLint 0 lỗi.
- **ocr (open-code-review):** skip, `ocr` chưa cài.
- **AI-readable:** OK, 1 indicator (< 3).
  - Indicator: magic `3.25rem` lặp giữa CSS và TSX, có comment.
  - Comment selector mới giải thích lý do (vì sao loại `h2`).
- **ai-friendly-web:** N/A. Không đổi metadata / robots / sitemap.
- **blitzstrike:** skip. Không phải auth / API public. `prompt.ts` chỉ thêm hằng số, không đưa input người dùng vào prompt.

## Residual risk
- Kế thừa từ round 1:
  - `/en/news/[slug]` chưa xem bằng mắt (DB không có bài EN).
  - Chưa lưu thật trên admin rồi xem trang.
  - Hero không ảnh bìa chỉ được phủ bằng test.
  - Contrast tính theo cận lý thuyết, chưa lấy mẫu pixel.
- Mô hình dịch vẫn có thể không tuân "keep brand unchanged". Nếu vậy, `/en` mất link thương hiệu nhưng không crash.
- `pnpm build` reviewer không chạy lại vì dev server đang dùng `.next`.
- Integration test có thể chập chờn khi chạy song song cùng dev server. Đây là vấn đề môi trường, ngoài scope.

## Verdict
**PASS**: MAJOR-1 đã sửa đúng, MINOR-1 và MINOR-3 đã sửa. Không có CRITICAL / MAJOR mới. Typecheck, ESLint và `pnpm test` đủ bộ PASS. MINOR-A (design-spec as-built) nên xử lý ở close-out.
