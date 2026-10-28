Agent: spec-validator

# Spec validation — BL-091 `feature-news-scheduled-publish` (ADDITIVE, FR-ADM-16 thu hẹp cho Tin tức) — pre-plan, round 1

- Mode: **Spec validation** (trước khi chia task)
- Nguồn: `spec/changes/2026-10-27-news-scheduled-publish.md` (acceptance + quyết định user 2026-10-27), `git diff SPECIFICATIONS.md` (dòng 92, 127, 196, 311), `docs/BRD.md:176`, `docs/ERD.md:29,371`, `docs/PERMISSION.md:37-48`, `docs/API_SPEC.md:253`, `docs/diagrams/layer-plan.md:51,580,585`, `tasks/tami-website/layer-16-task-01.md`, `spec/test-scope/current.json`, code: `src/fields/published-at.ts`, `src/access/publishedOnly.ts`, `src/lib/content/public-queries.ts`, `src/lib/news/news-search.ts`, `src/lib/news/most-read.ts`, `src/lib/seo/sitemap-data.ts`, `src/lib/seo/llms-route.ts`, `src/lib/i18n/resolve-counterpart.ts`, `src/lib/content/resolve-missing-page.ts`, `src/lib/home/home-queries.ts`, `src/lib/content/get-globals.ts`, `src/endpoints/public/news-views.ts`, `src/app/(frontend)/[locale]/layout.tsx:20`, `src/app/(frontend)/[locale]/tin-tuc/[slug]/page.tsx:41-94`, `package.json` (payload 3.91.0, next 16.4.2).

## Verdict: FAIL (0 lỗi chặn, không có conflict mức HIGH, 3 cảnh báo, chạm ngưỡng ≥ 3 cảnh báo)

Delta phủ đủ 6 acceptance và đúng quyết định user (chỉ Tin tức, không cron, không email). Lý do FAIL: còn 3 điểm cần chốt hoặc sửa trước khi chia task: (W1) khối "Đọc nhiều" trễ ≤ 10 phút, nới so với acceptance "~60s" mà user chưa duyệt; (W2) "giờ VN" va với "không migration"; (W3) task initial-build `layer-16-task-01` đang chờ làm với thiết kế ngược quyết định user. Ngoài ra có danh sách doc as-built phải reconcile lúc close-out (mục C).

## Ma trận coverage — acceptance ↔ spec delta

