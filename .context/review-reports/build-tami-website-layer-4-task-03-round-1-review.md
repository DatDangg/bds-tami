Agent: reviewer

# Review: build/tami-website, layer-4-task-03, round 1

- Task: `tasks/tami-website/layer-4-task-03.md` (lớp truy vấn công khai dùng chung + chính sách cache)
- Diff: working tree so với HEAD `fcf5b30` (tracked + untracked)
- Review level: **STRICT**
- Reason: data access dùng chung cho mọi trang công khai (`publicWhere` / `findPublicList` / `findPublicBySlug`), chính sách Cache-Control/CDN (`next.config.ts`, route catch-all REST, ảnh media), lọc bản EN, field nội bộ. Đều thuộc nhóm rủi ro đỏ (shared service, security/file access, cache key).
- Blast radius: mọi trang công khai tương lai (layer 5–9, 16 dùng `public-queries.ts`); toàn bộ response `/api/*` qua `src/app/(payload)/api/[...slug]/route.ts` (REST Payload, login/Set-Cookie, upload, file media, private-files); header HTML mọi path qua `next.config.ts`; ảnh `/api/media/file/*` qua `Media.upload.modifyResponseHeaders` (CDN giữ 1 năm); dependency `server-only`; fixture test collection.

## Verify commands + result (reviewer tự chạy)

| Lệnh | Kết quả |
|---|---|
| `pnpm install --frozen-lockfile` | OK |
| `pnpm lint` | OK, 0 lỗi |
| `pnpm typecheck` | OK, 0 lỗi |
| `pnpm test` | 73 file / 762 test PASS (integration có DB chạy thật, không bị skip) |
| `pnpm build` | OK (`/vi`, `/en` SSG; `/_not-found` static) |
| `next start -p 3077` đo header (đã dừng process sau khi đo) | xem bảng bên dưới |

Header đo thật:

| Request | Status | Cache-Control |
|---|---|---|
| `GET /`, `GET /en`, `HEAD /` có Cookie `NEXT_LOCALE`/`payload-token` | 200 | `public, s-maxage=60, stale-while-revalidate=300`, không có Set-Cookie |
| `GET /vi` | 301 | `public, s-maxage=60, stale-while-revalidate=300` (chấp nhận được) |
| `GET /admin` | 200 | `no-store` |
| `GET /api/staff` (khách) | 403 | `no-store` |
| `GET /api/media` | 200 | `no-store` |
| `GET /api/media/file/khong-co.jpg` | 404 | `no-store` |
| `GET /api/private-files/file/x.pdf` | 403 | `no-store` |
| `POST /api/staff/login` (sai mật khẩu) | 401 | `no-store` |
| `OPTIONS /api/media` | 200 | `no-store` |
| `GET /khong-ton-tai`, `/en/khong-ton-tai` | 404 | `private, no-cache, no-store, max-age=0, must-revalidate` |
| **`GET /robots.txt`** | **404** | **`s-maxage=31536000`**, xem MAJOR-1 |

## Kiểm theo câu hỏi của primary

**Ảnh immutable**
- `private-files`: dùng `disablePayloadAccessControl: true`, không có `modifyResponseHeaders`. Đo thật thì 403 kèm `no-store`. Header ảnh không áp cho CV. OK.
- Lỗi/không có quyền/404 của media: trong `getFile.js` của storage-s3, `modifyResponseHeaders` chỉ chạy ở nhánh 200/206/304. Nhánh 404/500 trả `new Response` không có header, và `checkFileAccess` trả về sớm, nên `withDefaultNoStore` gắn `no-store`. Đo thật thì 404 trả `no-store`. OK.
- Mọi size ảnh: các biến thể size dùng chung endpoint `/api/media/file/<filename>` và cùng handler nên đều được đặt header. OK.
- Media bị xoá: `Media` không bật trash. Khi xoá cứng, CDN vẫn giữ tối đa 1 năm. ARCHITECTURE G1 chấp nhận vì tên file bất biến. Còn thiếu quy trình purge Cloudflare khi phải gỡ gấp một ảnh, ghi ở Residual risk.
- `Media.access.read = () => true`, nên cache public không làm lộ ảnh cần quyền. OK.

