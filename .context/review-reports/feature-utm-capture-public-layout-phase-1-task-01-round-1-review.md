Agent: reviewer

# Review — feature-utm-capture-public-layout · phase-1-task-01 · round 1

- Task: `tasks/feature-utm-capture-public-layout/phase-1-task-01.md` (MODIFY, BL-010)
- Change doc: `spec/changes/2026-10-19-utm-capture-public-layout.md`
- Branch: staging (chưa commit)

## Review level
**STRICT**

## Reason
Diff chạm `PublicShell`, khung dùng chung của mọi trang công khai VI/EN và cả 404 (`[locale]/layout.tsx` + `global-not-found.tsx` qua `PublicDocument`). Rủi ro đi kèm: layout có thể thành dynamic, thứ tự focus có thể đổi, và lead có thể mất UTM. Theo rule, đụng shared component là bắt buộc STRICT.

## Blast radius
- `src/components/layout/PublicShell.tsx`: mọi route `(frontend)/[locale]/**` và `global-not-found`.
- `src/components/leads/LeadForm.tsx`: form lead ở `lien-he/page.tsx`, `ProjectDetail`, `PostDetail`, `SaleContactBox`. Đã grep: cả 4 chỗ đều nằm dưới `[locale]/layout.tsx` → `PublicDocument` → `PublicShell`, nên island luôn có mặt cùng form.
- `src/lib/leads/utm.ts`: chỉ sửa comment, logic giữ nguyên.
- API, schema, response shape: không đổi.

## Verify commands + result
| Command | Result |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | Có 231 file test: 230 PASS, 1 FAIL. Có 2457 test: 2456 PASS, 1 FAIL. Test fail duy nhất là `src/endpoints/public/job-applications.test.ts` "vị trí hết hạn … → 400". Test này fail sẵn, phụ thuộc ngày, không liên quan task. |
| `pnpm build` | Reviewer không chạy lại (tránh ghi đè `.next` khi dev server có thể đang chạy). Builder báo PASS: `/[locale]/**` vẫn `●` SSG/ISR; 3 route `ƒ` là `force-dynamic` có sẵn. Kiểm theo code: island chỉ dùng `usePathname()` (không gây CSR bailout), không `useSearchParams`, server không đọc `searchParams`/`headers`. Ghi vào Residual risk. |

## Kiểm trọng tâm
| Mục | Kết quả | Bằng chứng |
|---|---|---|
| AC1: trang công khai bất kỳ có `utm_*` → lưu sessionStorage, quy tắc ghi đè giữ nguyên | OK | `UtmCapture.tsx` gọi `captureUtm(window.location.search)` khi mount và mỗi lần `pathname` đổi. Hàm `captureUtm` không đổi logic: URL có UTM thì ghi đè, không có thì return sớm. Test: `UtmCapture.test.tsx` (mount, ghi đè khi soft nav, giữ bản cũ khi URL không có UTM), `PublicShell.test.tsx` case island. |
| AC2: sang trang có LeadForm → gửi kèm UTM đã lưu | OK | `readUtm()` lúc gửi không đổi. Test `LeadForm.test.tsx`: "UTM lưu từ trang KHÔNG có form…" và "ưu tiên URL hiện tại". |
| AC3: không có `utm_*` → không ghi; layout không thành dynamic | OK (build: residual) | `parseUtmFromSearch` trả undefined thì return. Island render `null`; không dùng API dynamic. |
| AC4: sessionStorage không khả dụng → không crash | OK | Cả getter `window.sessionStorage` lẫn `setItem` đều nằm trong `try` (`utm.ts:39-44`). Có 2 test: `setItem` throw và getter throw. |
| AC5: test/lint/typecheck/build | OK | Xem bảng verify. |
| Bỏ `captureUtm` khỏi LeadForm có làm mất UTM không | Không mất | Mọi chỗ dùng LeadForm đều nằm trong PublicShell (đã grep). Soft nav đổi pathname: island chạy lại. Trong App Router, `HistoryUpdater` cập nhật URL bằng `useInsertionEffect` cùng commit, nên `window.location.search` đã mới khi effect chạy. Back/forward: bản đã lưu vẫn còn; pathname đổi thì capture lại, giống luồng thường. Trang có form và UTM trên URL: `readUtm` ưu tiên URL. Soft nav cùng pathname chỉ khác query: xem MINOR-1; hành vi cũ cũng không bắt ca này, nên không phải regression. |
| Focus/skip link, BL-001 | OK | `<UtmCapture />` render `null` nên không thêm node DOM; `SkipLink` vẫn là phần tử tương tác đầu tiên. Props Header/Footer (BL-001) không đổi; các test PublicShell cũ vẫn PASS. |
| Test có ý nghĩa | OK | Test dùng sessionStorage và history thật của jsdom, không mock `captureUtm`. Test (c) khẳng định LeadForm không tự ghi, đúng với contract mới. |
| Spec delta | OK | `SPECIFICATIONS.md` F9 + spec_version 1.4.1 → 1.5.0, design-spec §3.3, `spec/updates/…`, CHANGELOG và test-scope đều khớp với implementation. |