| # | Acceptance (change doc) | Spec delta (SPECIFICATIONS.md) | Status | Note |
|---|---|---|---|---|
| A1 | Chỉ Tin tức: ô "Ngày xuất bản" sửa được, ngày + giờ (giờ VN), lưu đúng; để trống → tự điền như cũ | :311 "Admin Tin tức… sửa được… chọn ngày + giờ… giờ Việt Nam (Asia/Ho_Chi_Minh); để trống → như cũ…; xoá trống ở bài đang published → điền lại; ngày quá khứ được phép" | ✅ (kèm W2) | Code hiện tại: `published-at.ts:23` `access.create/update: denyAll`, `:25` `readOnly`, `:10-11` hook giữ `previousValue` (xoá trống sẽ KHÔNG điền lại nếu không sửa hook). Field dùng chung 4 collection → cần bản riêng cho news. Cách hiện giờ VN chưa rõ, xem W2 |
| A2 | Tin `published` + `publishedAt > now` ẩn với khách: danh sách + danh mục, chi tiết 404, `q`, tag, "Được quan tâm nhiều", tin liên quan, trang chủ, sitemap, JSON-LD | :311 liệt kê đủ + thêm `llms.txt`, chuyển ngôn ngữ, đếm lượt xem, API đọc không đăng nhập; vị trí: `buildPublicWhere` (chỉ news) + SQL riêng (q/tag, Chủ đề, Đọc nhiều) | ✅ | Đã kiểm mọi đường đọc tin công khai: `findPublicList/BySlug/One` (`public-queries.ts:22-27`), sitemap `overrideAccess:false` (`sitemap-data.ts:143-150`), llms (`llms-route.ts:26`), chuyển ngôn ngữ (`resolve-counterpart.ts:35,42`), resolve-missing-page (`:109-110`), news-views (`news-views.ts:110`), trang chủ (`home-queries.ts:116,120`) đều đi qua `publicWhere`/access của khách. Đường SQL thô cần sửa tay: `news-search.ts:20-24` (`publicNewsSql`, dùng cho `findFilteredNewsIds` + `listTopNewsTags`) và `most-read.ts:38-48` (`rankNewsByViews`). `findLocalizedSlugs` (`news-queries.ts:98`, `overrideAccess:true`) chỉ chạy trên doc đã công khai, không lộ |
| A3 | Tới giờ tự hiện, không thao tác; trễ ≤ ~60s ở trang có cache | :311 "trang ISR (`revalidate = 60`) trễ ≤ ~60s; khối Đọc nhiều cache riêng ≤ 10 phút… chấp nhận" | ⚠️ W1 | `layout.tsx:20` revalidate 60; `/tin-tuc` + danh mục `force-dynamic`; globals cache 60s chỉ giữ id (`get-globals.ts:13`), `findSelected` lọc lại → trang chủ ~60s. Nhưng `most-read.ts:18` cache 600s → nới acceptance |
| A4 | Staff đăng nhập vẫn xem tin hẹn giờ; danh sách admin có nhãn "Đã hẹn giờ · <ngày giờ>" | :311 "Staff đăng nhập (tài khoản hoạt động) vẫn xem / sửa trong admin; nhãn 'Đã hẹn giờ · dd/MM/yyyy HH:mm' (giờ VN) cho tin published + publishedAt > now" | ✅ | `publishedOnly.ts:23` staff active → `true` (không lọc). Spec hiểu "xem" là xem trong admin (trang công khai luôn truy vấn như khách — `public-queries.ts:29-39`); không có preview trên site, khớp hiện trạng |
| A5 | Đổi ngày tin đang hiện sang tương lai → cảnh báo | :311 "đã lưu published + publishedAt ≤ now → tương lai → cảnh báo ngay dưới ô, không chặn lưu" | ✅ | Điều kiện rõ, testable |
| A6 | Dự án / Cho thuê / Tin BĐS không đổi (test khoá) | :311 "Dự án / Cho thuê / Tin BĐS không đổi: chỉ đọc, tự điền; điều kiện công khai không thêm publishedAt"; :127 + :196 | ✅ | `buildPublicWhere(statuses)` (`publishedOnly.ts:13`) và `publishedOnly` (`:27`) dùng chung cho projects / property-posts / news / job-postings → builder phải tách access + `publicWhere` theo collection. Acceptance có "test khoá"; spec không nhắc test (bình thường, để task ghi) |
| — | Không cron / không email | :311 "không job/cron, không gửi email bản tin"; :92 backlog "đồng bộ điều kiện SQL" gạch bỏ | ✅ | Không có hook gửi bản tin / IndexNow khi xuất bản (grep `src` rỗng) |
| — | Schema | :311 "Không đổi schema (cột `published_at` + index có sẵn) → không migration" | ⚠️ W2 | Index `news_list_idx (status, has_english, category_id, published_at DESC)` có sẵn (`ERD.md:661`) |

## Edge case / gap kỹ thuật đã kiểm

