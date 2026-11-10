# bug-careers-empty-state-no-cta · phase-1-task-01 — Trạng thái "chưa có vị trí" mời gửi CV nhưng không có nút khi thiếu email (BL-120)

- Change doc: `spec/changes/2026-11-10-careers-empty-state-no-cta.md` (BACKLOG BL-120).
- Phụ thuộc: không (BL-114 đã done).
- Trạng thái: `done` — NORMAL PASS round 1 (`.context/review-reports/bug-careers-empty-state-no-cta-phase-1-task-01-round-1-review.md`); 3 MINOR không chặn (test EN lấy href từ `publicPath` thay vì ghi cứng `/en/contact`; comment prop `invite` "chỉ truyền" nên là "chỉ hiển thị"; file test > 300 dòng có từ trước). Spec 1.63.2 / scope v119.

## Classification / Risk
- Type: **BUG** (user duyệt "sửa đi" 2026-11-10; hướng sửa đã chốt).
- Severity: low-medium (câu mời treo, không mất dữ liệu).
- Risk: **LOW** — chỉ trang `/tuyen-dung` (+ `/en/careers`): `NoJobsPanel` + điều kiện render `CareersCvBanner`. Không đổi `CtaBanner`, API, schema.
- Expected review level: NORMAL.
- Doc impact dự kiến: SPECIFICATIONS (change-request ghi, as-built PATCH); `.context/design-spec.md` S12 dòng "Trống" đang bẩn ngoài scope → không sửa, ghi follow-up.

## Root cause (đã chứng minh)
`src/components/careers/JobListPage.tsx:120-135` (`NoJobsPanel`) luôn render `noJobsDescription` ("Bạn vẫn có thể gửi CV để TAMI liên hệ khi có vị trí phù hợp." — `src/i18n/messages/vi.json:811`, en:811), còn nút `mailto:` + `CopyEmailButton` chỉ render khi `loadContactEmail` (`JobListPage.tsx:110-117`) trả email. Cài đặt website thiếu email (hoặc đọc site-settings lỗi) → câu mời gửi CV treo, không có cách gửi. Có từ ba64fd3e (layer 6); BL-114 không đổi điều kiện.
Cùng lỗi ở banner: `CareersCvBanner` (`src/components/careers/CareersCvBanner.tsx:17-30`) khi thiếu email vẫn hiện "Chưa tìm thấy vị trí phù hợp?" + "Gửi CV của bạn, chúng tôi sẽ liên hệ…" (`page.careers.v2.cvDescription`) nhưng không có nút (test hiện tại `JobListPage.test.tsx:357-361` còn khẳng định hành vi này).

## Thiết kế fix (đã chốt)
- **Panel trống, không lọc, KHÔNG có email:** không hiện `noJobsDescription`; thay bằng câu trung tính i18n mới (VI "Hãy quay lại sau hoặc liên hệ TAMI để được tư vấn." / EN "Please check back later or contact TAMI for advice.") + link "Liên hệ TAMI" / "Contact TAMI" tới `publicPath("/lien-he", locale)` (cùng style link `accent-text` min-h-11 như nút mailto).
- **Có email:** giữ nguyên BL-114 (câu mời + "Gửi CV tới <email>" + "Sao chép email").
- **Banner "Gửi CV ngay":** thiếu email → **không render banner** (banner tư vấn `ConsultBanner` ngay sau đã dẫn tới Liên hệ; banner mời gửi CV không có cách gửi là cùng lỗi). Có email → như BL-114.
- Panel lọc không kết quả (`EmptyState filtered`) không đổi.

## Files
- Sửa: `src/components/careers/JobListPage.tsx`, `src/components/careers/JobListPage.test.tsx`, `src/i18n/messages/vi.json`, `src/i18n/messages/en.json`; có thể `src/components/careers/CareersCvBanner.tsx` (chỉ comment/prop doc nếu cần).
- KHÔNG đụng: file bẩn ngoài scope, `.context/runs/*`, `CtaBanner`, `JobDetail.tsx`.

## Acceptance
- [ ] Không email: panel trống không còn câu mời gửi CV; có câu trung tính + link "Liên hệ TAMI" → `/lien-he` (VI) và bản EN → đường dẫn liên hệ EN.
- [ ] Có email: vẫn "Gửi CV tới <email>" + "Sao chép email" + câu mời (BL-114).
- [ ] Không email: không có banner "Chưa tìm thấy vị trí phù hợp?"; có email: banner như cũ.
- [ ] Test `JobListPage.test.tsx` thêm case thiếu email (VI + EN), test hồi quy fail trước / pass sau.
- [ ] `pnpm typecheck`, eslint file đổi, `pnpm vitest run src/components/careers src/i18n` PASS.

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → `architecture_review_needed`.

## Repro Verification
- Original repro: `/tuyen-dung`, 0 vị trí còn hạn, không lọc, Cài đặt website không có email → panel "Hiện TAMI chưa có vị trí đang tuyển." + "Bạn vẫn có thể gửi CV…" không có nút.
- Expected: không có lời mời gửi CV khi không có cách gửi; có hướng đi tiếp (Liên hệ TAMI).
- Actual before fix: thiếu email (hoặc site-settings lỗi) → panel hiện "Bạn vẫn có thể gửi CV..." không nút; banner "Chưa tìm thấy vị trí phù hợp?" hiện không nút. Test hồi quy mới FAIL trước fix (4 test: BL-120 vi, BL-120 en, site-settings lỗi, banner thiếu email).
- Actual after fix: thiếu email → panel chỉ có câu trung tính + link "Liên hệ TAMI" (VI `/lien-he`, EN theo `publicPath("/lien-he","en")`), không có banner Gửi CV; có email → như BL-114 (câu mời + mailto + Sao chép email + banner).
- Evidence: `pnpm vitest run src/components/careers src/i18n` 8 file / 70 test PASS; `pnpm typecheck` PASS; eslint 3 file đổi sạch.
- Status: PASS

## Residual risk
- Builder: không phát hiện thêm. Banner ẩn khi thiếu email là thay đổi hành vi có chủ đích (đã duyệt).
- Ngoài scope (follow-up): trang chi tiết tin hết hạn `JobDetail.tsx:101-110` — `expiredCvPrompt` hiện cả khi thiếu email (cùng mẫu lỗi), nhưng còn nút "Xem tất cả vị trí" nên không treo hoàn toàn.

## Doc impact
- SPECIFICATIONS: change-request ghi (as-built PATCH). `.context/design-spec.md` S12 "Trống": không sửa (file bẩn ngoài scope), follow-up. Không đổi API/ERD/schema.
