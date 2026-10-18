Agent: reviewer

# Review: build/tami-website · layer-8-task-01 (global `homepage`) · round 2

- **Review level:** STRICT
- **Reason:** vẫn là task có migration schema mới, quyền ghi chỉ cho admin, validator upload video và collection dùng chung `services`. Round này còn thêm hook `beforeDelete` vào collection dùng chung `media` (mọi màn có upload đều đi qua), và validator đọc DB ngoài transaction.
- **Blast radius:** như round 1, cộng thêm `src/collections/Media.ts` và `src/hooks/media/guard-delete.ts` (mọi lần xoá media qua REST, Local API hay bulk delete của mọi role). `validateCtaTitle` chạy ở mỗi lần lưu `homepage` bằng locale `en`. Code ngoài diff không bị đổi.

## Verify commands + result

| Lệnh | Kết quả |
|---|---|
| `pnpm lint` | PASS (exit 0) |
| `pnpm typecheck` | PASS (exit 0) |
| `pnpm test` | PASS: 157 file, 1.715 test (exit 0, DB dev không lỗi kết nối) |
| `pnpm build` | PASS (exit 0) |

## Responsive Checklist Gate

N/A. Diff không đụng route, component hay CSS công khai; chỉ có cấu hình global, hook, migration và seed.

## Skill gates

- aislop: skip, chưa cài `aislop`
- oxlint (anti-slop): skip, chưa cấu hình oxlint; ESLint PASS
- ocr: skip, chưa cài `ocr`
- AI-readable: OK. `Homepage.ts` 209 dòng, `guard-delete.ts` 23 dòng, test 299 dòng (sát ngưỡng 300). Hàm đều ≤ 50 dòng, comment giải thích WHY. Thiếu cập nhật ERD (MINOR-B), mới 1 indicator nên chưa tới ngưỡng FAIL.
- ai-friendly-web: N/A (không phải bề mặt web công khai)
- blitzstrike: skip, chưa cài / không có môi trường pentest được phép

## Đối chiếu các lỗi round 1

| Round 1 | Trạng thái | Bằng chứng |
|---|---|---|
| MAJOR-1: bật ctaBanner từ bản en khi title vi rỗng | **Đã đóng** | `Homepage.ts:57-63`: locale ≠ vi và `enabled` thì đọc title vi đã lưu (`fallbackLocale: false`); rỗng hoặc chỉ khoảng trắng (`isFilled`) trả 400. Test hồi quy `homepage.test.ts:199-205` phủ cả nhánh chặn lẫn nhánh cho phép. Lưu một phần ở bản vi (`{ctaBanner:{enabled:true}}`, dòng 191) vẫn ra 400 vì `siblingData` đã gộp với dữ liệu gốc. |
| MINOR-1: xoá media đang dùng ra 500 | Đã đóng (còn MINOR-A, MINOR-C) | `guard-delete.ts` + `Media.ts:42`, test `homepage.test.ts:238-251` |
| MINOR-2: validator video ở `onChange` / NotFound | Đã đóng | `Homepage.ts:29` return sớm; `find` + `limit 1` rồi trả chuỗi lỗi (dòng 34-43); test id không tồn tại → 400 (dòng 180) |
| MINOR-3: test xoá hẳn dịch vụ | Đã đóng | `homepage.test.ts:286-297` (dịch vụ nháp không làm mới; dịch vụ công khai làm mới tag và `/vi`, `/en`) |
| MINOR-4: seed lấy cả bản xoá mềm | Đã đóng | `seed/sample/homepage.ts:81` thêm `deletedAt: { exists: false }` |

## Đánh giá kỹ `validateCtaTitle` (không truyền `req`)

- **Lý do của Builder là đúng.** Ở `payload@3.91.0`, `dist/utilities/createLocalReq.js:71,77` gán thẳng `req.locale` và `req.fallbackLocale` lên `req` được truyền vào. Nếu truyền `req` của lệnh lưu en đang chạy thì locale của lệnh đó bị đổi thành `vi`, dữ liệu en sẽ bị ghi vào bản vi.
- **Có tự đọc thấy dữ liệu chưa commit của chính request không?** Không. Bản en không sửa được title vi, nên title vi cần kiểm chắc chắn đến từ một request trước đó đã commit. Đọc ngoài transaction vẫn đúng. Một request cũng không lưu được "vi rỗng + bật en" cùng lúc, vì mỗi lệnh `updateGlobal` chỉ có một locale. Lưu bằng locale `vi` thì đi nhánh kiểm `value` trực tiếp.
- **Có deadlock / chặn khoá không?** Không. Validate chạy trước bước ghi DB, và lệnh SELECT của Postgres (MVCC) không chờ khoá dòng. Lệnh đọc này dùng thêm 1 connection trong pool trong lúc transaction đang mở; rủi ro không đáng kể.
- **Kẽ hở còn lại:** race giữa hai admin đồng thời (MINOR-D). Có cách giữ được transaction mà không đổi locale (xem MINOR-D).

## Đánh giá kỹ guard xoá media