| Chủ đề | Spec | Status | Ghi chú |
|---|---|---|---|
| Bài `published` có `publishedAt` null (dữ liệu cũ / import) | "trống hoặc ≤ thời điểm truy vấn" | ✅ | Điều kiện Payload: `or: [{publishedAt: {exists:false}}, {publishedAt: {less_than_equal: now}}]`; SQL: `(n.published_at IS NULL OR n.published_at <= now())`. `now` phải tính mỗi request (hàm access gọi theo request, đúng) |
| Múi giờ | Asia/Ho_Chi_Minh khi nhập/hiện; DB lưu timestamptz | ⚠️ W2 | Xem W2 |
| Cache "Đọc nhiều" 10 phút | Ghi là chấp nhận trễ, không lộ sớm | ⚠️ W1 | Không lộ sớm: kết quả tính tại T loại bài > T; hook `revalidate-most-read` làm mới tag khi lưu (`API_SPEC.md:253`). Chỉ là hiện trễ |
| SQL sơ bộ + trần `NEWS_FILTER_MAX_IDS` | Đồng bộ ở q/tag, Chủ đề, Đọc nhiều | ✅ | Đúng là phải sửa: bài tương lai xếp đầu theo `published_at DESC` (`news-search.ts:53`) sẽ chiếm suất trần 1000, và `listTopNewsTags` (`:66-77`) **lộ thẻ** của bài chỉ có ở tin hẹn giờ (không có lớp `findPublicList` phía sau) |
| API khách `/api/news`, GraphQL, `/api/news/:id` | "API đọc không đăng nhập" qua access của khách | ✅ | Versions: `readVersions` không khai → mặc định Payload cần đăng nhập |
| Chi tiết 404 khi ISR | 404 tới giờ | ✅ / residual | `tin-tuc/[slug]/page.tsx:43` `generateStaticParams` `[]` + `notFound()` → 404 theo ISR 60s. Residual: xác nhận Next 16 không giữ 404 lâu hơn `revalidate` (kiểm ở build/E2E) |
| Sitemap / llms.txt | áp | ✅ | Cả hai `force-dynamic` + truy vấn như khách → đúng tới giờ |
| JSON-LD | áp | ✅ | Chỉ render trên trang chi tiết đã qua lọc |
| Đếm lượt xem | áp | ✅ | `news-views.ts:110` `findPublicList` → tự áp; `204` không lộ lý do |
| Sale tự đặt ngày quá khứ (backdate) | "ngày quá khứ được phép", "ai sửa được bài thì sửa được ô" | Info | Sale sửa bài của mình (`PERMISSION.md:42`) → đổi được thứ tự "mới nhất". Đúng chữ spec, không thêm requirement; nêu để user biết |
| Draft có `publishedAt` tương lai | Nhãn chỉ cho `published` | ✅ | Xuất bản sau giờ hẹn → hiện ngay với ngày đã đặt; rõ |
| Code comment hiện tại | — | Info | `publishedOnly.ts:10-11` và `public-queries.ts:20` ghi "hẹn giờ thêm ở ĐÂY, tự áp cho mọi collection" → builder phải sửa comment cho đúng phạm vi chỉ Tin tức |

## Cảnh báo (W) — cần chốt / sửa trước khi chia task

- **W1 [PARTIAL] — A3 bị nới mà user chưa duyệt.** Quyết định user: "cache trễ tối đa ~60s". Spec :311 thêm ngoại lệ "khối Đọc nhiều ≤ 10 phút… chấp nhận"; câu này do agent viết, không có trong quyết định 2026-10-27. Chọn một:
  (a) hỏi user duyệt ngoại lệ rồi ghi rõ "user chốt" vào change doc; hoặc
  (b) giữ ~60s: đặt TTL cache "Đọc nhiều" = min(600s, thời gian tới `publishedAt` tương lai gần nhất), hoặc hạ TTL xuống 60s.
  Liên quan: `src/lib/news/most-read.ts:18,106-114`, `docs/API_SPEC.md:253`.
- **W2 [PARTIAL] — "giờ Việt Nam" va với "không migration".** Payload 3.91 có tuỳ chọn `timezone` cho field date; bật lên thì Payload thêm cột `published_at_tz`, tức là đổi schema và cần migration, trái câu "Không đổi schema → không migration" (:311). Nếu không bật, DatePicker của Payload nhập/hiện theo **múi giờ trình duyệt**. Spec cần nêu rõ một cách:
  (a) không thêm cột: ép hiện/nhập theo Asia/Ho_Chi_Minh bằng component/format riêng (hoặc ghi rõ giả định staff dùng máy giờ VN, kèm chữ "(giờ VN)" cạnh ô); hoặc
  (b) dùng `timezone` của Payload + migration additive (bỏ câu "không migration", cập nhật ERD §4.8).
  Nhãn admin "dd/MM/yyyy HH:mm (giờ VN)" và cảnh báo A5 cũng phải dùng cùng một mốc giờ. Test: chọn 08:00 ngày X giờ VN → DB lưu `X 01:00Z`.
