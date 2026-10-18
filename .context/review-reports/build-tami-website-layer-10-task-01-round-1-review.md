Agent: reviewer

# Review — build tami-website layer-10-task-01 (LeadForm + follow-up L9-T02), round 1

- Worktree: `D:/prj/bds-wt10-t01` (branch `wt/l10-t01`, base `ef39df4`, chưa commit). Bỏ qua `src/payload-types.ts` (chỉ EOL).
- **Review level:** STRICT
- **Reason:** luồng thu lead chính (PII, consent BR-30) trên 4 bề mặt công khai; sửa endpoint công khai `POST /api/public/leads` (đọc body); sửa hook phân quyền `lead-activities`; đụng shared component (`LeadFormSlot` caller, `tests/setup-dom.ts` dùng cho mọi test UI).
- **Blast radius:**
  - Mới: `src/components/leads/LeadForm.tsx` (+test), `src/lib/leads/utm.ts` (+test), `src/lib/leads/turnstile-site-key.ts`.
  - Trang: `/[locale]/lien-he`, `/[locale]/cho-thue/[slug]` (`RentalDetail` → `SaleContactBox`), `/[locale]/du-an/[slug]` (`ProjectDetail`), `/[locale]/tin-bds/[slug]` (`PostDetail`, đổi Pick thêm `id`).
  - API: `src/endpoints/public/leads.ts` (đọc stream có giới hạn) — mọi client gửi lead.
  - Hook: `src/hooks/leads/lead-activity-hooks.ts` (admin tạo activity với `lead` sai dạng → 400).
  - `src/lib/leads/create-or-merge.ts`: chỉ thêm comment.
  - i18n `vi.json`/`en.json`: chỉ thêm khoá (+12/-0 mỗi file).
  - `tests/setup-dom.ts`: stub `ResizeObserver` toàn cục khi thiếu (mọi test UI).

## Verify commands + result (chạy trong worktree)

| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` (toàn bộ) | exit 1: 4 test fail / 1671 pass / 597 skip. Lỗi: (a) integration — `cannot connect to Postgres: the database system is in recovery mode` (Postgres dùng chung với worktree khác đang khởi động lại, không do diff); (b) `src/lib/contrast.test.ts` — lỗi CRLF đã biết; (c) `src/components/layout/Header.test.tsx` (bẫy focus MobileMenu) — fail khi chạy cả bộ lúc máy tải nặng |
| `pnpm test src/components/layout/Header.test.tsx src/components/leads src/lib/leads src/endpoints/public/leads.test.ts` | PASS 8 file / 93 test (Header pass khi chạy riêng → flaky do tải, không liên quan diff) |
| `pnpm test tests/integration/leads-public.test.ts tests/integration/leads.test.ts` | PASS 2 file / 47 test (chạy riêng sau khi Postgres hồi phục) |
| `pnpm build` | PASS (exit 0). Bảng route: `/[locale]/lien-he`, `/cho-thue/[slug]`, `/du-an/[slug]`, `/tin-bds/[slug]` vẫn `●` (SSG/ISR, `generateStaticParams` → `[]`), không bị đẩy sang `ƒ` Dynamic |

## Kiểm theo checklist STRICT

1. **Payload đúng theo source** — `LeadForm.tsx:29-38` `buildLeadExtra`: `source`, `sourceId` (bỏ khi `contact`), `utm`, `pageUrl` (origin+path+search, bỏ `#hash`), `referrer`; `use-public-form.ts:133` + `submit-helpers.ts:27-30` thêm `consent: true`, `turnstileToken`, `locale` (theo `useLocale()`). Khớp `leadInputSchema` (`src/shared/types/api.ts:77-100`; `referrer`/`pageUrl`/`utm` có cắt độ dài phía server). Thứ tự spread `{...extra, ...textFields, consent, turnstileToken, locale}`: ô form không có `name` trùng `source`/`sourceId` (Radix Checkbox không `name`) → không bị ghi đè. RTL test cho đủ 4 source + contact bỏ sourceId truyền nhầm. OK.
2. **Tin rented** — `SaleContactBox.tsx:69-74`: tiêu đề `titleRented` khi `view.rented`, form vẫn `source="rental" sourceId={rentalId}` (`RentalDetail.tsx:149` truyền `doc.id`); server nhận tin rented (`leads.ts` comment SOURCE_COLLECTION, FR-PUB-13). OK.
3. **PII/consent** — consent bắt buộc phía client (`use-public-form.ts:153`) và server (`z.literal(true)`); link chính sách theo ngôn ngữ qua `Link` next-intl (`ConsentCheckbox.tsx:45-46`). Sau thành công xoá `lastSubmit` (không giữ họ tên/SĐT trong state). Không log PII phía client. `referrer` đầy đủ gửi lên — đã có retention rút về origin (`anonymize-leads.ts:21`). OK.
4. **Lỗi field mapping** — `FIELD_NAMES` = `fullName/phone/email/message` + `consent` → `details` của server gắn đúng ô; field khác (vd `sourceId`) vào tóm tắt. Test 400 `phone` → `aria-invalid` + thông báo. OK.
5. **role=status** — thành công render `<FormStatus />` thay form; test `findByRole("status")` "Cảm ơn anh/chị!". OK.
6. **Turnstile lười + HTML trang không đổi** — `LeadForm` là `"use client"` island, trang vẫn Server Component; `TurnstileWidget` dùng lại từ L2-T09. Build cho thấy các route vẫn SSG/ISR. OK.
7. **Site key đọc `process.env` trong Server Component** — `turnstile-site-key.ts:3`. Vì `[locale]/layout.tsx` + các trang chi tiết có `generateStaticParams` → `[]`, không prerender lúc `next build` → giá trị placeholder `TURNSTILE_SITE_KEY=build` (`docker/Dockerfile:31`) **không** bị nhúng vào HTML; giá trị thật đọc lúc render ISR runtime (compose cấp, `:?` bắt buộc). Cùng cách đã được chấp nhận ở L7-T04. Site key là giá trị công khai. Rủi ro thấp (xem MINOR-3).
8. **Đọc body stream có giới hạn** — `leads.ts:43-59` `readBoundedText`: cộng byte từng chunk, vượt `MAX_BODY_BYTES` (16 000×4) → `reader.cancel()` + ném lỗi (pipeline → 400); sau giải mã vẫn so theo ký tự (`leads.ts:69`); Content-Length khai báo lớn vẫn chặn sớm. Endpoint truyền `req.body` (`leads.ts:194`). Đã kiểm Payload 3.91: `createPayloadRequest` chỉ `Object.assign(request, …)`, `handleEndpoints` chỉ đọc body ở nhánh method-override GET → stream chưa bị tiêu thụ khi tới handler. Unit test chunked quá lớn (huỷ stream, `pulled < 10`, không gọi `text`) + chunked nhỏ hợp lệ. OK.
9. **Validate UUID lead-activity** — `lead-activity-hooks.ts:43-46`: admin + `lead` khác `undefined/null` mà không phải UUID (chuỗi, số, object) → `ValidationError` 400; thiếu hẳn để Payload báo "bắt buộc". Integration test admin `["khong-phai-uuid", 123, {id}]` → 400, sale → 403. PASS khi chạy riêng. OK.
10. **Follow-up L9-T02** — (a) đệm thời gian: ghi residual chấp nhận bằng comment `create-or-merge.ts:147-148` (hợp lệ theo lựa chọn "hoặc ghi residual"); (b) rollback `source: "project"` để lỗi rơi đúng `queueNewLeadEmail` — `leads-public.test.ts:318-335` `it.each`; (c) UUID — mục 9; (d) stream — mục 8. Đủ 4/4.
11. **i18n chỉ thêm khoá** — `git diff --stat`: `en.json` +12, `vi.json` +12, không xoá. OK (khoá fallback cũ nay không dùng → MINOR-4).

## Responsive Checklist Gate (diff đụng UI — chỉ đánh giá phần thay đổi)

Không có môi trường browser; xác minh bằng đọc class/CSS.

| Mục | Kết quả | Bằng chứng |
|---|---|---|
| Không horizontal scroll | OK | Form `flex flex-col gap-5`, không width cố định px; nút `w-full sm:w-fit`; nằm trong slot/container sẵn có (`max-w-text`, `max-w-container`, cột grid `lg:` đã có) |
| Mobile-first media query | OK | Chỉ dùng prefix `sm:`/`lg:` (min-width) |
| Grid auto-fit/minmax | N/A | Diff không thêm grid |
| Container không fixed px | OK | Không thêm width px |
| Font rem / heading fluid | OK | Dùng token `text-body`, `text-small`, `text-h2/h3` sẵn có |
| Spacing theo scale | OK | `gap-4/5`, token sẵn có |
| Media (ảnh/video) | N/A | Không thêm media |
| Touch target ≥44px | OK | `Button size="lg"`; link hotline `min-h-11`; Checkbox vùng chạm `after:-inset-3` (component sẵn có) |
| Nav hamburger / table wrapper | N/A | Không đụng |
| 100vh / reduced-motion / overflow:hidden | OK / N/A | Không dùng `100vh`, không thêm animation, không `overflow:hidden` |

Residual: chưa đo thực tế 375/768/1280 trong browser.

## Skill gates

