# Agent: spec-validator — feature-admin-form-ux-polish · phase 1 · round 1 (phase review, BL-058)

> Report persist bởi primary (hook guard.mjs chặn spec-validator Write do đường dẫn worktree lồng `.claude/worktrees/`). Nội dung nguyên văn của spec-validator.

- Mode: **Phase review** (sau 5 task PASS) — đối chiếu change doc Acceptance ↔ 5 task file ↔ commit (T01 `7711bad`, T02 `364e9c7`, T03 `00c48ec`, T04 `d767b30`, T05 `db437a1`) ↔ spec delta (`SPECIFICATIONS.md` 1.48.0 FR-ADM-19 khối BL-058 dòng 170/176 + F11 dòng 184, `spec/updates/2026-10-22-admin-form-ux-polish.md`, `spec/test-scope/current.json` v62).
- Verdict: **✅ PASS** (phase: COMPLETE — 0 ❌ · 2 ⚠️ nhỏ không chặn · residual đã biết giữ nguyên). Không cần vòng builder thêm; 2 gap dưới đi follow-up / sửa chữ spec ở close-out.
- Cách kiểm: Read task 01–05, change doc, spec update, test-scope; Read code đã commit (`RetranslateButton.tsx`, `no-browser-dialogs.test.ts`, `_field-errors.scss`, `_forms.scss`, `VersionHistoryView.tsx`, `version-history.ts`, `_version-history.scss`, `payload-vi-overrides.ts`, `content-defaults.ts`, `seo.ts` field, `SeoPreview.tsx`, `src/lib/admin/seo.ts`, `admin-labels.test.ts`, `Categories.ts`, `LegalPage.tsx`); `git show --stat` 5 commit. Không chạy verify command (đã có kết quả reviewer từng task + verify tổng thể trên branch).

## Quyết định user — ghi đúng?

| Quyết định | Change doc | Task | Spec | Code | Status |
|---|---|---|---|---|---|
| SEO = phương án B (không C) | dòng 74–77 | T05 decision log dòng 46 | F11 dòng 184 "phương án B … Không có xem trước chia sẻ" | `seo.ts` + `SeoPreview.tsx` (không có thẻ chia sẻ) | ✅ |
| Không cột "Ai sửa" (Q2), không migration | dòng 73 | T04 decision log dòng 51 | FR-ADM-19 (4) "không có cột Ai sửa … không migration" | `VersionHistoryView.tsx:29-37` 4 cột, không `updatedBy`; không file migration trong 5 commit | ✅ |
| Bỏ hẳn toast lỗi theo ô (Q3) | dòng 67 | T02 decision log dòng 65 | FR-ADM-19 (2) "bỏ hẳn thông báo nổi liệt kê" | `_field-errors.scss:59-61` | ✅ |

## Ma trận coverage (Acceptance change doc ↔ spec ↔ code)