- **W3 [MISSING reconcile] — task initial-build mâu thuẫn còn đang chờ làm.** `tasks/tami-website/layer-16-task-01.md` (dòng 1, 16, 26, 40, 91) và `docs/diagrams/layer-plan.md:51,580,585` vẫn ghi "`publishedAt ≤ now` ở `publicWhere` cho mọi loại + job revalidate mỗi phút (`src/jobs/publish-scheduled.ts`)". `progress.json` có `currentLayer: 10 / totalLayers: 17`, nên tới layer 16 loop sẽ build cron và lọc cho mọi loại, ngược quyết định user. Cần đánh dấu task này superseded / thu hẹp (Tin tức đã làm ở BL-091; Dự án / Cho thuê / Tin BĐS còn mở, không cron) trước khi build. Không tự sửa ở đây.

## C. Doc phải reconcile lúc close-out (as-built — không chặn spec, chỉ cần có trong task Doc Impact)

| Doc | Vị trí | Mâu thuẫn hiện tại | Sửa thế nào |
|---|---|---|---|
| `docs/ERD.md` §1 | :29 | "với bài có `publishedAt` thì còn phải ≤ now" áp cho **mọi loại**; thực tế chưa áp cho loại nào | Chỉ `news`: `publishedAt` trống hoặc ≤ now; các loại khác chỉ theo status + xoá mềm (BL-091). Mức MEDIUM |
| `docs/ERD.md` §4.8 | :371 | "Cho phép hẹn giờ (FR-ADM-16)" | Ghi as-built: sửa được, giờ VN, trống → tự điền, xoá trống ở bài published → điền lại (+ cột `_tz` nếu chọn W2-b) |
| `docs/PERMISSION.md` §3.1 | :42 | `news` — Khách đọc "Đã xuất bản" | "Đã xuất bản + `publishedAt` trống/≤ now"; ghi ai sửa được bài thì sửa được ô ngày (sale: bài của mình) |
| `docs/API_SPEC.md` | :253 (+ §3.15 `/tin-tuc`, §3.12 news-views) | Loader "Đọc nhiều" / SQL sơ bộ chưa có điều kiện giờ | Thêm điều kiện `published_at` + ghi độ trễ theo W1 |
| `docs/BRD.md` | :176 FR-ADM-16 (intent) | Không ghi phạm vi | Không bắt buộc sửa (BRD không giới hạn loại). Nếu ghi chú "BL-091: chỉ Tin tức" thì đi qua CR + user duyệt (intent doc) |
| `docs/diagrams/layer-plan.md` + `tasks/tami-website/layer-16-task-01.md` | xem W3 | cron + mọi loại | Theo W3 |
| `src/access/publishedOnly.ts:10-11`, `src/lib/content/public-queries.ts:20` (comment) | — | "áp ở đây cho mọi collection" | Builder sửa comment theo phạm vi mới |

`spec/test-scope/current.json` đã có `triggerNote` BL-091 và các mục admin / ngôn ngữ / access staff, khớp delta.

## Gap list cho builder / loop

1. [PARTIAL] W1: A3 trễ ≤ ~60s so với khối "Đọc nhiều" 10 phút. Cần user duyệt hoặc rút TTL. Task: (chưa có) BL-091 phase-1.
2. [PARTIAL] W2: giờ VN với không migration. Chốt (a) hoặc (b) và sửa câu :311 tương ứng.
3. [MISSING] W3: đánh dấu superseded / thu hẹp `tasks/tami-website/layer-16-task-01.md` + `docs/diagrams/layer-plan.md:51,580,585`.
4. Close-out Doc Impact bắt buộc: ERD:29, ERD:371, PERMISSION:42, API_SPEC:253 (mục C).

Xử lý xong W1–W3 (sửa spec delta / change doc, user chốt W1 và W2) thì chạy lại validate round 2; khả năng cao sẽ PASS.

## Residual risk
- 404 của trang chi tiết qua ISR trong Next 16.4.2: chưa kiểm runtime, cần E2E "tới giờ → hiện trong ≤ 60s".
- Không chạy verify command (pre-plan, chưa có code đổi).
