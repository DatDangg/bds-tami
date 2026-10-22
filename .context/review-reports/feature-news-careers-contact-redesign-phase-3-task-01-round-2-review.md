Agent: reviewer

# Review — feature-news-careers-contact-redesign · phase-3-task-01 · round 2 (BL-054, dọn C1–C11)

- Worktree: `D:\prj\bds\.worktrees\feature-news-careers-contact-redesign__phase-3__task-01` (chưa commit, base staging 48498b1; diff gồm attempt 1 + 2)
- Review level: **STRICT**
- Reason: vẫn chạm `LeadFormSlot` dùng chung (Liên hệ, `DetailContactAside`, form ứng tuyển), truy vấn SQL tin công khai (`findFilteredNewsIds`) và phần hiển thị nội dung richText tuyển dụng (C11, có nguy cơ mất nội dung).
- Blast radius: giống round 1. Trọng tâm round 2 là `src/lib/careers/job-view.ts` (`splitDescriptionLead`, `isPlainTextParagraph`), `src/components/careers/{JobDetail,JobDetailHero}.tsx`, `src/components/forms/LeadFormSlot.tsx`, `src/components/careers/ApplyFormSlot.tsx`, JSDoc `src/lib/news/news-search.ts`, S13 trong `.context/design-spec.md`.

## Verify commands + result (reviewer tự chạy trong worktree)

| Lệnh | Kết quả |
|---|---|
| `docker exec tami-postgres psql -U tami -d postgres -Atc "select 1"` | `1` |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS (0 lỗi; 2 warning có sẵn trong `tools/task-dashboard/server.mjs`, ngoài diff) |
| `pnpm i18n:check` | PASS (vi/en khớp) |
| `pnpm vitest run src/components/careers src/components/forms src/lib/careers src/lib/news "…/tuyen-dung" "…/lien-he"` | 15 file / 209 test PASS |
| `pnpm vitest run tests/integration/job-postings.test.ts` | 35/35 PASS |

## Kiểm các điểm round 1

- **MAJOR-1 (line-clamp):** `JobDetailHero.tsx:66` đã bỏ `line-clamp-2`, nên đoạn dẫn hiện toàn văn. Có test đoạn dài: class không còn `line-clamp` và đoạn đó không có trong thân. Đoạn dẫn có link, định dạng (`format` khác 0), `style` hoặc xuống dòng thì không tách, nên link và định dạng được giữ trong thân (có test unit và test render link). Phần này đã đóng.
- **MINOR-1:** JSDoc `findFilteredNewsIds` (`news-search.ts:29-31`) đã ghi rõ thứ tự null, `[]` và danh sách id. Đã đóng.
- **MINOR-2:** `LeadFormSlot.tsx:199-217` gom `heading`. Khi không có `subtitle`, class là `mb-4 font-display text-h2-sm` và không có `<header>`, nên DOM giống hệt trước. Liên hệ và `DetailContactAside` không truyền `subtitle`. Đã đóng.
- **Không hồi quy C1–C10:** các phần ngoài C11 không đổi so với round 1. Test liên quan và integration đều PASS.
- **Vẫn còn một đường mất nội dung trong C11:** xem MAJOR-1 bên dưới.

## Responsive Checklist Gate (diff đụng UI: JobDetailHero, LeadFormSlot/ApplyFormSlot)

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Layout không tràn ngang | OK | Hero giữ `max-w-[56ch]`, chữ tự xuống dòng. Diff không thêm width cố định. Builder có ảnh `bl054-p3t01-vi-multi-{390,1440}.png`. |
| Mobile-first / grid | N/A | Không đổi grid hay media query |
| Typography rem / spacing scale | OK | Dùng token `text-body`, `text-small`, `gap-1`, `mb-4` |
| Media | N/A | Không đổi ảnh |
| Touch target ≥ 44px | OK | Giữ như round 1 (`CvPicker.tsx` `h-11` / `md:min-h-11`, có test) |
| Nav / table | N/A | Không đụng |
| Viewport 100vh / reduced-motion / overflow:hidden | N/A | Không đụng |
| Nội dung bị cắt (line-clamp) | OK | Đã bỏ `line-clamp-2`; có test |

