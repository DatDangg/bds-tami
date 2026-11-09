Agent: reviewer

# Review — bug-ci-integration-tests-stale · phase-1-task-01 · round 1

- Review level: FAST
- Reason: diff chỉ đụng 3 file test integration, không đụng `src/`/shared/API/schema; mục tiêu là đồng bộ test với hành vi đã được duyệt ở BL-110 (75e1eb69) và sửa fixture thiếu `siteName` (BL-109).
- Blast radius: chỉ test suite (`tests/integration/rental-search.test.ts`, `tests/integration/rentals.test.ts`, `tests/integration/site-settings-social-links.test.ts`) và CI xanh/đỏ. Runtime không bị ảnh hưởng.

## Verify commands + result
- `pnpm test tests/integration/rental-search.test.ts tests/integration/rentals.test.ts tests/integration/site-settings-social-links.test.ts` (env lấy từ `.env.local`: DATABASE_URL_TEST + REDIS_URL): **3 files passed, 94/94 tests passed** (12.5s). Có log `revalidatePath ... static generation store missing`, đây là noise có sẵn từ hook revalidate chạy ngoài Next, không làm test fail.
- `pnpm typecheck`: PASS (tsc --noEmit sạch).
- `pnpm lint`: PASS (eslint sạch).

## Kiểm theo yêu cầu
1. **Test khẳng định đúng BL-110 và không mất coverage**
   - `rental-search.test.ts:246-253`: trước đây `q:"quan 1"` ra 5 kết quả nhờ tên cũ; giờ assert `[]` (chứng minh tên cũ đã bị loại khỏi searchText), và thêm `q:"phuong sai gon"` (tên phường hiện hành, nhiều từ) ra đủ 5. Vẫn giữ mã tin, từ trong địa chỉ (`bi mat`) và trường hợp không có kết quả. Đây không phải hạ assert mà là đổi sang khẳng định đúng hành vi mới.
   - `rental-search.test.ts:542-558`: đặt `search_text='cu'` rồi đổi legacyNames → searchText vẫn `cu` (khẳng định đổi tên cũ KHÔNG reindex, khớp `wardSearchSource` chỉ so `name`); tin b không chứa `ben thanh`; tìm `ben thanh` total 0. Sau đó trả lại dữ liệu cho các test sau và gọi `reindexRentalSearchText` để dựng lại, có assert. Không làm hỏng test tiếp theo (đổi tên tỉnh, reindex idempotent vẫn pass).
   - `rentals.test.ts:380-413`: vẫn giữ đủ fragment mã/tiêu đề/địa chỉ/phường/tỉnh/dự án, thêm `not.toContain("ben nghe"|"ben thanh")`; vẫn kiểm chữ thường và không dấu.
   - `rentals.test.ts:415-427`: tìm tên cũ → searchText không chứa và `contains` query không ra tin.
   - `rentals.test.ts:444`: assert bản en chứa tên phường hiện hành `phuong sai gon` thay cho tên cũ, nên vẫn kiểm vi→en đồng bộ phần phường.
   - Coverage reindex dựng lại vẫn còn (`rental-search.test.ts:584-597` không đổi, cộng thêm reindex trong test 542).
2. **Không đụng `src/`**: `git diff` của task chỉ có 3 file test. `src/` có file dirty khác trong working tree nhưng không thuộc task (lead-assign, jobs, …), và không liên quan searchText/site-settings.
3. **Social links (BL-109)**: `save()` giờ gửi `siteName` (required), nên test "nhiều dòng 'Khác' khác link -> lưu được" (`:91-97`) thực sự đi qua validate socialLinks và assert lưu 2 dòng. Các test chặn lỗi vẫn `toContain` đúng thông điệp riêng, nay chính xác hơn vì không bị lẫn lỗi siteName.

## Responsive Checklist Gate
N/A — diff không đụng UI.

## Skill gates
- aislop: skip, diff chỉ là test và đổi assert; không có code sản phẩm mới.
- oxlint (anti-slop): skip, oxlint not configured (repo dùng eslint, `pnpm lint` PASS).
- ocr (open-code-review): skip, ocr not installed.
- AI-readable: OK — tên test mô tả hành vi + mã BL, comment giải thích WHY (khôi phục dữ liệu cho test sau; siteName bắt buộc). 0 indicator mới.
- ai-friendly-web: N/A (không public-facing).
- blitzstrike: N/A (không phải STRICT/nhạy cảm).

## Findings
- [MINOR] `tests/integration/rental-search.test.ts:246` — tên test vẫn ghi "nhiều từ là AND", trong khi BL-103 (`:255`) đã đổi ≥ 2 từ thành khớp cụm. Có từ trước diff, chỉ gây hiểu nhầm. Đề xuất đổi thành "nhiều từ khớp cụm" khi tiện.
- [MINOR] `tests/integration/rental-search.test.ts:578` — tên test "không đổi tên/tên cũ của phường thì không ghi lại" còn nhắc "tên cũ", nay thừa vì tên cũ không bao giờ reindex. Ngoài diff; đề xuất chỉnh tên khi tiện.
- [MINOR] Residual từ BL-110 vẫn chưa có integration test `q="ba dinh"` cho tin phường Hồng Hà (unit test `build-search-text.test.ts` đã phủ). Ngoài scope task này.

Không có CRITICAL/MAJOR.

## Residual risk
- Integration chạy trên working tree có các file `src/` dirty ngoài task; kết quả CI thật phụ thuộc vào commit chỉ gồm 3 file test. Các file dirty đó không đụng searchText/site-settings nên rủi ro thấp; xác nhận cuối cùng là CI xanh sau push.

## Verdict
✅ PASS
