Agent: reviewer

# Review — feature-admin-form-ux-polish · phase-1-task-07 · round-1

> Report persist bởi primary (hook guard.mjs chặn reviewer Write do đường dẫn worktree lồng `.claude/worktrees/`). Nội dung của reviewer.

- Task: `tasks/feature-admin-form-ux-polish/phase-1-task-07.md` (câu giải thích đầu khối SEO ở Danh mục, follow-up BL-058 T06 r1 MINOR)
- Diff: thay đổi chưa commit so với HEAD `044d2bd` ở `src/lib/admin/seo.ts`, `src/lib/admin/seo.test.ts`, `src/components/admin/SeoPreview.tsx`, `src/components/admin/SeoPreview.test.tsx`

## Review level: FAST
**Reason:** scope rất hẹp — chỉ đổi 1 chuỗi hiển thị admin theo collection; không đụng auth/tenant/schema/API contract/shared hook ngoài `src/lib/admin/seo.ts` (helper thuần, chỉ `SeoPreview` dùng); không migration; Builder có test unit + component; 3 verify command tự chạy PASS.

## Blast radius
- `src/lib/admin/seo.ts`: thêm `seoIntroNote(collectionSlug)` (hàm thuần, export mới, không đổi hàm cũ).
- `src/components/admin/SeoPreview.tsx`: bỏ hằng `SEO_NOTE`, note gọi `seoIntroNote(collectionSlug)`. Chỉ khối SEO admin thấy khác chữ khi là Danh mục; collection khác/Trang chủ nhận đúng chuỗi cũ.
- Không đụng `src/lib/seo/**`, spec, `.context/**`. Không đụng trang công khai.

## Verify commands + result
| Command | Kết quả |
|---|---|
| `pnpm exec eslint src tests` | PASS (exit 0, không warning) |
| `pnpm typecheck` | PASS (`tsc --noEmit`, exit 0) |
| `pnpm exec vitest run --project unit --project ui` | PASS — 344 files / 3366 tests, exit 0 |

## Acceptance check
| Tiêu chí | Kết quả | Bằng chứng |
|---|---|---|
| Danh mục có trang → "Không bắt buộc. Để trống thì trang tự lấy từ Tên và Mô tả danh mục." | OK | `src/lib/admin/seo.ts:49-51`; `src/components/admin/SeoPreview.tsx:88`; test `seo.test.ts:181`, `SeoPreview.test.tsx:131-133` (assert thêm `queryByText(/Ảnh đại diện/)` null) |
| Danh mục Dự án / Tuyển dụng giữ câu báo T06 | OK | `SeoPreview.tsx:77-84` early-return `seoNoPublicPageNote` chạy TRƯỚC khi render note mới; test T06 vẫn PASS |
| Collection khác + Trang chủ giữ câu cũ | OK | nhánh else `seo.ts:51` chuỗi y hệt `SEO_NOTE` cũ; test `seo.test.ts:182-185` (`news`, `pages`, `undefined`), `SeoPreview.test.tsx:38` |
| Test đủ; eslint/typecheck/vitest PASS | OK | bảng trên |
| Không lộ thuật ngữ dev | OK | chỉ "Tên", "Mô tả danh mục", "Tiêu đề", "Tóm tắt", "Ảnh đại diện" |

## Responsive Checklist Gate
N/A — diff chỉ đổi nội dung text node trong `<p>` sẵn có, không đổi layout/CSS/cấu trúc component.

## Skill gates
- aislop: skip — soi tay diff ~20 dòng: không slop.
- oxlint: skip, oxlint not configured (eslint PASS).
- ocr: skip, ocr not installed.
- AI-readable: OK — `seoIntroNote` tên rõ, hàm 5 dòng, docblock nêu WHY.
- ai-friendly-web / blitzstrike: N/A.
- Surgical diff: OK.

## Findings
Không có CRITICAL / MAJOR.

- [MINOR] (ghi nhận, không chặn) `src/lib/admin/seo.ts:49-51` — hai chuỗi note inline trong hàm thay vì hằng đặt tên; chấp nhận được.

## Residual risk
- Không có browser; hiển thị thực tế dựa vào component test (jsdom) — rủi ro thấp vì chỉ đổi text node.
- Cảnh báo LF→CRLF do autocrlf máy, không phải lỗi nội dung.

## Verdict: ✅ PASS
