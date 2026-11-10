Agent: reviewer

# Review: bug-careers-empty-state-no-cta, phase-1-task-01, round 1 (BL-120)

- **Review level:** NORMAL
- **Reason:** Đây là bug UI hẹp trên một trang công khai (`/tuyen-dung` và `/en/careers`). Diff không đụng auth, tenant, schema, API hay DTO. `CareersCvBanner` đổi prop thành bắt buộc nhưng chỉ có một nơi dùng (JobListPage.tsx:267), nên không phải thay đổi shared component có nhiều client. Diff có đụng UI nên không chọn FAST.
- **Blast radius:** `src/components/careers/JobListPage.tsx` (NoJobsPanel, điều kiện render banner), `src/components/careers/CareersCvBanner.tsx` (prop `email` thành bắt buộc), `src/components/careers/JobListPage.test.tsx`, i18n `page.careers.noJobsNoEmailDescription` và `page.careers.contactCta` (vi/en). Grep `CareersCvBanner` trong `src/` chỉ ra JobListPage.tsx:7 và :267, nên prop bắt buộc không làm vỡ nơi nào khác (typecheck cũng PASS). `CtaBanner`, `EmptyState` filtered và `JobDetail.tsx` không bị đổi.

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm typecheck` (tsc --noEmit) | PASS (exit 0) |
| `pnpm exec eslint` cho JobListPage.tsx, CareersCvBanner.tsx, JobListPage.test.tsx | PASS (exit 0, không có lỗi hay cảnh báo) |
| `pnpm vitest run src/components/careers src/i18n` | PASS, 8 file / 70 test |

## Kiểm các điểm được yêu cầu
- **Locale prefix của link nội bộ:** Link dùng `next/link` với `publicPath("/lien-he", locale)`. Cách này giống phần lớn trang công khai trong repo (JobDetail.tsx, JobRow.tsx, OtherJobs.tsx, Breadcrumb, EmptyState...). `RentalListPage.tsx:272` cũng dùng đúng `publicPath("/lien-he", locale)` cho `adviceHref`. Repo chỉ dùng `@/i18n/navigation` Link ở CookieBanner và ConsentCheckbox (client component). EN đi qua map `/lien-he` → `/en/contact`, đã có test (redirect-paths.test.ts, nav-link.test.ts). OK.
- **Ẩn banner khi thiếu email:** Hợp lý. `ConsultBanner` vẫn render ngay sau và có test khẳng định `consult-banner` còn hiện. Banner mời gửi CV mà không có nút là cùng lỗi gốc. Hướng sửa này đã được user duyệt trong task. OK.
- **Prop bắt buộc:** Ngoài JobListPage không còn nơi dùng nào. Typecheck PASS. OK.
- **i18n parity và cấm "—":** Đã thêm 2 key ở cả vi và en, cùng vị trí. Không có em-dash. Test `src/i18n` PASS. OK.
- **A11y:** Panel giữ `role="status"`. Link "Liên hệ TAMI" dùng `min-h-11` (44px), cùng class với nút mailto qua hằng `NO_JOBS_LINK_CLASS`. Nhãn link là text có nghĩa. OK.
- **Test fail trước / pass sau:** Các case mới khẳng định: không còn câu mời gửi CV, có câu trung tính, có link Liên hệ đúng href, không có mailto, không có nút Sao chép, không có banner. Code cũ luôn render `noJobsDescription` và luôn render banner, nên các assertion `not.toHaveTextContent(invite)`, `getByRole("link", {name: contactLabel})` và `queryByRole("region") toBeNull` chắc chắn FAIL trên code cũ. Tôi không chạy lại code cũ để chứng minh; kết luận dựa trên đọc diff. Case có email giữ BL-114 làm guard hồi quy. Có ý nghĩa.

## Repro Verification (bug task)
Task file ghi Status `PASS`. Bằng chứng là test tự động, tôi đã chạy lại và xác nhận: vitest 70/70, typecheck, eslint. Repro gốc (thiếu email hoặc site-settings lỗi → câu mời treo, không có nút) được các test BL-120 vi/en và case "site-settings lỗi" phủ. Kiểm chứng được.

## Responsive Checklist Gate
Phạm vi chỉ gồm thay đổi UI trong diff: dòng text và link trong NoJobsPanel, cùng việc ẩn hoặc hiện banner. Không có môi trường browser, nên xác minh bằng cách đọc CSS và class.
- Layout, không scroll ngang: OK. Panel là `flex flex-col items-center`, text `max-w-[60ch]`, link `inline-flex`. Không có width cố định bằng px.
- Mobile-first, grid auto-fit: N/A. Diff không thêm grid hay media query.
- Typography và spacing: OK. Dùng token `text-body` và `text-h3`, cùng scale `gap-3` và `py-section-tight` có sẵn. Không có font-size px mới.
- Media (ảnh/video): N/A. Ảnh banner chỉ được giữ nguyên hoặc ẩn đi, không đổi gì.
- Touch target ≥ 44×44: OK. Có `min-h-11`. Chiều ngang do nhãn "Liên hệ TAMI" quyết định, rộng hơn 44px.
- Nav và table: N/A.
- 100vh, reduced-motion, overflow hidden: OK hoặc N/A. Chỉ có `transition-colors` theo token duration. Không có `100vh` hay `overflow:hidden` mới.
- Residual: chưa render thật ở 375/768/1280. Rủi ro thấp vì đây chỉ là text căn giữa và một link.

## Skill gates
- aislop: skip, chưa cài `aislop`.
- oxlint (anti-slop): skip, oxlint chưa được cấu hình (không có `.oxlintrc.json` hay `oxlint.json`). eslint PASS thay thế.
- ocr (open-code-review): skip, chưa cài `ocr`.
- AI-readable: OK. Tên rõ ràng (`invite`, `neutral`, `contact`, `NO_JOBS_LINK_CLASS`). Không có magic number mới. JSDoc giải thích lý do (BL-120). JobListPage.tsx dài 295 dòng (≤ 300). 0 indicator mới.
- ai-friendly-web: N/A. Task không thêm route hay public asset, không đụng robots, sitemap hay llms.
- blitzstrike: N/A (không phải STRICT).

## Findings
- **[MINOR]** `src/components/careers/JobListPage.test.tsx:243`: case EN dùng chính `publicPath("/lien-he", locale)` làm giá trị kỳ vọng. Nếu `publicPath` map sai thì test vẫn PASS. Đề xuất ghi cứng giá trị mong đợi (`"/lien-he"`, `"/en/contact"`) trong bảng `it.each`. Không chặn PASS vì mapping đã có test riêng.
- **[MINOR]** `src/components/careers/JobListPage.tsx:126-127` (`NoJobsPanelProps`): JSDoc của `invite` nói "chỉ truyền khi có `mailto`", nhưng thực tế `invite` là prop bắt buộc và luôn được truyền. Panel tự chọn `mailto ? invite : neutral`. Đề xuất sửa comment thành "chỉ hiển thị khi có `mailto`".
- **[MINOR]** File test dài 396 dòng (> 300). Vấn đề này có từ trước, diff chỉ thêm khoảng 30 dòng. Ngoài scope, đề xuất task riêng tách file test.
- Ghi nhận (ngoài scope, builder đã ghi follow-up): `JobDetail.tsx` `expiredCvPrompt` có cùng mẫu lỗi khi thiếu email.

Không có CRITICAL hay MAJOR.

## Verdict
**PASS**