## Responsive Checklist Gate
**N/A.** Diff không đổi DOM/CSS hiển thị (island render `null`) và không có route/layout/CSS mới. Layout, Typography, Media, Touch và Viewport đều N/A.

## Skill gates
- aislop: skip, `aislop` chưa cài (`command -v` trả rỗng).
- oxlint (anti-slop): skip, oxlint not configured (không có `.oxlintrc.json`/`oxlint.json`; lint dùng eslint và PASS).
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK. Có 0 indicator: tên rõ (`UtmCapture`), hàm khoảng 5 dòng, không magic number. Comment giải thích WHY (tránh CSR bailout); spec và design-spec đã cập nhật luồng.
- ai-friendly-web: N/A. Không đổi bề mặt crawl, robots hay sitemap.
- blitzstrike: N/A. Không có auth, API public mới hay input server mới.

## Findings

### [CRITICAL]
Không có.

### [MAJOR]
Không có.

### [MINOR]
1. **`src/components/leads/UtmCapture.tsx:15-17`: soft nav cùng pathname nhưng khác query không capture.** Ví dụ `<Link href="?utm_source=x">` hoặc `router.replace` thêm `utm_*` trên cùng trang. Effect chỉ phụ thuộc `[pathname]` nên không chạy lại. Thực tế rất hiếm, vì UTM đến từ link quảng cáo bên ngoài (full load), và lúc gửi form `readUtm()` vẫn đọc URL hiện tại. Đây là đánh đổi có chủ đích để tránh `useSearchParams`. Code cũ (LeadForm mount-only) cũng không bắt ca này, nên không phải regression. Đề xuất: không cần sửa; nếu muốn có thể ghi chú ca giới hạn này vào doc comment.
2. **`src/components/leads/LeadForm.test.tsx`: case "UTM lưu từ trang KHÔNG có form…"** render `UtmCapture` ngoài router context, nên `usePathname` thật trả `null`. Test vẫn đúng ý (mount → capture), nhưng phụ thuộc ngầm vào hành vi của `next/navigation` khi không có context. Đề xuất (tùy chọn): mock `usePathname` như `PublicShell.test.tsx:12` để test không phụ thuộc phiên bản Next.

## Residual risk
- Reviewer không tự chạy lại `pnpm build`. Kết luận "layout vẫn ISR" dựa trên route table builder báo và việc kiểm code (chỉ `usePathname`, không có API dynamic).
- Chưa kiểm bằng browser thật thứ tự giữa `HistoryUpdater` và effect của island khi soft nav. Phân tích dựa trên kiến trúc App Router: URL được cập nhật trong `useInsertionEffect`, chạy trước `useEffect` cùng commit.

## Verdict
✅ **PASS**: không có CRITICAL/MAJOR, cả 5 mục acceptance đều đạt, verify commands PASS (trừ 1 test fail sẵn phụ thuộc ngày, không liên quan task).
