# bug-isfilled-empty-richtext · phase-1-task-01 — `isFilled` coi richText rỗng là đã điền

- Change doc: `spec/changes/archive/2026-10-19-isfilled-empty-richtext.md` (BACKLOG BL-012)
- Nguồn: review L10-T02 round 4

## Classification / Risk
- Type: **BUG** (hành vi sai so với BR-07/BR-08: bản EN thiếu trường bắt buộc không được bật `hasEnglish` / duyệt)
- Risk: **MEDIUM** — hàm dùng chung (shared helper) cho mọi collection có trường R theo locale, hook `hasEnglish`, endpoint duyệt EN pháp lý, job dịch, nhận diện sửa tay EN. Không đổi schema/API shape, không migration.

## Repro
- Bản EN của trang pháp lý: trường `content` (Lexical) = `{ root: { children: [ { type: "paragraph", children: [] } ] } }` (admin xoá hết chữ, Lexical vẫn giữ 1 paragraph rỗng).
- `POST /api/admin/translations/pages/:id/approve` → expected 422 (thiếu `content`); actual 200 + `hasEnglish = true`.
- Tương tự: lưu bản `en` với `hasEnglish = true` qua code hệ thống → hook `requireEnglishFields` không chặn.

## Root cause (đã chứng minh bằng đọc code)
`src/hooks/require-english-fields.ts:6-14` — nhánh object của `isFilled` trả `children.length > 0` cho `root.children` của Lexical. Editor Lexical luôn để lại ít nhất 1 node `paragraph` (không con, hoặc chỉ `linebreak`/text khoảng trắng) khi xoá hết chữ → `children.length === 1` → coi là đã điền. Mọi caller (`missingEnglishFields` → hook `requireEnglishFields`, `handleApproveEnglish` 422, `translate-content-save` bật `hasEnglish`; `requiredByLocale`; `Homepage` CTA; `translate-content` `englishMissing`; `detect-manual-en`) thừa hưởng lỗi.

## Fix (phạm vi)
- `isFilled` với richText Lexical: duyệt đệ quy cây node. Có nội dung khi gặp:
  - node `text` có `text.trim() !== ""`;
  - node "nội dung" không phải container chữ và không phải node trống thuần (vd `upload`, `block`, `relationship`, `horizontalrule`, `link` có text sẽ đi theo con…).
  - Container chữ (`paragraph`, `heading`, `quote`, `list`, `listitem`, `link`/`autolink`) → xét con; `linebreak`, `tab` → không tính.
- Giữ nguyên hành vi string / array / object không phải Lexical.
- Không đổi caller.

## Acceptance
- [ ] richText rỗng (không con, hoặc chỉ paragraph/heading không có text khác khoảng trắng/linebreak) → `isFilled` = false
- [ ] richText có text thật, hoặc node nội dung không phải text (upload, block…) → true
- [ ] Test hồi quy các ca trên + duyệt pháp lý 422 + không bật `hasEnglish`
- [ ] `pnpm test` / `pnpm lint` / `pnpm typecheck` / `pnpm build` PASS

## Retry / Escalation
- Attempt tối đa 3; review tối đa 2 vòng → escalate `architecture_review_needed`.

## Verification summary
- Files: `src/hooks/require-english-fields.ts` (sửa `isFilled` + thêm `lexicalHasContent`), `src/hooks/require-english-fields.test.ts` (mới, 25 test).
- Repro Verification (test deterministic): trước fix **10 fail / 15 pass** (8 ca richText rỗng + `handleApproveEnglish` trả 200 thay vì 422 + hook `requireEnglishFields` không ném) → sau fix **25/25 pass**. Status: **PASS**.
- `pnpm test`: unit + ui **1730/1731 pass**; 1 fail pre-existing không liên quan (`src/endpoints/public/job-applications.test.ts` "vị trí hết hạn → 400", handler không dùng `isFilled`, test dùng mốc thời gian cố định `NOW = 2026-10-17`). Integration (49 file) **không chạy được**: Postgres `127.0.0.1:5433` / Redis không sẵn sàng (ECONNREFUSED) — môi trường, không phải regression.
- `pnpm lint` PASS · `pnpm typecheck` PASS · `pnpm build` PASS.
- Caller rà soát: `required-by-locale`, `Homepage` CTA, `translate-content`, `detect-manual-en` (test 6/6 pass), `translate-content-save`, `approve-english` — không đổi caller; fixture integration đều dùng text thật nên kỳ vọng không đổi.

## Doc impact / Reconcile
- no doc impact: không đổi API contract (422 + danh sách trường thiếu giữ nguyên, API_SPEC §5.2), không đổi schema/ERD, không có doc nào mô tả ngữ nghĩa "đã nhập" ở mức node Lexical. Không có gap register cần đổi.
- Spec: không bump (1.2.2), sinh `spec/test-scope/current.json` scopeVersion 1 (trigger bug-fix).

## Review
- STRICT PASS round 1 — `.context/review-reports/bug-isfilled-empty-richtext-phase-1-task-01-round-1-review.md`
- Integration (DB dev bật lại sau builder): `pnpm vitest run --project integration` 51 file / 694 test PASS.

## Residual risk
- Bản ghi cũ có trường richText R chỉ chứa paragraph rỗng sẽ bị `requiredByLocale` chặn ở lần lưu kế tiếp (đúng nghiệp vụ, admin phải nhập nội dung).
- MINOR review không sửa: đệ quy không giới hạn độ sâu và child `null` ném TypeError (input JSON dị dạng sâu → 500 thay vì 400, rủi ro thấp); `LexicalNode` khai lại thay vì import `src/lib/translation/lexical.ts`; thiếu test link/autolink chỉ khoảng trắng, node không có `type`.
- Node type Lexical lạ coi là có nội dung (hướng an toàn với editor mặc định hiện tại).
- 1 test unit fail pre-existing ngoài scope: `src/endpoints/public/job-applications.test.ts` "vị trí hết hạn → 400" (mốc thời gian cố định 2026-10-17).
