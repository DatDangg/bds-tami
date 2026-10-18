# Spec Update — 2026-10-19 utm-capture-public-layout

**spec_version:** 1.4.1 → 1.5.0 (MINOR — đổi/mở rộng hành vi: nơi ghi UTM từ "trang có LeadForm" thành "mọi trang công khai"; không đổi API/schema)

**Trigger:** feature-update (Change Request MODIFY, BL-010) — change doc `spec/changes/2026-10-19-utm-capture-public-layout.md`, task `tasks/feature-utm-capture-public-layout/phase-1-task-01.md`

**Nguồn:** review L10-T01 round 1 MINOR-2 — UTM chỉ được ghi khi trang có `LeadForm` mount (`src/components/leads/LeadForm.tsx:49`) → khách vào từ quảng cáo ở trang chủ/danh sách rồi sang trang chi tiết thì mất UTM.

**Requirements:**
- SỬA **F9 (Lead) / BR-10** trong `SPECIFICATIONS.md`: thêm câu — UTM (`utm_source/medium/campaign/term/content`) được ghi ở **mọi** trang công khai VI/EN (island client ở khung trang, không làm trang thành dynamic) vào `sessionStorage` của phiên; URL mới có UTM ghi đè bản đã lưu, URL không có UTM không ghi; form lead gửi kèm UTM của URL hiện tại, không có thì bản đã lưu.
- SỬA **design-spec §3.3** (Form lead, "Gửi kèm ẩn"): `utm` ghi ở mọi trang công khai bởi island client trong khung trang; lúc gửi ưu tiên UTM của URL hiện tại, không có thì bản đã lưu (thay cho "đọc từ URL lần đầu vào phiên").
- Liên quan (không đổi chữ): **FR-PUB-13** (form lead), **BR-10** (nguồn lead).

**Code dự kiến (builder chốt):**
- `src/components/leads/UtmCapture.tsx` (mới, `"use client"`, render `null`; gọi `captureUtm()` khi mount và khi `usePathname()` đổi; không dùng `useSearchParams`)
- `src/components/layout/PublicShell.tsx` (gắn island — dùng cho `[locale]/layout.tsx` + `app/not-found.tsx` qua `PublicDocument`)
- `src/components/leads/LeadForm.tsx` (bỏ/giữ `captureUtm` khi mount; `readUtm()` lúc gửi giữ nguyên)
- `src/lib/leads/utm.ts` (nếu cần)
- Test: `UtmCapture` test, `PublicShell.test.tsx`, `LeadForm.test.tsx`, `src/lib/leads/utm.test.ts`

**Schema/API:** không đổi (trường `utm` của lead đã có).

**Ảnh hưởng:**
- Mọi trang công khai VI/EN (khung trang dùng chung) + trang 404.
- Retest: gửi lead ở dự án, tin cho thuê (khung dính), bài Đăng tin BĐS, trang liên hệ; layout vẫn static/ISR (island không làm dynamic, không CSR bailout).

**Docs đã cập nhật:** `SPECIFICATIONS.md` F9 + version; `.context/design-spec.md` §3.3. As-built (`docs/API_SPEC.md`/`docs/ERD.md`): no doc impact.

**Scope sinh:** `spec/test-scope/current.json` scopeVersion 5
