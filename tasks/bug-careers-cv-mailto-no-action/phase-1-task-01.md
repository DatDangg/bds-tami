# bug-careers-cv-mailto-no-action · phase-1-task-01 — "Gửi CV tới <email>" không phản ứng khi máy không có mail client (BL-114, QA 31)

- Change doc: `spec/changes/2026-11-09-careers-cv-mailto-no-action.md` (BACKLOG BL-114).
- Phụ thuộc: không.
- Trạng thái: `done` — NORMAL PASS round 2 (`.context/review-reports/bug-careers-cv-mailto-no-action-phase-1-task-01-round-2-review.md`; r1 FAIL: vòng focus nút sao chép trên banner ảnh khoảng 2.9:1). MINOR-4 r2 (mobile nút sao chép không full-width như nút chính) không chặn

## Classification / Risk
- Type: **BUG** (thêm nút sao chép email cạnh nút `mailto:` — hướng xử lý đã duyệt).
- Severity: medium.
- Risk: **LOW-MEDIUM** — trang `/tuyen-dung` (trạng thái trống) + banner "Gửi CV ngay" (`CtaBanner` dùng chung — KHÔNG đổi hành vi CtaBanner ở trang khác).
- Expected review level: NORMAL.
- Doc impact dự kiến: SPECIFICATIONS (change-request ghi); `docs/DESIGN.md` nếu có mô tả nút "Gửi CV" (builder grep, chỉ đề xuất — file đang bẩn ngoài scope).

## Root cause (đã chứng minh)
Nút là `mailto:` đúng (`src/components/careers/JobListPage.tsx:125` trong `NoJobsPanel`, banner `src/components/careers/CareersCvBanner.tsx:23` qua `CtaBanner actionHref`). `mailto:` chỉ chạy khi máy có ứng dụng email mặc định → máy chỉ dùng webmail bấm không thấy gì. Không phải lỗi link.

## Thiết kế fix (đã duyệt)
- Giữ `mailto:`; thêm nút **"Sao chép email"** (EN "Copy email") cạnh nút ở CẢ trạng thái trống (`NoJobsPanel`) và banner "Gửi CV ngay" (`CareersCvBanner`).
- Bấm → `navigator.clipboard.writeText(email)` → thông báo nhìn thấy **"Đã sao chép"** (EN "Copied") qua vùng `role="status" aria-live="polite"`, tự ẩn ~3s; lỗi clipboard → câu lỗi (vd "Không sao chép được, email: <email>"). Mẫu có sẵn: `src/components/posts/CopyVoucherButton.tsx` (site công khai không có hệ thống toast). Tạo client component nhỏ dùng chung (vd `src/components/careers/CopyEmailButton.tsx`) — trang/banner vẫn là Server Component.
- Banner: `CtaBanner` (`src/components/layout/CtaBanner.tsx`) hiện chỉ nhận 1 action — thêm cách gắn nút phụ tối thiểu (vd prop `secondaryAction?: ReactNode` hoặc `children` khu vực hành động) KHÔNG đổi giao diện các nơi khác đang dùng CtaBanner; kiểm style nút trên nền ảnh/tối (tương phản, focus-visible, vùng chạm ≥ 44px). Nếu CtaBanner đã có slot nút phụ (vd `secondaryLabel`) thì dùng lại.
- i18n: key mới trong `src/i18n/messages/vi.json` + `en.json` (namespace `page.careers.v2` hoặc tương đương) — `messages-check` PASS (cấm gạch dài "—" trong chuỗi i18n).
- Email hiển thị đầy đủ trong nhãn nút mailto như cũ ("Gửi CV tới <email>").

## Files
- Mới: `src/components/careers/CopyEmailButton.tsx` (+ test).
- Sửa: `src/components/careers/JobListPage.tsx`, `src/components/careers/CareersCvBanner.tsx`, có thể `src/components/layout/CtaBanner.tsx` (thêm slot tối thiểu), `src/i18n/messages/vi.json`, `src/i18n/messages/en.json`, test liên quan (careers / CtaBanner).
- KHÔNG đụng: file bẩn ngoài scope, `.context/runs/*`.

## Acceptance
- [ ] Trạng thái trống `/tuyen-dung`: có "Gửi CV tới <email>" (mailto) + "Sao chép email"; bấm sao chép → clipboard = email + "Đã sao chép" nhìn thấy.
- [ ] Banner "Gửi CV ngay": có nút sao chép email cạnh nút mailto; không có email → không có cả hai nút (như cũ).
- [ ] Bản EN chữ tiếng Anh; `messages-check` PASS.
- [ ] Các nơi khác dùng `CtaBanner` không đổi (test/snapshot hiện có PASS).
- [ ] Test hồi quy (fail trước / pass sau).
- [ ] `pnpm typecheck`, eslint file đổi, `pnpm vitest run src/components/careers src/components/layout src/i18n` PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Repro Verification
- Original repro: /tuyen-dung (chưa có vị trí), máy không có mail client, bấm "Gửi CV tới tami@gmail.com" → không có gì xảy ra.
- Expected: có cách lấy email khi `mailto:` không mở được gì: nút "Sao chép email" cạnh "Gửi CV tới <email>" (trạng thái trống) và cạnh "Gửi CV ngay" (banner); bấm → clipboard = email + chữ "Đã sao chép" nhìn thấy.
- Actual before: chỉ có link `mailto:`; máy không có mail client bấm không thấy phản ứng.
- Actual after: thêm `CopyEmailButton` (client) ở cả hai nơi; kết quả báo qua `aria-live="polite"`, tự ẩn 3s; lỗi clipboard → "Không sao chép được, email: <email>". Banner qua prop mới `CtaBanner.extraAction` (không truyền → giao diện các nơi khác không đổi). Không có email → không có nút nào (như cũ).
- Evidence: `CopyEmailButton.test.tsx` (3 ca: copy OK, copy lỗi, EN); `JobListPage.test.tsx` (nút ở panel trống, ở banner, vắng khi thiếu email). Chưa kiểm bằng trình duyệt thật.
- Status: PASS (theo test tự động) — chờ review round 1.
- Ghi chú thiết kế: vùng thông báo dùng `aria-live="polite"` trần thay vì `role="status"` vì panel trống đã là `role="status"` (lồng thêm sẽ làm test/AT thấy hai vùng trùng vai trò).
- Files: mới `src/components/careers/CopyEmailButton.tsx` + `.test.tsx`; sửa `JobListPage.tsx`, `CareersCvBanner.tsx`, `src/components/layout/CtaBanner.tsx` (prop `extraAction`), `src/i18n/messages/{vi,en}.json` (`page.careers.v2.cvCopy|cvCopied|cvCopyFailed`), `JobListPage.test.tsx`.
- Verify: `pnpm typecheck` PASS; eslint 6 file đổi sạch; `pnpm vitest run src/components/careers src/components/layout src/i18n` 30 file / 229 test PASS. Repo không có script `messages-check` riêng (parity vi/en do test trong `src/i18n` kiểm).

## Residual risk
- Chưa kiểm trực quan trên nền ảnh banner (nút `chip` size lg, đã có scrim) và ở 375/768/1280; nút cao 52px (lg) / 44px (md) đạt vùng chạm.
- `navigator.clipboard` cần HTTPS (production có HTTPS); trường hợp khác đã có nhánh báo lỗi kèm email.

## Doc impact
- `docs/DESIGN.md`: grep "Gửi CV" không có mô tả → no doc impact (file đang bẩn ngoài scope, không sửa). SPECIFICATIONS do change-request ghi.