| # | Requirement (change doc Acceptance dòng) | Spec | Task / commit | Evidence code | Status | Note |
|---|---|---|---|---|---|---|
| 1 | Không còn `window.alert/confirm/prompt`; "Dịch lại bằng AI" modal, Huỷ không gọi API (d.41) | FR-ADM-19 (1) | T01 `7711bad` | `RetranslateButton.tsx:3,18,42,45` ConfirmationModal; `retranslate()` chỉ chạy qua `onConfirm`, `if (busy) return` (:26); `no-browser-dialogs.test.ts:6,17` quét đúng 2 root; Grep `src/**` (bỏ test) = 0 match | ✅ | Reviewer r1 PASS; ảnh "trước" N/A (hộp native) — chấp nhận |
| 2 | Lỗi dưới từng ô + viền đỏ; tab đánh dấu; tự mở tab + cuộn ô đầu; không toast liệt kê (d.42) | FR-ADM-19 (2) + câu BL-042 sửa (d.170) | T02 `364e9c7` | `_field-errors.scss:7-53` (order/display/viền), `:59-61` ẩn toast có marker trừ `unmatched`; `FormErrorFocus.tsx` + `form-error-focus.ts` (provider, `payload.config.ts`, `importMap.js`); `followingFieldsInvalid_*` giữ (`payload-vi-overrides.ts:23-24`) | ✅ | Spec ghi đúng "pill sẵn có Payload, hiện với lỗi server" (builder xác minh). Xem ⚠️-2 về câu "toast như cũ" |
| 3 | Nút tạo mới tách rời ô, chỉ icon "+", `aria-label`, không vỡ màn hẹp (d.43) | FR-ADM-19 (3) + câu BL-042 sửa | T03 `00c48ec` | `_forms.scss:94-105` (36px, `margin-left: 8px`, radius đủ góc), `:138-143` mobile 44px; `relationship-add-new-style.test.ts`; tên đọc "Thêm mới: <mục>" do Payload cấp (task dòng 66) | ✅ | Chỉ CSS như spec. Nhánh popup nhiều collection / hasMany chưa kiểm mắt (MINOR đã ghi) |
| 4 | Màn lịch sử phiên bản dễ đọc, ảnh trước/sau (d.44) | FR-ADM-19 (4); F10 "lịch sử phiên bản" | T04 `d767b30` | `VersionHistoryView.tsx:45-57` (`sort -updatedAt`, `locale: "all"`, `overrideAccess: false`), `:30-36` giờ VN + ago + badge + "N trường đã đổi" + "Phiên bản hiện tại"; `version-history.ts:10` hidden set; `_version-history.scss:103-107` khớp đúng 5 trường spec; `payload-vi-overrides.ts:147-148` "Bản đã lưu"/"Phiên bản hiện tại"; `content-defaults.ts:222-223` gắn cho collection có versions (Categories/Developers `versions: false` → không gắn) | ✅ | 7 collection = Projects/Rentals/PropertyPosts/News/JobPostings/Services/Pages (Grep `withContentDefaults(`) khớp spec. Ảnh t04 before/after có trong commit. Gap giữ mặc định (So sánh với, ngôn ngữ, dateFormat) đã ghi trong spec |
| 5 | Tab SEO theo phương án user chốt (d.45) | F11 "Tab SEO trong admin (BL-058, B)"; FR-ADM-19 (5) | T05 `db437a1` | `seo.ts:36` `label: false`; `:18-31` collapsible "Nâng cao" `initCollapsed: true` chứa `noindex`+`canonical` (vỏ không tên → path `seo.*` giữ, test `seo.test.ts`); `:46,56` beforeInput/afterInput; `SeoPreview.tsx:12` câu "Để trống thì trang tự lấy từ Tiêu đề, Tóm tắt và Ảnh đại diện"; `src/lib/admin/seo.ts:13-15` 60 / 120–160, `:111-120` `/en` chỉ khi `hasEnglish`, `:28-35` mô tả theo loại trang, `homepageSeoFallback`; `content-defaults.ts:175-177` giữ nhãn "SEO" khi không có tab; `admin-labels.test.ts:51-61` cho phép group `label:false` dưới tab có nhãn | ✅ | Placeholder tĩnh đúng như spec ghi. Trang pháp lý: public `LegalPage.tsx:24-31` không truyền `description` → preview không fallback mô tả = khớp. Xem ⚠️-1 về Danh mục |
| 6 | Test/typecheck/lint/build PASS; ảnh 1440 trước/sau từng mục (d.46) | — | T01–T05 verification summary; test-scope `verification` | T05: unit+ui 3341/3341, build PASS; integration + ảnh **BLOCKED** (Postgres down) | ✅ (residual đã biết) | `pnpm lint` full fail do lỗi pre-existing ngoài `src/tests` — đã ghi ở T05 d.53 + test-scope d.131, không thuộc BL-058 |
| 7 | Không đổi schema / không migration (Ghi chú d.49) | FR-ADM-19 (5) câu cuối; spec update d.25; test-scope `migration` | — | 5 commit không có `src/migrations/*`; `payload-types.ts` không trong commit (chỉ lệch EOL, dirty ngoài scope) | ✅ | |
| 8 | Spec publish nhất quán | — | spec-publisher | `SPECIFICATIONS.md:9` 1.48.0; `spec/CHANGELOG.md:68` 1.48.0; test-scope `specVersion` 1.48.0 / `scopeVersion` 62 / `previousScope` archive 1.47.0-61 (file có trong git status) | ✅ | Change doc d.62 ghi "đã áp 1.48.0" khớp |

## Gaps

### ⚠️-1 [PARTIAL] Scope tab SEO trong spec thiếu Danh mục; khung xem trước trên Danh mục hiện placeholder sai
- Requirement: F11 dòng 184 "tab/khối SEO của **7 collection nội dung + global Trang chủ**"; T05 "Yêu cầu chung" dòng 26 "Áp đồng nhất cho 7 collection + Trang chủ".
- Thực tế code: `Categories.ts:74` `omit: ["status","publishedAt","author","isFeatured"]` — **không omit `seo`** → Danh mục cũng nhận `seoField()` mới (nhãn "SEO" ở cấp gốc vì không có tab, `content-defaults.ts:175-177`) kèm `SeoPreview` + bộ đếm. Nhưng với Danh mục: `useAsTitle: "name"` (`Categories.ts:26`) nên `SeoPreview.tsx:33` đọc `title` = undefined; `seoPagePathKey` (`src/lib/admin/seo.ts:96-103`) không có khoá `categories` trong `CONTENT_ROUTES` (`content-paths.ts:15-21`) → URL rỗng; `SEO_DESCRIPTION_SOURCE` không có `categories`. Kết quả: khung xem trước ở Danh mục luôn hiện "Tiêu đề trang" / "Đường dẫn sẽ có sau khi lưu trang" / "Mô tả trang sẽ hiện ở đây…" kể cả bản ghi đã lưu có URL công khai (`/<loại>/danh-muc/[slug]`), tên danh mục và mô tả — **gây hiểu sai** đúng rủi ro test-scope d.134 nêu ("lệch = gây hiểu sai cho người nhập"). Reviewer r4 không xét Danh mục (report chỉ nhắc `Homepage.ts:288`).
- Liên quan: T05. Không vi phạm acceptance đã viết (acceptance chỉ nói 7 collection + Trang chủ), nên không FAIL; nhưng spec as-built đang **thiếu** 1 collection thực tế có tab SEO mới.
- Đề xuất (chọn 1, user/primary quyết): (a) ghi vào spec F11 + residual "Danh mục cũng có khối SEO B; xem trước chưa mô phỏng URL/tiêu đề danh mục — follow-up"; hoặc (b) task nhỏ: `SeoPreview` đọc `useAsTitle` thay vì cứng `title`, thêm route danh mục theo `scope`, hoặc ẩn khung xem trước với `categories`. Không tự sửa.