Residual: reviewer không mở được trình duyệt. Phần tràn ngang lấy theo ảnh của builder. Một đoạn dẫn rất dài sẽ làm hero cao hơn; điều này đúng như S13 đã ghi.

## Skill gates

- aislop: skip, không có trong verify commands được phép.
- oxlint (anti-slop): skip, repo chưa cấu hình oxlint. ESLint PASS.
- ocr (open-code-review): skip, ocr chưa cài.
- AI-readable: OK. Hàm ngắn, tên rõ (`isPlainTextParagraph`, `DescriptionLead`), comment nêu WHY, S13 đã cập nhật. Không có indicator nào.
- ai-friendly-web: N/A (không đổi route, robots hay sitemap).
- blitzstrike: skip, không có môi trường. SQL đã kiểm ở round 1 và không đổi.

## Findings

### [MAJOR-1] C11: khối không có chữ đứng trước đoạn dẫn (ảnh, đường kẻ ngang, relationship) bị bỏ khỏi thân "Mô tả công việc"
- `src/lib/careers/job-view.ts:356-363`:
  ```ts
  const leadIndex = blocks.findIndex((block) => lexicalPlainText({ root: block }).trim() !== "");
  ...
  const rest = blocks.slice(leadIndex + 1);
  ...
  body: { ...(content as object), root: { ...root, children: rest } },
  ```
- `leadIndex` bỏ qua mọi khối không có chữ, không riêng đoạn trống. Sau đó `body` chỉ giữ `blocks.slice(leadIndex + 1)`, nên **mọi khối đứng trước đoạn dẫn đều bị bỏ**. `JobPostings.description` dùng editor toàn cục (`src/lib/admin/rich-text-editor.ts:22-23`, `...defaultFeatures`). Bộ mặc định này có Upload, HorizontalRule và Relationship, và các nút đó đều có `lexicalPlainText` rỗng.
- Ví dụ: `description = [upload (ảnh), paragraph "Gia nhập…", paragraph "Đoạn 2"]` cho ra intro "Gia nhập…" và body `[paragraph "Đoạn 2"]`. Ảnh biến mất khỏi trang và không hiện ở đâu cả (hero chỉ hiện chữ). Như vậy trái yêu cầu "không còn đường nào mất nội dung đoạn dẫn / nội dung thân".
- Test hiện tại chỉ có khối trống là `paragraph("")` (`job-view.test.ts:244`), nên không bắt được lỗi này.
- Cách sửa (chọn một):
  - Chỉ bỏ những khối đứng trước đoạn dẫn nếu đó là **đoạn văn trống** (`type === "paragraph"` và không có chữ). Gặp khối khác có trước đoạn dẫn (upload, horizontalrule, relationship, block…) thì không tách. Cách này đơn giản và an toàn nhất.
  - Hoặc giữ lại các khối không phải đoạn trống trong `body`: `[...blocks.slice(0, leadIndex).filter(notEmptyParagraph), ...rest]`.
  - Thêm test unit: `[upload, paragraph A, paragraph B]` (và `horizontalrule`) phải không tách, hoặc `body` vẫn chứa upload. Cập nhật câu mô tả trong JSDoc `splitDescriptionLead` và S13 cho khớp.

### [MINOR-1] Căn lề và thụt dòng của đoạn dẫn bị bỏ khi tách
- `isPlainTextParagraph` (`job-view.ts:339-345`) chỉ kiểm các nút con. Nếu chính đoạn văn có `format: "center"` hoặc `indent > 0`, nó vẫn bị tách, và hero hiển thị chữ thuần căn trái. Mất trình bày, không mất nội dung, nên không chặn. Có thể thêm điều kiện `!block.format && !block.indent` để nhất quán với nguyên tắc "có định dạng thì không tách".

## Kết luận các mục C
C1–C10 OK (không đổi so với round 1) · C11: phần line-clamp và link/định dạng đã đóng; **còn MAJOR-1**, khối không có chữ trước đoạn dẫn bị mất.

## Verdict: ❌ FAIL

Lý do: MAJOR-1, `splitDescriptionLead` bỏ ảnh, đường kẻ ngang hoặc relationship đứng trước đoạn dẫn khỏi thân, nên vẫn còn một đường mất nội dung trong C11. Sửa kèm test rồi review round 3. Không commit khi verdict còn FAIL.