**Cache trang công khai**
- Chưa có trang nào dùng `cookies()`, `headers()` hay `draftMode`. Proxy không đặt cookie. Đo với Cookie gửi lên vẫn không có Set-Cookie. OK.
- Pattern loại đúng `/api`, `/admin`, `/_next`, `/_vercel` và path có dấu chấm. Unit test biên dịch bằng path-to-regexp của Next nên kết quả đáng tin. OK.
- 404 của trang thường được Next đặt `private, no-store`. Riêng 404 của path có dấu chấm thì bị cache public 1 năm, xem MAJOR-1.
- Preview/draft mode và form có server action chưa tồn tại, ghi ở Residual risk.

**`withDefaultNoStore`**: bọc đủ 6 method GET/POST/DELETE/PATCH/PUT/OPTIONS. `health`/`metrics`/`monitoring-config` tự đặt header (builder đã đo, reviewer đo lại `/api/*` qua catch-all). Login 401 trả `no-store`. Set-Cookie được giữ nguyên vì header được copy sang `Headers` mới. OK.

**`publicWhere`**: lấy từ `buildPublicWhere` (cùng nguồn với `access.read` của khách). Rentals thêm `rented` theo `PUBLIC_STATUSES.rentals`. EN thêm `hasEnglish`. Truy vấn chạy với `overrideAccess:false`, `fallbackLocale:false`, `trash:false` và không truyền user. `where` của caller được AND nên không nới được. Integration đã có test: lọc theo `internalNote` không dò ra dữ liệu, depth 2 không populate staff, field nội bộ bị ẩn. Doc liên quan ở collection khác khi populate cũng đi qua `access.read` của khách nên draft bị chặn. OK.

## Findings

### [MAJOR-1] 404 của path có dấu chấm bị CDN cache public 1 năm (`s-maxage=31536000`)
- Vị trí: `src/lib/http/cache-policy.ts:24` (`PUBLIC_PAGE_SOURCE` loại `.*[.].*`) kết hợp `src/lib/http/cache-policy.ts:31-36` (không có rule nào cho nhóm path này).
- Bằng chứng: `next start` cho `GET /robots.txt` trả 404 kèm `Cache-Control: s-maxage=31536000`. Đây là mặc định của Next cho `/_not-found` static. Cloudflare mặc định cache theo đuôi file (`.txt`, `.xml`, `.ico`, `.jpg`…) và tôn trọng `s-maxage`.
- Hậu quả: nếu crawler hoặc khách gọi `/robots.txt`, `/sitemap.xml`, `/llms.txt` hay một ảnh `public/` gõ sai **trước** khi task SEO (layer sau) thêm các file đó, Cloudflare sẽ giữ bản 404 tới 1 năm. File thật deploy sau sẽ không hiện ra nếu không purge. Đây đúng là trường hợp "404 bị cache public" mà task này có trách nhiệm chặn, vì task đặt chính sách cache cho mọi response không phải `/api`/`/admin`. Cũng là gap so với ARCHITECTURE §5.1, vốn không có ngoại lệ "404 cache 1 năm".
- Lỗi này có từ trước diff, nhưng thuộc đúng phạm vi của task (chính sách cache) nên tính cho task này.
- Cách sửa đề xuất (chọn một, rồi **đo lại bằng `next start`**):
  1. Thêm rule `headers()` cho path có dấu chấm, ngoài `/_next` và `/api`: đặt TTL ngắn hoặc `no-store` cho response không phải file thật. Nếu rule config đè luôn header của file `public/` và route `robots`/`sitemap` sau này thì chọn giá trị chung an toàn (ví dụ `public, max-age=0, s-maxage=60`) và ghi vào `cache-policy.ts`.
  2. Hoặc làm 404 toàn cục không còn static với TTL 1 năm (not-found dynamic hoặc global not-found có header no-store), sao cho mọi 404 đều `private/no-store`.
  - Thêm assertion header 404 của path có dấu chấm vào bước đo của task, và ghi As-built vào ARCHITECTURE §5.1.

