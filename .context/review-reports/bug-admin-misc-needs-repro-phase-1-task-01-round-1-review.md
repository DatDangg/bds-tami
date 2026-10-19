Agent: reviewer

# Review — bug-admin-misc-needs-repro · phase-1-task-01 · round 1 (BL-023 #05, Lexical vỡ dấu tiếng Việt)

- **Review level:** FAST
- **Reason:** Diff là 1 khai báo CSS custom property trong `:root` của SCSS admin + 1 test tĩnh mới. Không đụng shared runtime/API/auth/tenant/schema/data. Builder đã chạy test PASS. Root cause có evidence (DB NFC query + CSS của Payload).
- **Scope reviewed:** chỉ `src/app/(payload)/custom.scss` (dòng `--font-serif` + comment trong `:root`; dòng `@use "...navigation-guard"` thuộc task 03, không review ở đây) và file mới `src/components/admin/admin-fonts.test.ts`.

## Blast radius
- `--font-serif` chỉ có nơi dùng trong CSS dist của Payload 3.91.0 tại `@payloadcms/richtext-lexical/dist/field/bundled.css`:
  - `.rich-text-lexical .editor-container{font-family:var(--font-serif)}` (editor)
  - `.lexical-diff .field-diff-content .html-diff{font-family:var(--font-serif)}` (màn so sánh phiên bản)
- `@payloadcms/ui/dist/styles.css`: không có `var(--font-serif)` (grep 0 kết quả).
- `@payloadcms/next/dist/prod/styles.css`: chỉ khai báo `--font-serif: "Georgia", …` (cạnh `--font-body`), các rule của file này nằm trong `@layer payload-default`. Override ngoài layer trong `custom.scss` `:root` thắng. Đây cũng là cơ chế mà override `--font-body` hiện có đang dùng và đã chạy được.
- Public site: không bị ảnh hưởng. `custom.scss` chỉ được import ở `src/app/(payload)/layout.tsx:9`.
- => Đúng như dự kiến: chỉ ảnh hưởng editor Lexical và màn diff Lexical trong admin. Không có UI Payload nào khác bị đổi font ngoài ý muốn.

## Root cause check
- Khớp evidence: Lexical dùng `var(--font-serif)`, mà biến này là Georgia, font thiếu glyph dựng sẵn cho nguyên âm mang 2 dấu tiếng Việt. DB đã ở dạng NFC (0/32 dòng lệch, theo task file).
- Fix ở đúng lớp: dùng token CSS, không sửa `node_modules`, không đổi dữ liệu.
- Quyết định không thêm hook normalize NFC hợp lý (YAGNI, dữ liệu đã NFC). Đã ghi residual cho trường hợp dán nội dung NFD về sau.
- Change-request đã kiểm trên trình duyệt: computed font-family của editor bắt đầu bằng Montserrat và dấu hiển thị đúng. Reviewer không tự chạy app nên dựa vào evidence này.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm vitest run src/components/admin/admin-fonts.test.ts` | PASS (1 file, 1 test) |
| `pnpm lint` | PASS — 0 errors, 2 warnings có sẵn trong `tools/task-dashboard/server.mjs` (ngoài scope) |
| `pnpm typecheck` | PASS (`tsc --noEmit`, không có lỗi) |
| `pnpm test` (full) | không chạy lại. Theo builder: 2834 pass, 3 file integration fail do cần DB/SMTP/SeaweedFS thật, không liên quan CSS |

## Responsive Checklist Gate
Diff chỉ đổi font-family của vùng text trong editor admin, không đổi layout, kích thước, media hay touch target.
- Layout: N/A (không đổi layout, grid hay container)
- Typography/Spacing: N/A cho rem/clamp (không đổi size/spacing). Montserrat là font đã dùng cho toàn admin.
- Media: N/A
- Touch/Interaction: N/A
- Viewport/A11y: N/A (không đổi vh hay motion)

## Skill gates
- aislop: skip, chưa chạy (diff chỉ 1 dòng CSS + 1 test 15 dòng, không có dấu hiệu slop khi đọc tay)
- oxlint (anti-slop): skip, oxlint not configured (không thấy `.oxlintrc.json`). ESLint 0 error.
- ocr: skip, ocr not installed / not run
- AI-readable: OK — 0 indicator (comment giải thích WHY, tên rõ, không magic, không indirection)
- ai-friendly-web: N/A (admin nội bộ)
- blitzstrike: N/A (không STRICT, không nhạy cảm)

## Findings
- **[MINOR]** `src/components/admin/admin-fonts.test.ts:13` — regex cũng khớp dòng đã bị comment, ví dụ `// --font-serif: var(--font-body);`, vì SCSS dùng comment `//`. Đề xuất: chỉ kiểm các dòng không bắt đầu bằng `//`, ví dụ `/^\s*--font-serif:\s*var\(--font-body\);/m`. Không chặn PASS.
- **[MINOR]** Test kiểm source SCSS chứ không kiểm thứ tự cascade so với `@layer payload-default`. Chấp nhận được vì cùng kiểu với test token hiện có, và browser check của change-request đã xác nhận kết quả computed.

Không có CRITICAL/MAJOR.

## Residual risk
- Nội dung NFD dán vào sau này không được chuẩn hoá khi lưu. Montserrat vẫn dựng đúng dấu kết hợp, nên đây chỉ là rủi ro thấp về so khớp/tìm kiếm.
- Nếu Payload nâng version và đổi tên biến hoặc selector, test tĩnh sẽ không phát hiện được.

## Verdict
PASS