- **Có chặn nhầm không?** Không. Guard chỉ so `id` với `hero.slides[].image/video`, `about.image` và `ctaBanner.backgroundImage` (đọc ở depth 0 nên đều là chuỗi uuid). Ảnh OG của SEO không bị chặn, khớp mô tả. Media không được dùng thì xoá bình thường (có test). Các trường này không localized nên chỉ cần đọc bản `vi`.
- **Global chưa có?** Config không nạp `homepage` thì return sớm. Có nạp mà DB chưa có dòng thì `findGlobal` trả object rỗng, `?? []` / `?.` không ném lỗi. Test seed có chạy qua trường hợp này.
- **Bulk delete:** ở `dist/collections/operations/delete.js:107-116`, hook `beforeDelete` chạy cho từng doc và chạy **trước** `deleteAssociatedFiles`. Media bị chặn nên vẫn giữ file; lỗi được gom theo từng doc.
- **Trash:** `Media` không bật trash/xoá mềm (grep không thấy `trash`/`deletedAt`), nên không có đường lách qua xoá mềm.

## Findings

### [MINOR-A] `guard-delete.ts` truyền `req` vào `findGlobal({ locale: "vi", fallbackLocale: false })`, làm đổi locale của chính request xoá
- `src/hooks/media/guard-delete.ts:11`: đây đúng là hiệu ứng mà comment trong `Homepage.ts:54` muốn tránh. Ví dụ `DELETE /api/media/:id?locale=en` (hoặc bulk delete) xoá một media không dùng: sau hook, `req.locale` thành `vi` và `fallbackLocale` thành `false`. Response và các hook `afterDelete`/`afterRead` sau đó trả `alt` (localized) theo bản vi, không phải en. Dữ liệu không hỏng, chỉ sai locale trong response.
- **Fix:** dùng `req.payload.db.findGlobal({ slug: "homepage", locale: "vi", req })` (adapter không đi qua `createLocalReq`, vẫn ở trong transaction). Cách khác: lưu `req.locale`/`req.fallbackLocale` trước khi gọi rồi khôi phục trong `finally`.

### [MINOR-B] Doc impact chưa reconcile (ERD)
- `docs/ERD.md` (đoạn As-built L8-T01, dòng ~554) có hai chỗ cần sửa:
  1. Thiếu ghi chú chặn xoá: "xoá media đang là ảnh/video slide hero, `about.image`, `ctaBanner.backgroundImage` → 409 (`src/hooks/media/guard-delete.ts`; `homepage_hero_slides.image_id` NOT NULL + FK `ON DELETE SET NULL`); ảnh OG SEO không chặn (FK tự set null)". Nên thêm cả ở mục `media` §4.12, cùng kiểu với provinces/wards/categories ở dòng 163/187.
  2. Câu "`ctaBanner.title` bắt buộc khi `enabled` chỉ ở bản `vi`…" đã cũ. Cần ghi thêm: bật `enabled` từ bản en mà title vi rỗng thì cũng ra 400.
- Phải sửa trong close-out trước khi commit (Doc Impact & Reconcile).

### [MINOR-C] Test guard chỉ phủ `slide.image`
- `tests/integration/homepage.test.ts:238-251` chưa có case cho `slide.video`, `about.image`, `ctaBanner.backgroundImage`, bulk delete (`where`), và ảnh OG xoá được. Logic đơn giản nên rủi ro thấp. Nên thêm 1 test dạng `it.each`; file test đang 299 dòng nên có thể tách sang file riêng.

### [MINOR-D] Race giữa hai admin đồng thời ở `validateCtaTitle`
- Admin A lưu bản vi `{enabled:false, title:""}`, cùng lúc admin B lưu bản en `{enabled:true}`. B đọc title vi cũ (chưa rỗng) nên qua validate. Sau khi cả hai commit, DB còn `enabled=true` mà title vi rỗng. Cửa sổ race rất hẹp, chỉ xảy ra với admin, và đọc trong transaction ở mức READ COMMITTED cũng không chặn được hoàn toàn. Không chặn PASS.
- **Hướng khắc phục (tuỳ chọn):** dùng `req.payload.db.findGlobal({ slug: "homepage", locale: "vi", req })` để đọc trong transaction mà không đổi `req.locale`. Phía hiển thị (layer 9) vẫn nên ẩn banner khi title rỗng, làm lớp phòng thủ thứ hai.

## Residual risk

- Snapshot migration: giống round 1 (chưa dò drift bằng `migrate:create`). Migration không đổi ở round này.
- MINOR-A và MINOR-D mới được xác nhận bằng cách đọc mã nguồn Payload (`createLocalReq.js:71,77`), chưa có test chạy thật.
- AC FR-ADM-16 (`publishedAt ≤ now`) vẫn chưa implement; giữ ghi chú ở task FR-ADM-16 như round 1.

## Verdict

**PASS.** Không còn CRITICAL hay MAJOR, và MAJOR-1 đã có test hồi quy. Bốn MINOR không chặn PASS. Riêng **MINOR-B (ERD) phải sửa trong close-out trước khi commit**. MINOR-A nên sửa luôn vì chỉ cần đổi 1 dòng; nếu không thì tách task.
