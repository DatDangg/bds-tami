# Spec Update — 2026-11-18 lead-form-name-validation

**spec_version:** 1.64.0 → 1.64.1 (PATCH — as-built bug-fix BL-123, siết validate theo quy ước repo như BL-114/120)
**Trigger:** bug-fix (BL-123, `bug-lead-form-name-validation`)
**Requirements:** SỬA luật họ tên trong FR lead (SPECIFICATIONS.md, tìm "BL-123") áp cho form lead và form ứng tuyển: chỉ chữ cái mọi ngôn ngữ (kể cả dấu VI, NFD), khoảng trắng, `'` `’` `-` `.`; không số, không ký tự khác; ≥ 2 chữ cái; trim + gộp khoảng trắng (server lưu bản chuẩn hoá); max lead 100 / ứng tuyển 120. Hàm chung `src/lib/person-name.ts` cho client + server. docs/API_SPEC.md §3.1/§3.2 `fullName` cập nhật.
**Hành vi:** sai → lỗi dưới ô họ tên (VI: "Họ tên chỉ gồm chữ cái, khoảng trắng và các dấu ' - . (ít nhất 2 chữ cái)." / EN: "Name may contain only letters, spaces and ' - . (at least 2 letters).") và không gửi; gọi thẳng API → 400 `details` field `fullName`, không tạo lead/hồ sơ.
**Ảnh hưởng:** form lead ở /lien-he, /en/contact, chi tiết tin cho thuê, tin BĐS, dự án, /tin-tuc, popup; form ứng tuyển /tuyen-dung/[slug]; API POST /api/public/leads, POST /api/public/job-applications. Không schema/migration.
**Không đổi:** SĐT/email/consent/Turnstile/rate limit; chống trùng lead 7 ngày.
**Evidence:** `.context/review-reports/bug-lead-form-name-validation-phase-1-task-01-round-1-review.md` (STRICT PASS), ảnh `.context/review-reports/assets/bl123-p1t01-{vi-special,vi-digits,en-special}-1920.png`.
**Scope sinh:** spec/test-scope/current.json (scopeVersion 122)
