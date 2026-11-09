Agent: reviewer

# Review — bug-search-area-still-fails · phase-1-task-01 · round 1 (BL-110)

- Task: `tasks/bug-search-area-still-fails/phase-1-task-01.md`
- Change doc: `spec/changes/2026-11-05-search-area-still-fails.md` (quyết định user 2026-11-05: bỏ hẳn `legacyNames` khỏi searchText)

## Review level
NORMAL

## Reason
Đổi nguồn dựng dữ liệu dẫn xuất `rentals.searchText` (hàm `buildForLocale` dùng chung cho hook lưu tin, `refreshOtherLocaleSearchText`, reindex lib/job/script) và trigger hook `afterChange` của wards. Không đụng schema/migration, auth, API shape, không bulk update trong task (reindex dữ liệu thật để làm bước vận hành sau deploy). Diff nhỏ, có test hồi quy → NORMAL đủ.

## Blast radius
- `src/hooks/rentals/build-search-text.ts` → `buildForLocale` dùng bởi: hook `beforeChange` của rentals, `refreshOtherLocaleSearchText`, `src/lib/search/reindex-rental-search-text.ts` (dòng 3, 75) → script `scripts/reindex-rental-search-text.ts` + job nền `reindex-rentals-search`.
- `src/hooks/wards/reindex-rentals.ts` → afterChange của collection `wards` (đổi `legacyNames` không còn reindex).
- `src/collections/Wards.ts` → chỉ comment + `admin.description` (UI text admin, không sinh migration).
- Dữ liệu: `rentals_locales.search_text` của tin hiện có chỉ đúng sau khi chạy reindex.
- Hành vi người dùng: gõ tên phường/quận cũ không còn ra tin (đã được user chốt).

## Verify commands + result
| Lệnh | Kết quả |
|---|---|
| `pnpm vitest run src/hooks/rentals src/hooks/wards src/lib/search` | PASS — 9 files / 101 tests |
| `pnpm typecheck` (`tsc --noEmit`) | PASS — không lỗi |
| `pnpm exec eslint <5 file đổi>` | PASS — không output lỗi |

Đã kiểm thêm:
- Grep `legacyNames|legacy_names` trong `src`: chỉ còn `payload-types.ts` (generated, đúng là không đụng), `Wards.ts` (định nghĩa field), comment ở 2 file đã sửa, và test. Không còn chỗ nào ghép tên cũ vào text tìm kiếm.
- `scripts/`: `seed-scraped.ts:155` và `build-admin-units.mjs` dùng `legacyNames` để khớp phường khi seed/import, không dùng cho search → đúng là để nguyên theo task.
- Script reindex → `src/lib/search/reindex-rental-search-text.ts:75` gọi `buildForLocale`; `refreshOtherLocaleSearchText` cũng trong cùng file dùng `buildForLocale` → chỉ có một chỗ dựng logic, không còn bản sao cũ.
- Hook phường: `wardSearchSource = JSON.stringify(ward.name)` → đổi `name` thì reindex (test dòng 21-25), chỉ đổi `legacyNames` thì không (test mới dòng 28-32, gồm cả xoá hết và thêm tên cũ có "Quận Ba Đình").
- Schema: diff `Wards.ts` chỉ đổi comment/`admin.description`; field `legacyNames` giữ nguyên → không có migration (description là admin config, không vào DB).
- ERD: đúng 4 câu old→new ở Doc impact có trong `docs/ERD.md` dòng 202, 206, 789, 791. Các thay đổi ERD khác không thuộc task này nên không review.

## Bug repro closure
- Original repro: `/cho-thue?q=ba+đình` ra tin phường Hồng Hà vì tên cũ "Phường Phúc Xá, Quận Ba Đình" nằm trong searchText.
- Evidence: `build-search-text.test.ts` (Hồng Hà không chứa "ba dinh"/"phuc xa"; Ba Đình hiện hành vẫn chứa "ba dinh"; chỉ select `{ name: true }`). Đối chiếu code HEAD (`readWardNames` ghép `legacyNames`, select gồm `legacyNames`) thì cả 3 test đều phải fail trên HEAD, khớp với lời builder "fail trước / pass sau". Hai test phía hook phường cũng chứng minh đúng trigger.
- Status: PASS ở mức unit/logic dựng searchText. Query side đã dùng chung `normalizeSearchText` (BL-103) nên searchText không còn "ba dinh" thì `q=ba đình` không thể khớp qua tên cũ.

## Responsive Checklist Gate
N/A — diff không đụng route/component/CSS phía người dùng; chỉ có text `admin.description` của Payload.

## Skill gates
- aislop: skip — không nằm trong verify commands được phép của reviewer; diff nhỏ, đọc tay không thấy slop.
- oxlint (anti-slop): skip, oxlint not configured (repo dùng eslint, eslint các file đổi PASS).
- ocr (open-code-review): skip, ocr not installed / không nằm trong lệnh được phép.
- AI-readable: OK — tên rõ (`readWardName`, `wardSearchSource`), hàm ngắn, không magic number, comment giải thích WHY (BL-110) chứ không chỉ mô tả WHAT; ERD đã cập nhật theo luồng mới. 0 indicator.
- ai-friendly-web: N/A — không phải thay đổi public web surface.
- blitzstrike: N/A — task không phải STRICT, không đụng auth/input mới.

## Findings
- [MINOR] Reindex dữ liệu hiện có sau deploy mới chỉ được ghi ở Residual risk của task (`pnpm reindex:rentals-search` trên staging rồi prod). Nếu bước này bị quên thì trên prod bug vẫn còn y nguyên dù code đã fix (searchText chỉ dựng lại khi tin được lưu lại hoặc phường đổi tên). Đề xuất: change-request ghi bước này vào checklist deploy/close-out (BACKLOG BL-110 hoặc runbook) và chỉ đóng BL-110 hẳn khi đã chạy trên prod. Bản thân kế hoạch thì hợp lý: dùng script chính thức, script gọi chung `buildForLocale`, không tự chạy trên staging/prod.
- [MINOR] Acceptance #2 ("tìm `q=ba đình` … integration") mới chỉ được chứng minh gián tiếp qua unit test của `buildForLocale`, chưa có test integration/DB (builder đã ghi rõ). Chấp nhận được vì phía query không đổi. Có thể thêm integration test khi DB test sẵn sàng, không chặn.
- [MINOR] `src/hooks/rentals/build-search-text.test.ts:10` — `reqWithWard(ward: typeof hongHa)` không ảnh hưởng gì, chỉ nhắc: mock lọc field theo `select` nên test 1-2 vẫn PASS kể cả khi hàm bỏ `select` mà vẫn tự lọc `legacyNames`; test 3 đã chặn trường hợp này. Không cần sửa.

Không có CRITICAL/MAJOR.

## Residual risk
- Chưa chạy integration/DB dev; chưa reindex dữ liệu thật (đây là bước vận hành, ngoài quyền reviewer).
- Không tự xác minh trạng thái "fail trên HEAD" bằng cách chạy lại test trên HEAD (reviewer không được sửa/revert source); kết luận dựa trên đối chiếu diff.

## Verdict
PASS
