Agent: reviewer

# Review — feature-news-careers-contact-redesign · phase-3-task-01 · round 1 (BL-054, dọn C1–C11)

- Worktree: `D:\prj\bds\.worktrees\feature-news-careers-contact-redesign__phase-3__task-01` (chưa commit, base staging 48498b1)
- Review level: **STRICT**
- Reason: chạm `LeadFormSlot` dùng chung (Liên hệ, `DetailContactAside`, form ứng tuyển), truy vấn SQL tìm tin công khai (`findFilteredNewsIds`), trình bày form ứng tuyển, i18n, export Excel admin.
- Blast radius: `src/components/forms/LeadFormSlot.tsx` (3 nơi dùng), `src/components/careers/{ApplyFormSlot,CvPicker,JobDetail}.tsx`, `src/lib/careers/job-view.ts` (`splitDescriptionLead` thay `firstBlockText`), `src/lib/news/{news-search,news-listing}.ts` (trang `/tin-tuc` + trang danh mục), `src/endpoints/admin/newsletter-export.ts` + `src/collections/NewsletterSubscribers.ts`, `src/lib/backfill/offices.ts` (báo cáo), `src/app/(frontend)/[locale]/lien-he/page.tsx`, `src/components/layout/PageHero.tsx` (comment), `src/blocks/news/index.ts` (comment), i18n vi/en (xoá `page.news.v2.backToAll`), `.context/design-spec.md` S13/S15.

## Verify commands + result (reviewer tự chạy trong worktree)

| Lệnh | Kết quả |
|---|---|
| `docker exec tami-postgres psql -U tami -d postgres -Atc "select 1"` | `1` |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS (0 lỗi; 2 warning có sẵn trong `tools/task-dashboard/server.mjs`, ngoài diff) |
| `pnpm i18n:check` | PASS (vi/en khớp) |
| `pnpm vitest run src/components/careers src/components/forms src/lib/careers src/lib/news src/lib/backfill src/collections src/endpoints/admin "…/tuyen-dung" "…/lien-he"` | 33 file / 386 test PASS |
| `pnpm vitest run tests/integration/news.test.ts` | 32/32 PASS (không skip) |
| `pnpm vitest run tests/integration/job-postings.test.ts` | 35/35 PASS |

## Kiểm trọng tâm

- **ApplyForm payload / validate / Turnstile:** diff chỉ đổi class nút "Chọn tệp" (`md:min-h-11`) trong `CvPicker.tsx:109` và chỗ đặt subtitle trong `ApplyFormSlot.tsx`. Không đụng logic submit. Test hiện có PASS. OK
- **`LeadFormSlot` khi không truyền `subtitle`:** nhánh `else` (`LeadFormSlot.tsx:241-252`) render `h2 mb-4` y hệt trước. Liên hệ (`lien-he/page.tsx:106`) và `DetailContactAside.tsx:38` không truyền `subtitle`, nên DOM không đổi. OK
- **SQL `categoryIds`:** `news-search.ts:521` dùng `sql\`${id}\`` cho từng id, tức là có tham số và không nối chuỗi. `categoryIds: []` trả `[]` (`:517`). Integration chứng minh lọc đúng danh mục, cả khi kết hợp `q` hoặc `tag`. OK
- **i18n:** `backToAll`, `firstBlockText` và `LOCALE_NAMES` không còn chỗ dùng trong `src`/`tests`. OK
- **C11 JSON-LD:** route vẫn đọc `doc.description` đầy đủ. Test `page.test.tsx` khẳng định JobPosting chứa cả 2 đoạn. `splitDescriptionLead` không làm đổi dữ liệu gốc (có test). OK. Tuy vậy nội dung hiển thị vẫn có thể bị mất, xem MAJOR-1.

## Responsive Checklist Gate (diff đụng UI: CvPicker, ApplyFormSlot/LeadFormSlot, JobDetail, Liên hệ)

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Layout không tràn ngang | OK | Builder đo `scrollWidth = 390` ở 390. Diff không thêm width cố định. |
| Mobile-first / grid | N/A | Không đổi grid hay media query |
| Typography rem / spacing scale | OK | Dùng token `text-small`, `gap-1`, `mb-4` |
| Media | N/A | Không đổi ảnh |
| Touch target ≥ 44px | OK | `CvPicker.tsx:109`: `h-11` dưới md, `md:min-h-11` từ md. Có test class (`ApplyForm.test.tsx`). Builder đo 44px ở 390 và 1024. |
| Nav / table | N/A | Không đụng |
| Viewport 100vh / reduced-motion / overflow:hidden | N/A | Không đụng |
| Nội dung bị cắt (line-clamp) | **FAIL** | Xem MAJOR-1: `JobDetailHero.tsx:65` `line-clamp-2` áp lên đoạn dẫn, mà đoạn này nay đã bị bỏ khỏi thân |

