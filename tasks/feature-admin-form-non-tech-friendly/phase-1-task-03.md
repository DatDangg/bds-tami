# feature-admin-form-non-tech-friendly · phase-1-task-03 — Form Lead gọn cho sale (BL-042 #11)

- Change doc: BL-042 bảng điểm #11. Phụ thuộc: T01. Trạng thái: `pending`.

## Classification / Risk
- Type: **MODIFY** (bố cục form + component hiển thị; KHÔNG schema/access). Risk: **HIGH** — Lead chứa PII, access theo trường (BR-32: SĐT/email chỉ admin + sale phụ trách; `ipHash`/`userAgent` adminOnly) → review **STRICT**.
- Blast radius: `src/collections/Leads.ts`, component mới `src/components/admin/Lead*.tsx`, CSS admin, test Leads hiện có.

## Quyết định (auto proceed)
- D1 **UTM + URL**: bọc `utm` + `pageUrl` + `referrer` vào `collapsible` KHÔNG tên "Dữ liệu chiến dịch marketing" (`initCollapsed: true`) trong tab Nguồn. `pageUrl`/`referrer` hiển thị link rút gọn (host + path cắt `…`, `target=_blank rel="noopener noreferrer"`) bằng component Field chỉ đọc; chỉ link `http(s):` (chặn `javascript:`/khác → chữ thường). Đường dẫn dữ liệu không đổi.
- D2 **Consent**: `consentAt` + `consentVersion` chuyển từ tab Khách hàng xuống CUỐI tab Nguồn (chỉ đọc như cũ), có thể gom `row` "Đồng ý chính sách".
- D3 **Mốc thời gian**: `firstContactedAt`, `lastActivityAt`, `mergedCount`, `remindedAt` không hiện ở form (`admin.hidden` hoặc tương đương; kiểm không làm mất cột/bộ lọc nghiệp vụ đang có — nếu `admin.hidden` làm mất cột/lọc cần giữ như `lastActivityAt`, dùng `admin.components.Field` trả null thay vì `hidden`). `assignedAt` giữ (admin sửa được). Thêm `ui` `activitySummary` ở sidebar: "Hoạt động gần nhất: 2 giờ trước · Liên hệ lần đầu: dd/MM/yyyy HH:mm · Khách gửi lại 2 lần" (bỏ phần trống; thời gian tương đối tiếng Việt).
- D4 **anonymizedAt**: không hiện ở form. Job ẩn danh không đổi.
- D5 **Nút liên hệ**: cạnh `phone`: "Gọi" (`tel:<số>`) + "Zalo" (`https://zalo.me/<số chuẩn hoá 0xxxxxxxxx, +84/84 → 0, bỏ khoảng trắng/ký tự>`); cạnh `email`: "Gửi email" (`mailto:`). Chỉ render khi field có giá trị trong form (không quyền đọc → không giá trị → không nút; KHÔNG fetch thêm). Vùng bấm ≥ 44px, nhãn rõ, AA.
- D6 **locale**: `admin.readOnly: true` (giữ `required`/access/schema). readOnly chỉ UI.
- D7 Test: config Lead (collapsible chứa utm/pageUrl/referrer + `initCollapsed`; consent cuối tab Nguồn; anonymizedAt + 4 mốc không hiện; locale readOnly; access field KHÔNG đổi — so access trước/sau); unit test component (link rút gọn chặn `javascript:`, zalo chuẩn hoá `+84 956 789 012` → `0956789012`, tóm tắt thời gian). Test Leads hiện có PASS (export, search, quick filter, assignment, list columns BL-039).

## Acceptance
- [ ] UTM + Trang gửi/đến trong khối thu gọn "Dữ liệu chiến dịch marketing" (mặc định đóng, URL rút gọn bấm mở được).
- [ ] Consent ở cuối tab Nguồn, chỉ đọc.
- [ ] Mốc thời gian = 1 dòng tóm tắt; `anonymizedAt` không hiện.
- [ ] SĐT: Gọi + Zalo; email: Gửi email.
- [ ] Ngôn ngữ khách là nhãn chỉ đọc.
- [ ] Không đổi schema/access/endpoint; test Lead cũ PASS.

## Verify
`pnpm vitest run src/lib/admin src/collections src/components/admin src/lib/leads` (+ test leads khác nếu có), `pnpm typecheck`, `pnpm lint`, importmap + generate:types không đổi trường.

## Verification summary
- Builder: vitest (src/lib/admin src/collections src/components/admin src/fields src/lib/leads src/hooks/leads src/endpoints src/jobs src/lib/retention) 78 file / 663 test PASS (gồm lead-contact.test, LeadFormDisplay.test, leads-form.test mới); typecheck PASS; lint 0 error (2 warning cũ tools/); generate:importmap thêm 7 component; generate:types KHÔNG đổi payload-types (không schema/access/endpoint/migration).
- Lệch D3 có chủ đích: 5 mốc (firstContactedAt/lastActivityAt/mergedCount/remindedAt/anonymizedAt) dùng `admin.components.Field` trả null thay `admin.hidden` để `hideTechnicalListFields` KHÔNG bỏ cột/lọc đang dùng (BL-039). `locale` theo G7 (nhãn chữ chỉ đọc, bỏ readOnly).
- Nút liên hệ/link chỉ đọc từ form state, không fetch; `pageUrl`/`referrer` chỉ http(s) bấm được. Chưa kiểm tay trên trình duyệt (residual).

## Bổ sung sau spec-validation plan r1
- G7 → D6: `locale` dùng component Field chỉ đọc hiện nhãn chữ ("Tiếng Việt"/"Tiếng Anh") thay ô chọn bị khoá (dữ liệu/access/required giữ).