- **aislop:** skip — không có trong verify commands của `.context/project-config.md` (Reviewer chỉ chạy lệnh được allow).
- **oxlint (anti-slop):** skip, oxlint not configured — repo dùng ESLint, `pnpm lint` PASS.
- **ocr (open-code-review):** skip, ocr not installed / không trong lệnh được allow.
- **AI-readable:** OK — `LeadForm.tsx` 97 dòng, hàm < 50 dòng; tên rõ (`buildLeadExtra`, `readBoundedText`, `captureUtm/readUtm`); hằng có tên (`MAX_BODY_BYTES`, `MAX_VALUE_CHARS`); comment nêu WHY. 0 indicator.
- **ai-friendly-web:** N/A — không đổi robots/sitemap/llms; chỉ thêm form trong trang sẵn có.
- **blitzstrike:** skip — không cài/không có môi trường được phép.

## Findings

### [CRITICAL]
Không có.

### [MAJOR]
Không có.

### [MINOR]

- **MINOR-1 — Integration không đúng mô tả task ("route + endpoint thật với Turnstile test key").**
  `tests/integration/leads-public.test.ts:84-87, 30` gọi thẳng `handleLead` với `text` (không truyền `body`) và `verifyTurnstile` giả. Do đó nhánh mới `req.body` → `readBoundedText` qua Payload thật chưa được chạy end-to-end (chỉ có unit test). Đã đối chiếu mã Payload 3.91 để chắc stream chưa bị tiêu thụ → rủi ro thấp.
  Cách sửa: thêm 1 case integration truyền `body: new Request(url, {method:"POST", body}).body` (hoặc gọi `leadsEndpoint.handler` với Request thật); dùng Turnstile test key `1x0000000000000000000000000000000AA` / secret `1x0000000000000000000000000000000AA` nếu CI được ra mạng, còn không thì ghi rõ trong task là đã thay test key bằng deps giả và vì sao.

- **MINOR-2 — UTM chỉ được bắt ở trang có form.**
  `LeadForm.tsx:49` gọi `captureUtm()` trong effect của form; khách vào từ quảng cáo ở trang không có form (trang chủ, danh sách) rồi đi tiếp sang trang chi tiết → URL không còn `utm_*`, sessionStorage chưa ghi → mất UTM. BR-10 chỉ nói về nguồn form nên không chặn task, nhưng thống kê quảng cáo sẽ thiếu.
  Cách sửa (task riêng): đưa `captureUtm()` lên một client island nhỏ ở `[locale]/layout.tsx` (vd cạnh `ClickRefMarker`) để bắt ở mọi trang đích.

- **MINOR-3 — Site key đọc `process.env` lúc render.**
  `src/lib/leads/turnstile-site-key.ts:3`. Hiện an toàn vì không route nào prerender lúc build. Nếu sau này có trang dùng `LeadForm` mà `generateStaticParams` trả tham số thật, HTML build sẽ mang `TURNSTILE_SITE_KEY=build` (`docker/Dockerfile:31`) tới lần revalidate đầu. Cách sửa: thêm 1 dòng comment cảnh báo ở `readTurnstileSiteKey` (không prerender lúc build), hoặc dùng chung với `tuyen-dung/[slug]/page.tsx:116` để tránh lặp logic.

- **MINOR-4 — Khoá i18n fallback không còn dùng.**
  `page.contact.formFallback`, `page.posts.leadForm.fallback`, `page.projectDetail.leadForm.fallback`, `page.rentalDetail.leadForm.fallback/fallbackRented` không còn được tham chiếu sau khi bỏ prop `fallback` (`lien-he/page.tsx:83`, `PostDetail.tsx:80`, `ProjectDetail.tsx:94`, `SaleContactBox.tsx:69`). Task giới hạn i18n chỉ thêm nên để nguyên. Cách sửa: dọn ở task dọn i18n sau.

- **MINOR-5 — Header test flaky khi chạy cả bộ.**
  `src/components/layout/Header.test.tsx` (bẫy focus) fail khi chạy toàn bộ lúc máy tải nặng nhưng pass khi chạy riêng; `tests/setup-dom.ts:9-15` chỉ stub `ResizeObserver` khi thiếu nên không làm đổi hành vi test cũ. Không do diff. Ghi lại để theo dõi; nếu lặp lại thì tăng timeout cho test đó.

## Residual risk

- Responsive chưa đo bằng browser thật (chỉ đọc CSS/class).
- Nhánh stream `req.body` chỉ được kiểm bằng unit test cùng việc đọc mã Payload, chưa có integration qua route thật (MINOR-1).
- `pnpm test` toàn bộ không xanh vì Postgres dùng chung đang recovery cùng lỗi CRLF đã biết; các file liên quan diff đã chạy lại riêng và PASS.
- Độ trễ khác nhau giữa nhánh tạo và nhánh gộp (dò SĐT) được chấp nhận theo residual L9-T02; đã có rate limit 5/10 phút/IP.

## Verdict

**PASS** — không có CRITICAL/MAJOR. Đủ 4 acceptance criteria và 4 follow-up L9-T02; lint, typecheck, build PASS; test liên quan PASS. 5 MINOR nêu trên không chặn task; đề xuất ghi MINOR-1 vào Feature Verification của task, MINOR-2 vào backlog.