Residual: reviewer không mở được trình duyệt. Phần tràn ngang lấy theo số đo của builder và ảnh `bl054-p3t01-*`.

## Skill gates

- aislop: skip, không có trong verify commands được phép.
- oxlint (anti-slop): skip, repo chưa cấu hình oxlint (không có `.oxlintrc*`). ESLint PASS.
- ocr (open-code-review): skip, ocr chưa cài.
- AI-readable: OK. Tên rõ (`splitDescriptionLead`, `CARDS_OVERLAP_PULL`, `OFFICES_ADMIN_PATH`), hàm ngắn, comment nêu WHY (ghép cặp overlap, lý do nhập EN tay), design-spec đã cập nhật. Không có indicator nào.
- ai-friendly-web: N/A (không đổi route, robots hay sitemap).
- blitzstrike: skip, không có môi trường. SQL đã kiểm bằng đọc code và integration.

## Findings

### [MAJOR-1] C11: đoạn dẫn bị bỏ khỏi thân nhưng ở hero lại bị cắt `line-clamp-2`, nên người đọc mất nội dung
- `src/components/careers/JobDetailHero.tsx:65`: `<p className="line-clamp-2 max-w-[56ch] …">{view.intro}</p>`
- `src/components/careers/JobDetail.tsx:61`: thân "Mô tả công việc" dùng `splitDescriptionLead(doc.description).body`, tức là đã bỏ đoạn dẫn.
- Trước C11, phần bị cắt ở hero vẫn đọc đủ trong thân. Nay đoạn dẫn chỉ còn ở hero. Đoạn dài hơn khoảng 2 dòng (khoảng 110 ký tự ở 56ch, khoảng 70–80 ký tự ở 390px) sẽ bị cắt bằng dấu "…", và phần còn lại không hiện ở đâu trên trang. Ảnh `bl054-p3t01-vi-multi-390.png` của chính builder cho thấy đoạn dẫn ("Gia nhập đội ngũ TAMI, trở thành một phần c… kiến tạo giá trị bền vững trong lĩnh vực b…") đã chạm 2 dòng. Như vậy trái yêu cầu "C11 không mất nội dung".
- Phụ: hero render `intro` dạng chữ thuần (`lexicalPlainText`). Nếu đoạn dẫn có link hay chữ đậm thì định dạng và link bị mất khỏi trang.
- Test hiện tại không bắt được lỗi này (jsdom không áp `line-clamp`, và đoạn trong test ngắn).
- Cách sửa (chọn một):
  - (a) Khi đoạn dẫn đã tách khỏi thân, bỏ `line-clamp-2`. `intro` giờ là nội dung chính, không còn là tóm tắt.
  - (b) Chỉ tách khi đoạn dẫn ngắn (ngưỡng ký tự có tên hằng). Đoạn dài thì giữ trong thân, hero không có mô tả ngắn.
  - (c) Thêm vào `splitDescriptionLead` điều kiện đoạn dẫn không chứa link hoặc định dạng. Nếu có thì không tách, để khỏi mất link.
  - Thêm test cho đoạn dẫn dài: toàn văn phải hiển thị đâu đó trên trang, kiểm qua class hoặc qua quyết định tách. Cập nhật S13 trong design-spec.

### [MINOR-1] `findFilteredNewsIds` kiểm `categoryIds = []` sau bước "không có q/tag → null"
- `src/lib/news/news-search.ts:516-517`. Hiện chưa sai: khi không lọc, `listPublicNews` vẫn nhận `categoryIds` nên kết quả vẫn đúng. Tuy vậy hợp đồng hàm khó đoán. Có thể ghi một dòng trong JSDoc, không bắt buộc.

### [MINOR-2] `LeadFormSlot` có 2 nhánh lặp `h2`
- `src/components/forms/LeadFormSlot.tsx:241-252`. Có thể gom `h2` vào một biến rồi bọc `<header>` khi có `subtitle`. Không ảnh hưởng hành vi.

## Kết luận các mục C
C1 OK · C2 OK · C3 OK (hằng + comment ghép cặp 2 chiều) · C4 OK (có test cả 2 nhánh) · C5 OK · C6/C7 OK · C8 OK · C9 OK · C10 OK (có tham số, có integration; ca chạm trần 1000 chưa test, builder đã ghi residual) · **C11 FAIL (MAJOR-1)**

## Verdict: ❌ FAIL

Lý do: MAJOR-1, đoạn dẫn mô tả công việc có thể bị cắt mất ở hero sau khi đã bỏ khỏi thân. Sửa MAJOR-1 kèm test rồi review round 2. Không commit khi verdict còn FAIL.