### [MINOR-1] Doc populate theo depth không lọc `hasEnglish`
- `src/lib/content/public-queries.ts:24-33`: ở `/en`, doc liên quan (ví dụ dự án liên quan) chỉ được lọc theo access (status/xoá mềm), không theo `hasEnglish`. Chữ Việt không lộ ra vì `fallbackLocale:false`, nhưng trang có thể render link tới bản EN đang 404 hoặc thẻ có tiêu đề rỗng.
- Đề xuất: ghi vào JSDoc rằng trang EN phải bỏ doc liên quan có `hasEnglish !== true`, hoặc thêm helper lọc. Có thể xử lý ở task trang.

### [MINOR-2] Tham số `collection: string` không có kiểu
- `src/lib/content/public-queries.ts:16,57,97`: gõ sai slug hoặc truyền collection không có `status` (ví dụ `media`) chỉ lộ ra lúc runtime (lỗi query).
- Đề xuất: thu hẹp kiểu về union các collection công khai khi các collection thật đã có (không chặn PASS).

## Skill gates

| Gate | Kết quả |
|---|---|
| aislop | skip, aislop not installed |
| oxlint (anti-slop) | skip, oxlint not configured (eslint `pnpm lint` 0 lỗi) |
| ocr (open-code-review) | skip, ocr not installed |
| AI-readable | OK: file ≤ 111 dòng, hàm ≤ 30 dòng, tên rõ, hằng số có tên (`MAX_PAGE`, `MAX_PAGE_SIZE`…), comment ghi lý do (WHY), ARCHITECTURE §5.1 đã thêm As-built. 0 indicator |
| ai-friendly-web | N/A: task hạ tầng truy vấn/cache, không tạo trang. Lưu ý: MAJOR-1 ảnh hưởng `robots.txt`/`sitemap.xml`/`llms.txt` của task SEO sau |
| blitzstrike | skip, chưa cài/không có môi trường pentest |

## Responsive Checklist Gate
N/A: diff không đụng UI (route/component/CSS). Chỉ có header HTTP và lớp truy vấn.

## Surgical diff
Mọi thay đổi đều trace về task: AC1 `server-only`, AC2–3 public-queries, AC4–5 cache-policy/next.config/route/Media; fixture và test phục vụ test bắt buộc. Không có refactor ngoài lề.

## Residual risk
- Chưa có trang DB thật dùng `findPublicList`. Preview/draft mode chưa có: khi thêm thì phải đo lại vì header ở `next.config` có thể đè header mặc định của Next.
- Server action POST tới path trang sẽ nhận header `public, s-maxage=60`. Cloudflare/Nginx không cache POST nên rủi ro thấp; cần kiểm lại khi làm form.
- Nếu handler REST ném lỗi ra ngoài (không trả Response) thì không đi qua `withDefaultNoStore`. Payload tự bắt lỗi nên rủi ro thấp.
- Ảnh media đã xoá còn trên CDN tới 1 năm: cần quy trình purge Cloudflare (layer-6-task-01).
- Rule cache HTML của Cloudflare (nếu bật "cache everything") phải xét `Vary: rsc…`. Next đã thêm `_rsc=<hash>` vào URL nên rủi ro thấp; kiểm lại ở layer-6.
- `/api/media/file/<ảnh thật>` 200/304 immutable: reviewer xác minh qua integration test chạy thật (storage-s3 + DB, PASS), không đo lại bằng curl.

## Verdict
**FAIL**: còn 1 MAJOR (MAJOR-1: 404 của path có dấu chấm bị cache public `s-maxage=31536000`). Sửa xong thì review round 2. Hai MINOR không chặn PASS.
