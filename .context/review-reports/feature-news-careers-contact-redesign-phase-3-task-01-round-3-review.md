Agent: reviewer

# Review — feature-news-careers-contact-redesign · phase-3-task-01 · round 3 (BL-054, dọn C1–C11)

- Worktree: `D:\prj\bds\.worktrees\feature-news-careers-contact-redesign__phase-3__task-01` (chưa commit, base staging 48498b1; diff gồm attempt 1–3)
- Review level: **STRICT**
- Reason: diff vẫn chạm `LeadFormSlot` dùng chung (Liên hệ, `DetailContactAside`, form ứng tuyển), truy vấn SQL tin công khai (`findFilteredNewsIds`) và phần hiển thị richText tuyển dụng (C11, rủi ro mất nội dung).
- Blast radius: giống round 1 và 2. Trọng tâm round 3 là `src/lib/careers/job-view.ts` (`isEmptyParagraph`, `isPlainTextParagraph`, `splitDescriptionLead`), `src/components/careers/JobDetail.tsx` (thân "Mô tả công việc"), `JobDetailHero.tsx` (intro), JSON-LD (route đọc `doc.description`), S13 trong `.context/design-spec.md`.

## Verify commands + result (reviewer tự chạy trong worktree)

| Lệnh | Kết quả |
|---|---|
| `docker exec tami-postgres psql -U tami -d postgres -Atc "select 1"` | `1` |
| `pnpm typecheck` | PASS |
| `pnpm lint` | PASS (0 lỗi; 2 warning có sẵn ở `tools/task-dashboard/server.mjs`, ngoài diff) |
| `pnpm i18n:check` | PASS (vi/en khớp) |
| `pnpm vitest run src/components/careers src/components/forms src/lib/careers src/lib/news "…/tuyen-dung" "…/lien-he"` | 15 file / 211 test PASS (round 2 là 209; có thêm test attempt 3) |
| `pnpm vitest run tests/integration/job-postings.test.ts` | 35/35 PASS |

## Kiểm các điểm round 2

- **MAJOR-1 (khối không có chữ trước đoạn dẫn bị mất): đã đóng.**
  - `job-view.ts`: `leadIndex = blocks.findIndex((b) => !isEmptyParagraph(b))`. Hàm `isEmptyParagraph` chỉ trả `true` cho `type === "paragraph"` mà mọi con là `linebreak` hoặc `text` rỗng/khoảng trắng (kể cả không có con nào). Upload, HR, relationship, heading, list, block… đều không phải đoạn rỗng. Nếu chúng đứng đầu, chúng trở thành `lead`, `isPlainTextParagraph` trả `false`, và hàm trả về `{ intro: null, body: content }` (giữ nguyên nội dung).
  - Khi tách, mọi khối trước `leadIndex` chắc chắn là đoạn rỗng, nên `blocks.slice(leadIndex + 1)` chỉ bỏ đoạn dẫn (đã hiện toàn văn ở hero) cùng các đoạn rỗng trước nó. Không còn đường nào làm mất nội dung.
  - Nếu phần sau đoạn dẫn không còn chữ (ví dụ chỉ có ảnh), `hasRichText(rest)` trả `false` nên không tách, và ảnh vẫn ở thân. Mô tả `null` hoặc không có `root` trả về `body: null`, mục đó bị ẩn bởi `hasRichText(doc.description)`.
  - Test unit đã có các ca ảnh, HR, relationship hoặc heading đứng đầu; đoạn rỗng rồi ảnh; ba kiểu đoạn rỗng ở đầu rồi đoạn thuần (ảnh phía sau vẫn ở thân). Test render có ca ảnh đứng trước: `img` và đoạn dẫn vẫn nằm trong "Mô tả công việc", hero không có mô tả ngắn.
- **MINOR-1 (căn giữa / thụt lề): đã đóng.** `isPlainTextParagraph` loại `block.format` truthy và `block.indent` khác 0. Có test cho `format: "center"`, `indent: 1` và cho mặc định `""/0`.
- **JSON-LD giữ đủ mô tả:** `splitDescriptionLead` không sửa dữ liệu gốc (dùng spread, có test kiểm `multi.root.children` vẫn đủ 4 phần tử). Test render kiểm `posting.description` có cả hai đoạn.
- **Ca link / định dạng / style / xuống dòng (round 1):** test attempt 2 vẫn PASS, các ca này không tách.
- **C1–C10 và MINOR round 1 không hồi quy:** phần attempt 3 chỉ sửa `job-view.ts`, test và JSDoc/S13. Toàn bộ test liên quan cùng integration đều PASS.

## Responsive Checklist Gate (diff đụng UI: JobDetailHero, LeadFormSlot/ApplyFormSlot)

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Layout không tràn ngang | OK | Attempt 3 không đổi markup hay class. Hero giữ `max-w-[56ch]`. Ảnh builder `bl054-p3t01-vi-{single,multi}-{390,1440}.png` |
| Mobile-first / grid | N/A | Không đổi grid hay media query |
| Typography rem / spacing scale | OK | Token `text-body`, `text-small`, `gap-1`, `mb-4` (không đổi so với round 2) |
| Media | N/A | Không đổi cách render ảnh. Ảnh trong richText vẫn qua `RichText` như trước |
| Touch target ≥ 44px | OK | `CvPicker.tsx` `h-11` / `md:min-h-11` (round 1, có test) |
| Nav / table | N/A | Không đụng |
| Viewport 100vh / reduced-motion / overflow:hidden | N/A | Không đụng |
| Nội dung bị cắt (line-clamp) | OK | Không có `line-clamp`, có test |

Residual: reviewer không mở được trình duyệt, nên phần tràn ngang dựa vào ảnh của builder và CSS. Đoạn dẫn dài làm hero cao hơn; điều này đúng như S13 đã ghi.

## Skill gates

- aislop: skip, không có trong verify commands được phép.
- oxlint (anti-slop): skip, repo chưa cấu hình oxlint. ESLint PASS.
- ocr (open-code-review): skip, ocr chưa cài.
- AI-readable: OK. Ba hàm nhỏ (< 15 dòng), tên rõ nghĩa, JSDoc nêu WHY (vì sao chỉ bỏ đoạn rỗng). S13 có nhắc `splitDescriptionLead`. Không có indicator nào.
- ai-friendly-web: N/A (không đổi route, robots hay sitemap).
- blitzstrike: skip, không có môi trường. SQL không đổi từ round 1.

## Findings

Không còn CRITICAL hay MAJOR.

### [MINOR-1] `splitDescriptionLead` chạy hai lần mỗi request
- `job-view.ts` `toJobDetailView` (intro) và `JobDetail.tsx` (`sectionContent.description`) đều gọi `splitDescriptionLead(doc.description)`. Hàm thuần và rẻ, nên không sai. Nếu muốn, có thể đưa `body` vào `JobDetailView` để chỉ tính một lần. Không chặn.

### [MINOR-2] Đoạn dẫn đứng trước phần chỉ có ảnh thì hero không có mô tả ngắn
- `[paragraph "Gia nhập…", upload]`: `rest` không có chữ nên không tách, hero ẩn intro. Đây là lựa chọn bảo thủ có chủ đích (thân không có `h2` trống), không mất nội dung. Chỉ ghi lại, không cần sửa.

## Kết luận các mục C
C1–C10 OK · C11 OK (line-clamp, link/định dạng, khối không có chữ đứng đầu, căn lề/thụt lề đều đã đóng; JSON-LD đủ mô tả).

## Verdict: ✅ PASS

Không còn CRITICAL/MAJOR. Hai MINOR không chặn. Có thể close-out và commit theo commit-first.