### ⚠️-2 [PARTIAL] Câu spec "lỗi không gắn ô … vẫn hiện toast **như cũ**" bỏ sót hành vi thật (trễ ~0,7s, phụ thuộc marker)
- Requirement: FR-ADM-19 (2) dòng 176; spec update d.20.
- Thực tế: `_field-errors.scss:59-61` ẩn mọi toast có `data-testid="field-errors|field-error"`; `FormErrorFocus` chỉ gắn `data-field-errors-unmatched` sau ~5 lần chờ (~0,7s) khi không thấy ô lỗi (T02 d.97). Toast không marker (mạng/500/quyền) hiện ngay như cũ; toast **có marker nhưng không ô** (hook không `path`, EditMany `last-admin-guard`) hiện **chậm ~0,7s**, và T02 MINOR B: lưu liên tiếp < 0,6s có thể bị ẩn. test-scope d.92 đã ghi "(có thể chậm ~0,7s)" nhưng `SPECIFICATIONS.md` ghi "như cũ" — lệch chữ nhỏ giữa 2 artefact.
- Liên quan: T02. Đề xuất: close-out sửa 1 cụm trong FR-ADM-19 (2) thành "vẫn hiện toast (lỗi có cấu trúc danh sách nhưng không gắn ô nào hiển thị: hiện sau ~0,7s)" hoặc ghi vào residual. Không chặn.

### Không phải gap (đã kiểm, khớp)
- Trang pháp lý (`pages`): public `buildLegalMetadata` (`LegalPage.tsx:24-31`) không truyền `description` → preview không fallback mô tả là đúng parity; `seoPagePathKey` theo `kind` (`seo.ts:98-101`, test `seo.test.ts:164`).
- `admin-labels.test.ts` nới cho group `label:false` dưới **tab có nhãn** (`:51-61`) — nhất quán với tiền lệ BL-051 A14 (collapsible), không phá câu spec "mọi field hiển thị có `label`" vì tiêu đề do tab đảm nhận; tab không nhãn vẫn bị báo.
- Developers `omit` có `seo` (`Developers.ts:55`) → không bị ảnh hưởng.
- `VERSION_HIDDEN_FIELDS` (`version-history.ts:10`) ⊇ 5 trường CSS ẩn (`_version-history.scss:103-107`) + `id`, `_status` — hợp lý, spec chỉ liệt kê 5 trường ẩn ở màn so sánh.

## Residual đã biết (không tính FAIL, giữ nguyên trong close-out)
- T05: integration + ảnh 1440/390 BLOCKED (Postgres 5433 worktree down); placeholder SEO tĩnh (Payload không nhận placeholder động) — spec F11 đã ghi.
- T02/T04: phụ thuộc marker `data-testid` toast, class tab/collapsible, `data-field-path` của Payload 3.91 (nâng cấp phải kiểm lại) — spec update d.30 đã ghi.
- T03: chưa kiểm mắt nhánh popup nhiều collection / ô hasMany có nút / tooltip hover.
- T04: `readVersions` mặc định Payload (sale đọc phiên bản bài đã xuất bản) — ngoài phạm vi, đề xuất task riêng (đã ghi test-scope d.105).
- T01: ảnh "trước" N/A (hộp thoại native không chụp được).

## Kết luận cho primary
- **PASS** — spec 1.48.0 / spec update / test-scope v62 phản ánh đúng code 5 commit và đúng 3 quyết định user. Hai ⚠️ trên là lệch chữ/scope nhỏ, đề nghị xử lý ở close-out: (1) bổ sung Danh mục vào F11 + residual (hoặc mở follow-up nhỏ cho `SeoPreview` trên `categories`), (2) chỉnh cụm "như cũ" ở FR-ADM-19 (2). Không cần quay lại builder cho phase này.
