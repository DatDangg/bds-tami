Agent: reviewer

# Review: feature-news-careers-contact-redesign, phase-1-task-03, round 1 (Đếm lượt xem bài + loader "Đọc nhiều")

- Worktree: `D:\prj\bds\.worktrees\feature-news-careers-contact-redesign__phase-1__task-03` (chưa commit, base staging f7936d4)
- Review level: **STRICT**
- Reason: endpoint công khai không cần đăng nhập (spam, đếm giả), dữ liệu cá nhân (IP/UA), SQL thô qua drizzle, hook mới trên collection `news` dùng chung, cache ISR.
- Blast radius: `POST /api/public/news-views` (mới, đăng ký trong `src/payload.config.ts`), `RATE_LIMITS["news-views"]`, bảng `news_views_daily` (ghi), Redis (khoá `nv:*` và `rl:news-views:*`), hook `afterChange`/`afterDelete` của `news` (thêm `revalidate-most-read`, ảnh hưởng mọi lần lưu bài), `loadMostReadNews` (chưa có trang nào dùng, P2-T02 sẽ gắn), `NewsViewBeacon` (chưa gắn trang), `docs/API_SPEC.md` §3.12.

## Verify commands + result

| Lệnh | Kết quả |
|---|---|
| `docker exec tami-postgres psql ... "select 1"` | `1`, DB sẵn sàng |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm lint` | PASS: 0 error, 2 warning cũ ở `tools/task-dashboard/server.mjs`, không thuộc task |
| `pnpm vitest run src/endpoints/public/news-views.test.ts src/lib/news src/components/news src/hooks/news` | PASS: 10 file, 126/126 |
| `DATABASE_URL_TEST=<DB worktree tami_wt54_p1t03> pnpm vitest run tests/integration/news-views.test.ts --hookTimeout 120000` | PASS: 12/12. Test gọi qua `handleEndpoints` thật của Payload, chạy migration thật, Redis thật |
| `pnpm build` / full `pnpm test` | không chạy lại (theo chỉ dẫn: chỉ chạy file liên quan, tuần tự, vì Postgres vừa phải crash-recovery). Builder báo PASS / lỗi không liên quan: xem Residual risk |

Lưu ý: `.env.local` của worktree đặt `DATABASE_URL_TEST` trỏ vào DB `tami`. Reviewer đã ghi đè bằng URL DB worktree. Test chỉ tạo rồi DROP một DB tạm con nên không đụng dữ liệu, nhưng primary nên để ý điều này.

## Kiểm trọng tâm (bằng chứng)

- **Không lưu/log IP/UA thô: OK.** Pipeline chỉ đưa ra `ipHash` = `HMAC-SHA256(PAYLOAD_SECRET, "ip-hash:v1:"+ip)` (`src/lib/security/ip-hash.ts:38-43`). Đây là hash có khoá chứ không phải hash trần không salt, nên không dò ngược bằng bảng IPv4 được. Khoá chống trùng lại băm HMAC thêm một lần, có tiền tố mục đích riêng (`view-dedupe.ts:54-62`). Log khi Redis lỗi chỉ có `reason` = tên lỗi (`news-views.ts:98-99`). Bảng chỉ có `news_id/day/views` (đã có integration test).
- **Upsert nguyên tử, không SQL injection: OK.** Upsert là một câu `INSERT … ON CONFLICT (news_id, day) DO UPDATE SET views = news_views_daily.views + 1` (`news-views.ts:125-129`). Mọi giá trị đi qua placeholder của drizzle `sql```; trong `rankNewsByViews`, statuses dùng `sql.join` có tham số và `limit` cũng là tham số (`most-read.ts:38-49`). Có test 50 upsert song song cho ra đúng 50, một dòng.
- **Lọc bot/prefetch: OK.** UA rỗng thì không đếm. Regex có test cho cả trường hợp người thật (Zalo, Messenger, Cubot). Có kiểm `Sec-Purpose`/`Purpose`/`X-Moz`. Beacon không gửi khi `navigator.webdriver`.
- **Chỉ đếm bài published, chưa xoá mềm; EN: OK.** `isPublicNews` đọc qua `findPublicList` như khách. Loader lọc sơ bộ trong SQL, sau đó đọc lại qua `findPublicList(locale)` nên `/en` chỉ còn bài có `hasEnglish`.
- **Endpoint không lộ lý do: OK.** Mọi nhánh bỏ qua đều trả cùng một `204` rỗng. Khi Redis lỗi thì trả 503, không cộng lượt (giống pipeline, spec-validation F1).
- **Thứ tự xử lý: OK.** Rate limit chạy trước, sau đó mới đọc/parse body (`public-pipeline.ts:57-92`). Body bị giới hạn 500 ký tự trước `JSON.parse`. UA bị cắt 512 ký tự trước khi băm.
- **Hook revalidate không làm vỡ thao tác lưu bài: OK.** `revalidateTagsWithNext` tự bắt lỗi, chỉ ghi warn (`revalidate-global.ts:13-20`). Hook chỉ chạy khi bài đang hoặc vừa công khai, việc làm là đồng bộ và rẻ (`revalidateTag`).
- **Beacon gửi đúng 1 lần, không chặn render: OK.** Code chạy trong `useEffect`, có cờ `sent`, tháo listener sau khi gửi, dọn timer khi unmount, mọi lỗi đều bị nuốt. Component render `null`.
- **Ngày giờ VN: OK.** `vietnamDayStart` dùng UTC+7 cố định (VN không có giờ mùa hè). TTL của khoá chống trùng tính tới hết 24:00 giờ VN, tối thiểu 1 giây.

## Responsive Checklist Gate

**N/A.** Diff không có UI hiển thị: `NewsViewBeacon` render `null` và chưa gắn vào trang (P2-T02 sẽ gắn). Không có CSS, route hay layout nào thay đổi.

## Skill gates

| Gate | Kết quả | Bằng chứng |
|---|---|---|
| aislop | skip, aislop not installed | `command -v aislop` không tìm thấy |
| oxlint (anti-slop) | skip, oxlint not configured | không có `.oxlintrc.json`/`oxlint.json`. ESLint (`pnpm lint`) 0 error |
| ocr (open-code-review) | skip, ocr not installed | `command -v ocr` không tìm thấy |
| AI-readable | OK (0 indicator) | Mọi file dưới 300 dòng (lớn nhất 293 là file test). Hàm dài nhất `handleNewsView` khoảng 40 dòng. Hằng số đều có tên (`MAX_BODY_CHARS`, `MOST_READ_CACHE_SECONDS`…). Comment giải thích WHY. `API_SPEC.md` §3.12 đã cập nhật |
| ai-friendly-web | N/A | Không phải trang công khai mới, chỉ là endpoint ghi thống kê |
| blitzstrike | skip | Không có môi trường/MCP được phép. Đã soát security thủ công: rate limit, giới hạn kích thước body, zod uuid, SQL có tham số, không PII, fail closed |

## Findings

Không có CRITICAL. Không có MAJOR.

- **[MINOR-1]** `src/lib/news/most-read.ts:76,95-98`: chỗ bù bài chạy trước bước `toItem`. Khi `toNewsCardData` trả `null` (vd thiếu slug theo locale), kết quả có thể ít hơn `limit` dù vẫn còn bài để bù. Thêm nữa, `rankNewsByViews` chỉ lấy đúng `limit` id. Nếu sau này `findPublicList` có thêm điều kiện mà SQL không có (vd hẹn giờ `publishedAt ≤ now`, FR-ADM-16, xem `public-queries.ts:20`), bài bị loại sẽ được thay bằng bài featured chứ không phải bài hạng 6. Đề xuất: lọc `toItem` trước khi tính `docs.length`, hoặc lấy dư id (vd `limit * 2`). Khi thêm hẹn giờ thì nhớ đồng bộ điều kiện trong SQL xếp hạng.
- **[MINOR-2]** `src/endpoints/public/news-views.ts:95-104`: `SET NX` đã giữ chỗ trước, rồi mới `addView`. Nếu DB lỗi ở bước này, lượt đó mất cho người đó cả ngày, và request trả 500 thay vì 204 đồng nhất. Hệ quả là đếm thiếu, chấp nhận được vì không bao giờ đếm thừa. Nếu muốn chặt hơn: bắt lỗi `addView`/`isCountable`, gọi `redis.del(key)` rồi trả 503. Không bắt buộc.
- **[MINOR-3]** `.env.local` của worktree: `DATABASE_URL_TEST` trỏ vào DB `tami` chứ không phải DB worktree. Khác với Verification summary ("DATABASE_URL_TEST = DB worktree"). Integration test chỉ tạo/DROP DB con nên không hại dữ liệu, nhưng nên sửa cho đúng quy ước cô lập worktree. Không phải source, không chặn PASS.

## Residual risk

- Chưa chạy lại `pnpm build` và full `pnpm test`, theo chỉ dẫn vì Postgres vừa recovery. Builder báo build PASS, còn full test có 5 file fail. Theo mô tả thì nguyên do là timeout hoặc DB sập, không liên quan task: các file đó không import code của task, và khi builder chạy lại với hookTimeout cao thì PASS. Primary nên chạy `pnpm build` khi merge.
- Khi không xác định được IP (`UNKNOWN_CLIENT_IP`, proxy cấu hình sai), mọi khách dùng chung một bucket rate limit 30/phút, nên đếm thiếu nặng. Hành vi này có sẵn từ pipeline. Cần bảo đảm `TRUST_CF_CONNECTING_IP` đúng trên staging/prod.
- Bot giả UA trình duyệt vẫn được đếm. Giới hạn: 30 request/phút/IP và 1 lượt/người/bài/ngày.
- `loadMostReadNews` ném lỗi khi DB lỗi: P2-T02 bắt buộc phải bọc lại, ghi vào task P2-T02.

## Verdict

**PASS.** Không có CRITICAL/MAJOR. Typecheck, lint, unit (126) và integration (12) đều PASS khi reviewer tự chạy. Ba MINOR có thể xử lý trong task sau hoặc ghi nhận.
